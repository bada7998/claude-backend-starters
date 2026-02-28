import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostsDto } from './dto/paginate-posts.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('게시글 (Posts)')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: '게시글 목록 조회 (공개)',
    description: '페이지네이션 및 검색 지원',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: '게시글 목록 + 페이지네이션 메타 반환' })
  findAll(@Query() query: PaginatePostsDto) {
    return this.postsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '특정 게시글 조회 (공개)' })
  @ApiResponse({ status: 200, description: '게시글 반환' })
  @ApiResponse({ status: 404, description: '게시글 없음' })
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '게시글 생성 (인증 필요)' })
  @ApiResponse({ status: 201, description: '생성된 게시글 반환' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  create(
    @Body() dto: CreatePostDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.create(dto, userId);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '게시글 수정 (작성자 또는 관리자)' })
  @ApiResponse({ status: 200, description: '수정된 게시글 반환' })
  @ApiResponse({ status: 403, description: '권한 없음 (작성자 또는 관리자만 수정 가능)' })
  @ApiResponse({ status: 404, description: '게시글 없음' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.postsService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '게시글 삭제 (작성자 또는 관리자)' })
  @ApiResponse({ status: 200, description: '삭제 완료' })
  @ApiResponse({ status: 403, description: '권한 없음 (작성자 또는 관리자만 삭제 가능)' })
  @ApiResponse({ status: 404, description: '게시글 없음' })
  remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.postsService.remove(id, currentUser);
  }
}
