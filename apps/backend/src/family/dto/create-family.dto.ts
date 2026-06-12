import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * 创建家庭
 */
export class CreateFamilyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
