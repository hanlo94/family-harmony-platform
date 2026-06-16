import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma 数据库服务
 *
 * 封装 PrismaClient，管理数据库连接生命周期。
 * 通过 PrismaModule 全局注册，所有业务 Service 通过依赖注入使用。
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class TaskService {
 *   constructor(private readonly prisma: PrismaService) {}
 *
 *   async findById(id: string, familyId: string) {
 *     return this.prisma.task.findFirst({ where: { id, familyId } });
 *   }
 * }
 * ```
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    this.logger.log('正在连接数据库...');
    await this.$connect();
    this.logger.log('数据库连接成功');
  }

  async onModuleDestroy() {
    this.logger.log('正在断开数据库连接...');
    await this.$disconnect();
    this.logger.log('数据库连接已断开');
  }

  /**
   * 在事务中执行回调
   *
   * 封装 Prisma 的交互式事务 API，提供类型安全的批量操作。
   * 回调中抛出的任何异常都会自动回滚事务。
   *
   * @example
   * ```typescript
   * await this.prisma.withTransaction(async (tx) => {
   *   const task = await tx.task.create({ data: { ... } });
   *   await tx.taskTemplate.update({ where: { id }, data: { ... } });
   *   return task;
   * });
   * ```
   */
  async withTransaction<T>(
    fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(fn);
  }
}
