# Brasil Transparente — App Mobile (Expo/React Native)

Módulo desacoplado do monorepo para consumir o **mesmo backend Supabase** do
Next.js. Pronto para rodar via Expo Go ou build nativo.

## Estrutura

```
apps/mobile/
├── App.tsx                 # estação de entrada
├── app.json                # configuração Expo (urls/keys em expo.extra)
├── src/
│   ├── screens/NewsScreen.tsx   # feed de notícias (mobile-first)
│   ├── lib/supabase.ts          # cliente Supabase compartilhado
│   └── types/index.ts           # tipos (espelham src/types do web)
└── package.json
```

## Executar

```bash
cd apps/mobile
pnpm install
pnpm exec expo start
```

Impressora de QR → Expo Go no celular.

## Configuração do backend

Em `app.json`, campo `expo.extra`:

```json
"extra": {
  "supabaseUrl": "http://IP-DA-SUA-MAQUINA:54321",
  "supabaseAnonKey": "copie de .env.local.dev -> NEXT_PUBLIC_SUPABASE_ANON_KEY"
}
```

> O celular precisa acessar o PostgREST dev publicado na sua rede local;
> use o IP da máquina, não `localhost`.

## Build para testes (bundles Android + iOS)

```bash
cd apps/mobile
npx expo export --platform android --platform ios --output-dir dist/prod
```

Gera os bundles Hermes prontos para Android e iOS em `dist/prod`. O app usa o
backend **de produção** (`expo.extra` em `app.json`) — ideal para validar o
funcionamento antes de gerar um release.

## Build nativo via EAS (APK/AAB e IPA)

```bash
cd apps/mobile
npx eas-cli@latest login        # conta Expo
npx eas-cli@latest build --platform android   # APK (preview) ou AAB (production)
npx eas-cli@latest build --platform ios       # requer Apple Developer
```

Perfis em `eas.json`: `preview` (APK interno) e `production` (AAB / App Store).
Os artefatos gerados podem ser publicados como **GitHub Release**.

## Publicar release no GitHub

```bash
gh release create v0.1.0 dist/prod/_expo/static/js/android/*.hbc \
  dist/prod/_expo/static/js/ios/*.hbc --title "v0.1.0" --notes "..."
```

## RLS

O cliente usa a chave **anon** (leitura pública), conectando às mesmas policies
`status = 'publicado'` do schema — nenhum dado administrativo é exposto.