# Podcast semanal

Episódio semanal com os destaques monitorados, narrado em PT-BR de forma neutra, com referência às fontes. Gerado automaticamente por `scripts/podcast.py` via GitHub Actions (`podcast.yml`).

## Fluxo

1. **Busca** as notícias publicadas e sintetizadas dos últimos 7 dias.
2. **Roteiro**: LLM dedicado (`PODCAST_LLM_MODEL`, padrão `openai/gpt-oss-120b`) gera roteiro PT-BR de 15-18 min (2200-2600 palavras) em formato de abertura, 10-12 capítulos e encerramento.
3. **Narração**: `edge-tts` (voz `pt-BR-FranciscaNeural` por padrão) converte o roteiro em MP3 — gratuito, sem custo de cota da Groq.
4. **Thumbnail**: Pillow gera um JPEG **1200×675** com a paleta do site (`#0F4C81` / `#C8102E`) e o título centralizado.
5. **Upload** do MP3 + thumbnail ao bucket público `podcast` do Supabase Storage.
6. **Registro** em `podcast_episodios` com `audio_url` e `thumb_url`.

## Configuração

| Variável | Padrão | Notas |
|----------|--------|-------|
| `PODCAST_LLM_MODEL` | `openai/gpt-oss-120b` | Roteiro |
| `PODCAST_VOICE` | `pt-BR-FranciscaNeural` | voz edge-tts |
| `PODCAST_DAYS` | `7` | janela de dias |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | — | escrita/upload |

## Thumbnail

- Função `_gerar_thumb(titulo)` — gera a capa.
- Função `_upload_thumb` — envia para `podcast/<data>.jpg` (upsert).
- **Backfill**: episódios existentes tiveram a thumb publicada e `thumb_url` preenchido retroativamente.
- **Tolerância a falha**: a falha na thumb **não bloqueia** a publicação do episódio (try/except).

## Exibição

- **Site** (`/podcast`): thumbnail à esquerda do card do episódio.
- **Mobile**: thumbnail no card e como **arte da tela de bloqueio/notificação** (lock screen) durante a reprodução.

## Storage

- Bucket público `podcast`.
- Mimes permitidos: `audio/mpeg`, `audio/wav`, `audio/ogg`, `image/jpeg`.
- Padrão de nome: data do episódio, ex.: `2026-09-05.mp3` e `2026-09-05.jpg`.
