import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * 取消任务
 */
export class CancelTaskDto {
  /** 取消原因（可选） */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;
}
