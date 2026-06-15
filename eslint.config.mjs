/**
 * 根 ESLint 扁平配置（ESLint v9）
 *
 * 用于 pre-commit hook（lint-staged）的快速检查。
 * 完整检查由各 workspace 的 `pnpm lint` 执行（CI 门禁）。
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  // 全局忽略
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.claude/**', '**/build/**'] },

  // 基础 JS 推荐规则
  js.configs.recommended,

  // TypeScript 推荐规则
  ...tseslint.configs.recommended,

  // 项目规则
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },
];
