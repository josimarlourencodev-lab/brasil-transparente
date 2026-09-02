# ROADMAP — Brasil Transparente

Portal neutro e autônomo de monitoramento de políticos do Brasil, com histórico,
contexto e contradições a partir de fontes oficiais e de oposição.

## Estado atual (2026-09)

- **Site**: Next.js + PWA no Vercel (produção pública).
- **Ingestão**: Python via GitHub Actions (cron 4×/dia) — feeds RSS/Atom genéricos
  + coleta dirigida por político (Google News RSS por termo).
- **Síntese (IA)**: Groq (`openai/gpt-oss-20b`) — resumo neutro por notícia,
  extração de envolvidos e associação `politico_id`.
- **Banco**: Supabase (Postgres + RLS) — `politicos`, `noticias`, `fontes`,
  `historico`, `categorias`, `audit_log`.

## Entregue

- [x] 13 presidenciáveis 2026 cadastrados com biografia e termos de busca.
- [x] 4×/dia de ingestão autônoma (feeds + busca dirigida por candidato).
- [x] Síntese neutra por IA com correlação a histórico e classificação de fonte.
- [x] Associação de notícias ao perfil do político (`politico_id`) via termos normalizados.
- [x] API pública (`/api/noticias`, `/api/politicos`), busca `?q=`, RLS público.
- [x] Painel do administrador/auditor (login + visualização por status).
- [x] CI verde (Python + Web) e validação de autenticidade de dependências.

## Próximas iterações

### Em andamento
- [ ] Imagens de capa/interior das notícias na listagem e na exibição detalhada.
- [ ] Fotos dos políticos na galeria de candidatos.
- [ ] Admin: adicionar e remover matérias manualmente (hoje é somente leitura).

### Meta futura — Busca de histórico profundo / matérias antigas
- [ ] Coleção retrospectiva de registros passados e fontes de arquivo (matérias
      antigas) por político, alimentando a tabela `historico` com
      casos/contradições/posições de longo prazo.
- Nota: o fluxo atual cobre apenas notícias recentes (RSS e Google News não
  indexam arquivo antigo). A profundidade histórica será tratada em iteração
  dedicada, fora do ciclo de ingestão diário.

### Futuro (não prioritário)
- [ ] App React Native/Expo (workspace mobile).
- [ ] Busca textual avançada (pg_trgm já habilitado no schema).
- [ ] Sugestões automáticas de contradição entre fontes oficiais e de oposição.

## Princípios

- Baixa complexidade; funcionamento autônomo, limpo e direto.
- Neutralidade editorial: fontes oficiais e de oposição com pesos equilibrados.
- Segurança: zero vazamento de chaves; `pip --require-hashes` no CI; RLS no banco.
- Desenvolvimento via `develop` → testes → PR → `main` (produção).
