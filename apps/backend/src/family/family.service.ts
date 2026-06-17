import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/constants/error-code';
import { BusinessException } from '../common/exceptions/business.exception';
import type { CreateFamilyDto } from './dto/create-family.dto';
import type { JoinFamilyDto } from './dto/join-family.dto';
import type { CreateInvitationDto } from './dto/create-invitation.dto';

/**
 * Family 服务
 *
 * 负责：
 * - 家庭创建与详情查询
 * - 家庭成员管理（列表、加入、移除）
 * - 邀请码生成与验证
 * - 家庭任务轻量统计
 */
@Injectable()
export class FamilyService {
  private readonly logger = new Logger(FamilyService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════
  // 邀请码工具
  // ═══════════════════════════════════════════

  /**
   * 生成 6 位字母数字随机邀请码（大写字母 + 数字）
   */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /**
   * 生成唯一的邀请码（确保不重复）
   */
  private async generateUniqueInviteCode(): Promise<string> {
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const code = this.generateInviteCode();
      const existing = await this.prisma.family.findUnique({
        where: { inviteCode: code },
      });
      if (!existing) {
        return code;
      }
    }
    throw new BusinessException(ErrorCode.INTERNAL_ERROR, '邀请码生成失败，请重试');
  }

  // ═══════════════════════════════════════════
  // 家庭 CRUD
  // ═══════════════════════════════════════════

  /**
   * 创建家庭
   *
   * 创建者自动以 ORGANIZER 角色加入家庭。
   * 同时生成唯一邀请码。
   */
  async createFamily(userId: string, dto: CreateFamilyDto) {
    const inviteCode = await this.generateUniqueInviteCode();

    // 使用事务：创建家庭 + 将创建者添加为 ORGANIZER
    const family = await this.prisma.withTransaction(async (tx) => {
      const created = await tx.family.create({
        data: {
          name: dto.name,
          createdBy: userId,
          inviteCode,
        },
      });

      await tx.familyMember.create({
        data: {
          familyId: created.id,
          userId,
          role: 'ORGANIZER',
        },
      });

      return created;
    });

    this.logger.log(`家庭已创建: ${family.id} (${family.name}), 创建者: ${userId}`);

    return {
      id: family.id,
      name: family.name,
      inviteCode: family.inviteCode,
      createdBy: family.createdBy,
      createdAt: family.createdAt,
    };
  }

  /**
   * 获取当前用户所属的家庭列表
   *
   * 返回每个家庭的基本信息 + 用户角色 + 成员数量。
   */
  async getMyFamilies(userId: string) {
    const memberships = await this.prisma.familyMember.findMany({
      where: { userId },
      include: {
        family: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      id: m.family.id,
      name: m.family.name,
      role: m.role,
      memberCount: m.family._count.members,
    }));
  }

