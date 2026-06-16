import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/constants/error-code';
import { BusinessException } from '../common/exceptions/business.exception';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UpdateUserSettingsDto } from './dto/update-settings.dto';

/**
 * User 服务
 *
 * 负责：
 * - 当前用户信息查询（含家庭列表）
 * - 用户资料更新（昵称、头像）
 * - 提醒设置读写（按家庭维度）
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取当前登录用户信息
   *
   * 返回用户基本资料及其所属的家庭列表（含角色）。
   */
  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        familyMembers: {
          include: {
            family: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      families: user.familyMembers.map((m) => ({
        id: m.family.id,
        name: m.family.name,
        role: m.role,
      })),
    };
  }

  /**
   * 更新当前用户资料
   *
   * 可更新字段：nickname、avatarUrl。
   * 只传入需要更新的字段即可（部分更新）。
   */
  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    this.logger.log(`用户资料已更新: ${userId}`);

    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    };
  }

  /**
   * 获取当前用户在各家庭下的提醒设置
   *
   * 返回用户所属的每个家庭的提醒开关状态。
   */
  async getSettings(userId: string) {
    const settings = await this.prisma.familyMember.findMany({
      where: { userId },
      select: {
        familyId: true,
        reminderEnabled: true,
        family: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      settings: settings.map((s) => ({
        familyId: s.familyId,
        familyName: s.family.name,
        reminderEnabled: s.reminderEnabled,
      })),
    };
  }

  /**
   * 更新用户在指定家庭下的提醒开关
   *
   * 只有家庭成员才能修改自己的提醒设置。
   */
  async updateSettings(userId: string, dto: UpdateUserSettingsDto) {
    const member = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId: dto.familyId,
          userId,
        },
      },
    });

    if (!member) {
      throw new BusinessException(
        ErrorCode.NOT_FAMILY_MEMBER,
        '你不是该家庭的成员，无法修改提醒设置',
      );
    }

    await this.prisma.familyMember.update({
      where: { id: member.id },
      data: { reminderEnabled: dto.reminderEnabled },
    });

    this.logger.log(
      `用户 ${userId} 在家庭 ${dto.familyId} 的提醒设置已更新: ${dto.reminderEnabled}`,
    );

    return {
      familyId: dto.familyId,
      reminderEnabled: dto.reminderEnabled,
    };
  }
}
