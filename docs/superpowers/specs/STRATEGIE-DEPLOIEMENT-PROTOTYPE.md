# Stratégie de déploiement — Prototype Liberlo Knowledge Base

Ce document définit la stratégie de déploiement du prototype technique réalisé dans le cadre du mémoire professionnel MBA2 de Clément Rollin (Master Développeur Full Stack, MyDigitalSchool Lyon). Il complète `docs/suivi-technique.md` (choix techniques) et `.claude/rules/securite-rgpd.md` (justification RGPD de la démo) sans les dupliquer.

## 1. Objectif et périmètre

Le prototype n'a pas vocation à être déployé en production réelle chez Liberlo (cf. `CLAUDE.md` : usage académique et démonstratif exclusivement, base de données factice, exposition ngrok limitée à la fenêtre de soutenance). L'objectif de cette stratégie n'est donc pas de industrialiser un service de production, mais de disposer d'une **chaîne de déploiement traçable, testée et reproductible** pour :

- alimenter un environnement de démonstration stable, accessible en amont de la soutenance pour les répétitions ;
- servir de support de démonstration technique en soutenance (partie 3 du mémoire — architecture technique) ;
- illustrer une pratique DevOps rigoureuse, cohérente avec le niveau attendu d'un mémoire MBA (vision managériale et stratégique, cf. grille d'évaluation).

## 2. Principe directeur

L'analyse de `STRATEGIE-DEPLOIEMENT-LIBERLO.md` (parc applicatif réel de Liberlo) a mis en évidence un écart récurrent chez `liberlo-phoenix` et `phoenix-front` : la CI s'arrête avant la mise en production, et le déploiement réel repose sur un mécanisme externe non conditionné par les tests (git-push-to-deploy Forge, publication Nginx non scriptée).

La présente stratégie applique, pour le prototype, le principe inverse recommandé par ce même document (§4.1) : **le déploiement doit être une étape explicite du pipeline CI, visible dans GitHub Actions, et conditionnée au succès des étapes précédentes (installation, génération Prisma, migrations, build)** — plutôt qu'un déploiement automatique déclenché indépendamment par la plateforme d'hébergement (Railway, Vercel) sur simple `git push`.

Concrètement, cela implique de **désactiver le déploiement automatique natif** de Railway et de Vercel sur push, pour que seul le pipeline GitHub Actions déclenche un déploiement — après tests.

## 3. Architecture cible de déploiement

| Composant | Plateforme | Déclenchement |
|---|---|---|
| Backend (NestJS) | Railway | Déploiement piloté par GitHub Actions (CLI Railway), auto-deploy Railway désactivé |
| Frontend (Vue 3 / Vite) | Vercel | Déploiement piloté par GitHub Actions (CLI Vercel), intégration Git Vercel désactivée |
| Base de données | Neon (PostgreSQL + pgvector) | Migrations Prisma appliquées par le pipeline (`prisma migrate deploy`) |

## 4. Environnements

| Environnement | Branche | Usage | Base de données |
|---|---|---|---|
| `production` | `main` | Démonstration finale (soutenance) | Neon — instance dédiée, données factices |
| `re7` | `re7` | Recette / répétitions avant soutenance | Neon — instance dédiée, données factices |
| Local (dev) | toute branche | Développement quotidien (WSL) | PostgreSQL local Docker |

Le nom `re7` reprend la convention d'environnement de recette déjà utilisée en interne chez Liberlo (préfixe `re7-` observé sur le dépôt `liberlo`), pour rester cohérent avec le vocabulaire de l'entreprise plutôt que d'introduire une convention arbitraire (`staging`, `preview`, etc.).

Aucune donnée réelle Liberlo ne doit transiter par ces environnements, quelle que soit la plateforme (cf. `.claude/rules/securite-rgpd.md`).

## 5. Secrets à configurer

Dans GitHub → *Settings* → *Environments*, créer les environnements `production` et `re7`, et renseigner pour chacun :

| Secret | Description | Où l'obtenir |
|---|---|---|
| `DATABASE_URL` | Chaîne de connexion Neon de l'environnement | Dashboard Neon → Connection string |
| `VITE_API_URL` | URL publique du backend Railway de l'environnement | Dashboard Railway → Domains |
| `RAILWAY_TOKEN` | Token de déploiement Railway | Dashboard Railway → Project Settings → Tokens |
| `VERCEL_TOKEN` | Token d'API Vercel | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Identifiant de l'organisation Vercel | Fichier `.vercel/project.json` après `vercel link` |
| `VERCEL_PROJECT_ID` | Identifiant du projet Vercel | Fichier `.vercel/project.json` après `vercel link` |

Chaque environnement (`production`, `re7`) doit avoir ses propres valeurs — ne jamais réutiliser le token ou la base `production` pour `re7`.

## 6. Pipeline CI/CD

### 6.1 `deploy-production.yml`

Remplace le stage `Deploy (à configurer)` existant par un déploiement effectif, gardé après build :

