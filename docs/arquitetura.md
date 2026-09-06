# Arquitetura — Visão geral

O Brasil Transparente é um **monorepo** com três peças principais: ingestão (Python), web (Next.js) e mobile (Expo), apoiadas no Supabase (banco + storage) e em serviços de IA/TTS.

```
┌─────────────────────────────┐
│  FONTES EXTERNAS            │
│  feeds.json / RSS_* /       │
│  Google News (por termo)    │
└─────────────┬───────────────┘
              │ coleto
              ▼
┌─────────────────────────────┐      ┌──────────────────────┐
│  INGESTÃO (Python)          │      │  Github Actions      │
│  crawlers → sanitize →      │      │  ci / ingest /       │
│  síntese LLM (JSON) → upsert├─────►│  podcast             │
└─────────────┬───────────────┘      └──────────────────────┘
              │ writes
              ▼
┌─────────────────────────────┐      ┌──────────────────────┐
│  SUPABASE (Postgres + RLS)  │◄─────┤  WEB (Next.js)       │
│  noticias/politicos/...     │ reads│  listas, detalhes,   │
│  + Storage (podcast)        │      │  /admin, API pública │
└─────────────┬───────────────┘      └──────────────────────┘
              │ reads (key anon)
              ▼
        ┌─────────────────────────────┐
        │  MOBILE (Expo)              │
        │  listas, detalhes, podcast  │
        └─────────────────────────────┘
```

## Componentes e responsabilidades

| Componente | Caminho | Papel |
|-----------|---------|-------|
| Ingestão | `scripts/` | Coleta, sanitiza, sintetiza e persiste notícias |
| Scheduler | `scripts/worker.py` | Dispara a ingestão periodicamente |
| Síntese | `scripts/synthesizer.py` | LLM neutro com saída JSON estruturada |
| Podcast | `scripts/podcast.py` | Roteiro + narração (TTS) + upload de áudio/thumb |
| Web | `src/` | Next.js: páginas, API, admin, PWA |
| Mobile | `apps/mobile/` | Expo: app React Native consumindo a mesma API |
| Banco | `supabase/schema.sql` | Postgres + RLS + Storage |
| CI/CD | `.github/workflows/` | Testes, ingestão agendada, podcast semanal |

## Fluxo de dados por notícia

1. **Coleta** — crawlers buscam feeds RSS/Atom e buscas dirigidas por político.
2. **Dedupe e limpeza** — remove duplicados por `url`; sanitiza HTML (anti-XSS).
3. **Classificação de fonte** — `oficial`, `oposicao`, `imprensa` ou `desconhecida`.
4. **Síntese neutra (LLM)** — gera `resumo`, `categoria`, `envolvidos`, `contradicao` e `relevante`.
5. **Filtro de relevância** — itens com `relevante: false` (celebridades/esportes/entretenimento) são **descartados**.
6. **Persistência** — `upsert` em `noticias` com `status='publicado'` (respeitando RLS público de leitura).

## Fluxo de dados por episódio de podcast (semanal)

1. Busca notícias publicadas/sintetizadas dos últimos 7 dias.
2. LLM (modelo dedicado) gera roteiro PT-BR de 15-18 min (10-12 capítulos).
3. `edge-tts` converte o roteiro em MP3.
4. Pillow gera a **thumbnail** (JPEG 1200×675).
5. Upload de MP3 + thumbnail ao bucket público `podcast` (Storage).
6. Registro em `podcast_episodios` com `audio_url` e `thumb_url`.

## Decisiones-chave de arquitetura

- **Baixa complexidade** — sem microserviços; monorepo com processos simples e bem separados.
- **Neutralidade** — o LLM tem restrições explícitas no prompt; toda afirmação precisa sair das fontes.
- **Segurança** — escrita só via `service_role`/REST interno; cliente web/mobile usa chave `anon` com RLS.
- **Autonomia** — tudo roda por agendamento (GitHub Actions / APScheduler), com auditoria humana opcional.
