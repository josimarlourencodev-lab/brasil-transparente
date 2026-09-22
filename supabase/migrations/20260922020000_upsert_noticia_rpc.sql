-- ============================================================
-- Brasil Transparente - Upsert de notícias via RPC
--
-- O GitHub Actions não tem o secret SUPABASE_SERVICE_ROLE_KEY,
-- então a escrita em `noticias` (RLS com leitura pública apenas)
-- passa a ser feita por uma função RPC SECURITY DEFINER, acessível
-- pela ANON key (NEXT_PUBLIC_SUPABASE_ANON_KEY). A função roda como
-- postgres (dono da tabela), ignorando o RLS, e aceita um único
-- argumento jsonb com os campos da notícia. Idempotente.
--
-- Segurança: sem grants de insert/update em `noticias` para anon;
-- a anon só consegue escrever chamando esta RPC. Recomenda-se
-- revogar o execute da anon quando a service_role for configurada.
-- ============================================================

create or replace function public.upsert_noticia(dados jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  novo_id bigint;
begin
  insert into public.noticias (
    titulo,
    url,
    url_fonte,
    imagem_url,
    resumo,
    categoria,
    tipo_fonte,
    publicado_em,
    coletado_em,
    status,
    contradicao_detectada,
    contradicao_descricao,
    metadata,
    politico_id
  )
  values (
    dados ->> 'titulo',
    dados ->> 'url',
    dados ->> 'url_fonte',
    dados ->> 'imagem_url',
    dados ->> 'resumo',
    dados ->> 'categoria',
    dados ->> 'tipo_fonte',
    (dados ->> 'publicado_em')::timestamptz,
    (dados ->> 'coletado_em')::timestamptz,
    dados ->> 'status',
    coalesce((dados ->> 'contradicao_detectada')::boolean, false),
    dados ->> 'contradicao_descricao',
    dados -> 'metadata',
    (dados ->> 'politico_id')::bigint
  )
  on conflict (url) do update set
    titulo = excluded.titulo,
    url_fonte = excluded.url_fonte,
    imagem_url = excluded.imagem_url,
    resumo = excluded.resumo,
    categoria = excluded.categoria,
    tipo_fonte = excluded.tipo_fonte,
    publicado_em = excluded.publicado_em,
    coletado_em = excluded.coletado_em,
    status = excluded.status,
    contradicao_detectada = excluded.contradicao_detectada,
    contradicao_descricao = excluded.contradicao_descricao,
    metadata = excluded.metadata,
    politico_id = excluded.politico_id
  returning id into novo_id;

  return novo_id;
end;
$$;

grant execute on function public.upsert_noticia(jsonb) to anon, service_role;