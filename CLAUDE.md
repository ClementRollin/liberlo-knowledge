# Projet : Base de connaissances interne Liberlo

Prototype technique réalisé dans le cadre du mémoire professionnel MBA2
(Master Développeur Full Stack, MyDigitalSchool Lyon) de Clément Rollin,
alternant responsable du support technique chez Liberlo.

Ce fichier est le point d'entrée. Les détails spécifiques sont dans
`.claude/rules/`. Ne duplique pas leur contenu ici — réfère-toi-y.

## Objectif du projet

Concevoir un outil interne de knowledge management permettant de centraliser,
structurer et retrouver l'information interne de Liberlo (procédures, produit,
objectifs, bonnes pratiques) via une recherche sémantique, tout en respectant
une gouvernance stricte des rôles et des accès.

Le prototype sert de support de démonstration pour la soutenance orale
(fin août). Il n'est **pas déployé en production** — usage exclusivement
académique et démonstratif, avec une base de données factice (dummy data)
exposée via ngrok le jour de la soutenance.

## Contexte entreprise (pour cohérence fonctionnelle)

- Liberlo : plateforme de mise en relation praticiens de médecines
  complémentaires / utilisateurs, ~38 collaborateurs, Lyon.
- Organisation en 6 pôles : IT, CSM, Sales, Marketing, RH, Direction.
- Problème adressé : dispersion de l'information, dépendance aux managers,
  perte de temps opérationnelle (cf. questionnaires internes).

## Stack technique

- **Frontend** : Vue 3 (Composition API) + TypeScript + Vite + Vue Router +
  Pinia + Tailwind CSS + vee-validate/yup
- **Backend** : NestJS + TypeScript + Prisma + PostgreSQL + pgvector + JWT
- **Recherche sémantique** : embeddings (à la création/MàJ d'article) +
  similarité cosinus via pgvector ; RAG envisagé en v1.1/v2

Détails complets : voir `.claude/rules/frontend.md` et `.claude/rules/backend.md`.

## Règles de fonctionnement à charger selon le contexte

- `.claude/rules/backend.md` — NestJS, endpoints, modèle de données
- `.claude/rules/frontend.md` — Vue 3, routes, pages, composants
- `.claude/rules/roles-permissions.md` — rôles utilisateurs et droits
- `.claude/rules/securite-rgpd.md` — sécurité, authentification, RGPD
- `.claude/rules/recherche-semantique.md` — embeddings, pgvector, RAG

## Règles générales de développement

- Toujours vérifier les permissions **côté backend**, jamais uniquement côté
  frontend (aucune confiance accordée au client).
- Respecter le principe du moindre privilège pour chaque rôle.
- Ne pas ajouter de fonctionnalité hors périmètre du cahier des charges sans
  le signaler explicitement (le prototype doit rester démontrable et cohérent
  avec ce qui est décrit dans le mémoire).
- Le code doit rester présentable en soutenance : privilégier la clarté et
  la lisibilité à l'optimisation prématurée.
- Toute donnée utilisée pour la démo doit être fictive (dummy data), jamais
  de vraies données Liberlo — cf. `.claude/rules/securite-rgpd.md`.

## Commandes utiles

```bash
# Backend
cd backend && npm run start:dev
npx prisma migrate dev
npx prisma studio

# Frontend
cd frontend && npm run dev

# Tests
npm run test
```

## Ce que je (Clément) attends de Claude sur ce projet

- Proposer du code cohérent avec les spécifications fonctionnelles et
  techniques déjà validées (ne pas réinventer l'architecture).
- Signaler si une demande s'écarte du cahier des charges plutôt que
  d'improviser silencieusement.
- Garder un code démontrable en 5-10 minutes lors de la soutenance.

## Consigne globale — outillage

Pour chaque tâche demandée sur ce projet, évalue systématiquement s'il existe
un plugin, un skill, ou un serveur MCP connecté plus adapté que d'écrire la
solution à la main, et utilise-le en priorité. Concrètement :

- Avant de générer du code Prisma/migrations, vérifie si le CLI Prisma peut
  le faire directement (`npx prisma migrate dev`, `npx prisma generate`)
  plutôt que d'écrire le SQL à la main.
- Pour toute tâche de recherche documentaire (doc NestJS, Vue 3, pgvector,
  RGPD/CNIL), effectue une recherche web plutôt que de répondre uniquement
  depuis la mémoire d'entraînement — les APIs et bonnes pratiques évoluent.
- Si un serveur MCP est connecté et pertinent pour la tâche (Google Drive
  pour les maquettes/DA, Slack pour tester l'intégration webhook, GitHub
  pour la gestion de PR/issues), utilise-le au lieu de demander l'info
  manuellement.
- Pour la génération de fichiers Word/PDF/Excel liés au mémoire (pas au
  code), utilise les skills dédiés (`docx`, `pdf`, `xlsx`) plutôt que de
  produire du texte brut.
- N'improvise pas d'outil ; si aucun outil pertinent n'est disponible,
  dis-le explicitement plutôt que de simuler un résultat.
