# Brasil Transparente

An autonomous, neutral and independent portal that monitors news and keeps a record of current Brazilian politicians.

> 🇧🇷 **Versão em português:** [README.md](README.md)

> 📚 **Full documentation**: <https://josimarlourencodev-lab.github.io/brasil-transparente> — history, architecture, database, ingestion, podcast, mobile, deploy, security and usage.

## Overview

Brasil Transparente provides a contextualized record of Brazilian politicians — past cases and contradictions — by comparing official sources and opposition channels side by side. The goal is to ensure visibility beyond election periods, promoting transparency and accountability.

### Principles

- **Neutrality:** the project does not take a political stance; official and opposition sources are presented side by side.
- **Autonomy:** automatic pipeline (bot + neutral LLM), with optional human auditing on the `/admin` panel.
- **Accessibility:** free and open source, including a mobile app (PWA + Expo).
- **Verifiability:** every article links to primary sources; contradictions are pointed out with factual `descricao` and `referencias`.

---

## Stack

| Layer | Technology |
|--------|-----------|
| Web | Next.js 16 (App Router) + React 19 + Tailwind, PWA |
| Mobile | Expo / React Native (`apps/mobile`) |
| Data backend | Supabase (Postgres) / local PostgREST via Docker |
| Ingestion | Python 3.13 (pip with hashes in the lockfile) |
| Neutral synthesis | Groq / Together AI / Gemini (LLM) |
| CI | GitHub Actions (OSV + pytest + Vitest + lint + typecheck + build) |

---

## Getting Started (Docker)

Prerequisite: Docker with Compose v2 plugin.

```bash
# 1. Generate JWT/anon/service_role credentials + ADMIN_PASSWORD (unversioned)
python3 scripts/security/dev_tokens.py

# 2. Start database + PostgREST API (:54321) + web (:3000) + worker
docker compose up -d --build

# 3. Tests inside the web container
docker compose exec web pnpm test
docker compose exec web pnpm run typecheck
```

Site at `http://localhost:3000`, API at `http://localhost:54321`, admin panel at `http://localhost:3000/admin`.

Alternative without Docker (development):

```bash
cp .env.local.example .env.local   # fill in the keys
pip install --require-hashes -r scripts/requirements.txt
pnpm install
pnpm run dev
```

Apply the schema (`supabase/schema.sql`) to Supabase Cloud via the SQL Editor.

---

## Ingestion Pipeline

```
feeds.json / env RSS_* → crawlers (RSS/Atom, retries) → dedupe → sanitize (anti-XSS)
→ source type → LLM synthesis (summary/category/contradictions) → upsert into Postgres
```

- `scripts/ingest.py` — orchestrator. Flags: `--dry-run`, `--sources oficiais,imprensa,...`, `--limit`.
- `scripts/worker.py` — scheduler (APScheduler), interval via `INGEST_INTERVAL_MINUTOS`.
- `scripts/crawlers/` — base (parser + resilience), source registry per category.
- `scripts/synthesizer.py` — neutral synthesis with structured JSON and contradiction detection.
- `scripts/sanitize.py` — anti-XSS layer before persistence (every external source goes through it).
- `.github/workflows/ingest.yml` — cron every 6 hours (configurable).

## Security

- **Hashed lockfile:** `scripts/requirements.lock.txt` + `pip install --require-hashes` (transitives resolved via `pip-compile`).
- **OSV audit:** `python3 scripts/security/check_osv.py` (filters range-edge false positives; exit code for CI).
- **pnpm audit + lock:** `pnpm audit --audit-level=high` (frozen lockfile in CI).
- **Web package config requires Node ≥ 22 (`engines`).**
- **Sanitization:** `scripts/sanitize.py` blocks `<script>`, `javascript:` URIs, and CR/LF header injection.
- **RLS:** public read protected by policy; writes only via `service_role`.
- **`/admin` panel:** password via `ADMIN_PASSWORD` (HttpOnly cookie + constant-time comparison).

## Tests

```bash
# Python (unit + integration + resilience) — offline (mocks)
python3 -m pytest

# Frontend (Vitest)
pnpm test
```

Expected: all tests green before any merge (required by CI).

## Mobile

```bash
cd apps/mobile
pnpm install
npx expo start
```

Consumes the same backend (`anon` key); URLs in `app.json → expo.extra`.

## CI/CD

- `ci.yml` — OSV audit, pytest, Vitest, lint, typecheck, build (push/PR).
- `ingest.yml` — scheduled ingestion with repository secrets.

GitHub secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LLM_PROVIDER`, `LLM_API_KEY`, `RSS_FEEDS_OFICIAIS`, `RSS_FEEDS_IMPRENSA`, `RSS_FEEDS_INDEPENDENTES`.

---

## Database

Schema in `supabase/schema.sql`. Main tables: `politicos`, `noticias`, `fontes`, `categorias`, `historico`, `audit_log`. `noticias` records `contradicao_detectada`, `contradicao_descricao` and `metadata` (jsonb); RLS enabled with public read policy only for `status='publicado'`.

## Code of Conduct

1. **No partisan bias:** no support for or attack against any party, candidate or position.
2. **Source triangulation:** official source + counterpoint when available.
3. **Method transparency:** collection and synthesis criteria documented and open.
4. **Right of reply:** corrections via public issues, recorded in `historico`.
5. **Open auditing:** code and raw data verifiable by anyone.

The LLM only **synthesizes what is in the sources** — it never makes claims outside of them.

## License

MIT