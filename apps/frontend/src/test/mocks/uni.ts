/**
 * uni-app API Mock
 *
 * 在 Vitest 测试环境中 uni 全局对象不存在，
 * 需要 mock 所有使用的 uni.* API。
 */

import { vi } from 'vitest';

const uniMock = {
  // 存储
  getStorageSync: vi.fn((_key: string) => null),
  setStorageSync: vi.fn((_key: string, _value: unknown) => {}),
  removeStorageSync: vi.fn((_key: string) => {}),

  // 网络请求
  request: vi.fn((_options: UniApp.RequestOptions) => {
    return Promise.resolve([null, { statusCode: 200, data: {} }]);
  }),

  // 登录
  login: vi.fn(() => Promise.resolve({ code: 'mock-code' })),
  getUserProfile: vi.fn(() => Promise.resolve({ userInfo: {} })),

  // 导航
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  switchTab: vi.fn(),
  navigateBack: vi.fn(),

  // UI
  showToast: vi.fn(),
  showModal: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),

  // 图片
  chooseImage: vi.fn(() => Promise.resolve({ tempFilePaths: [] })),
  uploadFile: vi.fn(() => Promise.resolve({ statusCode: 200 })),

  // 系统信息
  getSystemInfoSync: vi.fn(() => ({
    platform: 'devtools',
    windowWidth: 375,
    windowHeight: 667,
  })),
};

// 挂载到全局
(globalThis as Record<string, unknown>).uni = uniMock;

export { uniMock };
export default uniMock;
