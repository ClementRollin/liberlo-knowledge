import { Test } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';
import type { User } from '@prisma/client';

const mockEmbedding = Array.from({ length: 1536 }, (_, i) => i / 1536);

const mockPrisma = {
  article: {
    findMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

const mockEmbeddingService = {
  generateEmbedding: jest.fn().mockResolvedValue(mockEmbedding),
};

const requesterCollaborator: Pick<User, 'id' | 'role' | 'serviceId'> = {
  id: 'user-1',
  role: 'COLLABORATOR',
  serviceId: null,
};

const requesterAdmin: Pick<User, 'id' | 'role' | 'serviceId'> = {
  id: 'user-2',
  role: 'SUPER_ADMIN',
  serviceId: null,
};

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmbeddingService, useValue: mockEmbeddingService },
      ],
    }).compile();

    service = module.get(SearchService);
    jest.clearAllMocks();
  });

  describe('search()', () => {
    it('should return merged keyword and semantic results sorted by score', async () => {
      const keywordArticle = {
        id: 'art-1',
        title: 'Procédure onboarding',
        summary: 'Guide complet',
        content: 'procédure onboarding collaborateur',
        tags: ['rh', 'onboarding'],
        service: { id: 'svc-1', name: 'RH', slug: 'rh' },
        author: { id: 'user-1', email: 'rh@liberlo.com' },
        updatedAt: new Date(),
      };

      mockPrisma.article.findMany.mockResolvedValue([keywordArticle]);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const results = await service.search(
        { query: 'procédure onboarding' },
        requesterCollaborator,
      );

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PUBLISHED',
            visibility: { not: 'INTERNAL' },
          }),
        }),
      );
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('art-1');
    });

    it('should not filter INTERNAL visibility for SUPER_ADMIN', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await service.search({ query: 'test' }, requesterAdmin);

      const call = mockPrisma.article.findMany.mock.calls[0][0];
      expect(call.where).not.toHaveProperty('visibility');
    });

    it('should filter by serviceSlug when provided', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await service.search(
        { query: 'test', serviceSlug: 'it' },
        requesterCollaborator,
      );

      const call = mockPrisma.article.findMany.mock.calls[0][0];
      expect(call.where).toMatchObject({ service: { slug: 'it' } });
    });

    it('should deduplicate articles appearing in both keyword and semantic results', async () => {
      const sharedArticle = {
        id: 'shared-1',
        title: 'Article commun',
        summary: null,
        content: 'test content',
        tags: [],
        service: { id: 's1', name: 'IT', slug: 'it' },
        author: { id: 'u1', email: 'it@liberlo.com' },
        updatedAt: new Date(),
      };

      mockPrisma.article.findMany.mockResolvedValue([sharedArticle]);
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          id: 'shared-1',
          title: 'Article commun',
          summary: null,
          content: 'test content',
          tags: [],
          service_id: 's1',
          service_name: 'IT',
          service_slug: 'it',
          author_id: 'u1',
          author_email: 'it@liberlo.com',
          updated_at: new Date(),
          similarity: 0.9,
        },
      ]);

      const results = await service.search(
        { query: 'test' },
        requesterCollaborator,
      );

      const ids = results.map((r) => r.id);
      expect(ids.filter((id) => id === 'shared-1').length).toBe(1);
    });

    it('should return at most 20 results', async () => {
      const manyArticles = Array.from({ length: 25 }, (_, i) => ({
        id: `art-${i}`,
        title: `Article ${i}`,
        summary: null,
        content: 'contenu test',
        tags: [],
        service: { id: 's1', name: 'IT', slug: 'it' },
        author: { id: 'u1', email: 'it@liberlo.com' },
        updatedAt: new Date(),
      }));

      mockPrisma.article.findMany.mockResolvedValue(manyArticles);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const results = await service.search(
        { query: 'test' },
        requesterCollaborator,
      );

      expect(results.length).toBeLessThanOrEqual(20);
    });

    it('should return empty array if embedding service throws', async () => {
      mockEmbeddingService.generateEmbedding.mockRejectedValueOnce(
        new Error('OpenAI error'),
      );
      mockPrisma.article.findMany.mockResolvedValue([]);

      const results = await service.search(
        { query: 'test' },
        requesterCollaborator,
      );

      expect(results).toEqual([]);
    });
  });
});
