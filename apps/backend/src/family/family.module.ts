import { Module } from '@nestjs/common';
import { FamilyController } from './family.controller';
import { FamilyService } from './family.service';
import { FamilyMemberGuard } from './guards/family-member.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

/**
 * Family 模块
 *
 * 提供：
 * - 家庭创建与详情查询（POST /families、GET /families/:familyId）
 * - 我的家庭列表（GET /families）
 * - 家庭成员管理（GET /families/:familyId/members、DELETE /families/:familyId/members/:memberId）
 * - 邀请码生成与加入（POST /families/:familyId/invitations、POST /families/join）
 * - 家庭任务统计（GET /families/:familyId/tasks/stats）
 *
 * 依赖：
 * - Auth 模块提供的 JWT 认证守卫和 @CurrentUser/@Roles 装饰器
 * - PrismaService 通过全局 PrismaModule 注入
 * - RolesGuard 直接在 Family 模块注册（依赖 Reflector + PrismaService，均为全局可用）
 */
@Module({
  controllers: [FamilyController],
  providers: [FamilyService, FamilyMemberGuard, RolesGuard],
  exports: [FamilyService, FamilyMemberGuard],
})
export class FamilyModule {}
