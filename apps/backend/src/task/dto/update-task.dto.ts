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
import { RepeatRule } from './create-task.dto';

/**
 * 更新任务（所有字段可选）
 */
export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @IsEnum(RepeatRule)
  repeatRule?: RepeatRule;

  @IsOptional()
  @IsBoolean()
  needsVerification?: boolean;
}
