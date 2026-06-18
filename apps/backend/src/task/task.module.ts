import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { FamilyModule } from '../family/family.module';
import { RolesGuard } from '../auth/guards/roles.guard';

/**
 * Task 模块
 *
 * 提供：
 * - 任务 CRUD（POST/GET/PATCH /families/:familyId/tasks）
 * - 状态流转（complete/verify/reject/cancel）
 * - 任务列表查询（含逾期/临近到期计算状态 + 分页）
 *
 * 依赖：
 * - FamilyModule 提供的 FamilyMemberGuard（成员身份校验）
 * - Auth 模块提供的 JwtAuthGuard、RolesGuard、@CurrentUser/@Roles 装饰器
 * - PrismaService 通过全局 PrismaModule 注入
 */
@Module({
  imports: [FamilyModule],
  controllers: [TaskController],
  providers: [TaskService, RolesGuard],
  exports: [TaskService],
})
export class TaskModule {}
