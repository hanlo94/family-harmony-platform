import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import type { CurrentUserInfo, LoginResponse, RefreshResponse } from './types/auth.types';

/**
 * Auth 控制器
 *
 * 提供微信登录、Token 刷新、用户信息查询 4 个端点。
 * 路由前缀：/api/auth（由 main.ts 的全局前缀 + 本控制器路径组成）
 */
@ApiTags('Auth - 认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 微信公众号 H5 登录
   *
   * 前端跳转微信 OAuth 获取 code 后，调用此接口换取 JWT。
   */
  @Post('wechat/h5/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '微信公众号 H5 登录' })
  @ApiBody({ type: LoginDto, description: '微信 OAuth 返回的 code' })
  async wechatH5Login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.wechatH5Login(dto.code);
  }

  /**
   * 微信小程序登录
   *
   * 前端调用 uni.login 获取 code 后，调用此接口换取 JWT。
   */
  @Post('wechat/mp/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '微信小程序登录' })
  @ApiBody({ type: LoginDto, description: 'uni.login 返回的 code' })
  async wechatMpLogin(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.wechatMpLogin(dto.code);
  }

  /**
   * 刷新 Access Token
   *
   * Access Token 过期后，使用 Refresh Token 换取新的 Access Token。
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新 Access Token' })
  @ApiBody({ type: RefreshDto, description: 'Refresh Token' })
  async refresh(@Body() dto: RefreshDto): Promise<RefreshResponse> {
    return this.authService.refreshToken(dto.refreshToken);
  }

  /**
   * 获取当前登录用户信息
   *
   * 需要在请求头中携带有效的 Access Token。
   * 返回用户基本资料及其所属的家庭列表（含角色）。
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前登录用户信息' })
  async getMe(@CurrentUser() user: CurrentUserInfo) {
    return this.authService.getCurrentUser(user.id);
  }
}
