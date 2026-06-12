import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * 标记任务完成（提交验收或直接完成）
 */
export class CompleteTaskDto {
  /** 完成备注（可选） */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  completionNote?: string | null;

  /** 完成照片 URL（可选，先通过 POST /api/upload/image 获取） */
  @IsOptional()
  @IsString()
  completionPhoto?: string | null;
}
