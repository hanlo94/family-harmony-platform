import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    // 测试环境
    environment: 'happy-dom',
    // 全局测试设置
    setupFiles: ['./src/test/setup.ts'],
    // 测试文件匹配
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // CSS 处理（忽略 scss 导入）
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/types/**',
        'src/test/**',
        'src/**/*.d.ts',
      ],
    },
  },
});
