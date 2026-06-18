import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 通过邀请码加入家庭
 */
export class JoinFamilyDto {
  @ApiProperty({ description: '邀请码（6-8 位）', minLength: 6, maxLength: 8, example: 'AB3F9K' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 8)
  code: string;
}
