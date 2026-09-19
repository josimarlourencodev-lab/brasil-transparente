# Quick Guide — What Has Been Done

Executive summary of the project's current state. Area details in [Deliveries by Area](entregas.md).

## Current state (2026-09)

- **Site** in production on Vercel — `https://brasil-transparente-rust.vercel.app` (automatic deploy from `main` + manual via `vercel --prod`).
- **Mobile app** published (Android APK release + Expo hbc bundles) in the `v0.1.0-mobile` release.
- **Weekly podcast** with thumbnail, background playback and lock screen artwork.
- **Autonomous ingestion** 4×/day via GitHub Actions, with neutral AI synthesis.
- **Topic restriction** in the prompt: celebrities, sports and entertainment are **ignored** (do not reach the site).
- **New pages**: `/pitch` (presentation with slides, AI voice and video) and `/documentacao` (internal documentation).

## Timeline of major deliveries

1. **Portal base** — Next.js + Supabase + RLS, public news/politicians API, `/admin` panel.
2. **Ingestion + neutral synthesis** — Python cron 4×/day, LLM structuring summary/category/people involved/contradictions.
3. **Mobile (Expo)** — news/politicians lists and details with dark mode and photos.
4. **Weekly podcast** — AI-generated script, narration via edge-tts, upload to Supabase Storage and episodes page.
5. **Mobile release** — background podcast player, notification/lock screen controls; signed APK published.
6. **Episode thumbnails** — generated automatically (JPEG 1200×675) and displayed on the site and app; used as lock screen artwork.
7. **Topic restriction** — the synthesis prompt starts ignoring celebrities/sports/entertainment.
8. **Project pitch** — 10 slides, AI voice narration (PT-BR) and MP4 video on the `/pitch` page.
9. **Documentation and navigation** — internal `/documentacao` page, GitHub/Documentation links in the header and footer.
10. **Deploy fix** — production verified on the correct Vercel domain and Production/Preview env vars configured.

## Recent delivered items

- [x] **"Auditor's panel" link removed** from the site footer (the `/admin` route still exists).
- [x] **`thumb_url` column** in `podcast_episodios` + thumbnail published for the existing episodes.
- [x] **`pillow==12.3.0`** added to the lockfile for thumbnail generation.
- [x] **Background podcast**: global player, `enableBackgroundPlayback`, notification/lock screen controls, Android 13+ permission.
- [x] **Prompt restriction** to ignore celebrities and sports.
- [x] **Admin**: manually add and remove articles (no longer read-only).
- [x] **Cover/inline images** for news in the listing and detail; **politician photos** in the gallery.
- [x] **`/pitch` page** — presentation with slides, narration (AI voice) and MP4 video.
- [x] **`/documentacao` page** — internal documentation in the portal's Design System.
- [x] **Navigation** — "GitHub" (new tab) and "Documentation" in the header; "O Brasil Transparente" (pitch) and "GitHub repository" in the footer.
- [x] **Deploy/domain** — divergent-domain diagnosis on Vercel; production on `brasil-transparente-rust.vercel.app` with Production/Preview env vars.

## Known pending items

- **Custom domain** `brasiltransparente.com.br` (today production uses the auto-generated `-rust` subdomain).
- Deep historical search (old articles) is a future iteration — RSS/Google News do not index old archives.