import { IsOptional, IsUUID, IsEnum, IsString } from 'class-validator';
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
}
