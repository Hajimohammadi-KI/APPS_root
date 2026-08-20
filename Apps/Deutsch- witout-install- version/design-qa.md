# Design QA — Dropdown-Menüs

Datum: 2026-08-20

## Eingaben

- Referenz: `D:\APPS_root\artifacts\dropdown-menu-audit-20260820\00-reference.png`
- Vergleich in einer gemeinsamen Eingabe: `D:\APPS_root\artifacts\dropdown-menu-audit-20260820\08-reference-vs-implementation.png`
- Deutsche Desktop-Implementierung: `D:\APPS_root\artifacts\dropdown-menu-audit-20260820\04-german-full.png`
- Deutsche Mobile-Implementierung: `D:\APPS_root\artifacts\dropdown-menu-audit-20260820\06-german-mobile-menu.png`

## Vergleich

Die Implementierung übernimmt die Hierarchie der Referenz: weißer Container, kurze Überschrift und Erklärung, getrennte Zeilen über die volle Breite, rechts ausgerichtete Pfeile und ein zurückhaltender violetter Auswahlzustand. Die App-Navigation verwendet dasselbe Muster; Start bleibt die erste direkte Aktion. Es ist jeweils nur eine Gruppe geöffnet und die Gruppe der aktiven Seite öffnet sich automatisch.

Desktop und 412-px-Mobilansicht wurden im eingebauten Browser interaktiv geprüft. Der mobile Drawer behält Reihenfolge und Einzelauswahl bei. Die Grammatikstufen sind echte Akkordeons. Auswahlfelder verwenden die gemeinsame Dropdown-Komponente und öffnen unter ihrem Auslöser. Die kontextuelle Hilfe wird innerhalb modaler Navigation unterdrückt und kann das Menü daher nicht verdecken.

## Befunde

- P0: keine.
- P1: keine.
- P2: keine.

Die sichtbare Fokuslinie im Vergleich ist ein beabsichtigter Tastaturzustand und kein Darstellungsfehler. Die Zeilen sind etwas höher als in der Referenz, damit Touch-Ziele zuverlässig bedienbar bleiben.

## Endergebnis

passed
