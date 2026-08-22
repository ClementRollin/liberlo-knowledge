# Checklist variables d'environnement — Démo soutenance

Avant de lancer la démo, vérifie que `backend/.env` contient les variables suivantes.

## Variables obligatoires

| Variable | Valeur attendue | Rôle |
|---|---|---|
| `DATABASE_URL` | `postgresql://liberlo:liberlo_dev@db:5432/liberlo_kb?schema=public` | Connexion PostgreSQL (Docker) |
| `JWT_SECRET` | Chaîne aléatoire longue (≥ 32 chars) | Signature des tokens JWT |
| `JWT_EXPIRES_IN` | `8h` | Durée de session |
| `OLLAMA_URL` | `http://host.docker.internal:11434` | Embeddings nomic-embed-text 768 dim |
| `PORT` | `3001` | Port d'écoute du backend |
| `FRONTEND_URL` | `http://localhost:5173` | CORS (inutile de changer pour ngrok) |

> **Note ngrok** : `FRONTEND_URL` n'a pas besoin d'être mis à jour pour ngrok.
> Le proxy Vite (`/api → localhost:3001`) gère les appels API côté serveur,
> donc le backend ne voit jamais de requête cross-origin.

## Variables conditionnellement obligatoires

| Variable | Obligatoire si... | Rôle |
|---|---|---|
| `ANTHROPIC_API_KEY` | Le module Import est démontré | Analyse Claude Haiku |
| `GOOGLE_CLIENT_ID` | Import Google Drive est démontré | OAuth2 Google |
| `GOOGLE_CLIENT_SECRET` | Import Google Drive est démontré | OAuth2 Google |
| `GOOGLE_REDIRECT_URI` | Import Google Drive est démontré | Callback OAuth2 |

## Vérification rapide le jour J

```bash
grep -E "DATABASE_URL|OLLAMA_URL|JWT_SECRET" backend/.env
```

## Erreurs fréquentes

| Symptôme | Cause probable | Fix |
|---|---|---|
| Recherche sémantique renvoie 0 résultat | Ollama non démarré ou modèle absent | `ollama list` → `ollama pull nomic-embed-text` |
| `JWT_SECRET is required` | Variable manquante dans `.env` | Ajouter dans `backend/.env` |
| Frontend n'affiche pas les articles | DB non démarrée ou seed non lancé | `docker compose up -d` puis `npx prisma db seed` |
| ngrok bloque les requêtes | `allowedHosts` non configuré | Déjà corrigé dans `vite.config.ts` — vérifier la version |
