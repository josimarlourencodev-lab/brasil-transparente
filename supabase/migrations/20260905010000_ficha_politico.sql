-- ============================================================
-- Brasil Transparente - Ficha do político
-- Casos documentados (processos, investigações, denúncias,
-- condenações, contradições) extraídos de fonte factual pelas
-- notícias monitoradas. Idempotente (pode ser re-executado).
-- ============================================================

-- Casos documentados sobre um político.
create table if not exists ficha_politico (
  id bigserial primary key,
  politico_id bigint not null references politicos(id) on delete cascade,
  tipo text not null
    check (tipo in (
      'processo', 'investigacao', 'denuncia', 'condenacao',
      'inelegibilidade', 'cassacao', 'contradicao', 'outro'
    )),
  status text not null default 'em_andamento'
    check (status in (
      'em_andamento', 'arquivado', 'condenado', 'absolvido',
      'sem_informacao'
    )),
  titulo text not null,
  descricao text,
  orgao text,
  data_fato timestamptz,
  fontes text[] not null default '{}',
  noticia_id bigint references noticias(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_ficha_politico_politico
  on ficha_politico(politico_id);
create index if not exists idx_ficha_politico_tipo
  on ficha_politico(tipo);

-- ============================================================
-- Row Level Security (RLS)
-- Leitura pública; escrita protegida (via service_role).
-- ============================================================

alter table ficha_politico enable row level security;

create policy "leitura publica ficha"
  on ficha_politico for select using (true);

grant select on ficha_politico to anon;
grant select, insert, update, delete on ficha_politico to service_role;
grant usage, select on sequence ficha_politico_id_seq to anon, service_role;