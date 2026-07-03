# Design — Liberlo Knowledge Base : Application complète et professionnelle

**Date :** 2026-07-03  
**Auteur :** Clément Rollin  
**Contexte :** MBA2 MyDigitalSchool Lyon — mémoire professionnel, alternant support technique Liberlo  
**Statut :** Validé

---

## Objectif

Transformer le prototype existant en une application web complète, professionnelle et utilisable
en conditions réelles chez Liberlo. Deux niveaux d'exigence :

1. **Demo soutenance (fin août 2026)** — tous les parcours utilisateur fonctionnent sans accroc,
   la recherche sémantique fonctionne en live.
2. **Production Liberlo** — pipeline d'import depuis Google Drive et Confluence, permettant
   de remplir la base de connaissances avec les données existantes de l'entreprise.

---

## Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND Vue 3                        │
│  /auth  /  /search  /article  /dashboard  /admin        │
│  + /admin/users   (gestion utilisateurs)                │
│  + /admin/import  (pipeline d'import)                   │
└────────────────────┬────────────────────────────────────┘
                     │ REST + JSON
┌────────────────────▼────────────────────────────────────┐
│                  BACKEND NestJS                          │
│  auth │ users │ articles │ services │ search │ import   │
│       (nouveau)                      (nouveau)           │
│  shared : embedding │ guards │ decorators │ prisma      │
└──────┬─────────────────────────────────────┬────────────┘
       │                                     │
┌──────▼──────┐                   ┌──────────▼──────────┐
│ PostgreSQL  │                   │    APIs externes     │
│ + pgvector  │                   │  OpenAI Embeddings   │
└─────────────┘                   │  Claude Haiku (LLM)  │
                                  │  Google Drive API    │
                                  │  Confluence REST API │
                                  └─────────────────────┘
```

---

## Arborescence professionnelle cible

### Racine du projet

```
memoire/
├── backend/
├── frontend/
├── docs/
│   └── superpowers/
│       └── specs/
├── scripts/
│   ├── reset-db.sh              ← migrate:fresh + seed
│   └── generate-embeddings.sh  ← déclenche le reindex en dev
├── docker-compose.yml
├── .gitignore
├── .env.example
└── README.md
```

### Backend NestJS (`backend/src/`)

```
src/
├── modules/                     ← tous les modules métier
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── activate.dto.ts
│   ├── users/                   ← NOUVEAU
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   ├── articles/
│   │   ├── articles.controller.ts
│   │   ├── articles.service.ts
│   │   ├── articles.module.ts
│   │   └── dto/
│   ├── services/
│   │   ├── services.controller.ts
│   │   ├── services.service.ts
│   │   └── services.module.ts
│   ├── search/
│   │   ├── search.controller.ts
│   │   ├── search.service.ts
│   │   ├── search.module.ts
│   │   └── dto/
│   │       └── search.dto.ts
│   └── import/                  ← NOUVEAU
│       ├── import.controller.ts
│       ├── import.service.ts
│       ├── import.module.ts
│       ├── providers/
│       │   ├── google-drive.provider.ts
│       │   └── confluence.provider.ts
│       └── dto/
│           ├── analyze-document.dto.ts
│           └── confirm-import.dto.ts
├── shared/                      ← utilitaires partagés entre modules
│   ├── embedding/               ← NOUVEAU
│   │   ├── embedding.service.ts
│   │   └── embedding.module.ts
│   ├── guards/
│   │   ├── jwt.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   └── roles.decorator.ts
│   └── prisma/
│       ├── prisma.service.ts
│       └── prisma.module.ts
├── config/
│   └── configuration.ts         ← centralise tous les env vars typés
├── app.module.ts
└── main.ts
```

*Le module `admin` existant est dissous : ses endpoints rejoignent `modules/users`
(gestion des comptes) et `modules/articles` (endpoint reindex).*

### Frontend Vue 3 (`frontend/src/`)

```
src/
├── pages/
│   ├── auth/
│   │   ├── LoginPage.vue
│   │   └── ActivatePage.vue
│   ├── admin/
│   │   ├── UsersPage.vue        ← NOUVEAU
│   │   └── ImportPage.vue       ← NOUVEAU
│   ├── dashboard/
│   │   ├── DashboardPage.vue
│   │   └── DashboardGlobalPage.vue
│   ├── HomePage.vue
│   ├── SearchPage.vue
│   ├── ArticlePage.vue
│   ├── ArticleFormPage.vue
│   ├── ServicePage.vue
│   └── ForbiddenPage.vue
├── components/
│   ├── ui/                      ← composants génériques réutilisables
│   │   ├── ToastContainer.vue   ← NOUVEAU
│   │   ├── ConfirmModal.vue     ← NOUVEAU
│   │   ├── EmptyState.vue       ← NOUVEAU
│   │   └── MarkdownContent.vue
│   ├── layout/
│   │   └── AppHeader.vue
│   └── domain/                  ← composants spécifiques au métier
│       ├── articles/
│       │   └── ArticleCard.vue
│       ├── users/
│       │   └── UserDrawer.vue   ← NOUVEAU
│       └── import/
│           └── ImportWizard.vue ← NOUVEAU
├── composables/
│   ├── useApi.ts
│   ├── useToast.ts              ← NOUVEAU
│   └── useAuth.ts               ← NOUVEAU (extraire logique du store)
├── stores/
│   └── auth.ts
├── router/
│   └── index.ts
├── types/
│   └── index.ts
└── assets/
```

---

## Sous-projet 1 — App complète (priorité soutenance)

### 1.1 Recherche sémantique

**Fournisseur d'embeddings :** OpenAI `text-embedding-3-small` (1536 dimensions, correspond au
schéma Prisma existant `vector(1536)`).

**Flux de génération d'embedding :**
```
Article créé ou modifié
  → EmbeddingService.generateEmbedding(title + " " + summary + " " + content + " " + tags.join(" "))
  → Appel OpenAI Embeddings API
  → Résultat stocké dans Article.embedding
```

**Endpoint `POST /search` :**
1. Vectoriser la requête utilisateur (même modèle OpenAI)
2. Filtrer : `status = PUBLISHED` et droits selon rôle utilisateur
3. Requête pgvector : `ORDER BY embedding <=> queryVector LIMIT 20`
4. Retourner : titre, résumé, service, auteur, date de mise à jour, score de similarité
5. Fallback texte (ILIKE) si l'embedding est NULL

**Règles impératives :**
- Les articles en `DRAFT` ne sont jamais inclus dans la recherche
- Le filtre de droits s'applique avant le calcul de similarité (prévention de fuite d'information par le ranking)
- `EmbeddingService` est dans `shared/` et utilisé par les modules `articles`, `search` et `import`

**Endpoint de réindexation :**
- `POST /articles/reindex` (SUPER_ADMIN uniquement, dans le module `articles`)
- Génère les embeddings pour tous les articles dont le champ `embedding` est NULL
- Utile au premier démarrage et après un import en masse

---

### 1.2 Gestion des utilisateurs

**Accès :** SUPER_ADMIN uniquement.  
**Principe :** création directe sans email d'activation. Le mot de passe généré est affiché
une seule fois à l'admin, qui le communique à l'utilisateur concerné.

**Endpoints backend (`/users`, module `users`) :**

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/users` | Liste tous les utilisateurs |
| `POST` | `/users` | Crée un compte |
| `PATCH` | `/users/:id` | Modifie rôle ou service |
| `PATCH` | `/users/:id/deactivate` | Désactive le compte (soft delete) |

**Flux de création de compte :**
```
Admin saisit : email + rôle + service (obligatoire si rôle RESPONSABLE)
  → Backend génère un mot de passe fort (16 caractères : majuscules + chiffres + symboles)
  → Hash bcrypt → stocké en base
  → isActive = true immédiatement (pas d'activation par email)
  → Réponse unique : { ...user, generatedPassword: "Xk9#mP2!qR4@vB8n" }
  → Frontend affiche la modale "Mot de passe généré" avec bouton "Copier"
  → Le mot de passe n'est JAMAIS re-exposé après fermeture de cette modale
```

**Contraintes de sécurité :**
- Le `generatedPassword` n'est jamais écrit dans les logs backend
- Seul SUPER_ADMIN peut accéder au module `users` (guard strict)
- La désactivation ne supprime pas les articles rédigés par l'utilisateur désactivé
- Le champ `activationToken` existant dans le schéma Prisma reste présent mais n'est plus utilisé
  dans ce flux (il pourra servir à un futur flux email si besoin)

**Frontend `/admin/users` :**
- Tableau : email, rôle, service, statut actif/inactif, date de création, actions
- Bouton "Créer un utilisateur" → `UserDrawer.vue` (formulaire en drawer latéral)
- Modale post-création avec mot de passe + bouton "Copier dans le presse-papier"
- Filtres : par rôle et par service
- Désactivation via `ConfirmModal.vue`

---

### 1.3 Parcours utilisateur complets et polish UI

**Système de notifications (Toast) :**
- Composable `useToast.ts` global, instance partagée via `provide/inject` depuis `App.vue`
- Composant `ToastContainer.vue` positionné en haut à droite (z-index élevé)
- 4 types : `success`, `error`, `warning`, `info`
- Auto-dismiss à 4 secondes, fermeture manuelle possible
- Utilisé sur chaque action utilisateur : création, modification, erreur réseau, copie de mot de passe

**Composants UI à créer :**
- `components/ui/ToastContainer.vue` + `composables/useToast.ts`
- `components/ui/ConfirmModal.vue` — modale de confirmation réutilisable (suppression, désactivation)
- `components/ui/EmptyState.vue` — composant réutilisable avec slot pour message et illustration
- `components/domain/users/UserDrawer.vue` — formulaire de création en drawer latéral
- `components/domain/import/ImportWizard.vue` — wizard 4 étapes pour l'import

**États UI systématiques sur toutes les vues asynchrones :**
- Chargement → skeleton loader
- Liste vide → `EmptyState` avec message contextuel
- Erreur réseau → message d'erreur + bouton "Réessayer"
- 403 → page dédiée existante avec lien de retour

**Parcours 1 — SUPER_ADMIN :**
```
Login → Dashboard Global (stats par service, tous articles)
  → /admin/users : créer un compte → copier le mot de passe généré
  → /admin/import : importer depuis Drive ou Confluence
  → Recherche sémantique sur tous les articles
```

**Parcours 2 — RESPONSABLE :**
```
Login → Dashboard service (ses articles, statuts)
  → Créer un article : titre + markdown + tags + résumé + statut
  → Prévisualiser le rendu markdown → Publier
  → Modifier → Dépublier (retour en DRAFT) → Supprimer (confirmation)
```

**Parcours 3 — COLLABORATEUR :**
```
Login → Page d'accueil (barre de recherche + cards des 6 services)
  → Recherche sémantique → résultats triés par score de pertinence
  → Lire un article (markdown rendu, auteur, service, date, tags)
  → Naviguer par service → liste des articles publiés
```

---

## Sous-projet 2 — Pipeline d'import (production Liberlo)

### 2.1 Architecture du pipeline

```
Admin déclenche un import
  → Choisit la source (Google Drive ou Confluence)
  → Parcourt et sélectionne les documents
  → Système analyse chaque document via LLM
    → Suggère un service + génère un résumé + des tags
  → Admin review : confirme ou corrige chaque attribution
  → Confirmation → création des articles en DRAFT + génération des embeddings
```

**Principe de sécurité du pipeline :**
- Aucun article importé n'est publié automatiquement — tous créés en `DRAFT`
- Le RESPONSABLE du service concerné valide et publie après review

### 2.2 Endpoints backend — module `import`

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/import/drive/files` | Liste les fichiers du Drive connecté |
| `GET` | `/import/confluence/pages` | Liste les pages Confluence |
| `POST` | `/import/analyze` | Analyse un document, retourne service suggéré + résumé + tags |
| `POST` | `/import/confirm` | Crée les articles validés + génère les embeddings |
| `GET` | `/import/settings` | Récupère la config OAuth Drive et credentials Confluence |
| `PUT` | `/import/settings` | Sauvegarde la config de connexion aux sources |

### 2.3 Analyse LLM pour l'attribution de service

**Modèle utilisé :** `claude-haiku-4-5` (rapide et économique pour l'analyse de documents).

**Prompt d'analyse :**
```
Tu es un assistant qui classe des documents internes de l'entreprise Liberlo.
Les services existants sont : IT, CSM, Sales, Marketing, RH, Direction.

Voici le contenu du document :
[CONTENU]

Réponds en JSON avec ce format exact :
{
  "service": "IT" | "CSM" | "Sales" | "Marketing" | "RH" | "Direction",
  "confidence": 0.0 à 1.0,
  "summary": "Résumé en 2 phrases maximum",
  "tags": ["tag1", "tag2", "tag3"]
}
```

**Gestion de la confiance :**
- `confidence >= 0.8` → suggestion affichée en vert (très probable)
- `confidence < 0.8` → suggestion affichée en orange (à vérifier par l'admin)

### 2.4 Connexion aux sources externes

**Google Drive :**
- OAuth2 avec scopes `https://www.googleapis.com/auth/drive.readonly`
- Flow OAuth initié depuis le frontend, tokens stockés en base chiffrés (AES-256 via Node.js `crypto`)
- Formats supportés : Google Docs (export en markdown), fichiers `.docx`, `.txt`, `.md`
- Les tokens OAuth sont liés au compte SUPER_ADMIN qui a effectué la connexion

**Confluence :**
- Authentification par token API Atlassian (email + API token, pas OAuth)
- Configuré dans les settings admin via formulaire dans `/admin/import`
- API REST Confluence v2 : `GET /wiki/api/v2/pages` avec `body-format=storage`
- Conversion du format Confluence Storage (XML) vers markdown via bibliothèque dédiée

### 2.5 Gestion des doublons

Vérification par `sourceUrl` (URL du document Drive ou Confluence) avant import.
Si un article avec la même `sourceUrl` existe déjà en base :
- **"Mettre à jour"** — écrase le contenu et régénère l'embedding
- **"Ignorer"** — skip ce document

Le champ `sourceUrl` sera ajouté au modèle `Article` via une migration Prisma.

### 2.6 Frontend `/admin/import`

```
Étape 1 — Choisir la source
  [Google Drive]  [Confluence]
  (avec indicateur de connexion : connecté / non connecté)

Étape 2 — Parcourir et sélectionner
  Liste des documents avec checkbox
  Recherche par nom de fichier
  Bouton "Analyser la sélection"

Étape 3 — Review des suggestions
  Tableau : Titre | Aperçu | Service suggéré (select éditable)
           | Confiance | Tags | Action (inclure / ignorer)
  Lignes à faible confiance mises en évidence (orange)

Étape 4 — Confirmation
  Résumé : "X documents seront importés comme brouillons"
  Bouton "Confirmer l'import"
  Progress bar pendant le traitement
  Résumé final : "X articles créés, X erreurs, X ignorés (doublons)"
```

---

## Contraintes transversales

- **Aucun credential en dur** — tout passe par `.env` ou par la table de configuration en base
- **Nommage explicite** — pas d'abréviations dans les noms de fonctions, variables, composants
- **Vérification des permissions côté backend** — jamais uniquement côté frontend
- **Articles importés toujours en DRAFT** — validation humaine obligatoire avant publication
- **Données de demo : uniquement factices** — jamais de vraies données Liberlo dans le prototype

---

## Ordre d'implémentation recommandé

### Phase 0 — Réorganisation de l'arborescence
1. Déplacer les fichiers backend vers `src/modules/` et `src/shared/`
2. Déplacer les fichiers frontend vers les nouveaux sous-dossiers de `pages/` et `components/`
3. Mettre à jour tous les imports et vérifier que le build passe

### Phase 1 — Fondations (sous-projet 1)
4. `EmbeddingService` dans `shared/embedding/` + intégration OpenAI
5. Mise à jour `ArticlesService` : génération embedding à la création/modification
6. Mise à jour `SearchService` : requête pgvector cosine similarity + fallback texte
7. Endpoint `POST /articles/reindex` (SUPER_ADMIN)
8. Module `users` complet (CRUD + génération mot de passe fort)
9. Frontend : `useToast.ts` + `ToastContainer.vue`
10. Frontend : `ConfirmModal.vue` + `EmptyState.vue`
11. Frontend : `UserDrawer.vue` + page `/admin/users`
12. Complétion et correction des 3 parcours utilisateur
13. Tests backend : auth, articles, search, users

### Phase 2 — Pipeline d'import (sous-projet 2)
14. Migration Prisma : ajout champ `sourceUrl` sur `Article`
15. Module `import` backend : settings, analyse Claude Haiku, confirmation
16. `google-drive.provider.ts` : OAuth2 + listing + export markdown
17. `confluence.provider.ts` : token API + listing pages + conversion Storage Format
18. Frontend : `ImportWizard.vue` + page `/admin/import`
19. Tests du pipeline d'import
