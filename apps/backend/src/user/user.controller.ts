import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserSettingsDto } from './dto/update-settings.dto';
import type { CurrentUserInfo } from '../auth/types/auth.types';

/**
 * User 控制器
 *
 * 提供当前用户信息查询、资料更新、提醒设置管理 4 个端点。
 * 所有端点均需登录（JWT 认证）。
 * 路由前缀：/api/users（由 main.ts 的全局前缀 + 本控制器路径组成）
 */
@ApiTags('Users - 用户')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取当前登录用户信息
   *
   * 返回用户基本资料及其所属的家庭列表（含角色）。
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  async getMe(@CurrentUser() user: CurrentUserInfo) {
    return this.userService.getCurrentUser(user.id);
  }

  /**
   * 更新当前用户资料
   *
   * 支持部分更新（只传需要修改的字段）。
   * 可更新字段：nickname、avatarUrl。
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新当前用户资料' })
  @ApiBody({ type: UpdateUserDto })
  async updateProfile(
    @CurrentUser() user: CurrentUserInfo,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateProfile(user.id, dto);
  }

  /**
   * 获取当前用户的提醒设置
   *
   * 返回用户在各家庭下的提醒开关状态列表。
   */
  @Get('me/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取提醒设置' })
  async getSettings(@CurrentUser() user: CurrentUserInfo) {
    return this.userService.getSettings(user.id);
  }

  /**
   * 更新指定家庭的提醒开关
   *
   * 用户只能修改自己在某个家庭下的提醒设置。
   */
  @Patch('me/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新提醒设置' })
  @ApiBody({ type: UpdateUserSettingsDto })
  async updateSettings(
    @CurrentUser() user: CurrentUserInfo,
    @Body() dto: UpdateUserSettingsDto,
  ) {
    return this.userService.updateSettings(user.id, dto);
  }
}
