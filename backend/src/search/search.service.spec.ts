import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';

const REQUESTER = { id: 'user-1', role: 'COLLABORATOR' as const, serviceId: 'svc-1' };

const makeArticle = (overrides: object) => ({
  id: 'art-1',
  title: 'Titre',
  summary: 'Résumé',
  content: 'Contenu',
  tags: [] as string[],
  service: { id: 'svc-1', name: 'IT', slug: 'it' },
  author: { id: 'u1', email: 'a@b.com' },
  updatedAt: new Date(),
  ...overrides,
});

describe('SearchService', () => {
  let service: SearchService;
  let mockPrisma: jest.Mocked<Pick<PrismaService, 'article'>>;

  beforeEach(() => {
    mockPrisma = { article: { findMany: jest.fn() } } as any;
    service = new SearchService(mockPrisma as unknown as PrismaService);
  });

  describe('tokenisation', () => {
    it('should filter French stop words', async () => {
      (mockPrisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await service.search({ query: 'le processus de gestion' }, REQUESTER);

      const [call] = (mockPrisma.article.findMany as jest.Mock).mock.calls;
      const orClauses: Array<{ title?: { contains: string } }> = call[0].where.OR;
      const titleTokens = orClauses
        .filter(c => c.title?.contains !== undefined)
        .map(c => c.title!.contains);

      expect(titleTokens).not.toContain('le');
      expect(titleTokens).not.toContain('de');
      expect(titleTokens).toContain('processus');
      expect(titleTokens).toContain('gestion');
    });

    it('should filter words with 2 characters or fewer', async () => {
      (mockPrisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await service.search({ query: 'IT RH bon' }, REQUESTER);

      const [call] = (mockPrisma.article.findMany as jest.Mock).mock.calls;
      const orClauses: Array<{ title?: { contains: string } }> = call[0].where.OR;
      const titleTokens = orClauses
        .filter(c => c.title?.contains !== undefined)
        .map(c => c.title!.contains);

      expect(titleTokens).not.toContain('it');
      expect(titleTokens).not.toContain('rh');
      expect(titleTokens).toContain('bon');
    });

    it('should split on hyphens and underscores', async () => {
      (mockPrisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await service.search({ query: 'csm-it_process' }, REQUESTER);

      const [call] = (mockPrisma.article.findMany as jest.Mock).mock.calls;
      const orClauses: Array<{ title?: { contains: string } }> = call[0].where.OR;
      const titleTokens = orClauses
        .filter(c => c.title?.contains !== undefined)
        .map(c => c.title!.contains);

      expect(titleTokens).toContain('csm');
      expect(titleTokens).toContain('process');
    });
  });

  describe('query building', () => {
    it('should restrict to PUBLISHED articles only', async () => {
      (mockPrisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await service.search({ query: 'test' }, REQUESTER);

      const [call] = (mockPrisma.article.findMany as jest.Mock).mock.calls;
      expect(call[0].where.status).toBe('PUBLISHED');
    });

    it('should filter by serviceSlug when provided', async () => {
      (mockPrisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await service.search({ query: 'test', serviceSlug: 'csm' }, REQUESTER);

      const [call] = (mockPrisma.article.findMany as jest.Mock).mock.calls;
      expect(call[0].where.service?.slug).toBe('csm');
    });

    it('should not add service filter when serviceSlug is absent', async () => {
      (mockPrisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await service.search({ query: 'test' }, REQUESTER);

      const [call] = (mockPrisma.article.findMany as jest.Mock).mock.calls;
      expect(call[0].where.service).toBeUndefined();
    });
  });

  describe('scoring', () => {
    it('should return empty array when Prisma returns no results', async () => {
      (mockPrisma.article.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.search({ query: 'inexistant' }, REQUESTER);

      expect(result).toEqual([]);
    });

    it('should rank phrase match higher than token-only match', async () => {
      const articles = [
        makeArticle({ id: 'only-token', title: 'Processus', summary: 'CSM article', content: 'IT info' }),
        makeArticle({ id: 'phrase', title: 'Processus CSM IT', summary: 'Escalade transversal', content: '' }),
      ];
      (mockPrisma.article.findMany as jest.Mock).mockResolvedValue(articles);

      const results = await service.search({ query: 'processus CSM IT' }, REQUESTER);

      expect(results[0].id).toBe('phrase');
    });

    it('should rank title token match higher than content-only match', async () => {
      const articles = [
        makeArticle({ id: 'content-match', title: 'Guide général', summary: '', content: 'onboarding process' }),
        makeArticle({ id: 'title-match', title: 'Onboarding process', summary: '', content: 'autre chose' }),
      ];
      (mockPrisma.article.findMany as jest.Mock).mockResolvedValue(articles);

      const results = await service.search({ query: 'onboarding' }, REQUESTER);

      expect(results[0].id).toBe('title-match');
    });

    it('should filter out results with score 0', async () => {
      // Article has nothing related to the query in its text
      const articles = [
        makeArticle({ id: 'irrelevant', title: 'AAAA', summary: 'BBBB', content: 'CCCC', tags: [] }),
      ];
      (mockPrisma.article.findMany as jest.Mock).mockResolvedValue(articles);

      // Query token 'xyz' won't appear anywhere → score 0 → filtered
      const results = await service.search({ query: 'xyz' }, REQUESTER);

      expect(results).toHaveLength(0);
    });

    it('should boost tag matches', async () => {
      const articles = [
        makeArticle({ id: 'tag-match', title: 'Article', summary: '', content: '', tags: ['csm', 'escalade'] }),
        makeArticle({ id: 'no-tag', title: 'Autre', summary: 'csm mentionné en résumé', content: '', tags: [] }),
      ];
      (mockPrisma.article.findMany as jest.Mock).mockResolvedValue(articles);

      const results = await service.search({ query: 'escalade csm' }, REQUESTER);

      // tag-match has 'escalade' and 'csm' as tags
      expect(results[0].id).toBe('tag-match');
    });
  });
});
