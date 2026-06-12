import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 微信登录请求
 * 支持 H5 和小程序两种渠道
 */
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
