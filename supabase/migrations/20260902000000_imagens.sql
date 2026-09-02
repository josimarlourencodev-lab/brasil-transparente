-- ============================================================
-- Brasil Transparente - Imagens
-- Adiciona imagem de capa às notícias e foto aos políticos.
-- Idempotente (pode ser re-executado).
-- ============================================================

-- Imagem de capa da notícia (URL limpa, extraída do RSS/media:content).
alter table noticias
  add column if not exists imagem_url text;

-- Foto do político (URL da imagem do perfil).
alter table politicos
  add column if not exists foto_url text;

-- Índice auxiliar de apoio (não obrigatório, mantém buscas simples).
create index if not exists idx_noticias_imagem on noticias(imagem_url);
