# Usage — Portal (site)

The public portal at `https://brasil-transparente-rust.vercel.app` presents monitored news and politicians neutrally and with references. (The custom domain `brasiltransparente.com.br` is a future evolution.)

## Navigation

- **Home / News**: list of collected and synthesized articles, with search.
- **Politicians**: gallery of candidates with biography, photo and history.
- **Article detail**: summary, people involved, category and **links to primary sources**; when there is a contradiction with history, it is **pointed out** with factual references.
- **Podcast** (`/podcast`): weekly episodes with thumbnail, duration, date and embedded audio player.
- **O Brasil Transparente** (`/pitch`): project presentation with slides, AI voice narration and downloadable video.
- **Documentation** (`/documentacao`): internal page with about, autonomous operation, principles and access — without leaving the portal.
- **GitHub**: header link (and "GitHub repository" in the footer) opens the source code in a new tab.

## What to expect from the content

- **Neutrality**: the text is AI-synthesized from the sources, without editorial opinion. Official and opposition sources appear side by side.
- **References**: every article points to the sources; contradictions carry `descricao` and `referencias`.
- **Editorial filter**: articles about celebrities, sports, soccer and entertainment are **not published** (pipeline restriction since 2026-09).

## Search

The search filters by term in the title/content (`?q=`). Advanced text search (pg_trgm) is a future evolution.

## PWA

The site can be installed as an app (manifest + service worker) for quick access and basic offline navigation.