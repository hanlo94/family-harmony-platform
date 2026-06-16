import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 认证守卫
 *
 * 使用 JwtStrategy 验证请求中的 JWT Token。
 * 验证通过后，request.user 会被设置为 JwtStrategy.validate() 的返回值。
 *
 * @example
 * ```typescript
 * // 在控制器级别应用
 * @UseGuards(JwtAuthGuard)
 * @Controller('users')
 * export class UserController { ... }
 *
 * // 在方法级别应用
 * @UseGuards(JwtAuthGuard)
 * @Get('me')
 * async getProfile() { ... }
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
