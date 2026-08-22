# Liberlo Knowledge Base

Base de connaissances interne pour Liberlo — prototype réalisé dans le cadre du
mémoire professionnel MBA2 (Master Développeur Full Stack, MyDigitalSchool Lyon)
de Clément Rollin.

L'outil centralise, structure et rend retrouvable l'information interne de Liberlo
(procédures, produit, bonnes pratiques) via une **recherche sémantique** (embeddings
+ pgvector), tout en appliquant une gouvernance stricte des rôles et des accès.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Vue 3 + TypeScript + Vite 8 + Tailwind CSS 4 + Pinia + Vue Router |
| Backend | NestJS 11 + TypeScript + Prisma ORM |
| Base de données | PostgreSQL 16 + extension pgvector |
| Embeddings | Ollama `nomic-embed-text` (768 dim, local, gratuit) |
| Authentification | JWT (access token en mémoire Pinia, jamais localStorage) |
| Tests | Jest (unit) + Supertest (E2E) |
| Infrastructure | Docker Compose (db + backend) + ngrok (démo) |

---

## Prérequis

- Docker Desktop
- Node.js 20+
- [Ollama](https://ollama.com) installé et démarré avec `nomic-embed-text` :

```bash
ollama pull nomic-embed-text
```

---

## Démarrage rapide

```bash
# 1. Copier et configurer les variables d'environnement
cp backend/.env.example backend/.env
# Vérifier que OLLAMA_URL=http://localhost:11434 (local)
# ou http://host.docker.internal:11434 (Docker)

# 2. Démarrer DB + backend (Docker)
docker compose up -d

# 3. Charger les données de démo (74 articles + embeddings)
docker compose exec backend npx prisma db seed

# 4. Démarrer le frontend
cd frontend && npm install && npm run dev
```

Frontend : `http://localhost:5173`
Backend : `http://localhost:3001`
Swagger : `http://localhost:3001/api/docs`

---

## Comptes de démo

Mot de passe universel : **`Liberlo2026!`**

| Email | Rôle | Accès |
|---|---|---|
| `ceo@liberlo.com` | SUPER_ADMIN | Dashboard global, lecture tous services |
| `marc.dupont@liberlo.com` | RESPONSABLE — IT | Dashboard IT, CRUD articles IT |
| `alice.martin@liberlo.com` | RESPONSABLE — CSM | Dashboard CSM, CRUD articles CSM |
| `sarah.leblanc@liberlo.com` | RESPONSABLE — CSM | Dashboard CSM |
| `jean.leclerc@liberlo.com` | COLLABORATOR | Recherche + lecture seule |

---

## Rôles et permissions

| Rôle | Droits |
|---|---|
| `COLLABORATOR` | Lecture des articles publiés de son service |
| `RESPONSABLE` | CRUD articles de son service uniquement |
| `SUPER_ADMIN` | Lecture globale tous services + dashboard transverse |

---

## Architecture backend

```
src/
├── auth/          POST /auth/login, POST /auth/activate
├── users/         CRUD utilisateurs (SUPER_ADMIN)
├── services/      GET /services, GET /services/:slug/articles
├── articles/      CRUD articles (RESPONSABLE scopé à son service)
├── search/        POST /search — hybride sémantique + keyword
├── admin/         GET /admin/articles (SUPER_ADMIN)
├── conversations/ Historique multi-tour des recherches
├── import/        Google Drive + Confluence + analyse Claude Haiku
└── embedding/     Ollama nomic-embed-text via fetch
```

### Recherche sémantique

1. À la création/MàJ d'un article → embedding généré en arrière-plan (non-bloquant)
2. À la recherche → embedding de la requête + similarité cosinus pgvector
3. Résultats fusionnés : score sémantique + score keyword, triés par pertinence
4. Filtre préalable : `status = PUBLISHED` et `visibility != INTERNAL`

---

## Branches

| Branche | Rôle |
|---|---|
| `develop` | Intégration des features (squash merges depuis les feature branches) |
| `re7` | Staging / pré-production |
| `main` | Production / soutenance |

Workflow : `feature/* → develop → re7 → main`

---

## Commandes utiles

```bash
# Backend (local)
cd backend && npm run start:dev      # Dev avec hot-reload
cd backend && npm run test           # Tests unitaires
cd backend && npm run test:e2e       # Tests E2E
cd backend && npm run build          # Build TypeScript

# Frontend
cd frontend && npm run dev           # Dev server :5173
cd frontend && npm run build         # Build production
cd frontend && npm run type-check    # Vérification TypeScript
cd frontend && npm run lint          # ESLint

# Prisma
cd backend && npx prisma studio      # UI d'exploration de la DB
cd backend && npx prisma migrate dev # Nouvelle migration
cd backend && npx prisma db seed     # Charger les données de démo

# Docker
docker compose up -d                 # Démarrer DB + backend
docker compose down                  # Arrêter
docker compose logs -f backend       # Logs backend
```

---

## Setup démo (soutenance / ngrok)

Voir `docs/demo-ngrok.md` pour la procédure complète testée.

En résumé :

```bash
docker compose up -d                    # 1. DB + backend
cd frontend && npm run dev              # 2. Frontend :5173
ngrok http 5173                         # 3. Tunnel public → donner l'URL au jury
```

Le proxy Vite (`/api → localhost:3001`) gère tous les appels API —
aucune modification de `FRONTEND_URL` ni redémarrage Docker nécessaire.

---

## Variables d'environnement clés (`backend/.env`)

```env
DATABASE_URL="postgresql://liberlo:liberlo_dev@localhost:5432/liberlo_kb?schema=public"
JWT_SECRET="changeme_in_production_use_strong_random_secret"
JWT_EXPIRES_IN="8h"
OLLAMA_URL="http://localhost:11434"          # ou host.docker.internal:11434 (Docker)
ANTHROPIC_API_KEY="sk-ant-..."              # Optionnel — module Import uniquement
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

---

## Note RGPD

Ce prototype utilise exclusivement des **données fictives** (dummy data).
L'exposition via ngrok est temporaire et limitée à la fenêtre de soutenance.
Aucune donnée réelle Liberlo n'est présente dans la base de démonstration.
