import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

/**
 * 请求日志拦截器
 *
 * 记录每个 HTTP 请求的方法、URL、处理耗时和响应状态码。
 * 成功日志级别为 log，客户端错误为 warn，服务端错误为 error。
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const duration = Date.now() - startTime;

          if (statusCode >= 500) {
            this.logger.error(`${method} ${url} → ${statusCode} (${duration}ms)`);
          } else if (statusCode >= 400) {
            this.logger.warn(`${method} ${url} → ${statusCode} (${duration}ms)`);
          } else {
            this.logger.log(`${method} ${url} → ${statusCode} (${duration}ms)`);
          }
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error(`${method} ${url} → ERROR (${duration}ms) - ${error.message}`);
        },
      }),
    );
  }
}
