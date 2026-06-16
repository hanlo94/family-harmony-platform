import { SetMetadata } from '@nestjs/common';
import { MemberRole } from '@prisma/client';

/**
 * 角色元数据 key
 *
 * RolesGuard 通过 Reflector 读取此 key 获取接口所需角色列表。
 */
export const ROLES_KEY = 'roles';

/**
 * 角色权限装饰器
 *
 * 用于标记接口需要哪些角色才能访问。
 * 与 JwtAuthGuard + RolesGuard 配合使用。
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(MemberRole.ORGANIZER)
 * @Post()
 * async createTask() { ... }
 *
 * // 允许多种角色
 * @Roles(MemberRole.ORGANIZER, MemberRole.MEMBER)
 * ```
 */
export const Roles = (...roles: MemberRole[]) => SetMetadata(ROLES_KEY, roles);
