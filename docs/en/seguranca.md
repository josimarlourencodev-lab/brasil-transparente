# Security

Project posture: **zero key leakage**, audited dependencies, RLS on the database and input sanitization.

## Dependencies

- **Python**: `scripts/requirements.lock.txt` with hashes for all transitives (`pip --require-hashes`). `requirements.lock.leve.txt` (for CI/container) does `-r requirements.lock.txt`. Validation via `check_deps.py`.
  ```sh
  python scripts/security/check_deps.py -r scripts/requirements.lock.txt
  ```
- **Node**: `pnpm audit --audit-level=high` with a frozen lockfile (`.github/workflows/ci.yml`).
- **OSV**: `scripts/security/check_osv.py` audits known vulnerabilities, filtering range-edge false positives (exit code for CI).

## Keys and secrets

- **Never version secrets.** Use GitHub Actions secrets and Vercel env vars.
- The web/mobile client uses only the **`anon`** key (public read via RLS).
- Writes use **`service_role`** only in internal processes (ingestion, podcast).
- `/admin` panel: password via **`ADMIN_PASSWORD`**; **HttpOnly** cookie and **constant-time** comparison.

> ⚠️ While working, remember: do not commit real `.env.*` files, tokens, Supabase/Groq/GitHub keys or the keystore.

## Input sanitization (anti-XSS)

`scripts/sanitize.py` blocks, before persistence, any external source:

- `<script>` tag
- `javascript:` URIs
- CR/LF header injection

## RLS (Row Level Security)

- Public read: only `status='publicado'`.
- Writes: only via `service_role`.

## Access control / buckets

- The `podcast` bucket is **public** (audio and thumbnails must be accessible), but restricted to audio mimes + JPEG.

## Release review

Before closing a version:
- `pnpm audit`
- `python scripts/security/check_osv.py`
- `check_deps.py -r scripts/requirements.lock.txt`
- all CI green.