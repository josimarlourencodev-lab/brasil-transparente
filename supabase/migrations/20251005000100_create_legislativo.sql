-- Fase 1: Atividade Legislativa e Agentes Políticos
-- SQL puro, neutralidade, rastreabilidade

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists partidos (
  id uuid primary key default gen_random_uuid(),
  sigla text not null unique,
  nome text not null,
  dados_oficiais jsonb,
  criado_em timestamptz not null default now()
);

create table if not exists ufs (
  sigla char(2) primary key,
  nome text not null,
  regiao text,
  criado_em timestamptz not null default now()
);

create table if not exists agentes_politicos (
  id uuid primary key default gen_random_uuid(),
  politico_id uuid unique references politicos(id) on delete set null,
  casa text not null check (casa in ('camara','senado','executivo')),
  cargo text not null check (cargo in ('deputado_federal','senador','governador','presidente','presidenciavel')),
  nome text not null,
  nome_eleitoral text,
  cpf_candidato text,
  partido_id uuid references partidos(id) on delete set null,
  uf char(2) references ufs(sigla) on delete set null,
  id_legislativo_camara int unique,
  id_legislativo_senado int unique,
  tse_candidato_id text,
  foto_url text,
  ativo boolean not null default true,
  dados_oficiais jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (casa, id_legislativo_camara),
  unique (casa, id_legislativo_senado)
);

create trigger trg_agentes_politicos_updated_at
  before update on agentes_politicos
  for each row execute function set_updated_at();

create table if not exists proposicoes (
  id uuid primary key default gen_random_uuid(),
  casa text not null check (casa in ('camara','senado')),
  tipo text not null,
  numero int not null,
  ano int not null,
  sigla text not null,
  ementa text,
  ementa_detalhada text,
  url_oficial text,
  uri_dados_abertos text,
  situacao text,
  ultimo_status jsonb,
  data_apresentacao date,
  dados_oficiais jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (casa, tipo, numero, ano)
);

create trigger trg_proposicoes_updated_at
  before update on proposicoes
  for each row execute function set_updated_at();

create table if not exists proposicao_autores (
  id uuid primary key default gen_random_uuid(),
  proposicao_id uuid not null references proposicoes(id) on delete cascade,
  agente_politico_id uuid not null references agentes_politicos(id) on delete cascade,
  papel text not null check (papel in ('autor','coautor')),
  ordem int,
  criado_em timestamptz not null default now(),
  unique (proposicao_id, agente_politico_id, papel)
);

create table if not exists votacoes (
  id uuid primary key default gen_random_uuid(),
  casa text not null check (casa in ('camara','senado')),
  id_votacao_oficial text not null,
  proposicao_id uuid references proposicoes(id) on delete set null,
  data_hora timestamptz,
  objeto_votacao text,
  resumo text,
  aprovada boolean,
  quorum text,
  dados_oficiais jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (casa, id_votacao_oficial)
);

create trigger trg_votacoes_updated_at
  before update on votacoes
  for each row execute function set_updated_at();

create table if not exists votos_parlamentares (
  id uuid primary key default gen_random_uuid(),
  votacao_id uuid not null references votacoes(id) on delete cascade,
  agente_politico_id uuid not null references agentes_politicos(id) on delete cascade,
  voto text not null check (voto in ('favor','contra','abstencao','ausente','artigo_17','nao_registrado','obstrucao')),
  voto_original text,
  dados_oficiais jsonb,
  criado_em timestamptz not null default now(),
  unique (votacao_id, agente_politico_id)
);

create table if not exists temas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  descricao text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create trigger trg_temas_updated_at
  before update on temas
  for each row execute function set_updated_at();

create table if not exists proposicao_temas (
  id uuid primary key default gen_random_uuid(),
  proposicao_id uuid not null references proposicoes(id) on delete cascade,
  tema_id uuid not null references temas(id) on delete cascade,
  criado_em timestamptz not null default now(),
  unique (proposicao_id, tema_id)
);

