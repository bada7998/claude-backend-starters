import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostsDto } from './dto/paginate-posts.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePostDto, authorId: string) {
    return this.prisma.post.create({
      data: {
        ...dto,
        authorId,
      },
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
    });
  }

  async findAll(query: PaginatePostsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`ID ${id}인 게시글을 찾을 수 없습니다`);
    }

    return post;
  }

  async update(id: string, dto: UpdatePostDto, requestingUser: User) {
    const post = await this.findOne(id);

    if (post.authorId !== requestingUser.id && requestingUser.role !== Role.ADMIN) {
      throw new ForbiddenException('본인이 작성한 게시글만 수정할 수 있습니다');
    }

    return this.prisma.post.update({
      where: { id },
      data: dto,
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
    });
  }

  async remove(id: string, requestingUser: User): Promise<{ message: string }> {
    const post = await this.findOne(id);

    if (post.authorId !== requestingUser.id && requestingUser.role !== Role.ADMIN) {
      throw new ForbiddenException('본인이 작성한 게시글만 삭제할 수 있습니다');
    }

    await this.prisma.post.delete({ where: { id } });

    return { message: `게시글(ID: ${id})이 삭제되었습니다` };
  }
}
