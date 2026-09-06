# Uso — Painel `/admin`

Área administrativa protegida para **auditoria humana** das matérias.

## Acesso

- URL: `https://brasil-transparente-rust.vercel.app/admin`
- Login com a senha configurada em `ADMIN_PASSWORD` (cookie HttpOnly, comparação em tempo constante).

## O que dá para fazer hoje

- **Visualizar matérias por status**: `rascunho`, `revisao`, `publicado`, `rejeitado`.
- Revisar o conteúdo produzido pela ingestão/síntese antes de ele ser considerado publicado.
- **Adicionar matéria manualmente** (formulário: título, URL, resumo, categoria e imagem) — upsert por `url`.
- **Remover matéria** (exclusão por `id`, com confirmação).

## Segurança

- Escrita autenticada por cookie de admin (muda o `status`, insere via `upsert` e exclui via API protegida).
- A rota continua existindo mesmo com o **link "Painel do auditor" removido do rodapé** do site (desde 2026-09) — o painel é acessado diretamente pela URL.
