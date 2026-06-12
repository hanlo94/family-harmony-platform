import { IsUUID, IsBoolean } from 'class-validator';

/**
 * 更新用户提醒设置（按家庭维度）
 */
export class UpdateUserSettingsDto {
  @IsUUID()
  familyId: string;

  @IsBoolean()
  reminderEnabled: boolean;
}
