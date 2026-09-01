# Brasil Transparente

Portal autônomo, neutro e independente de monitoramento de notícias e histórico de políticos atuais do Brasil.

## Visão Geral

O Brasil Transparente fornece um histórico contextualizado de políticos brasileiros — casos antigos e contradições passadas — comparando fontes oficiais e canais de oposição. O objetivo é garantir visibilidade além dos períodos eleitorais, promovendo transparência e accountability.

### Princípios

- **Neutralidade:** o projeto não se posiciona politicamente; fontes oficiais e de oposição são apresentadas lado a lado.
- **Autonomia:** pipeline automático (robô + LLM neutro), com auditoria humana opcional no painel `/admin`.
- **Acessibilidade:** gratuito e de código aberto, incluindo app mobile (PWA + Expo).
- **Verificabilidade:** toda matéria possui links para fontes primárias; contradições são apontadas com `descicao` e `referencias` factuais.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Web | Next.js 16 (App Router) + React 19 + Tailwind, PWA |
| Mobile | Expo / React Native (`apps/mobile`) |
| Backend de dados | Supabase (Postgres) / PostgREST local via Docker |
| Ingestão | Python 3.13 (pip com hashes no lockfile) |
| Síntese neutra | Groq / Together AI / Gemini (LLM) |
| CI | GitHub Actions (OSV + pytest + Vitest + lint + typecheck + build) |

---

## Começando (Docker)

Pré-requisito: Docker com plugin Compose v2.

```bash
# 1. Gera credenciais JWT/anon/service_role + ADMIN_PASSWORD (não versionado)
python3 scripts/security/dev_tokens.py

# 2. Sobe banco + API PostgREST (:54321) + web (:3000) + worker
docker compose up -d --build

# 3. Testes dentro do container web
docker compose exec web pnpm test
docker compose exec web pnpm run typecheck
```

Site em `http://localhost:3000`, API em `http://localhost:54321`, painel em `http://localhost:3000/admin`.

Alternativa sem Docker (desenvolvimento):

```bash
cp .env.local.example .env.local   # preencha as chaves
pip install --require-hashes -r scripts/requirements.txt
pnpm install
pnpm run dev
```

Aplique o schema (`supabase/schema.sql`) no Supabase Cloud via SQL Editor.

---

## Pipeline de Ingestão

```
feeds.json / env RSS_* → crawlers (RSS/Atom, retries) → dedupe → sanitize (anti-XSS)
→ tipo de fonte → síntese LLM (resumo/categoria/contradições) → upsert no Postgres
```

- `scripts/ingest.py` — orquestrador. Flags: `--dry-run`, `--sources oficiais,imprensa,...`, `--limit`.
- `scripts/worker.py` — agendador (APScheduler), intervalo via `INGEST_INTERVAL_MINUTOS`.
- `scripts/crawlers/` — base (parser + resiliência), registro de fontes por categoria.
- `scripts/synthesizer.py` — síntese neutra com JSON estruturado e detecção de contradições.
- `scripts/sanitize.py` — camada anti-XSS antes da persistência (toda fonte externa passa por aqui).
- `.github/workflows/ingest.yml` — cron a cada 6h (configurável).

## Segurança

- **Lockfile com hashes:** `scripts/requirements.lock.txt` + `pip install --require-hashes` (transitivas resolvidas via `pip-compile`).
- **Auditoria OSV:** `python3 scripts/security/check_osv.py` (filtra falsos positivos de borda de range; exit code p/ CI).
- **pnpm audit + lock:** `pnpm audit --audit-level=high` (frozen lockfile no CI).
- **Config pacote web** segue Node ≥ 22 (`engines`).
- **Sanitização:** `scripts/sanitize.py` bloqueia `<script>`, URIs `javascript:`, header-injection via CR/LF.
- **RLS:** leitura pública protegida por policy; escrita apenas via `service_role`.
- **Painel `/admin`:** senha via `ADMIN_PASSWORD` (cookie HttpOnly + comparação em tempo constante).

## Testes

```bash
# Python (unit + integração + resiliência) — sem rede (mocks)
python3 -m pytest

# Frontend (Vitest)
pnpm test
```

Formato esperado: todos os testes verdes antes de merge (CI exige).

## Mobile

```bash
cd apps/mobile
pnpm install
npx expo start
```

Consome o mesmo backend (chave `anon`); URLs em `app.json → expo.extra`.

## CI/CD

- `ci.yml` — auditoria OSV, pytest, Vitest, lint, typecheck, build (push/PR).
- `ingest.yml` — ingestão agendada com secrets do repositório.

Secrets do GitHub: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LLM_PROVIDER`, `LLM_API_KEY`, `RSS_FEEDS_OFICIAIS`, `RSS_FEEDS_IMPRENSA`, `RSS_FEEDS_INDEPENDENTES`.

---

## Banco de Dados

Schema em `supabase/schema.sql`. Tabelas principais: `politicos`, `noticias`, `fontes`, `categorias`, `historico`, `audit_log`. `noticias` registra `contradicao_detectada`, `contradicao_descricao` e `metadata` (jsonb); RLS ativo com política de leitura pública apenas para `status='publicado'`.

## Código de Conduta

1. **Sem viés partidário:** nenhum apoio/ataque a partido, candidato ou posição.
2. **Dobre de fontes:** fonte oficial + contraponto quando disponível.
3. **Transparência de métodos:** critérios de coleta e síntese documentados e abertos.
4. **Direito de resposta:** correções via issues públicas, com registro em `historico`.
5. **Auditoria aberta:** código e dados brutos verificáveis por qualquer pessoa.

O LLM apenas **sintetiza o que está nas fontes** — nunca gera afirmações fora delas.

## Licença

MIT