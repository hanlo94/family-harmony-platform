import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { TaskService } from './task.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FamilyMemberGuard } from '../family/guards/family-member.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTaskDto } from './dto/list-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { RejectTaskDto } from './dto/reject-task.dto';
import { CancelTaskDto } from './dto/cancel-task.dto';
import type { CurrentUserInfo } from '../auth/types/auth.types';

/**
 * Task 控制器
 *
 * 提供任务 CRUD、状态流转（完成/验收/驳回/取消）8 个端点。
 * 路由前缀：/api/families/:familyId/tasks
 */
@ApiTags('Tasks - 任务')
@Controller('families/:familyId/tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // ═══════════════════════════════════════════
  // 创建任务
  // ═══════════════════════════════════════════

  /**
   * 创建任务
   *
   * ORGANIZER 和 MEMBER 可创建，CHILD 不可创建。
   */
  @Post()
  @UseGuards(JwtAuthGuard, FamilyMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建任务' })
  @ApiBody({ type: CreateTaskDto })
  async createTask(
    @CurrentUser() user: CurrentUserInfo,
    @Param('familyId') familyId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.taskService.createTask(user.id, familyId, dto);
  }

  // ═══════════════════════════════════════════
  // 任务列表
  // ═══════════════════════════════════════════

  /**
   * 获取任务列表
   *
   * 支持按状态、执行人、逾期/临近到期、关键词筛选，分页返回。
   * 列表中每个任务包含计算字段 isOverdue / isNearExpiry。
   */
  @Get()
  @UseGuards(JwtAuthGuard, FamilyMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取任务列表' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING_COMPLETION', 'PENDING_VERIFICATION', 'REJECTED', 'COMPLETED', 'CANCELLED'] })
  @ApiQuery({ name: 'assignedTo', required: false, description: '执行人用户 ID' })
  @ApiQuery({ name: 'overdue', required: false, type: Boolean, description: '仅返回已逾期任务' })
  @ApiQuery({ name: 'nearExpiry', required: false, type: Boolean, description: '仅返回临近到期任务' })
  @ApiQuery({ name: 'keyword', required: false, description: '标题关键词搜索' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async listTasks(
    @Param('familyId') familyId: string,
    @Query() query: ListTaskDto,
  ) {
    return this.taskService.listTasks(familyId, query);
  }

  // ═══════════════════════════════════════════
  // 任务详情（必须在 :id/complete、:id/verify 等操作路由之前）
  // ═══════════════════════════════════════════

  /**
   * 获取任务详情
   *
   * 包含所有关联用户信息（创建者、执行人、验收人、取消人）。
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, FamilyMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取任务详情' })
  async getTaskDetail(
    @Param('familyId') familyId: string,
    @Param('id') taskId: string,
  ) {
    return this.taskService.getTaskDetail(familyId, taskId);
  }

  // ═══════════════════════════════════════════
  // 编辑任务
  // ═══════════════════════════════════════════

  /**
   * 编辑任务
   *
   * 仅 ORGANIZER 可操作。CANCELLED / COMPLETED 状态不可编辑。
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, FamilyMemberGuard, RolesGuard)
  @Roles(MemberRole.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '编辑任务' })
  @ApiBody({ type: UpdateTaskDto })
  async updateTask(
    @Param('familyId') familyId: string,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(familyId, taskId, dto);
  }

  // ═══════════════════════════════════════════
  // 标记完成
  // ═══════════════════════════════════════════

  /**
   * 标记任务完成
   *
   * 仅任务执行人可操作。
   * needsVerification=false → COMPLETED；needsVerification=true → PENDING_VERIFICATION。
   * REJECTED 状态的任务也可通过此接口重提交（→ PENDING_VERIFICATION）。
   */
  @Post(':id/complete')
  @UseGuards(JwtAuthGuard, FamilyMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '标记任务完成' })
  @ApiBody({ type: CompleteTaskDto })
  async completeTask(
    @CurrentUser() user: CurrentUserInfo,
    @Param('familyId') familyId: string,
    @Param('id') taskId: string,
    @Body() dto: CompleteTaskDto,
  ) {
    return this.taskService.completeTask(user.id, familyId, taskId, dto);
  }

  // ═══════════════════════════════════════════
  // 验收通过
  // ═══════════════════════════════════════════

  /**
   * 验收通过
   *
   * 仅 ORGANIZER 可操作。PENDING_VERIFICATION → COMPLETED。
   */
  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, FamilyMemberGuard, RolesGuard)
  @Roles(MemberRole.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '验收通过' })
  async verifyTask(
    @CurrentUser() user: CurrentUserInfo,
    @Param('familyId') familyId: string,
    @Param('id') taskId: string,
  ) {
    return this.taskService.verifyTask(user.id, familyId, taskId);
  }

  // ═══════════════════════════════════════════
  // 驳回任务
  // ═══════════════════════════════════════════

  /**
   * 驳回任务
   *
   * 仅 ORGANIZER 可操作，必须填写驳回原因。
   * PENDING_VERIFICATION → REJECTED。
   */
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, FamilyMemberGuard, RolesGuard)
  @Roles(MemberRole.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '驳回任务' })
  @ApiBody({ type: RejectTaskDto })
  async rejectTask(
    @CurrentUser() user: CurrentUserInfo,
    @Param('familyId') familyId: string,
    @Param('id') taskId: string,
    @Body() dto: RejectTaskDto,
  ) {
    return this.taskService.rejectTask(user.id, familyId, taskId, dto);
  }

  // ═══════════════════════════════════════════
  // 取消任务
  // ═══════════════════════════════════════════

  /**
   * 取消任务
   *
   * ORGANIZER 或任务创建者可操作。COMPLETED / CANCELLED 状态不可取消。
   */
  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, FamilyMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取消任务' })
  @ApiBody({ type: CancelTaskDto })
  async cancelTask(
    @CurrentUser() user: CurrentUserInfo,
    @Param('familyId') familyId: string,
    @Param('id') taskId: string,
    @Body() dto: CancelTaskDto,
  ) {
    return this.taskService.cancelTask(user.id, familyId, taskId, dto);
  }
}
