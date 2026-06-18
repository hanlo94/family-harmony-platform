import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建家庭
 */
export class CreateFamilyDto {
  @ApiProperty({ description: '家庭名称', maxLength: 64, example: '幸福的三口之家' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;
}
