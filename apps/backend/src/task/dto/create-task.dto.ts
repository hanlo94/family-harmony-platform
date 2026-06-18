import {
  IsString,
  IsNotEmpty,
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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 重复规则枚举
 */
export enum RepeatRule {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

/**
 * 创建任务请求（v1.1：assignedTo 必填，新增 repeatRule + needsVerification）
 */
export class CreateTaskDto {
  @ApiProperty({ description: '任务标题', maxLength: 200, example: '洗碗' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: '任务详细描述', example: '把厨房碗筷全部清洗干净并放入消毒柜' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ description: '难度星级（1-5）', minimum: 1, maximum: 5, default: 1, example: 2 })
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty: number = 1;

  @ApiProperty({ description: '截止时间（ISO 8601）', example: '2026-06-19T18:00:00.000Z' })
  @IsDateString()
  deadline: string;

  @ApiProperty({ description: '执行人用户 ID', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  /** 执行人用户ID（必填，v1.1 不再支持待分配） */
  @IsUUID()
  assignedTo: string;

  @ApiPropertyOptional({ description: '重复规则', enum: RepeatRule, default: RepeatRule.NONE, example: RepeatRule.NONE })
  /** 重复规则 */
  @IsOptional()
  @IsEnum(RepeatRule)
  repeatRule?: RepeatRule = RepeatRule.NONE;

  @ApiPropertyOptional({ description: '是否需要组织者验收', default: false, example: true })
  /** 是否需要组织者验收 */
  @IsOptional()
  @IsBoolean()
  needsVerification?: boolean = false;
}
