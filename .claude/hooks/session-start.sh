#!/bin/bash
# SessionStart hook (Claude Code cloud uniquement) :
#  1. installe le plugin ECC (agents, skills, hooks) déclaré dans .claude/settings.json
#  2. installe les dépendances npm pour que lint et tests fonctionnent
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

# --- Plugin ECC (idempotent) ---
if ! claude plugin list 2>/dev/null | grep -q 'ecc@ecc'; then
  claude plugin marketplace add affaan-m/ECC >&2 || true
  claude plugin install ecc@ecc --scope project >&2
fi

# --- Dépendances du projet ---
npm install --no-audit --no-fund >&2
