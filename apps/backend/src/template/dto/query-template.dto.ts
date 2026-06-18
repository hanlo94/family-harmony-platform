import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 任务模板查询参数
 */
export class QueryTemplateDto {
  @ApiPropertyOptional({ description: '按分类筛选，如"厨房"、"清洁"、"洗衣"、"整理"、"宠物"、"其他"', example: '厨房' })
  /** 按分类筛选（可选），如 "厨房"、"客厅"、"日常" */
  @IsOptional()
  @IsString()
  category?: string;
}
