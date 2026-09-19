# Deploy and Publishing

## Web (Vercel)

- **Automatic** deployment from the `main` branch (Git integration).
- Every PR merged into `main` publishes production. Optional manual deploy:
  ```sh
  vercel link --yes --team <team_id> --project <project_id>
  vercel --prod --yes
  ```
- **Current production URL:** `https://brasil-transparente-rust.vercel.app`
  (auto-generated subdomain; the custom domain `brasiltransparente.com.br` is pending
  configuration in *Settings → Domains*).
- **Warning — divergent domain:** `brasil-transparente.vercel.app` belongs to a
  **different Vercel project/account** (an unrelated application). It is not ours and
  is not under the `openbrazil` scope — do not fetch/consume data from that address.
- Environment variables configured in Vercel for **Production** and **Preview**
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`) — the same as in the
  [Security](seguranca.md) section. The local CLI config (`.vercel/project.json`) must
  point to `openbrazil/brasil-transparente`; the file is gitignored.

## Database + Storage (Supabase)

- Schema: `supabase/schema.sql` (SQL Editor).
- Storage bucket `podcast` — mimes: `audio/mpeg`, `audio/wav`, `audio/ogg`, `image/jpeg`.

## Mobile Android (APK release)

> Recurring steps in the project history.

1. Change the code in `apps/mobile`.
2. **`expo prebuild`** regenerates `android/` and **overwrites the signing block** → reapply manually in `apps/mobile/android/app/build.gradle`:
   ```
   signingConfigs { release { ... BRASIL_KEYSTORE ... } }
   ```
   (prefer editing/rewriting the `android {}` block — sed can corrupt it.)
3. Revert the scripts in `package.json` to normal use (`expo start --android`), if changed during prebuild.
4. Set the signing variables:
   ```sh
   export BRASIL_KEYSTORE=/path/brasil-transparente-release.keystore
   export BRASIL_KEYSTORE_PASSWORD=...
   export BRASIL_KEY_ALIAS=brasiltransparente
   export BRASIL_KEY_PASSWORD=...
   ```
5. Build:
   ```sh
   cd apps/mobile/android
   export JAVA_HOME=...       # e.g.: /home/<usr>/java/jdk-17.x
   export ANDROID_HOME=...    # e.g.: /home/<usr>/android-sdk
   ./gradlew --no-daemon :app:assembleRelease \
     -Dorg.gradle.workers.max=4 -Dorg.gradle.jvmargs="-Xmx3g -XX:MaxMetaspaceSize=1g"
   ```
6. **Verify the signature** with `apksigner` (Android SDK build-tools):
   - `CN=Brasil Transparente`
   - SHA-256: `1913c744...`
7. Publish in the `v0.1.0-mobile` release (e.g. `gh release` or the REST API):
   - delete the old `.apk` asset;
   - upload the new one via `POST /repos/<org>/<repo>/releases/<id>/assets?name=...` (uploads.github.com).

> Uninstall the old version before installing the new APK (same signature/keystore).

## Local mobile build environment

| Tool | Typical location |
|-----------|------------------|
| Node + pnpm | `~/.local/node-v22.x/bin` |
| JDK 17 | `~/java/jdk-17.x` |
| Android SDK | `~/android-sdk` |
| Release keystore | `~/android-keys/brasil-transparente-release.keystore` |