  /**
   * 获取家庭详情
   */
  async getFamilyDetail(familyId: string) {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
    });

    if (!family) {
      throw new BusinessException(ErrorCode.FAMILY_NOT_FOUND);
    }

    return {
      id: family.id,
      name: family.name,
      inviteCode: family.inviteCode,
      createdBy: family.createdBy,
      createdAt: family.createdAt,
    };
  }

  // ═══════════════════════════════════════════
  // 成员管理
  // ═══════════════════════════════════════════

  /**
   * 获取家庭成员列表
   *
   * 返回每个成员的用户信息、角色、提醒开关、加入时间。
   */
  async getMembers(familyId: string) {
    const members = await this.prisma.familyMember.findMany({
      where: { familyId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      nickname: m.user.nickname,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      reminderEnabled: m.reminderEnabled,
      joinedAt: m.joinedAt,
    }));
  }

  /**
   * 通过邀请码加入家庭
   *
   * 逻辑：
   * 1. 查找有效的邀请码
   * 2. 验证是否过期（数据库中有 expires_at 字段 + is_active 标记）
   * 3. 检查是否已是家庭成员（防止重复加入）
   * 4. 以 MEMBER 角色加入
   */
  async joinFamily(userId: string, dto: JoinFamilyDto) {
    const code = dto.code.toUpperCase();

    // 查找有效邀请码
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        code,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        family: {
          select: { id: true, name: true },
        },
      },
    });

    if (!invitation) {
      throw new BusinessException(
        ErrorCode.INVITE_CODE_INVALID,
        '邀请码无效或已过期',
      );
    }

    // 检查是否已是成员
    const existingMember = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId: invitation.familyId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new BusinessException(ErrorCode.ALREADY_FAMILY_MEMBER);
    }

    // 加入家庭
    await this.prisma.familyMember.create({
      data: {
        familyId: invitation.familyId,
        userId,
        role: 'MEMBER',
      },
    });

    this.logger.log(`用户 ${userId} 通过邀请码 ${code} 加入了家庭 ${invitation.familyId}`);

    return {
      familyId: invitation.family.id,
      familyName: invitation.family.name,
      role: 'MEMBER' as const,
    };
  }

  /**
   * 移除家庭成员
   *
   * 约束：
   * - 仅 ORGANIZER 可操作（由 RolesGuard 保证）
   * - 不能移除自己
   * - 被移除的成员记录直接删除
   */
  async removeMember(familyId: string, memberId: string, operatorId: string) {
    // 查找目标成员
    const member = await this.prisma.familyMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.familyId !== familyId) {
      throw new BusinessException(ErrorCode.NOT_FOUND, '该成员不属于此家庭');
    }

    // 不能移除自己
    if (member.userId === operatorId) {
      throw new BusinessException(ErrorCode.PERMISSION_DENIED, '不能移除自己');
    }

    await this.prisma.familyMember.delete({
      where: { id: memberId },
    });

    this.logger.log(`用户 ${member.userId} 被 ${operatorId} 从家庭 ${familyId} 移除`);
  }

  // ═══════════════════════════════════════════
  // 邀请码管理
  // ═══════════════════════════════════════════

  /**
   * 生成新的邀请码
   *
   * 仅 ORGANIZER 可操作（由 RolesGuard 保证）。
   * 默认有效期 72 小时。
   */
  async createInvitation(familyId: string, userId: string, dto: CreateInvitationDto) {
    const code = await this.generateUniqueInviteCode();
    const expiresInHours = dto.expiresInHours ?? 72;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        familyId,
        code,
        createdBy: userId,
        expiresAt,
      },
    });

    this.logger.log(`邀请码已生成: ${code}，家庭: ${familyId}，有效期: ${expiresInHours}h`);

    return {
      id: invitation.id,
      code: invitation.code,
      expiresAt: invitation.expiresAt,
      inviteUrl: `https://your-domain.com/invite?code=${invitation.code}`,
    };
  }

  // ═══════════════════════════════════════════
  // 任务统计
  // ═══════════════════════════════════════════

  /**
   * 获取家庭任务轻量统计
   *
   * 返回每个成员的：
   * - 当前待办数（PENDING_COMPLETION + REJECTED 状态）
   * - 本周完成数（COMPLETED 状态，verified_at 在本周内）
   */
  async getTaskStats(familyId: string) {
    // 获取家庭所有成员
    const members = await this.prisma.familyMember.findMany({
      where: { familyId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (members.length === 0) {
      return { members: [] };
    }

    // 计算本周起始时间（周一 00:00:00）
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);

    // 批量查询每个成员的待办数和本周完成数
    const statsPromises = members.map(async (member) => {
      const [pendingCount, weeklyCompletedCount] = await Promise.all([
        // 待办数：PENDING_COMPLETION 或 REJECTED 状态
        this.prisma.task.count({
          where: {
            familyId,
            assignedTo: member.userId,
            status: { in: ['PENDING_COMPLETION', 'REJECTED'] },
          },
        }),
        // 本周完成数
        this.prisma.task.count({
          where: {
            familyId,
            assignedTo: member.userId,
            status: 'COMPLETED',
            verifiedAt: { gte: weekStart },
          },
        }),
      ]);

      return {
        userId: member.user.id,
        nickname: member.user.nickname,
        avatarUrl: member.user.avatarUrl,
        pendingCount,
        weeklyCompletedCount,
      };
    });

    return {
      members: await Promise.all(statsPromises),
    };
  }
}
