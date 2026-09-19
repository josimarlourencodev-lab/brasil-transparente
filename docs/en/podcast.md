# Weekly podcast

A weekly episode with the monitored highlights, narrated neutrally in PT-BR, referencing the sources. Generated automatically by `scripts/podcast.py` via GitHub Actions (`podcast.yml`).

## Flow

1. **Fetches** the published and synthesized news from the last 7 days.
2. **Script:** a dedicated LLM (`PODCAST_LLM_MODEL`, default `openai/gpt-oss-120b`) generates a PT-BR 15–18 min script (2200–2600 words) in the format of an opening, 10–12 chapters and a closing.
3. **Narration:** `edge-tts` (voice `pt-BR-FranciscaNeural` by default) converts the script into MP3 — free, at no cost to the Groq quota.
4. **Thumbnail:** Pillow generates a **1200×675** JPEG with the site's palette (`#0F4C81` / `#C8102E`) and the centered title.
5. **Upload** of the MP3 + thumbnail to the public `podcast` bucket on Supabase Storage.
6. **Record** in `podcast_episodios` with `audio_url` and `thumb_url`.

## Configuration

| Variable | Default | Notes |
|----------|--------|-------|
| `PODCAST_LLM_MODEL` | `openai/gpt-oss-120b` | Script |
| `PODCAST_VOICE` | `pt-BR-FranciscaNeural` | edge-tts voice |
| `PODCAST_DAYS` | `7` | days window |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | — | writes/upload |

## Thumbnail

- `_gerar_thumb(titulo)` function — generates the cover.
- `_upload_thumb` function — uploads to `podcast/<data>.jpg` (upsert).
- **Backfill:** existing episodes had the thumbnail published and `thumb_url` filled in retroactively.
- **Fault tolerance:** a thumbnail failure **does not block** the episode publication (try/except).

## Display

- **Site** (`/podcast`): thumbnail on the left of the episode card.
- **Mobile:** thumbnail in the card and as **lock screen/notification artwork** during playback.

## Storage

- Public `podcast` bucket.
- Allowed mimes: `audio/mpeg`, `audio/wav`, `audio/ogg`, `image/jpeg`.
- Naming pattern: episode date, e.g. `2026-09-05.mp3` and `2026-09-05.jpg`.