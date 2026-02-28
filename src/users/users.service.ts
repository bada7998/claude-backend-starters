import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

type SafeUser = Omit<User, 'passwordHash' | 'refreshToken'>;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<SafeUser[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: false,
        refreshToken: false,
      },
    }) as Promise<SafeUser[]>;
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: false,
        refreshToken: false,
      },
    });

    if (!user) {
      throw new NotFoundException(`ID ${id}인 사용자를 찾을 수 없습니다`);
    }

    return user as SafeUser;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    requestingUser: User,
  ): Promise<SafeUser> {
    await this.findOne(id);

    if (requestingUser.id !== id && requestingUser.role !== Role.ADMIN) {
      throw new ForbiddenException('본인의 정보만 수정할 수 있습니다');
    }

    if (dto.username) {
      const existing = await this.prisma.user.findFirst({
        where: { username: dto.username, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('이미 사용 중인 사용자명입니다');
      }
    }

    const updateData: Partial<User> = {};

    if (dto.username) {
      updateData.username = dto.username;
    }

    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: false,
        refreshToken: false,
      },
    });

    return updated as SafeUser;
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.user.delete({ where: { id } });

    return { message: `사용자(ID: ${id})가 삭제되었습니다` };
  }
}
