# Sub-projet 1 — Core App — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer le prototype Liberlo en application complète avec recherche sémantique
(OpenAI + pgvector), gestion des utilisateurs par le SUPER_ADMIN, et une UI polie avec
système de toast, modales et les 3 parcours utilisateur fonctionnels de bout en bout.

**Architecture:** Réorganiser le backend en `modules/` (code métier) et `shared/` (guards,
decorators, prisma, embedding). Créer `EmbeddingService` partagé appelé par `ArticlesService`
(à la sauvegarde) et `SearchService` (à la recherche). Ajouter `UsersModule` pour le CRUD
utilisateurs avec génération de mot de passe côté serveur. Côté frontend, déplacer les pages
dashboard, ajouter le système Toast global, les composants `ConfirmModal`/`EmptyState`, le
`UserDrawer` et la `UsersPage`.

**Tech Stack:** NestJS 11, Prisma 7.x (@Global PrismaModule), pgvector, OpenAI SDK v4,
Vue 3 + Composition API, Tailwind CSS 4, Pinia, useApi composable maison

---

## Carte des fichiers

### Backend — nouveaux fichiers
- `backend/src/shared/embedding/embedding.service.ts`
- `backend/src/shared/embedding/embedding.service.spec.ts`
- `backend/src/shared/embedding/embedding.module.ts`
- `backend/src/modules/users/users.controller.ts`
- `backend/src/modules/users/users.service.ts`
- `backend/src/modules/users/users.service.spec.ts`
- `backend/src/modules/users/users.module.ts`
- `backend/src/modules/users/dto/create-user.dto.ts`
- `backend/src/modules/users/dto/update-user.dto.ts`

### Backend — fichiers déplacés (réorganisation)
| Source actuelle | Destination |
|---|---|
| `src/prisma/prisma.service.ts` | `src/shared/prisma/prisma.service.ts` |
| `src/prisma/prisma.module.ts` | `src/shared/prisma/prisma.module.ts` |
| `src/auth/guards/jwt.guard.ts` | `src/shared/guards/jwt.guard.ts` |
| `src/auth/guards/roles.guard.ts` | `src/shared/guards/roles.guard.ts` |
| `src/auth/decorators/roles.decorator.ts` | `src/shared/decorators/roles.decorator.ts` |
| `src/auth/` (reste) | `src/modules/auth/` |
| `src/articles/` | `src/modules/articles/` |
| `src/services/` | `src/modules/services/` |
| `src/search/` | `src/modules/search/` |
| `src/admin/` | **dissous** (voir Task 3) |

### Backend — fichiers modifiés
- `backend/src/app.module.ts` — nouveaux chemins + UsersModule + EmbeddingModule
- `backend/src/modules/articles/articles.service.ts` — inject EmbeddingService + generate
- `backend/src/modules/articles/articles.controller.ts` — ajouter endpoint reindex
- `backend/src/modules/articles/articles.module.ts` — importer EmbeddingModule
- `backend/src/modules/search/search.service.ts` — remplacer TODO par pgvector
- `backend/src/modules/search/search.module.ts` — importer EmbeddingModule
- `backend/.env.example` — ajouter OPENAI_API_KEY

### Frontend — fichiers déplacés
| Source actuelle | Destination |
|---|---|
| `src/pages/DashboardPage.vue` | `src/pages/dashboard/DashboardPage.vue` |
| `src/pages/DashboardGlobalPage.vue` | `src/pages/dashboard/DashboardGlobalPage.vue` |

### Frontend — nouveaux fichiers
- `frontend/src/composables/useToast.ts`
- `frontend/src/composables/useAuth.ts`
- `frontend/src/components/ui/ToastContainer.vue`
- `frontend/src/components/ui/ConfirmModal.vue`
- `frontend/src/components/ui/EmptyState.vue`
- `frontend/src/components/domain/users/UserDrawer.vue`
- `frontend/src/pages/admin/UsersPage.vue`

### Frontend — fichiers modifiés
- `frontend/src/router/index.ts` — chemins dashboard + routes admin
- `frontend/src/App.vue` — monter ToastContainer
- `frontend/src/components/layout/AppHeader.vue` — menu admin SUPER_ADMIN

---

## Task 1 — Branche + dépendances

**Files:**
- Modify: `backend/package.json` (via npm install)
- Modify: `backend/.env.example`

- [ ] **Step 1: Créer la branche feature**

```bash
cd backend && git checkout -b feature/core-app-completion
```

- [ ] **Step 2: Installer le SDK OpenAI**

```bash
cd backend && npm install openai
```

Expected: `openai` apparaît dans `package.json` dependencies.

- [ ] **Step 3: Ajouter OPENAI_API_KEY à .env.example**

Ouvrir `backend/.env.example` et ajouter à la fin :

```
OPENAI_API_KEY=sk-proj-...
```

- [ ] **Step 4: Créer le .env local (si absent) et y renseigner la vraie clé**

```bash
cp backend/.env.example backend/.env
# puis renseigner OPENAI_API_KEY=sk-proj-<ta-vraie-clé>
```

