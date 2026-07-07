# Suivi technique — Liberlo Knowledge Base

Prototype réalisé dans le cadre du mémoire professionnel MBA2 de Clément Rollin.
Ce document retrace les décisions techniques, l'évolution de l'implémentation et les points d'arbitrage. Il sert de support à la partie technique du mémoire et à la soutenance orale.

---

## Stack technique retenue

| Couche | Technologie | Justification |
|---|---|---|
| Backend | NestJS + TypeScript | Architecture modulaire, DI native, adapté aux APIs REST scalables |
| ORM | Prisma | Migrations versionées, type-safety bout-en-bout, pgvector compatible |
| Base de données | PostgreSQL + pgvector | Extension vectorielle native, évite un service externe pour les embeddings |
| Auth | JWT (access token) | Sans état (stateless), portable, standard industriel |
| Frontend | Vue 3 (Composition API) + Pinia | Réactivité fine, stores découplés, typage TypeScript natif |
| Styling | Tailwind CSS 4 | Utility-first, cohérent avec la charte Liberlo |
| CI/CD | GitHub Actions | Intégré au repo, matrices de checks par branche |

---

## Architecture backend

```
AppModule
├── AuthModule        → POST /auth/login, /auth/activate
├── ArticlesModule    → CRUD articles (scoped par service)
├── SearchModule      → POST /search (tokenized keyword search)
├── ConversationsModule → conversations multi-tours persistantes
├── ServicesModule    → GET /services, /services/:slug
├── AdminModule       → GET /admin/articles (SUPER_ADMIN uniquement)
└── PrismaModule      → accès BDD partagé (global)
```

Chaque module suit le pattern : **Controller → Service → Prisma**
Aucune logique métier dans les controllers. Guards NestJS pour auth + rôles.

---

## Modèle de données

### Entités principales

```
User
  id, email, passwordHash, role, serviceId, isActive
  activationToken, activationTokenExpiresAt

Service
  id, name, slug, description

Article
  id, title, content, summary, type, serviceId, visibility
  status (DRAFT | PUBLISHED), tags[], authorId
  embedding (vector — pgvector, à implémenter)
  createdAt, updatedAt

Conversation
  id, userId, title, createdAt, updatedAt

Message
  id, conversationId, role (USER | ASSISTANT)
  content, results (JSON), createdAt
```

### Rôles

| Rôle | Droits |
|---|---|
| `COLLABORATOR` | Lecture des articles publiés + conversations propres |
| `RESPONSABLE` | CRUD articles de son service + lecture |
| `SUPER_ADMIN` | Lecture globale + dashboard transverse |

---

## Évolution de l'implémentation

### Phase 1 — Infrastructure de base

**Objectif :** Auth + CRUD articles + recherche textuelle simple.

- JWT avec guards NestJS par rôle
- Prisma schema : User, Service, Article
- Recherche full-text PostgreSQL basique (`ILIKE` sur title/content)

**Décision :** utiliser `ILIKE` pour la phase MVP car pgvector nécessite un modèle d'embeddings externe non encore arbitré.

---

### Phase 2 — UI Claude-like + conversations multi-tours

**Objectif :** Interface inspirée de Claude avec historique persistant côté serveur.

**Ajouts backend :**
- Modèles `Conversation` + `Message` (Prisma migration)
- `ConversationsModule` : endpoints create, list, get, addMessage, delete
- Auth login enrichi avec `service { id, name, slug }` pour la sidebar

**Ajouts frontend :**
- `AppLayout.vue` + `AppSidebar.vue` : layout nestée avec sidebar violet `#140730`
- `ConversationPage.vue` : messages empilés (bulle USER violet + cartes résultats ASSISTANT)
- `conversations` Pinia store : état liste + conversation active

**Arbitrage UX :** les résultats de la conversation précédente restent visibles au scroll (Option B choisie par Clément) — cohérent avec le modèle mental "historique de recherche".

---

### Phase 3 — Amélioration du moteur de recherche

**Problème identifié :** recherche "process CSM-IT" → 0 résultat car aucun article ne contient la phrase exacte.

**Solution retenue :** moteur tokenisé en lieu et place du `ILIKE` exact.

```
Algorithme :
1. Normaliser la requête (minuscules, strip accents)
2. Découper sur \s, -, _, /
3. Filtrer les stop words français (le, la, de, du, et...)
4. Filtrer les mots ≤ 2 caractères
5. Construire des conditions OR pour chaque token (title, content, summary, tags)
6. Scorer les résultats :
   - Phrase complète dans le texte → +10
   - Token dans le titre → +3
   - Token dans content/summary/tags → +1
7. Filtrer score = 0, trier par score desc
```

**Ajout données :** 17 articles transverses IT×CSM, IT×Sales, IT×RH, IT×Marketing, CSM×Sales, Marketing×CSM, Direction×All. Chaque article mentionne explicitement les noms de services pour être trouvable par le moteur tokenisé.

**Bug corrigé :** le champ `content` n'était pas dans le `select` Prisma mais utilisé dans le scoring → toujours vide. Corrigé en ajoutant `content: true`.

---

### Phase 4 — CI/CD et qualité de code

**Objectif :** pipeline automatisé complet, tests significatifs, code reviewable en soutenance.

**Workflow de branches :**
```
feature/* → develop → re7 → main
```
Chaque étape a ses propres checks GitHub Actions. Le merge est automatique si tous les checks sont verts.

**Tests backend (unit) — 30 tests :**
- `SearchService` : tokenisation, stop-words, scoring, filtres
- `AuthService` : login/logout, comptes inactifs, activate, token expiré
- `ArticlesService` : CRUD avec guards de service

