import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/constants/error-code';
import { BusinessException } from '../common/exceptions/business.exception';

describe('UserService', () => {
  let service: UserService;

  // ── Mock 用户数据 ──
  const mockUser = {
    id: '11111111-1111-1111-1111-111111111111',
    nickname: '爸爸',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=dad',
    familyMembers: [
      {
        role: 'ORGANIZER',
        family: {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          name: '幸福的三口之家',
        },
      },
    ],
  };

  // ── Mock PrismaService ──
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    familyMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════
  // 获取当前用户信息
  // ═══════════════════════════════════════════

  describe('getCurrentUser', () => {
    it('应该返回用户信息及其家庭成员', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getCurrentUser(mockUser.id);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: expect.objectContaining({
          id: true,
          nickname: true,
          avatarUrl: true,
          familyMembers: expect.any(Object),
        }),
      });
      expect(result).toEqual({
        id: mockUser.id,
        nickname: mockUser.nickname,
        avatarUrl: mockUser.avatarUrl,
        families: [
          {
            id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            name: '幸福的三口之家',
            role: 'ORGANIZER',
          },
        ],
      });
    });

    it('用户不存在时应抛出异常', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getCurrentUser('non-existent-id')).rejects.toThrow(BusinessException);
      await expect(service.getCurrentUser('non-existent-id')).rejects.toMatchObject({
        errorCode: ErrorCode.USER_NOT_FOUND,
      });
    });
  });

  // ═══════════════════════════════════════════
  // 更新用户资料
  // ═══════════════════════════════════════════

  describe('updateProfile', () => {
    it('应该更新用户昵称', async () => {
      const updatedUser = { ...mockUser, nickname: '新昵称' };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id, { nickname: '新昵称' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { nickname: '新昵称' },
      });
      expect(result).toEqual({
        id: mockUser.id,
        nickname: '新昵称',
        avatarUrl: mockUser.avatarUrl,
      });
    });

    it('应该更新用户头像', async () => {
      const updatedUser = {
        ...mockUser,
        avatarUrl: 'https://new-avatar.jpg',
      };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id, {
        avatarUrl: 'https://new-avatar.jpg',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { avatarUrl: 'https://new-avatar.jpg' },
      });
      expect(result.avatarUrl).toBe('https://new-avatar.jpg');
    });
  });

  // ═══════════════════════════════════════════
  // 获取提醒设置
  // ═══════════════════════════════════════════

  describe('getSettings', () => {
    it('应该返回用户在各家庭下的提醒设置', async () => {
      mockPrisma.familyMember.findMany.mockResolvedValue([
        {
          familyId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          reminderEnabled: true,
          family: { name: '幸福的三口之家' },
        },
      ]);

      const result = await service.getSettings(mockUser.id);

      expect(mockPrisma.familyMember.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        select: expect.objectContaining({
          familyId: true,
          reminderEnabled: true,
          family: expect.any(Object),
        }),
      });
      expect(result).toEqual({
        settings: [
          {
            familyId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            familyName: '幸福的三口之家',
            reminderEnabled: true,
          },
        ],
      });
    });

    it('用户不属于任何家庭时应返回空数组', async () => {
      mockPrisma.familyMember.findMany.mockResolvedValue([]);

      const result = await service.getSettings(mockUser.id);

      expect(result).toEqual({ settings: [] });
    });
  });

  // ═══════════════════════════════════════════
  // 更新提醒设置
  // ═══════════════════════════════════════════

  describe('updateSettings', () => {
    it('应该更新用户在指定家庭下的提醒开关', async () => {
      mockPrisma.familyMember.findUnique.mockResolvedValue({
        id: 'member-id-001',
        familyId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        userId: mockUser.id,
        reminderEnabled: true,
      });
      mockPrisma.familyMember.update.mockResolvedValue({
        reminderEnabled: false,
      });

      const result = await service.updateSettings(mockUser.id, {
        familyId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        reminderEnabled: false,
      });

      expect(mockPrisma.familyMember.findUnique).toHaveBeenCalledWith({
        where: {
          familyId_userId: {
            familyId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            userId: mockUser.id,
          },
        },
      });
      expect(mockPrisma.familyMember.update).toHaveBeenCalledWith({
        where: { id: 'member-id-001' },
        data: { reminderEnabled: false },
      });
      expect(result).toEqual({
        familyId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        reminderEnabled: false,
      });
    });

    it('非家庭成员修改提醒设置时应抛出异常', async () => {
      mockPrisma.familyMember.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSettings(mockUser.id, {
          familyId: 'non-existent-family',
          reminderEnabled: false,
        }),
      ).rejects.toThrow(BusinessException);

      await expect(
        service.updateSettings(mockUser.id, {
          familyId: 'non-existent-family',
          reminderEnabled: false,
        }),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.NOT_FAMILY_MEMBER,
      });
    });
  });
});
