#!/usr/bin/env bash
# Auditoria de dependências Node: vulns (npm audit) + verificação do lockfile.
# Uso: scripts/security/audit_node.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERRO: npm não encontrado. Rode dentro do container web (docker compose exec web)." >&2
  exit 1
fi

echo "==> Verificando integridade do lockfile"
npm ls >/dev/null

echo "==> Vulnerabilidades conhecidas (npm audit)"
npm audit --audit-level=high