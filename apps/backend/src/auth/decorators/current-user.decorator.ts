import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CurrentUserInfo } from '../types/auth.types';

/**
 * 当前用户参数装饰器
 *
 * 从 JWT 认证后的 request.user 中提取当前登录用户信息。
 * 必须在 JwtAuthGuard 之后使用，否则 request.user 为 undefined。
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('me')
 * async getProfile(@CurrentUser() user: CurrentUserInfo) {
 *   return this.userService.findById(user.id);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserInfo => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as CurrentUserInfo;
  },
);
