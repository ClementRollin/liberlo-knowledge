import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';
import type { SearchDto } from './dto/search.dto';

const STOP_WORDS = new Set(['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'au', 'aux', 'pour', 'par', 'sur', 'que', 'qui', 'est', 'dans', 'avec']);

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  // TODO: remplacer par similarité cosinus pgvector quand le modèle d'embeddings sera retenu
  async search(
    dto: SearchDto,
    _requester: Pick<User, 'id' | 'role' | 'serviceId'>,
  ) {
    const tokens = dto.query
      .toLowerCase()
      .split(/[\s\-_/]+/)
      .map(w => w.replace(/[^a-zàâçéèêëîïôùûüœ]/g, ''))
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));

    // Cherche la phrase complète OU chaque mot individuel
    const phraseConditions = [
      { title: { contains: dto.query, mode: 'insensitive' as const } },
      { content: { contains: dto.query, mode: 'insensitive' as const } },
      { summary: { contains: dto.query, mode: 'insensitive' as const } },
    ];

    const tokenConditions = tokens.flatMap(token => [
      { title: { contains: token, mode: 'insensitive' as const } },
      { content: { contains: token, mode: 'insensitive' as const } },
      { summary: { contains: token, mode: 'insensitive' as const } },
      { tags: { has: token } },
    ]);

    const results = await this.prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [...phraseConditions, ...tokenConditions],
        ...(dto.serviceSlug ? { service: { slug: dto.serviceSlug } } : {}),
      },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        tags: true,
        service: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, email: true } },
        updatedAt: true,
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });

    // Score simple : phrase complète > plusieurs tokens matchés > un seul token
    const query = dto.query.toLowerCase();
    const scored = results.map(r => {
      const text = `${r.title} ${r.summary ?? ''} ${r.content ?? ''} ${r.tags.join(' ')}`.toLowerCase();
      let score = 0;
      if (text.includes(query)) score += 10;
      for (const token of tokens) {
        if (r.title.toLowerCase().includes(token)) score += 3;
        else if (text.includes(token)) score += 1;
      }
      return { ...r, score };
    });

    return scored
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }
}
