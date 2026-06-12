/**
 * 前端测试全局设置
 *
 * - Mock uni-app API 和微信 JS-SDK
 * - 设置测试环境变量
 */

import './mocks/uni';

// Mock 微信 JS-SDK (H5 环境)
(globalThis as Record<string, unknown>).wx = {
  config: vi.fn(),
  ready: vi.fn((cb: () => void) => cb()),
  error: vi.fn(),
};

// 设置环境变量
process.env.VITE_API_BASE_URL = 'http://localhost:3000/api';

// 导入 vi 用于 mock（已通过 vitest 全局可用）
import { vi } from 'vitest';

// Mock uni-app 的 scoped 样式（happy-dom 不处理 scoped CSS）
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return { ...actual };
});
