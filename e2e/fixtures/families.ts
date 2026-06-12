/**
 * 测试家庭工厂
 */

export interface TestFamily {
  id: string;
  name: string;
  inviteCode: string;
}

export function createTestFamily(overrides?: Partial<TestFamily>): TestFamily {
  return {
    id: `family-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '测试家庭',
    inviteCode: 'TEST001',
    ...overrides,
  };
}
