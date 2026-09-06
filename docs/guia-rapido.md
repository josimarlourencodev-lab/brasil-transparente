# Guia rápido — O que já foi feito

Resumo executivo do estado atual do projeto. Detalhes por área em [Entregas por área](entregas.md).

## Estado atual (2026-09)

- **Site** em produção na Vercel — `https://brasil-transparente-rust.vercel.app` (deploy automático do `main` + manual via `vercel --prod`).
- **App mobile** publicado (Android APK release + bundles Expo hbc) na release `v0.1.0-mobile`.
- **Podcast semanal** com thumbnail, reprodução em segundo plano e arte na tela de bloqueio.
- **Ingestão autônoma** 4×/dia via GitHub Actions, com síntese neutra por IA.
- **Restrição de tema** no prompt: celebridades, esportes e entretenimento são **ignorados** (não entram no site).
- **Páginas novas**: `/pitch` (apresentação com slides, voz IA e vídeo) e `/documentacao` (documentação interna).

## Linha do tempo das grandes entregas

1. **Base do portal** — Next.js + Supabase + RLS, API pública de notícias/políticos, painel `/admin`.
2. **Ingestão + síntese neutra** — Python cron 4×/dia, LLM estruturando resumo/categoria/envolvidos/contradições.
3. **Mobile (Expo)** — listas e detalhes de notícias/políticos com modo escuro e fotos.
4. **Podcast semanal** — roteiro gerado por IA, narração via edge-tts, upload ao Supabase Storage e página de episódios.
5. **Mobile release** — player de podcast em segundo plano, controles na notificação/tela de bloqueio; APK assinado publicado.
6. **Thumbnails dos episódios** — geradas automaticamente (JPEG 1200×675) e exibidas no site e no app; usadas como arte do lock screen.
7. **Restrição de tema** — o prompt de síntese passa a ignorar celebridades/esportes/entretenimento.
8. **Pitch do projeto** — 10 slides, narração em voz IA (PT-BR) e vídeo MP4 na página `/pitch`.
9. **Documentação e navegação** — página interna `/documentacao`, links de GitHub/Documentação no header e rodapé.
10. **Correção de deploy** — produção verificada no domínio correto da Vercel e env vars de Production/Preview configuradas.

## Itens recentes entregues

- [x] **Link "Painel do auditor" removido** do rodapé do site (rota `/admin` continua existindo).
- [x] **Coluna `thumb_url`** em `podcast_episodios` + thumbnail publicada para os episódios existentes.
- [x] **`pillow==12.3.0`** adicionado ao lockfile para geração das thumbnails.
- [x] **Podcast em segundo plano**: player global, `enableBackgroundPlayback`, controles na notificação/lock screen, permissão Android 13+.
- [x] **Restrição no prompt** para ignorar celebridades e esportes.
- [x] **Admin**: adicionar e remover matérias manualmente (não é mais somente leitura).
- [x] **Imagens de capa/interior** das notícias na listagem e no detalhe; **fotos dos políticos** na galeria.
- [x] **Página `/pitch`** — apresentação com slides, narração (voz IA) e vídeo MP4.
- [x] **Página `/documentacao`** — documentação interna no Design System do portal.
- [x] **Navegação** — "GitHub" (nova aba) e "Documentação" no header; "O Brasil Transparente" (pitch) e "Repositório GitHub" no rodapé.
- [x] **Deploy/domínio** — diagnóstico do domínio divergente na Vercel; produção em `brasil-transparente-rust.vercel.app` com env vars de Production/Preview.

## Pendências conhecidas

- **Domínio próprio** `brasiltransparente.com.br` (hoje a produção usa o subdomínio auto-gerado `-rust`).
- Busca histórica profunda (matérias antigas) é iteração futura — RSS/Google News não indexam arquivos antigos.
