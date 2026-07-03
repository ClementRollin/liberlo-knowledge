# Backend — NestJS / Prisma / PostgreSQL

## Stack

- NestJS + TypeScript
- Prisma (ORM)
- PostgreSQL + extension pgvector
- JWT pour l'authentification
- Redis en option (jobs asynchrones, cache)

## Architecture

Architecture modulaire NestJS classique : un module par domaine
(`auth`, `users`, `services`, `articles`, `search`, `slack-notifications`).
Chaque module suit le pattern Controller → Service → Repository (via Prisma).

Aucune logique de permission ne doit résider dans le frontend : tout est
validé côté backend via des guards.

## Modèle de données (entités principales)

### User
- id
- email (unique, professionnel)
- passwordHash
- role : `COLLABORATOR` | `RESPONSABLE` | `SUPER_ADMIN`
- serviceId (nullable, obligatoire si RESPONSABLE)
- isActive
- activationToken (UUID, usage unique, expiration 24-72h)
- createdAt

### Service
- id
- name
- slug
- description

### Article
- id
- title
- content
- summary
- type
- serviceId
- visibility
- status (`brouillon` | `publié`)
- tags
- authorId
- embedding (vector, via pgvector)
- createdAt / updatedAt

Utilise Prisma pour générer et versionner le schéma (`schema.prisma`) —
ne pas écrire de SQL brut sauf nécessité spécifique (ex. requêtes de
similarité pgvector non supportées nativement par Prisma).

## Endpoints principaux

- `POST /auth/activate` — activation de compte via token
- `POST /auth/login` — connexion classique (email + mot de passe)
- `POST /search` — recherche sémantique (query + filtres)
- `GET /admin/articles` — listing global (SUPER_ADMIN uniquement, lecture seule)
- CRUD articles scopé au service pour RESPONSABLE

## Guards & permissions

- Guard JWT global sur toutes les routes sauf `/auth/login` et `/auth/activate`
- Guard de rôle par route (`@Roles('RESPONSABLE')`, etc.)
- Vérification systématique que le `serviceId` de la ressource correspond au
  service du RESPONSABLE qui agit dessus
- Aucune élévation de privilège possible côté client

## Conventions de code

- DTOs validés avec `class-validator`
- Un service Nest ne doit jamais accéder directement à `req` — passer les
  données nécessaires en paramètres depuis le controller
- Erreurs métier explicites (ex. `ForbiddenException`, `NotFoundException`)
  plutôt que des 500 génériques

## Avant d'écrire du code Prisma

Utilise le CLI Prisma (`npx prisma migrate dev`, `npx prisma studio`,
`npx prisma generate`) plutôt que de modifier des migrations à la main,
sauf cas particulier (ex. requêtes vectorielles pgvector).
