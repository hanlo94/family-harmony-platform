import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { FamilyService } from './family.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FamilyMemberGuard } from './guards/family-member.guard';
import { CreateFamilyDto } from './dto/create-family.dto';
import { JoinFamilyDto } from './dto/join-family.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import type { CurrentUserInfo } from '../auth/types/auth.types';

/**
 * Family 控制器
 *
 * 提供家庭创建、详情、成员管理、邀请码、任务统计 8 个端点。
 * 路由前缀：/api/families（由 main.ts 全局前缀 + 本控制器路径组成）
 */
@ApiTags('Families - 家庭')
@Controller('families')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  // ═══════════════════════════════════════════
  // 创建家庭
  // ═══════════════════════════════════════════

  /**
   * 创建家庭
   *
   * 创建者自动成为 ORGANIZER。任意登录用户均可创建。
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建家庭' })
  @ApiBody({ type: CreateFamilyDto })
  async createFamily(
    @CurrentUser() user: CurrentUserInfo,
    @Body() dto: CreateFamilyDto,
  ) {
    return this.familyService.createFamily(user.id, dto);
  }

  // ═══════════════════════════════════════════
  // 我的家庭列表
  // ═══════════════════════════════════════════

  /**
   * 获取当前用户所属的家庭列表
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的家庭列表' })
  async getMyFamilies(@CurrentUser() user: CurrentUserInfo) {
    return this.familyService.getMyFamilies(user.id);
  }

  // ═══════════════════════════════════════════
  // 加入家庭（必须在详情路由之前，避免 'join' 被当作 :familyId）
  // ═══════════════════════════════════════════

  /**
   * 通过邀请码加入家庭
   *
   * 路由：POST /api/families/join（非 :familyId 子路由）
   */
  @Post('join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '通过邀请码加入家庭' })
  @ApiBody({ type: JoinFamilyDto })
  async joinFamily(
    @CurrentUser() user: CurrentUserInfo,
    @Body() dto: JoinFamilyDto,
  ) {
    return this.familyService.joinFamily(user.id, dto);
  }

  // ═══════════════════════════════════════════
  // 家庭详情
  // ═══════════════════════════════════════════

  /**
   * 获取家庭详情
   *
   * 需要是该家庭的成员（任意角色）。
   */
  @Get(':familyId')
  @UseGuards(JwtAuthGuard, FamilyMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取家庭详情' })
  @ApiParam({ name: 'familyId', description: '家庭 ID', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  async getFamilyDetail(@Param('familyId') familyId: string) {
    return this.familyService.getFamilyDetail(familyId);
  }

  // ═══════════════════════════════════════════
  // 成员列表
  // ═══════════════════════════════════════════

  /**
   * 获取家庭成员列表
   *
   * 需要是该家庭的成员（任意角色）。
   */
  @Get(':familyId/members')
  @UseGuards(JwtAuthGuard, FamilyMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取家庭成员列表' })
  @ApiParam({ name: 'familyId', description: '家庭 ID', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  async getMembers(@Param('familyId') familyId: string) {
    return this.familyService.getMembers(familyId);
  }

  // ═══════════════════════════════════════════
  // 生成邀请码
  // ═══════════════════════════════════════════

  /**
   * 生成新的邀请码
   *
   * 仅 ORGANIZER 可操作。
   */
  @Post(':familyId/invitations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberRole.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '生成邀请码' })
  @ApiParam({ name: 'familyId', description: '家庭 ID', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  async createInvitation(
    @CurrentUser() user: CurrentUserInfo,
    @Param('familyId') familyId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.familyService.createInvitation(familyId, user.id, dto);
  }

  // ═══════════════════════════════════════════
  // 移除成员
  // ═══════════════════════════════════════════

  /**
   * 移除家庭成员
   *
   * 仅 ORGANIZER 可操作，且不能移除自己。
   */
  @Delete(':familyId/members/:memberId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberRole.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '移除家庭成员' })
  @ApiParam({ name: 'familyId', description: '家庭 ID', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiParam({ name: 'memberId', description: '成员 ID（family_members 表主键）', format: 'uuid', example: '660e8400-e29b-41d4-a716-446655440001' })
  async removeMember(
    @CurrentUser() user: CurrentUserInfo,
    @Param('familyId') familyId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.familyService.removeMember(familyId, memberId, user.id);
    return { message: 'ok' };
  }

  // ═══════════════════════════════════════════
  // 任务统计
  // ═══════════════════════════════════════════

  /**
   * 获取家庭任务轻量统计
   *
   * 需要是该家庭的成员（任意角色）。
   * 返回每个成员的当前待办数和本周完成数。
   */
  @Get(':familyId/tasks/stats')
  @UseGuards(JwtAuthGuard, FamilyMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取家庭任务统计' })
  @ApiParam({ name: 'familyId', description: '家庭 ID', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  async getTaskStats(@Param('familyId') familyId: string) {
    return this.familyService.getTaskStats(familyId);
  }
}
