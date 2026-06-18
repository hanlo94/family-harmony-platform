import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 微信登录请求
 * 支持 H5 和小程序两种渠道
 */
export class LoginDto {
  @ApiProperty({ description: '微信 OAuth 授权 code（H5）或 uni.login 返回的 code（小程序）', example: '081x0y0w3a2P1P4T0XwO3eAq7Y0x0y0Z' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
