import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ─── Données fictives (dummy data — soutenance uniquement) ────────────────────

const SERVICES = [
  { name: 'IT', slug: 'it', description: 'Infrastructure, développement produit et support technique.' },
  { name: 'CSM', slug: 'csm', description: 'Customer Success Management — accompagnement et fidélisation des praticiens.' },
  { name: 'Sales', slug: 'sales', description: 'Acquisition et développement commercial.' },
  { name: 'Marketing', slug: 'marketing', description: 'Stratégie de marque, contenus et acquisition organique.' },
  { name: 'RH', slug: 'rh', description: 'Ressources humaines, recrutement et culture d\'entreprise.' },
  { name: 'Direction', slug: 'direction', description: 'Pilotage stratégique et transversal de l\'entreprise.' },
]

const ARTICLES: {
  title: string
  summary: string
  content: string
  tags: string[]
  service: string
  status: 'PUBLISHED' | 'DRAFT'
}[] = [
  // ── IT ─────────────────────────────────────────────────────────────────────
  {
    title: 'Guide d\'onboarding technique — accès aux outils',
    summary: 'Récapitulatif de tous les accès et outils à configurer pour un nouveau collaborateur IT.',
    content: `## Accès à créer le jour J

1. **GitHub** — inviter dans l'organisation Liberlo (org: liberlo-app)
2. **Notion** — espace Workspace IT, accès "Membre"
3. **Vercel** — projet frontend, rôle "Developer"
4. **Supabase / Neon** — base de données staging
5. **Sentry** — organisation liberlo, projet api + frontend
6. **Slack** — channels : #général, #tech, #deploys, #alerts

## Configuration locale

\`\`\`bash
git clone git@github.com:liberlo-app/api.git
cd api && cp .env.example .env
npm install && npm run dev
\`\`\`

## Accès VPN

Contactez l'admin IT pour recevoir le fichier de config WireGuard.
Le VPN est obligatoire pour accéder aux bases de données de production.

## Contacts utiles

- Admin systèmes : Marc D. (Slack @marc)
- Accès cloud AWS : demande via ticket Jira IT-ACCESS`,
    tags: ['onboarding', 'accès', 'outils'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Procédure de réinitialisation des accès collaborateur',
    summary: 'Étapes à suivre lorsqu\'un collaborateur perd ses accès ou quitte l\'entreprise.',
    content: `## Départ d'un collaborateur

**Délai : immédiat à la notification RH**

1. Révoquer l'accès GitHub (retirer de l'org)
2. Désactiver le compte Google Workspace
3. Révoquer les tokens API actifs (dashboard Vercel + Sentry)
4. Supprimer les clés SSH enregistrées
5. Archiver les données Notion sous dossier "Anciens collaborateurs"

## Perte de mot de passe

1. L'utilisateur envoie un email à support-it@liberlo.com
2. Vérification d'identité par appel vidéo
3. Réinitialisation via le panel admin Google Workspace
4. Envoi du nouveau mot de passe temporaire par canal sécurisé (Signal)

## SLA

- Départ : traitement sous 2h ouvrées
- Perte de mdp : traitement sous 4h ouvrées`,
    tags: ['sécurité', 'accès', 'offboarding'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Architecture technique de la plateforme Liberlo',
    summary: 'Vue d\'ensemble de l\'architecture applicative — backend, frontend, BDD, infra.',
    content: `## Stack technique

### Backend
- **API REST** : Node.js / NestJS — déployé sur Railway
- **Base de données** : PostgreSQL (Neon) — pgvector pour la recherche sémantique
- **Auth** : JWT + refresh tokens, SSO Google Workspace en préparation
- **Emails transactionnels** : Resend

### Frontend
- **Web app** : Vue 3 + Vite — déployé sur Vercel
- **App mobile** : React Native (Expo) — stores iOS + Android

### Infra
- CI/CD : GitHub Actions → Vercel (frontend) / Railway (backend)
- Monitoring : Sentry (erreurs) + Datadog (métriques)
- Logs : Papertrail

## Environnements

| Env | URL | BDD |
|---|---|---|
| Production | app.liberlo.com | Neon prod |
| Staging | staging.liberlo.com | Neon staging |
| Local | localhost:3000 | Docker PostgreSQL |`,
    tags: ['architecture', 'technique', 'infra'],
    service: 'it',
    status: 'PUBLISHED',
  },

  // ── CSM ────────────────────────────────────────────────────────────────────
  {
    title: 'Cycle de vie d\'un praticien — process de suivi CSM',
    summary: 'Toutes les étapes du parcours praticien, de l\'inscription à la fidélisation.',
    content: `## Phases du cycle de vie

### Phase 1 — Activation (J0 à J+7)
- Email de bienvenue automatique (J0)
- Appel d'onboarding CSM (J+2) — 20 min
- Vérification du profil complété à 80% (J+7)
- KPI cible : 70% de profils complétés à J+7

### Phase 2 — Engagement (J+8 à J+90)
- Check-in mensuel par email
- Premier avis client reçu ? → célébration Slack #wins
- Invitation au webinaire mensuel praticiens
- KPI cible : au moins 3 RDV pris via la plateforme à J+30

### Phase 3 — Fidélisation (J+90 et au-delà)
- NPS semestriel (outil : Typeform)
- Renouvellement d'abonnement : relance J-30
- Programme ambassadeurs : proposé à partir de 10 avis ≥ 4★

## Signaux d'alerte (churn risk)
- Aucune connexion depuis 14 jours
- Taux de réponse aux messages < 30%
- Aucun RDV dans les 30 derniers jours → ticket CSM automatique`,
    tags: ['process', 'praticien', 'suivi', 'onboarding'],
    service: 'csm',
    status: 'PUBLISHED',
  },
  {
    title: 'Script de relance praticien inactif',
    summary: 'Template d\'email et guide d\'appel pour recontacter un praticien sans activité depuis 14 jours.',
    content: `## Critère de déclenchement

Praticien sans connexion depuis ≥ 14 jours ET sans RDV planifié.

## Email de relance (J+14)

> Objet : On a pensé à vous, [Prénom] 👋
>
> Bonjour [Prénom],
>
> Votre profil Liberlo est bien en place, mais on ne vous a pas vu depuis quelques jours.
> On sait que le démarrage peut prendre du temps — c'est tout à fait normal.
>
> Avez-vous eu des difficultés ? Une question sur votre profil ou votre visibilité ?
> Je suis disponible pour un appel rapide si vous le souhaitez.
>
> [Lien de prise de RDV Calendly]
>
> À bientôt,
> [Prénom CSM], équipe Liberlo

## Script appel (si pas de réponse à J+21)

1. Introduction chaleureuse (30 sec)
2. Identifier le frein principal (5-7 questions ouvertes)
3. Proposer une solution concrète (activation d'une fonctionnalité, retouche profil)
4. Fixer un prochain point dans 7 jours
5. Logger dans le CRM : résumé + action suivante`,
    tags: ['relance', 'template', 'inactivité', 'churn'],
    service: 'csm',
    status: 'PUBLISHED',
  },
  {
    title: 'Guide de résolution des tickets Support Niveau 1',
    summary: 'Réponses aux questions les plus fréquentes des praticiens et des utilisateurs.',
    content: `## Catégories de tickets L1

### Accès / Connexion
**"Je n'arrive pas à me connecter"**
→ Vérifier que l'email est correct, proposer la réinitialisation mdp.
→ Si compte désactivé : escalader au responsable CSM.

### Profil praticien
**"Ma photo ne s'affiche pas"**
→ Format accepté : JPG/PNG, max 5 Mo, ratio 1:1.
→ Délai d'affichage après upload : jusqu'à 5 min (cache CDN).

**"Mon adresse n'est pas trouvée"**
→ Utiliser le format exact : "Numéro Rue, Code postal Ville".
→ Si problème persiste : remonter au pôle technique (ticket Jira).

### Paiements
**"Je n'ai pas reçu mon virement"**
→ Délai standard : 3-5 jours ouvrés après le 1er du mois.
→ Vérifier que l'IBAN est validé dans les paramètres.
→ Si IBAN incorrect : formulaire de mise à jour + délai +7j.

## SLA tickets
- L1 : réponse sous 4h ouvrées, résolution sous 24h
- L2 (technique) : transfert sous 2h, résolution sous 72h`,
    tags: ['support', 'FAQ', 'tickets', 'L1'],
    service: 'csm',
    status: 'PUBLISHED',
  },

  // ── Sales ───────────────────────────────────────────────────────────────────
  {
    title: 'Pitch commercial Liberlo — v3.2',
    summary: 'Script structuré pour la présentation de Liberlo à des praticiens prospects.',
    content: `## Objectif du pitch

Convaincre un praticien de médecines complémentaires de rejoindre Liberlo
en 15-20 minutes, en démontrant la valeur de la visibilité et de la mise en relation.

## Structure (méthode SPIN)

### Situation (2 min)
"Vous exercez depuis combien de temps ? Vous avez principalement des clients récurrents ou beaucoup de nouveaux patients ?"

### Problème (3 min)
"Comment faites-vous aujourd'hui pour être trouvé par de nouveaux patients ?
Est-ce que vous avez une présence en ligne ? Comment ça se passe avec les avis ?"

### Implication (5 min)
"Combien de nouveaux patients par mois souhaiteriez-vous idéalement ?
Qu'est-ce que ça représente en chiffre d'affaires supplémentaire ?"

### Besoin / Solution (7 min)
"C'est exactement pour ça que Liberlo existe. Voici comment ça marche :
- Profil complet visible par les utilisateurs de votre zone
- Système de prise de RDV intégré
- Avis vérifiés qui renforcent votre crédibilité
- Stats de visibilité chaque semaine"

## Objections courantes

| Objection | Réponse |
|---|---|
| "C'est trop cher" | Comparer au coût d'acquisition d'un patient via Google Ads |
| "J'ai déjà un site" | Liberlo c'est la distribution, pas le site |
| "Je suis déjà complet" | Parfait pour la liste d'attente et la fidélisation |`,
    tags: ['pitch', 'commercial', 'script', 'B2B'],
    service: 'sales',
    status: 'PUBLISHED',
  },
  {
    title: 'Process de qualification d\'un prospect praticien',
    summary: 'Critères BANT et étapes pour qualifier un praticien avant de le passer en démo.',
    content: `## Critères de qualification (BANT adapté)

### Budget
- L'abonnement mensuel entre dans son budget d'exploitation ?
- A-t-il déjà des dépenses marketing (site web, Google) ?

### Autorité
- Est-il le décisionnaire ? (praticien indépendant → OUI, cabinet → vérifier)

### Besoin
- Cherche-t-il à développer sa patientèle ?
- A-t-il des problèmes de visibilité ou de gestion des RDV ?

### Timing
- Quand prévoit-il de prendre une décision ?
- Y a-t-il un événement déclencheur (nouvelle installation, retraite d'un confrère) ?

## Pipeline Salesforce

1. **Lead** → import depuis formulaire site / LinkedIn / événement
2. **Qualifié** → appel de qualification (10 min), score BANT ≥ 3/4
3. **Démo planifiée** → démo produit 30 min avec screen sharing
4. **Proposition** → envoi offre par email, suivi J+3
5. **Négociation** → max 2 relances, discount max 15% (validation manager)
6. **Gagné / Perdu** → motif obligatoire dans CRM

## Objectifs mensuels (Q3 2026)

- 60 leads qualifiés
- 30 démos
- 12 closings
- ARR cible : 24 000 €`,
    tags: ['qualification', 'BANT', 'pipeline', 'CRM'],
    service: 'sales',
    status: 'PUBLISHED',
  },

  // ── Marketing ───────────────────────────────────────────────────────────────
  {
    title: 'Charte graphique et guidelines de marque Liberlo',
    summary: 'Couleurs, typographies, ton éditorial et règles d\'utilisation du logo.',
    content: `## Identité visuelle

### Palette de couleurs

| Couleur | Hex | Usage |
|---|---|---|
| Violet primaire | #6b2fa0 | CTA, liens, accents |
| Violet clair | #9b59d0 | Hover, backgrounds |
| Lavande | #f0e6ff | Backgrounds doux |
| Blanc | #ffffff | Fond principal |
| Gris texte | #374151 | Corps de texte |
| Gris clair | #f9fafb | Surfaces secondaires |

### Typographie
- **Titres** : Instrument Sans, Semi Bold
- **Corps** : Inter, Regular
- **Code / Labels** : JetBrains Mono

### Logo
- Toujours utiliser le fichier SVG officiel (dossier Drive Liberlo / Brand Kit)
- Ne jamais déformer, recadrer ou changer les couleurs du logo
- Zone de protection : 16px minimum autour du logo sur tous les côtés
- Fond clair : logo violet. Fond sombre : logo blanc.

## Ton éditorial

- Bienveillant et accessible (pas de jargon médical)
- Encourageant, jamais prescriptif
- Inclusif : éviter "les praticiens" → préférer "vous" ou "les professionnels"
- Tutoyement dans les emails marketing, vouvoiement dans les emails transactionnels`,
    tags: ['branding', 'design', 'charte', 'logo'],
    service: 'marketing',
    status: 'PUBLISHED',
  },
  {
    title: 'Calendrier éditorial et fréquences de publication',
    summary: 'Organisation des publications par canal et par cible (praticiens / utilisateurs).',
    content: `## Canaux et fréquences

| Canal | Fréquence | Responsable | Cible |
|---|---|---|---|
| Blog Liberlo | 2×/mois | Rédac externe | SEO / praticiens |
| Newsletter praticiens | 1×/mois | Marketing | Praticiens inscrits |
| Newsletter utilisateurs | 2×/mois | Marketing | Utilisateurs actifs |
| Instagram | 3×/semaine | Community Manager | Grand public |
| LinkedIn | 2×/semaine | Marketing | Praticiens / pro |
| TikTok | 1×/semaine | CM | Grand public 18-35 |

## Thèmes récurrents

**Semaine 1** : Tips bien-être / médecines douces (cible utilisateurs)
**Semaine 2** : Success story praticien (double cible)
**Semaine 3** : Actualité bien-être / santé naturelle
**Semaine 4** : Contenu "coulisses Liberlo" / recrutement / valeurs

## Outils

- Planification : Buffer (accès équipe marketing)
- Visuels : Figma → export → Buffer
- Analytics : Metabase dashboard "Marketing KPIs"
- Validation contenu : Slack #content-review (validation du Content Lead avant publication)`,
    tags: ['editorial', 'réseaux sociaux', 'newsletter', 'planning'],
    service: 'marketing',
    status: 'PUBLISHED',
  },

  // ── RH ──────────────────────────────────────────────────────────────────────
  {
    title: 'Guide d\'accueil du nouvel arrivant',
    summary: 'Checklist complète pour intégrer un nouveau collaborateur chez Liberlo.',
    content: `## Avant l'arrivée (J-5)

- [ ] Envoi de l'email de bienvenue avec planning J1
- [ ] Création du compte Google Workspace (prenom.nom@liberlo.com)
- [ ] Commande du matériel (MacBook Pro M3, 16Go — délai 3j)
- [ ] Ajout au Slack, Notion, GitHub selon le pôle
- [ ] Préparation du livret d'accueil (PDF Drive RH)

## Jour J

- 9h00 — Accueil par le/la manager, tour des locaux
- 9h30 — Remise du matériel et configuration (IT)
- 10h30 — Petit-déjeuner d'équipe
- 11h00 — Présentation de l'entreprise + produit (30 min)
- 14h00 — Onboarding métier avec le manager

## Première semaine

- Rencontres 1:1 avec chaque membre de l'équipe (30 min chacun)
- Lecture de la documentation interne sur Notion
- Premier accès à la base de connaissances Liberlo
- Point d'étonnement J+5 avec le manager (15 min)

## Contacts RH

- Questions admin : rh@liberlo.com
- Mutuelle : Henner — code adhérent fourni avec le contrat
- Tickets restaurant : Swile — carte reçue sous 5 jours ouvrés`,
    tags: ['onboarding', 'arrivée', 'checklist', 'accueil'],
    service: 'rh',
    status: 'PUBLISHED',
  },
  {
    title: 'Politique de télétravail',
    summary: 'Règles et modalités du télétravail chez Liberlo (accord en vigueur depuis jan. 2025).',
    content: `## Modalités

**Jours autorisés** : jusqu'à 3 jours de télétravail par semaine.
**Jours de présence obligatoire** : le mardi et le jeudi (jours d'équipe).
**Période d'essai** : les 3 premiers mois, présence au bureau 4j/semaine.

## Conditions

- Disposer d'un espace de travail calme et d'une connexion Internet stable (≥ 50 Mbps)
- Être joignable sur Slack et en visio pendant les horaires de travail
- Participation obligatoire aux standups quotidiens en visio si télétravail
- Matériel bureau à la charge de Liberlo (écran, clavier, souris — sur demande RH)

## Déclaration et suivi

- Déclarer les jours de télétravail sur Payfit en début de semaine
- En cas d'imprévu (urgence personnelle), prévenir le manager par Slack avant 9h
- Le télétravail n'est pas un droit acquis : il peut être suspendu en cas de besoin opérationnel

## Ce qui n'est pas du télétravail

Les déplacements professionnels (clients, salons, formations) ne comptent pas comme jours de télétravail.
Les jours de télétravail ne sont pas reportables d'une semaine à l'autre.`,
    tags: ['télétravail', 'politique RH', 'accord', 'flex'],
    service: 'rh',
    status: 'PUBLISHED',
  },

  // ── Direction ────────────────────────────────────────────────────────────────
  {
    title: 'Objectifs stratégiques 2026 — OKR Q3',
    summary: 'Objectifs et résultats clés de l\'entreprise pour le troisième trimestre 2026.',
    content: `## Objectif 1 — Croissance du réseau de praticiens

**KR1.1** : Atteindre 2 500 praticiens actifs à fin septembre (+18% vs Q2)
**KR1.2** : Taux d'activation à J+7 ≥ 72%
**KR1.3** : NPS praticiens ≥ 45

## Objectif 2 — Expérience utilisateur

**KR2.1** : Augmenter les RDV pris via app de 35% vs Q2
**KR2.2** : Temps moyen de recherche < 90 secondes
**KR2.3** : App Store Rating ≥ 4.6 (iOS + Android)

## Objectif 3 — Solidité financière

**KR3.1** : ARR ≥ 780 000 €
**KR3.2** : Churn mensuel ≤ 2,1%
**KR3.3** : Gross Margin ≥ 68%

## Objectif 4 — Équipe et culture

**KR4.1** : eNPS interne ≥ 50
**KR4.2** : 3 nouveaux recrutements validés (Sales × 2, CSM × 1)
**KR4.3** : 100% des collaborateurs ont eu leur entretien semestriel

## Suivi

Point OKR mensuel en CODIR — dernier vendredi du mois, 14h.
Tableau de bord : Notion "OKR 2026 — Direction".`,
    tags: ['OKR', 'stratégie', 'objectifs', '2026'],
    service: 'direction',
    status: 'PUBLISHED',
  },
  {
    title: 'Procédure de reporting mensuel',
    summary: 'Format, sources de données et délais pour le rapport mensuel Direction.',
    content: `## Calendrier

| Étape | Responsable | Délai |
|---|---|---|
| Export données Metabase | IT | J+1 du mois suivant |
| Consolidation KPIs pôles | Chefs de pôle | J+3 |
| Rédaction rapport synthèse | COO | J+5 |
| Présentation CODIR | Direction | J+7, 9h |
| Envoi investisseurs | CEO | J+8 |

## Structure du rapport

1. **Faits marquants** (1 page) — top 3 réussites, top 3 difficultés
2. **KPIs clés** — croissance, rétention, financier
3. **OKR update** — avancement par objectif (RAG status)
4. **Focus pôle** — rotation mensuelle (IT ce mois)
5. **Risques et décisions** — arbitrages nécessaires

## Sources de données

- Revenus / Churn : Stripe Dashboard + export CSV
- Utilisateurs / Praticiens : Metabase (dashboard "Monthly Report")
- Marketing : Buffer Analytics + Google Analytics 4
- RH : Payfit export mensuel
- Support : Intercom rapport mensuel

## Accès

Rapports archivés sur Drive Direction / Reporting / 2026.
Accès restreint : Direction + Head of Pôles.`,
    tags: ['reporting', 'CODIR', 'mensuel', 'KPIs'],
    service: 'direction',
    status: 'PUBLISHED',
  },
  {
    title: 'Procédure de prise de décision — cadre DACI',
    summary: 'Framework de gouvernance pour les décisions structurantes chez Liberlo.',
    content: `## Le modèle DACI

| Rôle | Description |
|---|---|
| **Driver** | Pilote la décision, organise les échanges |
| **Approver** | A le dernier mot (CEO ou Head of pour les décisions métier) |
| **Contributor** | Apporte son expertise, consulté mais pas décisionnaire |
| **Informed** | Informé de la décision sans être consulté |

## Seuils de décision

| Type de décision | Approver |
|---|---|
| < 5 000 € de dépense ponctuelle | Head of pôle |
| 5 000 € → 20 000 € | COO |
| > 20 000 € ou recrutement | CEO |
| Changement de produit majeur | CEO + CTO |
| Pivot stratégique | Board |

## Process

1. Rédiger une note de décision (template Notion "Decision Note")
2. Identifier Driver, Approver, Contributors, Informed
3. Partager en asynchrone 48h avant la réunion de décision
4. Réunion ≤ 30 min : questions, arbitrage, décision actée
5. Logger dans Notion "Décisions 2026" avec date et rationale

## Principe

*"Disagree and commit"* : une fois la décision prise par l'Approver, tout le monde la porte, même en désaccord.`,
    tags: ['gouvernance', 'décision', 'DACI', 'process'],
    service: 'direction',
    status: 'DRAFT',
  },
]

// ─── Seed ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...')

  // Hash commun pour tous les comptes de démo
  const demoPasswordHash = await bcrypt.hash('Liberlo2026!', 10)

  // 1. Services
  console.log('  → Services...')
  const serviceMap: Record<string, string> = {}
  for (const s of SERVICES) {
    const service = await prisma.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    })
    serviceMap[s.slug] = service.id
  }

  // 2. Super Admin
  console.log('  → Super Admin...')
  await prisma.user.upsert({
    where: { email: 'ceo@liberlo.com' },
    update: {},
    create: {
      email: 'ceo@liberlo.com',
      passwordHash: demoPasswordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  // 3. Responsables (1 par pôle)
  console.log('  → Responsables...')
  const responsables = [
    { email: 'marc.dupont@liberlo.com', service: 'it' },
    { email: 'sarah.leblanc@liberlo.com', service: 'csm' },
    { email: 'thomas.bernard@liberlo.com', service: 'sales' },
    { email: 'camille.moreau@liberlo.com', service: 'marketing' },
    { email: 'julie.martin@liberlo.com', service: 'rh' },
    { email: 'pierre.lambert@liberlo.com', service: 'direction' },
  ]
  const responsableMap: Record<string, string> = {}
  for (const r of responsables) {
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: {
        email: r.email,
        passwordHash: demoPasswordHash,
        role: 'RESPONSABLE',
        serviceId: serviceMap[r.service],
        isActive: true,
      },
    })
    responsableMap[r.service] = user.id
  }

  // 4. Collaborateurs
  console.log('  → Collaborateurs...')
  const collaborateurs = [
    { email: 'alex.petit@liberlo.com', service: 'it' },
    { email: 'ines.roux@liberlo.com', service: 'it' },
    { email: 'leo.garnier@liberlo.com', service: 'csm' },
    { email: 'noemie.faure@liberlo.com', service: 'csm' },
    { email: 'hugo.renard@liberlo.com', service: 'sales' },
    { email: 'pauline.simon@liberlo.com', service: 'sales' },
    { email: 'maya.girard@liberlo.com', service: 'marketing' },
    { email: 'romain.leroy@liberlo.com', service: 'marketing' },
    { email: 'eva.nguyen@liberlo.com', service: 'rh' },
    { email: 'baptiste.morel@liberlo.com', service: 'rh' },
    { email: 'clara.dubois@liberlo.com', service: 'direction' },
    { email: 'maxime.fontaine@liberlo.com', service: 'direction' },
  ]
  for (const c of collaborateurs) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        passwordHash: demoPasswordHash,
        role: 'COLLABORATOR',
        serviceId: serviceMap[c.service],
        isActive: true,
      },
    })
  }

  // 5. Articles
  console.log('  → Articles...')
  for (const a of ARTICLES) {
    const authorId = responsableMap[a.service]
    const serviceId = serviceMap[a.service]

    const existing = await prisma.article.findFirst({
      where: { title: a.title, serviceId },
    })
    if (!existing) {
      await prisma.article.create({
        data: {
          title: a.title,
          summary: a.summary,
          content: a.content,
          tags: a.tags,
          serviceId,
          authorId,
          status: a.status,
          visibility: 'SERVICE',
        },
      })
    }
  }

  console.log('✅ Seed terminé.')
  console.log('')
  console.log('Comptes disponibles (mot de passe : Liberlo2026!) :')
  console.log('  SUPER_ADMIN : ceo@liberlo.com')
  console.log('  RESPONSABLE IT : marc.dupont@liberlo.com')
  console.log('  RESPONSABLE CSM : sarah.leblanc@liberlo.com')
  console.log('  COLLABORATEUR : alex.petit@liberlo.com')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
