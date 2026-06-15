/**
 * PrismaClient Mock
 *
 * 在测试数据库就绪前，用 mock 替代真实的 PrismaClient。
 * 后续 C02-2（Prisma 模块 + Migration + Seed）完成后再移除此文件。
 */
class MockPrismaClient {
  $connect = jest.fn().mockResolvedValue(undefined);
  $disconnect = jest.fn().mockResolvedValue(undefined);
  $on = jest.fn();
  $use = jest.fn();
  $transaction = jest.fn();
  $queryRaw = jest.fn();
  $executeRaw = jest.fn();

  // 各模型的 mock CRUD 方法
  user = this.createModelMock();
  family = this.createModelMock();
  familyMember = this.createModelMock();
  task = this.createModelMock();
  taskTemplate = this.createModelMock();
  invitation = this.createModelMock();

  private createModelMock() {
    return {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    };
  }
}

export const PrismaClient = MockPrismaClient;
