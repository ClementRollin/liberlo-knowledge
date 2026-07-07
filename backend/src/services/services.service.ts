import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.service.findMany({ orderBy: { name: 'asc' } });
  }

  async findBySlugWithArticles(slug: string) {
    const service = await this.prisma.service.findUniqueOrThrow({
      where: { slug },
    });
    const articles = await this.prisma.article.findMany({
      where: { serviceId: service.id, status: 'PUBLISHED' },
      include: { author: { select: { id: true, email: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return { service, articles };
  }
}
