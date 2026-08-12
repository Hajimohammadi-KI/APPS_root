# Cross Repository Code Intelligence – Version2

**CURRENT · Version2** — light-lavender, responsive interface. This copy has a separate browser-state key and its default plan begins on **Friday, 7 August 2026**.

# Vercel-Web-App

Die veröffentlichte Version ist unter folgender Adresse erreichbar:

```text
https://cross-repository-code-intelligence.vercel.app
```

Vercel installiert und baut die Next.js-App mit Bun. Die drei Hauptbereiche
`/`, `/settings` und `/pdf-reader` sind responsive und als gemeinsame PWA
verfügbar.

Die Web-Version läuft bewusst im **Gerätespeicher-Modus**:

- Fortschritt, Tagesnotizen, Einstellungen, Fokuszeiten, Leseposition,
  Markierungen und Analysefelder bleiben nach einem Neuladen im selben Browser
  erhalten.
- Lokale PDFs können geöffnet, ausgewählt und annotiert werden; die Daten
  verlassen den Browser dabei nicht.
- Es gibt derzeit keine Cloud-Synchronisierung zwischen Geräten und keine
  gemeinsame Neon-Datenbank für die Web-Version.
- Tracker-Dateiuploads, private Provider-Schlüssel und Google-OAuth benötigen
  weiterhin die vollständige lokale Installation oder ein späteres
  authentifiziertes Cloud-Backend.
- Der device-only Exposé-Endpunkt lädt auf Vercel keine Cloudflare-Worker-
  Module; ohne eigenes Server-Storage wird ehrlich die gebündelte PDF verwendet.

Releaseprüfung vom 7. August 2026: Desktop (1440 px) und Mobil (390 px),
Persistenz nach Reload, Kontrast, Console/Network/Page-Fehler und die drei
Hauptrouten wurden auf der Produktionsadresse geprüft. Der finale
Deployment-Fehlerscan war leer.

Prüfung und erneute Veröffentlichung:

```bash
bun run build:vercel
bun run verify:vercel
bunx vercel deploy --prod
```

# Lokale Komplett-App

Die ZIP-Ausgabe ist die vollständige lokale Variante und läuft auf deinem
Computer. Sie benötigt keine veröffentlichte Seite. Eine lokale Installation
enthält alle drei Bereiche unter derselben Adresse:

- `/` – Tagesdashboard, 25-Wochen-Lernplan, Fortschritt und Fokus-Timer
- `/pdf-reader` – PDF Visual mit Exposé, Markierungen, Notizen, Übersetzung und
  Lesetimer
- `/nlp-lab` – eigenständiger Live-Kurs- und Projektpfad für NLP, Retrieval,
  Use Cases, Artikel, Software-Engineering-Artefakte und Cross-App-Integration
- `/settings` – gemeinsame Einstellungen und optionale Verbindungen

Die App verwendet genau eine lokale Origin:

```text
http://127.0.0.1:4312
```

## Windows-Setup

