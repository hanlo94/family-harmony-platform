import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * 驳回任务（仅 ORGANIZER，需填写原因）
 */
export class RejectTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
