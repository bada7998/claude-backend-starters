import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'newusername', description: '새로운 사용자명' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: '사용자명은 영문, 숫자, 언더스코어만 사용할 수 있습니다',
  })
  username?: string;

  @ApiPropertyOptional({ example: 'NewP@ss123', description: '새로운 비밀번호' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: '비밀번호는 영문 대소문자와 숫자를 각각 하나 이상 포함해야 합니다',
  })
  password?: string;
}
