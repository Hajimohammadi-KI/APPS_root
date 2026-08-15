# Produkt-Roadmap: Cross Repository Code Intelligence

> Discovery update: the current release is runnable, but exact legacy parity is
> blocked because the canonical `StudyPlan_Cross_Repository_Code_Intelligence_V6_3_1.html`
> source is missing. See [`LEGACY-MIGRATION-AUDIT.md`](./LEGACY-MIGRATION-AUDIT.md)
> for the evidence and the executable migration gate.
>
> The implementation sequence and acceptance gates are maintained in
> ACTUAL-SOFTWARE-ROADMAP.md. The inspected archive evidence is listed in
> RECOVERED-LEGACY-INVENTORY.md.

Stand: 7. August 2026

## Zielarchitektur

- **Web:** React 19, Next.js 16 und schrittweise Shadcn-Komponenten
- **Runtime und Paketmanager:** Bun 1.3
- **Backend:** NestJS 11 mit Fastify unter `/v1`
- **Produktion:** Neon Postgres; lokale Installation weiterhin ohne Cloud-Zwang
- **Gemeinsame Integrationen:** Google, OpenAI und DeepL werden einmal in
  `Einstellungen` eingerichtet und von Lernplan und PDF Visual gemeinsam
  verwendet. Ohne die erforderlichen Zugangsdaten zeigen sie ausdrücklich
  `Nicht eingerichtet` und niemals einen simulierten Verbindungsstatus.

## Bereits umgesetzt

1. Die aktuelle Migration enthält einen funktionsfähigen Lernplan mit 25
   Wochen, Tageskarten, Fokus-Timer, Uploads, Exposé, PDF Visual und
   Einstellungen. Exakte Legacy-Parität ist noch nicht bewiesen, weil die
   kanonische V6.3.1-HTML-Quelle fehlt.
2. Bun-Workspace mit getrennten Paketen `apps/api` und `packages/contracts`.
3. NestJS-API mit Health- und Capability-Endpunkten.
4. Optionaler Neon-Verbindungstest; ohne `DATABASE_URL` arbeitet die lokale App
   weiter mit ihrem lokalen Speicher.
5. PDF Visual verwendet die zentral gespeicherten OpenAI- und DeepL-Zugänge.
   Im Reader werden keine zweiten API-Schlüssel mehr verlangt.
6. Gemeinsame, typisierte Verträge zwischen Web und API.
7. Erste zugängliche Shadcn-Bausteine für Buttons, Karten und Status-Badges.
8. Ein gemeinsamer lokaler Start startet Web und NestJS mit Bun.
9. Standardmäßiger Next.js-Build für Vercel und lokaler Vinext-Build werden
   beide geprüft.
10. Gemeinsame, getestete Hilfsfunktionen verwalten Fokus- und Lesesitzungen,
    statt dieselbe Timer-Logik in mehreren Seiten zu duplizieren.
11. Das Windows-Update wurde mit unveränderten Fingerprints für `.env.local`
    und `.wrangler` geprüft; Web und API starten danach gemeinsam.
12. Die Vercel-Produktion ist veröffentlicht und auf Desktop/Mobilgerät,
    Persistenz, Kontrast und fehlerfreie Runtime geprüft.

## Nächste Migrationsschritte

### Phase 0 – Legacy-Quelle und Paritätsvertrag

- `bun run audit:legacy` muss die kanonische
  `StudyPlan_Cross_Repository_Code_Intelligence_V6_3_1.html` finden.
- Die HTML-Datei, referenzierten CSS-/JS-/Bild-/PDF-Dateien und der
  Legacy-Storage-Key werden unter `legacy/fixtures/` versioniert.
- Ein automatischer Extractor erzeugt JSON-Fixtures; Screens, Labels,
  Interaktionen und Datenmigration werden daraus geprüft.
- Ohne diese Quelle bleibt der Status **Migration rewrite**, nicht **Legacy
  parity complete**.

### Phase 1 – Daten stabilisieren

- Bestehende D1-Tabellen als kanonisches SQL-Schema dokumentieren.
- Neon-Migrationen für Benutzer, Fortschritt, Fokus, Notizen, Anhänge und
  Provider-Verbindungen erzeugen.
- Einen getesteten Import von lokalen Backups nach Neon anbieten; niemals
  Geheimnisse in JSON exportieren.

### Phase 2 – Backend vollständig nach NestJS verschieben

- Bestehende Next-Route-Handler bereichsweise nach NestJS migrieren:
  `state`, `focus`, `attachments`, `providers`, `google`, `ai`, `translate`.
- Zod-Validierung, Rate-Limits, strukturierte Fehler und Audit-Logs zentral
  einführen.
- Next-Routen während der Migration als kompatible Proxy-Schicht behalten.

### Phase 3 – Frontend weiter standardisieren

- Globale Legacy-CSS schrittweise in route-spezifische CSS Modules überführen.
- Wiederkehrende Bedienelemente durch Shadcn-Komponenten ersetzen, ohne den
  vertrauten Inhalt oder die großen, gut lesbaren Ziele zu verlieren.
- Die großen Seiten `study-tracker.tsx` und `pdf-reader/page.tsx` schrittweise
  entlang getesteter Domänengrenzen zerlegen; keine Big-Bang-Neuschreibung.

### Phase 4 – Integrationen produktionsreif machen

- Google OAuth mit getrennten Development- und Production-Clients.
- Provider-Testzustände (`connected`, `expired`, `quota`, `error`) durchgehend
  verwenden; niemals nur wegen eines vorhandenen Schlüssels „verbunden“ melden.
- Private Drive-PDFs ausschließlich über serverseitige, benutzergebundene Tokens
  streamen.

### Phase 5 – Auslieferung

- Signierter Windows-Installer ohne Sicherheitswarnung.
- Frische Erstinstallation in einem separaten, sauberen Windows-Benutzerkonto.
- PWA/iPad-Qualität mit Offline-Shell, großen Icons und Installationshinweisen.
- Ende-zu-Ende-Tests für Lernplan, PDF-Auswahl, KI-Erklärung, Übersetzung,
  Fokuszeit, Backup und Wiederherstellung.

## Qualitätsregel

Eine Legacy-Funktion wird erst entfernt, wenn ihr Ersatz dieselben Daten lesen,
denselben Nutzerweg ausführen und einen automatisierten Regressionstest bestehen
kann. Dadurch bleibt die Software während der gesamten Migration nutzbar.
