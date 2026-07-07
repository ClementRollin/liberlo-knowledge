import {
  Injectable,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';
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
  constructor(
    private prisma: PrismaService,
    private embedding: EmbeddingService,
  ) {}

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

  async create(dto: CreateArticleDto, author: User) {
    if (!author.serviceId) throw new ForbiddenException();
    const article = await this.prisma.article.create({
      data: { ...dto, authorId: author.id, serviceId: author.serviceId },
      select: ARTICLE_SELECT,
    });
    await this.indexEmbedding(
      article.id,
      article.title,
      article.summary,
      article.tags,
      article.content,
    );
    return article;
  }

  async update(id: string, dto: UpdateArticleDto, requester: User) {
    const article = await this.prisma.article.findUniqueOrThrow({
      where: { id },
    });
    if (article.serviceId !== requester.serviceId)
      throw new ForbiddenException();
    const updated = await this.prisma.article.update({
      where: { id },
      data: dto,
      select: ARTICLE_SELECT,
    });
    await this.indexEmbedding(
      updated.id,
      updated.title,
      updated.summary,
      updated.tags,
      updated.content,
    );
    return updated;
  }

  async remove(id: string, requester: User) {
    const article = await this.prisma.article.findUniqueOrThrow({
      where: { id },
    });
    if (article.serviceId !== requester.serviceId)
      throw new ForbiddenException();
    await this.prisma.article.delete({ where: { id } });
  }

  async reindexAll(): Promise<{ indexed: number; errors: number }> {
    const articles = await this.prisma.$queryRaw<
      { id: string; title: string; summary: string | null; content: string; tags: string[] }[]
    >`SELECT id, title, summary, content, tags FROM "Article" WHERE embedding IS NULL`;

    let errors = 0;
    for (const a of articles) {
      try {
        await this.indexEmbedding(a.id, a.title, a.summary, a.tags, a.content);
      } catch {
        errors++;
      }
    }
    return { indexed: articles.length - errors, errors };
  }

  private async indexEmbedding(
    articleId: string,
    title: string,
    summary: string | null,
    tags: string[],
    content: string,
  ): Promise<void> {
    const text = [title, summary ?? '', tags.join(' '), content]
      .filter(Boolean)
      .join('\n');
    try {
      const vector = await this.embedding.generateEmbedding(text);
      const pgVector = `[${vector.join(',')}]`;
      await this.prisma.$executeRaw`
        UPDATE "Article" SET embedding = ${pgVector}::vector WHERE id = ${articleId}
      `;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new ServiceUnavailableException(
        `L'indexation sémantique a échoué : ${message}. L'article a été sauvegardé mais ne sera pas retrouvable via la recherche sémantique.`,
      );
    }
  }
}
