import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Auth 模块
 *
 * 提供：
 * - JWT 认证（@nestjs/jwt + passport-jwt）
 * - 微信 OAuth 登录（H5 + 小程序）
 * - Token 签发 / 刷新
 * - 三角色权限守卫（RolesGuard）
 *
 * JWT 配置通过 ConfigService 从环境变量读取。
 */
@Module({
  imports: [
    // Passport 模块（注册 passport 中间件）
    PassportModule,
    // JWT 模块（异步注册，从 ConfigService 读取密钥）
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: 7200, // 默认 2 小时
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, JwtStrategy],
})
export class AuthModule {}
