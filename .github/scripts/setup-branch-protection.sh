#!/usr/bin/env bash
# Configure les protections de branches GitHub pour le projet liberlo-knowledge.
# Prérequis : gh auth login (une seule fois)
#
# Utilisation :
#   bash .github/scripts/setup-branch-protection.sh
#
# Les branches doivent exister avant l'exécution. Créer develop et re7 si absent :
#   git checkout -b develop && git push -u origin develop
#   git checkout -b re7     && git push -u origin re7

set -euo pipefail

REPO="ClementRollin/liberlo-knowledge"

# Noms exacts des jobs CI (champ "name:" dans ci.yml)
BACKEND_CHECK="Backend — Tests & Build"
FRONTEND_CHECK="Frontend — TypeCheck & Build"

echo "=== Protection de branches — $REPO ==="

# --------------------------------------------------------------------------
# develop — branche de dev active
#   · PR obligatoire (pas de push direct), 0 approbation requise (solo dev)
#   · CI obligatoire en mode strict (branche à jour avant merge)
#   · Pas de force-push, pas de suppression
# --------------------------------------------------------------------------
echo ""
echo "→ develop..."
gh api "repos/$REPO/branches/develop/protection" \
  --method PUT \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Backend — Tests & Build", "Frontend — TypeCheck & Build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
echo "   ✓ develop protégée"

# --------------------------------------------------------------------------
# re7 — staging / tests en conditions prod
#   · PR obligatoire, 0 approbation (admin peut merger en solo)
#   · CI stricte + dismiss stale reviews (re-run CI si nouveaux commits)
#   · Pas de force-push, pas de suppression
# --------------------------------------------------------------------------
echo ""
echo "→ re7..."
gh api "repos/$REPO/branches/re7/protection" \
  --method PUT \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Backend — Tests & Build", "Frontend — TypeCheck & Build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
echo "   ✓ re7 protégée"

# --------------------------------------------------------------------------
# main — branche de production
#   · PR obligatoire, 0 approbation (solo dev, mais workflow PR forcé)
#   · CI stricte + enforce_admins=true : même l'admin ne peut pas bypasser
#   · Pas de force-push, pas de suppression
# --------------------------------------------------------------------------
echo ""
echo "→ main..."
gh api "repos/$REPO/branches/main/protection" \
  --method PUT \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Backend — Tests & Build", "Frontend — TypeCheck & Build"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
echo "   ✓ main protégée"

echo ""
echo "=== Terminé. Vérification sur GitHub ==="
echo "https://github.com/$REPO/settings/branches"
