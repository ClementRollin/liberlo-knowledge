# Rôles & permissions

## Personae

### Collaborateur (CSM, Sales, Marketing, RH, IT, etc.)
- Besoin : retrouver rapidement une information interne fiable
- Droits : lecture uniquement, limitée par la visibilité des contenus et
  le service

### Responsable de service (Admin de service)
- Profil : chef de service, responsable de la production et de la mise à
  jour des contenus de son périmètre
- Droits : CRUD sur les articles de son service uniquement, aucune
  visibilité globale sur les autres services
- Accès à un dashboard de gestion simplifié (`/dashboard`)

### Super Admin (CTO, CEO, chefs de projet transverses)
- Profil : supervision transverse, sans droit de modification
- Droits : lecture globale de tous les contenus, tous services confondus
- Accès à un dashboard transverse dédié (`/dashboard/global`)
- Aucun droit d'écriture, de modification, ou de suppression

## Tableau récapitulatif

| Rôle | Droits |
|---|---|
| Collaborateur | Lecture |
| Responsable de service | CRUD sur son service |
| Super Admin | Lecture globale + dashboard transverse |

## Règles d'attribution

- Les rôles sont attribués **manuellement** à la création de l'utilisateur
  par l'administrateur (pas d'auto-inscription, pas de changement de rôle
  via l'interface).
- Un `serviceId` est obligatoire uniquement pour le rôle RESPONSABLE.
- Toute vérification de rôle et de service doit être effectuée côté
  backend, jamais côté frontend seul.

## Services existants

CSM, Sales, Marketing, IT, RH, Direction.
