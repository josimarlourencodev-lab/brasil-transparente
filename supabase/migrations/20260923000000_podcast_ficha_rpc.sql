-- ============================================================
-- Brasil Transparente - Podcast e Ficha via RPC (sem service_role)
--
-- O GitHub Actions não tem o secret SUPABASE_SERVICE_ROLE_KEY. A escrita
-- em podcast_episodios e ficha_politico passa a ser feita por funções RPC
-- SECURITY DEFINER acessíveis pela ANON key, e o bucket de storage ganha
-- policies de escrita para a anon. Idempotente.
--
-- Também corrige a falta da coluna thumb_url em podcast_episodios (a
-- gravação do episódio falhava mesmo com service_role por isso).
-- ============================================================

-- Corrige coluna omitida no schema original do podcast (bug latente).
alter table podcast_episodios
  add column if not exists thumb_url text;

-- ------------------------------------------------------------
-- Podcast: insere o episódio e devolve o id (upsert não faz
-- sentido aqui — a deduplicação é feita antes pela checagem de título).
-- ------------------------------------------------------------
create or replace function public.registrar_episodio(dados jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  novo_id bigint;
begin
  insert into public.podcast_episodios (
    titulo,
    descricao,
    roteiro,
    audio_url,
    duracao_seg,
    publicado_em,
    thumb_url
  )
  values (
    dados ->> 'titulo',
    dados ->> 'descricao',
    dados ->> 'roteiro',
    dados ->> 'audio_url',
    (dados ->> 'duracao_seg')::integer,
    (dados ->> 'publicado_em')::timestamptz,
    dados ->> 'thumb_url'
  )
  returning id into novo_id;

  return novo_id;
end;
$$;

grant execute on function public.registrar_episodio(jsonb) to anon, service_role;

-- ------------------------------------------------------------
-- Storage: permite que a anon faça upload/upsert dos arquivos do
-- podcast (bucket público). Leitura já era pública.
-- ------------------------------------------------------------
grant insert, update on storage.objects to anon;

create policy "escrita podcast anon"
  on storage.objects for insert to anon
  with check (bucket_id = 'podcast');

create policy "atualizacao podcast anon"
  on storage.objects for update to anon
  using (bucket_id = 'podcast');

-- ------------------------------------------------------------
-- Ficha: substitui TODA a ficha do político (apaga + insere) de forma
-- atômica, sem dar insert/delete de anon na tabela.
-- ------------------------------------------------------------
create or replace function public.substituir_ficha(p_politico_id bigint, casos jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  c jsonb;
  agora timestamptz := now();
begin
  delete from public.ficha_politico where politico_id = p_politico_id;

  if casos is null then
    return true;
  end if;

  for c in select value from jsonb_array_elements(casos) loop
    insert into public.ficha_politico (
      politico_id,
      tipo,
      status,
      titulo,
      descricao,
      orgao,
      data_fato,
      fontes,
      criado_em,
      atualizado_em
    )
    values (
      p_politico_id,
      c ->> 'tipo',
      c ->> 'status',
      c ->> 'titulo',
      c ->> 'descricao',
      c ->> 'orgao',
      nullif(c ->> 'data_fato', '')::timestamptz,
      coalesce(
        (select array_agg(x::text)
           from jsonb_array_elements_text(coalesce(c -> 'fontes', '[]'::jsonb)) as x),
        '{}'
      ),
      agora,
      agora
    );
  end loop;

  return true;
end;
$$;

grant execute on function public.substituir_ficha(bigint, jsonb) to anon, service_role;

-- ============================================================
-- Recomendação: revogar o execute da anon e as policies de storage
-- caso a service_role seja configurada no CI. Enquanto anon detém o
-- acesso, qualquer tráfego público pode inserir episódios/casos (risco
-- aceito no plano gratuito — os arquivos do bucket estão limitados a
-- 50MB e a escrita para 'podcast').
-- ============================================================