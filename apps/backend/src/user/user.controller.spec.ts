import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('UserController', () => {
  let controller: UserController;

  // ── Mock 用户信息 ──
  const mockUserInfo = {
    id: '11111111-1111-1111-1111-111111111111',
    nickname: '爸爸',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=dad',
    families: [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: '幸福的三口之家',
        role: 'ORGANIZER',
      },
    ],
  };

  // ── Mock 提醒设置 ──
  const mockSettings = {
    settings: [
      {
        familyId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        familyName: '幸福的三口之家',
        reminderEnabled: true,
      },
    ],
  };

  const mockUpdateResult = {
    familyId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    reminderEnabled: false,
  };

  // ── Mock UserService ──
  const mockUserService = {
    getCurrentUser: jest.fn(),
    updateProfile: jest.fn(),
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
  };

  // ── Mock CurrentUser ──
  const currentUser = { id: '11111111-1111-1111-1111-111111111111' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    })
      // 跳过 JwtAuthGuard 的依赖注入
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ═══════════════════════════════════════════
  // 获取当前用户信息
  // ═══════════════════════════════════════════

  describe('getMe', () => {
    it('应该调用 userService.getCurrentUser 并返回用户信息', async () => {
      mockUserService.getCurrentUser.mockResolvedValue(mockUserInfo);

      const result = await controller.getMe(currentUser);

      expect(mockUserService.getCurrentUser).toHaveBeenCalledWith(currentUser.id);
      expect(result).toEqual(mockUserInfo);
    });
  });

  // ═══════════════════════════════════════════
  // 更新用户资料
  // ═══════════════════════════════════════════

  describe('updateProfile', () => {
    it('应该调用 userService.updateProfile 并返回更新后的用户', async () => {
      const updated = {
        id: currentUser.id,
        nickname: '新昵称',
        avatarUrl: mockUserInfo.avatarUrl,
      };
      mockUserService.updateProfile.mockResolvedValue(updated);

      const dto = { nickname: '新昵称' };
      const result = await controller.updateProfile(currentUser, dto);

      expect(mockUserService.updateProfile).toHaveBeenCalledWith(currentUser.id, dto);
      expect(result).toEqual(updated);
    });
  });

  // ═══════════════════════════════════════════
  // 获取提醒设置
  // ═══════════════════════════════════════════

  describe('getSettings', () => {
    it('应该调用 userService.getSettings 并返回设置列表', async () => {
      mockUserService.getSettings.mockResolvedValue(mockSettings);

      const result = await controller.getSettings(currentUser);

      expect(mockUserService.getSettings).toHaveBeenCalledWith(currentUser.id);
      expect(result).toEqual(mockSettings);
    });
  });

  // ═══════════════════════════════════════════
  // 更新提醒设置
  // ═══════════════════════════════════════════

  describe('updateSettings', () => {
    it('应该调用 userService.updateSettings 并返回更新结果', async () => {
      mockUserService.updateSettings.mockResolvedValue(mockUpdateResult);

      const dto = {
        familyId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        reminderEnabled: false,
      };
      const result = await controller.updateSettings(currentUser, dto);

      expect(mockUserService.updateSettings).toHaveBeenCalledWith(currentUser.id, dto);
      expect(result).toEqual(mockUpdateResult);
    });
  });
});
