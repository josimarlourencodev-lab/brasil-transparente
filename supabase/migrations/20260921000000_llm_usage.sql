-- ============================================================
-- Brasil Transparente - Consumo de tokens do LLM
-- Registro de uso (usage.total_tokens) persistido entre as
-- execuções do cron de ingestão (o workspace do GitHub Actions é
-- efêmero e não mantém .llm_budget.json). Idempotente.
-- ============================================================

create table if not exists llm_usage (
  id bigserial primary key,
  tokens integer not null,
  criado_em timestamptz not null default now()
);

create index if not exists idx_llm_usage_criado_em
  on llm_usage(criado_em);

-- ============================================================
-- Row Level Security (RLS)
-- Apenas o service_role grava/lê; anon não acessa.
-- ============================================================

alter table llm_usage enable row level security;

create policy "escrita service_role llm_usage"
  on llm_usage for all to service_role using (true) with check (true);