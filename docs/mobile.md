# Mobile (Expo / React Native)

App em `apps/mobile`, workspace aninhado do monorepo (pnpm). Consome o mesmo backend do site (chave `anon`, RLS).

## Estrutura relevante

| Arquivo | Papel |
|---------|-------|
| `src/screens/PodcastScreen.tsx` | Lista de episódios + player + lock screen |
| `src/lib/audio.ts` | Player global (`createAudioPlayer`) + configuração de áudio de fundo |
| `src/components/ImagemRemota.tsx` | Imagem remota via `expo-image` |
| `src/lib/supabase.ts` | Cliente Supabase |
| `src/types/index.ts` | Tipos (`PodcastEpisodio` com `thumb_url`) |
| `app.json` | Plugins: `expo-audio` (`enableBackgroundPlayback`) + `expo-image` |

## Player de podcast em segundo plano

- **Player global** reutilizável criado com `createAudioPlayer()`.
- **Modo de áudio**:
  ```ts
  setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: "doNotMix",
  });
  ```
- **Notificação / lock screen**:
  ```ts
  setActiveForLockScreen(
    true,
    { title, artist: "Brasil Transparente", artworkUrl: thumb_url },
    { showSeekBackward: true, showSeekForward: true }
  );
  ```
- **Android 13+**: permissão de notificação solicitada para exibir os controles.
- **Manifest**: gera `AudioControlsService` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK`.

## Thumbnails dos episódios

- Selecionadas do backend (`thumb_url` em `podcast_episodios`).
- Exibidas no card via `ImagemRemota`.
- Usadas como `artworkUrl` no `setActiveForLockScreen`.

## Leitura dos dados

- Supabase client com chave `anon`; URLs em `app.json → expo.extra`.
- Consulta `podcast_episodios` ordenada por `publicado_em` desc, com `thumb_url`.

## Desenvolvimento

```sh
cd apps/mobile
pnpm install
npx expo start
```

Typecheck do app: `npx tsc --noEmit`.

## Build e release

Ver [Deploy e publicação](deploy.md) e [Releases](releases.md) — inclui `expo prebuild`, reaplicar assinatura e `assembleRelease`.
