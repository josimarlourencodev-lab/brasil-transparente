# AI Synthesis

The synthesis transforms the raw article into a **neutral, structured summary**, extracting the people involved and pointing out contradictions based on history — **without opinion**.

## How it works

The article (title + truncated content + source) is sent to the LLM together with the history of the involved politician's past statements. The response is a **structured JSON**:

```json
{
  "resumo": "string up to 280 characters",
  "categoria": "Corrupção | Economia | Saúde | Segurança | Meio Ambiente | Educação | Eleições | Direitos Humanos | Legislação | Outros",
  "envolvidos": ["Full names of the politicians cited"],
  "contradicao": { "detectada": bool, "descricao": "", "referencias": ["url1"] },
  "relevante": true
}
```

## Neutrality rules (mandatory in the prompt)

1. Do not express opinion, moral judgment, praise or condemnation.
2. The words "reprovável" (reprehensible), "escândalo" (scandal), "corrupto" (corrupt) and value-laden adjectives are forbidden.
3. Summarize **only** what is in the sources — never invent facts, dates or quotes.
4. Compare with history and point out contradictions in a **factual** way (citing official/opposition sources).

## Relevance filter

The prompt also instructs marking **`relevante: false`** for off-topic articles (celebrities, sports, soccer, entertainment, soap operas, shows, or any subject with no link to public power). In those cases the LLM returns only `{"relevante": false}`.

The pipeline then:
- marks the item with `status_sintese = "fora_do_tema"` (if `relevante: false`);
- **does not publish** off-topic items (see [Ingestion](ingestao.md)).

## Providers

- Default: **Groq** (`openai/gpt-oss-20b` for daily synthesis).
- Supported alternatives: **Together AI** and **Gemini** (via `LLM_PROVIDER`).

## Resilience

- **Rate-limit**: throttling between calls, respect for `x-ratelimit-*` headers, backoff with `Retry-After`.
- **AI failure does not stop the pipeline**: on error, the item enters with an empty summary (keeping the title), prioritizing continuity.

## Podcast synthesis

Diverges from daily synthesis: the podcast model (`PODCAST_LLM_MODEL`) generates a **long script** in a single call (8000 tokens/min basket) — announced in [Podcast](podcast.md).