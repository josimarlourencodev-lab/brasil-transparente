# Ingestion (Python)

Autonomous pipeline that collects, cleans, synthesizes and publishes news. Run by a cron in GitHub Actions (default 4×/day) and/or by the APScheduler worker.

## Pipeline

```
feeds.json / env RSS_* → crawlers (RSS/Atom, retries)
  → dedupe → sanitize (anti-XSS) → source type
  → LLM synthesis (summary/category/people/contradiction/relevance)
  → relevance filter → upsert into Postgres
```

## Files

| File | Role |
|---------|-------|
| `scripts/ingest.py` | Orchestrator. Flags: `--dry-run`, `--sources`, `--limit` |
| `scripts/worker.py` | APScheduler scheduler (interval via `INGEST_INTERVAL_MINUTOS`) |
| `scripts/crawlers/` | Base (parser + resilience) + source registry per category |
| `scripts/synthesizer.py` | Neutral synthesis with structured JSON and contradiction detection |
| `scripts/sanitize.py` | Anti-XSS layer before persistence |
| `scripts/security/` | Dependency audit (OSV) and dev token generation |

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — writes to the database.
- `LLM_API_KEY`, `LLM_PROVIDER` (default `groq`) — synthesis.
- `LLM_MODEL` — daily synthesis model.
- `RSS_FEEDS_OFICIAIS`, `RSS_FEEDS_IMPRENSA`, `RSS_FEEDS_INDEPENDENTES` — sources.
- `MAX_SYNTHESIS_PER_RUN` (default `80`) — AI call ceiling per run.
- `INGEST_INTERVAL_MINUTOS` (default `360`) — worker interval.

## Relevance filter (off-topic)

The synthesis `SYSTEM_PROMPT` instructs the LLM to mark as **`relevante: false`** any
leisure/entertainment article with no connection to public power:

- **Rock in Rio** and festivals/show music concerts
- **Soccer** and sports in general, championships
- celebrities, famous people, influencers, soap operas, reality shows, pop culture

The following are **kept** (considered in scope):
- articles with a direct connection to Brazilian political monitoring (public
  management, corruption, public policy, elections, actions of parliamentarians
  and public managers, Congress, parties, political justice)
- articles about **international relations, foreign policy and geopolitics**, even
  without a direct mention of Brazilian politicians

When `relevante: false`, the item gets `status_sintese = "fora_do_tema"` and is **ignored at publication time** (`upsert_items` does not insert it). This keeps such content out of the site without deleting what already exists.

## Pipeline security

- **Anti-XSS sanitization:** blocks `<script>`, `javascript:` URIs, and CR/LF header injection.
- **Audited dependencies:** `pip --require-hashes -r scripts/requirements.lock.leve.txt` (checked via `check_deps.py`).
- **AI API rate-limit throttling**, with retry/backoff.