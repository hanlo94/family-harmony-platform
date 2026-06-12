/**
 * API request wrapper based on uni.request
 *
 * Handles:
 * - Base URL configuration
 * - JWT token injection
 * - 401 handling (token refresh)
 * - Unified error handling
 */

import type { components } from '../types/api';

type SuccessResponse = components['schemas']['SuccessResponse'];
type ErrorResponse = components['schemas']['ErrorResponse'];

type ApiResponse<T> = SuccessResponse & { data?: T };

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

let accessToken: string | null = null;
let refreshTokenValue: string | null = null;

/** Set tokens (called after login / token refresh) */
export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshTokenValue = refresh;
  // Persist locally
  uni.setStorageSync('accessToken', access);
  uni.setStorageSync('refreshToken', refresh);
}

/** Load persisted tokens */
export function loadTokens(): boolean {
  accessToken = uni.getStorageSync('accessToken') || null;
  refreshTokenValue = uni.getStorageSync('refreshToken') || null;
  return !!accessToken;
}

/** Clear tokens (logout) */
export function clearTokens() {
  accessToken = null;
  refreshTokenValue = null;
  uni.removeStorageSync('accessToken');
  uni.removeStorageSync('refreshToken');
}

/** Refresh the access token */
async function tryRefreshToken(): Promise<boolean> {
  if (!refreshTokenValue) return false;
  try {
    const [err, res] = await uni.request({
      url: `${BASE_URL}/auth/refresh`,
      method: 'POST',
      data: { refreshToken: refreshTokenValue },
    });
    if (err || res.statusCode !== 200) return false;
    const body = res.data as ApiResponse<components['schemas']['RefreshResponse']>;
    if (body.data?.accessToken) {
      accessToken = body.data.accessToken;
      uni.setStorageSync('accessToken', accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Core request function with token injection and auto-refresh */
export async function apiRequest<T = unknown>(
  url: string,
  options: Omit<UniApp.RequestOptions, 'url'> = {},
): Promise<{ data: T; error: null } | { data: null; error: ErrorResponse }> {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.header as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const [err, res] = await uni.request({
    ...options,
    url: fullUrl,
    header: headers,
  });

  if (err) {
    return { data: null, error: { code: -1, message: '网络请求失败', detail: err.errMsg } };
  }

  // Handle 401 - try token refresh
  if (res.statusCode === 401 && refreshTokenValue) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry with new token
      headers['Authorization'] = `Bearer ${accessToken}`;
      const [retryErr, retryRes] = await uni.request({
        ...options,
        url: fullUrl,
        header: headers,
      });
      if (retryErr) {
        return { data: null, error: { code: -1, message: '网络请求失败', detail: retryErr.errMsg } };
      }
      const retryBody = retryRes.data as ApiResponse<T>;
      if (retryRes.statusCode >= 400) {
        return { data: null, error: retryBody as ErrorResponse };
      }
      return { data: (retryBody.data ?? retryBody) as T, error: null };
    }
    // Refresh failed - clear tokens
    clearTokens();
    return { data: null, error: { code: 40100, message: '登录已过期，请重新登录' } };
  }

  // Handle other errors
  if (res.statusCode >= 400) {
    const body = res.data as ErrorResponse;
    return { data: null, error: body };
  }

  const body = res.data as ApiResponse<T>;
  return { data: (body.data ?? body) as T, error: null };
}

/** Convenience methods */
export const api = {
  get<T = unknown>(url: string, data?: Record<string, unknown>) {
    return apiRequest<T>(url, { method: 'GET', data });
  },
  post<T = unknown>(url: string, data?: Record<string, unknown>) {
    return apiRequest<T>(url, { method: 'POST', data });
  },
  patch<T = unknown>(url: string, data?: Record<string, unknown>) {
    return apiRequest<T>(url, { method: 'PATCH', data });
  },
  delete<T = unknown>(url: string, data?: Record<string, unknown>) {
    return apiRequest<T>(url, { method: 'DELETE', data });
  },
};
