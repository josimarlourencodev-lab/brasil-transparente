# Ingestão (Python)

Pipeline autônomo que coleta, limpa, sintetiza e publica notícias. Executado por cron no GitHub Actions (padrão 4×/dia) e/ou pelo worker com APScheduler.

## Pipeline

```
feeds.json / env RSS_* → crawlers (RSS/Atom, retries)
  → dedupe → sanitize (anti-XSS) → tipo de fonte
  → síntese LLM (resumo/categoria/envolvidos/contradição/relevante)
  → filtro de relevância → upsert no Postgres
```

## Arquivos

| Arquivo | Papel |
|---------|-------|
| `scripts/ingest.py` | Orquestrador. Flags: `--dry-run`, `--sources`, `--limit` |
| `scripts/worker.py` | Agendador APScheduler (intervalo via `INGEST_INTERVAL_MINUTOS`) |
| `scripts/crawlers/` | Base (parser + resiliência) + registro de fontes por categoria |
| `scripts/synthesizer.py` | Síntese neutra com JSON estruturado e detecção de contradições |
| `scripts/sanitize.py` | Camada anti-XSS antes da persistência |
| `scripts/security/` | Auditoria de dependências (OSV) e geração de tokens dev |

## Variáveis de ambiente

- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — escrita no banco.
- `LLM_API_KEY`, `LLM_PROVIDER` (padrão `groq`) — síntese.
- `LLM_MODEL` — modelo de síntese diária.
- `RSS_FEEDS_OFICIAIS`, `RSS_FEEDS_IMPRENSA`, `RSS_FEEDS_INDEPENDENTES` — fontes.
- `MAX_SYNTHESIS_PER_RUN` (padrão `80`) — teto de chamadas de IA por execução.
- `INGEST_INTERVAL_MINUTOS` (padrão `360`) — intervalo do worker.

## Filtro de relevância (fora do tema)

O `SYSTEM_PROMPT` da síntese manda o LLM marcar como **`relevante: false`** matérias sobre:

- celebridades, famosos, influencers
- esportes, futebol
- entretenimento, cultura pop, novelas, shows
- qualquer assunto sem ligação comprovada com o exercício do poder público

Quando `relevante: false`, o item recebe `status_sintese = "fora_do_tema"` e **é ignorado na publicação** (`upsert_items` não o insere). Isso impede que esse conteúdo entre no site sem apagar o que já existe.

## Segurança do pipeline

- **Sanitização anti-XSS**: bloqueia `<script>`, URIs `javascript:`, header-injection via CR/LF.
- **Dependências auditadas**: `pip --require-hashes -r scripts/requirements.lock.leve.txt` (check via `check_deps.py`).
- **Throttle de rate-limit** da API de IA, com retry/backoff.
