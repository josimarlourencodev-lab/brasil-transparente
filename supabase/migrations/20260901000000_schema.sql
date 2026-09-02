-- ============================================================
-- Brasil Transparente - Schema do Banco de Dados (Supabase)
-- Execute este SQL no SQL Editor do projeto Supabase.
-- ============================================================

-- Extensão para busca textual em português
create extension if not exists pg_trgm;

-- Album de auditoria (quem alterou o quê e quando)
create table if not exists audit_log (
  id bigserial primary key,
  acao text not null,
  tabela text not null,
  registro_id bigint,
  usuario text,
  detalhes jsonb,
  criado_em timestamptz not null default now()
);

-- Políticos monitorados
create table if not exists politicos (
  id bigserial primary key,
  nome text not null,
  partido text,
  cargo text,
  ativo boolean not null default true,
  termos_busca text[] default '{}',
  biografia text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Categorias / temas das notícias
create table if not exists categorias (
  id bigserial primary key,
  nome text not null unique,
  descricao text
);

-- Notícias coletadas e sintetizadas
create table if not exists noticias (
  id bigserial primary key,
  titulo text not null,
  url text not null unique,
  url_fonte text,
  resumo text,
  categoria text not null default 'Geral',
  tipo_fonte text not null default 'desconhecida'
    check (tipo_fonte in ('oficial', 'oposicao', 'imprensa', 'desconhecida')),
  publicado_em timestamptz,
  coletado_em timestamptz not null default now(),
  status text not null default 'rascunho'
    check (status in ('rascunho', 'revisao', 'publicado', 'rejeitado')),
  contradicao_detectada boolean not null default false,
  contradicao_descricao text,
  metadata jsonb,
  politico_id bigint references politicos(id) on delete set null,
  categoria_id bigint references categorias(id) on delete set null,
  criado_em timestamptz not null default now()
);

-- Fontes primárias associadas a cada notícia
create table if not exists fontes (
  id bigserial primary key,
  noticia_id bigint not null references noticias(id) on delete cascade,
  titulo text,
  url text,
  veiculo text,
  tipo text not null default 'primaria'
    check (tipo in ('primaria', 'oposicao', 'oficial', 'arquivo')),
  acessado_em timestamptz not null default now()
);

-- Contexto histórico / contradições registradas sobre um político
create table if not exists historico (
  id bigserial primary key,
  politico_id bigint not null references politicos(id) on delete cascade,
  noticia_id bigint references noticias(id) on delete set null,
  titulo text not null,
  descricao text,
  data_fato timestamptz,
  tipo text not null default 'caso'
    check (tipo in ('caso', 'contradicao', 'posicao', 'correcao')),
  criado_em timestamptz not null default now()
);

-- Índices de apoio
create index if not exists idx_noticias_politico on noticias(politico_id);
create index if not exists idx_noticias_categoria on noticias(categoria);
create index if not exists idx_noticias_publicado on noticias(publicado_em desc);
create index if not exists idx_noticias_status on noticias(status);
create index if not exists idx_historico_politico on historico(politico_id);
create index if not exists idx_politicos_ativo on politicos(ativo);

-- ============================================================
-- Row Level Security (RLS)
-- Leitura pública; escrita protegida (via service_role).
-- ============================================================

alter table politicos enable row level security;
alter table noticias enable row level security;
alter table fontes enable row level security;
alter table historico enable row level security;
alter table categorias enable row level security;
alter table audit_log enable row level security;

-- Leitura pública
create policy "leitura publica noticias"
  on noticias for select using (status = 'publicado');
create policy "leitura publica politicos"
  on politicos for select using (true);
create policy "leitura publica fontes"
  on fontes for select using (true);
create policy "leitura publica historico"
  on historico for select using (true);
create policy "leitura publica categorias"
  on categorias for select using (true);

-- Escrita apenas via service_role (ignora RLS). Nenhuma policy de
-- insert/update/delete para chaves anônimas é criada de propósito.