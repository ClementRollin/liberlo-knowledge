import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { User } from '@prisma/client'
import type { SearchDto } from './dto/search.dto'

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  // TODO: remplacer par similarité cosinus pgvector quand le modèle d'embeddings sera retenu
  async search(dto: SearchDto, _requester: User) {
    const results = await this.prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: dto.query, mode: 'insensitive' } },
          { content: { contains: dto.query, mode: 'insensitive' } },
          { summary: { contains: dto.query, mode: 'insensitive' } },
        ],
        ...(dto.serviceSlug ? { service: { slug: dto.serviceSlug } } : {}),
      },
      select: {
        id: true,
        title: true,
        summary: true,
        service: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, email: true } },
        updatedAt: true,
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    })

    return results.map((r) => ({ ...r, score: 1 }))
  }
}
