# Installations-Roadmap

Der Windows-Installer verwendet denselben verständlichen Lebenszyklus wie
`Cross_Repository_Code_Intelligence-Version2`, ist für DeutschFlow aber
vollständig offline und benötigt keine separate Node-, Bun- oder npm-Installation.

| Aktion           | Schritt 1            | Schritt 2                                    | Schritt 3                                  | Lerndaten              |
| ---------------- | -------------------- | -------------------------------------------- | ------------------------------------------ | ---------------------- |
| Erstinstallation | Offline-Paket prüfen | App, API und Bun-Laufzeit installieren       | Verknüpfungen und ersten Start vorbereiten | Neu angelegt           |
| Aktualisieren    | Neue Version prüfen  | Programmdateien mit Rollback ersetzen        | App wieder startbereit machen              | Bleiben erhalten       |
| Reparieren       | Installation prüfen  | Vollständiges Offline-Paket wiederherstellen | Verknüpfungen erneuern                     | Bleiben erhalten       |
| Deinstallieren   | App-Prozesse beenden | Programm und Verknüpfungen entfernen         | Datenentscheidung anwenden                 | Standardmäßig erhalten |

## Sicherheitsgrenzen

- Programmdateien und persönliche Daten liegen in getrennten Ordnern.
- Update und Reparatur löschen weder Fortschritt noch Einstellungen oder Audio.
- Deinstallation löscht Lerndaten nur nach ausdrücklicher Auswahl.
- Ein fehlgeschlagenes Update stellt die vorherige Installation wieder her.
- Setup und Payload-ZIP müssen beim Installieren nebeneinanderliegen.

## Verifikation

```powershell
bun run test:installer
bun run package:windows-exe
```
