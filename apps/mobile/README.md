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

## RLS

O cliente usa a chave **anon** (leitura pública), conectando às mesmas policies
`status = 'publicado'` do schema — nenhum dado administrativo é exposto.