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
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsInt()
  @Min(1)
  @Max(5)
  difficulty: number = 1;

  @IsDateString()
  deadline: string;

  /** 执行人用户ID（必填，v1.1 不再支持待分配） */
  @IsUUID()
  assignedTo: string;

  /** 重复规则 */
  @IsOptional()
  @IsEnum(RepeatRule)
  repeatRule?: RepeatRule = RepeatRule.NONE;

  /** 是否需要组织者验收 */
  @IsOptional()
  @IsBoolean()
  needsVerification?: boolean = false;
}
