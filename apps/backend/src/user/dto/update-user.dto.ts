import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 更新用户资料
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ description: '用户昵称', maxLength: 50, example: '小明妈妈' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiPropertyOptional({ description: '头像 URL', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  @IsUrl()
  avatarUrl?: string;
}
