# Uso — Painel `/admin`

Área administrativa protegida para **auditoria humana** das matérias.

## Acesso

- URL: `https://brasiltransparente.com.br/admin`
- Login com a senha configurada em `ADMIN_PASSWORD` (cookie HttpOnly, comparação em tempo constante).

## O que dá para fazer hoje

- **Visualizar matérias por status**: `rascunho`, `revisao`, `publicado`, `rejeitado`.
- Revisar o conteúdo produzido pela ingestão/síntese antes de ele ser considerado publicado.

## Limitações atuais

- O painel é **somente leitura** — adicionar/remover matérias manualmente é uma evolução futura (registrada no `ROADMAP.md`).

## Segurança

- Sem API de escrita exposta; apenas leitura autenticada.
- A rota continua existindo mesmo com o **link "Painel do auditor" removido do rodapé** do site (desde 2026-09) — o painel é acessado diretamente pela URL.
