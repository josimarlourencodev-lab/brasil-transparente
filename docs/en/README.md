# Brasil Transparente — Documentation

> 🇧🇷 **Versão em português:** [docs/](../README.md)

Autonomous, neutral and independent portal for **political monitoring in Brazil**: history, context and contradictions of politicians based on official and opposition sources.

This documentation covers the project **as a whole so far**: web, mobile, ingestion, AI synthesis, podcast, database, deployment and operations.

## What are you looking for?

- **How does everything connect?** → [Architecture overview](arquitetura.md)
- **What has been done?** → [Quick guide to deliveries](guia-rapido.md) and [deliveries by area](entregas.md)
- **How do I run the project?** → [Getting started](comecando.md)
- **How do I contribute?** → [Workflow (git)](fluxo-de-trabalho.md) and [Tests and CI](testes-ci.md)
- **How do I publish?** → [Deploy and publishing](deploy.md)
- **How do I use portal/admin/app?** → [Usage](uso-portal.md) section
- **How does the podcast work?** → [Podcast](podcast.md)

## In one sentence

> Machines collect, a neutral AI **synthesizes** (it never opines), and the visitor sees referenced facts — side by side, official and opposition sources.

## Principles

- **Editorial neutrality:** official and opposition sources with balanced weight; the LLM only synthesizes what is in the sources, never creates claims outside of them.
- **Autonomy:** automatic pipeline (bot + neutral LLM) with optional human auditing on the `/admin` panel.
- **Accessibility:** free and open, including a mobile app (Expo).
- **Verifiability:** every article points to primary sources; contradictions carry factual `descricao` and `referencias`.

## Stack summary

| Layer | Technology |
|--------|-----------|
| Web | Next.js 16 (App Router) + React 19 + Tailwind, PWA |
| Mobile | Expo / React Native (`apps/mobile`) |
| Database | Supabase (Postgres + RLS) + local PostgREST via Docker |
| Ingestion | Python 3.13 (pip with hashes in the lockfile) |
| Synthesis | Groq / Together AI / Gemini (LLM, structured JSON) |
| Podcast TTS | edge-tts (Microsoft Edge, free) |
| CI | GitHub Actions (OSV + pytest + Vitest + lint + typecheck + build) |
| Docs | Docsify (this site), hosted on GitHub Pages |

---

<p align="center"><em>Source code: <a href="https://github.com/josimarlourencodev-lab/brasil-transparente">josimarlourencodev-lab/brasil-transparente</a></em></p>