- [ ] **Step 5: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/.env.example
git commit -m "chore: install openai sdk and document OPENAI_API_KEY env var"
```

---

## Task 2 — Réorganisation du backend : créer les dossiers et déplacer les fichiers

**Files:** tous les fichiers `backend/src/`

- [ ] **Step 1: Créer les nouveaux dossiers**

```bash
mkdir -p backend/src/shared/prisma
mkdir -p backend/src/shared/guards
mkdir -p backend/src/shared/decorators
mkdir -p backend/src/shared/embedding
mkdir -p backend/src/modules
```

- [ ] **Step 2: Déplacer les fichiers partagés (prisma, guards, decorators)**

```bash
git mv backend/src/prisma/prisma.service.ts backend/src/shared/prisma/prisma.service.ts
git mv backend/src/prisma/prisma.module.ts  backend/src/shared/prisma/prisma.module.ts
git mv backend/src/auth/guards/jwt.guard.ts      backend/src/shared/guards/jwt.guard.ts
git mv backend/src/auth/guards/roles.guard.ts    backend/src/shared/guards/roles.guard.ts
git mv backend/src/auth/decorators/roles.decorator.ts backend/src/shared/decorators/roles.decorator.ts
```

- [ ] **Step 3: Déplacer les modules métier**

```bash
git mv backend/src/auth     backend/src/modules/auth
git mv backend/src/articles backend/src/modules/articles
git mv backend/src/services backend/src/modules/services
git mv backend/src/search   backend/src/modules/search
```

- [ ] **Step 4: Supprimer les dossiers vides et le module admin**

```bash
rmdir backend/src/modules/auth/guards     2>/dev/null || true
rmdir backend/src/modules/auth/decorators 2>/dev/null || true
rmdir backend/src/prisma                  2>/dev/null || true
git rm -r backend/src/admin
```

---

## Task 3 — Corriger tous les imports backend post-réorganisation

**Files:** tous les fichiers dans `backend/src/modules/` et `backend/src/shared/`

- [ ] **Step 1: Corriger `shared/guards/roles.guard.ts`**

Remplacer l'import du ROLES_KEY :

```typescript
// backend/src/shared/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'
import type { Role } from '@prisma/client'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required || required.length === 0) return true

    const { user } = context.switchToHttp().getRequest()
    if (!required.includes(user?.role)) {
      throw new ForbiddenException('Accès refusé')
    }
    return true
  }
}
```

- [ ] **Step 2: Corriger `modules/auth/auth.service.ts`**

Mettre à jour l'import PrismaService :

```diff
- import { PrismaService } from '../prisma/prisma.service'
+ import { PrismaService } from '../../shared/prisma/prisma.service'
```

- [ ] **Step 3: Corriger `modules/auth/strategies/jwt.strategy.ts`**

```diff
- import { PrismaService } from '../../prisma/prisma.service'
+ import { PrismaService } from '../../../shared/prisma/prisma.service'
```

- [ ] **Step 4: Corriger `modules/articles/articles.controller.ts`**

```diff
- import { JwtGuard }  from '../auth/guards/jwt.guard'
- import { RolesGuard } from '../auth/guards/roles.guard'
- import { Roles }     from '../auth/decorators/roles.decorator'
+ import { JwtGuard }  from '../../shared/guards/jwt.guard'
+ import { RolesGuard } from '../../shared/guards/roles.guard'
+ import { Roles }     from '../../shared/decorators/roles.decorator'
```

- [ ] **Step 5: Corriger `modules/articles/articles.service.ts`**

```diff
- import { PrismaService } from '../prisma/prisma.service'
+ import { PrismaService } from '../../shared/prisma/prisma.service'
```

- [ ] **Step 6: Corriger `modules/search/search.service.ts`**

```diff
- import { PrismaService } from '../prisma/prisma.service'
+ import { PrismaService } from '../../shared/prisma/prisma.service'
```

- [ ] **Step 7: Corriger `modules/search/search.controller.ts`**

```diff
- import { JwtGuard }  from '../auth/guards/jwt.guard'
- import { RolesGuard } from '../auth/guards/roles.guard'
+ import { JwtGuard }  from '../../shared/guards/jwt.guard'
+ import { RolesGuard } from '../../shared/guards/roles.guard'
```

- [ ] **Step 8: Appliquer les mêmes corrections dans `modules/services/`**

Remplacer dans `services.controller.ts` et `services.service.ts` tout import pointant vers
`../prisma/`, `../auth/guards/`, `../auth/decorators/` par les chemins `../../shared/...`.

---

## Task 4 — Mettre à jour `app.module.ts`

**Files:**
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Réécrire app.module.ts avec les nouveaux chemins et sans AdminModule**

```typescript
// backend/src/app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule }    from './shared/prisma/prisma.module'
import { EmbeddingModule } from './shared/embedding/embedding.module'
import { AuthModule }      from './modules/auth/auth.module'
import { UsersModule }     from './modules/users/users.module'
import { ServicesModule }  from './modules/services/services.module'
import { ArticlesModule }  from './modules/articles/articles.module'
import { SearchModule }    from './modules/search/search.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EmbeddingModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    ArticlesModule,
    SearchModule,
  ],
})
export class AppModule {}
```

> Note : `EmbeddingModule` et `UsersModule` n'existent pas encore — ils seront créés aux
> Tasks 6 et 9. Le build échouera jusqu'à Task 10.

---

## Task 5 — Réorganisation frontend : déplacer les pages dashboard

**Files:**
- Move: `frontend/src/pages/DashboardPage.vue` → `frontend/src/pages/dashboard/DashboardPage.vue`
- Move: `frontend/src/pages/DashboardGlobalPage.vue` → `frontend/src/pages/dashboard/DashboardGlobalPage.vue`
- Modify: `frontend/src/router/index.ts`

- [ ] **Step 1: Créer le dossier et déplacer**

```bash
mkdir -p frontend/src/pages/dashboard
mkdir -p frontend/src/pages/admin
git mv frontend/src/pages/DashboardPage.vue       frontend/src/pages/dashboard/DashboardPage.vue
git mv frontend/src/pages/DashboardGlobalPage.vue frontend/src/pages/dashboard/DashboardGlobalPage.vue
```

- [ ] **Step 2: Mettre à jour le router**

Remplacer dans `frontend/src/router/index.ts` les imports lazy et ajouter les routes admin :

```typescript
// frontend/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Public
    {
      path: '/auth/login',
      name: 'login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/auth/activate',
      name: 'activate',
      component: () => import('@/pages/auth/ActivatePage.vue'),
      meta: { public: true },
    },

    // Authentifié
    { path: '/',           name: 'home',    component: () => import('@/pages/HomePage.vue') },
    { path: '/search',     name: 'search',  component: () => import('@/pages/SearchPage.vue') },
    { path: '/service/:slug', name: 'service', component: () => import('@/pages/ServicePage.vue') },
    { path: '/article/:id',  name: 'article',  component: () => import('@/pages/ArticlePage.vue') },

    // RESPONSABLE
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/pages/dashboard/DashboardPage.vue'),
      meta: { roles: ['RESPONSABLE'] },
    },
    {
      path: '/dashboard/new',
      name: 'article-new',
      component: () => import('@/pages/ArticleFormPage.vue'),
      meta: { roles: ['RESPONSABLE'] },
    },
    {
      path: '/dashboard/edit/:id',
      name: 'article-edit',
      component: () => import('@/pages/ArticleFormPage.vue'),
      meta: { roles: ['RESPONSABLE'] },
    },

    // SUPER_ADMIN
    {
      path: '/dashboard/global',
      name: 'dashboard-global',
      component: () => import('@/pages/dashboard/DashboardGlobalPage.vue'),
      meta: { roles: ['SUPER_ADMIN'] },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/pages/admin/UsersPage.vue'),
      meta: { roles: ['SUPER_ADMIN'] },
    },

    // Erreurs
    { path: '/403', name: 'forbidden', component: () => import('@/pages/ForbiddenPage.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) return true
  if (!auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }
  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && !requiredRoles.includes(auth.role!)) return { name: 'forbidden' }
  return true
})

