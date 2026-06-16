import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { components } from '../types/api';
import { loginByWechatH5, loginByWechatMp, getCurrentUser } from '../api/auth';
import { loadTokens, clearTokens } from '../api/request';

type UserProfile = components['schemas']['UserProfile'];
type LoginResponse = components['schemas']['LoginResponse'];

/**
 * Auth Store — 登录状态、Token 管理、用户信息
 *
 * 使用 Setup Store（组合式）语法，符合前端规范 ③。
 * Token 持久化由 api/request.ts 的 setTokens/loadTokens/clearTokens 负责。
 */
export const useAuthStore = defineStore('auth', () => {
  // ========== State ==========

  /** JWT Access Token（内存副本，持久化层在 api/request.ts） */
  const token = ref<string | null>(null);

  /** JWT Refresh Token */
  const refreshToken = ref<string | null>(null);

  /** 当前登录用户信息 */
  const user = ref<UserProfile | null>(null);

  /** 是否正在加载（初始化或登录中） */
  const isLoading = ref(false);

  /** 初始化是否已完成 */
  const isInitialized = ref(false);

  // ========== Getters ==========

  /** 是否已登录 */
  const isLoggedIn = computed(() => !!token.value && !!user.value);

  // ========== Actions ==========

  /**
   * 从本地存储恢复 Token 并获取用户信息
   *
   * 应在 App.vue onLaunch 中调用一次。
   * 如果本地无 token，静默跳过（用户尚未登录）。
   */
  async function initFromStorage(): Promise<void> {
    if (isInitialized.value) return;

    isLoading.value = true;
    try {
      // 1. 从本地存储读取 token（同步）
      const storedAccess: string | null = uni.getStorageSync('accessToken') || null;
      const storedRefresh: string | null = uni.getStorageSync('refreshToken') || null;

      if (!storedAccess) {
        isInitialized.value = true;
        return;
      }

      // 2. 同步到 Store 状态和 API 层
      token.value = storedAccess;
      refreshToken.value = storedRefresh;
      loadTokens(); // 同步 API 层（request.ts 模块变量），确保后续请求带 token

      // 3. 用 token 获取用户信息以验证其有效性
      const result = await getCurrentUser();
      if (result.data) {
        user.value = result.data;
      } else {
        // Token 无效或过期 → 清除
        await doLogout();
      }
    } finally {
      isInitialized.value = true;
      isLoading.value = false;
    }
  }

  /**
   * H5 微信公众号网页授权登录
   *
   * 前端跳转微信 OAuth 获取 code → 调用后端 /api/auth/wechat/h5/login 换取 JWT。
   */
  async function doLoginByWechatH5(code: string): Promise<{ success: boolean; error?: string }> {
    isLoading.value = true;
    try {
      const result = await loginByWechatH5(code);
      if (result.data) {
        applyLoginResponse(result.data);
        return { success: true };
      }
      return { success: false, error: result.error?.message || '登录失败' };
    } catch {
      return { success: false, error: '网络异常，请重试' };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 微信小程序登录
   *
   * 前端调用 uni.login 获取 code → 调用后端 /api/auth/wechat/mp/login 换取 JWT。
   */
  async function doLoginByWechatMp(code: string): Promise<{ success: boolean; error?: string }> {
    isLoading.value = true;
    try {
      const result = await loginByWechatMp(code);
      if (result.data) {
        applyLoginResponse(result.data);
        return { success: true };
      }
      return { success: false, error: result.error?.message || '登录失败' };
    } catch {
      return { success: false, error: '网络异常，请重试' };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 退出登录
   *
   * 清除本地 token 和内存中的用户状态。
   */
  async function doLogout(): Promise<void> {
    token.value = null;
    refreshToken.value = null;
    user.value = null;
    isInitialized.value = false;
    clearTokens();
  }

  // ========== Private Helpers ==========

  /** 应用登录响应：同步 token 到内存 + 持久化 */
  function applyLoginResponse(data: LoginResponse): void {
    token.value = data.accessToken || null;
    refreshToken.value = data.refreshToken || null;
    // setTokens 由 api/auth.ts 的 loginByWechatH5/Mp 内部调用，此处仅同步内存
    if (data.user && data.user.id) {
      user.value = {
        id: data.user.id,
        nickname: data.user.nickname,
        avatarUrl: data.user.avatarUrl,
      };
    }
    isInitialized.value = true;
  }

  return {
    // State
    token,
    refreshToken,
    user,
    isLoading,
    isInitialized,
    // Getters
    isLoggedIn,
    // Actions
    initFromStorage,
    doLoginByWechatH5,
    doLoginByWechatMp,
    doLogout,
  };
});
