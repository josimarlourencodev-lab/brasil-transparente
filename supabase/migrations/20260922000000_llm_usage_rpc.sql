-- ============================================================
-- Brasil Transparente - Orçamento de tokens do LLM via RPC
--
-- O GitHub Actions não tem o secret SUPABASE_SERVICE_ROLE_KEY,
-- então o pipeline usa a ANON key (NEXT_PUBLIC_SUPABASE_ANON_KEY,
-- única credencial Supabase presente no repositório). Funções RPC
-- SECURITY DEFINER executam como postgres e permitem ler/gravar a
-- tabela llm_usage sem expor o RLS ao anon. Idempotente.
-- ============================================================

create or replace function public.record_llm_usage(tokens integer)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.llm_usage (tokens)
  values (tokens);
$$;

create or replace function public.llm_usage_sum_since(since timestamptz)
returns bigint
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(sum(tokens), 0)
  from public.llm_usage
  where criado_em >= since;
$$;

grant execute on function public.record_llm_usage(integer) to anon, service_role;
grant execute on function public.llm_usage_sum_since(timestamptz) to anon, service_role;

-- ============================================================
-- Recomendação: revogar o execute da anon caso a service_role seja
-- configurada no CI (deixa o orçamento gravável/congelável apenas
-- pelo backend). Enquanto a anon detém o execute, qualquer tráfego
-- público pode chamar record_llm_usage e inflar o orçamento (DoS
-- do próprio pipeline) — risco aceito para o plano gratuito.
-- ============================================================