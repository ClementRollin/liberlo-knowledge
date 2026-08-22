# Setup soutenance — procédure jour J

Guide testé le 22 août 2026. Durée : ~5 minutes.

## Architecture de la démo

```
Jury (navigateur)
    ↓ HTTPS
ngrok public URL
    ↓
Vite dev server :5173   ← frontend Vue 3
    ↓ proxy /api → localhost:3001
NestJS backend :3001    ← Docker
    ↓
PostgreSQL :5432        ← Docker (pgvector)
    + Ollama :11434     ← WSL host (nomic-embed-text 768 dim)
```

Le proxy Vite gère tous les appels API — **pas besoin de modifier FRONTEND_URL
ni de redémarrer Docker** quand l'URL ngrok change.

---

## Étapes

### 1. Vérifier Ollama

```bash
ollama list   # nomic-embed-text doit apparaître
# Si absent :
ollama pull nomic-embed-text
```

### 2. Démarrer DB + backend

```bash
cd /root/memoire
docker compose up -d
docker compose ps   # attendre status "healthy" sur db et backend
```

### 3. Charger les données (si base vide ou réinitialisée)

```bash
docker compose exec backend npx prisma db seed
# Résultat attendu : ✓ 74 embeddings générés
```

### 4. Démarrer le frontend

Dans un terminal dédié (garder ouvert) :

```bash
cd /root/memoire/frontend && npm run dev
# Attendre : ➜  Local: http://localhost:5173/
```

### 5. Ouvrir le tunnel ngrok

Dans un autre terminal (garder ouvert) :

```bash
ngrok http 5173
# Copier l'URL HTTPS affichée
```

> La première visite affiche un écran d'avertissement ngrok — cliquer "Visit Site".
> Les visites suivantes sont directes.

### 6. Vérification rapide

```bash
# Remplacer <URL> par l'URL ngrok obtenue (sans le https://)
curl -s -o /dev/null -w '%{http_code}' \
  -H 'ngrok-skip-browser-warning: true' \
  https://<URL>
# → 200 ✅

curl -s -X POST https://<URL>/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'ngrok-skip-browser-warning: true' \
  -d '{"email":"ceo@liberlo.com","password":"Liberlo2026!"}'
# → {"access_token":"eyJ..."} ✅
```

---

## Comptes de démo

Mot de passe universel : **`Liberlo2026!`**

| Email | Rôle | Accès |
|---|---|---|
| `ceo@liberlo.com` | SUPER_ADMIN | Dashboard global, lecture tous services |
| `marc.dupont@liberlo.com` | RESPONSABLE — IT | Dashboard IT, CRUD articles IT |
| `alice.martin@liberlo.com` | RESPONSABLE — CSM | Dashboard CSM, CRUD articles CSM |
| `sarah.leblanc@liberlo.com` | RESPONSABLE — CSM | Dashboard CSM |
| `jean.leclerc@liberlo.com` | COLLABORATOR | Recherche + lecture seule |

Swagger UI : `https://<URL>/api/docs`

---

## Scénario recommandé (~8 min)

1. **Accueil** — barre de recherche + 6 tuiles de service
2. **Recherche sémantique** — taper "procédure onboarding praticien" → résultats classés par similarité cosinus
3. **Article** — ouvrir un résultat, montrer le rendu Markdown
4. **Service** — naviguer via une tuile, liste paginée
5. **Dashboard RESPONSABLE** — login `marc.dupont@liberlo.com`, créer ou modifier un article
6. **Dashboard SUPER_ADMIN** — login `ceo@liberlo.com`, vision globale avec filtre par service
7. **Swagger** — `/api/docs`, montrer les endpoints documentés

---

## Arrêt propre

```bash
docker compose down
# Ctrl+C dans les terminaux Vite et ngrok
```

---

## Note RGPD

La base de données contient exclusivement des **données fictives** (dummy data).
L'URL ngrok est temporaire et désactivée en dehors de la fenêtre de soutenance.
Aucune donnée réelle Liberlo n'est utilisée dans ce prototype de démonstration.
