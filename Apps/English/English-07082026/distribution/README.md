# Multi-platform distribution

The hosted PWA is the shared product core. PWABuilder wraps that secure origin
into platform-specific projects and packages without maintaining three
separate copies of the learning system.

## Generated outputs

Run:

```powershell
bun run package:stores
```

The command validates the public manifest and writes release files under
`distribution/build/`:

- `android/*.zip`: signed test APK, Google Play AAB, signing key, and Digital
  Asset Links instructions.
- `windows/*.zip`: Windows package bundle, certificate, and test installer.
- `ios/*.zip`: Xcode project for App Store or TestFlight signing on a Mac.

Never publish the complete Android ZIP or its signing key. Give testers only
the APK. Back up the signing key and passwords privately; future Android
updates must be signed with the same identity.

The release certificate fingerprint is published at
`/.well-known/assetlinks.json` so the direct APK can verify the web origin and
run as a Trusted Web Activity. After enabling Google Play App Signing, append
the Play Console app-signing certificate fingerprint to that public file and
redeploy before production rollout.

## Direct sharing

- Windows: unzip the Windows package and run its supplied `install.ps1`. A
  public audience should normally receive it through Microsoft Store so that
  Windows trusts the Store signature.
- Android: share the APK with a small test group, or upload the AAB to a Google
  Play test track. Android users may need to allow installation from the file
  source for direct APK testing.
- iOS/iPadOS: the generated Xcode project must be opened, built, and signed on
  macOS with Xcode. Distribute through TestFlight or the App Store. Apple does
  not permit a generally installable unsigned IPA.

## Integrated local PDF Reader on Windows

The modern Windows installer embeds the verified `Research PDF Studio` build
beside the English web/API payload. The desktop launcher starts it on
`127.0.0.1:4332`, requires the exact `/api/health` service contract, and opens
Notebook links in a separate sandboxed Electron window. A listening port with
the wrong service is reported as unavailable rather than ready.

Local PDFs selected through the desktop control are copied to the preserved
English user-data folder using a SHA-256 identifier. Only the loopback Reader
can fetch that import; paths are never accepted from a URL and the endpoint is
not available to same-Wi-Fi clients. Highlights, comments, and reading state
remain in the Reader browser profile through update and repair. Keep the
version-matched `.payload.zip` beside the setup executable.

## Store submission identities

The generated packages use the stable ID
`com.englishgrammarautomaticity.app`. Do not change it after publishing.

Microsoft Store replaces the test publisher with the Partner Center identity.
Google Play requires a Play Console developer account and recommends Play App
Signing. Apple requires an Apple Developer Program membership, an App Store
Connect app record, and a matching Xcode team.

The final public submission still needs the owner's public support email and
legal publisher name. No certificate, password, service-account JSON, or
store credential belongs in source control.
