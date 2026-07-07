import { ArticlesService } from './articles.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import type { User } from '@prisma/client';

const SERVICE_IT = { id: 'svc-it', name: 'IT', slug: 'it' };

const responsable: User = {
  id: 'resp-1',
  email: 'marc@liberlo.com',
  passwordHash: 'hash',
  role: 'RESPONSABLE',
  serviceId: 'svc-it',
  isActive: true,
  activationToken: null,
  activationTokenExpiresAt: null,
  createdAt: new Date(),
};

const makeArticle = (overrides = {}) => ({
  id: 'art-1',
  title: 'Guide onboarding IT',
  content: '## Contenu',
  summary: 'Un résumé',
  type: null,
  serviceId: 'svc-it',
  service: SERVICE_IT,
  visibility: 'SERVICE',
  status: 'PUBLISHED',
  tags: ['onboarding'],
  authorId: 'resp-1',
  author: { id: 'resp-1', email: 'marc@liberlo.com' },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('ArticlesService', () => {
  let service: ArticlesService;
  let mockPrisma: jest.Mocked<Pick<PrismaService, 'article'>>;

  beforeEach(() => {
    mockPrisma = {
      article: {
        findMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as any;
    service = new ArticlesService(mockPrisma as unknown as PrismaService);
  });

  describe('findByService', () => {
    it('should return articles for the given serviceId', async () => {
      const articles = [makeArticle()];
      (mockPrisma.article.findMany as jest.Mock).mockResolvedValue(articles);

      const result = await service.findByService('svc-it');

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { serviceId: 'svc-it' } }),
      );
      expect(result).toEqual(articles);
    });
  });

  describe('create', () => {
    it('should create an article scoped to author\'s service', async () => {
      const dto = { title: 'Nouveau', content: 'Body', summary: '', tags: [], status: 'DRAFT' as const, visibility: 'SERVICE' as const };
      const created = makeArticle({ title: 'Nouveau' });
      (mockPrisma.article.create as jest.Mock).mockResolvedValue(created);

      const result = await service.create(dto, responsable);

      expect(mockPrisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ authorId: responsable.id, serviceId: responsable.serviceId }),
        }),
      );
      expect(result).toEqual(created);
    });

    it('should throw ForbiddenException when author has no serviceId', () => {
      const noServiceUser = { ...responsable, serviceId: null };

      // create() throws synchronously before returning a promise
      expect(() =>
        service.create(
          { title: 'X', content: 'Y', summary: '', tags: [], status: 'DRAFT', visibility: 'SERVICE' },
          noServiceUser as unknown as User,
        ),
      ).toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update an article when requester belongs to same service', async () => {
      (mockPrisma.article.findUniqueOrThrow as jest.Mock).mockResolvedValue(makeArticle());
      const updated = makeArticle({ title: 'Modifié' });
      (mockPrisma.article.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.update('art-1', { title: 'Modifié' }, responsable);

      expect(result.title).toBe('Modifié');
    });

    it('should throw ForbiddenException when requester is from a different service', async () => {
      (mockPrisma.article.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        makeArticle({ serviceId: 'svc-csm' }),
      );

      await expect(
        service.update('art-1', { title: 'Hack' }, responsable),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete an article when requester belongs to same service', async () => {
      (mockPrisma.article.findUniqueOrThrow as jest.Mock).mockResolvedValue(makeArticle());
      (mockPrisma.article.delete as jest.Mock).mockResolvedValue({});

      await service.remove('art-1', responsable);

      expect(mockPrisma.article.delete).toHaveBeenCalledWith({ where: { id: 'art-1' } });
    });

    it('should throw ForbiddenException when requester is from a different service', async () => {
      (mockPrisma.article.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        makeArticle({ serviceId: 'svc-sales' }),
      );

      await expect(service.remove('art-1', responsable)).rejects.toThrow(ForbiddenException);
    });
  });
});