export default router
```

- [ ] **Step 3: Commit la réorganisation**

```bash
git add -A
git commit -m "refactor: reorganize backend into modules/ and shared/, move dashboard pages"
```

---

## Task 6 — Créer EmbeddingModule et EmbeddingService

**Files:**
- Create: `backend/src/shared/embedding/embedding.service.ts`
- Create: `backend/src/shared/embedding/embedding.service.spec.ts`
- Create: `backend/src/shared/embedding/embedding.module.ts`

- [ ] **Step 1: Écrire le test unitaire (failing)**

```typescript
// backend/src/shared/embedding/embedding.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { EmbeddingService } from './embedding.service'
import { ConfigService } from '@nestjs/config'

const mockEmbeddingsCreate = jest.fn()

jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    embeddings: { create: mockEmbeddingsCreate },
  })),
}))

describe('EmbeddingService', () => {
  let service: EmbeddingService

  beforeEach(async () => {
    mockEmbeddingsCreate.mockReset()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('sk-test') },
        },
      ],
    }).compile()

    service = module.get<EmbeddingService>(EmbeddingService)
  })

  it('should return an embedding vector from OpenAI', async () => {
    mockEmbeddingsCreate.mockResolvedValue({ data: [{ embedding: [0.1, 0.2, 0.3] }] })

    const result = await service.generateEmbedding('bonjour')

    expect(result).toEqual([0.1, 0.2, 0.3])
    expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: 'bonjour',
    })
  })

  it('should concatenate all article fields into a single input string', () => {
    const text = service.buildArticleEmbeddingInput(
      'Procédure onboarding',
      'Comment intégrer un nouveau collaborateur',
      'Contenu détaillé...',
      ['rh', 'onboarding'],
    )
    expect(text).toBe(
      'Procédure onboarding Comment intégrer un nouveau collaborateur Contenu détaillé... rh onboarding',
    )
  })

  it('should filter out empty fields when building the input string', () => {
    const text = service.buildArticleEmbeddingInput('Titre', '', 'Contenu', [])
    expect(text).toBe('Titre Contenu')
  })
})
```

- [ ] **Step 2: Lancer le test pour confirmer qu'il échoue**

```bash
cd backend && npx jest embedding.service.spec --no-coverage
```

Expected: FAIL — `Cannot find module './embedding.service'`

- [ ] **Step 3: Implémenter EmbeddingService**

```typescript
// backend/src/shared/embedding/embedding.service.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'

@Injectable()
export class EmbeddingService {
  private readonly openaiClient: OpenAI

  constructor(private readonly configService: ConfigService) {
    this.openaiClient = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
    })
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openaiClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    return response.data[0].embedding
  }

  buildArticleEmbeddingInput(
    title: string,
    summary: string,
    content: string,
    tags: string[],
  ): string {
    return [title, summary, content, tags.join(' ')].filter(Boolean).join(' ')
  }
}
```

- [ ] **Step 4: Créer EmbeddingModule**

```typescript
// backend/src/shared/embedding/embedding.module.ts
import { Global, Module } from '@nestjs/common'
import { EmbeddingService } from './embedding.service'

@Global()
@Module({
  providers: [EmbeddingService],
  exports: [EmbeddingService],
})
export class EmbeddingModule {}
```

> L'annotation `@Global()` rend EmbeddingService injectable dans tous les modules sans import
> explicite — cohérent avec le pattern déjà utilisé par PrismaModule.

- [ ] **Step 5: Lancer le test pour confirmer qu'il passe**

```bash
cd backend && npx jest embedding.service.spec --no-coverage
```

Expected: PASS — 3 tests passing

- [ ] **Step 6: Commit**

```bash
git add backend/src/shared/embedding/
git commit -m "feat: add EmbeddingService with OpenAI text-embedding-3-small"
```

---

## Task 7 — Mettre à jour ArticlesService : génération d'embedding + endpoint reindex

**Files:**
- Modify: `backend/src/modules/articles/articles.service.ts`
- Modify: `backend/src/modules/articles/articles.controller.ts`
- Modify: `backend/src/modules/articles/articles.module.ts`

- [ ] **Step 1: Mettre à jour articles.module.ts pour exposer les guards**

```typescript
// backend/src/modules/articles/articles.module.ts
import { Module } from '@nestjs/common'
import { ArticlesController } from './articles.controller'
import { ArticlesService } from './articles.service'

