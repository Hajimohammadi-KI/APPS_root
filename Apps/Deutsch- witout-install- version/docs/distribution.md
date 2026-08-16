# DeutschFlow verteilen

Die Web-App läuft unter
`https://deutschflow-grammar.vercel.app`. Die Store-Hüllen verwenden genau
diese öffentliche HTTPS-Adresse, damit alle Plattformen dieselben Inhalte und
Offline-Daten erhalten.

## Pakettypen

- Android: Das erzeugte ZIP enthält eine signierte APK für Direktinstallation,
  eine AAB für Google Play, den Android-Quellcode, `assetlinks.json` und den
  privaten Upload-Keystore.
- Windows: Solange `storeIdentityConfigured` in
  `distribution/store-package.config.json` auf `false` steht, wird ein
  selbstsigniertes Sideload-Paket erzeugt. Für Microsoft Store müssen zuerst
  App-Name und Produktidentität im Partner Center reserviert und die drei
  Publisher-Werte in der Konfiguration ersetzt werden.
- iOS/iPadOS: Das ZIP enthält ein Xcode-Projekt. Ein signiertes IPA und die
  App-Store-Einreichung benötigen Apple Developer, eine unveränderliche Bundle
  ID sowie macOS mit Xcode.

## Pakete neu erzeugen

```powershell
bun run package:stores
```

Einzelne Plattform:

```powershell
bun run package:stores --platform=android
bun run package:stores --platform=windows
bun run package:stores --platform=ios
```

Die Ergebnisse landen in `artifacts/store-packages/` und werden absichtlich
nicht in Git gespeichert.

Die aktuell direkt weitergebbaren Dateien liegen in
`artifacts/store-packages/share/`:

- `DeutschFlow-Setup.exe` – geführter Windows-Installer mit frei wählbarem
  Installationsordner sowie Desktop- und Startmenü-Verknüpfung
- `DeutschFlow-Android.apk`
- `DeutschFlow-Windows-Sideload.zip`
- `DeutschFlow-iOS-Xcode.zip` (für die Weitergabe an die Person mit
  Mac/Xcode, nicht direkt auf iPhone installierbar)

Das Google-Play-Bundle liegt getrennt unter
`artifacts/store-packages/google-play/DeutschFlow-Android.aab`.

Der benutzerfreundliche Windows-Installer wird mit folgendem Befehl neu
erstellt:

```powershell
bun run package:windows-exe
```

Der Setup-Assistent ist auf Deutsch, fragt nach dem Installationsordner und
startet DeutschFlow nach erfolgreicher Installation. Ohne ein kommerzielles
Windows-Code-Signing-Zertifikat kann Windows beim ersten Öffnen zusätzlich eine
SmartScreen-Warnung anzeigen.

## Wichtige Schlüsselregel

Das erste Android-Paket erzeugt einen neuen Upload-Keystore. Keystore und
Passwortdatei müssen sicher gesichert werden. Für jede spätere Aktualisierung
derselben Google-Play-App muss derselbe Schlüssel verwendet werden. Niemals
einen neuen Schlüssel für ein Update erzeugen.

Das vollständige `DeutschFlow-Android.zip` darf nicht verteilt werden, weil es
den privaten Keystore und dessen Passwortdatei enthält. Nur die APK aus dem
Ordner `share` darf direkt an Testpersonen gegeben werden.

Nachdem Google Play die AAB übernommen hat, signiert Google die App erneut. Der
SHA-256-Fingerprint aus **Play Console → App integrity → App signing** muss dann
als zweiter Fingerprint in
`apps/web/public/.well-known/assetlinks.json` ergänzt und neu veröffentlicht
werden.
