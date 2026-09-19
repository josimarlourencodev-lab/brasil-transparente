# Database (Supabase)

Postgres + PostgREST with **Row Level Security (RLS)**. The schema is in `supabase/schema.sql` for the core; the podcast table was created via the Supabase Management API (it is not in that file).

## Main tables

### `politicos`

Monitored politicians (e.g. 2026 presidential candidates) with biography and search terms.

### `noticias`

Collected and synthesized news articles.

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigserial | PK |
| `titulo` | text | |
| `url` | text | **unique** (dedupe) |
| `resumo` | text | AI-synthesized summary |
| `categoria` | text | one of the predefined categories |
| `tipo_fonte` | text | `oficial` \| `oposicao` \| `imprensa` \| `desconhecida` |
| `status` | text | `rascunho` (draft) \| `revisao` (review) \| `publicado` (published) \| `rejeitado` (rejected) |
| `contradicao_detectada` | bool | |
| `contradicao_descricao` | text | |
| `metadata` | jsonb | `envolvidos`, `contradicao_referencias`, `status_sintese` |
| `politico_id` | bigint | FK → `politicos` |

### `fontes`

Primary sources associated with each news item.

### `categorias`

Editorial categories.

### `historico`

Past statements/positions per politician (the basis for detecting contradictions).

### `audit_log`

Operations log for auditing.

### `podcast_episodios`

Weekly podcast episodes.

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | PK |
| `titulo` | text | |
| `descricao` | text | |
| `roteiro` | text | full episode script |
| `audio_url` | text | public URL in Storage |
| `duracao_seg` | integer | |
| `publicado_em` | timestamptz | |
| `criado_em` | timestamptz | |
| `thumb_url` | text | public thumbnail in Storage |

> The `thumb_url` column was added later via the Management API.

## Storage (buckets)

| Bucket | Public | Allowed mimes | Usage |
|--------|---------|---------------|-------|
| `podcast` | yes | `audio/mpeg`, `audio/wav`, `audio/ogg`, `image/jpeg` | Episodes' MP3s and thumbnails |

## Security / RLS

- **Public read:** only `status='publicado'` (per-table policies).
- **Writes:** only via `service_role` (internal REST) — the web/mobile client uses the `anon` key without write permission.
- The **`pg_trgm`** extension is enabled for advanced text search (future).

## Operating the database

- **Schema:** apply `supabase/schema.sql` to Supabase Cloud (SQL Editor).
- **Maintenance queries via Management API:**
  ```
  POST https://api.supabase.com/v1/projects/<PROJECT_REF>/database/query
  Authorization: Bearer <PAT>
  { "query": "..." }
  ```
- **REST:** `https://<ref>.supabase.co/rest/v1` with `apikey`/`Bearer <service_role>` for writing.