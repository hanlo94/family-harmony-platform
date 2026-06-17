import { Test, TestingModule } from '@nestjs/testing';
import { FamilyController } from './family.controller';
import { FamilyService } from './family.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FamilyMemberGuard } from './guards/family-member.guard';

describe('FamilyController', () => {
  let controller: FamilyController;

  // ── Mock 数据 ──
  const mockUserId = '11111111-1111-1111-1111-111111111111';
  const mockFamilyId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const currentUser = { id: mockUserId };

  const mockFamilyResponse = {
    id: mockFamilyId,
    name: '幸福的三口之家',
    inviteCode: 'ABC123',
    createdBy: mockUserId,
    createdAt: new Date('2026-06-10T10:00:00Z'),
  };

  const mockInvitationResponse = {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    code: 'XYZ789',
    expiresAt: new Date('2026-06-13T10:00:00Z'),
    inviteUrl: 'https://your-domain.com/invite?code=XYZ789',
  };

  const mockStatsResponse = {
    members: [
      {
        userId: mockUserId,
        nickname: '小明妈妈',
        avatarUrl: null,
        pendingCount: 2,
        weeklyCompletedCount: 5,
      },
    ],
  };

  // ── Mock FamilyService ──
  const mockFamilyService = {
    createFamily: jest.fn(),
    getMyFamilies: jest.fn(),
    getFamilyDetail: jest.fn(),
    getMembers: jest.fn(),
    joinFamily: jest.fn(),
    createInvitation: jest.fn(),
    removeMember: jest.fn(),
    getTaskStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FamilyController],
      providers: [{ provide: FamilyService, useValue: mockFamilyService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(FamilyMemberGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FamilyController>(FamilyController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ═══════════════════════════════════════════
  // 创建家庭
  // ═══════════════════════════════════════════

  describe('createFamily', () => {
    it('应该调用 familyService.createFamily 并返回创建结果', async () => {
      mockFamilyService.createFamily.mockResolvedValue(mockFamilyResponse);

      const dto = { name: '幸福的三口之家' };
      const result = await controller.createFamily(currentUser, dto);

      expect(mockFamilyService.createFamily).toHaveBeenCalledWith(mockUserId, dto);
      expect(result).toEqual(mockFamilyResponse);
    });
  });

  // ═══════════════════════════════════════════
  // 我的家庭列表
  // ═══════════════════════════════════════════

  describe('getMyFamilies', () => {
    it('应该调用 familyService.getMyFamilies 并返回家庭列表', async () => {
      const families = [
        { id: mockFamilyId, name: '幸福的三口之家', role: 'ORGANIZER', memberCount: 3 },
      ];
      mockFamilyService.getMyFamilies.mockResolvedValue(families);

      const result = await controller.getMyFamilies(currentUser);

      expect(mockFamilyService.getMyFamilies).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(families);
    });
  });

  // ═══════════════════════════════════════════
  // 加入家庭
  // ═══════════════════════════════════════════

  describe('joinFamily', () => {
    it('应该调用 familyService.joinFamily 并返回加入结果', async () => {
      const joinResult = {
        familyId: mockFamilyId,
        familyName: '幸福的三口之家',
        role: 'MEMBER' as const,
      };
      mockFamilyService.joinFamily.mockResolvedValue(joinResult);

      const dto = { code: 'XYZ789' };
      const result = await controller.joinFamily(currentUser, dto);

      expect(mockFamilyService.joinFamily).toHaveBeenCalledWith(mockUserId, dto);
      expect(result).toEqual(joinResult);
    });
  });

  // ═══════════════════════════════════════════
  // 家庭详情
  // ═══════════════════════════════════════════

  describe('getFamilyDetail', () => {
    it('应该调用 familyService.getFamilyDetail 并返回家庭信息', async () => {
      mockFamilyService.getFamilyDetail.mockResolvedValue(mockFamilyResponse);

      const result = await controller.getFamilyDetail(mockFamilyId);

      expect(mockFamilyService.getFamilyDetail).toHaveBeenCalledWith(mockFamilyId);
      expect(result).toEqual(mockFamilyResponse);
    });
  });

  // ═══════════════════════════════════════════
  // 成员列表
  // ═══════════════════════════════════════════

  describe('getMembers', () => {
    it('应该调用 familyService.getMembers 并返回成员列表', async () => {
      const members = [
        {
          id: 'member-001',
          userId: mockUserId,
          nickname: '小明妈妈',
          avatarUrl: null,
          role: 'ORGANIZER',
          reminderEnabled: true,
          joinedAt: new Date(),
        },
      ];
      mockFamilyService.getMembers.mockResolvedValue(members);

      const result = await controller.getMembers(mockFamilyId);

      expect(mockFamilyService.getMembers).toHaveBeenCalledWith(mockFamilyId);
      expect(result).toEqual(members);
    });
  });

  // ═══════════════════════════════════════════
  // 生成邀请码
  // ═══════════════════════════════════════════

  describe('createInvitation', () => {
    it('应该调用 familyService.createInvitation 并返回邀请码', async () => {
      mockFamilyService.createInvitation.mockResolvedValue(mockInvitationResponse);

      const dto = {};
      const result = await controller.createInvitation(currentUser, mockFamilyId, dto);

      expect(mockFamilyService.createInvitation).toHaveBeenCalledWith(
        mockFamilyId,
        mockUserId,
        dto,
      );
      expect(result).toEqual(mockInvitationResponse);
    });
  });

  // ═══════════════════════════════════════════
  // 移除成员
  // ═══════════════════════════════════════════

  describe('removeMember', () => {
    it('应该调用 familyService.removeMember 并返回成功', async () => {
      mockFamilyService.removeMember.mockResolvedValue(undefined);

      const result = await controller.removeMember(
        currentUser,
        mockFamilyId,
        'member-to-remove',
      );

      expect(mockFamilyService.removeMember).toHaveBeenCalledWith(
        mockFamilyId,
        'member-to-remove',
        mockUserId,
      );
      expect(result).toEqual({ message: 'ok' });
    });
  });

  // ═══════════════════════════════════════════
  // 任务统计
  // ═══════════════════════════════════════════

  describe('getTaskStats', () => {
    it('应该调用 familyService.getTaskStats 并返回统计结果', async () => {
      mockFamilyService.getTaskStats.mockResolvedValue(mockStatsResponse);

      const result = await controller.getTaskStats(mockFamilyId);

      expect(mockFamilyService.getTaskStats).toHaveBeenCalledWith(mockFamilyId);
      expect(result).toEqual(mockStatsResponse);
    });
  });
});
