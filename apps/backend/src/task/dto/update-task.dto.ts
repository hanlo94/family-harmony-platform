import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RepeatRule } from './create-task.dto';

/**
 * 更新任务（所有字段可选）
 */
export class UpdateTaskDto {
  @ApiPropertyOptional({ description: '任务标题', maxLength: 200, example: '洗碗（晚餐）' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: '任务详细描述', example: '把厨房碗筷全部清洗干净' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: '难度星级（1-5）', minimum: 1, maximum: 5, example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional({ description: '截止时间（ISO 8601）', example: '2026-06-20T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ description: '执行人用户 ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiPropertyOptional({ description: '重复规则', enum: RepeatRule, example: RepeatRule.DAILY })
  @IsOptional()
  @IsEnum(RepeatRule)
  repeatRule?: RepeatRule;

  @ApiPropertyOptional({ description: '是否需要组织者验收', example: false })
  @IsOptional()
  @IsBoolean()
  needsVerification?: boolean;
}
