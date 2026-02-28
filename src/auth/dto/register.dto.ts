import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: '이메일 주소' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email: string;

  @ApiProperty({ example: 'johndoe', description: '사용자명 (3-20자, 영문/숫자/언더스코어)' })
  @IsString()
  @MinLength(3, { message: '사용자명은 최소 3자 이상이어야 합니다' })
  @MaxLength(20, { message: '사용자명은 최대 20자까지 가능합니다' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: '사용자명은 영문, 숫자, 언더스코어만 사용할 수 있습니다',
  })
  username: string;

  @ApiProperty({ example: 'StrongP@ss1', description: '비밀번호 (8자 이상, 대소문자+숫자 포함)' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  @MaxLength(100, { message: '비밀번호는 최대 100자까지 가능합니다' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: '비밀번호는 영문 대소문자와 숫자를 각각 하나 이상 포함해야 합니다',
  })
  password: string;
}
