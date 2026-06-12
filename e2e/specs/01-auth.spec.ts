/**
 * E2E: 认证流程
 *
 * 场景：
 * 1. 用户首次访问 → 跳转登录页
 * 2. 微信 OAuth 授权 → 获取 JWT
 * 3. Token 过期 → 自动刷新
 * 4. 登出 → 清除 token
 */
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect to login page when not authenticated', async ({ page }) => {
    // TODO: 实现 - 当后端和前端实际开发完成后
    test.skip();
    await page.goto('/');
    // 预期重定向到登录页
    // await expect(page).toHaveURL(/login/);
  });

  test('should login with WeChat H5 OAuth', async ({ page }) => {
    test.skip();
    // TODO: Mock 微信 OAuth 流程
  });

  test('should refresh token on 401', async ({ page }) => {
    test.skip();
    // TODO: 测试 token 自动刷新
  });

  test('should clear token on logout', async ({ page }) => {
    test.skip();
    // TODO: 测试退出登录
  });
});
