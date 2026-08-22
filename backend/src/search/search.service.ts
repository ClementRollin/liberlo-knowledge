import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';
import type { User } from '@prisma/client';
import type { SearchDto } from './dto/search.dto';

const STOP_WORDS = new Set([
  'le',
  'la',
  'les',
  'de',
  'du',
  'des',
  'un',
  'une',
  'et',
  'en',
  'au',
  'aux',
  'pour',
  'par',
  'sur',
  'que',
  'qui',
  'est',
  'dans',
  'avec',
]);

interface SemanticRow {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  tags: string[];
  service_id: string;
  service_name: string;
  service_slug: string;
  author_id: string;
  author_email: string;
  updated_at: Date;
  similarity: number;
}

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private embedding: EmbeddingService,
  ) {}

  async search(
    dto: SearchDto,
    requester: Pick<User, 'id' | 'role' | 'serviceId'>,
  ) {
    const tokens = dto.query
      .toLowerCase()
      .split(/[\s\-_/]+/)
      .map((w) => w.replace(/[^a-zàâçéèêëîïôùûüœ]/g, ''))
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    const phraseConditions = [
      { title: { contains: dto.query, mode: 'insensitive' as const } },
      { content: { contains: dto.query, mode: 'insensitive' as const } },
      { summary: { contains: dto.query, mode: 'insensitive' as const } },
    ];

    const tokenConditions = tokens.flatMap((token) => [
      { title: { contains: token, mode: 'insensitive' as const } },
      { content: { contains: token, mode: 'insensitive' as const } },
      { summary: { contains: token, mode: 'insensitive' as const } },
      { tags: { has: token } },
    ]);

    const serviceSlug = dto.serviceSlug;

    // Filtre de visibilité : les non-SUPER_ADMIN ne voient pas les articles
    // marqués INTERNAL (prépare l'évolution du champ visibility).
    const visibilityFilter =
      requester.role !== 'SUPER_ADMIN'
        ? { visibility: { not: 'INTERNAL' } }
        : {};

    const [semanticRows, keywordArticles] = await Promise.all([
      this.semanticSearch(dto.query, serviceSlug, requester.role),
      this.prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          ...visibilityFilter,
          OR: [...phraseConditions, ...tokenConditions],
          ...(serviceSlug ? { service: { slug: serviceSlug } } : {}),
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
      }),
    ]);

    const semanticResults = semanticRows.map((r) => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      content: r.content,
      tags: r.tags,
      service: { id: r.service_id, name: r.service_name, slug: r.service_slug },
      author: { id: r.author_id, email: r.author_email },
      updatedAt: r.updated_at,
      score: Math.round(r.similarity * 10),
    }));

    const query = dto.query.toLowerCase();
    const keywordResults = keywordArticles.map((r) => {
      const text =
        .toLowerCase();
      let score = 0;
      if (text.includes(query)) score += 10;
      for (const token of tokens) {
        if (r.title.toLowerCase().includes(token)) score += 3;
        else if (text.includes(token)) score += 1;
      }
      return { ...r, score };
    });

    const relevantSemantic = semanticResults.filter((r) => r.score > 0);
    const seen = new Set(relevantSemantic.map((r) => r.id));
    const merged = [
      ...relevantSemantic,
      ...keywordResults.filter((r) => r.score > 0 && !seen.has(r.id)),
    ].sort((a, b) => b.score - a.score);

    return merged.slice(0, 20);
  }

  private async semanticSearch(
    query: string,
    serviceSlug?: string,
    role?: string,
  ): Promise<SemanticRow[]> {
    try {
      const vector = await this.embedding.generateEmbedding(query);
      const pgVector = ;

      // Les non-SUPER_ADMIN ne voient pas les articles marqués INTERNAL.
      // On duplique les branches pour conserver des requêtes paramétrées sûres
      // (Prisma tagged templates n'acceptent pas de fragments SQL dynamiques).
      const filterInternal = role !== 'SUPER_ADMIN';

      if (serviceSlug && filterInternal) {
        return this.prisma.<SemanticRow[]>;
      }

      if (serviceSlug) {
        return this.prisma.<SemanticRow[]>;
      }

      if (filterInternal) {
        return this.prisma.<SemanticRow[]>;
      }

      return this.prisma.<SemanticRow[]>;
    } catch {
      return [];
    }
  }
}