@Module({
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
```

> EmbeddingService est @Global() — pas besoin de l'importer ici.

- [ ] **Step 2: Mettre à jour articles.service.ts**

Injecter `EmbeddingService` et appeler `generateEmbedding` après chaque create/update :

```typescript
// backend/src/modules/articles/articles.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../shared/prisma/prisma.service'
import { EmbeddingService } from '../../shared/embedding/embedding.service'
import type { User } from '@prisma/client'
import type { CreateArticleDto } from './dto/create-article.dto'
import type { UpdateArticleDto } from './dto/update-article.dto'

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
}

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  findByService(serviceId: string) {
    return this.prisma.article.findMany({
      where: { serviceId },
      select: ARTICLE_SELECT,
      orderBy: { updatedAt: 'desc' },
    })
  }

  findAll() {
    return this.prisma.article.findMany({
      select: ARTICLE_SELECT,
      orderBy: { updatedAt: 'desc' },
    })
  }

  findOne(id: string) {
    return this.prisma.article.findUniqueOrThrow({
      where: { id },
      select: ARTICLE_SELECT,
    })
  }

  async create(dto: CreateArticleDto, author: User) {
    if (!author.serviceId) throw new ForbiddenException()

    const article = await this.prisma.article.create({
      data: { ...dto, authorId: author.id, serviceId: author.serviceId },
      select: ARTICLE_SELECT,
    })

    this.scheduleEmbeddingGeneration(article.id, dto.title, dto.summary ?? '', dto.content, dto.tags ?? [])

    return article
  }

  async update(id: string, dto: UpdateArticleDto, requester: User) {
    const article = await this.prisma.article.findUniqueOrThrow({ where: { id } })
    if (article.serviceId !== requester.serviceId) throw new ForbiddenException()

    const updated = await this.prisma.article.update({
      where: { id },
      data: dto,
      select: ARTICLE_SELECT,
    })

    this.scheduleEmbeddingGeneration(
      updated.id,
      updated.title,
      updated.summary ?? '',
      updated.content,
      updated.tags,
    )

    return updated
  }

  async remove(id: string, requester: User) {
    const article = await this.prisma.article.findUniqueOrThrow({ where: { id } })
    if (article.serviceId !== requester.serviceId) throw new ForbiddenException()
    await this.prisma.article.delete({ where: { id } })
  }

  async reindexAllArticlesWithoutEmbedding(): Promise<{ indexed: number }> {
    const articlesWithoutEmbedding = await this.prisma.$queryRaw<{ id: string; title: string; summary: string | null; content: string; tags: string[] }[]>`
      SELECT id, title, summary, content, tags
      FROM "Article"
      WHERE embedding IS NULL
    `

    for (const article of articlesWithoutEmbedding) {
      await this.generateAndStoreEmbedding(
        article.id,
        article.title,
        article.summary ?? '',
        article.content,
        article.tags,
      )
    }

    return { indexed: articlesWithoutEmbedding.length }
  }

  private scheduleEmbeddingGeneration(
    articleId: string,
    title: string,
    summary: string,
    content: string,
    tags: string[],
  ): void {
    this.generateAndStoreEmbedding(articleId, title, summary, content, tags).catch((error) => {
      console.error(`Embedding generation failed for article ${articleId}:`, error)
    })
  }

  private async generateAndStoreEmbedding(
    articleId: string,
    title: string,
    summary: string,
    content: string,
    tags: string[],
  ): Promise<void> {
    const embeddingInput = this.embeddingService.buildArticleEmbeddingInput(title, summary, content, tags)
    const embeddingVector = await this.embeddingService.generateEmbedding(embeddingInput)
    const vectorString = `[${embeddingVector.join(',')}]`

    await this.prisma.$executeRaw`
      UPDATE "Article"
      SET embedding = ${vectorString}::vector
      WHERE id = ${articleId}
    `
  }
}
```

- [ ] **Step 3: Ajouter l'endpoint reindex dans articles.controller.ts**

Ajouter après les imports existants (corriger aussi les chemins des guards) :

```typescript
// backend/src/modules/articles/articles.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ArticlesService } from './articles.service'
import { JwtGuard }   from '../../shared/guards/jwt.guard'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { Roles }      from '../../shared/decorators/roles.decorator'
import { CreateArticleDto } from './dto/create-article.dto'
import { UpdateArticleDto } from './dto/update-article.dto'
import type { User } from '@prisma/client'

