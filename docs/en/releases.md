# Releases

Official publications with installation/deployment in the real world.

## v0.1.0-mobile — Android app (APK + bundles)

**Tag:** `v0.1.0-mobile`

**Assets:**
- `brasil-transparente-app-release.apk` (~85 MB, signed `CN=Brasil Transparente`)
- `brasil-transparente-android.hbc` / `brasil-transparente-ios.hbc` (Expo bundles)

**Contents of this version:**
- News/politicians listing and detail with dark mode and photos.
- **Background podcast player** with notification and lock screen controls.
- **Episode thumbnails** displayed and used as lock screen artwork.
- Install downgrade/normalization: uninstall the old version before installing (same keystore/signature).

### How to publish a new APK version

1. Change the code in `apps/mobile`.
2. `expo prebuild` regenerates `android/` — **reapply the signing block** in `apps/mobile/android/app/build.gradle` (prebuild overwrites it).
3. Signed build:
   ```sh
   export BRASIL_KEYSTORE=/path/brasil-transparente-release.keystore
   export BRASIL_KEYSTORE_PASSWORD=...  # ↑ filled by the variables
   ./gradlew --no-daemon :app:assembleRelease \
     -Dorg.gradle.workers.max=4 -Dorg.gradle.jvmargs="-Xmx3g -XX:MaxMetaspaceSize=1g"
   ```
4. Verify the signature with `apksigner` (`CN=Brasil Transparente`, SHA-256 `1913c744...`).
5. Replace the `.apk` asset in the `v0.1.0-mobile` release (delete the old one via the API and upload the new one via `uploads.github.com`).

## Site (Vercel)

There is no "manual" release — the deploy is **automatic** from the `main` branch (Vercel Git integration). Every merge into `main` publishes production.

## Versioning notes

- The portal does not use automatic semver; the evolution roadmap is in `ROADMAP.md`.
- Tags/releases are created manually when there is something installable (e.g. the mobile app).