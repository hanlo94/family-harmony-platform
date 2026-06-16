import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

/**
 * User 模块
 *
 * 提供：
 * - 用户信息查询（GET /users/me）
 * - 用户资料更新（PATCH /users/me）
 * - 提醒设置读写（GET/PATCH /users/me/settings）
 *
 * 依赖 Auth 模块提供的 JWT 认证守卫和 CurrentUser 装饰器。
 * PrismaService 通过全局 PrismaModule 注入，无需额外导入。
 */
@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
