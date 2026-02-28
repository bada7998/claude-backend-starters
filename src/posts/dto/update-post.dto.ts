import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdatePostDto {
  @ApiPropertyOptional({ example: '수정된 제목', description: '게시글 제목' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: '수정된 내용', description: '게시글 내용' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiPropertyOptional({ example: true, description: '공개 여부' })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