**Tests backend (E2E) — 28 tests :**
- Couverture complète : Auth, Articles, Search, Conversations, Admin
- Setup/teardown isolé : création et suppression des données E2E en `beforeAll`/`afterAll`
- Validation des guards : 401 sans token, 403 hors périmètre, 404 après suppression

**Checks CI par branche :**

| Check | develop | re7 | main |
|---|---|---|---|
| Branch flow | ✓ | ✓ | ✓ |
| Backend — Lint | ✓ | ✓ | ✓ |
| Backend — Unit tests | ✓ | ✓ | ✓ |
| Frontend — Typecheck & Build | ✓ | ✓ | ✓ |
| Backend — E2E tests | — | ✓ | ✓ |
| Backend — Build | — | ✓ | ✓ |
| Security audit | — | — | ✓ |

---

## Recherche sémantique — état et roadmap

### État actuel (MVP)
Moteur de recherche textuel tokenisé (Phase 3). Pas d'embeddings actifs.

### Décision sur les embeddings
Le champ `embedding vector(1536)` est présent dans le schéma Prisma mais non alimenté.
Le choix du modèle d'embeddings est délibérément différé pour la soutenance :

**Option A — OpenAI text-embedding-3-small** (1536 dims)
- ✅ Qualité élevée, API simple
- ❌ Coût à l'usage, dépendance externe

**Option B — Mistral Embed** (1024 dims)
- ✅ Européen, RGPD-friendly
- ❌ API moins mature

**Option C — Modèle local (Ollama + nomic-embed-text)**
- ✅ Gratuit, offline, RGPD total
- ❌ Infrastructure locale requise

→ Pour la démo : l'OpenAI SDK est installé (`openai` package), la clé est configurée en env var. L'intégration embeddings sera activée post-soutenance ou présentée comme roadmap v1.1.

### RAG (v1.1)
Récupération des N articles les plus proches → injection dans le prompt LLM → réponse synthétique avec citations. Non implémenté, présenté comme évolution.

---

## Données de démonstration

### Comptes disponibles (mot de passe : `Liberlo2026!`)

| Email | Rôle | Service |
|---|---|---|
| ceo@liberlo.com | SUPER_ADMIN | — |
| marc.dupont@liberlo.com | RESPONSABLE | IT |
| sarah.leblanc@liberlo.com | RESPONSABLE | CSM |
| thomas.bernard@liberlo.com | RESPONSABLE | Sales |
| camille.moreau@liberlo.com | RESPONSABLE | Marketing |
| julie.martin@liberlo.com | RESPONSABLE | RH |
| pierre.lambert@liberlo.com | RESPONSABLE | Direction |
| alex.petit@liberlo.com | COLLABORATOR | IT |
| leo.garnier@liberlo.com | COLLABORATOR | CSM |
| hugo.renard@liberlo.com | COLLABORATOR | Sales |
| maya.girard@liberlo.com | COLLABORATOR | Marketing |
| eva.nguyen@liberlo.com | COLLABORATOR | RH |

### Contenu seedé

- **77 articles** : 10 par service (IT, CSM, Sales, Marketing, RH, Direction) + 17 transverses
- **5 conversations** pré-seedées pour les personas de démo

### Scénarios de démonstration recommandés

1. **Recherche transverse (IT collabo) :** connecter alex.petit@liberlo.com → taper "process CSM IT escalade" → afficher les résultats transverses
2. **Gestion de contenu (RESPONSABLE IT) :** connecter marc.dupont@liberlo.com → dashboard → créer un article → publier
3. **Vision globale (CEO) :** connecter ceo@liberlo.com → dashboard global → filtrer par service

---

## Points techniques à expliquer en soutenance

### Pourquoi NestJS et non Express ?
Architecture modulaire native qui force la séparation des responsabilités (Controller/Service/Guard). Plus lisible pour démontrer l'architecture lors de la soutenance.

### Pourquoi le JWT en mémoire (Pinia) et non localStorage ?
Protection XSS : un token en localStorage est accessible depuis JavaScript, susceptible d'être volé par une injection de script malveillant. Pinia survit au rechargement de page si besoin via sessionStorage.

### Pourquoi une conversation persistée côté serveur ?
Permet à un utilisateur de retrouver son historique de recherche entre sessions. Aussi : les résultats de recherche (JSON) sont stockés avec chaque message ASSISTANT, rendant la conversation complète même si les articles changent.

### Pourquoi le moteur tokenisé plutôt que pgvector pour le MVP ?
pgvector nécessite un modèle d'embeddings en production (coût API ou infrastructure). Le moteur tokenisé est déterministe, rapide, et suffisant pour démontrer le concept en soutenance. La transition vers pgvector est documentée comme roadmap et le schéma est déjà prêt.

---

## Sécurité — points RGPD

- Données de démo fictives (dummy data) — aucune donnée réelle Liberlo
- Exposition via ngrok uniquement pendant la fenêtre de soutenance
- JWT sans refresh token (sessions courtes, 8h, contexte démo)
- Mots de passe hashés bcrypt (rounds=10)
- Principe du moindre privilège : chaque rôle n'accède qu'à son périmètre

---

## Commandes utiles pour la démo

```bash
# Backend (WSL)
cd backend && npm run start:dev

# Frontend (WSL)
cd frontend && npm run dev

# Reset BDD + seed (si besoin)
DATABASE_URL='postgresql://liberlo:liberlo_dev@localhost:5434/liberlo_kb?schema=public' \
  npx prisma db seed

# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# ngrok (le jour de la soutenance)
ngrok http 3001
ngrok http 5173
```
