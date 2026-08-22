# Checklist variables d'environnement — Démo soutenance

Avant de lancer la démo, vérifie que toutes les variables **obligatoires** sont
correctement définies dans `backend/.env`.

## Variables obligatoires

| Variable | Valeur attendue | Rôle |
|---|---|---|
| `DATABASE_URL` | `postgresql://liberlo:liberlo_dev@db:5432/liberlo_kb?schema=public` (Docker) | Connexion PostgreSQL |
| `JWT_SECRET` | Chaîne aléatoire longue (≥ 32 chars) | Signature des tokens JWT |
| `JWT_EXPIRES_IN` | `8h` | Durée de session |
| `OPENAI_API_KEY` | `sk-proj-...` | Embeddings (text-embedding-3-small) + recherche sémantique |
| `PORT` | `3001` | Port d'écoute du backend |
| `FRONTEND_URL` | URL ngrok du frontend (ex: `https://xxxx.ngrok-free.app`) | CORS |

## Variables conditionnellement obligatoires

| Variable | Obligatoire si... | Rôle |
|---|---|---|
| `ANTHROPIC_API_KEY` | Le module Import est démontré | Analyse Claude Haiku |
| `GOOGLE_CLIENT_ID` | Import Google Drive est démontré | OAuth2 Google |
| `GOOGLE_CLIENT_SECRET` | Import Google Drive est démontré | OAuth2 Google |
| `GOOGLE_REDIRECT_URI` | Import Google Drive est démontré | Callback OAuth2 |

## Procédure de vérification le jour J

```bash
# 1. Vérifier que le .env existe et contient les variables clés
grep -E "DATABASE_URL|OPENAI_API_KEY|JWT_SECRET|FRONTEND_URL" backend/.env

# 2. Adapter FRONTEND_URL à l'URL ngrok du frontend AVANT de démarrer le backend
# Exemple :
# FRONTEND_URL="https://abcd1234.ngrok-free.app"

# 3. Adapter DATABASE_URL selon le mode de démarrage :
# - Docker : hôte = db
# - Local  : hôte = localhost

# 4. Démarrer les services
docker compose up -d

# 5. Vérifier que le backend démarre sans erreur
docker compose logs -f backend
```

## Erreurs fréquentes

| Symptôme | Cause probable | Fix |
|---|---|---|
| `CORS blocked` | `FRONTEND_URL` incorrect | Mettre l'URL ngrok exacte (sans slash final) |
| Recherche sémantique renvoie 0 résultat | `OPENAI_API_KEY` manquant ou invalide | Vérifier la clé OpenAI |
| `JWT_SECRET is required` | Variable manquante | Ajouter dans `.env` |
| Frontend n'affiche pas les articles | `DATABASE_URL` incorrect ou DB non démarrée | `docker compose up -d db` |
