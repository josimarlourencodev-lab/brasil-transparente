# Releases

Publicações oficiais com instalação/implantação no mundo real.

## v0.1.0-mobile — App Android (APK + bundles)

**Tag:** `v0.1.0-mobile`

**Assets:**
- `brasil-transparente-app-release.apk` (~85 MB, assinado `CN=Brasil Transparente`)
- `brasil-transparente-android.hbc` / `brasil-transparente-ios.hbc` (bundles Expo)

**Conteúdo desta versão:**
- Listagem/detalhe de notícias e políticos com modo escuro e fotos.
- **Player de podcast em segundo plano** com controles na notificação e na tela de bloqueio.
- **Thumbnails dos episódios** exibidas e usadas como arte do lock screen.
- Downgrade/normalização da instalação: desinstalar a versão antiga antes de instalar (mesmo keystore/assinatura).

### Como publicar uma nova versão do APK

1. Alterar o código em `apps/mobile`.
2. `expo prebuild` regenera `android/` — **reaplicar o bloco de assinatura** em `apps/mobile/android/app/build.gradle` (o prebuild sobrescreve).
3. Build assinado:
   ```sh
   export BRASIL_KEYSTORE=/caminho/brasil-transparente-release.keystore
   export BRASIL_KEYSTORE_PASSWORD=...  # ↑ preenchidos pelas variáveis
   ./gradlew --no-daemon :app:assembleRelease \
     -Dorg.gradle.workers.max=4 -Dorg.gradle.jvmargs="-Xmx3g -XX:MaxMetaspaceSize=1g"
   ```
4. Verificar a assinatura com `apksigner` (`CN=Brasil Transparente`, SHA-256 `1913c744...`).
5. Substituir o asset `.apk` na release `v0.1.0-mobile` (deletar o antigo na API e enviar o novo via `uploads.github.com`).

## Site (Vercel)

Não há "release" manual — o deploy é **automático** a partir do branch `main` (Vercel Git integration). Todo merge em `main` publica a produção.

## Notas de versionamento

- O portal não usa semver automático; o roteiro de evolução está em `ROADMAP.md`.
- As tags/releases são criadas manualmente quando há algo instalável (ex.: app mobile).
