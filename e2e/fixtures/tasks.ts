/**
 * 测试任务工厂
 */

export interface TestTask {
  id: string;
  title: string;
  description: string | null;
  difficulty: number;
  deadline: string;
  status: string;
  repeatRule: 'NONE' | 'DAILY' | 'WEEKLY';
  needsVerification: boolean;
  assignedTo: string;
}

export function createTestTask(overrides?: Partial<TestTask>): TestTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '洗碗',
    description: '今天轮到你洗碗啦',
    difficulty: 2,
    deadline: new Date(Date.now() + 3600000).toISOString(),
    status: 'PENDING_COMPLETION',
    repeatRule: 'DAILY',
    needsVerification: false,
    assignedTo: 'test-user-id',
    ...overrides,
  };
}
