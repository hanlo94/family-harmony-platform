import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ErrorCode } from '../constants/error-code';

/**
 * 统一响应格式包装拦截器
 *
 * 将所有成功响应自动包装为：
 *   { code: 0, message: 'success', data: <原始返回> }
 *
 * 如果 Controller 返回的 data 为 null 或 undefined，data 字段仍是 null。
 * 错误响应由 HttpExceptionFilter 处理，不经过此拦截器。
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        code: ErrorCode.SUCCESS,
        message: 'success',
        data,
      })),
    );
  }
}

/**
 * 统一 API 响应类型
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
