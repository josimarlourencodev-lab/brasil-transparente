# Architecture — Overview

Brasil Transparente is a **monorepo** with three main pieces: ingestion (Python), web (Next.js) and mobile (Expo), backed by Supabase (database + storage) and AI/TTS services.

```
┌─────────────────────────────┐
│  EXTERNAL SOURCES           │
│  feeds.json / RSS_* /       │
│  Google News (by term)      │
└─────────────┬───────────────┘
              │ collect
              ▼
┌─────────────────────────────┐      ┌──────────────────────┐
│  INGESTION (Python)         │      │  GitHub Actions      │
│  crawlers → sanitize →      │      │  ci / ingest /       │
│  LLM synthesis (JSON) →     ├─────►│  podcast             │
│  upsert                     │      └──────────────────────┘
└─────────────┬───────────────┘
              │ writes
              ▼
┌─────────────────────────────┐      ┌──────────────────────┐
│  SUPABASE (Postgres + RLS)  │◄─────┤  WEB (Next.js)       │
│  noticias/politicos/...     │ reads│  lists, details,     │
│  + Storage (podcast)        │      │  /admin, public API  │
└─────────────┬───────────────┘      └──────────────────────┘
              │ reads (anon key)
              ▼
        ┌─────────────────────────────┐
        │  MOBILE (Expo)              │
        │  lists, details, podcast    │
        └─────────────────────────────┘
```

## Components and responsibilities

| Component | Path | Role |
|-----------|---------|-------|
| Ingestion | `scripts/` | Collects, sanitizes, synthesizes and persists news |
| Scheduler | `scripts/worker.py` | Triggers ingestion periodically |
| Synthesis | `scripts/synthesizer.py` | Neutral LLM with structured JSON output |
| Podcast | `scripts/podcast.py` | Script + narration (TTS) + audio/thumbnail upload |
| Web | `src/` | Next.js: pages, API, admin, PWA |
| Mobile | `apps/mobile/` | Expo: React Native app consuming the same API |
| Database | `supabase/schema.sql` | Postgres + RLS + Storage |
| CI/CD | `.github/workflows/` | Tests, scheduled ingestion, weekly podcast |

## Data flow per news item

1. **Collection** — crawlers fetch RSS/Atom feeds and politician-targeted searches.
2. **Deduplication and cleanup** — removes duplicates by `url`; sanitizes HTML (anti-XSS).
3. **Source classification** — `oficial` (official), `oposicao` (opposition), `imprensa` (press) or `desconhecida` (unknown).
4. **Neutral synthesis (LLM)** — generates `resumo` (summary), `categoria` (category), `envolvidos` (people involved), `contradicao` (contradiction) and `relevante` (relevance).
5. **Relevance filter** — items with `relevante: false` (celebrities/sports/entertainment) are **discarded**.
6. **Persistence** — `upsert` into `noticias` with `status='publicado'` (respecting public RLS read).

## Data flow per podcast episode (weekly)

1. Fetches published/synthesized news from the last 7 days.
2. LLM (dedicated model) generates a PT-BR script of 15–18 min (10–12 chapters).
3. `edge-tts` converts the script into MP3.
4. Pillow generates the **thumbnail** (JPEG 1200×675).
5. Uploads MP3 + thumbnail to the public `podcast` bucket (Storage).
6. Records in `podcast_episodios` with `audio_url` and `thumb_url`.

## Key architecture decisions

- **Low complexity** — no microservices; a monorepo with simple, well-separated processes.
- **Neutrality** — the LLM has explicit constraints in the prompt; every claim must come from the sources.
- **Security** — writes only via `service_role`/internal REST; the web/mobile client uses the `anon` key with RLS.
- **Autonomy** — everything runs on a schedule (GitHub Actions / APScheduler), with optional human auditing.