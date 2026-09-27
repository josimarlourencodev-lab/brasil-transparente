# Brasil Transparente

Portal autônomo, neutro e independente de monitoramento contínuo do histórico político do Brasil, com evidência rastreável e citação de fontes primárias.

> **Idiomas:** [Read in English](README.en.md) · [Leia em Português](README.md)

> **Documentação completa (GitHub Pages):** <https://josimarlourencodev-lab.github.io/brasil-transparente> — arquitetura, banco de dados, pipeline de ingestão, síntese por IA, podcast, mobile, deploy, segurança e operação.

---

## Visão Geral

O Brasil Transparente constrói e preserva um **histórico contextualizado** de políticos brasileiros — casos antigos, posições passadas e contradições — cruzando fontes oficiais e canais de oposição. O objetivo é garantir visibilidade e accountability para além dos ciclos eleitorais, por meio de um arquivo público, pesquisável e auditável.

O sistema opera em três frentes complementares:

- **Ingestão autônoma** — pipeline assíncrono e agendado (cron jobs) que coleta notícias de feeds RSS/Atom, aplica sanitização anti-injeção, sintetiza conteúdo por LLM e persiste os dados em Postgres.
- **Presença Web e Mobile** — Next.js (PWA) e Expo/React Native consumindo a mesma API pública, com painel `/admin` para auditoria humana.
- **Publicação contínua** — podcast semanal gerado por IA (roteiro + narração TTS + upload de mídia), integrado ao portal e ao app mobile.

### Princípios

- **Neutralidade:** sem alinhamento partidário; o LLM é instruído a sintetizar apenas o que consta nas fontes, sem juízo de valor — fontes oficiais e de oposição são apresentadas lado a lado.
- **Autonomia:** operação headless (cron-triggered background workers + LLM), com auditoria humana opcional via painel `/admin`.
- **Acessibilidade:** software livre e gratuito, incluindo aplicativo mobile (PWA + Expo).
- **Verificabilidade:** toda matéria referencia fontes primárias; contradições são registradas de forma factual em `metadata` (jsonb).

---

## Arquitetura

```
                          ┌──────────────────────────────┐
                          │         FONTES EXTERNAS       │
                          │  feeds.json / RSS_* /         │
                          │  Google News RSS (por termo)  │
                          └──────────────┬───────────────┘
                                         │ coleta (polite crawler)
                                         ▼
        ┌──────────────────────────────────────────────────────┐
        │  PIPELINE DE INGESTÃO (Python 3.13)                  │
        │  crawlers → dedupe → sanitize (anti-XSS)             │
        │  → classificação de fonte → síntese LLM (JSON)       │
        │  → upsert transacional (RPC SECURITY DEFINER)        │
        └─────────────────────────────────┬────────────────────┘
                                          │ persiste
                                          ▼
        ┌──────────────────────────────────────────────────────┐
        │  SUPABASE (Postgres + RLS + Storage)                 │
        │  noticias, politicos, historico, podcast, llm_usage  │
        └───────▲──────────────────────────┬───────────────────┘
                │ leitura (anon key + RLS)  │ leitura (anon key + RLS)
                ▼                          ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  WEB (Next.js)   │      │  MOBILE (Expo)   │
        │  listas detalhe  │      │  listas detalhe  │
        │  /admin /podcast │      │  player podcast  │
        └──────────────────┘      └──────────────────┘
```

### Componentes e responsabilidades

