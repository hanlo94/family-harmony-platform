import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 刷新访问令牌请求
 */
export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
