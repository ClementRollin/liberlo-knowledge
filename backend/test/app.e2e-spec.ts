import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function seed(prisma: PrismaService) {
  const hash = await bcrypt.hash('Test1234!', 1);

  const itService = await prisma.service.upsert({
    where: { slug: 'it-e2e' },
    update: {},
    create: { name: 'IT E2E', slug: 'it-e2e', description: 'Test service' },
  });

  const csmService = await prisma.service.upsert({
    where: { slug: 'csm-e2e' },
    update: {},
    create: { name: 'CSM E2E', slug: 'csm-e2e', description: 'Test CSM service' },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin-e2e@liberlo.com' },
    update: {},
    create: {
      email: 'admin-e2e@liberlo.com',
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  const responsable = await prisma.user.upsert({
    where: { email: 'resp-e2e@liberlo.com' },
    update: {},
    create: {
      email: 'resp-e2e@liberlo.com',
      passwordHash: hash,
      role: 'RESPONSABLE',
      serviceId: itService.id,
      isActive: true,
    },
  });

  const otherResponsable = await prisma.user.upsert({
    where: { email: 'resp-csm-e2e@liberlo.com' },
    update: {},
    create: {
      email: 'resp-csm-e2e@liberlo.com',
      passwordHash: hash,
      role: 'RESPONSABLE',
      serviceId: csmService.id,
      isActive: true,
    },
  });

  const collaborator = await prisma.user.upsert({
    where: { email: 'collab-e2e@liberlo.com' },
    update: {},
    create: {
      email: 'collab-e2e@liberlo.com',
      passwordHash: hash,
      role: 'COLLABORATOR',
      serviceId: itService.id,
      isActive: true,
    },
  });

  const article = await prisma.article.create({
    data: {
      title: 'Guide onboarding IT E2E',
      content: 'Contenu du guide onboarding pour les tests E2E',
      summary: 'Résumé onboarding IT',
      tags: ['onboarding', 'it', 'test'],
      serviceId: itService.id,
      authorId: responsable.id,
      status: 'PUBLISHED',
      visibility: 'SERVICE',
    },
  });

  return { admin, responsable, otherResponsable, collaborator, itService, csmService, article };
}

async function cleanup(prisma: PrismaService) {
  await prisma.message.deleteMany({
    where: { conversation: { user: { email: { endsWith: '-e2e@liberlo.com' } } } },
  });
  await prisma.conversation.deleteMany({
    where: { user: { email: { endsWith: '-e2e@liberlo.com' } } },
  });
  await prisma.article.deleteMany({
    where: { title: { contains: 'E2E' } },
  });
  await prisma.user.deleteMany({
    where: { email: { endsWith: '-e2e@liberlo.com' } },
  });
  await prisma.service.deleteMany({
    where: { slug: { endsWith: '-e2e' } },
  });
}

// ─── Suite principale ─────────────────────────────────────────────────────────

describe('Liberlo API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tokens: { admin: string; responsable: string; otherResponsable: string; collaborator: string };
  let articleId: string;
  let itServiceSlug: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await cleanup(prisma);

    const data = await seed(prisma);
    articleId = data.article.id;
    itServiceSlug = data.itService.slug;

    // Récupération des tokens via login
    const loginAs = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Test1234!' });
      return res.body.access_token as string;
    };

    tokens = {
      admin: await loginAs('admin-e2e@liberlo.com'),
      responsable: await loginAs('resp-e2e@liberlo.com'),
      otherResponsable: await loginAs('resp-csm-e2e@liberlo.com'),
      collaborator: await loginAs('collab-e2e@liberlo.com'),
    };
  });

  afterAll(async () => {
    await cleanup(prisma);
    await app.close();
  });

  // ── Auth ────────────────────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('should return 400 when body is empty', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });

    it('should return 401 on wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'resp-e2e@liberlo.com', password: 'wrongpass' })
        .expect(401);
    });

    it('should return 401 on unknown email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@liberlo.com', password: 'Test1234!' })
        .expect(401);
    });

    it('should return access_token and user on valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'resp-e2e@liberlo.com', password: 'Test1234!' })
        .expect(200);

      expect(res.body.access_token).toBeDefined();
      expect(res.body.user.email).toBe('resp-e2e@liberlo.com');
      expect(res.body.user.role).toBe('RESPONSABLE');
    });

    it('should include service info in login response', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'resp-e2e@liberlo.com', password: 'Test1234!' })
        .expect(200);

      expect(res.body.user.service).toMatchObject({ slug: itServiceSlug });
    });

    it('should return null service for SUPER_ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin-e2e@liberlo.com', password: 'Test1234!' })
        .expect(200);

      expect(res.body.user.service).toBeNull();
    });
  });

  // ── Articles ────────────────────────────────────────────────────────────────

  describe('GET /api/articles/:id', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get(`/api/articles/${articleId}`)
        .expect(401);
    });

    it('should return article with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${tokens.collaborator}`)
        .expect(200);

      expect(res.body.id).toBe(articleId);
      expect(res.body.title).toBe('Guide onboarding IT E2E');
    });
  });

  describe('POST /api/articles', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/api/articles')
        .send({ title: 'Test', content: 'Body', status: 'DRAFT' })
        .expect(401);
    });

    it('should return 403 for a COLLABORATOR', () => {
      return request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Bearer ${tokens.collaborator}`)
        .send({ title: 'Test', content: 'Body', status: 'DRAFT' })
        .expect(403);
    });

    it('should create article as RESPONSABLE and return 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Bearer ${tokens.responsable}`)
        .send({ title: 'Nouvel article E2E', content: 'Contenu test', summary: '', tags: [], status: 'DRAFT' })
        .expect(201);

      expect(res.body.title).toBe('Nouvel article E2E');
      expect(res.body.status).toBe('DRAFT');

      // Cleanup
      await prisma.article.delete({ where: { id: res.body.id } });
    });
  });

  describe('PATCH /api/articles/:id', () => {
    it('should return 403 when RESPONSABLE from different service tries to update', () => {
      return request(app.getHttpServer())
        .patch(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${tokens.otherResponsable}`)
        .send({ title: 'Hack attempt' })
        .expect(403);
    });

    it('should update article as RESPONSABLE from same service', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${tokens.responsable}`)
        .send({ summary: 'Résumé mis à jour E2E' })
        .expect(200);

      expect(res.body.summary).toBe('Résumé mis à jour E2E');
    });
  });

  // ── Search ──────────────────────────────────────────────────────────────────

  describe('POST /api/search', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/api/search')
        .send({ query: 'onboarding' })
        .expect(401);
    });

    it('should return 400 when query is missing', () => {
      return request(app.getHttpServer())
        .post('/api/search')
        .set('Authorization', `Bearer ${tokens.collaborator}`)
        .send({})
        .expect(400);
    });

    it('should return search results for a matching query', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/search')
        .set('Authorization', `Bearer ${tokens.collaborator}`)
        .send({ query: 'onboarding IT' })
        .expect(201);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('score');
    });

    it('should return empty array for a query with no match', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/search')
        .set('Authorization', `Bearer ${tokens.collaborator}`)
        .send({ query: 'xyznotexisting123456' })
        .expect(201);

      expect(res.body).toEqual([]);
    });

    it('should filter by serviceSlug', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/search')
        .set('Authorization', `Bearer ${tokens.collaborator}`)
        .send({ query: 'onboarding', serviceSlug: itServiceSlug })
        .expect(201);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((r: { service: { slug: string } }) => {
        expect(r.service.slug).toBe(itServiceSlug);
      });
    });
  });

  // ── Conversations ───────────────────────────────────────────────────────────

  describe('Conversations flow', () => {
    let convId: string;

    it('POST /api/conversations — should create conversation with first search turn', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/conversations')
        .set('Authorization', `Bearer ${tokens.collaborator}`)
        .send({ query: 'onboarding IT E2E' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toContain('onboarding');
      expect(res.body.messages).toHaveLength(2);
      expect(res.body.messages[0].role).toBe('USER');
      expect(res.body.messages[1].role).toBe('ASSISTANT');

      convId = res.body.id;
    });

    it('GET /api/conversations — should list user conversations', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/conversations')
        .set('Authorization', `Bearer ${tokens.collaborator}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.find((c: { id: string }) => c.id === convId)).toBeDefined();
    });

    it('GET /api/conversations/:id — should return full conversation', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/conversations/${convId}`)
        .set('Authorization', `Bearer ${tokens.collaborator}`)
        .expect(200);

      expect(res.body.id).toBe(convId);
      expect(res.body.messages.length).toBeGreaterThanOrEqual(2);
    });

    it('GET /api/conversations/:id — should return 403 for another user', async () => {
      await request(app.getHttpServer())
        .get(`/api/conversations/${convId}`)
        .set('Authorization', `Bearer ${tokens.responsable}`)
        .expect(403);
    });

    it('POST /api/conversations/:id/messages — should add a follow-up turn', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/conversations/${convId}/messages`)
        .set('Authorization', `Bearer ${tokens.collaborator}`)
        .send({ query: 'process IT CSM escalade' })
        .expect(201);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].role).toBe('USER');
      expect(res.body[1].role).toBe('ASSISTANT');
    });

    it('DELETE /api/conversations/:id — should delete conversation', async () => {
      await request(app.getHttpServer())
        .delete(`/api/conversations/${convId}`)
        .set('Authorization', `Bearer ${tokens.collaborator}`)
        .expect(204);
    });

    it('GET /api/conversations/:id — should return 404 after deletion', async () => {
      await request(app.getHttpServer())
        .get(`/api/conversations/${convId}`)
        .set('Authorization', `Bearer ${tokens.collaborator}`)
        .expect(404);
    });
  });

  // ── Admin ───────────────────────────────────────────────────────────────────

  describe('GET /api/admin/articles', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/admin/articles')
        .expect(401);
    });

    it('should return 403 for a COLLABORATOR', () => {
      return request(app.getHttpServer())
        .get('/api/admin/articles')
        .set('Authorization', `Bearer ${tokens.collaborator}`)
        .expect(403);
    });

    it('should return all articles for SUPER_ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/articles')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
