# Deploy e publicação

## Web (Vercel)

- Deploy **automático** a partir do branch `main` (Git integration).
- Toda PR mergeada em `main` publica a produção.
- Variáveis de ambiente configuradas na Vercel (mesmas da seção [Segurança](seguranca.md)).

## Banco + Storage (Supabase)

- Schema: `supabase/schema.sql` (SQL Editor).
- Storage bucket `podcast` — mimes: `audio/mpeg`, `audio/wav`, `audio/ogg`, `image/jpeg`.

## Mobile Android (APK release)

> Passos recorrentes no histórico do projeto.

1. Alterar o código em `apps/mobile`.
2. **`expo prebuild`** regenera `android/` e **sobrescreve o bloco de assinatura** → reaplicar manualmente em `apps/mobile/android/app/build.gradle`:
   ```
   signingConfigs { release { ... BRASIL_KEYSTORE ... } }
   ```
   (preferir editar/re-escrever o bloco `android {}` — sed pode corromper.)
3. Reverter os scripts do `package.json` para uso normal (`expo start --android`), se alterado no prebuild.
4. Definir variáveis de assinatura:
   ```sh
   export BRASIL_KEYSTORE=/caminho/brasil-transparente-release.keystore
   export BRASIL_KEYSTORE_PASSWORD=...
   export BRASIL_KEY_ALIAS=brasiltransparente
   export BRASIL_KEY_PASSWORD=...
   ```
5. Build:
   ```sh
   cd apps/mobile/android
   export JAVA_HOME=...       # ex.: /home/<usr>/java/jdk-17.x
   export ANDROID_HOME=...    # ex.: /home/<usr>/android-sdk
   ./gradlew --no-daemon :app:assembleRelease \
     -Dorg.gradle.workers.max=4 -Dorg.gradle.jvmargs="-Xmx3g -XX:MaxMetaspaceSize=1g"
   ```
6. **Verificar a assinatura** com `apksigner` (do Android SDK build-tools):
   - `CN=Brasil Transparente`
   - SHA-256: `1913c744...`
7. Publicar na release `v0.1.0-mobile` (ex.: `gh release` ou API REST):
   - apagar o asset `.apk` antigo;
   - enviar o novo via `POST /repos/<org>/<repo>/releases/<id>/assets?name=...` (uploads.github.com).

> Desinstalar a versão antiga antes de instalar o novo APK (mesma assinatura/keystore).

## Ambiente local do build mobile

| Ferramenta | Local típico |
|-----------|--------------|
| Node + pnpm | `~/.local/node-v22.x/bin` |
| JDK 17 | `~/java/jdk-17.x` |
| Android SDK | `~/android-sdk` |
| Keystore release | `~/android-keys/brasil-transparente-release.keystore` |
