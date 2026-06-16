import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/constants/error-code';
import { BusinessException } from '../common/exceptions/business.exception';

describe('AuthService', () => {
  let service: AuthService;

  // ── Mock 用户数据 ──
  const mockUser = {
    id: '11111111-1111-1111-1111-111111111111',
    wechatOpenid: 'test_openid_user1',
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
      create: jest.fn(),
    },
    familyMember: {
      findUnique: jest.fn(),
    },
  };

  // ── Mock JwtService ──
  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  // ── Mock ConfigService ──
  const mockConfigService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_SECRET: 'test-jwt-secret',
        JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
        WECHAT_APP_ID: 'test-app-id',
        WECHAT_APP_SECRET: 'test-app-secret',
      };
      return values[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // 重置 mock
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════
  // 开发模式登录（test_ 前缀）
  // ═══════════════════════════════════════════

  describe('wechatH5Login - 开发模式', () => {
    it('应该用 test_ code 直接登录已有用户', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('mock-access-token')
        .mockResolvedValueOnce('mock-refresh-token');

      const result = await service.wechatH5Login('test_openid_user1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { wechatOpenid: 'test_openid_user1' },
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 7200,
        user: {
          id: mockUser.id,
          nickname: mockUser.nickname,
          avatarUrl: mockUser.avatarUrl,
        },
      });
    });

    it('应该用 test_ code 创建新用户（首次登录）', async () => {
      const newUser = {
        id: 'new-user-uuid',
        wechatOpenid: 'test_new_user',
        nickname: '用户w_user',
        avatarUrl: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(newUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('mock-access-token')
        .mockResolvedValueOnce('mock-refresh-token');

      const result = await service.wechatH5Login('test_new_user');

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          wechatOpenid: 'test_new_user',
          nickname: '用户w_user',
        },
      });
      expect(result.user.id).toBe('new-user-uuid');
    });
  });

  // ═══════════════════════════════════════════
  // 小程序登录
  // ═══════════════════════════════════════════

  describe('wechatMpLogin - 开发模式', () => {
    it('应该用 test_ code 完成小程序登录', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('mock-access-token-mp')
        .mockResolvedValueOnce('mock-refresh-token-mp');

      const result = await service.wechatMpLogin('test_openid_user1');

      expect(result.accessToken).toBe('mock-access-token-mp');
    });
  });

  // ═══════════════════════════════════════════
  // Token 刷新
  // ═══════════════════════════════════════════

  describe('refreshToken', () => {
    it('应该用有效的 Refresh Token 签发新的 Access Token', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: mockUser.id });
      mockJwtService.signAsync.mockResolvedValue('new-access-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'test-jwt-refresh-secret',
      });
      expect(result).toEqual({
        accessToken: 'new-access-token',
        expiresIn: 7200,
      });
    });

    it('Refresh Token 无效时应抛出异常', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(BusinessException);
      await expect(service.refreshToken('invalid-token')).rejects.toMatchObject({
        errorCode: ErrorCode.INVALID_TOKEN,
      });
    });
  });

  // ═══════════════════════════════════════════
  // 获取当前用户
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
});
