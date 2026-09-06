# ROADMAP — Brasil Transparente

Portal neutro e autônomo de monitoramento de políticos do Brasil, com histórico,
contexto e contradições a partir de fontes oficiais e de oposição.

## Estado atual (2026-09)

- **Site**: Next.js + PWA na Vercel — produção pública em
  `https://brasil-transparente-rust.vercel.app` (deploy automático via `main` +
  manual via `vercel --prod`). Domínio próprio ainda não configurado.
- **Páginas recentes**: `/pitch` (apresentação com slides + voz IA + vídeo) e
  `/documentacao` (página interna de documentação), com links de GitHub/Documentação
  na navegação superior e no rodapé.
- **Ingestão**: Python via GitHub Actions (cron 4×/dia) — feeds RSS/Atom genéricos
  + coleta dirigida por político (Google News RSS por termo).
- **Síntese (IA)**: Groq (`openai/gpt-oss-20b`) — resumo neutro por notícia,
  extração de envolvidos e associação `politico_id`. Restrição de tema: matérias de
  celebridades/esportes/entretenimento são descartadas.
- **Banco**: Supabase (Postgres + RLS) — `politicos`, `noticias`, `fontes`,
  `historico`, `categorias`, `audit_log`, `podcast_episodios`.

## Entregue

- [x] 13 presidenciáveis 2026 cadastrados com biografia e termos de busca.
- [x] 4×/dia de ingestão autônoma (feeds + busca dirigida por candidato).
- [x] Síntese neutra por IA com correlação a histórico e classificação de fonte.
- [x] Restrição de tema no prompt: celebridades, esportes, futebol, novelas e shows
      são marcados `relevante: false` e não são publicados.
- [x] Associação de notícias ao perfil do político (`politico_id`) via termos normalizados.
- [x] API pública (`/api/noticias`, `/api/politicos`, `/api/podcast/episodios`), busca
      `?q=`, RLS público.
- [x] Imagens de capa/interior das notícias na listagem e na exibição detalhada.
- [x] Fotos dos políticos na galeria de candidatos (web e mobile).
- [x] Painel do administrador/auditor: login + visualização por status + **adicionar e
      remover matérias manualmente** (upsert por `url` e exclusão).
- [x] Podcast semanal: roteiro por IA, narração `edge-tts`, thumbnail automática,
      player em segundo plano e arte do lock screen no mobile.
- [x] App React Native/Expo (workspace `apps/mobile`) com APK release publicado.
- [x] Pitch do projeto: 10 slides (1920×1080), narração em voz IA (PT-BR, ~2min44) e
      vídeo MP4 completo, publicados em `/pitch`.
- [x] Página interna de Documentação em `/documentacao` (sobre, funcionamento,
      princípios e acessos) no mesmo Design System do portal.
- [x] Navegação: link "O Brasil Transparente" (pitch) no header, "Documentação" no
      header/rodapé e "Repositório GitHub" (nova aba) no header e rodapé.
- [x] Deploy correto na Vercel: diagnóstico de domínio divergente, env vars de
      Produção/Preview configuradas e produção verificada.
- [x] CI verde (Python + Web) e validação de autenticidade de dependências.

## Próximas iterações

### Próxima
- [ ] **Busca de histórico profundo / matérias antigas** — coleção retrospectiva de
      registros passados e fontes de arquivo por político, alimentando a tabela
      `historico` com casos/contradições/posições de longo prazo.
  - Nota: o fluxo atual cobre apenas notícias recentes (RSS e Google News não
    indexam arquivo antigo). A profundidade histórica será tratada em iteração
    dedicada, fora do ciclo de ingestão diário.
- [ ] **Domínio próprio** `brasiltransparente.com.br` na Vercel (hoje em subdomínio
      auto-gerado `-rust`).

### Futuro (não prioritário)
- [ ] Busca textual avançada (pg_trgm já habilitado no schema).
- [ ] Sugestões automáticas de contradição entre fontes oficiais e de oposição.

## Princípios

- Baixa complexidade; funcionamento autônomo, limpo e direto.
- Neutralidade editorial: fontes oficiais e de oposição com pesos equilibrados.
- Segurança: zero vazamento de chaves; `pip --require-hashes` no CI; RLS no banco.
- Desenvolvimento via `develop` → testes → PR → `main` (produção).