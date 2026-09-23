-- ============================================================
-- Brasil Transparente - Thumbnail JPG no bucket do podcast
--
-- O bucket 'podcast' só permitia mime de áudio; o upload da capa
-- (image/jpeg) era rejeitado com 400 e o episódio ficava sem
-- thumb_url. Idempotente.
-- ============================================================

update storage.buckets
set allowed_mime_types = array['audio/mpeg', 'audio/wav', 'audio/ogg', 'image/jpeg']
where id = 'podcast';