| Componente | Caminho | Papel |
|-----------|---------|-------|
| Ingestão | `scripts/ingest.py` | Orquestrador do pipeline (coleta, dedupe, sanitização, síntese, persistência) |
| Scheduler | `scripts/worker.py` | Agendador APScheduler — dispara a ingestão em intervalos configuráveis |
| Síntese | `scripts/synthesizer.py` | LLM neutro com saída JSON estruturada + orçamento diário de tokens persistido |
| Crawlers | `scripts/crawlers/` | Parser RSS/Atom resiliente, retries com backoff e registro de fontes por categoria |
| Sanitização | `scripts/sanitize.py` | Camada anti-injeção aplicada a toda entrada externa antes da persistência |
| Podcast | `scripts/podcast.py` | Geração de roteiro (LLM), narração TTS (edge-tts), thumbnail e upload de mídia |
| Ficha política | `scripts/ficha.py` | Síntese estruturada do histórico judicial/administrativo por político |
| Web | `src/` | Next.js (App Router): páginas, API pública, painel admin, PWA |
| Mobile | `apps/mobile/` | Expo / React Native consumindo a mesma API + player de podcast em background |
| Banco | `supabase/` | Schema, migrations e grants — Postgres com RLS e Storage |
| CI/CD | `.github/workflows/` | Testes, auditoria de dependências, ingestão agendada, build e publicação |

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Web | Next.js 16 (App Router) + React 19 + Tailwind CSS, PWA |
| Mobile | Expo / React Native (`apps/mobile`) |
| Banco de dados | Supabase (Postgres) + PostgREST local via Docker Compose |
| Ingestão | Python 3.13 — lockfile com hashes (`pip --require-hashes`) |
| Síntese por IA | Multi-provider LLM: Groq / Together AI / Google Gemini / OpenRouter |
| Podcast | edge-tts (narração) + Pillow (thumbnail) + Supabase Storage |
| CI/CD | GitHub Actions — OSV SCA, pytest, Vitest, ESLint, typecheck, build |
| Deploy | Vercel (produção/preview) + GitHub Pages (documentação) |

---

## Pré-requisitos

- **Docker** com plugin **Compose v2** (ambiente containerizado local).
- **Python 3.13+** (para gerar credenciais de desenvolvimento e rodar a ingestão localmente).
- **Node.js ≥ 22** com **pnpm ≥ 11** (via `corepack enable`).
- Uma conta **Supabase** (projeto Cloud) para produção; em desenvolvimento local o Postgres + PostgREST rodam via Docker.

---

## Instalação Local (Docker)

O ambiente containerizado sobe quatro serviços isolados: banco Postgres, API PostgREST, web dev (hot-reload) e worker de ingestão.

```bash
# 1. Gera credenciais JWT/anon/service_role + ADMIN_PASSWORD (não versionados)
python3 scripts/security/dev_tokens.py

# 2. Sobe o stack: banco + API PostgREST (:54321) + web (:3000) + worker
docker compose up -d --build

# 3. Executa a suíte dentro do container web
docker compose exec web pnpm test
docker compose exec web pnpm run typecheck
docker compose exec web pnpm run lint
```

Endpoints locais:

| Serviço | Endereço |
|---------|----------|
| Aplicação Web | `http://localhost:3000` |
| API PostgREST | `http://localhost:54321` |
| Painel `/admin` | `http://localhost:3000/admin` |
| Postgres | `localhost:5432` (via pipe do Compose) |

### Desenvolvimento sem Docker

```bash
cp .env.local.example .env.local   # preencha as chaves (NEXT_PUBLIC_SUPABASE_URL, anon key, etc.)
python3 -m venv .venv && source .venv/bin/activate
pip install --require-hashes -r scripts/requirements.lock.txt
pnpm install
pnpm run dev
```

### Provisionamento do banco

- **Produção (Supabase Cloud):** aplique `supabase/schema.sql` no SQL Editor e execute as migrations de `supabase/migrations/` na ordem numérica — elas criam as funções RPC `SECURITY DEFINER` e aplicam os grants.
- **Local (Docker):** o Postgres é inicializado com `supabase/schema.sql` + `supabase/init-dev.sql` automaticamente pelos volumes `docker-entrypoint-initdb.d/`.

---

## Pipeline de Ingestão de Dados

```
feeds.json / env RSS_* → polite crawler (RSS/Atom, retries com backoff)
→ dedupe por URL → sanitização (anti-XSS) → classificação de fonte
→ síntese LLM (resumo/categoria/envolvidos/contradições, JSON estruturado)
→ upsert transacional em noticias (RPC SECURITY DEFINER via anon key)
```

Passos executados por `scripts/ingest.py`:

