# Banco de dados (Supabase)

Postgres + PostgREST com **Row Level Security (RLS)**. O schema está em `supabase/schema.sql` para o núcleo; a tabela de podcast foi criada via Supabase Management API (não está no arquivo).

## Tabelas principais

### `politicos`

Políticos monitorados (ex.: presidenciáveis 2026) com biografia e termos de busca.

### `noticias`

Matérias coletadas e sintetizadas.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | bigserial | PK |
| `titulo` | text | |
| `url` | text | **unique** (dedupe) |
| `resumo` | text | sintetizado pela IA |
| `categoria` | text | entre categorias pré-definidas |
| `tipo_fonte` | text | `oficial` \| `oposicao` \| `imprensa` \| `desconhecida` |
| `status` | text | `rascunho` \| `revisao` \| `publicado` \| `rejeitado` |
| `contradicao_detectada` | bool | |
| `contradicao_descricao` | text | |
| `metadata` | jsonb | `envolvidos`, `contradicao_referencias`, `status_sintese` |
| `politico_id` | bigint | FK → `politicos` |

### `fontes`

Fontes primárias associadas a cada notícia.

### `categorias`

Categorias editoriais.

### `historico`

Afirmações/posições passadas por político (base para detectar contradições).

### `audit_log`

Registro de operações para auditoria.

### `podcast_episodios`

Episódios do podcast semanal.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | bigint | PK |
| `titulo` | text | |
| `descricao` | text | |
| `roteiro` | text | roteiro completo do episódio |
| `audio_url` | text | URL pública no Storage |
| `duracao_seg` | integer | |
| `publicado_em` | timestamptz | |
| `criado_em` | timestamptz | |
| `thumb_url` | text | thumbnail pública no Storage |

> A coluna `thumb_url` foi adicionada posteriormente via Management API.

## Storage (buckets)

| Bucket | Público | Mime permitidos | Uso |
|--------|---------|-----------------|-----|
| `podcast` | sim | `audio/mpeg`, `audio/wav`, `audio/ogg`, `image/jpeg` | MP3s e thumbnails dos episódios |

## Segurança / RLS

- **Leitura pública**: apenas `status='publicado'` (políticas por tabela).
- **Escrita**: apenas via `service_role` (REST interno) — o cliente web/mobile usa a chave `anon`, sem permissão de escrita.
- Extensão **`pg_trgm`** habilitada para busca textual avançada (futura).

## Operar o banco

- **Schema**: aplicar `supabase/schema.sql` no Supabase Cloud (SQL Editor).
- **Queries de manutenção via Management API**:
  ```
  POST https://api.supabase.com/v1/projects/<PROJECT_REF>/database/query
  Authorization: Bearer <PAT>
  { "query": "..." }
  ```
- **REST**: `https://<ref>.supabase.co/rest/v1` com `apikey`/`Bearer <service_role>` para escrita.