1. ZIP vollständig entpacken.
2. [Node.js](https://nodejs.org/) Version 22.13 oder neuer installieren.
3. `SETUP-WINDOWS.bat` doppelt anklicken.
4. Im Setup **Erstinstallation** auswählen.

Die App wird für das aktuelle Windows-Benutzerkonto hier installiert:

```text
%LOCALAPPDATA%\CrossRepositoryCodeIntelligence
```

Nach erfolgreicher Installation erstellt das Setup automatisch:

- eine Verknüpfung auf dem Windows-Desktop,
- eine Verknüpfung im Startmenü,
- einen zusätzlichen Startmenü-Eintrag für Setup, Update, Repair und Uninstall.

`INSTALLIEREN-WINDOWS.bat` bleibt als kompatibler Einstieg erhalten und öffnet
ebenfalls das neue Setup. Bei späteren Starts genügt ein Doppelklick auf das
Desktop-Symbol **Cross Repository Code Intelligence**. Das schwarze
Serverfenster muss während der Nutzung geöffnet bleiben. Mit `Strg+C` wird die
lokale App beendet.

## Aktualisieren, reparieren oder deinstallieren

Das Setup enthält vier getrennte Aktionen:

- **Erstinstallation** kopiert die App in den lokalen Installationsordner,
  installiert alle Abhängigkeiten und erstellt die Verknüpfungen.
- **Aktualisieren** übernimmt die Dateien eines neu heruntergeladenen Pakets.
  Dafür `SETUP-WINDOWS.bat` aus dem neuen entpackten ZIP starten. Fortschritt,
  Uploads, Notizen, Fokuszeiten, `.wrangler/` und `.env.local` bleiben erhalten.
- **Reparieren** installiert fehlende oder beschädigte Abhängigkeiten neu,
  prüft die lokale Konfiguration und erstellt fehlende Verknüpfungen erneut.
- **Deinstallieren** entfernt Programm und Verknüpfungen. Vor dem Löschen fragt
  das Setup, ob lokale Daten für eine spätere Neuinstallation gesichert oder
  vollständig gelöscht werden sollen.

Alternativ öffnet `DEINSTALLIEREN-WINDOWS.bat` direkt die Deinstallation.

Der Browser wird beim Start erst geöffnet, nachdem der lokale Server wirklich
antwortet. Je nach Internetverbindung kann die erste Installation mehrere
Minuten dauern.

### Falls der Browser „Verbindung abgelehnt“ zeigt

1. Prüfen, ob das schwarze Serverfenster noch geöffnet ist.
2. Dort warten, bis eine lokale Adresse mit Port `4312` angezeigt wird.
3. Danach die Browserseite aktualisieren.
4. Wenn das schwarze Fenster eine rote Fehlermeldung zeigt, diese vollständig
   kopieren. Häufige Ursachen sind eine fehlende Node.js-Installation oder ein
   bereits belegter Port `4312`.

## macOS oder Linux

Im entpackten Projektordner:

```bash
chmod +x installieren.sh starten.sh
./installieren.sh
```

Später reicht `./starten.sh`.

## Als Desktop-App installieren

Während die lokale App läuft, `http://127.0.0.1:4312` in Edge oder Chrome
öffnen und im Browsermenü **Diese Website als App installieren** wählen. Die
installierte PWA umfasst Lernplan, PDF Visual und Einstellungen. Der lokale
Server muss trotzdem über `STARTEN-WINDOWS.bat` bzw. `starten.sh` laufen.

## Lokale Daten und Datenschutz

- Fortschritt, Notizen, Fokuszeiten und Einstellungen liegen in der lokalen
  Miniflare-Datenbank im Projektordner `.wrangler/`.
- Hochgeladene Bilder, PDFs, Office-Dateien, Audio und Video liegen ebenfalls
  im lokalen Speicher unter `.wrangler/`.
- Das Projekt-Exposé ist als `public/expose.pdf` enthalten und wird im
  kompilierten Produktionsserver über `/expose.pdf` ausgeliefert. Die
  ursprüngliche Kopie unter `public/documents/` bleibt als Quellasset erhalten.
- API-Schlüssel und Tokens gehören nur in `.env.local`; diese Datei wird beim
  ersten Start mit einem zufälligen Verschlüsselungsschlüssel erzeugt und ist
  nicht Bestandteil der ZIP-Datei.
- Für eine Sicherung die App beenden und anschließend den gesamten entpackten
  Ordner einschließlich `.wrangler/` kopieren.

## Optionale Internetdienste

Die App selbst und die gespeicherten Daten bleiben lokal. Google Drive,
Google Calendar, Gmail, OpenAI, DeepL sowie externe Artikel funktionieren nur
mit Internetzugang. Diese Dienste sind optional und werden vom Benutzer in
`/settings` eingerichtet.

Ohne echte Zugangsdaten zeigt die App Google, OpenAI, DeepL und Neon als
**NICHT EINGERICHTET / NOT CONFIGURED**. Ein vorhandenes Formular oder ein
voreingestellter Modellname ist kein Beleg für eine aktive Verbindung.

### Google-Verbindung: einmalige Einrichtung durch die Herausgeberin

Lernende richten **kein** eigenes Google-Cloud-Projekt mehr ein und laden keine
JSON-Datei herunter. Die Anmeldung läuft über PKCE mit einem einzigen
mitgelieferten OAuth-Client; ein Client-Secret wird nicht mehr benötigt.

Einmalig – nicht pro Lernender – in der Google Cloud Console anlegen:

1. **APIs & Dienste → Anmeldedaten → OAuth-Client-ID erstellen**
2. Anwendungstyp **Desktop-App** wählen (nicht „Web“). Desktop-Clients
   erlauben jeden Loopback-Port und brauchen kein Secret.
3. Die erzeugte Client-ID als `GOOGLE_CLIENT_ID` in `.env.local` eintragen.
   `GOOGLE_CLIENT_SECRET` bleibt leer.

```text
GOOGLE_CLIENT_ID=<einmalige Desktop-Client-ID>
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://127.0.0.1:4312/api/google/callback
```

Bestehende Installationen mit einem selbst registrierten „Web“-Client
funktionieren unverändert weiter: Ist ein Secret gesetzt, wird es weiterhin
mitgesendet.

Standardmäßig wird nur der Kalender-Scope angefragt. Drive und Gmail sind
sensible bzw. eingeschränkte Scopes, die eine Google-Sicherheitsprüfung und
einen deutlich abschreckenderen Zustimmungsdialog auslösen; sie werden nur
angefragt, wenn eine Funktion sie ausdrücklich über `?services=` anfordert.

Für OpenAI ist `gpt-5.6-sol` als Standardmodell für wissenschaftliche
Erklärungen und Übersetzungen voreingestellt; der Modellname bleibt editierbar.

Für den PDF-Reader muss außerdem die folgende JavaScript-Quelle eingetragen
sein:

```text
http://127.0.0.1:4312
```

OAuth-Anmeldung und Google APIs sind zwei getrennte Einstellungen. Wenn die
App `Google Drive API ist noch nicht aktiviert` meldet, im zugehörigen
Google-Cloud-Projekt zusätzlich **Google Drive API → Aktivieren** wählen,
einige Minuten warten und in der App **Erneut prüfen** anklicken. Der
Aktivierungslink wird anhand der eingetragenen Client-ID automatisch für das
richtige Projekt erzeugt. Google Calendar API und Gmail API müssen nur dann
separat aktiviert werden, wenn diese Dienste verwendet werden.

Für diese Installation sind folgende nicht geheime Werte bereits editierbar
in den zentralen Einstellungen gespeichert:

```text
Google-Projekt: quiet-groove-504813-f0
Google-Projektnummer: 996682910931
Testnutzer: fatemeh.hajimohammadi.DE@gmail.com
JavaScript-Origin: http://127.0.0.1:4312
Callback: http://127.0.0.1:4312/api/google/callback
```

Unter **Google Auth Platform → Audience → Test users** muss der gespeicherte
Testnutzer einmal durch den Projektinhaber hinzugefügt werden. Diese Änderung
kann nur direkt im angemeldeten Google-Cloud-Konto vorgenommen werden. Die
App enthält dafür direkte, projektspezifische Schaltflächen für Audience,
OAuth-Client, Drive API, Calendar API und Gmail API.

## Manuelle lokale Konfiguration

`INSTALLIEREN-WINDOWS.bat` beziehungsweise `installieren.sh` erzeugt die Datei
`.env.local` automatisch. Alternativ:

```bash
node scripts/generate-local-env.mjs
./node_modules/.bin/bun run dev:all
```

Optionale Werte können danach ausschließlich in `.env.local` ergänzt werden:

```text
OPENAI_API_KEY=
DEEPL_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Geheime Werte niemals in JSON-Exporte, Quellcode oder eine weitergegebene ZIP
kopieren.

## Entwicklung und Prüfung

Die Anwendung ist jetzt ein Bun-Workspace. `npm ci` wird im Windows-Setup nur
einmal als Bootstrap benutzt, damit die mitgelieferte Bun-Binärdatei ohne eine
globale Bun-Installation verfügbar ist. Web-App und Backend laufen danach mit
Bun:

```bash
npm ci
./node_modules/.bin/bun run dev:all
./node_modules/.bin/bun run lint
./node_modules/.bin/bun run typecheck
./node_modules/.bin/bun run build:all
```

Lokale Adressen:

```text
Web-App:    http://127.0.0.1:4312
NestJS API: http://127.0.0.1:4313/v1/health
```

Die Web-App verwendet während der Migration weiterhin ihre bestehenden Next.js-
Route-Handler als ausfallsichere Kompatibilitätsschicht. Der PDF-Reader liest
OpenAI und DeepL bereits aus derselben sicheren zentralen Einstellung. Eine
optionale Neon-Verbindung wird über `DATABASE_URL` konfiguriert und vom NestJS-
Health-Endpunkt wirklich getestet.

Die technische Bestandsaufnahme und die nächsten Schritte stehen in
[`docs/ROADMAP.md`](docs/ROADMAP.md).

Der Quellcode ist vollständig in dieser ZIP enthalten. Ordner wie
`node_modules`, `.wrangler`, Build-Ausgaben, lokale Daten und geheime
`.env.local`-Dateien werden absichtlich nicht mitgeliefert.
