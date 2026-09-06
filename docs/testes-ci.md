# Testes e CI

## Testes locais

```bash
# Python (unit + integração + resiliência) — sem rede (mocks)
python3 -m pytest tests -q

# Web (Vitest)
pnpm test

# Typecheck web
pnpm typecheck

# Lint web
pnpm lint

# Build de produção web
pnpm build

# Typecheck mobile
cd apps/mobile && npx tsc --noEmit
```

Espírito: **todos os testes verdes antes de qualquer merge** (o CI exige).

## Cobertura por tipo

- **Python**: módulos de ingestão, síntese, sanitização, podcast, ficha e associação político/notícia. Usam mocks de rede. O `test_synthesizer.py` cobre a restrição de relevância (fora do tema).
- **Web (Vitest)**: utilitários de lógica (`ficha`, `format`).

## CI/CD — GitHub Actions

| Workflow | Arquivo | O quê roda |
|----------|---------|-----------|
| `ci.yml` | `.github/workflows/ci.yml` | OSV audit, pytest, Vitest, eslint, typecheck, build (push/PR) |
| `ingest.yml` | `.github/workflows/ingest.yml` | Ingestão agendada (cron 4×/dia) com secrets do repo |
| `podcast.yml` | `.github/workflows/podcast.yml` | Podcast semanal: check de deps auditadas + `python scripts/podcast.py` |

### Segurança de dependências

- **Python**: `requirements.lock.txt` com hashes; instala com `--require-hashes`; `check_deps.py` valida autenticidade.
- **Node**: `pnpm audit --audit-level=high` com lockfile congelado no CI.

> Um fluxo recorrente no histórico: mudanças precisam passar pelos três collgs de CI antes de merge em `develop`/`main`. Conferir as seções de [Fluxo de trabalho](fluxo-de-trabalho.md) e [Deploy](deploy.md).
