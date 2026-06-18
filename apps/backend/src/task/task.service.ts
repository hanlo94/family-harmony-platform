import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/constants/error-code';
import { BusinessException } from '../common/exceptions/business.exception';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';
import type { ListTaskDto } from './dto/list-task.dto';
import type { CompleteTaskDto } from './dto/complete-task.dto';
import type { RejectTaskDto } from './dto/reject-task.dto';
import type { CancelTaskDto } from './dto/cancel-task.dto';

/**
 * 用户简要信息（所有关联用户统一格式）
 */
interface UserBrief {
  id: string;
  nickname: string;
  avatarUrl: string | null;
}

/**
 * 任务详情响应（包含关联用户）
 */
export interface TaskDetailResponse {
  id: string;
  familyId: string;
  title: string;
  description: string | null;
  difficulty: number;
  deadline: string;
  status: string;
  repeatRule: string;
  needsVerification: boolean;
  assignedTo: UserBrief;
  createdBy: UserBrief;
  completionNote: string | null;
  completionPhoto: string | null;
  completedAt: string | null;
  verifiedAt: string | null;
  verifiedBy: UserBrief | null;
  rejectionReason: string | null;
  cancelledAt: string | null;
  cancelledBy: UserBrief | null;
  cancelledReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 任务列表项（精简 + 计算状态）
 */
interface TaskListItemResponse {
  id: string;
  title: string;
  difficulty: number;
  deadline: string;
  status: string;
  repeatRule: string;
  needsVerification: boolean;
  isOverdue: boolean;
  isNearExpiry: boolean;
  assignedTo: UserBrief;
  createdBy: UserBrief;
  createdAt: string;
}

/**
 * 分页列表响应
 */
export interface PaginatedTaskList {
  items: TaskListItemResponse[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 计算逾期状态
 *
 * 仅对 PENDING_COMPLETION 状态的任务计算。
 * - 已逾期：deadline < 当前时间
 * - 临近到期：当前时间 <= deadline <= 当前时间 + 1小时
 */
function computeOverdueFlags(
  status: string,
  deadline: Date,
): { isOverdue: boolean; isNearExpiry: boolean } {
  if (status !== 'PENDING_COMPLETION') {
    return { isOverdue: false, isNearExpiry: false };
  }

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const isOverdue = deadline < now;
  const isNearExpiry = !isOverdue && deadline <= oneHourLater;

  return { isOverdue, isNearExpiry };
}

/**
 * 将 Prisma User 关联对象映射为 UserBrief
 */
function toUserBrief(user: { id: string; nickname: string; avatarUrl: string | null }): UserBrief {
  return {
    id: user.id,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Task 服务
 *
 * 负责任务 CRUD、状态机流转、权限校验。
 * 依赖 PrismaService（全局模块）、FamilyMemberGuard（前置校验家庭成员身份）。
 */
@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════
  // 常用 Prisma include（关联用户查询）
  // ═══════════════════════════════════════════

  private readonly userInclude = {
    assignee: {
      select: { id: true, nickname: true, avatarUrl: true },
    },
    creator: {
      select: { id: true, nickname: true, avatarUrl: true },
    },
    verifier: {
      select: { id: true, nickname: true, avatarUrl: true },
    },
    canceller: {
      select: { id: true, nickname: true, avatarUrl: true },
    },
  } as const;

  // ═══════════════════════════════════════════
  // 响应序列化
  // ═══════════════════════════════════════════

  /**
   * 将 Prisma Task 查询结果序列化为 API 响应格式
   */
  private serializeTaskDetail(task: Record<string, any>): TaskDetailResponse {
    return {
      id: task.id,
      familyId: task.familyId,
      title: task.title,
      description: task.description,
      difficulty: task.difficulty,
      deadline: task.deadline instanceof Date ? task.deadline.toISOString() : task.deadline,
      status: task.status,
      repeatRule: task.repeatRule,
      needsVerification: task.needsVerification,
      assignedTo: toUserBrief(task.assignee),
      createdBy: toUserBrief(task.creator),
      completionNote: task.completionNote,
      completionPhoto: task.completionPhoto,
      completedAt: task.completedAt
        ? task.completedAt instanceof Date
          ? task.completedAt.toISOString()
          : task.completedAt
        : null,
      verifiedAt: task.verifiedAt
        ? task.verifiedAt instanceof Date
          ? task.verifiedAt.toISOString()
          : task.verifiedAt
        : null,
      verifiedBy: task.verifier ? toUserBrief(task.verifier) : null,
      rejectionReason: task.rejectionReason,
      cancelledAt: task.cancelledAt
        ? task.cancelledAt instanceof Date
          ? task.cancelledAt.toISOString()
          : task.cancelledAt
        : null,
      cancelledBy: task.canceller ? toUserBrief(task.canceller) : null,
      cancelledReason: task.cancelledReason,
      createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
      updatedAt: task.updatedAt instanceof Date ? task.updatedAt.toISOString() : task.updatedAt,
    };
  }

  /**
   * 将 Prisma Task 查询结果序列化为列表项（含计算状态）
   */
  private serializeTaskListItem(task: Record<string, any>): TaskListItemResponse {
    const deadline = task.deadline instanceof Date ? task.deadline : new Date(task.deadline);
    const { isOverdue, isNearExpiry } = computeOverdueFlags(task.status, deadline);

    return {
      id: task.id,
      title: task.title,
      difficulty: task.difficulty,
      deadline: deadline.toISOString(),
      status: task.status,
      repeatRule: task.repeatRule,
      needsVerification: task.needsVerification,
      isOverdue,
      isNearExpiry,
      assignedTo: toUserBrief(task.assignee),
      createdBy: toUserBrief(task.creator),
      createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
    };
  }

  // ═══════════════════════════════════════════
  // 1. 创建任务
  // ═══════════════════════════════════════════

  /**
   * 创建任务
   *
   * 权限：
   * - CHILD 角色不可创建任务
   * - ORGANIZER / MEMBER 可创建
   *
   * 约束：
   * - assignedTo 必须是家庭成员
   */
  async createTask(userId: string, familyId: string, dto: CreateTaskDto): Promise<TaskDetailResponse> {
    // 校验创建者角色（CHILD 不可创建）
    const creatorMembership = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId } },
    });

