"use client";

import { ChangeEvent, ReactNode, useMemo, useState } from "react";
import ProviderSetup, { ConnectionStatus } from "./provider-setup";
import { DEFAULT_WERKZEUG_SETTINGS, normalizeWerkzeugSettings, ProjectSourceKind, SettingsGrant, WerkzeugSettings } from "../lib/werkzeug-settings";

type Section = "profile" | "planning" | "accessibility" | "permissions" | "organization" | "sharing" | "backup";
type WorkGroup = "all" | "personal" | "work" | "services" | "organization" | "data";
type Props = {
  settings: WerkzeugSettings;
  onChange: (settings: WerkzeugSettings) => void;
  onToast: (message: string) => void;
  saveState: string;
  connections: ConnectionStatus;
  onConnectionsRefresh: () => Promise<void>;
};

const DAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const SOURCE_KIND_LABELS: Record<ProjectSourceKind, string> = {
  github: "GitHub-Repository",
  google_drive: "Google-Drive-Ordner",
  local: "Lokaler Ordner",
};

function suggestedPlanEnd(startDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return "";
  const date = new Date(`${startDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  date.setUTCDate(date.getUTCDate() + 190);
  return date.toISOString().slice(0, 10);
}

export default function SettingsHub({ settings, onChange, onToast, saveState, connections, onConnectionsRefresh }: Props) {
  const [open, setOpen] = useState<Section | null>(null);
  const [group, setGroup] = useState<WorkGroup>("all");
  const [editingNames, setEditingNames] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isFirstRun = !settings.profile.displayName;
  const update = (next: Partial<WerkzeugSettings>) => onChange(normalizeWerkzeugSettings({ ...settings, ...next }));
  const visible = (name: Exclude<WorkGroup, "all">) => group === "all" || group === name;
  const scopes = useMemo(() => [
    settings.permissions.googleCalendarRead && "calendar",
    settings.permissions.gmailRead && "gmail",
    settings.permissions.googleDriveRead && "drive",
  ].filter(Boolean).join(","), [settings.permissions]);
  const grantLabels: Record<SettingsGrant, string> = {
    profile: settings.labels.sections.profile,
    planning: settings.labels.sections.planning,
    accessibility: settings.labels.sections.accessibility,
    permissions: settings.labels.sections.permissions,
    ai: `${settings.labels.services.openai} & Google Translation`,
    organization: settings.labels.sections.organization,
  };
  const addClient = () => update({ integration: { ...settings.integration, clients: [...settings.integration.clients, { id: `app-${Date.now().toString(36)}`, displayName: "Neue App", origin: "", enabled: true, grants: ["profile"] }] } });
  const updateClient = (id: string, patch: Partial<WerkzeugSettings["integration"]["clients"][number]>) => update({ integration: { ...settings.integration, clients: settings.integration.clients.map((client) => client.id === id ? { ...client, ...patch } : client) } });
  const removeClient = (id: string) => {
    if (!window.confirm("Diese App und ihre Berechtigungen entfernen?")) return;
    update({ integration: { ...settings.integration, clients: settings.integration.clients.filter((client) => client.id !== id) } });
  };
  const addSource = (kind: ProjectSourceKind) => update({
    organization: {
      ...settings.organization,
      sources: [...settings.organization.sources, {
        id: `source-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        name: SOURCE_KIND_LABELS[kind],
        kind,
        location: "",
        enabled: true,
      }],
    },
  });
  const updateSource = (id: string, patch: Partial<WerkzeugSettings["organization"]["sources"][number]>) => update({
    organization: {
      ...settings.organization,
      sources: settings.organization.sources.map((source) => source.id === id ? { ...source, ...patch } : source),
    },
  });
  const removeSource = (id: string) => {
    if (!window.confirm("Diese Projektquelle entfernen? Die Dateien selbst werden nicht gelöscht.")) return;
    update({ organization: { ...settings.organization, sources: settings.organization.sources.filter((source) => source.id !== id) } });
  };
  const chooseLocalFolder = async (id: string) => {
    const picker = (window as Window & { showDirectoryPicker?: () => Promise<{ name: string }> }).showDirectoryPicker;
    if (!picker) {
      onToast("Dieser Browser unterstützt die lokale Ordnerauswahl nicht. Du kannst den Ordnernamen manuell eintragen.");
      return;
    }
    try {
      const handle = await picker.call(window);
      updateSource(id, { location: handle.name });
      onToast(`Lokaler Ordner „${handle.name}“ ausgewählt`);
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") onToast("Der lokale Ordner konnte nicht ausgewählt werden.");
    }
  };

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `einstellungen-settings.v1-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    onToast("Einstellungen als JSON exportiert");
  };

  const importSettings = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      onChange(normalizeWerkzeugSettings(JSON.parse(await file.text())));
      onToast("Einstellungsdatei geprüft und übernommen");
    } catch {
      onToast("Diese Einstellungsdatei ist ungültig.");
    }
    event.target.value = "";
  };

  const resetSettings = () => {
    if (!window.confirm("Alle persönlichen Einstellungen wirklich zurücksetzen? Verbindungen werden dadurch nicht getrennt.")) return;
    onChange({ ...DEFAULT_WERKZEUG_SETTINGS, updatedAt: new Date().toISOString() });
    onToast("Persönliche Einstellungen wurden zurückgesetzt");
  };

  const accordion = (id: Section, icon: string, title: string, subtitle: string, body: ReactNode) => (
    <section className={`settings-section ${open === id ? "open" : ""}`} key={id}>
      <button className="settings-section-head" onClick={() => setOpen(open === id ? null : id)} aria-expanded={open === id}>
        <span className="settings-bullet">{icon}</span>
        <span><b>{title}</b><small>{subtitle}</small></span>
        <span className="chevron">⌄</span>
      </button>
      {open === id && <div className="settings-body">{body}</div>}
    </section>
  );

  return <>
    <div className="hero settings-hero">
      <div><span className="eyebrow">ZENTRALE APP-EINSTELLUNGEN</span><h1>{settings.labels.appName}</h1><p>{settings.labels.appSubtitle}. Einmal festlegen, selbst freigeben und in allen verbundenen Programmen verwenden.</p></div>
      <div className="settings-save"><span className="status ok">● {saveState}</span><small>Keine API-Schlüssel werden im Browser gespeichert.</small></div>
    </div>

    <div className="settings-summary">
      <div><span>1</span><b>Persönlich einstellen</b><small>Planung, Sprache und Lesekomfort</small></div>
      <div><span>2</span><b>Zugriff erlauben</b><small>Nur gewünschte Dienste freigeben</small></div>
      <div><span>3</span><b>In Apps verwenden</b><small>{settings.labels.appName} als Settings-Modul aufrufen</small></div>
    </div>

    {isFirstRun && <div className="quick-start-banner">
      <div><b>Schnellstart in drei Schritten</b><p>Name und Sprache festlegen, dann bei Bedarf Google, KI oder Übersetzung verbinden. Alles andere ist optional.</p></div>
      <button type="button" className="primary action" onClick={() => setOpen("profile")}>Jetzt einrichten</button>
    </div>}

    <div className="settings-category-bar" aria-label="Einstellungen nach Arbeitsart filtern">
      <button className={group === "all" ? "active" : ""} onClick={() => setGroup("all")}>Alle</button>
      {(Object.entries(settings.labels.groups) as Array<[Exclude<WorkGroup, "all">, string]>).map(([id, label]) => <button className={group === id ? "active" : ""} key={id} onClick={() => setGroup(id)}>{label}</button>)}
      <button className={`edit-labels-button ${editingNames ? "active" : ""}`} onClick={() => setEditingNames((value) => !value)}>✎ Namen bearbeiten</button>
    </div>

    {editingNames && <section className="labels-editor">
      <div className="labels-editor-head"><div><span className="settings-bullet">✎</span><div><h2>Alle Namen bearbeiten</h2><p>App-Name, Navigation, Karten, Kategorien, Bereiche, Dienste und Ordnerebenen lassen sich frei umbenennen.</p></div></div><button onClick={() => setEditingNames(false)}>Fertig</button></div>
      <div className="labels-block"><h3>Programm</h3><div className="form-grid"><label><span>Name der App</span><input value={settings.labels.appName} onChange={(event) => update({ labels: { ...settings.labels, appName: event.target.value } })}/></label><label><span>Untertitel</span><input value={settings.labels.appSubtitle} onChange={(event) => update({ labels: { ...settings.labels, appSubtitle: event.target.value } })}/></label></div></div>
      <div className="labels-block"><h3>Navigation und Seiten</h3><div className="editable-name-grid">{(Object.entries(settings.labels.navigation) as Array<[keyof WerkzeugSettings["labels"]["navigation"], string]>).map(([key, value]) => <label key={key}><span>{key}</span><input value={value} onChange={(event) => update({ labels: { ...settings.labels, navigation: { ...settings.labels.navigation, [key]: event.target.value } } })}/></label>)}</div></div>
      <div className="labels-block"><h3>Integrationskarten</h3><div className="editable-name-grid">{(Object.entries(settings.labels.cards) as Array<[keyof WerkzeugSettings["labels"]["cards"], string]>).map(([key, value]) => <label key={key}><span>{key}</span><input value={value} onChange={(event) => update({ labels: { ...settings.labels, cards: { ...settings.labels.cards, [key]: event.target.value } } })}/></label>)}</div></div>
      <div className="labels-block"><h3>Kategorien nach Arbeitsart</h3><div className="editable-name-grid">{(Object.entries(settings.labels.groups) as Array<[keyof WerkzeugSettings["labels"]["groups"], string]>).map(([key, value]) => <label key={key}><span>{key}</span><input value={value} onChange={(event) => update({ labels: { ...settings.labels, groups: { ...settings.labels.groups, [key]: event.target.value } } })}/></label>)}</div></div>
      <div className="labels-block"><h3>Bereiche</h3><div className="editable-name-grid">{(Object.entries(settings.labels.sections) as Array<[keyof WerkzeugSettings["labels"]["sections"], string]>).map(([key, value]) => <label key={key}><span>{key}</span><input value={value} onChange={(event) => update({ labels: { ...settings.labels, sections: { ...settings.labels.sections, [key]: event.target.value } } })}/></label>)}</div></div>
      <div className="labels-block"><h3>Dienste</h3><div className="editable-name-grid">{(Object.entries(settings.labels.services) as Array<[keyof WerkzeugSettings["labels"]["services"], string]>).map(([key, value]) => <label key={key}><span>{key}</span><input value={value} onChange={(event) => update({ labels: { ...settings.labels, services: { ...settings.labels.services, [key]: event.target.value } } })}/></label>)}</div></div>
      <div className="labels-block"><h3>Ordnerebenen</h3><div className="editable-name-grid">{(Object.entries(settings.labels.folderLevels) as Array<[keyof WerkzeugSettings["labels"]["folderLevels"], string]>).map(([key, value]) => <label key={key}><span>{key}</span><input value={value} onChange={(event) => update({ labels: { ...settings.labels, folderLevels: { ...settings.labels.folderLevels, [key]: event.target.value } } })}/></label>)}</div></div>
    </section>}

    <div className="settings-stack">
      {visible("personal") && accordion("profile", "●", settings.labels.sections.profile, "Name, Sprache, Zeitzone und persönliche Darstellung", <div className="form-grid">
        <label><span>Anzeigename</span><input value={settings.profile.displayName} onChange={(event) => update({ profile: { ...settings.profile, displayName: event.target.value } })}/></label>
        <label><span>Oberflächensprache</span><select value={settings.profile.language} onChange={(event) => update({ profile: { ...settings.profile, language: event.target.value as WerkzeugSettings["profile"]["language"] } })}><option value="de">Deutsch</option><option value="en">Englisch</option><option value="fa">Persisch</option></select></label>
        <label><span>Zeitzone</span><select value={settings.profile.timezone} onChange={(event) => update({ profile: { ...settings.profile, timezone: event.target.value } })}><option>Europe/Berlin</option><option>UTC</option><option>Asia/Tehran</option></select></label>
        <label className="switch-row"><input type="checkbox" checked={settings.profile.humanAvatar} onChange={(event) => update({ profile: { ...settings.profile, humanAvatar: event.target.checked } })}/><span><b>Menschlichen Avatar anzeigen</b><small>Gilt für Programme, die diese Einstellungen übernehmen.</small></span></label>
      </div>)}

      {visible("work") && accordion("planning", "◷", settings.labels.sections.planning, "Lernplan, Zeitraum, Kapazität und Ruhetage", <div className="form-grid">
        <label><span>Projektname</span><input value={settings.planning.projectName} onChange={(event) => update({ planning: { ...settings.planning, projectName: event.target.value } })}/></label>
        <label><span>Name des Lernplans</span><input value={settings.planning.planName} onChange={(event) => update({ planning: { ...settings.planning, planName: event.target.value } })}/></label>
        <label><span>{settings.planning.planStatus === "not_started" ? "Tatsächliches Startdatum wählen" : "Startdatum"}</span><input type="date" value={settings.planning.planStartDate} onChange={(event) => {
          const start = event.target.value;
          update({ planning: { ...settings.planning, planStartDate: start, planEndDate: suggestedPlanEnd(start) } });
        }}/></label>
        <label><span>Enddatum</span><input type="date" min={settings.planning.planStartDate || undefined} value={settings.planning.planEndDate} disabled={!settings.planning.planStartDate} onChange={(event) => update({ planning: { ...settings.planning, planEndDate: event.target.value } })}/><small>{settings.planning.planStartDate ? `Automatisch berechnet: ${suggestedPlanEnd(settings.planning.planStartDate)}` : "Wird nach Auswahl des echten Startdatums berechnet."}</small></label>
        <label><span>Standard-Arbeitsmodus</span><select value={settings.planning.dailyWorkMode} onChange={(event) => update({ planning: { ...settings.planning, dailyWorkMode: event.target.value as WerkzeugSettings["planning"]["dailyWorkMode"] } })}><option value="rescue">12-Minuten-Rettung</option><option value="light">70 Minuten leicht</option><option value="full">210 Minuten vollständig</option></select><small>Der Modus ändert die Zeitmenge, nicht die Qualitätsanforderungen.</small></label>
        <label><span>Anzahl der Planwochen</span><input type="number" min="1" max="104" value={settings.planning.totalPlanWeeks} onChange={(event) => update({ planning: { ...settings.planning, totalPlanWeeks: Number(event.target.value) } })}/></label>
        <label><span>Tägliche Kapazität (Minuten)</span><input type="number" min="30" max="960" step="15" value={settings.planning.dailyCapacityMinutes} onChange={(event) => update({ planning: { ...settings.planning, dailyCapacityMinutes: Number(event.target.value) } })}/></label>
        <label><span>Wochenziel (Minuten)</span><input type="number" min="30" max="6000" step="30" value={settings.planning.weeklyGoalMinutes} onChange={(event) => update({ planning: { ...settings.planning, weeklyGoalMinutes: Number(event.target.value) } })}/></label>
        <label><span>Arbeitstag beginnt</span><input type="time" value={settings.planning.workdayStart} onChange={(event) => update({ planning: { ...settings.planning, workdayStart: event.target.value } })}/></label>
        <fieldset className="weekday-picker"><legend>Ruhetage</legend>{DAY_LABELS.map((day, index) => <label key={day}><input type="checkbox" checked={settings.planning.restDays.includes(index)} onChange={(event) => update({ planning: { ...settings.planning, restDays: event.target.checked ? [...settings.planning.restDays, index] : settings.planning.restDays.filter((value) => value !== index) } })}/><span>{day}</span></label>)}</fieldset>
      </div>)}

      {visible("work") && accordion("accessibility", "Aa", settings.labels.sections.accessibility, "Fokus, größere Schrift, Leselineal, Zeilenabstand und weniger Bewegung", <div className="toggle-grid">
        {([
          ["focusMode", "Fokusmodus", "Unnötige Bedienelemente ausblenden"],
          ["largerText", "Größere Schrift", "Texte in allen verbundenen Modulen vergrößern"],
          ["generousLineHeight", "Mehr Zeilenabstand", "Längere Texte leichter verfolgen"],
          ["readingRuler", "Leselineal", "Zwei violette Führungslinien ohne gelbe Fläche – Text bleibt vollständig sichtbar"],
          ["reducedMotion", "Weniger Bewegung", "Animationen und Übergänge reduzieren"],
        ] as const).map(([key, title, description]) => <label className="switch-row" key={key}><input type="checkbox" checked={settings.accessibility[key]} onChange={(event) => update({ accessibility: { ...settings.accessibility, [key]: event.target.checked } })}/><span><b>{title}</b><small>{description}</small></span></label>)}
      </div>)}

      {visible("services") && accordion("permissions", "⌁", settings.labels.sections.permissions, "Google, KI und Übersetzung zentral und nachvollziehbar einrichten", <>
        <div className="permission-scope-card">
          <div><b>Gewünschte Google-Zugriffe</b><small>Nur diese Dienste werden bei der Google-Freigabe angefordert und anschließend einzeln geprüft.</small></div>
          <div className="permission-options compact-options">
            <label><input type="checkbox" checked={settings.permissions.googleCalendarRead} onChange={(event) => update({ permissions: { ...settings.permissions, googleCalendarRead: event.target.checked } })}/><span><b>{settings.labels.services.calendar} verwenden</b><small>Termine lesen und Lernsitzungen erstellen</small></span></label>
            <label><input type="checkbox" checked={settings.permissions.gmailRead} onChange={(event) => update({ permissions: { ...settings.permissions, gmailRead: event.target.checked } })}/><span><b>{settings.labels.services.gmail} lesen</b><small>Nur ausgewählte Nachrichten importieren</small></span></label>
            <label><input type="checkbox" checked={settings.permissions.googleDriveRead} onChange={(event) => update({ permissions: { ...settings.permissions, googleDriveRead: event.target.checked } })}/><span><b>{settings.labels.services.drive} lesen</b><small>PDFs und freigegebene Ordner</small></span></label>
          </div>
        </div>
        <ProviderSetup connections={connections} scopes={scopes} labels={settings.labels.services} onRefresh={onConnectionsRefresh} onToast={onToast}/>
        <div className="translation-preference"><label><span>Standard-Zielsprache</span><select value={settings.ai.targetLanguage} onChange={(event) => update({ ai: { ...settings.ai, targetLanguage: event.target.value as WerkzeugSettings["ai"]["targetLanguage"] } })}><option value="fa">Persisch</option><option value="de">Deutsch</option><option value="en">Englisch</option></select></label><p>Google Translation übersetzt die Auswahl direkt im PDF Reader. LanguageTool bleibt für Rechtschreibung und Grammatik zuständig.</p></div>
      </>)}

      <div className="advanced-settings-toggle">
        <button type="button" className="action secondary" onClick={() => setShowAdvanced((value) => !value)} aria-expanded={showAdvanced}>
          {showAdvanced ? "⌃ Erweiterte Einstellungen ausblenden" : "⌄ Erweiterte Einstellungen anzeigen (Entwickler & Integrationen)"}
        </button>
      </div>

      {showAdvanced && <>
      {visible("organization") && accordion("organization", "▱", settings.labels.sections.organization, "Mehrere GitHub-, Google-Drive- und lokale Projektquellen gemeinsam verwalten", <>
        <div className="form-grid organization-basics">
          <label><span>Standard-Projektordner</span><input value={settings.organization.defaultProjectFolder} onChange={(event) => update({ organization: { ...settings.organization, defaultProjectFolder: event.target.value } })}/></label>
          <label className="switch-row"><input type="checkbox" checked={settings.organization.nestedFolders} onChange={(event) => update({ organization: { ...settings.organization, nestedFolders: event.target.checked } })}/><span><b>Unterordner beliebig verschachteln</b><small>{Object.values(settings.labels.folderLevels).join(" → ")}</small></span></label>
        </div>
        <div className="source-manager">
          <div className="source-toolbar">
            <div><b>Projektquellen verbinden</b><small>Füge beliebig viele Quellen hinzu. Name, Typ und Adresse bleiben jederzeit bearbeitbar.</small></div>
            <div className="source-add-actions">
              <button type="button" onClick={() => addSource("github")}>＋ GitHub</button>
              <button type="button" onClick={() => addSource("google_drive")}>＋ Google Drive</button>
              <button type="button" onClick={() => addSource("local")}>＋ Lokal</button>
            </div>
          </div>
          <div className="source-list">
            {settings.organization.sources.length ? settings.organization.sources.map((source) => <article className="source-card" key={source.id}>
              <div className="source-card-head">
                <span className={`source-kind-icon ${source.kind}`}>{source.kind === "github" ? "GH" : source.kind === "google_drive" ? "G" : "⌂"}</span>
                <div><b>{source.name || SOURCE_KIND_LABELS[source.kind]}</b><small>{SOURCE_KIND_LABELS[source.kind]}</small></div>
                <label className="source-enabled"><input type="checkbox" checked={source.enabled} onChange={(event) => updateSource(source.id, { enabled: event.target.checked })}/><span>Aktiv</span></label>
                <button type="button" className="source-remove" onClick={() => removeSource(source.id)} aria-label={`${source.name || SOURCE_KIND_LABELS[source.kind]} entfernen`}>Entfernen</button>
              </div>
              <div className="source-fields">
                <label><span>Eigener Name</span><input value={source.name} onChange={(event) => updateSource(source.id, { name: event.target.value })} placeholder={SOURCE_KIND_LABELS[source.kind]}/></label>
                <label><span>Quellentyp</span><select value={source.kind} onChange={(event) => updateSource(source.id, { kind: event.target.value as ProjectSourceKind })}><option value="github">GitHub-Repository</option><option value="google_drive">Google-Drive-Ordner</option><option value="local">Lokaler Ordner</option></select></label>
                <label className="source-location"><span>{source.kind === "local" ? "Ordnername / sichtbarer Pfad" : "Link / Adresse"}</span><input type={source.kind === "local" ? "text" : "url"} value={source.location} onChange={(event) => updateSource(source.id, { location: event.target.value })} placeholder={source.kind === "github" ? "https://github.com/name/repository" : source.kind === "google_drive" ? "https://drive.google.com/drive/folders/…" : "Lokalen Ordner auswählen oder Namen eingeben"}/></label>
                {source.kind === "local" && <button type="button" className="choose-folder-button" onClick={() => chooseLocalFolder(source.id)}>Ordner auswählen</button>}
              </div>
            </article>) : <div className="empty-sources"><span>▱</span><b>Noch keine Projektquelle eingetragen</b><p>Du kannst zwei, drei oder beliebig viele GitHub-Repositories, Drive-Ordner und lokale Ordner hinzufügen.</p></div>}
          </div>
          <p className="source-privacy-note">Bei lokalen Ordnern wird nur der sichtbare Ordnername gespeichert. Eine Browser-Berechtigung wird ausschließlich beim Klick auf „Ordner auswählen“ angefragt und nicht exportiert.</p>
        </div>
      </>)}

      {visible("organization") && accordion("sharing", "↗", settings.labels.sections.sharing, "Freigegebene Herkunftsseiten, Embed-Modus und JavaScript-Schnittstelle", <>
        <div className="link-editor">
          <div className="client-toolbar"><div><b>Alle Links bearbeiten</b><small>Diese Adressen werden von Schaltflächen, Embed-Beispielen und verbundenen Apps verwendet.</small></div><span>✎ Direkt editierbar</span></div>
          <div className="editable-name-grid">
            {(Object.entries(settings.integration.links) as Array<[keyof WerkzeugSettings["integration"]["links"], string]>).map(([key, value]) => <label key={key}><span>{({ homeUrl: "Startseite der App", settingsUrl: "Seite Einstellungen", embedUrl: "Direkter Embed-Link", sdkUrl: "JavaScript SDK", apiBaseUrl: "API-Basisadresse", helpUrl: "Hilfe-Link", googleCallbackUrl: "Google Callback-URL", googleJavaScriptOrigin: "Google JavaScript-Origin", googleProjectNumber: "Google-Projektnummer", googleTestUserEmail: "Google-Testnutzer", googleAudienceUrl: "Google Audience / Testnutzer", googleCredentialsUrl: "Google OAuth-Clients", googleDriveApiUrl: "Google Drive API", googleCalendarApiUrl: "Google Calendar API", googleGmailApiUrl: "Gmail API" } as Record<string, string>)[key]}</span><input value={value} onChange={(event) => update({ integration: { ...settings.integration, links: { ...settings.integration.links, [key]: event.target.value } } })}/></label>)}
          </div>
        </div>
        <div className="client-toolbar"><div><b>Verbundene Apps</b><small>Jede App erhält einen eigenen Namen und nur die ausgewählten Einstellungsbereiche.</small></div><button className="primary action" onClick={addClient}>＋ App hinzufügen</button></div>
        <div className="client-list">{settings.integration.clients.length ? settings.integration.clients.map((client) => <article className="client-card" key={client.id}>
          <div className="client-fields"><label><span>Name der App</span><input value={client.displayName} onChange={(event) => updateClient(client.id, { displayName: event.target.value })}/></label><label><span>Adresse der App</span><input value={client.origin} onChange={(event) => updateClient(client.id, { origin: event.target.value })} placeholder="https://meine-app.example"/></label><label className="client-enabled"><input type="checkbox" checked={client.enabled} onChange={(event) => updateClient(client.id, { enabled: event.target.checked })}/><span>Aktiv</span></label><button className="client-remove" onClick={() => removeClient(client.id)} aria-label={`${client.displayName} entfernen`}>×</button></div>
          <fieldset className="grant-picker"><legend>Diese Bereiche freigeben</legend>{(Object.entries(grantLabels) as Array<[SettingsGrant, string]>).map(([grant, label]) => <label key={grant}><input type="checkbox" checked={client.grants.includes(grant)} onChange={(event) => updateClient(client.id, { grants: event.target.checked ? [...client.grants, grant] : client.grants.filter((value) => value !== grant) })}/><span>{label}</span></label>)}</fieldset>
        </article>) : <div className="empty-clients"><span>↗</span><b>Noch keine App verbunden</b><p>Füge eine App hinzu, gib ihr einen eigenen Namen und wähle genau die Bereiche aus, die sie lesen darf.</p></div>}</div>
        <div className="sharing-grid integration-code-grid"><div className="sharing-help"><b>Sicherheitsregel</b><p>Nur exakt eingetragene und aktive App-Adressen erhalten Einstellungen. Schlüssel, Tokens und Passwörter werden nie übertragen.</p></div><div className="code-card editable-code-card"><div className="code-editor-head"><b>Einstellungen-Modul einbetten</b><span>✎ Direkt editierbar</span></div><label className="code-line"><code>&lt;script src=&quot;</code><input aria-label="JavaScript-SDK-Adresse bearbeiten" value={settings.integration.links.sdkUrl} onChange={(event) => update({ integration: { ...settings.integration, links: { ...settings.integration.links, sdkUrl: event.target.value } } })}/><code>&quot;&gt;&lt;/script&gt;</code></label><pre>{`<div id="einstellungen"></div>\n<script>\n  Einstellungen.mount({\n    container: "#einstellungen"\n  });\n</script>`}</pre></div></div>
        <div className="endpoint-row"><span><b>Direkter Embed-Link</b><input aria-label="Direkten Embed-Link bearbeiten" value={settings.integration.links.embedUrl} onChange={(event) => update({ integration: { ...settings.integration, links: { ...settings.integration.links, embedUrl: event.target.value } } })}/></span><button onClick={() => navigator.clipboard?.writeText(settings.integration.links.embedUrl).then(() => onToast("Embed-Link kopiert"))}>Kopieren</button></div>
      </>)}
      </>}

      {visible("data") && accordion("backup", "⇩", settings.labels.sections.backup, "Einstellungen exportieren, wieder einlesen oder zurücksetzen", <div className="backup-actions">
        <button className="primary action" onClick={exportSettings}>Einstellungen exportieren</button>
        <label className="button">Einstellungsdatei importieren<input type="file" accept="application/json,.json" onChange={importSettings}/></label>
        <button className="danger-button" onClick={resetSettings}>Einstellungen zurücksetzen</button>
        <p>Der Export enthält ausschließlich persönliche Einstellungen und keine API-Schlüssel, Google-Tokens oder Passwörter.</p>
      </div>)}
    </div>
  </>;
}
