# Entregas por área

Registro detalhado do que foi construído até agora, área por área.

## Web (Next.js)

- Página pública de **notícias**, **políticos** e **detalhe** de cada um, com modo claro/escuro e busca.
- **Página de podcast** (`/podcast`) listando episódios com thumbnail, duração, data e player `<audio>`.
- **API pública** (`/api/noticias`, `/api/politicos`, `/api/podcast/episodios`) servindo dados com RLS público.
- **Painel `/admin`** — login com `ADMIN_PASSWORD` (cookie HttpOnly, comparação em tempo constante), visualização por status e **adição/remoção manual de matérias** (upsert por `url` e `DELETE` por `id`).
- **Página `/pitch`** — apresentação do projeto: 10 slides (1920×1080, paleta `#0F4C81`/`#C8102E`), narração em voz IA (`edge-tts`, PT-BR), player de áudio por slide, **vídeo MP4** pronto com player/download e roteiro com download.
- **Página `/documentacao`** — documentação interna no mesmo Design System (sobre, funcionamento autônomo, metodologia, princípios/código de conduta e acessos), sem sair do portal.
- **Navegação** — "GitHub" (nova aba) e "Documentação" no header; "O Brasil Transparente" (pitch), "Documentação" e "Repositório GitHub" no rodapé.
- **PWA** — manifest e service worker (offline básico).
- **Correções** ao longo do tempo: dark mode, layout responsivo, remoção do link "Painel do auditor" do rodapé.

## Mobile (Expo / React Native — `apps/mobile`)

- Listagem e detalhe de notícias e políticos, com **fotos**, **modo escuro** e ícone/identidade visual.
- **Player de podcast em segundo plano**:
  - Player global reutilizável em `src/lib/audio.ts`.
  - `setAudioModeAsync({ playsInSilentMode, shouldPlayInBackground, interruptionMode })`.
  - `setActiveForLockScreen(true, { title, artist, artworkUrl }, { showSeekBackward, showSeekForward })`.
  - Plugin do `expo-audio` com `enableBackgroundPlayback` no `app.json`.
  - Manifest Android com `AudioControlsService` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK`.
  - Permissão de notificação solicitada no Android 13+.
- **Thumbnail dos episódios** exibida no card (via `expo-image`) e usada como **arte do lock screen**.

## Ingestão (Python)

- **Crawlers**: RSS/Atom genéricos + coleta dirigida por político (Google News RSS por termo).
- **Pipeline**: feed → crawler → dedupe → sanitize (anti-XSS) → tipo de fonte → síntese LLM → upsert.
- **`worker.py`**: agendador APScheduler (intervalo configurável por env).
- **Restrição de tema**: o prompt de síntese marca como `relevante: false` matérias de celebridades/famosos/esportes/futebol/entretenimento/novelas/shows; itens fora do tema **não são publicados**.

## Síntese por IA

- LLM (Groq/Together/Gemini) gera JSON estruturado: `resumo`, `categoria`, `envolvidos`, `contradicao`.
- **Neutralidade**: proibição explícita de adjetivos valorativos, opinião ou julgamento moral.
- **Contradições**: compara com histórico de afirmações passadas e aponta contradições factuais com referências.

## Podcast semanal

- **Roteiro** gerado por um modelo LLM próprio (separado do modelo de síntese diária).
- **Narração** PT-BR via `edge-tts` (gratuito, rede MS Edge).
- **Upload** do MP3 + thumbnail ao bucket público `podcast` do Supabase Storage.
- **Registro** em `podcast_episodios` com `titulo`, `roteiro`, `audio_url`, `thumb_url`, duração e data.
- **Geração de thumbnail** automática (Pillow, JPEG 1200×675, paleta do site `#0F4C81`/`#C8102E`).

## Banco de dados (Supabase)

- Tabelas: `politicos`, `noticias`, `fontes`, `categorias`, `historico`, `audit_log` e `podcast_episodios`.
- RLS ativo: leitura pública apenas para `status='publicado'`; escrita somente via `service_role`.
- Extensão `pg_trgm` habilitada (busca avançada futura).

## CI/CD

- **`ci.yml`** — OSV audit, pytest, Vitest, lint, typecheck, build (push/PR).
- **`ingest.yml`** — ingestão agendada com secrets do repositório.
- **`podcast.yml`** — geração semanal do podcast com verificação de dependências auditadas.
