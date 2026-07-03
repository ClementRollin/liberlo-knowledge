# Liberlo Knowledge Base

Base de connaissances interne pour Liberlo — prototype développé dans le cadre du
mémoire professionnel MBA2 (MyDigitalSchool Lyon) de Clément Rollin.

## Stack

| Couche | Technologie |
|---|---|
| Frontend | Vue 3 + TypeScript + Vite + Tailwind CSS 4 + Pinia |
| Backend | NestJS 11 + TypeScript + Prisma |
| Base de données | PostgreSQL 16 + pgvector |
| Recherche sémantique | OpenAI `text-embedding-3-small` + pgvector |

## Démarrage rapide

### Prérequis

- Docker + Docker Compose
- Node.js 20+
- Une clé API OpenAI

### Installation

```bash
# 1. Copier les variables d'environnement
cp .env.example backend/.env
# Renseigner OPENAI_API_KEY dans backend/.env

# 2. Démarrer PostgreSQL
docker compose up -d

# 3. Installer et migrer le backend
cd backend
npm install
npx prisma migrate dev
npm run seed          # Charger les données de demo

# 4. Installer et démarrer le frontend
cd ../frontend
npm install
npm run dev
```

Le frontend est disponible sur `http://localhost:5173`.
Le backend tourne sur `http://localhost:3001`.

### Comptes de demo

| Email | Mot de passe | Rôle |
|---|---|---|
| `ceo@liberlo.com` | `Liberlo2026!` | Super Admin |
| `responsable.it@liberlo.com` | `Liberlo2026!` | Responsable IT |
| `csm1@liberlo.com` | `Liberlo2026!` | Collaborateur |

### Générer les embeddings (recherche sémantique)

Après le seed, les articles n'ont pas encore d'embeddings. Se connecter en tant que
Super Admin, récupérer le JWT, puis :

```bash
./scripts/generate-embeddings.sh <votre_jwt>
```

## Branches

| Branche | Rôle |
|---|---|
| `develop` | Développement actif |
| `staging` | Tests pré-production |
| `main` | Production |

## Commandes utiles

```bash
# Backend
cd backend && npm run start:dev    # Serveur de développement
cd backend && npm run test         # Tests unitaires
cd backend && npm run build        # Compilation TypeScript

# Frontend
cd frontend && npm run dev         # Serveur de développement
cd frontend && npm run build       # Build production (inclut TypeCheck)

# Base de données
./scripts/reset-db.sh             # Reset + reseed
docker compose logs -f postgres   # Logs PostgreSQL
```