create table if not exists votacao_temas (
  id uuid primary key default gen_random_uuid(),
  votacao_id uuid not null references votacoes(id) on delete cascade,
  tema_id uuid not null references temas(id) on delete cascade,
  criado_em timestamptz not null default now(),
  unique (votacao_id, tema_id)
);

create index if not exists idx_proposicoes_casa_tipo_ano on proposicoes(casa,tipo,ano);
create index if not exists idx_proposicoes_data_apresentacao on proposicoes(data_apresentacao desc);
create index if not exists idx_proposicao_autores_agente on proposicao_autores(agente_politico_id);
create index if not exists idx_proposicao_autores_prop on proposicao_autores(proposicao_id);
create index if not exists idx_votacoes_data on votacoes(data_hora desc);
create index if not exists idx_votacoes_prop on votacoes(proposicao_id);
create index if not exists idx_votacoes_casa on votacoes(casa);
create index if not exists idx_votos_agente on votos_parlamentares(agente_politico_id);
create index if not exists idx_votos_votacao on votos_parlamentares(votacao_id);
create index if not exists idx_votos_voto on votos_parlamentares(voto);
create index if not exists idx_agentes_casa_cargo on agentes_politicos(casa,cargo,ativo);
create index if not exists idx_agentes_uf on agentes_politicos(uf);
create index if not exists idx_agentes_partido on agentes_politicos(partido_id);
create index if not exists idx_vt_votacao on votacao_temas(votacao_id);
create index if not exists idx_vt_tema on votacao_temas(tema_id);
create index if not exists idx_pt_prop on proposicao_temas(proposicao_id);
create index if not exists idx_pt_tema on proposicao_temas(tema_id);
create index if not exists idx_temas_ativo on temas(ativo);

create or replace view vw_autoria_agente as
select
  ap.id as agente_politico_id, ap.nome, ap.cargo, ap.casa, ap.uf,
  par.sigla as partido_sigla,
  p.sigla, p.tipo, p.numero, p.ano, p.ementa, pa.papel, p.situacao, p.url_oficial, p.data_apresentacao
from proposicao_autores pa
join proposicoes p on p.id = pa.proposicao_id
join agentes_politicos ap on ap.id = pa.agente_politico_id
left join partidos par on par.id = ap.partido_id
where p.tipo in ('PL','PEC','MPV','PLP','PDC');

create or replace view vw_votacoes_por_agente as
select
  ap.id as agente_politico_id, ap.cargo, ap.casa, ap.uf, par.sigla as partido_sigla,
  v.id as votacao_id, v.casa as votacao_casa, v.data_hora, v.objeto_votacao, v.resumo, v.aprovada,
  vp.voto, vp.voto_original,
  p.sigla, p.tipo, p.numero, p.ano, p.url_oficial
from votos_parlamentares vp
join votacoes v on v.id = vp.votacao_id
left join proposicoes p on p.id = v.proposicao_id
join agentes_politicos ap on ap.id = vp.agente_politico_id
left join partidos par on par.id = ap.partido_id;

create or replace view vw_distribuicao_tema as
select
  t.id as tema_id, t.nome as tema, t.slug as tema_slug,
  v.id as votacao_id, v.casa as votacao_casa, v.data_hora, v.objeto_votacao, v.resumo, v.aprovada,
  vp.voto, count(*) over (partition by t.id,v.id,vp.voto) as qtd_voto,
  ap.id as agente_politico_id, ap.nome, ap.cargo, ap.uf, par.sigla as partido_sigla,
  p.sigla, p.tipo, p.numero, p.ano
from votacao_temas vt
join temas t on t.id = vt.tema_id
join votacoes v on v.id = vt.votacao_id
join votos_parlamentares vp on vp.votacao_id = v.id
join agentes_politicos ap on ap.id = vp.agente_politico_id
left join partidos par on par.id = ap.partido_id
left join proposicoes p on p.id = v.proposicao_id
where t.ativo;
