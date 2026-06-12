import { IsString, IsNotEmpty, Length } from 'class-validator';

/**
 * 通过邀请码加入家庭
 */
export class JoinFamilyDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 8)
  code: string;
}
