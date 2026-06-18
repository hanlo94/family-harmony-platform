import { IsOptional, IsUUID, IsEnum, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum TaskStatusFilter {
  PENDING_COMPLETION = 'PENDING_COMPLETION',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * 任务列表查询参数
 */
export class ListTaskDto extends PaginationDto {
  /** 按状态筛选（可选） */
  @IsOptional()
  @IsEnum(TaskStatusFilter)
  status?: TaskStatusFilter;

  /** 按执行人筛选（可选） */
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  /** 自由搜索关键词（可选） */
  @IsOptional()
  @IsString()
  keyword?: string;

  /** 仅返回已逾期任务（status=PENDING_COMPLETION + deadline < NOW） */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  overdue?: boolean;

  /** 仅返回临近到期任务（status=PENDING_COMPLETION + deadline 在 1 小时内） */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  nearExpiry?: boolean;
}
