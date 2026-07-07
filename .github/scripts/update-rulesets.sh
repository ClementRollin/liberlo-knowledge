#!/usr/bin/env bash
# Met à jour les rulesets GitHub existants avec les nouveaux required_status_checks.
# Prérequis : gh auth login
#
# Utilisation :
#   bash .github/scripts/update-rulesets.sh

set -euo pipefail

REPO="ClementRollin/liberlo-knowledge"

echo "=== Mise à jour des rulesets — $REPO ==="

# Les IDs sont stockés dans _ruleset_id dans rulesets.json
RULESETS_FILE="$(dirname "$0")/../rulesets.json"

jq -c '.[]' "$RULESETS_FILE" | while IFS= read -r ruleset; do
  id=$(echo "$ruleset" | jq -r '._ruleset_id')
  name=$(echo "$ruleset" | jq -r '.name')

  echo ""
  echo "→ Mise à jour de '$name' (id: $id)..."

  # Strip les champs non-API avant d'envoyer
  echo "$ruleset" | jq 'del(._comment, ._ruleset_id)' > /tmp/rs_update.json

  gh api "repos/$REPO/rulesets/$id" \
    -X PUT \
    --input /tmp/rs_update.json

  echo "   ✓ $name mis à jour"
done

echo ""
echo "=== Terminé ==="
echo "https://github.com/$REPO/settings/rules"
