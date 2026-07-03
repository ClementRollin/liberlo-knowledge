#!/usr/bin/env bash
# Déclenche le reindex des embeddings pour tous les articles sans vecteur.
# Usage : ./scripts/generate-embeddings.sh <JWT_TOKEN>
# Exemple : ./scripts/generate-embeddings.sh eyJhbGci...
set -e

TOKEN="${1:?Fournir le JWT du SUPER_ADMIN en argument : ./scripts/generate-embeddings.sh <token>}"
API_URL="${API_URL:-http://localhost:3001}"

echo "Déclenchement du reindex des embeddings..."
curl -s -X POST "${API_URL}/articles/reindex" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" | jq .

echo "Reindex terminé."
