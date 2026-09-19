# Getting Started

Prerequisites: Node ≥ 22 (via pnpm), Python 3.13, Docker (with Compose v2 plugin) and, for mobile builds, JDK 17 + Android SDK.

## Option 1 — Docker (database + web + worker)

```bash
# 1. Generate JWT/anon/service_role credentials + ADMIN_PASSWORD (unversioned)
python3 scripts/security/dev_tokens.py

# 2. Start database + PostgREST API (:54321) + web (:3000) + worker
docker compose up -d --build

# 3. Tests inside the web container
docker compose exec web pnpm test
docker compose exec web pnpm run typecheck
```

- Site: `http://localhost:3000`
- Local API: `http://localhost:54321`
- Admin panel: `http://localhost:3000/admin`

## Option 2 — Without Docker (direct development)

```bash
cp .env.local.example .env.local   # fill in the keys
pip install --require-hashes -r scripts/requirements.txt
pnpm install
pnpm run dev
```

Apply the schema (`supabase/schema.sql`) to Supabase Cloud via the SQL Editor.

## Mobile

```sh
cd apps/mobile
pnpm install
npx expo start
```

## Conventions at a glance

| Folder | Command | Description |
|-------|--------|-----------|
| `scripts/` | `python -m pytest tests -q` | Python tests |
| `src/` | `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` | web |
| `apps/mobile/` | `npx tsc --noEmit` | mobile typecheck |

> See `AGENTS.md` at the root for working conventions.