    if (!creatorMembership) {
      throw new BusinessException(ErrorCode.NOT_FAMILY_MEMBER);
    }

    if (creatorMembership.role === 'CHILD') {
      throw new BusinessException(ErrorCode.CHILD_NOT_ALLOWED);
    }

    // 校验执行人是家庭成员
    const assigneeMembership = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId: dto.assignedTo } },
    });

    if (!assigneeMembership) {
      throw new BusinessException(ErrorCode.NOT_FAMILY_MEMBER, '任务执行人不是家庭成员');
    }

    // 创建任务
    const task = await this.prisma.task.create({
      data: {
        familyId,
        title: dto.title,
        description: dto.description ?? null,
        difficulty: dto.difficulty ?? 1,
        deadline: new Date(dto.deadline),
        repeatRule: dto.repeatRule ?? 'NONE',
        needsVerification: dto.needsVerification ?? false,
        createdBy: userId,
        assignedTo: dto.assignedTo,
      },
      include: this.userInclude,
    });

    this.logger.log(
      `任务已创建: ${task.id} (${task.title}), 家庭: ${familyId}, 创建者: ${userId}, 执行人: ${dto.assignedTo}`,
    );

    return this.serializeTaskDetail(task);
  }

  // ═══════════════════════════════════════════
  // 2. 任务列表
  // ═══════════════════════════════════════════

  /**
   * 查询任务列表
   *
   * 支持过滤：
   * - status: 按任务状态筛选
   * - assignedTo: 按执行人筛选
   * - overdue: 仅返回已逾期任务（PENDING_COMPLETION + deadline < now）
   * - nearExpiry: 仅返回临近到期任务（PENDING_COMPLETION + now <= deadline <= now+1h）
   * - keyword: 按标题关键词搜索
   */
  async listTasks(familyId: string, query: ListTaskDto): Promise<PaginatedTaskList> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // 构建 where 条件
    const where: Record<string, any> = { familyId };

    // 状态筛选
    if (query.status) {
      where.status = query.status;
    }

    // 执行人筛选
    if (query.assignedTo) {
      where.assignedTo = query.assignedTo;
    }

    // 逾期 / 临近到期筛选
    if (query.overdue && query.nearExpiry) {
      // 两者同时指定：取并集
      where.status = 'PENDING_COMPLETION';
      where.OR = [
        { deadline: { lt: now } },
        { deadline: { gte: now, lte: oneHourLater } },
      ];
    } else if (query.overdue) {
      where.status = 'PENDING_COMPLETION';
      where.deadline = { lt: now };
    } else if (query.nearExpiry) {
      where.status = 'PENDING_COMPLETION';
      where.deadline = { gte: now, lte: oneHourLater };
    }

    // 关键词搜索（标题模糊匹配）
    if (query.keyword) {
      where.title = { contains: query.keyword };
    }

    // 并行查询：总数 + 分页数据
    const [total, tasks] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        include: this.userInclude,
        orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: tasks.map((t) => this.serializeTaskListItem(t)),
      total,
      page,
      pageSize,
    };
  }

  // ═══════════════════════════════════════════
  // 3. 任务详情
  // ═══════════════════════════════════════════

  /**
   * 获取任务详情
   *
   * 包含所有关联用户信息（创建者、执行人、验收人、取消人）。
   */
  async getTaskDetail(familyId: string, taskId: string): Promise<TaskDetailResponse> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, familyId },
      include: this.userInclude,
    });

    if (!task) {
      throw new BusinessException(ErrorCode.TASK_NOT_FOUND);
    }

    return this.serializeTaskDetail(task);
  }

  // ═══════════════════════════════════════════
  // 4. 编辑任务
  // ═══════════════════════════════════════════

  /**
   * 编辑任务
   *
   * 权限：仅 ORGANIZER（由 RolesGuard 保证）。
   * 约束：CANCELLED 和 COMPLETED 状态不可编辑。
   */
  async updateTask(
    familyId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<TaskDetailResponse> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, familyId },
    });

    if (!task) {
      throw new BusinessException(ErrorCode.TASK_NOT_FOUND);
    }

    // 终态不可编辑
    if (task.status === 'CANCELLED' || task.status === 'COMPLETED') {
      throw new BusinessException(
        ErrorCode.TASK_STATUS_INVALID,
        '已完成或已取消的任务不可编辑',
      );
    }

    // 如果修改执行人，需校验新执行人是家庭成员
    if (dto.assignedTo) {
      const assigneeMembership = await this.prisma.familyMember.findUnique({
        where: { familyId_userId: { familyId, userId: dto.assignedTo } },
      });

      if (!assigneeMembership) {
        throw new BusinessException(ErrorCode.NOT_FAMILY_MEMBER, '任务执行人不是家庭成员');
      }
    }

    // 构建更新数据
    const updateData: Record<string, any> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.difficulty !== undefined) updateData.difficulty = dto.difficulty;
    if (dto.deadline !== undefined) {
      updateData.deadline = new Date(dto.deadline);
      // 截止时间变更 → 重置通知标记，允许新 deadline 再次触发提醒
      updateData.hasNotified = false;
    }
    if (dto.assignedTo !== undefined) updateData.assignedTo = dto.assignedTo;
    if (dto.repeatRule !== undefined) updateData.repeatRule = dto.repeatRule;
    if (dto.needsVerification !== undefined) updateData.needsVerification = dto.needsVerification;

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: this.userInclude,
    });

    this.logger.log(`任务已更新: ${taskId}`);

    return this.serializeTaskDetail(updated);
  }

  // ═══════════════════════════════════════════
  // 5. 标记完成
  // ═══════════════════════════════════════════

  /**
   * 标记任务完成
   *
   * 权限：仅任务执行人可操作。
   * 状态流转：
   * - needsVerification=false → COMPLETED
   * - needsVerification=true  → PENDING_VERIFICATION
   * - REJECTED 重提交         → PENDING_VERIFICATION（清除驳回信息）
   */
  async completeTask(
    userId: string,
    familyId: string,
    taskId: string,
    dto: CompleteTaskDto,
  ): Promise<TaskDetailResponse> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, familyId },
    });

    if (!task) {
      throw new BusinessException(ErrorCode.TASK_NOT_FOUND);
    }

    // 权限：仅执行人
    if (task.assignedTo !== userId) {
      throw new BusinessException(ErrorCode.PERMISSION_DENIED, '只有任务执行人可以标记完成');
    }

    // 状态校验
    const allowedStates = ['PENDING_COMPLETION', 'REJECTED'];
    if (!allowedStates.includes(task.status)) {
      throw new BusinessException(
        ErrorCode.TASK_STATUS_INVALID,
        '当前状态不允许此操作',
      );
    }

    const now = new Date();

    // 确定目标状态
    let targetStatus: string;
    if (task.status === 'REJECTED') {
      // 驳回后重提交 → 直接进入待验收
      targetStatus = 'PENDING_VERIFICATION';
    } else if (task.needsVerification) {
      // 需要验收 → 待验收
      targetStatus = 'PENDING_VERIFICATION';
    } else {
      // 不需验收 → 直接完成
      targetStatus = 'COMPLETED';
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: targetStatus as any,
        completedAt: now,
        completionNote: dto.completionNote ?? null,
        completionPhoto: dto.completionPhoto ?? null,
        // 重提交时清除驳回信息
        ...(task.status === 'REJECTED'
          ? { rejectionReason: null }
          : {}),
      },
      include: this.userInclude,
    });

    this.logger.log(
      `任务已标记完成: ${taskId}, 状态: ${targetStatus}, 执行人: ${userId}`,
    );

    return this.serializeTaskDetail(updated);
  }

  // ═══════════════════════════════════════════
  // 6. 验收通过
  // ═══════════════════════════════════════════

  /**
   * 验收通过
   *
   * 权限：仅 ORGANIZER（由 RolesGuard 保证）。
   * 状态：PENDING_VERIFICATION → COMPLETED
   */
  async verifyTask(
    userId: string,
    familyId: string,
    taskId: string,
  ): Promise<TaskDetailResponse> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, familyId },
    });

    if (!task) {
      throw new BusinessException(ErrorCode.TASK_NOT_FOUND);
    }

    // 状态校验
    if (task.status !== 'PENDING_VERIFICATION') {
      throw new BusinessException(
        ErrorCode.TASK_STATUS_INVALID,
        '仅待验收状态的任务可以验收',
      );
    }

    const now = new Date();

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        verifiedAt: now,
        verifiedBy: userId,
      },
      include: this.userInclude,
    });

    this.logger.log(`任务已验收通过: ${taskId}, 验收人: ${userId}`);

    return this.serializeTaskDetail(updated);
  }

  // ═══════════════════════════════════════════
  // 7. 驳回任务
  // ═══════════════════════════════════════════

  /**
   * 驳回任务
   *
   * 权限：仅 ORGANIZER（由 RolesGuard 保证）。
   * 状态：PENDING_VERIFICATION → REJECTED
   * reason 必填（由 DTO 校验保证）。
   */
  async rejectTask(
    userId: string,
    familyId: string,
    taskId: string,
    dto: RejectTaskDto,
  ): Promise<TaskDetailResponse> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, familyId },
    });

    if (!task) {
      throw new BusinessException(ErrorCode.TASK_NOT_FOUND);
    }

    // 状态校验
    if (task.status !== 'PENDING_VERIFICATION') {
      throw new BusinessException(
        ErrorCode.TASK_STATUS_INVALID,
        '仅待验收状态的任务可以驳回',
      );
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'REJECTED',
        rejectionReason: dto.reason,
      },
      include: this.userInclude,
    });

    this.logger.log(`任务已驳回: ${taskId}, 驳回人: ${userId}`);

    return this.serializeTaskDetail(updated);
  }

  // ═══════════════════════════════════════════
  // 8. 取消任务
  // ═══════════════════════════════════════════

  /**
   * 取消任务
   *
   * 权限：ORGANIZER（任意任务）或任务创建者（MEMBER 可取消自己创建的任务）。
   * 约束：COMPLETED 和 CANCELLED 状态不可取消。
   */
  async cancelTask(
    userId: string,
    familyId: string,
    taskId: string,
    dto: CancelTaskDto,
  ): Promise<TaskDetailResponse> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, familyId },
    });

    if (!task) {
      throw new BusinessException(ErrorCode.TASK_NOT_FOUND);
    }

    // 终态不可取消
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      throw new BusinessException(
        ErrorCode.TASK_STATUS_INVALID,
        '已完成或已取消的任务不可再次取消',
      );
    }

    // 权限校验：ORGANIZER 或任务创建者
    const isCreator = task.createdBy === userId;

    if (!isCreator) {
      // 非创建者需检查是否 ORGANIZER
      const membership = await this.prisma.familyMember.findUnique({
        where: { familyId_userId: { familyId, userId } },
      });

      if (!membership || membership.role !== 'ORGANIZER') {
        throw new BusinessException(
          ErrorCode.PERMISSION_DENIED,
          '仅家庭组织者或任务创建者可以取消任务',
        );
      }
    }

    const now = new Date();

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'CANCELLED',
        cancelledAt: now,
        cancelledBy: userId,
        cancelledReason: dto.reason ?? null,
      },
      include: this.userInclude,
    });

    this.logger.log(`任务已取消: ${taskId}, 取消人: ${userId}`);

    return this.serializeTaskDetail(updated);
  }
}
