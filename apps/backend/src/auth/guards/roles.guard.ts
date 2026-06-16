import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ErrorCode } from '../../common/constants/error-code';
import { BusinessException } from '../../common/exceptions/business.exception';

/**
 * 角色权限守卫
 *
 * 与 @Roles() 装饰器配合使用，检查当前用户是否具备访问接口所需的家庭角色。
 *
 * 执行逻辑：
 * 1. 从 Reflector 读取 @Roles() 设置的所需角色列表
 * 2. 若未设置，放行（公开接口或不需要角色校验的接口）
 * 3. 从 request.params 提取 familyId
 * 4. 若无 familyId，放行（非家庭作用域的接口）
 * 5. 查询 family_members 表获取用户在家庭中的角色
 * 6. 比对角色是否在允许列表中
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(MemberRole.ORGANIZER)
 * @Post()
 * async createTask() { ... }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 获取接口要求的角色列表
    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. 未设置 @Roles() → 放行
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. 获取请求上下文
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const familyId = request.params?.familyId;

    // 4. 未登录 → 拒绝
    if (!userId) {
      throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }

    // 5. 无 familyId → 放行（非家庭作用域接口）
    if (!familyId) {
      this.logger.warn(`@Roles() 装饰器用在非家庭作用域接口上（缺少 :familyId 路由参数），已放行`);
      return true;
    }

    // 6. 查询用户在家庭中的角色
    const membership = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: { familyId, userId },
      },
      select: { role: true },
    });

    if (!membership) {
      throw new BusinessException(ErrorCode.NOT_FAMILY_MEMBER);
    }

    // 7. 比对角色
    if (!requiredRoles.includes(membership.role)) {
      this.logger.warn(
        `用户 ${userId} 在家庭 ${familyId} 中的角色为 ${membership.role}，` +
          `无权访问需要 ${requiredRoles.join('/')} 的接口`,
      );
      throw new BusinessException(ErrorCode.PERMISSION_DENIED, '当前角色无权执行此操作');
    }

    return true;
  }
}
