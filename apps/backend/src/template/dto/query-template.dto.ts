import { IsOptional, IsString } from 'class-validator';

/**
 * 任务模板查询参数
 */
export class QueryTemplateDto {
  /** 按分类筛选（可选），如 "厨房"、"客厅"、"日常" */
  @IsOptional()
  @IsString()
  category?: string;
}
