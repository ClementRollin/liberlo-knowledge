#!/usr/bin/env bash
# Remet la base de données à zéro et réapplique le seed.
# Usage : ./scripts/reset-db.sh
set -e

echo "Réinitialisation de la base de données..."
cd "$(dirname "$0")/../backend"

npx prisma migrate reset --force
echo "Base de données réinitialisée avec les données de seed."