@UseGuards(JwtGuard)
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id)
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('RESPONSABLE')
  findByService(@Request() req: { user: User }) {
    return this.articlesService.findByService(req.user.serviceId!)
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('RESPONSABLE')
  create(@Body() dto: CreateArticleDto, @Request() req: { user: User }) {
    return this.articlesService.create(dto, req.user)
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('RESPONSABLE')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @Request() req: { user: User },
  ) {
    return this.articlesService.update(id, dto, req.user)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('RESPONSABLE')
  remove(@Param('id') id: string, @Request() req: { user: User }) {
    return this.articlesService.remove(id, req.user)
  }

  @Post('reindex')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  reindexEmbeddings() {
    return this.articlesService.reindexAllArticlesWithoutEmbedding()
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  findAll() {
    return this.articlesService.findAll()
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/articles/
git commit -m "feat: generate OpenAI embeddings on article save and add reindex endpoint"
```

---

## Task 8 — Mettre à jour SearchService avec pgvector

**Files:**
- Modify: `backend/src/modules/search/search.service.ts`
- Modify: `backend/src/modules/search/search.module.ts`

- [ ] **Step 1: Réécrire search.service.ts**

```typescript
// backend/src/modules/search/search.service.ts
import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService }    from '../../shared/prisma/prisma.service'
import { EmbeddingService } from '../../shared/embedding/embedding.service'
import type { User } from '@prisma/client'
import type { SearchDto } from './dto/search.dto'

export interface SearchResultItem {
  id: string
  title: string
  summary: string | null
  tags: string[]
  updatedAt: Date
  serviceName: string
  serviceSlug: string
  authorEmail: string
  similarityScore: number
}

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async search(dto: SearchDto, _requester: User): Promise<SearchResultItem[]> {
    const queryEmbedding = await this.embeddingService.generateEmbedding(dto.query)
    const vectorString = `[${queryEmbedding.join(',')}]`

    const serviceFilter = dto.serviceSlug
      ? Prisma.sql`AND s.slug = ${dto.serviceSlug}`
      : Prisma.empty

    const results = await this.prisma.$queryRaw<SearchResultItem[]>`
      SELECT
        a.id,
        a.title,
        a.summary,
        a.tags,
        a."updatedAt",
        s.name  AS "serviceName",
        s.slug  AS "serviceSlug",
        u.email AS "authorEmail",
        (1 - (a.embedding <=> ${vectorString}::vector)) AS "similarityScore"
      FROM "Article" a
      JOIN "Service" s ON a."serviceId" = s.id
      JOIN "User"    u ON a."authorId"  = u.id
      WHERE a.status   = 'PUBLISHED'
        AND a.embedding IS NOT NULL
        ${serviceFilter}
      ORDER BY a.embedding <=> ${vectorString}::vector ASC
      LIMIT 20
    `

    return results
  }
}
```

- [ ] **Step 2: Mettre à jour search.module.ts**

EmbeddingService est `@Global()`, donc aucun import supplémentaire nécessaire. Corriger
uniquement les chemins des guards dans `search.controller.ts` :

```diff
- import { JwtGuard }  from '../auth/guards/jwt.guard'
+ import { JwtGuard }  from '../../shared/guards/jwt.guard'
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/search/
git commit -m "feat: implement semantic search with pgvector cosine similarity"
```

---

## Task 9 — Créer UsersModule backend

**Files:**
- Create: `backend/src/modules/users/dto/create-user.dto.ts`
- Create: `backend/src/modules/users/dto/update-user.dto.ts`
- Create: `backend/src/modules/users/users.service.ts`
- Create: `backend/src/modules/users/users.controller.ts`
- Create: `backend/src/modules/users/users.module.ts`

- [ ] **Step 1: Créer create-user.dto.ts**

```typescript
// backend/src/modules/users/dto/create-user.dto.ts
import { IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator'
import { Role } from '@prisma/client'

export class CreateUserDto {
  @IsEmail()
  email: string

  @IsEnum(Role)
  role: Role

  @IsOptional()
  @IsUUID()
  serviceId?: string
}
```

- [ ] **Step 2: Créer update-user.dto.ts**

```typescript
// backend/src/modules/users/dto/update-user.dto.ts
import { IsEnum, IsOptional, IsUUID } from 'class-validator'
import { Role } from '@prisma/client'

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role

  @IsOptional()
  @IsUUID()
  serviceId?: string
}
```

- [ ] **Step 3: Créer users.service.ts**

```typescript
// backend/src/modules/users/users.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { randomBytes } from 'crypto'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../shared/prisma/prisma.service'
import type { CreateUserDto } from './dto/create-user.dto'
import type { UpdateUserDto } from './dto/update-user.dto'
import type { Role } from '@prisma/client'

export interface CreatedUserWithPassword {
  id: string
  email: string
  role: Role
  serviceId: string | null
  isActive: boolean
  createdAt: Date
  generatedPassword: string
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private generateStrongPassword(): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    const bytes = randomBytes(16)
    return Array.from(bytes, (byte) => charset[byte % charset.length]).join('')
  }

  async createUser(dto: CreateUserDto): Promise<CreatedUserWithPassword> {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existingUser) {
      throw new ConflictException(`Un compte avec l'adresse ${dto.email} existe déjà.`)
    }

    const generatedPassword = this.generateStrongPassword()
    const passwordHash = await bcrypt.hash(generatedPassword, 10)

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        serviceId: dto.serviceId ?? null,
        isActive: true,
      },
    })

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      serviceId: user.serviceId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      generatedPassword,
    }
  }

  findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        serviceId: true,
        isActive: true,
        createdAt: true,
        service: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    await this.findUserOrThrow(id)
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, email: true, role: true, serviceId: true, isActive: true, createdAt: true },
    })
  }

  async deactivateUser(id: string) {
    await this.findUserOrThrow(id)
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    })
  }

  private async findUserOrThrow(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable.`)
    return user
  }
}
```

- [ ] **Step 4: Créer users.controller.ts**

```typescript
// backend/src/modules/users/users.controller.ts
import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { JwtGuard }   from '../../shared/guards/jwt.guard'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { Roles }      from '../../shared/decorators/roles.decorator'

@Controller('users')
@UseGuards(JwtGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAllUsers() {
    return this.usersService.findAllUsers()
  }

  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto)
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto)
  }

  @Patch(':id/deactivate')
  deactivateUser(@Param('id') id: string) {
    return this.usersService.deactivateUser(id)
  }
}
```

- [ ] **Step 5: Créer users.module.ts**

```typescript
// backend/src/modules/users/users.module.ts
import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UsersService }    from './users.service'

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

---

## Task 10 — Tests UsersService + vérification du build backend

**Files:**
- Create: `backend/src/modules/users/users.service.spec.ts`

- [ ] **Step 1: Écrire users.service.spec.ts**

```typescript
// backend/src/modules/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from './users.service'
import { PrismaService } from '../../shared/prisma/prisma.service'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { Role } from '@prisma/client'

describe('UsersService', () => {
  let service: UsersService
  let mockPrisma: jest.Mocked<Pick<PrismaService, 'user'>>

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create:     jest.fn(),
        findMany:   jest.fn(),
        update:     jest.fn(),
      } as unknown as jest.Mocked<Pick<PrismaService, 'user'>>,
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  describe('createUser', () => {
    it('should throw ConflictException when the email already exists', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({ id: '1' })

      await expect(
        service.createUser({ email: 'existe@liberlo.com', role: Role.COLLABORATOR }),
      ).rejects.toThrow(ConflictException)
    })

    it('should return the created user with a 16-character generated password', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null)
      mockPrisma.user.create = jest.fn().mockResolvedValue({
        id: 'abc-123',
        email: 'nouveau@liberlo.com',
        role: Role.COLLABORATOR,
        serviceId: null,
        isActive: true,
        createdAt: new Date(),
      })

      const result = await service.createUser({
        email: 'nouveau@liberlo.com',
        role: Role.COLLABORATOR,
      })

      expect(result.email).toBe('nouveau@liberlo.com')
      expect(result.generatedPassword).toHaveLength(16)
      expect(result.isActive).toBe(true)
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'nouveau@liberlo.com', isActive: true }),
        }),
      )
    })
  })

  describe('deactivateUser', () => {
    it('should throw NotFoundException when the user does not exist', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null)

      await expect(service.deactivateUser('id-inexistant')).rejects.toThrow(NotFoundException)
    })

    it('should set isActive to false', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({ id: 'abc' })
      mockPrisma.user.update = jest.fn().mockResolvedValue({ id: 'abc', email: 'test@liberlo.com', isActive: false })

      const result = await service.deactivateUser('abc')

      expect(result.isActive).toBe(false)
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      )
    })
  })
})
```

- [ ] **Step 2: Lancer les tests UsersService**

```bash
cd backend && npx jest users.service.spec --no-coverage
```

Expected: PASS — 4 tests passing

- [ ] **Step 3: Vérifier que le build backend compile**

```bash
cd backend && npm run build
```

Expected: BUILD SUCCESS sans erreur TypeScript.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/users/
git commit -m "feat: add UsersModule with server-side password generation"
```

---

