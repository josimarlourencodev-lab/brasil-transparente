# AGENTS.md

Guia de convenções para trabalhar neste repositório. Siga estas regras SEMPRE.

## Fluxo de trabalho obrigatório (develop → test → main)

**Nunca commitar/pushar diretamente em `main`.** Todo desenvolvimento segue:

1. **Trabalhe na branch `develop`** (crie a partir de `main` se ainda não existir):
   ```sh
   git checkout develop
   git checkout -b feature/<descricao>   # opcional: branch de feature
   ```
2. **Commite** suas mudanças com mensagem em PT seguindo o estilo dos commits
   existentes (ex.: `feat: ...`, `fix: ...`, `chore: ...`).
3. **Teste antes de publicar** — rode a suíte completa localmente:
   ```sh
   python -m pytest tests -q          # testes Python (40)
   pnpm test                          # testes do app (vitest)
   pnpm typecheck                     # TS
   pnpm lint                          # ESLint
   pnpm build                         # build de produção
   ```
4. **Crie um Pull Request** de `develop` → `main` (ou de `feature/*` → `develop`).
   O CI do GitHub valida automaticamente (lint, testes, build, segurança) antes
   de permitir merge.
5. **Merge via PR** quando o CI estiver verde. Nunca force-push em `main` nem
   faça merge sem os testes passando.

### Regras de proteção
- `main` é a branch de produção (deploy da Vercel é gatilhado por ela).
- `develop` é onde o trabalho novo é consolidado e testado.

## Verificações de segurança sempre
- `NUNCA` commitar secrets/chaves. Use **GitHub Actions secrets** e **Vercel env vars**.
- Rodar `pnpm audit` e `pnpm audit_node.sh` antes de fechar uma versão.
- Python usa `pip --require-hashes` (ver `scripts/requirements.lock.txt`).

## Stack
- Web: Next.js (App Router) + Tailwind + Supabase (REST/PostgREST)
- Mobile (opcional): Expo (workspace aninhado `apps/mobile`)
- Ingestão: Python (`scripts/ingest.py`) via GitHub Actions (cron 4×/dia)
- Síntese de IA: Groq (`openai/gpt-oss-20b`, tier grátis) — throttle 2s;
  limite `MAX_SYNTHESIS_PER_RUN=80`
- Publicação: Vercel (produção/preview a partir de `main`/PRs)
