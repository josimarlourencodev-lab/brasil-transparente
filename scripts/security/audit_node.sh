#!/usr/bin/env bash
# Auditoria de dependências Node: vulns (pnpm audit) + integridade do lockfile.
# Uso: scripts/security/audit_node.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERRO: pnpm não encontrado. Rode dentro do container web (docker compose exec web)." >&2
  exit 1
fi

echo "==> Verificando integridade do lockfile (pnpm install --frozen-lockfile)"
pnpm install --frozen-lockfile

echo "==> Vulnerabilidades conhecidas (pnpm audit)"
pnpm audit --audit-level=high