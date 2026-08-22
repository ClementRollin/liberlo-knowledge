# Procédure de démo — ngrok

Guide de démarrage complet pour la soutenance. Durée estimée : 5-10 minutes.

## Prérequis

- Docker Desktop démarré
- ngrok installé et authentifié (`ngrok config add-authtoken <token>`)
- `backend/.env` correctement configuré (voir `docs/demo-env-checklist.md`)

## Étapes

### 1. Démarrer les services Docker

```bash
cd /chemin/vers/liberlo-knowledge
docker compose up -d
```

Attendre que tous les services soient `healthy` :

```bash
docker compose ps
```

### 2. Charger les données de démo

```bash
docker compose exec backend npx prisma db seed
```

Comptes créés :
| Email | Rôle | Mot de passe |
|---|---|---|
| `ceo@liberlo.com` | SUPER_ADMIN | `Liberlo2026!` |
| `marc.dupont@liberlo.com` | RESPONSABLE (IT) | `Liberlo2026!` |
| `alice.martin@liberlo.com` | RESPONSABLE (CSM) | `Liberlo2026!` |
| `jean.leclerc@liberlo.com` | COLLABORATOR | `Liberlo2026!` |
| *(+ 15 autres comptes)* | | |

### 3. Exposer le frontend via ngrok

Dans un terminal dédié :

```bash
ngrok http 5173
```

Copier l'URL générée, par exemple : `https://abcd1234.ngrok-free.app`

### 4. Mettre à jour FRONTEND_URL dans backend/.env

```bash
# Éditer backend/.env
FRONTEND_URL="https://abcd1234.ngrok-free.app"
```

Puis redémarrer le backend pour prendre en compte le changement CORS :

```bash
docker compose restart backend
```

### 5. Démarrer le frontend

```bash
cd frontend && npm run dev
```

Le frontend tourne sur `http://localhost:5173` (accessible via l'URL ngrok).

### 6. Vérification finale

- [ ] `http://localhost:5173` charge la page de login
- [ ] Login avec `ceo@liberlo.com` → dashboard global visible
- [ ] Login avec `marc.dupont@liberlo.com` → dashboard IT visible
- [ ] Recherche "onboarding" → résultats sémantiques pertinents
- [ ] `/api/docs` accessible → Swagger UI

## Arrêt propre

```bash
docker compose down
# Ctrl+C dans les terminaux ngrok et frontend
```

## Points d'attention RGPD

- La base de données contient exclusivement des **données fictives** (dummy data).
- L'URL ngrok est temporaire et désactivée en dehors de la fenêtre de soutenance.
- Aucune donnée réelle Liberlo n'est utilisée dans ce prototype de démonstration.
- Conformément à l'article 5 du RGPD (minimisation des données), aucune donnée
  personnelle identifiante n'est exposée.
