import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 生成邀请码（可选指定有效期小时数，默认 72h）
 */
export class CreateInvitationDto {
  @ApiPropertyOptional({ description: '邀请码有效小时数', minimum: 1, default: 72, example: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expiresInHours?: number = 72;
}
