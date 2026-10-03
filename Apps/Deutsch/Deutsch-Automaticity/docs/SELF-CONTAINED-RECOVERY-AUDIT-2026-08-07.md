# Prüfung der eigenständigen Wiederherstellung

Datum: 2026-08-08

## Autoritative Anwendung

`D:\APPS_root\Apps\Deutsch\German-07082026`

## Ergebnis

Die aktuelle Anwendung ist eigenständig. Next.js-Frontend, NestJS-API,
Domänenlogik, 84 Grammatikthemen, 79 Gesprächsthemen, lokale Speicherung,
Audio, Wiederholungen, Fehlerketten, Import/Export, PWA-Dateien,
Installationsquellen und die unveränderliche Legacy-Referenz liegen innerhalb
des autoritativen Ordners. Laufzeit, Build und Tests lesen nicht aus
`D:\APPS_root\deleted`.

Die Originalreferenz bleibt unter `legacy/v20.8-static/` und über `/klassik`
verfügbar. Sie darf erst entfernt werden, wenn katalog-, verhaltens-,
speicher- und browserbasierte Parität weiter automatisiert nachgewiesen wird.

Die Shadcn-Konfiguration in `apps/web/components.json` ist die verbindliche
Quelle für UI-Bausteine. Alte Build-Ausgaben, Caches, Abhängigkeiten,
Installertests und Downloads sind keine Produktquelle und dürfen getrennt in
den wiederherstellbaren Löschordner verschoben werden, sofern kein aktiver
Manifest- oder Installerverweis darauf zeigt.

## Offene Grenzen

- Lokale Nutzung ist vollständig; Konten und geräteübergreifende
  Synchronisierung sind noch nicht freigegeben.
- Neon wird erst mit Authentifizierung, Einwilligung, RLS-ähnlicher
  Besitzprüfung, Konfliktlösung und Löschtests aktiviert.
- Spracherkennung liefert Text und Übungsfeedback, aber keine klinische
  Sprachdiagnose und keine vollständige Phonem-/Prosodieauswertung.
- Pädagogische Vollständigkeit muss zusätzlich durch fachliche Begutachtung
  und echte Lernende geprüft werden.
