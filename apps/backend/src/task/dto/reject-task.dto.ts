import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 驳回任务（仅 ORGANIZER，需填写原因）
 */
export class RejectTaskDto {
  @ApiProperty({ description: '驳回原因', maxLength: 500, example: '碗底还有油渍，请重新清洗' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
