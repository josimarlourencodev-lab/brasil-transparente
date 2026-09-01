-- ============================================================
-- Brasil Transparente - Inicialização do Postgres local (Docker)
-- Cria papéis e permissões usados pelo PostgREST de dev.
-- ============================================================

-- Papéis usados pelos tokens JWT (anon → leitura, service_role → escrita).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator nologin;
  end if;
end$$;

grant anon, service_role to authenticator;

-- Concede uso do schema e de todas as sequências/tabelas nos papéis.
grant usage on schema public to anon, service_role;

-- Grants explícitos sobre TODAS as tabelas/sequências JÁ EXISTENTES (as do
-- schema.sql rodam antes deste script; alter default privileges não as cobre).
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, service_role;
grant execute on all functions in schema public to anon, service_role;

-- Default privileges para objetos criados depois (ex.: migrações futuras).
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, service_role;

-- Seeder opcional para desenvolvimento/testes manuais.
insert into politicos (nome, partido, cargo, ativo, termos_busca)
select 'Nome Exemplo', 'Partido', 'Cargo', true, '{exemplo}'
where not exists (select 1 from politicos where nome = 'Nome Exemplo');

-- Dados de demonstração exibidos enquanto não há coleto real.
insert into categorias (nome, descricao)
values
  ('Corrupção', 'Casos de desvio, favorecimento e improbidade'),
  ('Economia', 'Política fiscal, orçamento e mercado'),
  ('Eleições', 'Disputas, candidaturas e calendário eleitoral')
on conflict (nome) do nothing;