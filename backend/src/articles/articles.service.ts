import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';
import type { CreateArticleDto } from './dto/create-article.dto';
import type { UpdateArticleDto } from './dto/update-article.dto';

const ARTICLE_SELECT = {
  id: true,
  title: true,
  content: true,
  summary: true,
  type: true,
  serviceId: true,
  service: { select: { id: true, name: true, slug: true } },
  visibility: true,
  status: true,
  tags: true,
  authorId: true,
  author: { select: { id: true, email: true } },
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  findByService(serviceId: string) {
    return this.prisma.article.findMany({
      where: { serviceId },
      select: ARTICLE_SELECT,
      orderBy: { updatedAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.article.findMany({
      select: ARTICLE_SELECT,
      orderBy: { updatedAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.article.findUniqueOrThrow({
      where: { id },
      select: ARTICLE_SELECT,
    });
  }

  create(dto: CreateArticleDto, author: User) {
    if (!author.serviceId) throw new ForbiddenException();
    return this.prisma.article.create({
      data: { ...dto, authorId: author.id, serviceId: author.serviceId },
      select: ARTICLE_SELECT,
    });
  }

  async update(id: string, dto: UpdateArticleDto, requester: User) {
    const article = await this.prisma.article.findUniqueOrThrow({
      where: { id },
    });
    if (article.serviceId !== requester.serviceId)
      throw new ForbiddenException();
    return this.prisma.article.update({
      where: { id },
      data: dto,
      select: ARTICLE_SELECT,
    });
  }

  async remove(id: string, requester: User) {
    const article = await this.prisma.article.findUniqueOrThrow({
      where: { id },
    });
    if (article.serviceId !== requester.serviceId)
      throw new ForbiddenException();
    await this.prisma.article.delete({ where: { id } });
  }
}