## Task 11 — Système de Toast frontend

**Files:**
- Create: `frontend/src/composables/useToast.ts`
- Create: `frontend/src/components/ui/ToastContainer.vue`

- [ ] **Step 1: Créer useToast.ts**

```typescript
// frontend/src/composables/useToast.ts
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function addToast(type: ToastType, message: string) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    toasts.value.push({ id, type, message })
    setTimeout(() => removeToast(id), 4000)
  }

  function removeToast(id: string) {
    const index = toasts.value.findIndex((toast) => toast.id === id)
    if (index !== -1) toasts.value.splice(index, 1)
  }

  return {
    toasts,
    success: (message: string) => addToast('success', message),
    error:   (message: string) => addToast('error', message),
    warning: (message: string) => addToast('warning', message),
    info:    (message: string) => addToast('info', message),
    removeToast,
  }
}
```

- [ ] **Step 2: Créer ToastContainer.vue**

```vue
<!-- frontend/src/components/ui/ToastContainer.vue -->
<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-start gap-3 rounded-xl p-4 shadow-lg border pointer-events-auto"
          :class="stylesByType[toast.type]"
        >
          <span class="text-lg leading-none">{{ iconByType[toast.type] }}</span>
          <span class="text-sm flex-1 leading-snug">{{ toast.message }}</span>
          <button
            class="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Fermer"
            @click="removeToast(toast.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

const stylesByType = {
  success: 'bg-green-50 border-green-200 text-green-900',
  error:   'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  info:    'bg-blue-50 border-blue-200 text-blue-900',
}

const iconByType = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
```

- [ ] **Step 3: Monter ToastContainer dans App.vue**

```vue
<!-- frontend/src/App.vue -->
<template>
  <RouterView />
  <ToastContainer />
</template>

<script setup lang="ts">
import ToastContainer from '@/components/ui/ToastContainer.vue'
</script>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/composables/useToast.ts frontend/src/components/ui/ToastContainer.vue frontend/src/App.vue
git commit -m "feat: add global toast notification system"
```

---

## Task 12 — Créer ConfirmModal, EmptyState, useAuth

**Files:**
- Create: `frontend/src/components/ui/ConfirmModal.vue`
- Create: `frontend/src/components/ui/EmptyState.vue`
- Create: `frontend/src/composables/useAuth.ts`

- [ ] **Step 1: Créer ConfirmModal.vue**

```vue
<!-- frontend/src/components/ui/ConfirmModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="$emit('cancel')"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">{{ title }}</h2>
          <p class="text-sm text-gray-600 mb-6">{{ message }}</p>
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              @click="$emit('cancel')"
            >
              Annuler
            </button>
            <button
              class="px-4 py-2 text-sm rounded-lg text-white font-medium transition-colors"
              :class="variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-700 hover:bg-purple-800'"
              @click="$emit('confirm')"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    isOpen: boolean
    title: string
    message: string
    confirmLabel?: string
    variant?: 'danger' | 'primary'
  }>(),
  { confirmLabel: 'Confirmer', variant: 'danger' },
)
defineEmits<{ confirm: []; cancel: [] }>()
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
```

- [ ] **Step 2: Créer EmptyState.vue**

```vue
<!-- frontend/src/components/ui/EmptyState.vue -->
<template>
  <div class="flex flex-col items-center justify-center py-16 text-center px-4">
    <div class="text-5xl mb-4 opacity-70">{{ icon }}</div>
    <h3 class="text-base font-semibold text-gray-700 mb-1">{{ title }}</h3>
    <p v-if="description" class="text-sm text-gray-400 max-w-sm">{{ description }}</p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string
    title: string
    description?: string
  }>(),
  { icon: '📭' },
)
</script>
```

- [ ] **Step 3: Créer useAuth.ts**

```typescript
// frontend/src/composables/useAuth.ts
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const authStore = useAuthStore()

  return {
    currentUser:    computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    isSuperAdmin:   computed(() => authStore.user?.role === 'SUPER_ADMIN'),
    isResponsable:  computed(() => authStore.user?.role === 'RESPONSABLE'),
    isCollaborator: computed(() => authStore.user?.role === 'COLLABORATOR'),
    logout:         () => authStore.logout(),
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/ frontend/src/composables/useAuth.ts
git commit -m "feat: add ConfirmModal, EmptyState components and useAuth composable"
```

---

## Task 13 — Créer UserDrawer.vue

**Files:**
- Create: `frontend/src/components/domain/users/UserDrawer.vue`

- [ ] **Step 1: Créer le dossier et le composant**

```bash
mkdir -p frontend/src/components/domain/users
```

