-- ============================================================
-- Brasil Transparente - Podcast
-- Episódios do podcast e bucket público para os áudios.
-- Idempotente (pode ser re-executado).
-- ============================================================

-- Episódios do podcast (roteiro TTS gerado semanalmente).
create table if not exists podcast_episodios (
  id bigserial primary key,
  titulo text not null,
  descricao text,
  roteiro text not null,
  audio_url text not null,
  duracao_seg integer,
  publicado_em timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

create index if not exists idx_podcast_publicado
  on podcast_episodios(publicado_em desc);

-- ============================================================
-- Row Level Security (RLS)
-- Leitura pública; escrita protegida (via service_role).
-- ============================================================

alter table podcast_episodios enable row level security;

create policy "leitura publica podcast"
  on podcast_episodios for select using (true);

-- Bucket público para os arquivos de áudio.
-- Criação idempotente via insert ... on conflict (nome) do nothing.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'podcast',
  'podcast',
  true,
  52428800,
  array['audio/mpeg', 'audio/wav', 'audio/ogg']
)
on conflict (id) do nothing;

-- Permite leitura pública dos objetos do bucket (public=true já cobre,
-- mas a policy explicita deixe auditável).
create policy "leitura publica podcast audio"
  on storage.objects for select
  using (bucket_id = 'podcast');