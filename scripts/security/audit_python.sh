#!/usr/bin/env bash
# Auditoria de dependências Python: PINAS com hashes + vulnerabilidades OSV.
# Uso: scripts/security/audit_python.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

PY=${PYTHON:-python3}

if ! command -v "$PY" >/dev/null 2>&1; then
  echo "ERRO: python3 não encontrado." >&2
  exit 1
fi

echo "==> Instalando deps com hashes verificados (pip --require-hashes)"
"$PY" -m venv /tmp/bt-audit-venv
/tmp/bt-audit-venv/bin/pip install --require-hashes -r scripts/requirements.txt

echo "==> Auditoria OSV.dev (ranges sensíveis)"
exec /tmp/bt-audit-venv/bin/python scripts/security/check_osv.py -r scripts/requirements.txt