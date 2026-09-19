# Mobile (Expo / React Native)

App in `apps/mobile`, nested workspace of the monorepo (pnpm). Consumes the same backend as the site (`anon` key, RLS).

## Relevant structure

| File | Role |
|---------|-------|
| `src/screens/PodcastScreen.tsx` | Episode list + player + lock screen |
| `src/lib/audio.ts` | Global player (`createAudioPlayer`) + background audio configuration |
| `src/components/ImagemRemota.tsx` | Remote image via `expo-image` |
| `src/lib/supabase.ts` | Supabase client |
| `src/types/index.ts` | Types (`PodcastEpisodio` with `thumb_url`) |
| `app.json` | Plugins: `expo-audio` (`enableBackgroundPlayback`) + `expo-image` |

## Background podcast player

- **Global reusable player** created with `createAudioPlayer()`.
- **Audio mode:**
  ```ts
  setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: "doNotMix",
  });
  ```
- **Notification / lock screen:**
  ```ts
  setActiveForLockScreen(
    true,
    { title, artist: "Brasil Transparente", artworkUrl: thumb_url },
    { showSeekBackward: true, showSeekForward: true }
  );
  ```
- **Android 13+**: notification permission requested to show the controls.
- **Manifest:** generates `AudioControlsService` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK`.

## Episode thumbnails

- Fetched from the backend (`thumb_url` in `podcast_episodios`).
- Shown in the card via `ImagemRemota`.
- Used as `artworkUrl` in `setActiveForLockScreen`.

## Data reading

- Supabase client with the `anon` key; URLs in `app.json → expo.extra`.
- Queries `podcast_episodios` ordered by `publicado_em` desc, including `thumb_url`.

## Development

```sh
cd apps/mobile
pnpm install
npx expo start
```

App typecheck: `npx tsc --noEmit`.

## Build and release

See [Deploy and Publishing](deploy.md) and [Releases](releases.md) — includes `expo prebuild`, reapplying the signature and `assembleRelease`.