# Começando

Pré-requisitos: Node ≥ 22 (via pnpm), Python 3.13, Docker (com plugin Compose v2) e, para builds mobile, JDK 17 + Android SDK.

## Opção 1 — Docker (banco + web + worker)

```bash
# 1. Gera credenciais JWT/anon/service_role + ADMIN_PASSWORD (não versionado)
python3 scripts/security/dev_tokens.py

# 2. Sobe banco + API PostgREST (:54321) + web (:3000) + worker
docker compose up -d --build

# 3. Testes dentro do container web
docker compose exec web pnpm test
docker compose exec web pnpm run typecheck
```

- Site: `http://localhost:3000`
- API local: `http://localhost:54321`
- Painel: `http://localhost:3000/admin`

## Opção 2 — Sem Docker (desenvolvimento direto)

```bash
cp .env.local.example .env.local   # preencha as chaves
pip install --require-hashes -r scripts/requirements.txt
pnpm install
pnpm run dev
```

Aplique o schema (`supabase/schema.sql`) no Supabase Cloud via SQL Editor.

## Mobile

```sh
cd apps/mobile
pnpm install
npx expo start
```

## Estudo dos padrões

| Pasta | Script | Descrição |
|-------|--------|-----------|
| `scripts/` | `python -m pytest tests -q` | testes Python |
| `src/` | `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` | web |
| `apps/mobile/` | `npx tsc --noEmit` | typecheck mobile |

> Consultar `AGENTS.md` na raiz para as convenções de trabalho.
