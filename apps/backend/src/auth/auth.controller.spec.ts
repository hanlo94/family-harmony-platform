import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';


describe('AuthController', () => {
  let controller: AuthController;

  // ── Mock 登录响应 ──
  const mockLoginResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 7200,
    user: {
      id: '11111111-1111-1111-1111-111111111111',
      nickname: '爸爸',
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=dad',
    },
  };

  // ── Mock 刷新响应 ──
  const mockRefreshResponse = {
    accessToken: 'new-access-token',
    expiresIn: 7200,
  };

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

  // ── Mock AuthService ──
  const mockAuthService = {
    wechatH5Login: jest.fn(),
    wechatMpLogin: jest.fn(),
    refreshToken: jest.fn(),
    getCurrentUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      // 跳过 JwtAuthGuard 的依赖注入
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ═══════════════════════════════════════════
  // H5 登录
  // ═══════════════════════════════════════════

  describe('wechatH5Login', () => {
    it('应该调用 authService.wechatH5Login 并返回登录响应', async () => {
      mockAuthService.wechatH5Login.mockResolvedValue(mockLoginResponse);
      const dto: LoginDto = { code: 'test_openid_user1' };

      const result = await controller.wechatH5Login(dto);

      expect(mockAuthService.wechatH5Login).toHaveBeenCalledWith('test_openid_user1');
      expect(result).toEqual(mockLoginResponse);
    });
  });

  // ═══════════════════════════════════════════
  // 小程序登录
  // ═══════════════════════════════════════════

  describe('wechatMpLogin', () => {
    it('应该调用 authService.wechatMpLogin 并返回登录响应', async () => {
      mockAuthService.wechatMpLogin.mockResolvedValue(mockLoginResponse);
      const dto: LoginDto = { code: 'test_openid_user1' };

      const result = await controller.wechatMpLogin(dto);

      expect(mockAuthService.wechatMpLogin).toHaveBeenCalledWith('test_openid_user1');
      expect(result).toEqual(mockLoginResponse);
    });
  });

  // ═══════════════════════════════════════════
  // 刷新 Token
  // ═══════════════════════════════════════════

  describe('refresh', () => {
    it('应该调用 authService.refreshToken 并返回新的 Access Token', async () => {
      mockAuthService.refreshToken.mockResolvedValue(mockRefreshResponse);
      const dto: RefreshDto = { refreshToken: 'valid-refresh-token' };

      const result = await controller.refresh(dto);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(result).toEqual(mockRefreshResponse);
    });
  });

  // ═══════════════════════════════════════════
  // 获取当前用户
  // ═══════════════════════════════════════════

  describe('getMe', () => {
    it('应该调用 authService.getCurrentUser 并返回用户信息', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUserInfo);
      const currentUser = { id: '11111111-1111-1111-1111-111111111111' };

      const result = await controller.getMe(currentUser);

      expect(mockAuthService.getCurrentUser).toHaveBeenCalledWith(currentUser.id);
      expect(result).toEqual(mockUserInfo);
    });
  });
});
