import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 *
 * 运行前需要启动完整环境：
 *   docker compose up -d    # PostgreSQL + Backend
 *   pnpm dev:frontend       # Frontend dev server
 *
 * 然后：
 *   pnpm test:e2e
 */
export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'e2e/report' }],
    ['list'],
  ],
  timeout: 30000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 }, // iPhone X 尺寸（H5 主要使用场景）
      },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : [
        // 在本地开发时，假设前后端已经手动启动
        // 如需要自动启动，可以添加以下配置：
        // {
        //   command: 'pnpm dev:frontend',
        //   url: 'http://localhost:5173',
        //   reuseExistingServer: true,
        // },
      ],
});
