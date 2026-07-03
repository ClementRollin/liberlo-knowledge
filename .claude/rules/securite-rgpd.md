# Sécurité & RGPD

## Principes de sécurité applicatifs

- Authentification obligatoire sur toute route applicative (aucune route
  accessible sans JWT valide, hors `/auth/login` et `/auth/activate`)
- Mots de passe hashés (bcrypt), jamais stockés ou loggés en clair
- Token d'activation de compte : UUID à usage unique, durée de validité
  limitée (24-72h)
- Guards NestJS systématiques par rôle et par service
- Aucune confiance accordée au frontend : toute autorisation est revalidée
  côté backend
- Principe du moindre privilège appliqué à chaque rôle (cf.
  `roles-permissions.md`)
- SSO (Google Workspace / OIDC) envisagé en évolution future, hors périmètre
  du MVP

## Justification RGPD du prototype de démonstration

Le prototype présenté en soutenance repose sur une **base de données
factice (dummy data)**, exposée temporairement via ngrok le jour de la
démonstration, et non sur les données réelles des collaborateurs Liberlo.

Cette approche répond à un double objectif :
- démontrer le fonctionnement technique complet de l'outil (authentification,
  rôles, recherche sémantique) sans exposer de données personnelles réelles ;
- respecter le principe de minimisation des données (article 5 du RGPD) en
  n'utilisant que des données non identifiantes et non sensibles pour la
  démonstration.

Point à documenter dans le mémoire (partie 3, section sécurité/RGPD) :
préciser explicitement que cette architecture de démo est temporaire et ne
constitue pas un déploiement réel — l'exposition via ngrok est désactivée
en dehors de la fenêtre de soutenance.

## Ce qui reste à sourcer / confirmer

- Références CNIL précises à citer pour la justification RGPD (recommandations
  sur les bases de connaissances internes / minimisation des données) —
  à rechercher et confirmer avant intégration au mémoire, ne pas inventer
  de référence.
- Si un volet RSE numérique responsable est développé, s'appuyer sur des
  sources ADEME ou Commission européenne vérifiées.

## Ce que Claude ne doit jamais faire sur ce point

- Ne jamais suggérer d'utiliser de vraies données Liberlo (RH, clients,
  praticiens) dans le prototype de démonstration.
- Ne jamais affirmer une conformité RGPD sans la nuancer comme un objectif
  de conception, pas une certification.
