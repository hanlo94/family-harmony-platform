import { Test, TestingModule } from '@nestjs/testing';
import { FamilyService } from './family.service';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/constants/error-code';
import { BusinessException } from '../common/exceptions/business.exception';

describe('FamilyService', () => {
  let service: FamilyService;

  // ── Mock 数据 ──
  const mockUserId = '11111111-1111-1111-1111-111111111111';
  const mockFamilyId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const mockMemberId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const mockInvitationId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  const mockFamily = {
    id: mockFamilyId,
    name: '幸福的三口之家',
    inviteCode: 'ABC123',
    createdBy: mockUserId,
    createdAt: new Date('2026-06-10T10:00:00Z'),
    updatedAt: new Date('2026-06-10T10:00:00Z'),
  };

  const mockInvitation = {
    id: mockInvitationId,
    familyId: mockFamilyId,
    code: 'XYZ789',
    createdBy: mockUserId,
    expiresAt: new Date('2026-06-13T10:00:00Z'),
    isActive: true,
    createdAt: new Date('2026-06-10T10:00:00Z'),
    family: {
      id: mockFamilyId,
      name: '幸福的三口之家',
    },
  };

  // ── Mock PrismaService ──
  const mockPrisma = {
    family: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    familyMember: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    invitation: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    task: {
      count: jest.fn(),
    },
    withTransaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamilyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FamilyService>(FamilyService);

    // withTransaction: 默认执行回调并返回其返回值
    mockPrisma.withTransaction.mockImplementation((fn: any) => fn(mockPrisma));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════
  // 创建家庭
  // ═══════════════════════════════════════════

  describe('createFamily', () => {
    it('应该创建家庭并将创建者设为 ORGANIZER', async () => {
      mockPrisma.family.findUnique.mockResolvedValue(null); // inviteCode 不冲突
      mockPrisma.family.create.mockResolvedValue(mockFamily);
      mockPrisma.familyMember.create.mockResolvedValue({
        id: mockMemberId,
        familyId: mockFamilyId,
        userId: mockUserId,
        role: 'ORGANIZER',
      });

      const result = await service.createFamily(mockUserId, { name: '幸福的三口之家' });

      expect(result).toEqual({
        id: mockFamilyId,
        name: '幸福的三口之家',
        inviteCode: expect.any(String),
        createdBy: mockUserId,
        createdAt: expect.any(Date),
      });

      // 验证事务中创建了 family
      expect(mockPrisma.family.create).toHaveBeenCalledWith({
        data: {
          name: '幸福的三口之家',
          createdBy: mockUserId,
          inviteCode: expect.any(String),
        },
      });

      // 验证事务中创建了 familyMember
      expect(mockPrisma.familyMember.create).toHaveBeenCalledWith({
        data: {
          familyId: mockFamilyId,
          userId: mockUserId,
          role: 'ORGANIZER',
        },
      });
    });

    it('邀请码冲突时应该重试生成', async () => {
      // 第一次生成 → 冲突，第二次 → 不冲突
      mockPrisma.family.findUnique
        .mockResolvedValueOnce({ id: 'existing' }) // 冲突
        .mockResolvedValueOnce(null); // 不冲突
      mockPrisma.family.create.mockResolvedValue(mockFamily);
      mockPrisma.familyMember.create.mockResolvedValue({});

      const result = await service.createFamily(mockUserId, { name: 'test' });

      expect(result).toBeDefined();
      expect(mockPrisma.family.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  // ═══════════════════════════════════════════
  // 我的家庭列表
  // ═══════════════════════════════════════════

  describe('getMyFamilies', () => {
    it('应该返回用户所在的所有家庭', async () => {
      mockPrisma.familyMember.findMany.mockResolvedValue([
        {
          role: 'ORGANIZER',
          family: {
            id: mockFamilyId,
            name: '幸福的三口之家',
            _count: { members: 3 },
          },
        },
        {
          role: 'MEMBER',
          family: {
            id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
            name: '老爸老妈的家',
            _count: { members: 2 },
          },
        },
      ]);

      const result = await service.getMyFamilies(mockUserId);

      expect(result).toEqual([
        {
          id: mockFamilyId,
          name: '幸福的三口之家',
          role: 'ORGANIZER',
          memberCount: 3,
        },
        {
          id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          name: '老爸老妈的家',
          role: 'MEMBER',
          memberCount: 2,
        },
      ]);
    });

    it('用户没有加入任何家庭时应返回空数组', async () => {
      mockPrisma.familyMember.findMany.mockResolvedValue([]);

      const result = await service.getMyFamilies(mockUserId);

      expect(result).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════
  // 家庭详情
  // ═══════════════════════════════════════════

  describe('getFamilyDetail', () => {
    it('应该返回家庭详情', async () => {
      mockPrisma.family.findUnique.mockResolvedValue(mockFamily);

      const result = await service.getFamilyDetail(mockFamilyId);

      expect(result).toEqual({
        id: mockFamilyId,
        name: '幸福的三口之家',
        inviteCode: 'ABC123',
        createdBy: mockUserId,
        createdAt: expect.any(Date),
      });
    });

    it('家庭不存在时应抛出异常', async () => {
      mockPrisma.family.findUnique.mockResolvedValue(null);

      await expect(service.getFamilyDetail('non-existent-id')).rejects.toThrow(BusinessException);
      await expect(service.getFamilyDetail('non-existent-id')).rejects.toMatchObject({
        errorCode: ErrorCode.FAMILY_NOT_FOUND,
      });
    });
  });

  // ═══════════════════════════════════════════
  // 成员列表
  // ═══════════════════════════════════════════

  describe('getMembers', () => {
    it('应该返回家庭成员列表（含用户信息）', async () => {
      mockPrisma.familyMember.findMany.mockResolvedValue([
        {
          id: 'member-001',
          role: 'ORGANIZER',
          reminderEnabled: true,
          joinedAt: new Date('2026-06-10T10:00:00Z'),
          user: {
            id: mockUserId,
            nickname: '小明妈妈',
            avatarUrl: 'https://avatar1.jpg',
          },
        },
        {
          id: 'member-002',
          role: 'MEMBER',
          reminderEnabled: true,
          joinedAt: new Date('2026-06-10T11:00:00Z'),
          user: {
            id: 'user-002',
            nickname: '小明爸爸',
            avatarUrl: 'https://avatar2.jpg',
          },
        },
        {
          id: 'member-003',
          role: 'CHILD',
          reminderEnabled: false,
          joinedAt: new Date('2026-06-10T12:00:00Z'),
          user: {
            id: 'user-003',
            nickname: '小明',
            avatarUrl: null,
          },
        },
      ]);

      const result = await service.getMembers(mockFamilyId);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: 'member-001',
        userId: mockUserId,
        nickname: '小明妈妈',
        avatarUrl: 'https://avatar1.jpg',
        role: 'ORGANIZER',
        reminderEnabled: true,
        joinedAt: expect.any(Date),
      });
      expect(result[2]!.role).toBe('CHILD');
    });
  });

  // ═══════════════════════════════════════════
  // 加入家庭
  // ═══════════════════════════════════════════

  describe('joinFamily', () => {
    it('应该通过有效邀请码加入家庭', async () => {
      mockPrisma.invitation.findFirst.mockResolvedValue(mockInvitation);
      mockPrisma.familyMember.findUnique.mockResolvedValue(null); // 不是已有成员
      mockPrisma.familyMember.create.mockResolvedValue({
        id: mockMemberId,
        familyId: mockFamilyId,
        userId: 'new-user-002',
        role: 'MEMBER',
      });

      const result = await service.joinFamily('new-user-002', { code: 'XYZ789' });

      expect(result).toEqual({
        familyId: mockFamilyId,
        familyName: '幸福的三口之家',
        role: 'MEMBER',
      });
      expect(mockPrisma.familyMember.create).toHaveBeenCalledWith({
        data: {
          familyId: mockFamilyId,
          userId: 'new-user-002',
          role: 'MEMBER',
        },
      });
    });

    it('无效邀请码时应抛出异常', async () => {
      mockPrisma.invitation.findFirst.mockResolvedValue(null);

      await expect(
        service.joinFamily(mockUserId, { code: 'INVALID' }),
      ).rejects.toThrow(BusinessException);

      await expect(
        service.joinFamily(mockUserId, { code: 'INVALID' }),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.INVITE_CODE_INVALID,
      });
    });

    it('已是家庭成员时应抛出异常', async () => {
      mockPrisma.invitation.findFirst.mockResolvedValue(mockInvitation);
      mockPrisma.familyMember.findUnique.mockResolvedValue({
        id: mockMemberId,
        familyId: mockFamilyId,
        userId: mockUserId,
        role: 'MEMBER',
      });

      await expect(
        service.joinFamily(mockUserId, { code: 'XYZ789' }),
      ).rejects.toThrow(BusinessException);

      await expect(
        service.joinFamily(mockUserId, { code: 'XYZ789' }),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.ALREADY_FAMILY_MEMBER,
      });
    });
  });

  // ═══════════════════════════════════════════
  // 移除成员
  // ═══════════════════════════════════════════

  describe('removeMember', () => {
    it('应该成功移除成员', async () => {
      mockPrisma.familyMember.findUnique.mockResolvedValue({
        id: 'member-to-remove',
        familyId: mockFamilyId,
        userId: 'user-to-remove',
        role: 'MEMBER',
      });
      mockPrisma.familyMember.delete.mockResolvedValue({});

      await service.removeMember(mockFamilyId, 'member-to-remove', mockUserId);

      expect(mockPrisma.familyMember.delete).toHaveBeenCalledWith({
        where: { id: 'member-to-remove' },
      });
    });

    it('成员不属于该家庭时应抛出异常', async () => {
      mockPrisma.familyMember.findUnique.mockResolvedValue(null);

      await expect(
        service.removeMember(mockFamilyId, 'bad-member', mockUserId),
      ).rejects.toThrow(BusinessException);
    });

    it('不能移除自己', async () => {
      mockPrisma.familyMember.findUnique.mockResolvedValue({
        id: 'member-self',
        familyId: mockFamilyId,
        userId: mockUserId, // 与操作者相同
        role: 'ORGANIZER',
      });

      await expect(
        service.removeMember(mockFamilyId, 'member-self', mockUserId),
      ).rejects.toThrow(BusinessException);
    });
  });

  // ═══════════════════════════════════════════
  // 生成邀请码
  // ═══════════════════════════════════════════

  describe('createInvitation', () => {
    it('应该创建邀请码（默认 72 小时）', async () => {
      mockPrisma.family.findUnique.mockResolvedValue(null); // code 不冲突
      mockPrisma.invitation.create.mockResolvedValue(mockInvitation);

      const result = await service.createInvitation(mockFamilyId, mockUserId, {});

      expect(result).toEqual({
        id: mockInvitationId,
        code: 'XYZ789',
        expiresAt: expect.any(Date),
        inviteUrl: expect.stringContaining('XYZ789'),
      });
      expect(mockPrisma.invitation.create).toHaveBeenCalled();
    });

    it('应该支持自定义有效期', async () => {
      mockPrisma.family.findUnique.mockResolvedValue(null);
      mockPrisma.invitation.create.mockResolvedValue({
        ...mockInvitation,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });

      const result = await service.createInvitation(mockFamilyId, mockUserId, {
        expiresInHours: 48,
      });

      expect(result.expiresAt).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════
  // 任务统计
  // ═══════════════════════════════════════════

  describe('getTaskStats', () => {
    it('应该返回每个成员的待办数和本周完成数', async () => {
      mockPrisma.familyMember.findMany.mockResolvedValue([
        {
          userId: mockUserId,
          user: {
            id: mockUserId,
            nickname: '小明妈妈',
            avatarUrl: 'https://avatar1.jpg',
          },
        },
        {
          userId: 'user-002',
          user: {
            id: 'user-002',
            nickname: '小明爸爸',
            avatarUrl: 'https://avatar2.jpg',
          },
        },
      ]);

      // 为每个成员的两次 count 查询返回不同值
      mockPrisma.task.count
        .mockResolvedValueOnce(2)  // 小明妈妈 pendingCount
        .mockResolvedValueOnce(5)  // 小明妈妈 weeklyCompletedCount
        .mockResolvedValueOnce(3)  // 小明爸爸 pendingCount
        .mockResolvedValueOnce(2); // 小明爸爸 weeklyCompletedCount

      const result = await service.getTaskStats(mockFamilyId);

      expect(result.members).toHaveLength(2);
      expect(result.members[0]).toEqual({
        userId: mockUserId,
        nickname: '小明妈妈',
        avatarUrl: 'https://avatar1.jpg',
        pendingCount: 2,
        weeklyCompletedCount: 5,
      });
      expect(result.members[1]).toEqual({
        userId: 'user-002',
        nickname: '小明爸爸',
        avatarUrl: 'https://avatar2.jpg',
        pendingCount: 3,
        weeklyCompletedCount: 2,
      });
    });

    it('家庭成员为空时应返回空数组', async () => {
      mockPrisma.familyMember.findMany.mockResolvedValue([]);

      const result = await service.getTaskStats(mockFamilyId);

      expect(result).toEqual({ members: [] });
    });
  });
});
