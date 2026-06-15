import type { Config } from 'jest';

/**
 * E2E 测试 Jest 配置
 *
 * 与单元测试配置（jest.config.ts）的区别：
 * - rootDir 指向 apps/backend/（而非 src/）
 * - 测试文件位于 test/ 目录
 */
const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@prisma/client$': '<rootDir>/test/__mocks__/prisma-client.mock.ts',
  },
};

export default config;
