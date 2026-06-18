import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 取消任务
 */
export class CancelTaskDto {
  @ApiPropertyOptional({ description: '取消原因', maxLength: 500, example: '今天外出吃饭，无需洗碗' })
  /** 取消原因（可选） */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;
}
