# Guia rápido — O que já foi feito

Resumo executivo do estado atual do projeto. Detalhes por área em [Entregas por área](entregas.md).

## Estado atual (2026-09)

- **Site** em produção na Vercel (deploy automático do `main`).
- **App mobile** publicado (Android APK release + bundles Expo hbc) na release `v0.1.0-mobile`.
- **Podcast semanal** com thumbnail, reprodução em segundo plano e arte na tela de bloqueio.
- **Ingestão autônoma** 4×/dia via GitHub Actions, com síntese neutra por IA.
- **Restrição de tema** no prompt: celebridades, esportes e entretenimento são **ignorados** (não entram no site).

## Linha do tempo das grandes entregas

1. **Base do portal** — Next.js + Supabase + RLS, API pública de notícias/políticos, painel `/admin`.
2. **Ingestão + síntese neutra** — Python cron 4×/dia, LLM estruturando resumo/categoria/envolvidos/contradições.
3. **Mobile (Expo)** — listas e detalhes de notícias/políticos com modo escuro e fotos.
4. **Podcast semanal** — roteiro gerado por IA, narração via edge-tts, upload ao Supabase Storage e página de episódios.
5. **Mobile release** — player de podcast em segundo plano, controles na notificação/tela de bloqueio; APK assinado publicado.
6. **Thumbnails dos episódios** — geradas automaticamente (JPEG 1200×675) e exibidas no site e no app; usadas como arte do lock screen.
7. **Restrição de tema** — o prompt de síntese passa a ignorar celebridades/esportes/entretenimento.

## Itens recentes entregues

- [x] **Link "Painel do auditor" removido** do rodapé do site (rota `/admin` continua existindo).
- [x] **Coluna `thumb_url`** em `podcast_episodios` + thumbnail publicada para os episódios existentes.
- [x] **`pillow==12.3.0`** adicionado ao lockfile para geração das thumbnails.
- [x] **Podcast em segundo plano**: player global, `enableBackgroundPlayback`, controles na notificação/lock screen, permissão Android 13+.
- [x] **Restrição no prompt** para ignorar celebridades e esportes.

## Pendências conhecidas

- Administração de matérias no `/admin` é somente leitura (adicionar/remover manualmente é futura).
- Imagens de capa/interior das notícias ainda em desenvolvimento.
- Busca histórica profunda (matérias antigas) é iteração futura — RSS/Google News não indexam arquivos antigos.
