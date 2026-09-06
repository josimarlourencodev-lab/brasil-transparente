# Brasil Transparente — Documentação

Portal autônomo, neutro e independente de **monitoramento político do Brasil**: histórico, contexto e contradições de políticos a partir de fontes oficiais e de oposição.

Esta documentação cobre o projeto **como um todo até agora**: web, mobile, ingestão, síntese por IA, podcast, banco de dados, deploy e operação.

## O que você procura?

- **Como tudo se conecta?** → [Visão geral da arquitetura](arquitetura.md)
- **O que já foi feito?** → [Guia rápido das entregas](guia-rapido.md) e [entregas por área](entregas.md)
- **Como rodar o projeto?** → [Começando](comecando.md)
- **Como contribuir?** → [Fluxo de trabalho (git)](fluxo-de-trabalho.md) e [Testes e CI](testes-ci.md)
- **Como publicar?** → [Deploy e publicação](deploy.md)
- **Como usar portal/admin/app?** → seção [Uso](uso-portal.md)
- **Como funciona o podcast?** → [Podcast](podcast.md)

## Em uma frase

> Máquinas coletam, uma IA neutra **sintetiza** (nunca opina), e o visitante vê fatos referenciados — lado a lado, fontes oficiais e de oposição.

## Princípios

- **Neutralidade editorial:** fontes oficiais e de oposição com pesos equilibrados; o LLM apenas sintetiza o que está nas fontes, nunca cria afirmações fora delas.
- **Autonomia:** pipeline automático (robô + LLM neutro) com auditoria humana opcional no painel `/admin`.
- **Acessibilidade:** gratuito e aberto, incluindo app mobile (Expo).
- **Verificabilidade:** toda matéria aponta para fontes primárias; contradições trazem `descricao` e `referencias` factuais.

## Stack resumido

| Camada | Tecnologia |
|--------|-----------|
| Web | Next.js 16 (App Router) + React 19 + Tailwind, PWA |
| Mobile | Expo / React Native (`apps/mobile`) |
| Banco | Supabase (Postgres + RLS) + PostgREST local via Docker |
| Ingestão | Python 3.13 (pip com hashes no lockfile) |
| Síntese | Groq / Together AI / Gemini (LLM, JSON estruturado) |
| Podcast TTS | edge-tts (Microsoft Edge, gratuito) |
| CI | GitHub Actions (OSV + pytest + Vitest + lint + typecheck + build) |
| Docs | Docsify (este site), hospedado no GitHub Pages |

---

<p align="center"><em>Código-fonte: <a href="https://github.com/josimarlourencodev-lab/brasil-transparente">josimarlourencodev-lab/brasil-transparente</a></em></p>
