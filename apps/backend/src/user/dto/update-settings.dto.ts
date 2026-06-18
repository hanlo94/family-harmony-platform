import { IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 更新用户提醒设置（按家庭维度）
 */
export class UpdateUserSettingsDto {
  @ApiProperty({ description: '家庭 ID', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  familyId: string;

  @ApiProperty({ description: '是否开启微信提醒', example: true })
  @IsBoolean()
  reminderEnabled: boolean;
}
