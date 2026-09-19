# Usage — Mobile app

The mobile app (Expo) is available for **Android** via APK in the `v0.1.0-mobile` release. It consumes the same backend as the site.

## Installation

1. Download `brasil-transparente-app-release.apk` from the [GitHub release](https://github.com/josimarlourencodev-lab/brasil-transparente/releases).
2. **Uninstall** any previous version of the app (same signature/keystore).
3. Install the `.apk`.

## Features

- **News**: list, search and detail with sources, people involved and contradictions.
- **Politicians**: gallery of candidates with photo, biography and record.
- **Dark mode**: compatible with the system theme.
- **Podcast**:
  - Episode list with **thumbnail**.
  - Player with **background playback** — keeps playing with the screen locked.
  - **Notification and lock screen controls** with the episode artwork (thumbnail).
  - Backward/forward buttons on the lock screen.

## Permissions

When tapping to listen on Android 13+, the app asks for **notification permission** (needed to show the background player controls).

## iOS

iOS bundles (`*.hbc`) are published for use with Expo, but the **documented official distribution process is the Android APK**.

## Tip

For installing/updating, also see [Deploy and Publishing](deploy.md) about the signed build flow.