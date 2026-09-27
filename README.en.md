# Brasil Transparente

An autonomous, neutral and independent portal for continuous monitoring of Brazil's political record, with traceable evidence and citation of primary sources.

> **Languages:** [Read in English](README.en.md) · [Leia em Português](README.md)

> **Full documentation (GitHub Pages):** <https://josimarlourencodev-lab.github.io/brasil-transparente> — architecture, database, data ingestion pipeline, AI synthesis, podcast, mobile, deploy, security and operations.

---

## Overview

Brasil Transparente builds and preserves a **contextualized record** of Brazilian politicians — past cases, previous positions and contradictions — by cross-referencing official sources and opposition channels. The goal is to ensure visibility and accountability beyond electoral cycles, through a public, searchable, and auditable archive.

The system operates on three complementary fronts:

- **Autonomous ingestion** — an asynchronous, cron-triggered pipeline that collects news from RSS/Atom feeds, applies injection-resistant sanitization, synthesizes content via LLM, and persists the data to Postgres.
- **Web and mobile presence** — Next.js (PWA) and Expo/React Native consuming the same public API, with an `/admin` panel for optional human auditing.
- **Continuous publishing** — a weekly AI-generated podcast (script + TTS narration + media upload) integrated into the portal and the mobile app.

### Principles

- **Neutrality:** no partisan alignment; the LLM is instructed to synthesize only what the sources state, without value judgments — official and opposition sources are presented side by side.
- **Autonomy:** headless operation (cron-triggered background workers + LLM), with optional human auditing via the `/admin` panel.
- **Accessibility:** free and open source, including a mobile app (PWA + Expo).
- **Verifiability:** every article references primary sources; contradictions are recorded factually in `metadata` (jsonb).

---

## Architecture

```
                          ┌──────────────────────────────┐
                          │         EXTERNAL SOURCES       │
                          │  feeds.json / RSS_* /          │
                          │  Google News RSS (per term)    │
                          └──────────────┬───────────────┘
                                         │ crawl (polite crawler)
                                         ▼
        ┌──────────────────────────────────────────────────────┐
        │  INGESTION PIPELINE (Python 3.13)                    │
        │  crawlers → dedupe → sanitize (anti-XSS)             │
        │  → source classification → LLM synthesis (JSON)      │
        │  → transactional upsert (SECURITY DEFINER RPC)       │
        └─────────────────────────────────┬────────────────────┘
                                          │ persist
                                          ▼
        ┌──────────────────────────────────────────────────────┐
        │  SUPABASE (Postgres + RLS + Storage)                 │
        │  noticias, politicos, historico, podcast, llm_usage  │
        └───────▲──────────────────────────┬───────────────────┘
                │ read (anon key + RLS)     │ read (anon key + RLS)
                ▼                          ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  WEB (Next.js)   │      │  MOBILE (Expo)   │
        │  lists detail    │      │  lists detail    │
        │  /admin /podcast │      │  podcast player  │
        └──────────────────┘      └──────────────────┘
```

### Components and responsibilities

| Component | Path | Role |
|-----------|---------|-----|
| Ingestion | `scripts/ingest.py` | Pipeline orchestrator (crawl, dedupe, sanitize, synthesize, persist) |
| Scheduler | `scripts/worker.py` | APScheduler daemon — triggers ingestion at configurable intervals |
| Synthesis | `scripts/synthesizer.py` | Neutral LLM with structured JSON output + persisted daily token budget |
| Crawlers | `scripts/crawlers/` | Resilient RSS/Atom parser, retries with backoff, per-category source registry |
| Sanitization | `scripts/sanitize.py` | Injection-resistant layer applied to every external input before persistence |
| Podcast | `scripts/podcast.py` | Script generation (LLM), TTS narration (edge-tts), thumbnail and media upload |
| Politician dossier | `scripts/ficha.py` | Structured synthesis of each politician's documented record |
| Web | `src/` | Next.js (App Router): pages, public API, admin panel, PWA |
| Mobile | `apps/mobile/` | Expo / React Native consuming the same API + background podcast player |
| Database | `supabase/` | Schema, migrations and grants — Postgres with RLS and Storage |
| CI/CD | `.github/workflows/` | Tests, dependency audit, scheduled ingestion, build and publishing |

---

## Tech Stack

| Layer | Technology |
|--------|-----------|
| Web | Next.js 16 (App Router) + React 19 + Tailwind CSS, PWA |
| Mobile | Expo / React Native (`apps/mobile`) |
| Data backend | Supabase (Postgres) + local PostgREST via Docker Compose |
| Ingestion | Python 3.13 — hashed lockfile (`pip --require-hashes`) |
| AI synthesis | Multi-provider LLM: Groq / Together AI / Google Gemini / OpenRouter |
| Podcast | edge-tts (narration) + Pillow (thumbnail) + Supabase Storage |
| CI/CD | GitHub Actions — OSV SCA, pytest, Vitest, ESLint, typecheck, build |
| Deploy | Vercel (production/preview) + GitHub Pages (documentation) |

