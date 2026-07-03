# Frontend — Vue 3 / TypeScript

## Stack

- Vue 3 (Composition API) + TypeScript
- Vite
- Vue Router (guards auth + rôles)
- Pinia (state management)
- Tailwind CSS
- vee-validate + yup (formulaires/validation)
- Wrapper `fetch` maison pour les appels HTTP (pas d'axios sauf demande explicite)

## Authentification côté client

- JWT stocké en mémoire applicative (Pinia), **jamais** en localStorage
- Guards de navigation globaux :
  - redirection vers `/auth/login` si non authentifié
  - redirection vers `/403` si rôle insuffisant pour la route

## Routes

| Route | Accès | Description |
|---|---|---|
| `/auth/login` | public | Connexion |
| `/auth/activate` | public | Activation compte |
| `/` | auth | Accueil + recherche |
| `/search` | auth | Résultats recherche |
| `/service/:slug` | auth | Listing par service |
| `/article/:id` | auth | Lecture article |
| `/dashboard` | RESPONSABLE | Gestion du service |
| `/dashboard/global` | SUPER_ADMIN | Supervision globale (lecture seule) |
| `/403` | auth | Accès refusé |

## Menu utilisateur (avatar) — rendu conditionnel par rôle

- Collaborateur : Profil, Déconnexion
- Responsable : Profil, Ajouter une info → `/dashboard`, Déconnexion
- Super Admin : Profil, Dashboard global → `/dashboard/global`, Déconnexion

## Composants UI à privilégier

Button, Input/Select, Badge, Card, Modal/Drawer, Table, Dropdown, Toast,
Skeleton loader, Pagination.

Tous les composants doivent être :
- contrôlés (props/emits explicites, pas d'état caché)
- accessibles (a11y : labels, focus, contrastes)
- stylés uniquement via Tailwind (pas de CSS custom sauf nécessité)

## États UI à gérer systématiquement

Pour toute vue asynchrone (recherche, listing) : état de chargement
(skeleton), état vide ("aucun résultat"), état d'erreur contextualisé.

## Ce que le frontend ne doit jamais faire

- Ne jamais décider d'une autorisation d'accès sans confirmation backend —
  les guards frontend sont un confort UX, pas une mesure de sécurité.
- Ne jamais afficher de contenu dont la visibilité n'a pas été filtrée
  côté backend.

## Design

Avant toute création/modification de composant visuel, si l'ampleur du
travail le justifie (nouvelle page, refonte UI), consulter les principes
de design distinctif plutôt que d'utiliser des styles Tailwind par défaut
non travaillés.
