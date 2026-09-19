# Usage — `/admin` panel

Protected administrative area for **human auditing** of articles.

## Access

- URL: `https://brasil-transparente-rust.vercel.app/admin`
- Login with the password configured in `ADMIN_PASSWORD` (HttpOnly cookie, constant-time comparison).

## What you can do today

- **View articles by status**: `rascunho` (draft), `revisao` (review), `publicado` (published), `rejeitado` (rejected).
- Review the content produced by ingestion/synthesis before it is considered published.
- **Add an article manually** (form: title, URL, summary, category and image) — upsert by `url`.
- **Remove an article** (deletion by `id`, with confirmation).

## Security

- Authenticated writes via the admin cookie (changes `status`, inserts via `upsert` and deletes through the protected API).
- The route still exists even with the **"Auditor's panel" link removed from the site footer** (since 2026-09) — the panel is reached directly via the URL.