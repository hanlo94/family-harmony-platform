import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';

/**
 * Auth Store 测试
 *
 * 测试覆盖：
 * - 默认状态（token/user/isLoggedIn/isInitialized/isLoading）
 * - isLoggedIn 计算逻辑
 * - initFromStorage（无 token / 有 token → API 验证）
 * - doLogout（清除状态 + 持久化）
 * - 重复初始化防护
 */
describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    // 重置 uni mock 的默认行为
    const uniMock = (globalThis as Record<string, unknown>).uni as Record<string, ReturnType<typeof vi.fn>>;
    uniMock.getStorageSync?.mockReturnValue(null);
    uniMock.removeStorageSync?.mockClear();
    uniMock.request?.mockResolvedValue([null, { statusCode: 200, data: {} }] as const);
  });

  // ==================== 默认状态 ====================

  it('应具有默认空值状态', () => {
    const store = useAuthStore();
    expect(store.token).toBeNull();
    expect(store.refreshToken).toBeNull();
    expect(store.user).toBeNull();
    expect(store.isLoggedIn).toBe(false);
    expect(store.isInitialized).toBe(false);
    expect(store.isLoading).toBe(false);
  });

  it('isLoggedIn：仅有 token 无 user 时应为 false', () => {
    const store = useAuthStore();
    store.token = 'some-token';
    expect(store.isLoggedIn).toBe(false);
  });

  it('isLoggedIn：仅有 user 无 token 时应为 false', () => {
    const store = useAuthStore();
    store.user = { id: 'uuid-1', nickname: '测试用户', avatarUrl: null };
    expect(store.isLoggedIn).toBe(false);
  });

  it('isLoggedIn：同时有 token 和 user 时应为 true', () => {
    const store = useAuthStore();
    store.token = 'valid-token';
    store.user = { id: 'uuid-1', nickname: '测试用户', avatarUrl: null };
    expect(store.isLoggedIn).toBe(true);
  });

  // ==================== initFromStorage ====================

  it('initFromStorage：本地无 token 时应静默结束（isInitialized=true，isLoggedIn=false）', async () => {
    const store = useAuthStore();
    await store.initFromStorage();

    expect(store.isInitialized).toBe(true);
    expect(store.isLoggedIn).toBe(false);
    expect(store.token).toBeNull();
    expect(store.user).toBeNull();
  });

  it('initFromStorage：有 token 且 API 返回用户信息时应登录成功', async () => {
    const uniMock = (globalThis as Record<string, unknown>).uni as Record<string, ReturnType<typeof vi.fn>>;

    // 模拟本地有 token
    uniMock.getStorageSync?.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'stored-access-token';
      if (key === 'refreshToken') return 'stored-refresh-token';
      return null;
    });

    // 模拟 GET /auth/me 返回用户信息
    uniMock.request?.mockResolvedValueOnce([
      null,
      {
        statusCode: 200,
        data: {
          code: 0,
          message: 'ok',
          data: {
            id: 'uuid-1',
            nickname: '小明妈妈',
            avatarUrl: 'https://avatar.example.com/1.jpg',
            families: [],
          },
        },
      },
    ] as const);

    const store = useAuthStore();
    await store.initFromStorage();

    expect(store.isInitialized).toBe(true);
    expect(store.token).toBe('stored-access-token');
    expect(store.refreshToken).toBe('stored-refresh-token');
    expect(store.user).toEqual({
      id: 'uuid-1',
      nickname: '小明妈妈',
      avatarUrl: 'https://avatar.example.com/1.jpg',
      families: [],
    });
    expect(store.isLoggedIn).toBe(true);
  });

  it('initFromStorage：有 token 但 API 返回错误时应清除登录态', async () => {
    const uniMock = (globalThis as Record<string, unknown>).uni as Record<string, ReturnType<typeof vi.fn>>;

    // 模拟本地有 token
    uniMock.getStorageSync?.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'expired-token';
      if (key === 'refreshToken') return 'expired-refresh';
      return null;
    });

    // 模拟 API 返回 401
    uniMock.request?.mockResolvedValueOnce([
      null,
      {
        statusCode: 401,
        data: { code: 40100, message: 'Token 已过期' },
      },
    ] as const);

    const store = useAuthStore();
    await store.initFromStorage();

    expect(store.isInitialized).toBe(true);
    expect(store.isLoggedIn).toBe(false);
    expect(store.token).toBeNull();
    expect(store.user).toBeNull();
  });

  // ==================== doLogout ====================

  it('doLogout：应清除 token、user、并调用 clearTokens', async () => {
    const uniMock = (globalThis as Record<string, unknown>).uni as Record<string, ReturnType<typeof vi.fn>>;

    // Arrange
    const store = useAuthStore();
    store.token = 'some-access';
    store.refreshToken = 'some-refresh';
    store.user = { id: 'uuid-1', nickname: '测试用户', avatarUrl: null };

    // Act
    await store.doLogout();

    // Assert
    expect(store.token).toBeNull();
    expect(store.refreshToken).toBeNull();
    expect(store.user).toBeNull();
    expect(store.isLoggedIn).toBe(false);
    expect(store.isInitialized).toBe(false);
    expect(uniMock.removeStorageSync).toHaveBeenCalledWith('accessToken');
    expect(uniMock.removeStorageSync).toHaveBeenCalledWith('refreshToken');
  });

  // ==================== 边界条件 ====================

  it('initFromStorage：重复调用不应重复初始化', async () => {
    const store = useAuthStore();
    await store.initFromStorage();

    // 手动修改状态（模拟其他逻辑改变了 store）
    store.token = 'changed-token';

    // 再次调用 → 应跳过（isInitialized 已是 true）
    await store.initFromStorage();
    expect(store.token).toBe('changed-token'); // 未被覆盖
  });
});