```vue
<!-- frontend/src/components/domain/users/UserDrawer.vue -->
<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="isOpen" class="fixed inset-0 z-40 flex justify-end">
        <div class="absolute inset-0 bg-black/30" @click="$emit('close')" />

        <div class="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
          <!-- En-tête -->
          <div class="flex items-center justify-between px-6 py-4 border-b">
            <h2 class="text-lg font-semibold text-gray-900">Créer un utilisateur</h2>
            <button
              class="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
              @click="$emit('close')"
            >
              ✕
            </button>
          </div>

          <!-- Formulaire -->
          <form class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5" @submit.prevent="handleSubmit">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="prenom.nom@liberlo.com"
                class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
              <select
                v-model="form.role"
                required
                class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="" disabled>Choisir un rôle</option>
                <option value="COLLABORATOR">Collaborateur</option>
                <option value="RESPONSABLE">Responsable de service</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            <div v-if="form.role === 'RESPONSABLE'">
              <label class="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <select
                v-model="form.serviceId"
                required
                class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="" disabled>Choisir un service</option>
                <option v-for="service in services" :key="service.id" :value="service.id">
                  {{ service.name }}
                </option>
              </select>
            </div>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="mt-auto w-full bg-purple-700 text-white rounded-xl py-3 text-sm font-medium hover:bg-purple-800 disabled:opacity-50 transition-colors"
            >
              {{ isSubmitting ? 'Création en cours…' : 'Créer le compte' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Modale mot de passe généré -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="generatedPassword"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-1">Compte créé ✓</h3>
          <p class="text-sm text-gray-500 mb-4">
            Communiquez ce mot de passe à <strong class="text-gray-800">{{ createdEmail }}</strong>.
            <span class="block mt-1 text-xs text-red-500">
              Il ne sera plus affiché après fermeture de cette fenêtre.
            </span>
          </p>

          <div class="bg-gray-100 rounded-xl p-4 font-mono text-center text-xl tracking-widest text-gray-800 mb-5 select-all">
            {{ generatedPassword }}
          </div>

          <div class="flex gap-3">
            <button
              class="flex-1 bg-purple-700 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-purple-800 transition-colors"
              @click="copyPasswordToClipboard"
            >
              {{ isCopied ? 'Copié ✓' : 'Copier' }}
            </button>
            <button
              class="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
              @click="closePasswordModal"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'

defineProps<{
  isOpen: boolean
  services: Array<{ id: string; name: string; slug: string }>
}>()

const emit = defineEmits<{ close: []; created: [] }>()

const { post } = useApi()
const toast = useToast()

const form = reactive({ email: '', role: '', serviceId: '' })
const isSubmitting = ref(false)
const generatedPassword = ref<string | null>(null)
const createdEmail = ref('')
const isCopied = ref(false)

async function handleSubmit() {
  isSubmitting.value = true
  try {
    const payload: Record<string, string> = { email: form.email, role: form.role }
    if (form.role === 'RESPONSABLE') payload.serviceId = form.serviceId

    const result = await post<{ email: string; generatedPassword: string }>('/users', payload)
    createdEmail.value = result.email
    generatedPassword.value = result.generatedPassword
    form.email = ''
    form.role = ''
    form.serviceId = ''
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la création'
    toast.error(message)
  } finally {
    isSubmitting.value = false
  }
}

async function copyPasswordToClipboard() {
  if (!generatedPassword.value) return
  await navigator.clipboard.writeText(generatedPassword.value)
  isCopied.value = true
  setTimeout(() => { isCopied.value = false }, 2000)
}

function closePasswordModal() {
  generatedPassword.value = null
  createdEmail.value = ''
  isCopied.value = false
  emit('created')
  emit('close')
}
</script>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: transform 0.3s ease; }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/domain/
git commit -m "feat: add UserDrawer with generated password display modal"
```

---

## Task 14 — Créer UsersPage.vue

**Files:**
- Create: `frontend/src/pages/admin/UsersPage.vue`

- [ ] **Step 1: Créer le dossier si absent**

```bash
mkdir -p frontend/src/pages/admin
```

- [ ] **Step 2: Créer UsersPage.vue**

```vue
<!-- frontend/src/pages/admin/UsersPage.vue -->
<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
      <button
        class="bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-800 transition-colors"
        @click="isDrawerOpen = true"
      >
        + Créer un utilisateur
      </button>
    </div>

    <!-- Filtres -->
    <div class="flex gap-3 mb-5">
      <select v-model="roleFilter" class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
        <option value="">Tous les rôles</option>
        <option value="COLLABORATOR">Collaborateurs</option>
        <option value="RESPONSABLE">Responsables</option>
        <option value="SUPER_ADMIN">Super Admin</option>
      </select>
    </div>

    <!-- Chargement -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="n in 5" :key="n" class="h-14 bg-gray-100 rounded-xl animate-pulse" />
    </div>

    <!-- Vide -->
    <EmptyState
      v-else-if="filteredUsers.length === 0"
      icon="👥"
      title="Aucun utilisateur trouvé"
      description="Ajustez les filtres ou créez un premier utilisateur."
    />

    <!-- Tableau -->
    <div v-else class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-5 py-3.5 text-gray-500 font-medium">Email</th>
            <th class="text-left px-5 py-3.5 text-gray-500 font-medium">Rôle</th>
            <th class="text-left px-5 py-3.5 text-gray-500 font-medium">Service</th>
            <th class="text-left px-5 py-3.5 text-gray-500 font-medium">Statut</th>
            <th class="text-left px-5 py-3.5 text-gray-500 font-medium">Créé le</th>
            <th class="px-5 py-3.5" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-5 py-3.5 font-medium text-gray-800">{{ user.email }}</td>
            <td class="px-5 py-3.5">
              <span class="text-xs font-medium px-2.5 py-1 rounded-full" :class="roleBadgeClass(user.role)">
                {{ roleLabelByKey[user.role] }}
              </span>
            </td>
            <td class="px-5 py-3.5 text-gray-600">{{ user.service?.name ?? '—' }}</td>
            <td class="px-5 py-3.5">
              <span :class="user.isActive ? 'text-green-600' : 'text-gray-400'">
                {{ user.isActive ? 'Actif' : 'Désactivé' }}
              </span>
            </td>
            <td class="px-5 py-3.5 text-gray-400">{{ formatDate(user.createdAt) }}</td>
            <td class="px-5 py-3.5 text-right">
              <button
                v-if="user.isActive"
                class="text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
                @click="openDeactivateConfirm(user)"
              >
                Désactiver
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UserDrawer
      :is-open="isDrawerOpen"
      :services="services"
      @close="isDrawerOpen = false"
      @created="loadUsers"
    />

    <ConfirmModal
      :is-open="!!userToDeactivate"
      title="Désactiver ce compte ?"
      :message="`Le compte ${userToDeactivate?.email} ne pourra plus se connecter. Les articles rédigés sont conservés.`"
      confirm-label="Désactiver"
      variant="danger"
      @confirm="confirmDeactivate"
      @cancel="userToDeactivate = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import EmptyState from '@/components/ui/EmptyState.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import UserDrawer from '@/components/domain/users/UserDrawer.vue'

interface ServiceSummary { id: string; name: string; slug: string }

interface UserItem {
  id: string
  email: string
  role: 'COLLABORATOR' | 'RESPONSABLE' | 'SUPER_ADMIN'
  isActive: boolean
  createdAt: string
  service: ServiceSummary | null
}

const { get, patch } = useApi()
const toast = useToast()

const users = ref<UserItem[]>([])
const services = ref<ServiceSummary[]>([])
const isLoading = ref(true)
const isDrawerOpen = ref(false)
const roleFilter = ref('')
const userToDeactivate = ref<UserItem | null>(null)

const roleLabelByKey: Record<string, string> = {
  COLLABORATOR: 'Collaborateur',
  RESPONSABLE:  'Responsable',
  SUPER_ADMIN:  'Super Admin',
}

const roleBadgeClass = (role: string) => ({
  'bg-blue-100 text-blue-700':   role === 'COLLABORATOR',
  'bg-purple-100 text-purple-700': role === 'RESPONSABLE',
  'bg-gray-800 text-white':      role === 'SUPER_ADMIN',
})

const filteredUsers = computed(() =>
  roleFilter.value ? users.value.filter((u) => u.role === roleFilter.value) : users.value,
)

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function loadUsers() {
  isLoading.value = true
  try {
    users.value = await get<UserItem[]>('/users')
  } catch {
    toast.error('Impossible de charger les utilisateurs.')
  } finally {
    isLoading.value = false
  }
}

async function loadServices() {
  services.value = await get<ServiceSummary[]>('/services')
}

function openDeactivateConfirm(user: UserItem) {
  userToDeactivate.value = user
}

async function confirmDeactivate() {
  if (!userToDeactivate.value) return
  try {
    await patch(`/users/${userToDeactivate.value.id}/deactivate`, {})
    toast.success(`Compte ${userToDeactivate.value.email} désactivé.`)
    await loadUsers()
  } catch {
    toast.error('Erreur lors de la désactivation.')
  } finally {
    userToDeactivate.value = null
  }
}

onMounted(() => {
  loadUsers()
  loadServices()
})
</script>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/UsersPage.vue
git commit -m "feat: add UsersPage with table, filters, and deactivation"
```

