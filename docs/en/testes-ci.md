# Tests and CI

## Local tests

```bash
# Python (unit + integration + resilience) — offline (mocks)
python3 -m pytest tests -q

# Web (Vitest)
pnpm test

# Web typecheck
pnpm typecheck

# Web lint
pnpm lint

# Web production build
pnpm build

# Mobile typecheck
cd apps/mobile && npx tsc --noEmit
```

Spirit: **all tests green before any merge** (required by CI).

## Coverage by type

- **Python**: ingestion, synthesis, sanitization, podcast, politician record (ficha) and politician/article association modules. They use network mocks. `test_synthesizer.py` covers the relevance restriction (off-topic).
- **Web (Vitest)**: logic utilities (`ficha`, `format`).

## CI/CD — GitHub Actions

| Workflow | File | What runs |
|----------|---------|-----------|
| `ci.yml` | `.github/workflows/ci.yml` | OSV audit, pytest, Vitest, eslint, typecheck, build (push/PR) |
| `ingest.yml` | `.github/workflows/ingest.yml` | Scheduled ingestion (cron 4×/day) with repo secrets |
| `podcast.yml` | `.github/workflows/podcast.yml` | Weekly podcast: audited-deps check + `python scripts/podcast.py` |

### Dependency security

- **Python**: `requirements.lock.txt` with hashes; installs with `--require-hashes`; `check_deps.py` validates authenticity.
- **Node**: `pnpm audit --audit-level=high` with a frozen lockfile in CI.

> A recurring flow in the history: changes must pass the CI check set before merging into `develop`/`main`. Check the [Workflow](fluxo-de-trabalho.md) and [Deploy](deploy.md) sections.