---

## Prerequisites

- **Docker** with the **Compose v2** plugin (containerized local environment).
- **Python 3.13+** (to generate development credentials and run ingestion locally).
- **Node.js ≥ 22** with **pnpm ≥ 11** (via `corepack enable`).
- A **Supabase** account (Cloud project) for production; locally, Postgres + PostgREST run in Docker.

---

## Local Setup (Docker)

The containerized environment brings up four isolated services: Postgres, a PostgREST API, a dev web server (hot-reload) and an ingestion worker.

```bash
# 1. Generate JWT/anon/service_role credentials + ADMIN_PASSWORD (unversioned)
python3 scripts/security/dev_tokens.py

# 2. Bring up the stack: Postgres + PostgREST API (:54321) + web (:3000) + worker
docker compose up -d --build

# 3. Run the suite inside the web container
docker compose exec web pnpm test
docker compose exec web pnpm run typecheck
docker compose exec web pnpm run lint
```

Local endpoints:

| Service | Address |
|---------|----------|
| Web app | `http://localhost:3000` |
| PostgREST API | `http://localhost:54321` |
| `/admin` panel | `http://localhost:3000/admin` |
| Postgres | `localhost:5432` (Compose port mapping) |

### Development without Docker

```bash
cp .env.local.example .env.local   # fill in the keys (NEXT_PUBLIC_SUPABASE_URL, anon key, etc.)
python3 -m venv .venv && source .venv/bin/activate
pip install --require-hashes -r scripts/requirements.lock.txt
pnpm install
pnpm run dev
```

### Database provisioning

- **Production (Supabase Cloud):** apply `supabase/schema.sql` in the SQL Editor, then run the migrations in `supabase/migrations/` in numeric order — they create the `SECURITY DEFINER` RPC functions and apply the grants.
- **Local (Docker):** Postgres is initialized with `supabase/schema.sql` + `supabase/init-dev.sql` automatically via the `docker-entrypoint-initdb.d/` volumes.

---

## Data Ingestion Pipeline

```
feeds.json / env RSS_* → polite crawler (RSS/Atom, retries with backoff)
→ URL dedupe → sanitization (anti-XSS) → source classification
→ LLM synthesis (summary/category/people/contradictions, structured JSON)
→ transactional upsert into noticias (SECURITY DEFINER RPC via anon key)
```

Steps executed by `scripts/ingest.py`:

1. **Crawl** — crawlers fetch the feeds registered in `scripts/feeds.json` (or `RSS_*` env vars) with timeouts, inter-request delays and retries with backoff; politician-targeted searches are composed as per-term Google News RSS feeds.
2. **Dedupe** — removes duplicates by canonical URL.
3. **Sanitization** — blocks `<script>`, `javascript:` URIs, CR/LF header injection and unescaped entities.
4. **Source classification** — `oficial`, `oposicao`, `imprensa`, or `desconhecida`.
5. **Neutral synthesis (LLM)** — produces `resumo`, `categoria`, `envolvidos`, `contradicao`, and `relevante`; items outside the monitored scope are flagged `relevante: false` and dropped from publication.
6. **Persistence** — `upsert` into `noticias` with `status='publicado'`, honoring the public-read RLS policy.

### Scheduling

- GitHub Actions `ingest.yml` — cron `0 */6 * * *` (4×/day), with `workflow_dispatch` for manual runs (`--dry-run`, `--sources`).
- Local worker `scripts/worker.py` — APScheduler, interval via `INGEST_INTERVAL_MINUTOS`.

---

## AI Synthesis (LLM) and Token Budget

`scripts/synthesizer.py` is a multi-provider client (Groq, Together AI, Google Gemini, OpenRouter) using OpenAI-compatible or native APIs. Highlights:

- **Structured output:** validated JSON with `resumo`, `categoria`, `envolvidos`, `contradicao_referencias`, and `relevante`.
- **Resilient rate limiting:** inter-request pauses, `429` handling honoring `Retry-After`, and exponential backoff.
- **Daily token budget:** `LLM_DAILY_BUDGET` (default 180,000/24h) with `MAX_SYNTHESIS_PER_RUN` per execution — consumption is persisted to Supabase (table `llm_usage` via a `SECURITY DEFINER` RPC), preventing daily quorum exhaustion on free tiers.
- **Editorial neutrality:** the system prompt forbids value judgments; the module synthesizes only what the sources state and cross-checks against `historico` to flag factual contradictions.

---

## Podcast Pipeline (weekly)

`scripts/podcast.py` + GitHub Actions `podcast.yml` (cron `0 7 * * 1`):

1. Selects news published/synthesized in the last 7 days.
2. A dedicated LLM writes a 15–18 min PT-BR script (10–12 chapters).
3. `edge-tts` renders the script to MP3.
4. Pillow renders the thumbnail (JPEG 1200×675).
5. Uploads MP3 + thumbnail to the public `podcast` bucket (Supabase Storage).
6. Writes a `podcast_episodios` row with `audio_url` and `thumb_url` (via a `SECURITY DEFINER` RPC).

