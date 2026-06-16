import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/constants/error-code';
import { BusinessException } from '../common/exceptions/business.exception';
import type { JwtPayload, LoginResponse, RefreshResponse } from './types/auth.types';

/**
 * Auth 服务
 *
 * 负责：
 * - 微信 OAuth 登录（H5 公众号 + 小程序）
 * - JWT Token 签发与刷新
 * - 当前用户信息查询
 *
 * ## 开发模式
 * 当 code 以 "test_" 开头时，直接将其作为 openid 使用（不调用微信 API），
 * 便于本地开发和测试。seed 中预置了 3 个测试用户：
 *   - test_openid_user1 → 爸爸（ORGANIZER）
 *   - test_openid_user2 → 妈妈（MEMBER）
 *   - test_openid_user3 → 小明（CHILD）
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /** Access Token 有效期（秒） */
  private readonly ACCESS_TOKEN_EXPIRES_IN = 7200; // 2 小时

  /** Refresh Token 有效期（秒） */
  private readonly REFRESH_TOKEN_EXPIRES_IN = 604800; // 7 天

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ═══════════════════════════════════════════
  // 公开方法
  // ═══════════════════════════════════════════

  /**
   * 微信 H5 公众号登录
   *
   * 前端跳转微信 OAuth 获取 code → 后端用 code 换 openid → 签发 JWT
   */
  async wechatH5Login(code: string): Promise<LoginResponse> {
    const openid = await this.exchangeCodeForOpenid(code, 'h5');
    return this.loginByOpenid(openid);
  }

  /**
   * 微信小程序登录
   *
   * 前端调用 uni.login 获取 code → 后端用 code 换 openid → 签发 JWT
   */
  async wechatMpLogin(code: string): Promise<LoginResponse> {
    const openid = await this.exchangeCodeForOpenid(code, 'mp');
    return this.loginByOpenid(openid);
  }

  /**
   * 刷新 Access Token
   *
   * 使用 Refresh Token 签发新的 Access Token。
   * Refresh Token 本身也会被验证是否过期。
   */
  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const accessToken = await this.signAccessToken(payload.sub);

      return {
        accessToken,
        expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
      };
    } catch {
      throw new BusinessException(ErrorCode.INVALID_TOKEN, 'Refresh Token 无效或已过期，请重新登录');
    }
  }

  /**
   * 获取当前登录用户的完整信息
   *
   * 包含用户基本资料及其所属的家庭列表（含角色）。
   */
  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        familyMembers: {
          include: {
            family: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      families: user.familyMembers.map((m) => ({
        id: m.family.id,
        name: m.family.name,
        role: m.role,
      })),
    };
  }

  // ═══════════════════════════════════════════
  // 内部方法
  // ═══════════════════════════════════════════

  /**
   * 使用 openid 完成登录
   *
   * 查找已有用户或创建新用户，然后签发 JWT。
   */
  private async loginByOpenid(openid: string): Promise<LoginResponse> {
    // 查找或创建用户
    let user = await this.prisma.user.findUnique({
      where: { wechatOpenid: openid },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          wechatOpenid: openid,
          nickname: `用户${openid.slice(-6)}`,
        },
      });
      this.logger.log(`新用户注册: ${user.id} (openid: ${openid})`);
    }

    // 签发 Token
    const accessToken = await this.signAccessToken(user.id);
    const refreshToken = await this.signRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  /**
   * 用微信 code 换取 openid
   *
   * 支持两种渠道：H5 公众号 OAuth 和微信小程序 jscode2session。
   * 开发模式下（code 以 "test_" 开头），直接将 code 作为 openid 使用。
   */
  private async exchangeCodeForOpenid(
    code: string,
    platform: 'h5' | 'mp',
  ): Promise<string> {
    // ── 开发模式：test_ 前缀的 code 直接作为 openid ──
    if (code.startsWith('test_')) {
      this.logger.warn(`[开发模式] 使用测试 code 登录: ${code}`);
      return code;
    }

    const appId = this.configService.get<string>('WECHAT_APP_ID');
    const appSecret = this.configService.get<string>('WECHAT_APP_SECRET');

    try {
      if (platform === 'h5') {
        // 微信公众号 H5 OAuth
        // https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html
        const response = await axios.get(
          'https://api.weixin.qq.com/sns/oauth2/access_token',
          {
            params: {
              appid: appId,
              secret: appSecret,
              code,
              grant_type: 'authorization_code',
            },
          },
        );

        if (response.data.errcode) {
          this.logger.error(`微信 H5 OAuth 失败: ${JSON.stringify(response.data)}`);
          throw new BusinessException(
            ErrorCode.WECHAT_API_ERROR,
            `微信登录失败: ${response.data.errmsg || '未知错误'}`,
          );
        }

        return response.data.openid as string;
      } else {
        // 微信小程序 jscode2session
        // https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html
        const response = await axios.get(
          'https://api.weixin.qq.com/sns/jscode2session',
          {
            params: {
              appid: appId,
              secret: appSecret,
              js_code: code,
              grant_type: 'authorization_code',
            },
          },
        );

        if (response.data.errcode) {
          this.logger.error(`微信小程序登录失败: ${JSON.stringify(response.data)}`);
          throw new BusinessException(
            ErrorCode.WECHAT_API_ERROR,
            `微信登录失败: ${response.data.errmsg || '未知错误'}`,
          );
        }

        return response.data.openid as string;
      }
    } catch (error) {
      // 如果已经是业务异常，直接抛出
      if (error instanceof BusinessException) {
        throw error;
      }
      // 网络异常等
      this.logger.error(`微信 API 调用异常: ${(error as Error).message}`);
      throw new BusinessException(
        ErrorCode.WECHAT_API_ERROR,
        '微信服务暂时不可用，请稍后重试',
      );
    }
  }

  /**
   * 签发 Access Token
   */
  private async signAccessToken(userId: string): Promise<string> {
    const payload: JwtPayload = { sub: userId };
    return this.jwtService.signAsync(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  /**
   * 签发 Refresh Token
   *
   * 使用独立的 JWT_REFRESH_SECRET 签名，有效期更长。
   */
  private async signRefreshToken(userId: string): Promise<string> {
    const payload: JwtPayload = { sub: userId };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    });
  }
}
