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

    // Non-DIRECTION n'accèdent pas aux articles marqués INTERNAL (évolution future).
    const visibilityFilter =
      requester.role !== 'DIRECTION'
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

    const applyServiceBoost = (score: number, articleServiceId: string) => {
      // Boost articles from the requester's own service to surface relevant content first
      if (requester.serviceId && requester.serviceId === articleServiceId) {
        return Math.round(score * 1.5);
      }
      return score;
    };

    const semanticResults = semanticRows.map((r) => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      content: r.content,
      tags: r.tags,
      service: { id: r.service_id, name: r.service_name, slug: r.service_slug },
      author: { id: r.author_id, email: r.author_email },
      updatedAt: r.updated_at,
      score: applyServiceBoost(Math.round(r.similarity * 15), r.service_id),
    }));

    const query = dto.query.toLowerCase();
    const keywordResults = keywordArticles.map((r) => {
      const titleLow = r.title.toLowerCase();
      const bodyText =
        `${r.summary ?? ''} ${r.content ?? ''} ${r.tags.join(' ')}`.toLowerCase();
      let score = 0;
      // Phrase match: in title is the strongest signal, then rest of text
      if (titleLow.includes(query)) score += 20;
      else if (bodyText.includes(query)) score += 10;
      for (const token of tokens) {
        if (titleLow.includes(token)) score += 5;
        else if (r.tags.some((t) => t.toLowerCase().includes(token))) score += 4;
        else if ((r.summary ?? '').toLowerCase().includes(token)) score += 2;
        else if (r.content.toLowerCase().includes(token)) score += 1;
      }
      return { ...r, score: applyServiceBoost(score, r.service.id) };
    });

    // Minimum score of 5: requires at least one title-token match or a phrase hit.
    // For articles in both sets, keep the higher of semantic vs keyword score.
    const relevantSemantic = semanticResults.filter((r) => r.score >= 5);
    const semanticById = new Map(relevantSemantic.map((r) => [r.id, r]));
    for (const kw of keywordResults) {
      const sem = semanticById.get(kw.id);
      if (sem && kw.score > sem.score) sem.score = kw.score;
    }
    const seen = new Set(relevantSemantic.map((r) => r.id));
    const merged = [
      ...relevantSemantic,
      ...keywordResults.filter((r) => r.score >= 5 && !seen.has(r.id)),
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
      const pgVector = `[${vector.join(',')}]`;

      // Prisma tagged templates ne permettent pas de fragments SQL dynamiques ;
      // on branche sur les deux variables pour garder des requêtes paramétrées sûres.
      const filterInternal = role !== 'DIRECTION';

      if (serviceSlug && filterInternal) {
        return this.prisma.$queryRaw<SemanticRow[]>`
          SELECT a.id, a.title, a.summary, a.content, a.tags,
            s.id AS service_id, s.name AS service_name, s.slug AS service_slug,
            u.id AS author_id, u.email AS author_email, a."updatedAt" AS updated_at,
            1 - (a.embedding <=> ${pgVector}::vector) AS similarity
          FROM "Article" a
          JOIN "Service" s ON s.id = a."serviceId"
          JOIN "User" u ON u.id = a."authorId"
          WHERE a.status = 'PUBLISHED' AND a.embedding IS NOT NULL
            AND a.visibility != 'INTERNAL'
            AND s.slug = ${serviceSlug}
            AND a.embedding <=> ${pgVector}::vector < 0.25
          ORDER BY a.embedding <=> ${pgVector}::vector
          LIMIT 15
        `;
      }

      if (serviceSlug) {
        return this.prisma.$queryRaw<SemanticRow[]>`
          SELECT a.id, a.title, a.summary, a.content, a.tags,
            s.id AS service_id, s.name AS service_name, s.slug AS service_slug,
            u.id AS author_id, u.email AS author_email, a."updatedAt" AS updated_at,
            1 - (a.embedding <=> ${pgVector}::vector) AS similarity
          FROM "Article" a
          JOIN "Service" s ON s.id = a."serviceId"
          JOIN "User" u ON u.id = a."authorId"
          WHERE a.status = 'PUBLISHED' AND a.embedding IS NOT NULL AND s.slug = ${serviceSlug}
            AND a.embedding <=> ${pgVector}::vector < 0.25
          ORDER BY a.embedding <=> ${pgVector}::vector
          LIMIT 15
        `;
      }

      if (filterInternal) {
        return this.prisma.$queryRaw<SemanticRow[]>`
          SELECT a.id, a.title, a.summary, a.content, a.tags,
            s.id AS service_id, s.name AS service_name, s.slug AS service_slug,
            u.id AS author_id, u.email AS author_email, a."updatedAt" AS updated_at,
            1 - (a.embedding <=> ${pgVector}::vector) AS similarity
          FROM "Article" a
          JOIN "Service" s ON s.id = a."serviceId"
          JOIN "User" u ON u.id = a."authorId"
          WHERE a.status = 'PUBLISHED' AND a.embedding IS NOT NULL
            AND a.visibility != 'INTERNAL'
            AND a.embedding <=> ${pgVector}::vector < 0.25
          ORDER BY a.embedding <=> ${pgVector}::vector
          LIMIT 15
        `;
      }

      return this.prisma.$queryRaw<SemanticRow[]>`
        SELECT a.id, a.title, a.summary, a.content, a.tags,
          s.id AS service_id, s.name AS service_name, s.slug AS service_slug,
          u.id AS author_id, u.email AS author_email, a."updatedAt" AS updated_at,
          1 - (a.embedding <=> ${pgVector}::vector) AS similarity
        FROM "Article" a
        JOIN "Service" s ON s.id = a."serviceId"
        JOIN "User" u ON u.id = a."authorId"
        WHERE a.status = 'PUBLISHED' AND a.embedding IS NOT NULL
          AND a.embedding <=> ${pgVector}::vector < 0.25
        ORDER BY a.embedding <=> ${pgVector}::vector
        LIMIT 15
      `;
    } catch {
      return [];
    }
  }
}
