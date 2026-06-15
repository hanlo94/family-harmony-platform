import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCode } from '../constants/error-code';

/**
 * 全局 HTTP 异常过滤器
 *
 * 统一捕获所有异常，按以下格式输出：
 *
 * 成功响应（由 TransformInterceptor 处理）:
 *   { code: 0, message: 'success', data: ... }
 *
 * 业务异常（BusinessException）:
 *   { code: <ErrorCode>, message: '<中文错误信息>', detail?: '<详情>' }
 *
 * 校验异常（BadRequestException）:
 *   { code: 40001, message: '<校验错误详情>' }
 *
 * 未知异常:
 *   { code: 50000, message: '服务器内部错误' }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 业务异常
    if (exception instanceof BusinessException) {
      const status = exception.getStatus();
      const errorResponse = {
        code: exception.errorCode,
        message: exception.message,
        detail: exception.detail,
      };

      this.logger.warn(
        `[${request.method}] ${request.url} → ${status} | ${exception.errorCode}: ${exception.message}`,
      );

      response.status(status).json(errorResponse);
      return;
    }

    // NestJS 内置 HTTP 异常
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // 校验异常：class-validator 的 BadRequestException
      if (status === HttpStatus.BAD_REQUEST && typeof exceptionResponse === 'object') {
        const res = exceptionResponse as { message?: string | string[] };
        const messages = Array.isArray(res.message) ? res.message : [res.message || '参数校验失败'];

        response.status(status).json({
          code: ErrorCode.VALIDATION_ERROR,
          message: messages.join('; '),
        });
        return;
      }

      // 其他 HTTP 异常（如 401 Guard 拒绝）
      response.status(status).json({
        code: this.statusToErrorCode(status),
        message: exception.message,
      });

      return;
    }

    // 未知异常
    this.logger.error(
      `[${request.method}] ${request.url} → 500 | Unexpected error`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: ErrorCode.INTERNAL_ERROR,
      message: '服务器内部错误',
    });
  }

  /**
   * 将 HTTP 状态码映射到业务错误码
   */
  private statusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case 400:
        return ErrorCode.VALIDATION_ERROR;
      case 401:
        return ErrorCode.UNAUTHORIZED;
      case 403:
        return ErrorCode.PERMISSION_DENIED;
      case 404:
        return ErrorCode.NOT_FOUND;
      case 409:
        return ErrorCode.CONFLICT;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