```yaml
name: Deploy — Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-production:
    name: Deploy to production environment
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install backend dependencies
        run: cd backend && npm ci

      - name: Generate Prisma client
        run: cd backend && npx prisma generate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Run database migrations
        run: cd backend && npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Build backend
        run: cd backend && npm run build

      - name: Build frontend
        run: cd frontend && npm ci && npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      - name: Install Railway CLI
        run: npm i -g @railway/cli

      - name: Deploy backend to Railway
        working-directory: backend
        run: railway up --service backend --environment production
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Install Vercel CLI
        run: npm i -g vercel

      - name: Deploy frontend to Vercel
        working-directory: frontend
        run: |
          vercel pull --yes --environment=production --token=$VERCEL_TOKEN
          vercel build --prod --token=$VERCEL_TOKEN
          vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 6.2 `deploy-re7.yml`

Même logique, adaptée à l'environnement de recette (déploiement Vercel en mode preview plutôt que `--prod`) :

```yaml
name: Deploy — Re7 (staging)

on:
  push:
    branches: [re7]
  workflow_dispatch:

jobs:
  deploy-re7:
    name: Deploy to re7 environment
    runs-on: ubuntu-latest
    environment: re7

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install backend dependencies
        run: cd backend && npm ci

      - name: Generate Prisma client
        run: cd backend && npx prisma generate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Run database migrations
        run: cd backend && npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Build backend
        run: cd backend && npm run build

      - name: Build frontend
        run: cd frontend && npm ci && npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      - name: Install Railway CLI
        run: npm i -g @railway/cli

      - name: Deploy backend to Railway
        working-directory: backend
        run: railway up --service backend --environment re7
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Install Vercel CLI
        run: npm i -g vercel

      - name: Deploy frontend to Vercel (preview)
        working-directory: frontend
        run: |
          vercel pull --yes --environment=preview --token=$VERCEL_TOKEN
          vercel build --token=$VERCEL_TOKEN
          vercel deploy --prebuilt --token=$VERCEL_TOKEN
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

Le seed (`prisma db seed`) n'est volontairement **pas** inclus dans le pipeline : il doit rester une commande manuelle (cf. `docs/suivi-technique.md`), pour éviter de réinitialiser accidentellement les données de démonstration à chaque déploiement.

## 7. Procédure de rollback

- **Railway** : Dashboard → Deployments → sélectionner le déploiement précédent → *Redeploy*.
- **Vercel** : Dashboard → Deployments → sélectionner le déploiement précédent → *Promote to Production* (ou `vercel rollback <url>` en CLI).
- **Base de données** : les migrations Prisma étant additives par construction sur ce prototype, aucun rollback de schéma n'est prévu ; en cas de problème, reseed manuel de l'environnement concerné.

## 8. Sécurité et RGPD

Rappel synthétique (détail complet dans `.claude/rules/securite-rgpd.md`) :

- Aucune donnée réelle Liberlo dans `production` ou `re7` — uniquement les données factices seedées.
- Les secrets (`DATABASE_URL`, tokens Railway/Vercel) sont stockés exclusivement dans les *Environments* GitHub, jamais en clair dans les workflows ni dans le dépôt.
- L'exposition ngrok reste réservée à la fenêtre de soutenance ; elle est indépendante de cette stratégie de déploiement (qui concerne Railway/Vercel, pas ngrok).

## 9. Limites assumées

Cette stratégie de déploiement est **indépendante de l'infrastructure réelle de Liberlo** (GitLab CI, Laravel Forge, Nginx — cf. `STRATEGIE-DEPLOIEMENT-LIBERLO.md`). Le choix de GitHub Actions / Railway / Vercel / Neon est justifié par le périmètre académique du prototype, hébergé hors du système d'information de l'entreprise. Une éventuelle opérationnalisation future de l'outil nécessiterait un travail d'alignement avec les conventions de déploiement déjà en place chez Liberlo (probablement une migration vers GitLab CI et un hébergement cohérent avec le reste du parc applicatif), plutôt qu'un maintien de cette chaîne telle quelle — au risque, sinon, d'ajouter une cinquième stack de déploiement à un parc que la stratégie existante cherche justement à homogénéiser.

## 10. Checklist de mise en œuvre

- [ ] Créer un projet Railway pour le backend, avec deux environnements (`production`, `re7`)
- [ ] Créer un projet Vercel pour le frontend, lié au dépôt (`vercel link` en local pour récupérer `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`)
- [ ] Désactiver l'auto-deploy Git natif sur Railway et Vercel (pour que seul GitHub Actions déploie)
- [ ] Créer deux bases Neon distinctes (`production`, `re7`), chacune seedée séparément
- [ ] Renseigner les secrets listés en section 5 dans les deux *Environments* GitHub
- [ ] Mettre à jour `deploy-production.yml` et `deploy-re7.yml` avec le contenu de la section 6
- [ ] Tester un déploiement manuel (`workflow_dispatch`) sur `re7` avant de valider sur `production`
- [ ] Vérifier `GET /api/health` et l'accès frontend après chaque déploiement
