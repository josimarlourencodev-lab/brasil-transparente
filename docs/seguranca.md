# Segurança

Postura do projeto: **zero vazamento de chaves**, dependências auditadas, RLS no banco e sanitização de entrada.

## Dependências

- **Python**: `scripts/requirements.lock.txt` com hashes de todas as transitivas (`pip --require-hashes`). `requirements.lock.leve.txt` (para CI/container) faz `-r requirements.lock.txt`. Validação via `check_deps.py`.
  ```sh
  python scripts/security/check_deps.py -r scripts/requirements.lock.txt
  ```
- **Node**: `pnpm audit --audit-level=high` com lockfile congelado (`.github/workflows/ci.yml`).
- **OSV**: `scripts/security/check_osv.py` audita vulnerabilidades conhecidas, filtrando falsos positivos de borda de range (exit code p/ CI).

## Chaves e segredos

- **Nunca versionar secrets.** Usar GitHub Actions secrets e Vercel env vars.
- O cliente web/mobile usa apenas a chave **`anon`** (leitura pública via RLS).
- Escrita usa **`service_role`** apenas em processos internos (ingestão, podcast).
- Painel `/admin`: senha via **`ADMIN_PASSWORD`**; cookie **HttpOnly** e comparação em **tempo constante**.

> ⚠️ Ao trabalhar, lembrar: não commitar arquivos `.env.*` reais, tokens, chaves Supabase/Groq/GitHub nem o keystore.

## Sanitização de entrada (anti-XSS)

`scripts/sanitize.py` bloqueia, antes da persistência, qualquer fonte externa:

- tag `<script>`
- URIs `javascript:`
- header-injection via CR/LF

## RLS (Row Level Security)

- Leitura pública: apenas `status='publicado'`.
- Escrita: somente via `service_role`.

## Access control / buckets

- Bucket `podcast` é **público** (áudio e thumb precisam ser acessíveis), mas restrito a mimes de áudio + JPEG.

## Revisão de release

Antes de fechar versão:
- `pnpm audit`
- `python scripts/security/check_osv.py`
- `check_deps.py -r scripts/requirements.lock.txt`
- todo o CI verde.
