#!/bin/bash
# SessionStart : installe le plugin ECC et les dépendances npm dans les sessions cloud.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Plugin ECC (agents ecc:*, commandes, hooks) — déclaré dans .claude/settings.json
# mais jamais présent dans un conteneur neuf.
if ! grep -q '"ecc@ecc"' "$HOME/.claude/plugins/installed_plugins.json" 2>/dev/null; then
  if ! claude plugin marketplace list 2>/dev/null | grep -q '> ecc$'; then
    claude plugin marketplace add affaan-m/ECC --scope user
  fi
  claude plugin install ecc@ecc --scope user
fi

# Dépendances du projet (lint, tests, build).
npm install --no-audit --no-fund