1. **Coleta** — crawlers buscam os feeds registrados em `scripts/feeds.json` (ou variáveis `RSS_*`), com *timeout*, delay entre requisições e retries com *backoff*; buscas dirigidas por político são montadas como feed do Google News RSS por termo.
2. **Dedupe** — remove duplicatas pela URL canônica.
3. **Sanitização** — bloqueia `<script>`, URIs `javascript:`, injeção de headers via CR/LF e entidades não decodificadas.
4. **Classificação de fonte** — `oficial`, `oposicao`, `imprensa` ou `desconhecida`.
5. **Síntese neutra (LLM)** — gera `resumo`, `categoria`, `envolvidos`, `contradicao` e `relevante`; itens fora do tema monitorado são marcados `relevante: false` e descartados da publicação.
6. **Persistência** — `upsert` em `noticias` com `status='publicado'`, respeitando a política de leitura pública via RLS.

### Agendamento

- GitHub Actions `ingest.yml` — cron `0 */6 * * *` (4×/dia), com `workflow_dispatch` para execução manual (`--dry-run`, `--sources`).
- Worker local `scripts/worker.py` — APScheduler, intervalo via `INGEST_INTERVAL_MINUTOS`.

---

## Síntese por IA (LLM) e Orçamento de Tokens

`scripts/synthesizer.py` é um cliente multi-provider (Groq, Together AI, Google Gemini, OpenRouter) com API OpenAI-compatível ou nativa. Características:

- **Saída estruturada:** JSON validado com `resumo`, `categoria`, `envolvidos`, `contradicao_referencias` e `relevante`.
- **Rate limiting resiliente:** pausa entre chamadas, tratamento de `429` com respeito a `Retry-After` e *exponential backoff*.
- **Orçamento diário de tokens:** limite `LLM_DAILY_BUDGET` (padrão 180.000/24h), com `MAX_SYNTHESIS_PER_RUN` por execução — o consumo é persistido no Supabase (tabela `llm_usage` via RPC `SECURITY DEFINER`), evitando a exaustão de cotas diárias de tier gratuito.
- **Neutralidade editorial:** o *system prompt* proíbe juízo de valor; o módulo apenas sintetiza o que consta nas fontes e cruza com `historico` para apontar contradições factuais.

---

## Pipeline de Podcast (semanal)

`scripts/podcast.py` + GitHub Actions `podcast.yml` (cron `0 7 * * 1`):

1. Seleciona notícias publicadas/sintetizadas dos últimos 7 dias.
2. LLM dedicado gera roteiro PT-BR de 15–18 min (10–12 capítulos).
3. `edge-tts` converte o roteiro em MP3.
4. Pillow renderiza a thumbnail (JPEG 1200×675).
5. Upload de MP3 + thumbnail para o bucket público `podcast` (Supabase Storage).
6. Registro em `podcast_episodios` com `audio_url` e `thumb_url` (via RPC `SECURITY DEFINER`).

---

## Banco de Dados

Schema central em `supabase/schema.sql`; evolução incremental em `supabase/migrations/`.

| Tabela | Finalidade |
|--------|-----------|
| `politicos` | Candidatos monitorados, partido, cargo, termos de busca e biografia |
| `noticias` | Matérias coletadas com `status`, `categoria`, `tipo_fonte`, `publicado_em`, `metadata` (jsonb) e `contradicao_*` |
| `fontes` | Registro das fontes primárias por categoria |
| `categorias` | Taxonomia de categorias monitoradas |
| `historico` | Registro de longo prazo de casos, posições e contradições por político |
| `audit_log` | Trilha de auditoria (quem alterou o quê e quando) |
| `podcast_episodios` | Episódios gerados com `audio_url` e `thumb_url` |
| `ficha_politico` | Ficha estruturada do histórico judicial/administrativo por político |
| `llm_usage` | Consumo diário de tokens para orçamento do LLM |

### Controle de Acesso

- **RLS (Row-Level Security)** habilitado nas tabelas; policy de leitura pública apenas para `status='publicado'` em `noticias`.
- **Escrita restrita:** clientes web/mobile usam a **anon key**; qualquer escrita é feita exclusivamente por **funções RPC** `SECURITY DEFINER` (`upsert_noticia`, `record_llm_usage`, `registrar_episodio`, `substituir_ficha`), que rodam como dono da tabela e impedem acesso direto à folha de dados.

