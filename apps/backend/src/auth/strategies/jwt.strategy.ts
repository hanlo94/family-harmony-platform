import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload, CurrentUserInfo } from '../types/auth.types';

/**
 * JWT 认证策略
 *
 * 使用 passport-jwt 从 Authorization: Bearer <token> 头中提取并验证 JWT。
 * 验证通过后，validate() 返回的用户对象会附加到 request.user 上。
 *
 * 被 JwtAuthGuard 调用。
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'fallback-secret',
    });
  }

  /**
   * Passport 验证回调
   *
   * JWT 签名验证通过后调用此方法。
   * 返回的对象会被附加到 request.user。
   *
   * @param payload JWT 解码后的 payload
   * @returns 附加到 request.user 的轻量用户信息
   */
  async validate(payload: JwtPayload): Promise<CurrentUserInfo> {
    return { id: payload.sub };
  }
}
