import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCode } from '../../common/constants/error-code';
import { BusinessException } from '../../common/exceptions/business.exception';

/**
 * 家庭成员守卫
 *
 * 检查当前用户是否是指定家庭的成员（任意角色）。
 * 与 JwtAuthGuard 配合使用，确保用户先通过 JWT 认证。
 *
 * 执行逻辑：
 * 1. 从 request.user 获取当前用户 ID
 * 2. 从 request.params 获取 familyId（支持 :familyId 或 :id 参数）
 * 3. 查询 family_members 表验证成员关系
 * 4. 将成员信息挂载到 request.familyMember 供下游使用
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, FamilyMemberGuard)
 * @Get('families/:familyId/members')
 * async getMembers() { ... }
 * ```
 */
@Injectable()
export class FamilyMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const familyId = request.params?.familyId || request.params?.id;

    // 未登录
    if (!userId) {
      throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }

    // 无家庭参数（非家庭作用域接口），放行
    if (!familyId) {
      return true;
    }

    // 查询成员关系
    const membership = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: { familyId, userId },
      },
    });

    if (!membership) {
      throw new BusinessException(ErrorCode.NOT_FAMILY_MEMBER);
    }

    // 挂载成员信息到 request，便于后续使用（如获取角色）
    (request as any).familyMember = membership;

    return true;
  }
}
