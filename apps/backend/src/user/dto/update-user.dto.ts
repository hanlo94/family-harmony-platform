import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

/**
 * 更新用户资料
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  avatarUrl?: string;
}
