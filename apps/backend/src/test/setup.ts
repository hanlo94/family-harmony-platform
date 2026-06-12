/**
 * 全局测试设置
 *
 * - 设置测试环境变量
 * - Mock 微信 SDK
 * - 配置全局 beforeEach / afterEach
 */

// 设置测试环境变量
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/family_harmony_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.WECHAT_APP_ID = 'test-app-id';
process.env.WECHAT_APP_SECRET = 'test-app-secret';

// Mock 微信 API（避免集成测试时真实调用微信）
jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    ...actual,
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  };
});
