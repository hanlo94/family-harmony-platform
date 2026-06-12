/**
 * Auth API module
 *
 * Endpoints:
 * - POST /auth/wechat/h5/login — H5 微信登录
 * - POST /auth/wechat/mp/login — 小程序微信登录
 * - POST /auth/refresh — 刷新令牌
 * - GET  /auth/me — 获取当前用户信息
 */

import type { components } from '../types/api';
import { api, setTokens } from './request';

type LoginRequest = components['schemas']['LoginRequest'];
type LoginResponse = components['schemas']['LoginResponse'];
type RefreshResponse = components['schemas']['RefreshResponse'];
type UserProfile = components['schemas']['UserProfile'];

/** H5 微信公众号网页授权登录 */
export async function loginByWechatH5(code: string) {
  const result = await api.post<LoginResponse>('/auth/wechat/h5/login', {
    code,
  } as LoginRequest);
  if (result.data?.accessToken && result.data?.refreshToken) {
    setTokens(result.data.accessToken, result.data.refreshToken);
  }
  return result;
}

/** 小程序微信登录 */
export async function loginByWechatMp(code: string) {
  const result = await api.post<LoginResponse>('/auth/wechat/mp/login', {
    code,
  } as LoginRequest);
  if (result.data?.accessToken && result.data?.refreshToken) {
    setTokens(result.data.accessToken, result.data.refreshToken);
  }
  return result;
}

/** 刷新访问令牌 */
export async function refreshToken(token: string) {
  const result = await api.post<RefreshResponse>('/auth/refresh', {
    refreshToken: token,
  });
  if (result.data?.accessToken) {
    // Update stored access token
    setTokens(result.data.accessToken, token);
  }
  return result;
}

/** 获取当前登录用户信息 */
export async function getCurrentUser() {
  return api.get<UserProfile>('/auth/me');
}
