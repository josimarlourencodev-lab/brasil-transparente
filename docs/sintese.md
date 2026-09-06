# Síntese por IA

A síntese transforma a notícia bruta em um **resumo neutro e estruturado**, extraindo envolvidos e apontando contradições com base no histórico — **sem opinião**.

## Como funciona

A notícia (título + conteúdo truncado + fonte) é enviada ao LLM junto com o histórico de afirmações passadas do político envolvido. A resposta é um **JSON estruturado**:

```json
{
  "resumo": "string até 280 caracteres",
  "categoria": "Corrupção | Economia | Saúde | Segurança | Meio Ambiente | Educação | Eleições | Direitos Humanos | Legislação | Outros",
  "envolvidos": ["Nomes completos dos políticos citados"],
  "contradicao": { "detectada": bool, "descricao": "", "referencias": ["url1"] },
  "relevante": true
}
```

## Regras de neutralidade (obrigatórias no prompt)

1. Não emitir opinião, juízo moral, elogio ou condenação.
2. Proibidas as palavras "reprovável", "escândalo", "corrupto" e adjetivos valorativos.
3. Resumir **apenas** o que está nas fontes — nunca inventar fatos, datas ou citações.
4. Comparar com o histórico e apontar contradições de forma **factual** (citação de fontes oficial/oposição).

## Filtro de relevância

O prompt também ordena marcar **`relevante: false`** para matérias fora do tema (celebridades, esportes, futebol, entretenimento, novelas, shows, ou qualquer assunto sem vínculo com o poder público). Nesses casos o LLM retorna apenas `{"relevante": false}`.

O pipeline então:
- marca o item com `status_sintese = "fora_do_tema"` (se `relevante: false`);
- **não publica** itens fora do tema (ver [Ingestão](ingestao.md)).

## Provedores

- Padrão: **Groq** (`openai/gpt-oss-20b` para síntese diária).
- Alternativas suportadas: **Together AI** e **Gemini** (via `LLM_PROVIDER`).

## Resiliência

- **Rate-limit**: throttling entre chamadas, respeito aos headers `x-ratelimit-*`, backoff com `Retry-After`.
- **Falha da IA não trava o pipeline**: em erro, o item entra com resumo vazio (mantém o título), priorizando a continuidade.

## Síntese do podcast

Divergente da síntese diária: o modelo de podcast (`PODCAST_LLM_MODEL`) gera **roteiro longo** em uma única chamada (cesta de 8000 tokens/min) — anunciado em [Podcast](podcast.md).
