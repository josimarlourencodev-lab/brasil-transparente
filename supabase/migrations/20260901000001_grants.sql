-- ============================================================
-- Permissões mínimas para os papéis do PostgREST (nuvem).
-- Idempotente: no Supabase Cloud os papéis anon/service_role já
-- existem; aqui apenas garantimos os grants de schema/objetos.
-- ============================================================

grant usage on schema public to anon, service_role;

-- Grants sobre objetos existentes (criados na migration anterior).
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, service_role;
grant execute on all functions in schema public to anon, service_role;

-- Default privileges para objetos criados depois.
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, service_role;