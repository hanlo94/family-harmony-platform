import { HttpException } from '@nestjs/common';
import { ErrorCode, ErrorCodeMessage, getHttpStatus } from '../constants/error-code';

/**
 * 业务异常类
 *
 * 用于在 Service 层抛出带错误码的业务异常，
 * 由全局异常过滤器 HttpExceptionFilter 统一捕获并格式化输出。
 *
 * @example
 * throw new BusinessException(ErrorCode.TASK_NOT_FOUND);
 * throw new BusinessException(ErrorCode.PERMISSION_DENIED, '仅组织者可修改家庭设置');
 */
export class BusinessException extends HttpException {
  /** 业务错误码 */
  public readonly errorCode: ErrorCode;

  /** 可选的错误详情 */
  public readonly detail?: string;

  constructor(errorCode: ErrorCode, detail?: string) {
    const message = ErrorCodeMessage[errorCode] || '未知错误';
    const httpStatus = getHttpStatus(errorCode);
    super(message, httpStatus);
    this.errorCode = errorCode;
    this.detail = detail;
  }
}
