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
