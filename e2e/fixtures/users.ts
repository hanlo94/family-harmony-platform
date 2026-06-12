/**
 * 测试用户工厂
 *
 * 在 E2E 测试中创建和管理测试用户数据。
 * 实际测试中，这些数据通过 API 或数据库 seed 创建。
 */

export interface TestUser {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  role: 'ORGANIZER' | 'MEMBER' | 'CHILD';
}

export const TEST_USERS = {
  organizer: {
    id: 'test-organizer-id',
    nickname: '爸爸',
    avatarUrl: null,
    role: 'ORGANIZER',
  } as TestUser,
  member: {
    id: 'test-member-id',
    nickname: '妈妈',
    avatarUrl: null,
    role: 'MEMBER',
  } as TestUser,
  child: {
    id: 'test-child-id',
    nickname: '小明',
    avatarUrl: null,
    role: 'CHILD',
  } as TestUser,
};

/** 生成随机用户数据，用于测试 */
export function createTestUser(overrides?: Partial<TestUser>): TestUser {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nickname: '测试用户',
    avatarUrl: null,
    role: 'MEMBER',
    ...overrides,
  };
}
