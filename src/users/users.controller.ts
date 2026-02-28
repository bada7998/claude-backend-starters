import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('사용자 (Users)')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '전체 사용자 목록 조회 (관리자 전용)' })
  @ApiResponse({ status: 200, description: '사용자 목록 반환' })
  @ApiResponse({ status: 403, description: '권한 없음 (관리자만 접근 가능)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 사용자 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 반환' })
  @ApiResponse({ status: 404, description: '사용자 없음' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '사용자 정보 수정 (본인만 가능)' })
  @ApiResponse({ status: 200, description: '수정된 사용자 정보 반환' })
  @ApiResponse({ status: 403, description: '권한 없음 (본인만 수정 가능)' })
  @ApiResponse({ status: 404, description: '사용자 없음' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 삭제 (관리자 전용)' })
  @ApiResponse({ status: 200, description: '삭제 완료' })
  @ApiResponse({ status: 403, description: '권한 없음 (관리자만 삭제 가능)' })
  @ApiResponse({ status: 404, description: '사용자 없음' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