---

## Segurança

O projeto adota práticas de **Supply Chain Security** e hardening de pipeline:

- **Lockfiles com pinning reproduzível:** `scripts/requirements.lock.txt` com hashes (`pip install --require-hashes`) e `pnpm-lock.yaml` congelado (`--frozen-lockfile` no CI).
- **Auditoria estática de dependências (SCA):** `scripts/security/check_osv.py` consulta a base **OSV.dev** (GitHub Advisory / PyPA) e retorna *exit code* para o CI; `scripts/security/check_deps.py` valida autenticidade dos artefatos; `pnpm audit --audit-level=high` para o ecossistema Node.
- **Rotinas de auditoria locais:** `scripts/security/audit_python.sh` e `scripts/security/audit_node.sh`.
- **Sanitização de entrada:** `scripts/sanitize.py` bloqueia `<script>`, URIs `javascript:`, e injeção de headers via CR/LF.
- **Segredos:** nunca versionados; injetados como GitHub Actions secrets e Vercel env vars.
- **Autenticação `/admin`:** senha via `ADMIN_PASSWORD`, cookie HttpOnly e comparação em tempo constante.
- **Runners e ações:** escopo de permissões mínimo (`contents: read`) e timeouts por job.

---

## Testes

```bash
# Python — unit + integração + resiliência (offline, com mocks)
python3 -m pytest

# Frontend — Vitest
pnpm test

# Qualidade estática
pnpm typecheck
pnpm lint
```

A suite completa roda no CI (`ci.yml`) e é condição obrigatória para merge. O fluxo de contribuição segue `develop` → PR → merge → propagação para `main`.

---

## CI/CD

| Workflow | Gatilho | Finalidade |
|----------|---------|-----------|
| `ci.yml` | push/PR | Auditoria OSV + pytest + Vitest + ESLint + typecheck + build |
| `ingest.yml` | cron `0 */6 * * *` + manual | Ingestão de notícias com secrets do repositório |
| `podcast.yml` | cron `0 7 * * 1` + manual | Geração e publicação do episódio semanal |
| `check_llm_usage.yml` | manual | Verifica a persistência do orçamento de tokens no Supabase |
| `docs.yml` | push | Publica a documentação no GitHub Pages |
| `db_migrate.yml` | manual | Aplica migrations no banco (requer `SUPABASE_DB_URL` configurado) |

**Deploy:** pushes em `main` publicam produção na Vercel automaticamente; documentação via GitHub Pages.

### Secrets do GitHub

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `RSS_FEEDS_OFICIAIS`, `RSS_FEEDS_IMPRENSA`, `RSS_FEEDS_INDEPENDENTES`.

---

## Mobile

```bash
cd apps/mobile
pnpm install
npx expo start
```

Consome a mesma API pública (anon key + RLS); URLs configuráveis em `apps/mobile/app.json → expo.extra`. Inclui player de podcast em background com arte de lock screen (Android/iOS) e modo escuro.

Produção: APK assinado publicado via releases do GitHub (ver `docs/mobile.md` e `docs/en/mobile.md`).

---

## Roadmap

Estado atual e prioridades em [`ROADMAP.md`](ROADMAP.md). Próximas iterações:

- **Busca de histórico profundo / matérias antigas** — coleção retrospectiva alimentando `historico` (fora do ciclo de ingestão diário).
- **Domínio próprio** `brasiltransparente.com.br` na Vercel.
- **Busca textual avançada** com `pg_trgm` (já habilitado no schema).
- **Sugestões automáticas de contradição** entre fontes oficiais e de oposição.

---

## Código de Conduta

1. **Sem viés partidário** — nenhum apoio ou ataque a partido, candidato ou posição.
2. **Triangulação de fontes** — fonte oficial + contraponto quando disponível.
3. **Transparência de métodos** — critérios de coleta e síntese documentados e abertos.
4. **Direito de resposta** — correções via issues públicas, registradas em `historico`.
5. **Auditoria aberta** — código e dados brutos verificáveis por qualquer pessoa.

O LLM apenas **sintetiza o que está nas fontes** — nunca gera afirmações fora delas.

---

## Licença

MIT