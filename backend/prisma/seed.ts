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
    content: `## Accès à créer le jour J\n\n1. **GitHub** — inviter dans l'organisation Liberlo\n2. **Notion** — espace Workspace IT\n3. **Vercel** — projet frontend, rôle "Developer"\n4. **Sentry** — organisation liberlo\n5. **Slack** — channels : #général, #tech, #deploys\n\n## Configuration locale\n\n\`\`\`bash\ngit clone git@github.com:liberlo-app/api.git\ncd api && cp .env.example .env\nnpm install && npm run dev\n\`\`\`\n\n## Accès VPN\n\nContactez l'admin IT pour recevoir le fichier de config WireGuard. Le VPN est obligatoire pour accéder aux bases de données de production.`,
    tags: ['onboarding', 'accès', 'outils'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Procédure de réinitialisation des accès collaborateur',
    summary: 'Étapes à suivre lorsqu\'un collaborateur perd ses accès ou quitte l\'entreprise.',
    content: `## Départ d'un collaborateur\n\n**Délai : immédiat à la notification RH**\n\n1. Révoquer l'accès GitHub\n2. Désactiver le compte Google Workspace\n3. Révoquer les tokens API actifs\n4. Supprimer les clés SSH\n5. Archiver les données Notion\n\n## Perte de mot de passe\n\n1. Email à support-it@liberlo.com\n2. Vérification d'identité par appel vidéo\n3. Réinitialisation via panel admin Google Workspace\n4. Envoi du mot de passe temporaire par canal sécurisé (Signal)`,
    tags: ['sécurité', 'accès', 'offboarding'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Architecture technique de la plateforme Liberlo',
    summary: 'Vue d\'ensemble de l\'architecture applicative — backend, frontend, BDD, infra.',
    content: `## Stack technique\n\n### Backend\n- **API REST** : Node.js / NestJS — déployé sur Railway\n- **Base de données** : PostgreSQL (Neon) — pgvector pour la recherche sémantique\n- **Auth** : JWT + refresh tokens\n\n### Frontend\n- **Web app** : Vue 3 + Vite — déployé sur Vercel\n- **App mobile** : React Native (Expo)\n\n### Infra\n- CI/CD : GitHub Actions\n- Monitoring : Sentry + Datadog\n\n## Environnements\n\n| Env | URL | BDD |\n|---|---|---|\n| Production | app.liberlo.com | Neon prod |\n| Staging | staging.liberlo.com | Neon staging |`,
    tags: ['architecture', 'technique', 'infra'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Guide de déploiement en production',
    summary: 'Procédure complète pour déployer une nouvelle version de l\'API ou du frontend en production.',
    content: `## Prérequis\n\n- PR mergée sur \`main\` après review\n- CI/CD vert (GitHub Actions)\n- Pas de migration breaking en base\n\n## Déploiement backend (Railway)\n\n1. Le push sur \`main\` déclenche automatiquement le déploiement Railway\n2. Vérifier les logs Railway : dashboard → liberlo-api → Deployments\n3. Tester l'endpoint de santé : \`GET /api/health\`\n4. Vérifier Sentry : pas de nouvelles erreurs dans les 10 min\n\n## Déploiement frontend (Vercel)\n\n1. Vercel détecte automatiquement le push sur \`main\`\n2. Build visible dans le dashboard Vercel → liberlo-web\n3. Tester la preview URL avant promotion en production\n\n## Rollback\n\nEn cas d'incident : Railway → Deployments → rollback sur la version précédente (< 2 min).`,
    tags: ['déploiement', 'production', 'CI/CD', 'Railway'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Politique de sécurité des mots de passe',
    summary: 'Règles de complexité, de rotation et de stockage des mots de passe chez Liberlo.',
    content: `## Règles de complexité\n\n- Minimum 12 caractères\n- Au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial\n- Pas de mot du dictionnaire, pas de prénom ou nom\n- Différent des 5 derniers mots de passe utilisés\n\n## Outils recommandés\n\n- **1Password** (licence fournie par Liberlo) — stockage de tous les mots de passe pro\n- **Google Workspace** — SSO pour la majorité des outils internes\n\n## Rotation\n\n- Mots de passe critiques (prod, infra) : rotation tous les 90 jours\n- Comptes service : rotation annuelle ou lors d'un départ d'équipe\n- En cas de suspicion de compromission : changement immédiat + alerte IT\n\n## Ce qui est interdit\n\n- Partager un mot de passe par email ou Slack\n- Utiliser le même mot de passe sur plusieurs services\n- Noter un mot de passe en clair`,
    tags: ['sécurité', 'mots de passe', 'politique'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Gestion des incidents de production',
    summary: 'Processus de détection, escalade et résolution des incidents techniques en production.',
    content: `## Niveaux de sévérité\n\n| P0 | Service totalement indisponible — impact tous utilisateurs |\n| P1 | Fonctionnalité critique dégradée — impact fort |\n| P2 | Bug significatif — workaround possible |\n| P3 | Bug mineur — aucun impact immédiat |\n\n## Processus P0/P1\n\n1. **Détection** : alerte Sentry / Datadog → Slack #alerts\n2. **Acknowledgement** : un engineer répond dans les 5 min\n3. **War room** : channel Slack dédié créé (#incident-YYYYMMDD)\n4. **Communication** : message dans #général toutes les 30 min\n5. **Résolution** : fix déployé, tests validés\n6. **Post-mortem** : document Notion rédigé dans les 48h\n\n## Post-mortem template\n\n- Chronologie des événements\n- Cause racine (root cause)\n- Impact mesuré (users affectés, durée)\n- Actions correctives (avec responsables et délais)`,
    tags: ['incident', 'production', 'P0', 'post-mortem'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Processus de code review',
    summary: 'Règles et bonnes pratiques pour les revues de code chez Liberlo.',
    content: `## Principes\n\n- Toute PR nécessite au minimum 1 review approuvée avant le merge\n- Les PRs > 400 lignes changées doivent être découpées\n- Reviewer désigné dans les 4h ouvrées après ouverture de la PR\n\n## Checklist reviewer\n\n- [ ] La logique métier est correcte\n- [ ] Les cas d'erreur sont gérés\n- [ ] Pas de secrets ou credentials en dur\n- [ ] Tests ajoutés/mis à jour\n- [ ] Naming clair et cohérent avec la codebase\n- [ ] Pas de dépendances inutiles ajoutées\n\n## Ton des commentaires\n\n- Formuler en questions ("Aurait-on pu...") plutôt qu'en ordres ("Change ça")\n- Distinguer bloquant (🔴) de suggestion (💡) et de nit (🔵)\n- Approuver avec "LGTM" ou "LGTM modulo comments"\n\n## Délai de réponse\n\nL'auteur doit répondre aux commentaires dans les 24h ouvrées.`,
    tags: ['code review', 'PR', 'qualité', 'processus'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Politique de backup et restauration des données',
    summary: 'Stratégie de sauvegarde de la base de données et procédure de restauration en cas d\'incident.',
    content: `## Fréquence des backups\n\n- **Production** : backup automatique Neon toutes les heures, rétention 30 jours\n- **Staging** : backup quotidien, rétention 7 jours\n- **Local** : backup manuel recommandé avant toute migration de schéma\n\n## Procédure de restauration\n\n1. Identifier le point de restauration cible (timestamp)\n2. Créer un fork du backup dans Neon dashboard\n3. Tester la restauration sur un environnement de staging\n4. Si validé : basculer la production (downtime < 5 min)\n5. Notifier les équipes via #incidents\n\n## Tests de restauration\n\nUn test de restauration est effectué trimestriellement par l'équipe IT pour valider la procédure.`,
    tags: ['backup', 'restauration', 'données', 'BDD'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Configuration Docker pour le développement local',
    summary: 'Guide d\'installation et de configuration de l\'environnement Docker en local.',
    content: `## Prérequis\n\n- Docker Desktop ≥ 4.20 (Mac/Windows) ou Docker Engine ≥ 24 (Linux)\n- 8 Go de RAM minimum alloués à Docker\n\n## Lancement\n\n\`\`\`bash\ngit clone git@github.com:liberlo-app/liberlo-knowledge.git\ncd liberlo-knowledge\ncp .env.example .env  # puis remplir les variables\ndocker compose up -d\n\`\`\`\n\n## Services disponibles\n\n| Service | URL | Description |\n|---|---|---|\n| Backend API | http://localhost:3001 | NestJS |\n| Frontend | http://localhost:5173 | Vue 3 |\n| DB | localhost:5434 | PostgreSQL + pgvector |\n\n## Variables d'environnement importantes\n\n\`DATABASE_URL\` — connexion à la BDD\n\`JWT_SECRET\` — clé de signature des tokens (min 32 chars en prod)\n\`OPENAI_API_KEY\` — pour les embeddings (optionnel en dev)`,
    tags: ['Docker', 'développement', 'local', 'configuration'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Guide d\'utilisation de Sentry pour le monitoring des erreurs',
    summary: 'Comment utiliser Sentry pour suivre, trier et résoudre les erreurs en production.',
    content: `## Accès\n\nURL : sentry.io → organisation "liberlo"\nDemander l'accès à Marc D. (IT) via Slack @marc.\n\n## Projets configurés\n\n- **liberlo-api** — erreurs backend NestJS\n- **liberlo-web** — erreurs frontend Vue 3\n- **liberlo-mobile** — erreurs React Native\n\n## Workflow de traitement\n\n1. **Nouvelles erreurs** → apparaissent dans "Unresolved Issues"\n2. **Triage** : assigner à un engineer, ajouter le tag du service concerné\n3. **Investigation** : stack trace + contexte utilisateur + breadcrumbs\n4. **Fix** : PR avec référence au Sentry issue ID\n5. **Résolution** : marquer "Resolved" dans Sentry après déploiement\n\n## Alertes configurées\n\n- P0 : alerte Slack immédiate si > 10 erreurs/min sur l'API\n- P1 : alerte si taux d'erreur > 1% sur les endpoints critiques`,
    tags: ['Sentry', 'monitoring', 'erreurs', 'production'],
    service: 'it',
    status: 'PUBLISHED',
  },

  // ── CSM ────────────────────────────────────────────────────────────────────
  {
    title: 'Cycle de vie d\'un praticien — process de suivi CSM',
    summary: 'Toutes les étapes du parcours praticien, de l\'inscription à la fidélisation.',
    content: `## Phases du cycle de vie\n\n### Phase 1 — Activation (J0 à J+7)\n- Email de bienvenue automatique (J0)\n- Appel d'onboarding CSM (J+2) — 20 min\n- Vérification du profil complété à 80% (J+7)\n\n### Phase 2 — Engagement (J+8 à J+90)\n- Check-in mensuel par email\n- Invitation au webinaire mensuel praticiens\n\n### Phase 3 — Fidélisation (J+90 et au-delà)\n- NPS semestriel (Typeform)\n- Renouvellement d'abonnement : relance J-30\n- Programme ambassadeurs : proposé à partir de 10 avis ≥ 4★\n\n## Signaux d'alerte (churn risk)\n- Aucune connexion depuis 14 jours\n- Taux de réponse aux messages < 30%`,
    tags: ['process', 'praticien', 'suivi', 'onboarding'],
    service: 'csm',
    status: 'PUBLISHED',
  },
  {
    title: 'Script de relance praticien inactif',
    summary: 'Template d\'email et guide d\'appel pour recontacter un praticien sans activité depuis 14 jours.',
    content: `## Critère de déclenchement\n\nPraticien sans connexion depuis ≥ 14 jours ET sans RDV planifié.\n\n## Email de relance (J+14)\n\n> Objet : On a pensé à vous 👋\n>\n> Bonjour [Prénom],\n>\n> Votre profil Liberlo est bien en place, mais on ne vous a pas vu depuis quelques jours.\n> Je suis disponible pour un appel rapide si vous le souhaitez.\n>\n> [Lien Calendly]\n\n## Script appel (si pas de réponse à J+21)\n\n1. Introduction chaleureuse\n2. Identifier le frein principal\n3. Proposer une solution concrète\n4. Fixer un prochain point dans 7 jours\n5. Logger dans le CRM`,
    tags: ['relance', 'template', 'inactivité', 'churn'],
    service: 'csm',
    status: 'PUBLISHED',
  },
  {
    title: 'Guide de résolution des tickets Support Niveau 1',
    summary: 'Réponses aux questions les plus fréquentes des praticiens et des utilisateurs.',
    content: `## Catégories de tickets L1\n\n### Accès / Connexion\n"Je n'arrive pas à me connecter" → Vérifier l'email, proposer la réinitialisation mdp.\n\n### Profil praticien\n"Ma photo ne s'affiche pas" → Format JPG/PNG, max 5 Mo, ratio 1:1.\n\n### Paiements\n"Je n'ai pas reçu mon virement" → Délai standard 3-5 jours. Vérifier l'IBAN dans les paramètres.\n\n## SLA tickets\n- L1 : réponse sous 4h, résolution sous 24h\n- L2 : transfert sous 2h, résolution sous 72h`,
    tags: ['support', 'FAQ', 'tickets', 'L1'],
    service: 'csm',
    status: 'PUBLISHED',
  },
  {
    title: 'NPS — Méthodologie et interprétation des résultats',
    summary: 'Comment mesurer, analyser et exploiter le Net Promoter Score des praticiens.',
    content: `## Qu'est-ce que le NPS ?\n\nLe NPS mesure la probabilité qu'un praticien recommande Liberlo (note de 0 à 10).\n- **Promoteurs** (9-10) : ambassadeurs potentiels\n- **Passifs** (7-8) : satisfaits mais non engagés\n- **Détracteurs** (0-6) : risque de churn et de bouche-à-oreille négatif\n\nFormule : NPS = % Promoteurs - % Détracteurs\n\n## Fréquence de mesure\n\n- Enquête Typeform envoyée tous les 6 mois à tous les praticiens actifs\n- Enquête déclenchée à J+90 pour les nouveaux praticiens\n\n## Objectif Q3 2026\n\nNPS praticiens ≥ 45\n\n## Plan d'action selon résultat\n\n- NPS < 30 : plan d'urgence, entretiens qualitatifs avec détracteurs\n- NPS 30-45 : actions ciblées sur les passifs\n- NPS > 45 : programme ambassadeurs activé`,
    tags: ['NPS', 'satisfaction', 'mesure', 'praticien'],
    service: 'csm',
    status: 'PUBLISHED',
  },
  {
    title: 'Procédure d\'escalade praticien mécontent',
    summary: 'Protocole de gestion des situations de crise avec un praticien insatisfait ou menaçant de partir.',
    content: `## Signaux déclencheurs\n\n- NPS ≤ 4\n- Email ou appel explicitement négatif\n- Demande de remboursement avec motif de mécontentement\n- Ticket support avec ton agressif ou menaçant\n\n## Niveau 1 — Gestion CSM (0-24h)\n\n1. Appel téléphonique dans les 4h (pas d'email)\n2. Écoute active, pas de justification immédiate\n3. Identifier la cause racine du mécontentement\n4. Proposer une solution concrète (formation, réduction, fix technique)\n5. Confirmer par email récapitulatif avec les engagements pris\n\n## Niveau 2 — Escalade manager CSM (si non résolu à 48h)\n\n- Le manager reprend le dossier et contacte le praticien\n- Peut proposer : 1 mois offert, remise exceptionnelle 20%\n- Si départ inévitable : demander un retour qualitatif pour amélioration\n\n## Ce qu'on ne fait jamais\n\n- Promettre quelque chose qu'on ne peut pas tenir\n- Laisser un ticket sans réponse plus de 24h`,
    tags: ['escalade', 'mécontentement', 'churn', 'protocole'],
    service: 'csm',
    status: 'PUBLISHED',
  },
  {
    title: 'Programme ambassadeurs praticiens',
    summary: 'Conditions d\'éligibilité, avantages et fonctionnement du programme ambassadeurs Liberlo.',
    content: `## Critères d'éligibilité\n\n- ≥ 10 avis clients avec note moyenne ≥ 4★\n- Compte actif depuis ≥ 6 mois\n- Aucun incident de paiement\n- NPS personnel ≥ 8\n\n## Avantages ambassadeurs\n\n- Badge "Ambassadeur Liberlo" sur le profil\n- 1 mois gratuit par praticien parrainé (filleul actif ≥ 30 jours)\n- Accès prioritaire aux nouvelles fonctionnalités (beta)\n- Invitation aux événements Liberlo\n\n## Processus de parrainage\n\n1. L'ambassadeur partage son lien de parrainage unique\n2. Le filleul s'inscrit via ce lien\n3. À J+30 d'activité du filleul : crédit automatique\n4. Suivi dans le tableau de bord ambassadeur\n\n## Objectif Q3 2026\n\n50 ambassadeurs actifs, 120 parrainages validés`,
    tags: ['ambassadeurs', 'parrainage', 'fidélisation', 'programme'],
    service: 'csm',
    status: 'PUBLISHED',
  },
  {
    title: 'Dashboard KPIs CSM — guide de lecture',
    summary: 'Comment lire et interpréter les indicateurs clés du pôle CSM dans Metabase.',
    content: `## Accès\n\nMetabase → Dashboard "CSM KPIs" (accès CSM uniquement)\nURL interne : metabase.liberlo.internal\n\n## Indicateurs principaux\n\n| Indicateur | Description | Objectif Q3 |\n|---|---|---|\n| Taux d'activation J+7 | % praticiens avec profil ≥ 80% à J+7 | ≥ 72% |\n| Churn mensuel | % résiliations / parc actif | ≤ 2,1% |\n| NPS | Score promoteurs - détracteurs | ≥ 45 |\n| CSAT tickets | Satisfaction post-ticket | ≥ 4,2/5 |\n| Time to first value | Délai premier RDV pris | ≤ 14 jours |\n\n## Fréquence de review\n\n- Quotidienne : churn alerts + tickets en attente\n- Hebdomadaire : standup CSM chaque lundi 9h30\n- Mensuelle : reporting Direction + ajustement objectifs`,
    tags: ['KPIs', 'dashboard', 'Metabase', 'reporting'],
    service: 'csm',
    status: 'PUBLISHED',
  },
  {
    title: 'Guide de prise de notes lors des appels praticiens',
    summary: 'Structure et bonnes pratiques pour documenter efficacement les échanges avec les praticiens.',
    content: `## Où noter\n\nCRM interne (HubSpot) → fiche du praticien → onglet "Notes"\n\n## Structure d'une note d'appel\n\n\`\`\`\nDate : [JJ/MM/AAAA]\nDurée : [X min]\nContexte : [Raison de l'appel]\n\nPoints abordés :\n- [Point 1]\n- [Point 2]\n\nDecisions / Engagements :\n- [Engagement 1] — responsable : [Prénom] — délai : [Date]\n\nProchaine étape :\n- [Action] le [Date]\n\`\`\`\n\n## Bonnes pratiques\n\n- Saisir la note dans les 15 min après l'appel\n- Utiliser des faits, pas des interprétations\n- Toujours noter la prochaine étape avec une date\n- Tagguer la note avec le type : "onboarding", "relance", "escalade", "renouvellement"`,
    tags: ['notes', 'appels', 'CRM', 'HubSpot'],
    service: 'csm',
    status: 'PUBLISHED',
  },
  {
    title: 'Onboarding praticien premium — process dédié',
    summary: 'Parcours d\'onboarding renforcé pour les praticiens ayant souscrit à l\'offre Premium.',
    content: `## Différences avec l'onboarding standard\n\n- Appel de bienvenue en 48h (vs J+2)\n- Session de configuration du profil en live (30 min)\n- Responsable CSM dédié pour les 3 premiers mois\n- Accès au channel Slack privé #premium-support\n\n## Checklist onboarding premium\n\n**J0 :** Email de bienvenue personnalisé + accès au canal privé\n**J+1 :** Appel de bienvenue (présentation CSM dédié, tour du produit)\n**J+3 :** Session live de configuration du profil\n**J+7 :** Vérification : profil complet, premier RDV planifié ?\n**J+14 :** Premier bilan d'activité (RDV, vues profil, messages reçus)\n**J+30 :** Point satisfaction + activation programme ambassadeurs si éligible\n\n## SLA premium\n\n- Tickets L1 : réponse en 1h ouvrée\n- Bugs bloquants : résolution en 4h`,
    tags: ['premium', 'onboarding', 'praticien', 'VIP'],
    service: 'csm',
    status: 'PUBLISHED',
  },
  {
    title: 'Gestion des demandes de remboursement',
    summary: 'Politique et procédure de traitement des demandes de remboursement praticiens.',
    content: `## Politique de remboursement\n\n- **Dans les 14 jours** : remboursement intégral automatique (droit de rétractation)\n- **15 à 30 jours** : remboursement au prorata si motif légitime (bug, non-fonctionnalité)\n- **Au-delà de 30 jours** : examiné au cas par cas par le manager CSM\n\n## Procédure\n\n1. Le praticien envoie la demande par email ou via le formulaire de contact\n2. CSM vérifie l'éligibilité et le motif\n3. Validation manager si montant > 50€ ou si hors délai standard\n4. Traitement via Stripe Dashboard (remboursement partiel ou total)\n5. Email de confirmation envoyé au praticien\n6. Log dans le CRM avec motif et montant\n\n## Ce qu'on évite\n\n- Refuser sans expliquer les raisons\n- Promettre un remboursement sans validation manager`,
    tags: ['remboursement', 'Stripe', 'politique', 'praticien'],
    service: 'csm',
    status: 'PUBLISHED',
  },

  // ── Sales ───────────────────────────────────────────────────────────────────
  {
    title: 'Pitch commercial Liberlo — v3.2',
    summary: 'Script structuré pour la présentation de Liberlo à des praticiens prospects.',
    content: `## Objectif\n\nConvaincre un praticien en 15-20 min via la méthode SPIN.\n\n### Situation (2 min)\n"Vous exercez depuis combien de temps ? Vous avez principalement des clients récurrents ?"\n\n### Problème (3 min)\n"Comment faites-vous pour être trouvé par de nouveaux patients ?"\n\n### Implication (5 min)\n"Combien de nouveaux patients par mois souhaiteriez-vous ?"\n\n### Besoin / Solution (7 min)\n"C'est exactement pour ça que Liberlo existe — profil visible, prise de RDV intégrée, avis vérifiés."\n\n## Objections courantes\n\n| Objection | Réponse |\n|---|---|\n| "C'est trop cher" | Comparer au coût d'acquisition Google Ads |\n| "J'ai déjà un site" | Liberlo c'est la distribution, pas le site |\n| "Je suis déjà complet" | Parfait pour la liste d'attente |`,
    tags: ['pitch', 'commercial', 'script', 'SPIN'],
    service: 'sales',
    status: 'PUBLISHED',
  },
  {
    title: 'Process de qualification d\'un prospect praticien',
    summary: 'Critères BANT et étapes pour qualifier un praticien avant de le passer en démo.',
    content: `## Critères BANT\n\n- **Budget** : L'abonnement entre dans son budget ?\n- **Autorité** : Est-il décisionnaire ?\n- **Besoin** : Cherche-t-il à développer sa patientèle ?\n- **Timing** : Quand décide-t-il ?\n\n## Pipeline Salesforce\n\n1. Lead → import depuis formulaire / LinkedIn / événement\n2. Qualifié → appel de qualification (10 min), score BANT ≥ 3/4\n3. Démo planifiée → démo produit 30 min\n4. Proposition → envoi offre, suivi J+3\n5. Négociation → max 2 relances, discount max 15%\n6. Gagné / Perdu → motif obligatoire dans CRM`,
    tags: ['qualification', 'BANT', 'pipeline', 'CRM'],
    service: 'sales',
    status: 'PUBLISHED',
  },
  {
    title: 'Tarification et grilles tarifaires 2026',
    summary: 'Offres, prix et conditions tarifaires Liberlo en vigueur pour l\'année 2026.',
    content: `## Offres disponibles\n\n| Offre | Prix mensuel | Engagement | Avantages |\n|---|---|---|---|\n| Starter | 49€ HT | Mensuel | Profil de base, 0 commission |\n| Pro | 89€ HT | Annuel | Profil enrichi + analytics |\n| Premium | 149€ HT | Annuel | Tout Pro + CSM dédié + badge |\n\n## Conditions spéciales\n\n- Remise annuelle : -15% sur les offres Pro et Premium si paiement annuel\n- Remise volume (cabinet multi-praticiens) : -10% dès 3 profils\n- Offre de lancement : 1er mois offert pour les prospects événement\n\n## Politique de négociation\n\n- Discount max sans validation : 10%\n- Discount 10-20% : validation manager Sales\n- Discount > 20% : validation directeur commercial\n\n**Jamais de remise non tracée dans Salesforce.**`,
    tags: ['tarification', 'prix', 'offres', 'commercial'],
    service: 'sales',
    status: 'PUBLISHED',
  },
  {
    title: 'Guide de démonstration produit',
    summary: 'Script et checklist pour mener une démo Liberlo efficace en 30 minutes.',
    content: `## Avant la démo\n\n- Créer un compte de démo frais (ne pas utiliser son propre compte)\n- Vérifier la connexion Internet et le partage d'écran\n- Avoir le nom et la spécialité du prospect pour personnaliser\n\n## Structure de la démo (30 min)\n\n**5 min** — Rappel du contexte (ce qu'on a appris lors de la qualification)\n**10 min** — Vue utilisateur : "Voilà comment votre patient vous trouve"\n**10 min** — Vue praticien : dashboard, prise de RDV, messagerie, analytics\n**5 min** — Questions + prochaine étape\n\n## Points à ne pas manquer\n\n- Montrer la recherche géolocalisée du côté patient\n- La facilité d'ajout d'un créneau disponible\n- Les statistiques de visibilité (vues profil, clics prise de RDV)\n\n## Clôture\n\n"On fait comment pour commencer ?" — proposer directement l'offre, ne pas attendre.`,
    tags: ['démo', 'produit', 'script', 'commercial'],
    service: 'sales',
    status: 'PUBLISHED',
  },
  {
    title: 'Les 10 profils praticiens les plus réceptifs à Liberlo',
    summary: 'Personas des praticiens avec le meilleur taux de conversion historique.',
    content: `## Top personas (données Salesforce Q1-Q2 2026)\n\n1. **Ostéopathe installé depuis < 3 ans** — besoin fort de visibilité\n2. **Naturopathe en cabinet partagé** — veut se différencier des collègues\n3. **Sophrologue en reconversion** — profil digital, cherche une solution clé en main\n4. **Acupuncteur en zone rurale** — besoin de capter les patients des villes proches\n5. **Kinésithérapeute privé** — cherche à réduire les périodes creuses\n6. **Hypnothérapeute débutant** — pas encore de réseau, a besoin de notoriété\n7. **Nutritionniste** — nombreuses demandes, veut qualifier les patients\n8. **Psychologue libéral** — liste d'attente longue, veut gérer les annulations\n9. **Coach de vie certifié** — cherche à se professionnaliser\n10. **Praticien ayurvédique** — niche peu représentée, forte différenciation possible\n\n## Comment utiliser cette liste\n\nAdapter le pitch et les exemples à la spécialité du prospect. Le taux de conversion est 2,3x plus élevé quand le commercial connaît la discipline.`,
    tags: ['personas', 'conversion', 'ciblage', 'praticien'],
    service: 'sales',
    status: 'PUBLISHED',
  },
  {
    title: 'Gestion des objections avancées',
    summary: 'Réponses structurées aux objections complexes rencontrées lors des entretiens commerciaux.',
    content: `## Objection : "Je vais y réfléchir"\n\nC'est souvent un "non" poli. Réponse :\n1. "Bien sûr. Qu'est-ce qui vous retient principalement ?"\n2. Identifier la vraie objection cachée\n3. Proposer une trial ou une garantie satisfait/remboursé\n\n## Objection : "Je connais déjà Doctolib"\n\nDoctolib cible les médecins, pas les médecines complémentaires.\n"Doctolib ne référence pas les ostéopathes, naturopathes ou sophrologues — c'est exactement notre terrain."\n\n## Objection : "J'ai déjà assez de patients"\n\n"Parfait. Avec Liberlo, vous pouvez activer une liste d'attente et choisir vos nouveaux patients selon leurs besoins. Plus de décrochage de téléphone pour les urgences."\n\n## Objection : "Je ne fais pas confiance aux plateformes"\n\n"On comprend. C'est pourquoi on n'est pas intermédiaire dans vos paiements — vous restez propriétaire de votre relation patient."`,
    tags: ['objections', 'négociation', 'réponses', 'commercial'],
    service: 'sales',
    status: 'PUBLISHED',
  },
  {
    title: 'Rapport d\'activité hebdomadaire Sales',
    summary: 'Format et contenu attendu pour le rapport d\'activité Sales chaque vendredi.',
    content: `## À remplir chaque vendredi avant 17h dans Notion "Sales Weekly"\n\n## Structure\n\n**Semaine du [date] au [date]**\n\n### Activité\n- Appels passés : [N]\n- Démos réalisées : [N]\n- Propositions envoyées : [N]\n- Closings : [N]\n\n### Pipeline\n- Nouvelles opportunités : [N] — [valeur ARR estimée]\n- Opportunités avancées (Négociation) : [N]\n\n### Wins\n- [Praticien] — [offre] — [ARR]\n\n### Blocages\n- [Situation] — [aide attendue]\n\n### Objectifs semaine suivante\n- [Objectif 1]\n- [Objectif 2]`,
    tags: ['rapport', 'hebdomadaire', 'activité', 'Sales'],
    service: 'sales',
    status: 'PUBLISHED',
  },
  {
    title: 'Partenariats et apporteurs d\'affaires',
    summary: 'Programme de partenariat commercial Liberlo : conditions, commissionnement et process.',
    content: `## Types de partenaires\n\n- **Écoles de formation** : formation ostéo, naturo, sophro → présentation Liberlo aux diplômés\n- **Associations professionnelles** : partenariat institutionnel\n- **Prescripteurs individuels** : médecins, coachs, formateurs qui recommandent Liberlo\n\n## Commissionnement\n\n| Type | Commission | Condition |\n|---|---|---|\n| Apporteur individuel | 15% MRR pendant 12 mois | Praticien actif 30 jours |\n| École partenaire | 10% MRR pendant 6 mois | Via lien trackable |\n| Association | Accord personnalisé | Selon volume |\n\n## Processus\n\n1. Contrat de partenariat signé (template juridique Notion)\n2. Lien de tracking unique créé dans Salesforce\n3. Tableau de bord partenaire accessible via lien\n4. Virement mensuel le 5 du mois`,
    tags: ['partenariat', 'apporteurs', 'commissionnement', 'B2B'],
    service: 'sales',
    status: 'PUBLISHED',
  },
  {
    title: 'Suivi pipeline Salesforce — guide quotidien',
    summary: 'Routine quotidienne de mise à jour et de review du pipeline dans Salesforce.',
    content: `## Routine matin (9h-9h30)\n\n1. Ouvrir Salesforce → vue "Mon pipeline actif"\n2. Identifier les opportunités à relancer aujourd'hui (date de suivi dépassée)\n3. Vérifier les tâches du jour dans l'onglet "Activités"\n4. Priorité : Négociation > Proposition > Démo planifiée\n\n## Mise à jour obligatoire après chaque contact\n\n- Stage de l'opportunité (avancer si progression)\n- Note d'appel (template CSM)\n- Prochaine action + date\n- Probabilité de closing (estimée honnêtement)\n\n## Règles absolues\n\n- Aucune opportunité sans "Prochaine étape" définie\n- Si pas de contact depuis 21 jours → passer en "Stale" et contacter le manager\n- Closing du vendredi : mettre à jour tous les stages avant le rapport hebdo`,
    tags: ['Salesforce', 'pipeline', 'quotidien', 'process'],
    service: 'sales',
    status: 'PUBLISHED',
  },

  // ── Marketing ───────────────────────────────────────────────────────────────
  {
    title: 'Charte graphique et guidelines de marque Liberlo',
    summary: 'Couleurs, typographies, ton éditorial et règles d\'utilisation du logo.',
    content: `## Palette de couleurs\n\n| Couleur | Hex | Usage |\n|---|---|---|\n| Violet primaire | #6b2fa0 | CTA, liens, accents |\n| Violet clair | #9b59d0 | Hover, backgrounds |\n| Lavande | #f0e6ff | Backgrounds doux |\n\n## Typographie\n- **Titres** : Instrument Sans, Semi Bold\n- **Corps** : Inter, Regular\n\n## Logo\n- Ne jamais déformer ni changer les couleurs\n- Zone de protection : 16px minimum autour\n\n## Ton éditorial\n- Bienveillant et accessible\n- Tutoyement marketing, vouvoiement transactionnel`,
    tags: ['branding', 'design', 'charte', 'logo'],
    service: 'marketing',
    status: 'PUBLISHED',
  },
  {
    title: 'Calendrier éditorial et fréquences de publication',
    summary: 'Organisation des publications par canal et par cible (praticiens / utilisateurs).',
    content: `## Canaux et fréquences\n\n| Canal | Fréquence | Cible |\n|---|---|---|\n| Blog | 2×/mois | SEO / praticiens |\n| Newsletter praticiens | 1×/mois | Praticiens inscrits |\n| Instagram | 3×/semaine | Grand public |\n| LinkedIn | 2×/semaine | Praticiens / pro |\n| TikTok | 1×/semaine | Grand public 18-35 |\n\n## Thèmes récurrents\n\n**Semaine 1** : Tips bien-être\n**Semaine 2** : Success story praticien\n**Semaine 3** : Actualité santé naturelle\n**Semaine 4** : Coulisses Liberlo / valeurs\n\n## Outils\n- Planification : Buffer\n- Visuels : Figma\n- Analytics : Metabase "Marketing KPIs"`,
    tags: ['editorial', 'réseaux sociaux', 'newsletter', 'planning'],
    service: 'marketing',
    status: 'PUBLISHED',
  },
  {
    title: 'SEO — Stratégie de mots-clés et optimisation',
    summary: 'Stratégie SEO de Liberlo : mots-clés cibles, structure des contenus et suivi des positions.',
    content: `## Mots-clés prioritaires\n\n### Cible utilisateurs\n- "ostéopathe [ville]"\n- "naturopathe proche de moi"\n- "consultation sophrologie en ligne"\n\n### Cible praticiens\n- "plateforme praticien bien-être"\n- "développer patientèle praticien naturel"\n- "logiciel prise de rendez-vous thérapeute"\n\n## Structure des pages SEO\n\nChaque page service doit avoir :\n1. H1 avec mot-clé principal\n2. Meta description < 160 caractères\n3. 300 mots minimum de contenu unique\n4. Maillage interne vers 2-3 articles de blog\n\n## Outils\n\n- Semrush : suivi des positions (hebdomadaire)\n- Search Console : indexation + CTR\n- Screaming Frog : audit technique trimestriel\n\n## Objectif Q3 2026\n\nTop 5 sur "ostéopathe + 10 villes principales françaises"`,
    tags: ['SEO', 'mots-clés', 'positionnement', 'référencement'],
    service: 'marketing',
    status: 'PUBLISHED',
  },
  {
    title: 'Guide de création de contenu Instagram',
    summary: 'Formats, bonnes pratiques et processus de validation pour les publications Instagram de Liberlo.',
    content: `## Formats à utiliser\n\n| Format | Fréquence | Objectif |\n|---|---|---|\n| Carrousel éducatif | 3×/semaine | Engagement + sauvegarde |\n| Reel | 2×/semaine | Reach + découverte |\n| Stories | 5×/semaine | Lien + sondage |\n| Post produit | 1×/mois | Conversion |\n\n## Template carrousel\n\n1. Slide 1 : Accroche (question ou chiffre choc)\n2. Slides 2-8 : Contenu (1 idée par slide, visuel simple)\n3. Slide finale : CTA clair + logo Liberlo\n\n## Checklist avant publication\n\n- [ ] Couleurs conformes à la charte\n- [ ] Pas de fautes d'orthographe\n- [ ] Hashtags vérifiés (max 15, mix large/niche)\n- [ ] Heure de publication : 7h-9h ou 18h-20h\n- [ ] Validé par le Content Lead sur #content-review\n\n## Hashtags récurrents\n\n#bienetre #medecinenaturelle #liberlo #praticien #naturel #sante`,
    tags: ['Instagram', 'contenu', 'réseaux sociaux', 'carrousel'],
    service: 'marketing',
    status: 'PUBLISHED',
  },
  {
    title: 'Campagnes Google Ads — structure et optimisation',
    summary: 'Comment structurer, lancer et optimiser les campagnes Google Ads de Liberlo.',
    content: `## Structure de campagne\n\n\`\`\`\nCampagne (par objectif)\n  └── Groupe d'annonces (par thème / persona)\n        └── Annonces (3-4 variantes)\n              └── Mots-clés (exact + expression)\n\`\`\`\n\n## Campagnes actives\n\n1. **Praticiens — Acquisition** : ciblage "développer patientèle"\n2. **Utilisateurs — Awareness** : ciblage "trouver un praticien"\n3. **Brand** : protection de la marque "Liberlo"\n\n## Paramètres de base\n\n- CPC max : 2,50€ (ajuster selon ROAS)\n- Budget quotidien : 50€/campagne\n- Ciblage géographique : France métropolitaine\n- Planification : lundi-vendredi 8h-22h\n\n## Optimisations hebdomadaires\n\n- Review des search terms → ajouter négatifs\n- Pauser les mots-clés avec CTR < 1% après 100 imp.\n- Tester une nouvelle variante d'annonce par mois`,
    tags: ['Google Ads', 'SEA', 'campagnes', 'acquisition'],
    service: 'marketing',
    status: 'PUBLISHED',
  },
  {
    title: 'Process de validation des visuels',
    summary: 'Circuit de validation des créations graphiques avant toute publication externe.',
    content: `## Qui valide quoi\n\n| Contenu | Validateur | Délai max |\n|---|---|---|\n| Post réseaux sociaux | Content Lead | 24h |\n| Campagne Ads | Marketing Manager | 48h |\n| Refonte identité | CEO | 1 semaine |\n| Template email | Marketing Manager | 24h |\n\n## Processus standard\n\n1. Créatif dépose le fichier dans Figma (lien dans #content-review)\n2. Ajoute un commentaire Figma avec le contexte et la date de publication souhaitée\n3. Le validateur laisse ses retours directement en commentaire Figma\n4. Créatif corrige et ping le validateur\n5. Approbation par emoji ✅ dans le commentaire\n\n## Ce qu'on vérifie toujours\n\n- Conformité charte graphique (couleurs, typos, logo)\n- Pas d'erreur factuelle\n- Ton cohérent avec la marque\n- Accessibilité (contraste suffisant)`,
    tags: ['validation', 'visuels', 'processus', 'Figma'],
    service: 'marketing',
    status: 'PUBLISHED',
  },
  {
    title: 'Analyse des performances marketing mensuelle',
    summary: 'Indicateurs à suivre, sources de données et format du rapport marketing mensuel.',
    content: `## KPIs par canal\n\n### SEO\n- Sessions organiques (Google Analytics)\n- Positions top 10 (Semrush)\n- Pages indexées nouvelles\n\n### Social Media\n- Followers nets (Instagram + LinkedIn)\n- Taux d'engagement moyen\n- Reach total\n\n### Email\n- Taux d'ouverture (objectif > 28%)\n- Taux de clic (objectif > 4%)\n- Désabonnements\n\n### Ads\n- CPC moyen\n- ROAS (objectif > 3)\n- Leads générés\n\n## Format du rapport\n\nNotion "Marketing Monthly" — rempli avant le 5 du mois suivant.\nPrésentation au CODIR : dernier vendredi du mois.`,
    tags: ['analytics', 'performance', 'mensuel', 'reporting'],
    service: 'marketing',
    status: 'PUBLISHED',
  },
  {
    title: 'Politique d\'influence et de partenariats médias',
    summary: 'Cadre et règles pour les collaborations avec des influenceurs et partenaires médias.',
    content: `## Critères de sélection des influenceurs\n\n- Minimum 5 000 abonnés engagés (taux engagement > 3%)\n- Thématique bien-être, santé naturelle ou développement personnel\n- Audience française, 25-55 ans\n- Pas de partenariat concurrent actif\n\n## Types de collaboration\n\n| Type | Contrepartie | Durée |\n|---|---|---|\n| Mention story | 1 mois offert | 1 fois |\n| Post dédié | 150-500€ | Ponctuel |\n| Ambassadeur long terme | 300€/mois + accès premium | 6-12 mois |\n\n## Process\n\n1. Prospection → liste de candidats sur Notion "Influenceurs"\n2. Vérification des métriques (HypeAuditor)\n3. Premier contact via DM ou email\n4. Brief créatif envoyé\n5. Validation du contenu avant publication\n6. Rapport de performance J+7 post-publication`,
    tags: ['influence', 'partenariat', 'médias', 'collaboration'],
    service: 'marketing',
    status: 'PUBLISHED',
  },
  {
    title: 'Guide Figma pour les non-designers',
    summary: 'Comment utiliser Figma pour créer des visuels simples sans formation design.',
    content: `## Accès\n\nFigma → organisation "Liberlo" → projet "Templates Marketing"\nDemander l'accès à Camille (Marketing).\n\n## Templates disponibles\n\n- Posts Instagram (format carré 1080×1080)\n- Stories (format 1080×1920)\n- Bannières LinkedIn (1200×628)\n- Templates email (600px wide)\n\n## Comment utiliser un template\n\n1. Ouvrir le fichier "Templates Marketing"\n2. Clic droit sur le frame voulu → "Duplicate"\n3. Modifier le texte en double-cliquant\n4. Remplacer les images via "Place image" (⌘⇧K)\n5. Ne jamais modifier les couches verrouillées (charte)\n6. Exporter : sélectionner le frame → ⌘⇧E → PNG 2×\n\n## Ce qu'on ne fait pas\n\n- Modifier les composants originaux (utiliser les copies)\n- Changer les polices ou couleurs hors palette\n- Créer de nouveaux styles sans accord du designer`,
    tags: ['Figma', 'templates', 'design', 'non-designer'],
    service: 'marketing',
    status: 'PUBLISHED',
  },

  // ── RH ──────────────────────────────────────────────────────────────────────
  {
    title: 'Guide d\'accueil du nouvel arrivant',
    summary: 'Checklist complète pour intégrer un nouveau collaborateur chez Liberlo.',
    content: `## Avant l'arrivée (J-5)\n\n- [ ] Email de bienvenue avec planning J1\n- [ ] Création du compte Google Workspace\n- [ ] Commande du matériel (MacBook Pro M3)\n- [ ] Ajout au Slack, Notion, GitHub\n\n## Jour J\n\n- 9h00 — Accueil, tour des locaux\n- 9h30 — Remise du matériel et configuration (IT)\n- 10h30 — Petit-déjeuner d'équipe\n- 14h00 — Onboarding métier avec le manager\n\n## Première semaine\n\n- 1:1 avec chaque membre de l'équipe\n- Lecture de la documentation interne\n- Point d'étonnement J+5 avec le manager`,
    tags: ['onboarding', 'arrivée', 'checklist', 'accueil'],
    service: 'rh',
    status: 'PUBLISHED',
  },
  {
    title: 'Politique de télétravail',
    summary: 'Règles et modalités du télétravail chez Liberlo (accord en vigueur depuis jan. 2025).',
    content: `## Modalités\n\n- Jusqu'à 3 jours de télétravail par semaine\n- Présence obligatoire le mardi et le jeudi\n- Période d'essai : 4j/semaine au bureau pendant 3 mois\n\n## Conditions\n\n- Espace calme + connexion ≥ 50 Mbps\n- Joignable sur Slack pendant les horaires\n- Standup quotidien en visio si télétravail\n\n## Déclaration\n\n- Déclarer sur Payfit en début de semaine\n- Prévenir le manager par Slack avant 9h en cas d'imprévu\n- Non reportable d'une semaine à l'autre`,
    tags: ['télétravail', 'politique RH', 'accord', 'flex'],
    service: 'rh',
    status: 'PUBLISHED',
  },
  {
    title: 'Grille salariale et politique de révision',
    summary: 'Niveaux de rémunération par pôle et processus de révision annuelle des salaires.',
    content: `## Politique salariale\n\nLiberlo pratique la transparence salariale interne : chaque collaborateur connaît sa grille et ses critères de progression.\n\n## Grille indicative (brut annuel, Lyon, 2026)\n\n| Niveau | Profil type | Fourchette |\n|---|---|---|\n| Junior (0-2 ans) | Développeur, CSM, Sales | 32-38K€ |\n| Confirmé (2-5 ans) | Toute fonction | 38-50K€ |\n| Senior (5+ ans) | Expertise reconnue | 50-65K€ |\n| Lead / Manager | Encadrement | 55-75K€ |\n\n## Révision annuelle\n\n- Période : janvier de chaque année\n- Processus : entretien annuel (nov.) → proposition RH (déc.) → effective jan.\n- Budget d'augmentation moyen : 3-5% masse salariale\n- Critères : performance, marché, ancienneté\n\n## Ce qui n'est pas négociable\n\nLes augmentations hors cycle annuel nécessitent une validation CEO.`,
    tags: ['salaire', 'rémunération', 'grille', 'révision'],
    service: 'rh',
    status: 'PUBLISHED',
  },
  {
    title: 'Processus de recrutement — de la fiche de poste à l\'offre',
    summary: 'Toutes les étapes du recrutement chez Liberlo, de la définition du besoin à l\'embauche.',
    content: `## Étapes\n\n1. **Besoin identifié** : manager rédige la fiche de poste (template Notion "Recrutement")\n2. **Validation** : RH valide la fiche, CEO valide si poste nouveau\n3. **Sourcing** : LinkedIn, Welcome to the Jungle, cooptation (prime 1500€)\n4. **Tri des candidatures** : RH + manager, réponse sous 1 semaine\n5. **Entretiens** :\n   - RH (30 min) : fit culturel, motivations, logistique\n   - Manager (45 min) : compétences métier, cas pratique\n   - CEO ou pair (30 min) : si poste senior\n6. **Offre** : envoyée dans les 48h après la décision\n7. **Onboarding** : planning J1 préparé par RH\n\n## Délais cibles\n\n- Time to hire : < 30 jours\n- Réponse aux candidats : < 5 jours ouvrés à chaque étape`,
    tags: ['recrutement', 'hiring', 'processus', 'onboarding'],
    service: 'rh',
    status: 'PUBLISHED',
  },
  {
    title: 'Entretien annuel — guide pour les managers',
    summary: 'Comment préparer et mener l\'entretien annuel d\'évaluation chez Liberlo.',
    content: `## Calendrier\n\n- Entretiens : novembre-décembre\n- Remontée des évaluations : 15 décembre\n- Annonces des révisions : janvier\n\n## Préparation (manager)\n\n1. Relire les objectifs fixés en début d'année (Notion "OKR individuels")\n2. Collecter le feedback de 2-3 pairs (360° informel)\n3. Préparer une proposition d'objectifs pour l'année suivante\n\n## Structure de l'entretien (1h)\n\n**15 min** — Auto-évaluation du collaborateur\n**20 min** — Bilan des objectifs de l'année\n**15 min** — Points forts + axes de progression\n**10 min** — Objectifs année suivante\n\n## Ce qu'on évite\n\n- Parler de salaire pendant l'entretien (c'est séparé)\n- Réserves non communiquées en cours d'année\n- Objectifs SMART non définis`,
    tags: ['entretien annuel', 'évaluation', 'manager', 'objectifs'],
    service: 'rh',
    status: 'PUBLISHED',
  },
  {
    title: 'Congés et absences — règles et déclaration',
    summary: 'Tout ce qu\'il faut savoir sur la gestion des congés, RTT et absences chez Liberlo.',
    content: `## Congés payés\n\n- 25 jours ouvrés/an (acquisition de 2,08 jours/mois)\n- Pose sur Payfit, validation manager sous 48h\n- Délai de prévenance : 2 semaines minimum pour ≤ 5 jours, 1 mois pour > 5 jours\n\n## RTT\n\n- 10 RTT/an pour les cadres (forfait jours)\n- Posables à l'unité ou en bloc\n- Expiration : 31 décembre, non reportables\n\n## Absences exceptionnelles (légales)\n\n| Motif | Durée |\n|---|---|\n| Mariage | 4 jours |\n| Naissance | 3 jours |\n| Décès conjoint | 3 jours |\n| Déménagement | 1 jour |\n\n## Maladie\n\n- Prévenir le manager par Slack le matin même\n- Envoyer l'arrêt de travail à rh@liberlo.com dans les 48h`,
    tags: ['congés', 'RTT', 'absences', 'Payfit'],
    service: 'rh',
    status: 'PUBLISHED',
  },
  {
    title: 'Formation et développement professionnel',
    summary: 'Budget formation, process de demande et catalogue de formations disponibles.',
    content: `## Budget formation\n\n- 1 500€/an/collaborateur (hors CPF)\n- Formations certifiantes : budget exceptionnel sur validation CEO\n- CPF : utiliser en priorité pour les formations longues\n\n## Comment faire une demande\n\n1. Identifier la formation (site, durée, prix)\n2. Compléter le formulaire Notion "Demande de formation"\n3. Validation manager (priorité métier)\n4. Validation RH (budget disponible)\n5. Inscription par RH ou en autonomie selon le cas\n\n## Formations recommandées par pôle\n\n**IT** : AWS certifications, NestJS avancé, Prisma optimization\n**Sales** : SPIN Selling, Salesforce Admin, négociation\n**CSM** : Gainsight, Customer Success Management\n**Marketing** : Google Analytics 4, Meta Blueprint, Semrush Academy\n\n## Après la formation\n\nRédigez un retour d'expérience sur Notion "Learning & Dev" pour partager avec l'équipe.`,
    tags: ['formation', 'CPF', 'développement', 'compétences'],
    service: 'rh',
    status: 'PUBLISHED',
  },
  {
    title: 'Bien-être au travail — initiatives Liberlo',
    summary: 'Avantages, actions et initiatives bien-être proposées aux collaborateurs Liberlo.',
    content: `## Avantages en place\n\n- **Mutuelle** : prise en charge à 80% (Henner) — famille incluse\n- **Tickets restaurant** : 10€/jour (60% employeur), carte Swile\n- **Sport** : remboursement jusqu'à 30€/mois de salle de sport\n- **Transport** : prise en charge 50% abonnement TC ou forfait vélo\n\n## Initiatives régulières\n\n- **Afterwork mensuel** : dernier vendredi du mois\n- **Team building trimestriel** : activité hors bureau (escape game, atelier cuisine…)\n- **Liberlo Day** : journée annuelle de team building + rétrospective + soirée\n- **Mental health** : 3 séances de coaching psychologique remboursées/an (via Moka.care)\n\n## Espace de travail\n\nBureaux à Lyon 2ème (Confluence), open space + 3 salles de réunion + espace détente.\nTélétravail jusqu'à 3j/semaine (voir politique dédiée).`,
    tags: ['bien-être', 'avantages', 'mutuelle', 'sport'],
    service: 'rh',
    status: 'PUBLISHED',
  },
  {
    title: 'Politique de cooptation',
    summary: 'Programme de recommandation interne pour recruter via le réseau des collaborateurs.',
    content: `## Prime de cooptation\n\n- **1 500€** versés au coopteur si le candidat est embauché en CDI et passe la période d'essai (3 mois)\n- Versement en 2 fois : 750€ à l'embauche + 750€ après la période d'essai\n- Cumulable avec d'autres primes\n\n## Comment coopter\n\n1. Identifier un candidat dans votre réseau\n2. En parler à RH avant de l'inviter à postuler\n3. Transmettre le CV avec le formulaire "Cooptation" sur Notion\n4. Le candidat postule via le formulaire standard\n\n## Postes ouverts à la cooptation\n\nConsultez Notion "Recrutement actif" pour la liste des postes à pourvoir.\n\n## Transparence\n\nSi le candidat est coopté, cela est mentionné dans son dossier mais n'influence pas le processus d'évaluation.`,
    tags: ['cooptation', 'recrutement', 'réseau', 'prime'],
    service: 'rh',
    status: 'PUBLISHED',
  },

  // ── Direction ────────────────────────────────────────────────────────────────
  {
    title: 'Objectifs stratégiques 2026 — OKR Q3',
    summary: 'Objectifs et résultats clés de l\'entreprise pour le troisième trimestre 2026.',
    content: `## Objectif 1 — Croissance\n\n**KR1.1** : 2 500 praticiens actifs à fin septembre (+18% vs Q2)\n**KR1.2** : Taux d'activation J+7 ≥ 72%\n\n## Objectif 2 — Expérience utilisateur\n\n**KR2.1** : RDV via app +35% vs Q2\n**KR2.2** : App Store Rating ≥ 4.6\n\n## Objectif 3 — Solidité financière\n\n**KR3.1** : ARR ≥ 780 000€\n**KR3.2** : Churn mensuel ≤ 2,1%\n\n## Objectif 4 — Équipe\n\n**KR4.1** : eNPS interne ≥ 50\n**KR4.2** : 3 recrutements validés\n\n## Suivi\n\nPoint OKR mensuel en CODIR — dernier vendredi du mois, 14h.`,
    tags: ['OKR', 'stratégie', 'objectifs', '2026'],
    service: 'direction',
    status: 'PUBLISHED',
  },
  {
    title: 'Procédure de reporting mensuel',
    summary: 'Format, sources de données et délais pour le rapport mensuel Direction.',
    content: `## Calendrier\n\n| Étape | Responsable | Délai |\n|---|---|---|\n| Export données | IT | J+1 |\n| Consolidation KPIs | Chefs de pôle | J+3 |\n| Rapport synthèse | COO | J+5 |\n| Présentation CODIR | Direction | J+7 |\n\n## Structure du rapport\n\n1. Faits marquants\n2. KPIs clés\n3. OKR update\n4. Focus pôle (rotation mensuelle)\n5. Risques et décisions\n\n## Sources\n\n- Revenus : Stripe Dashboard\n- Utilisateurs : Metabase\n- Marketing : Buffer Analytics + GA4\n- RH : Payfit export`,
    tags: ['reporting', 'CODIR', 'mensuel', 'KPIs'],
    service: 'direction',
    status: 'PUBLISHED',
  },
  {
    title: 'Procédure de prise de décision — cadre DACI',
    summary: 'Framework de gouvernance pour les décisions structurantes chez Liberlo.',
    content: `## Le modèle DACI\n\n| Rôle | Description |\n|---|---|\n| **Driver** | Pilote la décision |\n| **Approver** | A le dernier mot |\n| **Contributor** | Apporte son expertise |\n| **Informed** | Informé de la décision |\n\n## Seuils\n\n| Décision | Approver |\n|---|---|\n| < 5 000€ | Head of pôle |\n| 5-20K€ | COO |\n| > 20K€ | CEO |\n\n## Process\n\n1. Note de décision (template Notion)\n2. Partager 48h avant la réunion\n3. Réunion ≤ 30 min\n4. Logger dans "Décisions 2026"\n\n*"Disagree and commit"*`,
    tags: ['gouvernance', 'décision', 'DACI', 'process'],
    service: 'direction',
    status: 'DRAFT',
  },
  {
    title: 'Gouvernance et organigramme de Liberlo',
    summary: 'Structure organisationnelle, rôles des dirigeants et circuit de décision chez Liberlo.',
    content: `## Équipe dirigeante\n\n| Rôle | Responsabilités |\n|---|---|\n| CEO | Vision, investisseurs, décisions stratégiques |\n| CTO | Produit, technique, architecture |\n| COO | Opérations, finance, RH |\n\n## Structure par pôle\n\n6 pôles opérationnels, chacun avec un Head of :\n- IT (CTO + Head IT)\n- CSM\n- Sales\n- Marketing\n- RH\n- Direction (CEO + COO)\n\n## Instances de gouvernance\n\n- **CODIR** : réunion hebdomadaire (lundi 9h) — CEO, CTO, COO, Heads of\n- **Board** : trimestriel — actionnaires + management\n- **All Hands** : mensuel — tous les collaborateurs\n\n## Prise de décision\n\nVoir procédure DACI pour le cadre de décision.`,
    tags: ['organigramme', 'gouvernance', 'structure', 'organisation'],
    service: 'direction',
    status: 'PUBLISHED',
  },
  {
    title: 'Vision et mission de Liberlo',
    summary: 'Raison d\'être, valeurs fondatrices et ambition à long terme de Liberlo.',
    content: `## Mission\n\n**"Rendre les médecines complémentaires accessibles à tous, partout en France."**\n\nLiberlo connecte ceux qui cherchent un soin naturel avec les praticiens qui peuvent les aider — simplement, rapidement, en toute confiance.\n\n## Vision 2030\n\nDevenir la référence européenne de la mise en relation praticiens-patients en médecines douces, avec 50 000 praticiens actifs dans 5 pays.\n\n## Valeurs\n\n1. **Confiance** : transparence avec les praticiens et les utilisateurs\n2. **Accessibilité** : rendre simple ce qui est complexe\n3. **Bienveillance** : dans nos relations internes et avec nos clients\n4. **Impact** : chaque action doit contribuer à la mission\n\n## Ce qu'on ne fera jamais\n\n- Privilégier la croissance court-terme au détriment de la qualité\n- Compromettre la confiance des praticiens pour des objectifs financiers`,
    tags: ['vision', 'mission', 'valeurs', 'stratégie'],
    service: 'direction',
    status: 'PUBLISHED',
  },
  {
    title: 'Processus budgétaire annuel',
    summary: 'Calendrier et processus d\'élaboration du budget annuel chez Liberlo.',
    content: `## Calendrier budgétaire\n\n| Étape | Période | Responsable |\n|---|---|---|\n| Collecte besoins pôles | Septembre | Chefs de pôle |\n| Consolidation | Octobre | COO |\n| Arbitrages | Novembre | CEO + COO |\n| Validation Board | Décembre | Board |\n| Communication interne | Janvier | COO |\n\n## Principes\n\n- Budget basé sur les OKR de l'année N+1\n- Chaque pôle soumet ses besoins avec une priorité (must-have / nice-to-have)\n- Reserve de 10% du budget total pour les opportunités imprévues\n\n## Suivi en cours d'année\n\n- Revue trimestrielle du budget vs réel\n- Réallocation possible avec validation COO\n- Dépassement > 20% : présentation CODIR obligatoire`,
    tags: ['budget', 'finance', 'processus', 'annuel'],
    service: 'direction',
    status: 'PUBLISHED',
  },
  {
    title: 'Politique RSE de Liberlo',
    summary: 'Engagements responsabilité sociale et environnementale de l\'entreprise.',
    content: `## Axes RSE\n\n### Environnement\n- Hébergement cloud chez des fournisseurs à énergie verte (Railway Green, Vercel)\n- Politique de sobriété numérique : optimisation des requêtes BDD, compression assets\n- Préférence aux fournisseurs labellisés pour les achats (papier, café, matériel)\n\n### Social\n- Parité salariale : revue annuelle des écarts H/F\n- Inclusion : 1 stagiaire issu de formation alternative par semestre\n- Bien-être : initiatives santé mentale (voir politique bien-être)\n\n### Gouvernance\n- Transparence salariale interne\n- Protection des données : conformité RGPD documentée\n- Éthique IA : usage de l'IA documenté et auditable\n\n## Objectif 2026\n\nObtenir le label "Numérique Responsable" (NR) d'ici fin 2026.`,
    tags: ['RSE', 'environnement', 'social', 'responsabilité'],
    service: 'direction',
    status: 'PUBLISHED',
  },
  {
    title: 'Gestion de crise — protocole de communication',
    summary: 'Comment gérer et communiquer en situation de crise (incident grave, bad buzz, incident de sécurité).',
    content: `## Déclenchement du protocole de crise\n\n- Incident technique majeur (downtime > 2h)\n- Bad buzz sur les réseaux sociaux (> 100 mentions négatives en 2h)\n- Incident de sécurité (fuite de données)\n- Crise RH (départ massif, conflit public)\n\n## Cellule de crise\n\n**Composition** : CEO + CTO + COO + Head of pôle concerné\n**Activation** : par le CEO ou le CTO sur Slack #crisis\n\n## Communication externe\n\n1. Ne pas communiquer en réaction à chaud (attendre 30 min minimum)\n2. Désigner UN porte-parole (CEO par défaut)\n3. Premier message : reconnaître le problème, ne pas nier\n4. Mises à jour régulières (toutes les 2h)\n5. Communication de résolution avec les actions prises\n\n## Communication interne\n\n- Message All Hands dans les 2h\n- Pas de fuites vers la presse\n- Briefing de toute l'équipe avant toute communication externe`,
    tags: ['crise', 'communication', 'protocole', 'incident'],
    service: 'direction',
    status: 'PUBLISHED',
  },
  {
    title: 'Due diligence — checklist pour les investisseurs',
    summary: 'Documents et informations à préparer dans le cadre d\'une due diligence investisseur.',
    content: `## Documents juridiques\n\n- Statuts de la société (à jour)\n- K-bis < 3 mois\n- Tableau de capitalisation (cap table)\n- Pacte d'actionnaires\n- PV des dernières AG et CA\n\n## Documents financiers\n\n- 3 derniers bilans comptables\n- Comptes de résultat prévisionnels 3 ans\n- MRR/ARR en temps réel (export Stripe)\n- Burn rate et runway\n\n## Documents RH\n\n- Organigramme + fiches de poste clés\n- Contrats des dirigeants\n- Politique de stock-options / BSPCE\n\n## Documents techniques\n\n- Architecture technique simplifiée\n- Politique de sécurité et RGPD\n- Rapport de pentest (si disponible)\n\n## Accès\n\nVirtual data room : Notion "Due Diligence" — accès sur demande CEO uniquement.`,
    tags: ['due diligence', 'investisseurs', 'juridique', 'finance'],
    service: 'direction',
    status: 'PUBLISHED',
  },
  {
    title: 'Politique de confidentialité et gestion des données internes',
    summary: 'Règles de confidentialité s\'appliquant aux collaborateurs de Liberlo sur les données internes.',
    content: `## Données confidentielles\n\nSont considérées comme confidentielles :\n- Données financières (CA, ARR, burn rate)\n- Données utilisateurs et praticiens\n- Code source propriétaire\n- Contrats et conditions commerciales\n- Informations sur les futurs recrutements\n- Projets produit non annoncés\n\n## Règles de partage\n\n- **Interne** : partage libre entre collaborateurs via les canaux sécurisés (Slack, Notion)\n- **Externe** : accord écrit du CEO requis (sauf communication officielle)\n- **Partenaires** : NDA signé avant tout partage\n\n## Équipements\n\n- Ne pas laisser son écran déverrouillé sans surveillance\n- MacBook chiffré (FileVault activé) — vérifié par IT à l'arrivée\n- VPN obligatoire pour l'accès aux données de production\n\n## Violation\n\nToute violation est traitée selon la procédure disciplinaire RH et peut entraîner des poursuites.`,
    tags: ['confidentialité', 'données', 'NDA', 'sécurité'],
    service: 'direction',
    status: 'PUBLISHED',
  },

  // ── Processus transverses ────────────────────────────────────────────────────

  {
    title: 'Processus d\'escalade technique CSM → IT',
    summary: 'Comment le CSM remonte un bug ou une anomalie technique à l\'équipe IT, et comment IT traite la demande.',
    content: `## Contexte\n\nLorsqu'un praticien remonte un bug ou un dysfonctionnement au CSM, celui-ci doit savoir quand et comment escalader vers l'équipe IT. Ce processus CSM-IT définit la frontière entre un ticket L1 (traité par CSM) et un ticket L2 (escaladé à IT).\n\n## Critères d'escalade CSM vers IT\n\n- Bug reproductible côté backoffice (erreur 500, données manquantes)\n- Problème de compte praticien non résolvable via le panel admin CSM\n- Anomalie d'affichage impactant plusieurs praticiens simultanément\n- Paiement bloqué ou virement non déclenché malgré les paramètres corrects\n\n## Procédure d'escalade\n\n1. **CSM** : Collecter les informations (email praticien, ID compte, steps to reproduce, screenshot)\n2. **CSM** : Créer un ticket dans Linear → équipe IT → label "Escalade CSM"\n3. **CSM** : Notifier @marc (IT) sur Slack #csm-it-escalades avec le lien du ticket\n4. **IT** : Accuser réception dans les 2h ouvrées\n5. **IT** : Investiguer et donner un premier statut sous 4h (P1) ou 24h (P2)\n6. **IT** : Notifier CSM dès la résolution avec la cause et l'action corrective\n7. **CSM** : Informer le praticien de la résolution\n\n## SLA IT pour les tickets escaladés par CSM\n\n| Sévérité | Délai de prise en charge | Délai de résolution |\n|---|---|---|\n| P1 (bloquant praticien) | 1h | 4h |\n| P2 (dégradé) | 4h | 24h |\n| P3 (cosmétique) | 24h | 72h |\n\n## Canal de communication IT-CSM\n\nSlack #csm-it-escalades — tous les bugs remontés via CSM doivent transiter par ce canal. Ne pas DM directement les membres de l'équipe IT sans avoir d'abord créé un ticket Linear.`,
    tags: ['escalade', 'CSM', 'IT', 'bug', 'ticket', 'process', 'transversal'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Checklist IT onboarding et offboarding des collaborateurs',
    summary: 'Actions IT à réaliser systématiquement lors de l\'arrivée ou du départ d\'un collaborateur, en coordination avec RH.',
    content: `## Contexte\n\nL'équipe IT travaille en étroite coordination avec RH pour provisionner ou déprovisioner les accès de chaque collaborateur. Ce processus transversal IT-RH garantit qu'aucun accès ne reste actif après un départ et qu'un nouvel arrivant dispose de tout le nécessaire dès le jour J.\n\n## ONBOARDING — Actions IT (déclenchées par RH)\n\nRH notifie IT via le formulaire Notion "Nouveau collaborateur" au minimum **5 jours avant l'arrivée**.\n\n### J-5 — Provisioning\n- [ ] Créer le compte Google Workspace (format prenom.nom@liberlo.com)\n- [ ] Créer le compte Slack + ajouter aux channels du service\n- [ ] Créer le compte GitHub + inviter dans l'organisation Liberlo\n- [ ] Créer le compte Notion + partager l'espace du service concerné\n- [ ] Créer le compte 1Password + ajouter au groupe du service\n- [ ] Créer le compte Sentry (si profil technique)\n- [ ] Commander et configurer le MacBook Pro M3\n\n### Jour J — Configuration poste\n- [ ] FileVault activé (chiffrement disque)\n- [ ] VPN WireGuard configuré\n- [ ] SSO Google activé pour tous les outils SaaS\n- [ ] Remise du matériel + session de configuration (1h avec l'arrivant)\n\n## OFFBOARDING — Actions IT (déclenchées par RH)\n\nRH notifie IT le jour de la notification du départ (ou immédiatement si rupture conflictuelle).\n\n### Délai : immédiat à la notification RH\n- [ ] Désactiver le compte Google Workspace (suspension, pas suppression)\n- [ ] Révoquer l'accès GitHub + retirer de l'organisation\n- [ ] Désactiver le compte Slack\n- [ ] Révoquer les tokens API actifs (vérifier dans le dashboard)\n- [ ] Supprimer les clés SSH de tous les serveurs\n- [ ] Révoquer les accès VPN\n- [ ] Récupérer le MacBook + effacer à distance si non récupéré\n\n### Dans les 30 jours suivant le départ\n- [ ] Archiver les données Notion, Google Drive, emails\n- [ ] Supprimer les comptes SaaS ou transférer la licence\n- [ ] Rapport IT à RH confirmant la désactivation complète\n\n## Communication IT-RH\n\nChannel Slack : #rh-it-provisioning\nTout provisioning et déprovisioning doit être loggé dans Notion "Gestion accès collaborateurs".`,
    tags: ['onboarding', 'offboarding', 'IT', 'RH', 'accès', 'provisioning', 'transversal'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Gestion des accès outils Marketing par IT',
    summary: 'Procédure de provisioning et gestion des accès aux outils Marketing (Buffer, GA4, Meta, Semrush) par l\'équipe IT.',
    content: `## Outils Marketing gérés par IT\n\nL'équipe Marketing utilise plusieurs outils SaaS dont les accès sont provisionnés et révoqués par IT, en coordination avec le responsable Marketing.\n\n## Liste des outils et accès\n\n| Outil | Type d'accès | Gestionnaire IT | Responsable Marketing |\n|---|---|---|---|\n| Google Analytics 4 | Compte Google Workspace | alex.petit@liberlo.com | camille.moreau@liberlo.com |\n| Google Search Console | Compte Google Workspace | alex.petit@liberlo.com | camille.moreau@liberlo.com |\n| Buffer | Invitation email | alex.petit@liberlo.com | camille.moreau@liberlo.com |\n| Meta Business Suite | Accès page Facebook/Instagram | alex.petit@liberlo.com | camille.moreau@liberlo.com |\n| Semrush | Licence nominative | alex.petit@liberlo.com | camille.moreau@liberlo.com |\n| Figma | Compte org Liberlo | alex.petit@liberlo.com | camille.moreau@liberlo.com |\n\n## Procédure de demande d'accès\n\n1. **Marketing** : compléter le formulaire Notion "Demande d'accès outil"\n2. **IT** : valider et provisionner sous 24h ouvrées\n3. **IT** : notifier Marketing via Slack #it-marketing-accès\n4. **Marketing** : confirmer la réception des accès\n\n## Procédure de révocation\n\nEn cas de départ d'un collaborateur Marketing, IT est notifié par RH et révoque les accès dans les 2h (cf. procédure offboarding IT-RH).\n\n## Licences et coûts\n\nLe responsable IT trackait les licences SaaS dans Notion "Licences SaaS". Renouvellements validés conjointement par Marketing (besoin) et IT (technique) avant validation COO (budget).`,
    tags: ['accès', 'IT', 'Marketing', 'Buffer', 'GA4', 'Semrush', 'SaaS', 'transversal'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Gestion des accès Salesforce par IT',
    summary: 'Comment IT gère les accès Salesforce pour le pôle Sales, et comment Sales demande des modifications de configuration CRM.',
    content: `## Salesforce chez Liberlo — rôles IT et Sales\n\nSalesforce est le CRM utilisé par Sales. L'administration technique de Salesforce (configuration, permissions, intégrations) est assurée par IT, tandis que l'usage quotidien (saisie, pipeline, reporting) relève de Sales.\n\n## Responsabilités IT sur Salesforce\n\n- Provisioning et révocation des licences utilisateurs\n- Configuration des profils et permission sets\n- Maintenance des intégrations (Salesforce ↔ API Liberlo, Salesforce ↔ Slack)\n- Déploiement des flows et automations\n- Exports de données et sauvegardes\n\n## Responsabilités Sales sur Salesforce\n\n- Saisie et mise à jour des opportunités et contacts\n- Gestion du pipeline commercial\n- Création et suivi des rapports métier\n- Définition des besoins fonctionnels\n\n## Comment Sales fait une demande à IT\n\n1. Remplir le formulaire Notion "Demande Salesforce"\n2. Préciser : type de demande (accès / bug / nouvelle feature), priorité, impact\n3. IT accuse réception sous 24h\n4. Délai de traitement : 2-5 jours selon complexité\n\n## Process IT-Sales pour les intégrations CRM-API\n\nToute nouvelle intégration entre Salesforce et l'API Liberlo nécessite :\n1. Un brief fonctionnel Sales (ce qu'on veut automatiser)\n2. Un brief technique IT (faisabilité, endpoints concernés)\n3. Une validation COO si coût > 5 jours de développement\n4. Une recette Sales avant mise en production\n\n## Canal de communication\n\nSlack #it-sales-salesforce pour toutes les demandes et incidents Salesforce.`,
    tags: ['Salesforce', 'CRM', 'IT', 'Sales', 'accès', 'intégration', 'transversal'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Support Intercom — configuration IT et utilisation CSM',
    summary: 'Rôles respectifs de IT et CSM sur Intercom : qui configure quoi, et comment signaler une anomalie.',
    content: `## Intercom chez Liberlo\n\nIntercom est l'outil de messaging et support client utilisé par le CSM. La configuration technique (intégration avec l'API Liberlo, widgets, webhooks) est gérée par IT. L'utilisation quotidienne (réponses aux praticiens, séquences d'emails, tags) est gérée par CSM.\n\n## Ce que IT gère sur Intercom\n\n- Installation et mise à jour du widget Intercom sur l'application Liberlo\n- Intégration webhook Intercom → Slack #support-alerts\n- Synchronisation des données praticiens (ID, email, plan, date d'inscription) via l'API\n- Configuration des attributs personnalisés (churn score, NPS, nombre de RDV)\n- Gestion des accès (invitations, suppression de comptes)\n- Résolution des bugs d'intégration\n\n## Ce que CSM gère sur Intercom\n\n- Réponses aux conversations praticiens\n- Création et gestion des séquences d'onboarding\n- Tags et segmentation\n- Rapports de volume de tickets et temps de réponse\n- Configuration des réponses automatiques (horaires, bot)\n\n## Comment CSM signale un bug Intercom à IT\n\n1. Observer le comportement anormal (ex : données praticien non synchronisées)\n2. Créer un ticket Linear → IT → label "Intercom Bug"\n3. Notifier IT sur Slack #csm-it-escalades\n4. IT investigate sous 4h en priorité P2\n\n## Accès Intercom\n\nIT provisione les accès Intercom sur demande du responsable CSM via Notion "Demande d'accès outil". Tous les membres CSM ont un accès "Team Inbox". Les accès "Admin" sont réservés à IT et au responsable CSM.`,
    tags: ['Intercom', 'IT', 'CSM', 'support', 'intégration', 'configuration', 'transversal'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Handoff Sales → CSM à la conversion praticien',
    summary: 'Processus de transfert d\'un praticien de l\'équipe Sales vers l\'équipe CSM lors de la signature d\'un abonnement.',
    content: `## Contexte\n\nLorsqu'un praticien signe son abonnement Liberlo, il passe de la responsabilité de Sales (acquisition) à la responsabilité de CSM (activation et fidélisation). Ce handoff Sales-CSM est critique : un mauvais transfert se traduit par un délai d'activation plus long et un risque de churn précoce plus élevé.\n\n## Déclencheur du handoff\n\nLe handoff est déclenché dès que l'abonnement est validé dans Salesforce (statut "Gagné") et que le premier paiement est confirmé dans Stripe.\n\n## Informations transmises par Sales à CSM\n\nSales complète la fiche de handoff dans HubSpot (onglet "Transfert CSM") avec :\n\n- **Contexte du praticien** : spécialité, localisation, motivations exprimées lors de la démo\n- **Objections surmontées** : ce qui a failli bloquer la vente (utile pour le CSM)\n- **Engagements pris** : si un commercial a promis un accompagnement particulier, le noter\n- **Offre souscrite** : Starter / Pro / Premium\n- **Sensibilités identifiées** : praticien pressé ? tech-phobe ? très exigeant ?\n- **Contact préféré** : email uniquement ? Téléphone ?\n\n## Délai du handoff\n\n- **Offre Premium** : handoff sous 4h (le CSM dédié est notifié immédiatement)\n- **Offre Pro / Starter** : handoff sous 24h ouvrées\n\n## Process côté CSM après réception du handoff\n\n1. CSM lit la fiche de handoff dans HubSpot\n2. CSM planifie l'appel d'onboarding dans les 48h\n3. CSM envoie l'email de bienvenue personnalisé (en mentionnant le commercial qui l'a accompagné)\n4. CSM met à jour le statut HubSpot : "En cours d'onboarding"\n\n## Ce qu'on ne fait pas\n\n- Ne jamais laisser un praticien sans contact CSM dans les 48h suivant la signature\n- Sales ne continue pas à contacter le praticien après le handoff (sauf demande explicite)\n- Le CSM ne contacte pas le praticien avant d'avoir lu la fiche de handoff Sales`,
    tags: ['handoff', 'Sales', 'CSM', 'conversion', 'onboarding', 'process', 'transversal'],
    service: 'csm',
    status: 'PUBLISHED',
  },
  {
    title: 'Processus de qualification Marketing → Sales (MQL → SQL)',
    summary: 'Comment un lead Marketing devient une opportunité Sales : critères de qualification, processus de transfert et suivi.',
    content: `## Contexte\n\nLe Marketing génère des leads (MQL — Marketing Qualified Leads) via les campagnes inbound, le SEO et les événements. Ces leads sont transférés à Sales lorsqu'ils atteignent le seuil de qualification défini conjointement par Marketing et Sales. Ce processus transversal Marketing-Sales est clé pour éviter la perte de prospects qualifiés.\n\n## Définitions\n\n- **MQL (Marketing Qualified Lead)** : praticien qui a montré un intérêt (téléchargé un guide, demandé une démo, visité la page tarifs ≥ 3 fois)\n- **SQL (Sales Qualified Lead)** : MQL que Sales a validé comme ayant un besoin réel et un potentiel de conversion (BANT validé)\n\n## Critères de passage MQL → SQL\n\n| Critère | Valeur seuil |\n|---|---|\n| Score de lead (HubSpot) | ≥ 50 points |\n| Visite page tarifs | ≥ 2 fois |\n| Formulaire démo complété | Oui |\n| Email valide + téléphone | Oui |\n\n## Process de transfert Marketing → Sales\n\n1. **Marketing** : Le lead atteint le score seuil → HubSpot le class automatiquement "MQL"\n2. **Marketing** : Notification Slack vers #marketing-sales-leads avec le profil du lead\n3. **Sales** : Prise en charge sous 1h ouvrée (les leads chauds se refroidissent vite)\n4. **Sales** : Appel de qualification (10 min) → si BANT ≥ 3/4, passage en "SQL" dans Salesforce\n5. **Sales** : Si non qualifié, remontée à Marketing avec le motif (pour optimiser le scoring)\n\n## Feedback Sales → Marketing\n\nSales alimente Marketing chaque semaine avec :\n- Taux de conversion MQL → SQL\n- Motifs de disqualification les plus fréquents\n- Profils de praticiens les plus réceptifs\n\nCes données permettent à Marketing d'affiner le ciblage des campagnes et le scoring des leads.\n\n## Réunion hebdomadaire Marketing-Sales\n\nChaque lundi 10h, réunion de 30 min #marketing-sales :\n- Review des leads de la semaine précédente\n- Campagnes en cours et leads attendus\n- Ajustements du scoring si nécessaire`,
    tags: ['MQL', 'SQL', 'Marketing', 'Sales', 'qualification', 'lead', 'process', 'transversal'],
    service: 'marketing',
    status: 'PUBLISHED',
  },
  {
    title: 'Campagnes de réactivation praticiens — coordination Marketing-CSM',
    summary: 'Comment Marketing et CSM collaborent pour réactiver les praticiens inactifs via des campagnes ciblées.',
    content: `## Objectif\n\nRéduire le churn en réactivant les praticiens à risque avant qu'ils ne résilient. Cette initiative implique Marketing (campagne email automatisée) et CSM (appel de suivi personnalisé) de manière coordonnée.\n\n## Définition du praticien "à risque de churn"\n\n- Aucune connexion depuis 14 jours ET\n- Aucun RDV reçu lors des 30 derniers jours ET\n- NPS < 7 (si disponible)\n\n## Segmentation établie conjointement Marketing-CSM\n\n| Segment | Critère | Action Marketing | Action CSM |\n|---|---|---|---|\n| Inactif récent | 14-30 jours sans connexion | Email de tips personnalisé | Pas d'appel (surveillance) |\n| Inactif prolongé | 30-60 jours sans connexion | Séquence 3 emails | Appel de relance CSM |\n| Inactif critique | > 60 jours sans connexion | Email de dernière chance | Appel manager CSM |\n\n## Processus\n\n1. **IT** exporte chaque semaine la liste des praticiens inactifs depuis Metabase (données de connexion API)\n2. **Marketing** segmente et charge les audiences dans Intercom\n3. **Marketing** lance les séquences email automatisées\n4. **CSM** reçoit la liste des praticiens "inactifs prolongés" pour les appels manuels\n5. **CSM** log les résultats des appels dans HubSpot\n6. **Marketing** mesure les taux d'ouverture et de réactivation (retour dans l'app ≤ 7 jours)\n\n## Résultats attendus\n\nObjectif Q3 2026 : réactiver 15% des praticiens "inactifs prolongés" via les campagnes combinées Marketing-CSM.\n\n## Données partagées\n\nMarketing partage chaque semaine avec CSM :\n- Praticiens ayant ouvert un email de réactivation sans se reconnecter (signal fort pour appel CSM)\n- Praticiens ayant cliqué le CTA "Planifier un appel" (à rappeler en priorité)`,
    tags: ['réactivation', 'Marketing', 'CSM', 'churn', 'campagne', 'email', 'transversal'],
    service: 'marketing',
    status: 'PUBLISHED',
  },
  {
    title: 'Processus de départ d\'un collaborateur — impact multi-services',
    summary: 'Coordination RH-IT-Finance lors du départ d\'un collaborateur : qui fait quoi et dans quel délai.',
    content: `## Contexte\n\nLe départ d'un collaborateur mobilise plusieurs services en parallèle : RH (formalités, solde de tout compte), IT (révocation des accès), Finance (dernier salaire, notes de frais), et le manager direct (passation). Ce processus transversal doit être déclenché dès la notification officielle du départ.\n\n## Déclencheur\n\nDès que la démission est acceptée ou que la rupture est notifiée, le responsable RH ouvre le dossier de départ dans Notion "Offboarding collaborateurs".\n\n## Actions par service\n\n### RH (dans les 24h)\n- Confirmer la date de fin de contrat\n- Notifier IT via #rh-it-provisioning (avec date effective de fin d'accès)\n- Notifier le manager pour organiser la passation\n- Planifier l'entretien de sortie\n\n### IT (dès notification RH — cf. procédure offboarding IT-RH)\n- Désactiver les accès dans les 2h si rupture conflictuelle\n- Désactiver les accès le dernier jour si départ cordial\n- Récupérer le matériel (MacBook, câbles, badge)\n- Archiver les données et transférer les licences\n\n### Manager direct (dans les 7 jours)\n- Organiser les sessions de passation (réunions, documentation)\n- Identifier le knowledge critique à documenter\n- Répartir les dossiers en cours entre les membres de l'équipe\n- Mettre à jour Notion avec les procédures que le partant gérait\n\n### Finance (dernier jour du mois)\n- Calculer le solde de tout compte (congés non pris, prorata)\n- Vérifier les notes de frais en attente\n- Transmettre au comptable externe\n\n## Entretien de sortie (RH)\n\nRH conduit un entretien de sortie structuré de 30-45 min pour :\n- Comprendre les raisons du départ\n- Identifier les axes d'amélioration pour retenir les futurs talents\n- S'assurer que le partant n'a pas de grief non adressé\n\nLes retours anonymisés sont partagés trimestriellement avec la Direction.`,
    tags: ['départ', 'offboarding', 'RH', 'IT', 'passation', 'process', 'transversal'],
    service: 'rh',
    status: 'PUBLISHED',
  },
  {
    title: 'Communication interne — rôle RH et coordination avec la Direction',
    summary: 'Comment les annonces importantes sont préparées par RH et validées par la Direction avant diffusion à l\'ensemble des collaborateurs.',
    content: `## Types de communications internes\n\n| Type | Exemples | Responsable | Valideur |\n|---|---|---|---|\n| All Hands mensuel | KPIs, projets, annonces | COO | CEO |\n| Annonce recrutement | Nouveau poste ouvert | RH | Manager concerné |\n| Annonce arrivée | Bienvenue nouveau collaborateur | RH | Manager direct |\n| Annonce départ | Départ d'un collaborateur | RH | Manager direct |\n| Changement politique | Nouveau règlement, avantage | RH | COO |\n| Urgence (incident) | Incident grave, crise RH | CEO | — |\n\n## Process de préparation d'une annonce importante\n\n1. **RH** rédige le message dans Notion "Communication interne"\n2. **RH** le partage avec la Direction (CEO ou COO selon le sujet) pour validation\n3. **Direction** valide ou demande des ajustements (délai < 24h)\n4. **RH** publie dans Slack #général au moment convenu\n5. **RH** archive le message dans Notion avec la date et le nombre de destinataires\n\n## All Hands mensuel (Direction)\n\nOrganisé par la Direction avec le support RH :\n- Prépare l'ordre du jour (envoyé 48h avant)\n- Collecte les questions anonymes des collaborateurs\n- Assure la prise de notes et le compte-rendu (partagé dans #général dans les 48h)\n\n## Règles de communication interne\n\n- Toujours annoncer les départs avant qu'ils ne circulent de manière informelle\n- Les mauvaises nouvelles se communiquent de manière proactive, pas réactive\n- Ne jamais annoncer un départ le vendredi après-midi\n- Toujours laisser la possibilité aux collaborateurs de poser des questions`,
    tags: ['communication', 'RH', 'Direction', 'annonces', 'All Hands', 'transversal'],
    service: 'rh',
    status: 'PUBLISHED',
  },
  {
    title: 'OKR inter-pôles — alignement et suivi trimestriel',
    summary: 'Comment les OKR de la Direction se déclinent dans chaque service et comment la Direction suit l\'avancement.',
    content: `## Principe de cascade des OKR\n\nLes OKR de Liberlo sont définis en cascade :\n1. **Direction** : OKR d'entreprise (trimestriels)\n2. **Chefs de pôle** : OKR de service (dérivés des OKR Direction)\n3. **Collaborateurs** : Objectifs individuels (dérivés des OKR de service)\n\nChaque service (IT, CSM, Sales, Marketing, RH, Direction) contribue aux OKR d'entreprise via ses propres indicateurs.\n\n## Contribution de chaque pôle aux OKR d'entreprise\n\n### Sales\n- KR : Praticiens actifs et ARR (contribution directe aux OKR croissance)\n\n### CSM\n- KR : Taux de churn, NPS, taux d'activation (contribution aux OKR rétention)\n\n### Marketing\n- KR : Leads générés, coût d'acquisition (contribution aux OKR croissance)\n\n### IT\n- KR : Disponibilité API (uptime), temps de résolution incidents (contribution aux OKR expérience)\n\n### RH\n- KR : eNPS interne, recrutements validés (contribution aux OKR équipe)\n\n## Calendrier OKR\n\n| Étape | Période | Participants |\n|---|---|---|\n| Définition OKR trimestriels | Dernier mois du trimestre précédent | Direction + Chefs de pôle |\n| Cascade vers les services | Semaine 1 du trimestre | Chefs de pôle + Collaborateurs |\n| Point mensuel | Dernier vendredi du mois | Direction + Chefs de pôle |\n| Bilan final | Dernière semaine du trimestre | Direction + Chefs de pôle |\n\n## Comment la Direction suit l'avancement\n\n- Tableau de bord OKR sur Notion "OKR 2026"\n- Chaque chef de pôle met à jour ses KR chaque semaine (statut + chiffre)\n- Escalade automatique en CODIR si un KR passe "en danger" (≤ 50% de l'objectif à mi-trimestre)`,
    tags: ['OKR', 'Direction', 'IT', 'CSM', 'Sales', 'Marketing', 'RH', 'transversal', 'stratégie'],
    service: 'direction',
    status: 'PUBLISHED',
  },
  {
    title: 'Reporting KPIs techniques pour le CODIR — IT vers Direction',
    summary: 'Quels indicateurs IT sont remontés à la Direction chaque mois, et comment les lire.',
    content: `## Contexte\n\nL'équipe IT produit chaque mois un rapport de performance technique partagé avec la Direction lors du CODIR. Ce rapport IT-Direction permet d'identifier les dépendances entre la santé technique de la plateforme et les résultats business.\n\n## KPIs IT remontés à la Direction\n\n| Indicateur | Description | Objectif | Source |\n|---|---|---|---|\n| Uptime API | Disponibilité de l'API Liberlo | ≥ 99,5% | Datadog |\n| P99 latence | Temps de réponse 99e percentile | < 500ms | Datadog |\n| Incidents P0/P1 | Nombre d'incidents critiques | 0 P0, < 2 P1 | Sentry / Linear |\n| MTTR | Temps moyen de résolution incidents | < 4h | Linear |\n| Vitesse de développement | Tickets closés / sprint | Tendance haussière | Linear |\n| Dette technique | Tickets "tech debt" ouverts | < 20 | Linear |\n| Couverture de tests | % de code couvert par des tests | ≥ 70% | CI/CD |\n\n## Lien avec les KPIs business\n\nLa Direction relie les indicateurs IT aux indicateurs business lors du CODIR :\n- Un uptime < 99% → impact sur le NPS CSM et le taux d'activation\n- Une latence API élevée → impact sur les conversions Sales (démo trop lente)\n- Un incident P0 → impact sur le churn CSM et la réputation Marketing\n\n## Format du rapport IT mensuel\n\nNotion "Rapport IT mensuel" — préparé par le responsable IT, partagé avec Direction avant le J+3 du mois suivant.\n\n## Escalade technique urgente vers Direction\n\nSi IT détecte un risque technique majeur (sécurité, scalabilité critique, incident de données) avant le prochain CODIR, le CTO est notifié immédiatement pour décision urgente.`,
    tags: ['KPIs', 'reporting', 'IT', 'Direction', 'CODIR', 'uptime', 'transversal'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Processus d\'accueil IT pour les nouveaux collaborateurs non-techniques',
    summary: 'Configuration du poste de travail et formation aux outils pour les nouvelles recrues des pôles CSM, Sales, Marketing et RH.',
    content: `## Contexte\n\nLors de l'arrivée d'un collaborateur dans les pôles CSM, Sales, Marketing ou RH, l'équipe IT assure la configuration technique du poste et une formation rapide aux outils. Ce processus IT-RH garantit que le nouvel arrivant est opérationnel dès le premier jour.\n\n## Jour J — Session IT (1h)\n\nUn membre de l'équipe IT accueille le nouveau collaborateur pour :\n\n### Configuration matérielle (20 min)\n- Remise du MacBook Pro M3 configuré\n- Configuration compte Google Workspace\n- Activation 1Password et ajout au groupe du service\n- Configuration VPN (si accès aux données sensibles requis)\n\n### Présentation des outils par service (30 min)\n\n**Nouveau CSM :** HubSpot (CRM), Intercom (support), Metabase (KPIs), Slack #csm\n**Nouveau Sales :** Salesforce (pipeline), Notion (ressources Sales), Slack #sales\n**Nouveau Marketing :** Buffer (social), GA4 (analytics), Figma (design), Slack #marketing\n**Nouveau RH :** Payfit (paie/congés), Notion (docs RH), Slack #rh\n\n### Consignes de sécurité (10 min)\n- Règle du mot de passe fort + 1Password\n- Ne jamais partager ses accès\n- Signaler tout comportement suspect à IT via Slack #security-alerts\n- Verrouiller son écran (⌘+L) avant de s'éloigner du poste\n\n## Accès provisionnés par pôle\n\n| Pôle | Outils standards |\n|---|---|\n| CSM | Google Workspace, Slack, Notion, HubSpot, Intercom, Metabase |\n| Sales | Google Workspace, Slack, Notion, Salesforce, LinkedIn Sales Nav |\n| Marketing | Google Workspace, Slack, Notion, Buffer, GA4, Figma, Semrush |\n| RH | Google Workspace, Slack, Notion, Payfit, Welcome to the Jungle |\n\n## Point de suivi J+7\n\nIT envoie un message Slack au nouveau collaborateur à J+7 pour s'assurer qu'il n'a pas de problème d'accès ou de configuration.`,
    tags: ['onboarding', 'IT', 'CSM', 'Sales', 'Marketing', 'RH', 'accueil', 'outils', 'transversal'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Signalement d\'un incident de sécurité — procédure tous services',
    summary: 'Comment tout collaborateur (IT, CSM, Sales, Marketing, RH, Direction) doit signaler un incident de sécurité et quel est le process de traitement.',
    content: `## Qu'est-ce qu'un incident de sécurité ?\n\nTout événement susceptible de compromettre la confidentialité, l'intégrité ou la disponibilité des données de Liberlo :\n- Email de phishing reçu (même si non cliqué)\n- Clé API ou credential exposé (accidentellement commité, partagé par email)\n- Appareil perdu ou volé (MacBook, téléphone avec accès pro)\n- Accès non autorisé suspecté (connexion depuis un pays inhabituel)\n- Fuite de données praticiens ou utilisateurs\n- Logiciel malveillant détecté\n\n## Comment signaler — TOUS LES SERVICES\n\n**Immédiatement** → Slack #security-alerts (disponible 24h/24 pour les incidents critiques)\n\nInformations à fournir :\n1. Description de l'incident (ce que vous avez vu, reçu, ou fait)\n2. Horodatage\n3. Votre nom et service (CSM / Sales / Marketing / RH / Direction / IT)\n4. Les systèmes potentiellement affectés\n5. Si des données praticiens sont potentiellement exposées : mentionner explicitement\n\n## Prise en charge par IT\n\n1. **IT** accuse réception sous 15 min (priorité P0 si données exposées)\n2. **IT** évalue la criticité et déclenche si nécessaire le protocole de crise Direction\n3. **IT** isole la menace (révocation de credentials, blocage d'accès)\n4. **IT** informe les services concernés des actions à prendre\n5. **Direction** est notifiée si l'incident implique des données praticiens ou utilisateurs (obligation RGPD)\n\n## Règle d'or\n\nMieux vaut signaler une fausse alerte que ne pas signaler un vrai incident. Il n'y a aucun jugement pour un signalement de bonne foi, même si ce n'était finalement pas un incident réel.`,
    tags: ['sécurité', 'incident', 'IT', 'CSM', 'Sales', 'Marketing', 'RH', 'Direction', 'transversal', 'RGPD'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Gestion des outils SaaS partagés — gouvernance IT et Finance',
    summary: 'Liste des outils SaaS communs à plusieurs services, leur gestion IT et leur suivi budgétaire par la Direction.',
    content: `## Principe de gouvernance SaaS\n\nLes outils SaaS utilisés par plusieurs services sont centralisés par IT pour éviter les doublons, négocier de meilleures conditions et maintenir la sécurité. Le budget SaaS est suivi par la Direction (COO).\n\n## Outils multi-services et propriétaires\n\n| Outil | Services utilisateurs | Propriétaire IT | Budget annuel |\n|---|---|---|---|\n| Slack | Tous | alex.petit@liberlo.com | 6 000€ |\n| Notion | Tous | alex.petit@liberlo.com | 2 400€ |\n| Google Workspace | Tous | alex.petit@liberlo.com | 4 800€ |\n| 1Password | Tous | alex.petit@liberlo.com | 1 200€ |\n| Metabase | IT, CSM, Sales, Marketing, Direction | alex.petit@liberlo.com | 1 800€ |\n| HubSpot | CSM, Sales, Marketing | alex.petit@liberlo.com | 12 000€ |\n| Salesforce | Sales | alex.petit@liberlo.com | 8 000€ |\n| Intercom | CSM | alex.petit@liberlo.com | 4 800€ |\n| Payfit | RH, Finance | alex.petit@liberlo.com | 2 400€ |\n\n## Process d'ajout d'un nouvel outil SaaS\n\n1. **Service demandeur** : rédiger un brief (besoin, alternatives comparées, prix)\n2. **IT** : évaluation sécurité et technique (RGPD, intégration possible)\n3. **Direction** : validation budgétaire\n4. **IT** : provisioning et intégration SSO si possible\n5. **Service demandeur** : formation de l'équipe\n\n## Renouvellements\n\nIT envoie 60 jours avant chaque renouvellement une synthèse à Direction :\n- Usage réel vs licences payées\n- Satisfaction des utilisateurs (sondage express)\n- Recommandation : renouveler, réduire, ou changer d'outil`,
    tags: ['SaaS', 'IT', 'Direction', 'budget', 'gouvernance', 'outils', 'transversal'],
    service: 'it',
    status: 'PUBLISHED',
  },
  {
    title: 'Collecte et analyse des retours praticiens — Sales, CSM et Marketing',
    summary: 'Comment Sales, CSM et Marketing collaborent pour collecter, partager et exploiter les retours des praticiens.',
    content: `## Contexte\n\nLes retours des praticiens sont une source d'intelligence précieuse pour améliorer le produit et la stratégie commerciale. Trois services collectent ces retours : Sales (lors des démos et ventes perdues), CSM (lors des suivis et tickets) et Marketing (NPS, avis en ligne). Ce processus transversal Sales-CSM-Marketing garantit que l'intelligence remonte jusqu'au Produit et à la Direction.\n\n## Sources de retours par service\n\n### Sales\n- Motifs de "Perdu" dans Salesforce (objections insurmontées)\n- Retours après démonstration ("le concurrent fait mieux parce que...")\n- Spécialités ou besoins non couverts par Liberlo\n\n### CSM\n- NPS et verbatims praticiens\n- Motifs d'escalade et de churn\n- Tickets récurrents (besoin produit non adressé)\n- Demandes de fonctionnalités exprimées lors des appels\n\n### Marketing\n- Avis Google et Trustpilot\n- Commentaires réseaux sociaux\n- Réponses aux enquêtes email\n\n## Process de remontée vers le Produit\n\n1. Chaque service log les retours dans Notion "Voix du praticien"\n2. Réunion mensuelle Sales-CSM-Marketing-Produit (30 min) pour prioriser\n3. Les retours avec ≥ 3 occurrences → ticket "Feature Request" dans Linear (labellisé "Praticien Feedback")\n4. IT/Produit évalue la faisabilité et intègre dans le backlog\n\n## Canal partagé\n\nSlack #praticien-feedback — ouvert à Sales, CSM et Marketing pour partager en temps réel les retours marquants. La Direction peut observer ce canal pour rester en contact avec la réalité terrain.`,
    tags: ['retours', 'praticien', 'Sales', 'CSM', 'Marketing', 'feedback', 'transversal'],
    service: 'csm',
    status: 'PUBLISHED',
  },
  {
    title: 'Plan de continuité d\'activité — coordination Direction et IT',
    summary: 'Comment Liberlo assure la continuité des opérations en cas de crise technique, sanitaire ou organisationnelle.',
    content: `## Objectif\n\nGarantir que les services essentiels de Liberlo (plateforme en ligne, support praticiens, traitement des paiements) restent opérationnels même en cas de crise. Ce PCA est co-défini par Direction et IT et doit être connu de tous les responsables de service.\n\n## Scénarios couverts\n\n| Scénario | Impact | Responsable |\n|---|---|---|\n| Incident technique majeur (API down) | Plateforme inaccessible | IT |\n| Panne fournisseur cloud (Railway/Neon) | Perte de service | IT + Direction |\n| Départ simultané de plusieurs membres IT | Compétences critiques indisponibles | Direction + RH |\n| Crise sanitaire / impossibilité de travailler | Équipe indisponible | Direction + RH |\n| Incident de sécurité (fuite de données) | Obligations légales RGPD | IT + Direction |\n\n## Mesures de continuité IT\n\n- **Redondance** : l'API Liberlo est déployée sur Railway avec failover automatique\n- **Backups** : sauvegarde Neon toutes les heures, restauration < 30 min\n- **Runbooks** : procédures documentées pour les 5 incidents les plus fréquents (Notion "Runbooks IT")\n- **Astreinte IT** : un membre IT joignable 24h/24 via Slack + téléphone (rotation hebdomadaire)\n\n## Mesures de continuité RH\n\n- Documentation des compétences critiques par collaborateur (Notion "Matrice de compétences")\n- Politique de télétravail opérationnelle pour toute l'équipe\n- Formations croisées : chaque compétence critique maîtrisée par au moins 2 personnes\n\n## Communication en situation de crise\n\nLa Direction active le protocole de gestion de crise (cf. article dédié) et coordonne avec IT pour les communications techniques et avec RH pour les communications internes.`,
    tags: ['continuité', 'PCA', 'Direction', 'IT', 'RH', 'crise', 'transversal'],
    service: 'direction',
    status: 'PUBLISHED',
  },
  {
    title: 'Processus de facturation et remboursement — coordination CSM et Finance',
    summary: 'Comment CSM traite les demandes de facturation, de modification d\'abonnement et de remboursement en lien avec l\'équipe Finance.',
    content: `## Contexte\n\nLes praticiens adressent leurs demandes de facturation et remboursement au CSM. Ces demandes impliquent souvent Finance (Stripe, comptabilité) et parfois IT (bug de facturation, accès Stripe Dashboard). Ce processus CSM-Finance-IT garantit un traitement rapide et tracé.\n\n## Types de demandes et responsabilités\n\n| Demande | Traitement CSM | Implication Finance | Implication IT |\n|---|---|---|---|\n| Duplicata de facture | CSM envoie depuis Stripe | Non | Non |\n| Modification d'adresse de facturation | CSM modifie dans Stripe | Non | Non |\n| Remboursement ≤ 50€ | CSM traite en autonomie | Information | Non |\n| Remboursement > 50€ | CSM soumet pour validation | Validation Finance | Non |\n| Bug de paiement (non débité / double débit) | CSM signale à IT | Vérification Stripe | Investigation urgente |\n| Changement de plan (upgrade/downgrade) | CSM modifie dans Stripe | Prorata calculé auto | Non |\n\n## Procédure de remboursement\n\n1. **CSM** : Vérifier l'éligibilité (politique de remboursement cf. article dédié)\n2. **CSM** : Si montant ≤ 50€ → traiter dans Stripe Dashboard → logger dans HubSpot\n3. **CSM** : Si montant > 50€ → envoyer la demande à Finance via formulaire Notion "Remboursement"\n4. **Finance** : Valider sous 24h ouvrées\n5. **CSM** : Déclencher le remboursement dans Stripe après validation\n6. **CSM** : Informer le praticien (délai de crédit : 3-5 jours ouvrés)\n\n## Bugs de facturation — Process CSM-IT\n\nSi un praticien signale un problème de paiement non explicable dans Stripe :\n1. CSM crée un ticket Linear → IT → label "Stripe Bug" + priorité P1\n2. IT investigate dans les logs Stripe et l'API Liberlo\n3. IT notifie CSM de la cause et des praticiens impactés\n4. CSM contacte proactivement tous les praticiens impactés`,
    tags: ['facturation', 'remboursement', 'CSM', 'Finance', 'Stripe', 'IT', 'transversal'],
    service: 'csm',
    status: 'PUBLISHED',
  },
]

// ─── Conversations seedées ───────────────────────────────────────────────────

const SEEDED_CONVERSATIONS: {
  userEmail: string
  title: string
  turns: { query: string }[]
}[] = [
  {
    userEmail: 'alex.petit@liberlo.com',
    title: 'Onboarding technique et accès IT',
    turns: [
      { query: 'onboarding accès outils IT nouveaux collaborateurs' },
      { query: 'procédure réinitialisation mots de passe accès' },
    ],
  },
  {
    userEmail: 'leo.garnier@liberlo.com',
    title: 'Relance praticiens inactifs et churn',
    turns: [
      { query: 'praticien inactif relance script email' },
      { query: 'signaux churn escalade praticien mécontent' },
    ],
  },
  {
    userEmail: 'hugo.renard@liberlo.com',
    title: 'Pipeline commercial et qualification',
    turns: [
      { query: 'qualification prospect BANT pipeline Salesforce' },
      { query: 'objections commerciales pitch praticien' },
    ],
  },
  {
    userEmail: 'maya.girard@liberlo.com',
    title: 'Charte graphique et publication réseaux',
    turns: [
      { query: 'charte graphique couleurs logo Liberlo' },
      { query: 'calendrier editorial instagram publication contenu' },
    ],
  },
  {
    userEmail: 'eva.nguyen@liberlo.com',
    title: 'Politique télétravail et congés',
    turns: [
      { query: 'politique télétravail jours autorisés règles' },
      { query: 'congés RTT déclaration Payfit absences' },
    ],
  },
]

// ─── Seed ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...')

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

  // 3. Responsables
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
  const collaborateurMap: Record<string, string> = {}
  for (const c of collaborateurs) {
    const user = await prisma.user.upsert({
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
    collaborateurMap[c.email] = user.id
  }

  // 5. Articles (60 — 10 par service)
  console.log('  → Articles...')
  for (const a of ARTICLES) {
    const authorId = responsableMap[a.service]
    const serviceId = serviceMap[a.service]
    const existing = await prisma.article.findFirst({ where: { title: a.title, serviceId } })
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

  // 6. Conversations seedées
  console.log('  → Conversations...')
  for (const conv of SEEDED_CONVERSATIONS) {
    const userId = collaborateurMap[conv.userEmail]
    if (!userId) continue

    const existing = await prisma.conversation.findFirst({ where: { userId, title: conv.title } })
    if (existing) continue

    const created = await prisma.conversation.create({
      data: { userId, title: conv.title },
    })

    for (const turn of conv.turns) {
      const results = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { title: { contains: turn.query.split(' ')[0], mode: 'insensitive' } },
            { content: { contains: turn.query.split(' ')[0], mode: 'insensitive' } },
          ],
        },
        select: {
          id: true, title: true, summary: true,
          service: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, email: true } },
          updatedAt: true,
        },
        take: 5,
      })

      await prisma.message.createMany({
        data: [
          { conversationId: created.id, role: 'USER', content: turn.query },
          {
            conversationId: created.id,
            role: 'ASSISTANT',
            content: `${results.length} résultat${results.length !== 1 ? 's' : ''} trouvé${results.length !== 1 ? 's' : ''}`,
            results: results.map(r => ({ ...r, score: 1 })) as unknown as object,
          },
        ],
      })
    }

    await prisma.conversation.update({ where: { id: created.id }, data: { updatedAt: new Date() } })
  }

  console.log('✅ Seed terminé.')
  console.log('')
  console.log('Comptes (mot de passe : Liberlo2026!) :')
  console.log('  SUPER_ADMIN   : ceo@liberlo.com')
  console.log('  RESPONSABLE IT: marc.dupont@liberlo.com')
  console.log('  COLLABO IT    : alex.petit@liberlo.com')
  console.log('  COLLABO CSM   : leo.garnier@liberlo.com')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