---

## Task 15 — Mettre à jour AppHeader avec menu admin

**Files:**
- Modify: `frontend/src/components/layout/AppHeader.vue`

- [ ] **Step 1: Ajouter le lien admin dans le menu utilisateur SUPER_ADMIN**

Lire le fichier existant, puis ajouter dans le menu déroulant (dropdown) du profil,
après l'élément "Dashboard global" existant :

```vue
<!-- À ajouter dans le menu déroulant de AppHeader.vue, section SUPER_ADMIN -->
<RouterLink
  v-if="isSuperAdmin"
  to="/admin/users"
  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
  @click="closeMenu"
>
  Gérer les utilisateurs
</RouterLink>
```

Utiliser le composable `useAuth` pour remplacer les vérifications de rôle manuelles existantes :

```typescript
import { useAuth } from '@/composables/useAuth'
const { isSuperAdmin, isResponsable, logout } = useAuth()
```

- [ ] **Step 2: Vérifier l'affichage conditionnel du menu**

Le menu doit afficher :
- **Tous** : Profil, Déconnexion
- **RESPONSABLE** : + Ajouter une info (→ `/dashboard/new`)
- **SUPER_ADMIN** : + Dashboard global (→ `/dashboard/global`), + Gérer les utilisateurs (→ `/admin/users`)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/AppHeader.vue
git commit -m "feat: add admin users link in header menu for SUPER_ADMIN"
```

---

## Task 16 — Vérification du build frontend + test manuel des parcours

**Files:** aucun fichier créé — vérification seulement

- [ ] **Step 1: Lancer le build TypeScript frontend**

```bash
cd frontend && npm run typecheck
```

Expected: 0 erreurs TypeScript.

- [ ] **Step 2: Démarrer les services**

```bash
docker compose up -d
cd backend && npm run start:dev &
cd frontend && npm run dev
```

- [ ] **Step 3: Vérifier le parcours COLLABORATEUR**

1. Aller sur `http://localhost:5173`
2. Se connecter avec `csm1@liberlo.com` / `Liberlo2026!`
3. Lancer une recherche → vérifier que les résultats s'affichent (texte si embeddings pas encore générés)
4. Naviguer vers un service → liste d'articles
5. Ouvrir un article → rendu markdown correct

- [ ] **Step 4: Vérifier le parcours RESPONSABLE**

1. Se connecter avec `responsable.it@liberlo.com` / `Liberlo2026!`
2. Aller sur `/dashboard` → tableau des articles du service
3. Créer un article → vérifier le toast "Article créé"
4. Modifier → supprimer (modale de confirmation)
5. Vérifier que les routes `/admin/users` et `/dashboard/global` redirigent vers `/403`

- [ ] **Step 5: Vérifier le parcours SUPER_ADMIN**

1. Se connecter avec `ceo@liberlo.com` / `Liberlo2026!`
2. Vérifier le menu : "Dashboard global" et "Gérer les utilisateurs" présents
3. Aller sur `/admin/users` → tableau des 18 utilisateurs
4. Créer un utilisateur test → copier le mot de passe généré
5. Se déconnecter, se connecter avec le nouveau compte → connexion réussie

- [ ] **Step 6: Déclencher le reindex des embeddings**

```bash
curl -X POST http://localhost:3001/articles/reindex \
  -H "Authorization: Bearer <token_super_admin>"
```

Expected: `{ "indexed": 43 }` (les 43 articles du seed)

- [ ] **Step 7: Relancer une recherche sémantique**

Chercher "onboarding nouveau collaborateur" → résultats triés par similarité cosinus,
différents de l'ordre alphabétique ou chronologique.

- [ ] **Step 8: Commit final**

```bash
git add -A
git commit -m "feat: complete core app with semantic search, user management and polished UI"
```

---

## Vérification de couverture du spec

| Exigence spec | Task |
|---|---|
| Recherche sémantique OpenAI + pgvector | Tasks 6, 7, 8 |
| Fallback texte si embedding NULL | Task 8 (filtre `embedding IS NOT NULL`) |
| Endpoint reindex SUPER_ADMIN | Task 7 |
| Gestion utilisateurs CRUD backend | Task 9 |
| Mot de passe généré côté serveur, affiché une fois | Tasks 9, 13 |
| Frontend UsersPage avec filtres | Task 14 |
| Modale de confirmation désactivation | Tasks 12, 14 |
| Système Toast global | Task 11 |
| EmptyState sur toutes les vues vides | Tasks 12, 14 |
| 3 parcours utilisateur vérifiés | Task 16 |
| Menu header conditionnel par rôle | Task 15 |
| Arborescence modules/ + shared/ | Tasks 2, 3, 4 |
| Tests unitaires EmbeddingService | Task 6 |
| Tests unitaires UsersService | Task 10 |
