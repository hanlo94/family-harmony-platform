import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 标记任务完成（提交验收或直接完成）
 */
export class CompleteTaskDto {
  @ApiPropertyOptional({ description: '完成备注', maxLength: 500, example: '已全部清洗并消毒' })
  /** 完成备注（可选） */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  completionNote?: string | null;

  @ApiPropertyOptional({ description: '完成照片 URL（先通过 POST /api/upload/image 上传获取）', example: '/uploads/2026/06/abc123.jpg' })
  /** 完成照片 URL（可选，先通过 POST /api/upload/image 获取） */
  @IsOptional()
  @IsString()
  completionPhoto?: string | null;
}
