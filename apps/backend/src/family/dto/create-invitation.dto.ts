import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 生成邀请码（可选指定有效期小时数，默认 24h）
 */
export class CreateInvitationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expiresInHours?: number = 24;
}
