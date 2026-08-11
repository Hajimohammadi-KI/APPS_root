# DeutschFlow V10.08.2026 – Software-Roadmap

## Autoritative Version

`D:\APPS_root\Apps\Deutsch-V10.08.2026`

Diese Version ist die aktive deutsche Anwendung. `legacy/` ist nur eine
eingefrorene Inhalts- und Regressionsreferenz und kein aktiver Einstieg.

## Produktziel

DeutschFlow hilft erwachsenen Lernenden von A1 bis C2, Grammatik nicht nur zu
erkennen, sondern sie beim Schreiben und Sprechen schnell, korrekt und ohne
Vorlage abzurufen. Der Kernpfad ist:

`Abrufen → laut automatisieren → frei übertragen → Fehler reparieren → verzögert wiederholen`.

## Bereits als Software vorhanden

- Next.js App Router und React-Frontend mit Shadcn-Quellkomponenten
- vollständig deutsche Navigation und Metadaten
- NestJS-API mit Health-, Bootstrap- und Auswertungs-Endpunkten
- 84 Grammatikthemen und 79 Gesprächsthemen aus dem bisherigen deutschen Stand
- Tagestraining, Gesprächsstudio, Aufnahme/Transkript, Fehlerwerkstatt,
  Wiederholungen, Fortschritt, Audio, Ressourcen und Einstellungen
- lokale, versionierte Lernpersistenz und IndexedDB-Audio
- PostgreSQL-Schema und Seed als Grundlage für optionale Synchronisierung
- Unit-, Integrations-, Installer- und Playwright-Tests

## Phasen bis zur belastbaren Veröffentlichung

### Phase 1 – aktueller lokaler Release

- unabhängige Ports: Web `3210`, API `4210`
- Installation, Typecheck, Tests und Production-Build reproduzierbar
- alle aktiven Routen direkt und über Navigation erreichbar
- Desktop-, Tablet- und Mobile-Layout ohne blockierende Fehler
- Legacy-Inhalt inventarisiert; alte Oberfläche nicht als Startseite aktiv

### Phase 2 – Neon-Persistenz

- bestehendes PostgreSQL-Schema auf Neon migrieren
- Drizzle-Migrationen für Profil, Fortschritt, Notizen, Fehler, Reviews,
  Leseposition, Aufnahmen-Metadaten und Auswertungsergebnisse
- lokales Offline-Outbox-Modell und konfliktarme Synchronisierung
- Anmeldung und ausdrückliche Einwilligung; keine Schlüssel im Browser

### Phase 3 – belastbare Sprachbewertung

- serverseitige KI-Auswertung als optionaler Provider
- getrennte Bewertung von Grammatik, Wortwahl, Aussprache, Prosodie und Flüssigkeit
- keine Mastery-Erhöhung durch bloßes Öffnen oder Wiedererkennen
- verzögerter Transfer-Test in neuer Situation als Automaticity-Nachweis

### Phase 4 – Release

- vollständige E2E-Reise: Niveau wählen, Tagestraining, Aufnahme, Speichern,
  Neustart, Review, PDF/Notiz, Backup/Restore
- Upgrade-Test mit Erhalt lokaler Daten
- signierter Windows-Installer und Release-Bericht

## Nicht als fertig behaupten

- Neon ist noch nicht live verbunden; das vorhandene Schema ist eine Grundlage.
- Browser-Spracherkennung ist keine vollständige Aussprachemessung.
- Ein grüner Build beweist nicht allein Mikrofon, Lautsprecher, OAuth oder
  Datenwiederherstellung auf einem fremden Gerät.
