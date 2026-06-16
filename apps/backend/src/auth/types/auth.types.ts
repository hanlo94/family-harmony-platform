/**
 * Auth 模块类型定义
 *
 * 定义 JWT Payload、登录响应、刷新响应等核心类型。
 */

/** JWT Token Payload 结构 */
export interface JwtPayload {
  /** 用户 ID (UUID) */
  sub: string;
}

/** 登录成功响应 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
  };
}

/** 刷新 Token 响应 */
export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

/** 附加到 request.user 的当前用户信息（轻量，不含 DB 查询） */
export interface CurrentUserInfo {
  id: string;
}
