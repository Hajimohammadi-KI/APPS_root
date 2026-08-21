# Deutsch Grammatik-Automatik PWA v20.8

Diese UI-Aktualisierung entfernt die redundanten Niveau-Kürzel aus der
Themenliste, verkleinert die mobile Typografie und ergänzt direkte Ressourcen
für Schreiben, Hören, Sprechen, DSH und den digitalen TestDaF.

Die Grammatik-Suche kann in v20.2 gleichzeitig nach Niveau, Themenbereich und
freiem Suchbegriff filtern. Dazu gehören unter anderem Zeitformen, Verben,
Kasus, Pronomen, Präpositionen, Satzbau, Konnektoren, Passiv und Konjunktiv.

## Recommended use
This package is a Progressive Web App. It runs on Android, iPhone/iPad, Windows and macOS through a modern browser.

## It must be served over HTTPS or localhost
Do not open `index.html` through `content://downloads` or `file://` when testing microphone, service worker, installation or online grammar checking.

## Installation
- Android / Windows: open the HTTPS address in Chrome or Edge and choose Install.
- iPhone / iPad: open in Safari, choose Share, then Add to Home Screen.
- Development test: run a local static server in this folder.

Example:
`python -m http.server 8080`

Then open:
`http://localhost:8080`

## Included offline
- Conversation topics
- Grammar explanations and exercises
- Daily automaticity path
- Spaced reviews
- Error history
- Settings and progress
- IndexedDB audio storage where supported

## Optional online services
LanguageTool is optional. If it is unavailable, the app uses its offline correction rules.


## Version 16 complete content
- 79 conversation topics
- 84 grammar units from A1 to C2
- Test-answer button for every writing or speaking task
- Test answers can be inserted and read aloud


## v17
- Conversation topics use cascading dropdown menus.
- Test buttons evaluate the learner’s own text instead of inserting model answers.
- Open-ended grammar production corrects the learner’s sentence.


## Version 18
- Smaller, more refined buttons across desktop and mobile.
- Grammar resource links are no longer generic home-page links.
- Only verified exact-topic pages are shown; each link includes a description of the exact explanation and practice it contains.
- When no exact verified external page is stored, the app keeps the built-in explanation and exercises instead of showing a generic link.


## Version 19
- Kompletter Deutschpfad A1–C2 und Akademisches Deutsch B1–C2 wurden als eigene Lernpfade ergänzt.
- The default path now exposes every available level instead of stopping at A2.

## Version 20
- Alle 84 Grammatikthemen von A1 bis C2 besitzen je einen direkten Link zu einer Online-Erklärung und zu passenden Online-Übungen.
- Die Links führen zu konkreten Grammatikseiten und nicht zu Start-, Übersichts- oder Suchseiten.
- Nomen-Verb-Verbindungen / Funktionsverbgefüge sind ausdrücklich im B2-Pfad enthalten.
- Alle integrierten Offline-Erklärungen und Offline-Übungen bleiben erhalten.
- Der interne Selbsttest kontrolliert automatisch: 84 Themen, je genau eine Erklärung und eine Übung, direkte HTTPS-Adressen, passende Themenmetadaten und vorhandene Offline-Übungen.

## Version 20.2
- Thematische Kategorien für alle Grammatikthemen.
- Kombinierbare Filter nach Niveau und Themenbereich.
- Freie Suche in Titel, Regel und Beispielen.
- Ergebniszähler und verständliche Meldung bei leeren Treffern.

## Version 20.3
- Jede Grammatikeinheit beginnt mit klar gekennzeichneten kontrollierten Übungen.
- Danach folgt eine eigene freie Transferphase für Alltag, Studium und ein frei gewähltes fachliches Thema.
- Die Fortschrittsanzeige zählt innerhalb der jeweiligen Übungsphase.
- Der Übergang zur freien Produktion wird ausdrücklich angezeigt.
- Eine Einheit gilt erst nach der kontrollierten und der freien Phase als vollständig bearbeitet.

## Version 20.6 – echte Automatisierungs-Gates

- „Nächste Aufgabe“ bleibt gesperrt, bis die aktuelle Antwort richtig geprüft und laut produziert wurde.
- Eine freie Antwort zählt nicht allein wegen ihrer Länge; eine erkannte Korrektur muss zuerst selbst repariert werden.
- Der Tagespfad wird in fester Reihenfolge abgeschlossen, damit Transfer und Wiederholung nicht übersprungen werden.
- Erfolgreiche Einheiten erhalten Wiederholungen nach 1, 3, 7, 14 und 30 Tagen.
- Eine erfolgreiche Wiederholung wird automatisch auf das nächste Intervall verschoben.
- Erst kontrollierte Übung plus freie Produktion erzeugen einen Mastery-Eintrag.

## Version 20.7 – vollständige Online-Auswertung

- Eigene Antworten werden standardmäßig online mit LanguageTool geprüft.
- Die Prüfung zeigt Urteil, Fehlerart, Erklärung, richtige oder verbesserte Fassung und exakt passende Links zum aktuellen Grammatikthema.
- Die Zielgrammatik wird zusätzlich zur allgemeinen Rechtschreibung und Grammatik geprüft.
- Beim Perfekt werden insbesondere falsche Hilfsverben bei Orts- und Zustandsänderungen erkannt.
- Drei identische Produktionssätze werden nicht mehr als drei erfolgreiche Antworten akzeptiert.
- Wenn die Online-Prüfung nicht erreichbar ist, wird die Antwort nicht fälschlich als bestanden markiert.
