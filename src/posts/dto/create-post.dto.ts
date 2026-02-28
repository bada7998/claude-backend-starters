import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: '첫 번째 게시글', description: '게시글 제목' })
  @IsString()
  @MinLength(1, { message: '제목을 입력해주세요' })
  @MaxLength(200, { message: '제목은 최대 200자까지 가능합니다' })
  title: string;

  @ApiProperty({ example: '게시글 내용입니다.', description: '게시글 내용' })
  @IsString()
  @MinLength(1, { message: '내용을 입력해주세요' })
  content: string;

  @ApiPropertyOptional({ example: false, description: '공개 여부 (기본값: false)' })
  @IsOptional()
  @IsBoolean()
  published?: boolean = false;
}