---

## Database

Central schema in `supabase/schema.sql`; incremental evolution in `supabase/migrations/`.

| Table | Purpose |
|--------|-----------|
| `politicos` | Monitored candidates, party, role, search terms and biography |
| `noticias` | Collected articles with `status`, `categoria`, `tipo_fonte`, `publicado_em`, `metadata` (jsonb) and `contradicao_*` |
| `fontes` | Register of primary sources per category |
| `categorias` | Taxonomy of monitored categories |
| `historico` | Long-term record of cases, positions and contradictions per politician |
| `audit_log` | Audit trail (who changed what and when) |
| `podcast_episodios` | Generated episodes with `audio_url` and `thumb_url` |
| `ficha_politico` | Structured dossier of each politician's documented record |
| `llm_usage` | Daily token consumption for the LLM budget |

### Access control

- **Row-Level Security (RLS)** is enabled across tables; a public-read policy exposes only `status='publicado'` rows in `noticias`.
- **Restricted writes:** web/mobile clients use the **anon key**; all writes are performed exclusively through `SECURITY DEFINER` RPC functions (`upsert_noticia`, `record_llm_usage`, `registrar_episodio`, `substituir_ficha`) that run as the table owner, preventing direct access to the data layer.

---

## Security

The project applies **software supply chain security** practices and pipeline hardening:

- **Reproducible dependency pinning:** `scripts/requirements.lock.txt` with hashes (`pip install --require-hashes`) and a frozen `pnpm-lock.yaml` (`--frozen-lockfile` in CI).
- **Static dependency auditing (SCA):** `scripts/security/check_osv.py` queries the **OSV.dev** database (GitHub Advisory / PyPA) and returns a CI-friendly exit code; `scripts/security/check_deps.py` validates artifact authenticity; `pnpm audit --audit-level=high` for the Node ecosystem.
- **Local audit routines:** `scripts/security/audit_python.sh` and `scripts/security/audit_node.sh`.
- **Input sanitization:** `scripts/sanitize.py` blocks `<script>`, `javascript:` URIs, and CR/LF header injection.
- **Secrets management:** never committed; injected as GitHub Actions secrets and Vercel env vars.
- **`/admin` authentication:** `ADMIN_PASSWORD`, HttpOnly cookie and constant-time comparison.
- **Least-privilege CI:** scoped `contents: read` permissions and per-job timeouts.

---

## Tests

```bash
# Python — unit + integration + resilience (offline, with mocks)
python3 -m pytest

# Frontend — Vitest
pnpm test

# Static quality gates
pnpm typecheck
pnpm lint
```

The full suite runs in CI (`ci.yml`) and is a merge requirement. Contribution flow follows `develop` → PR → merge → propagation to `main`.

---

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|-----------|
| `ci.yml` | push/PR | OSV audit + pytest + Vitest + ESLint + typecheck + build |
| `ingest.yml` | cron `0 */6 * * *` + manual | News ingestion with repository secrets |
| `podcast.yml` | cron `0 7 * * 1` + manual | Weekly episode generation and publishing |
| `check_llm_usage.yml` | manual | Verifies token budget persistence in Supabase |
| `docs.yml` | push | Publishes the documentation to GitHub Pages |
| `db_migrate.yml` | manual | Applies DB migrations (requires `SUPABASE_DB_URL`) |

**Deploy:** pushes to `main` publish production to Vercel automatically; documentation goes to GitHub Pages.

### GitHub secrets

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `RSS_FEEDS_OFICIAIS`, `RSS_FEEDS_IMPRENSA`, `RSS_FEEDS_INDEPENDENTES`.

---

## Mobile

```bash
cd apps/mobile
pnpm install
npx expo start
```

Consumes the same public API (anon key + RLS); URLs are configurable in `apps/mobile/app.json → expo.extra`. Includes a background podcast player with lock-screen artwork (Android/iOS) and dark mode.

Production: signed APK published via GitHub releases (see `docs/mobile.md` and `docs/en/mobile.md`).

---

## Roadmap

Current status and priorities in [`ROADMAP.md`](ROADMAP.md). Upcoming iterations:

- **Deep historical search / backfill** — retrospective collection feeding `historico` (outside the daily ingestion cycle).
- **Custom domain** `brasiltransparente.com.br` on Vercel.
- **Advanced full-text search** with `pg_trgm` (already enabled in the schema).
- **Automatic contradiction suggestions** between official and opposition sources.

---

## Code of Conduct

1. **No partisan bias** — no support for or attack against any party, candidate or position.
2. **Source triangulation** — official source plus counterpoint when available.
3. **Method transparency** — collection and synthesis criteria documented and open.
4. **Right of reply** — corrections via public issues, recorded in `historico`.
5. **Open auditing** — code and raw data verifiable by anyone.

The LLM only **synthesizes what is in the sources** — it never makes claims outside of them.

---

## License

MIT