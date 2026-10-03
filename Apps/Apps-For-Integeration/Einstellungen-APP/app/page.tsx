"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type View = "calendar" | "mail" | "notes" | "integrations";
type PlanItem = { id: string; date: string; title: string; type: string; duration: number; status: string; source: "json" | "calendar" };
type MailItem = { id: string; subject: string; from: string; to: string; date: string; direction: "received" | "sent"; body: string; attachments: string[]; imported: boolean };
type Note = { id: string; date: string; task: string; text: string; files: string[]; updatedAt: string };
type AppLinks = { settingsUrl: string; embedUrl: string; sdkUrl: string; apiBaseUrl: string; helpUrl: string };
type UiLabels = {
  navigation: {
    workspace: string; calendar: string; calendarSubtitle: string; programEntries: string;
    mail: string; mailSubtitle: string; notes: string; notesSubtitle: string;
    connections: string; connectionsSubtitle: string; centralSettings: string;
    centralSettingsSubtitle: string; standaloneApp: string;
  };
  cards: { centralSettings: string; jsonImport: string; embed: string; integrationApi: string };
};

const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const DEFAULT_UI_LABELS: UiLabels = {
  navigation: {
    workspace: "Arbeitsbereich", calendar: "Kalender & Kapazität", calendarSubtitle: "Programm und Termine", programEntries: "Programmeinträge",
    mail: "E-Mails & Dokumente", mailSubtitle: "Selektiver Import", notes: "Notizen", notesSubtitle: "Automatisch gespeichert",
    connections: "Verbindungen", connectionsSubtitle: "Google & Einbettung", centralSettings: "Zentrale Einstellungen",
    centralSettingsSubtitle: "Für alle verbundenen Apps", standaloneApp: "Eigenständige App",
  },
  cards: { centralSettings: "Zentrale Einstellungen", jsonImport: "JSON-Plan importieren", embed: "In andere Apps einbetten", integrationApi: "Sichere Integrations-API" },
};

const demoPlan: PlanItem[] = [
  ["2026-08-03", "Artikel 01 · Hevner 1/2 · Design Science", "Artikel", 90],
  ["2026-08-04", "Artikel 01 · Hevner 2/2 · Methodik", "Artikel", 90],
  ["2026-08-05", "Artikel 02 · Nagy 1/2 · SQL-Ausführung", "Artikel", 90],
  ["2026-08-06", "Artikel 02 · Nagy 2/2 · Unaufgelöst", "Artikel", 90],
  ["2026-08-07", "Artikel 03 · Shatnawi 1/2 · Literatur", "Artikel", 75],
  ["2026-08-09", "Ruhe und Wiederholung", "Ruhe", 0],
  ["2026-08-10", "Artikel 04 · Yamaguchi 1/2 · AST", "Artikel", 90],
  ["2026-08-11", "Artikel 04 · Yamaguchi 2/2 · Graph", "Artikel", 90],
  ["2026-08-12", "Artikel 05 · LogicLens 1/2", "Artikel", 90],
  ["2026-08-13", "Artikel 05 · LogicLens 2/2", "Artikel", 90],
  ["2026-08-14", "Artikel 06 · CodeFuse 1/2", "Artikel", 90],
  ["2026-08-17", "Artikel 07 · Abedu · Knowledge Graph", "Artikel", 90],
  ["2026-08-18", "Artikel 08 · SWE-QA · Repository", "Artikel", 90],
  ["2026-08-20", "Literatur-Synthese · Problem → Lücke", "Synthese", 120],
  ["2026-08-21", "Projekt-Präsentation", "Präsentation", 120],
  ["2026-08-24", "Kurs 1/10 · Preprocessing und Token", "Kurs", 100],
  ["2026-08-25", "Build 1/10 · Code-aware Tokenizer", "Build", 120],
  ["2026-08-26", "Kurs 2/10 · Bag of Words und TF-IDF", "Kurs", 100],
  ["2026-08-27", "Build 2/10 · TF-IDF Repository", "Build", 120],
  ["2026-08-28", "Ruhe", "Ruhe", 0],
].map(([date, title, type, duration], index) => ({ id: `demo-${index}`, date: String(date), title: String(title), type: String(type), duration: Number(duration), status: "planned", source: "json" }));

const demoMails: MailItem[] = [
  { id: "m1", subject: "Bachelorarbeit – Termin im September", from: "Prof. Dr. Ute Schmid <ute.schmid@uni-bamberg.de>", to: "Elahe", date: "2026-08-02T09:30:00", direction: "received", body: "Melden Sie sich gerne ab September. Dann können wir die nächsten Schritte besprechen.", attachments: [], imported: false },
  { id: "m2", subject: "Exposé v2.0 – aktuelle Fassung", from: "Elahe", to: "Betreuung", date: "2026-08-01T18:12:00", direction: "sent", body: "Im Anhang sende ich die aktualisierte Fassung und die beiden Forschungsfragen.", attachments: ["Expose_v2.pdf"], imported: false },
  { id: "m3", subject: "Paper Note Template", from: "Research Notes", to: "Elahe", date: "2026-07-31T13:00:00", direction: "received", body: "Vorlage: Problem, Methode, Ergebnis, Limitation und Projektentscheidung.", attachments: ["Paper_Note_Template.docx"], imported: true },
];

function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  const iso = text.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const de = text.match(/(\d{1,2})[./-](\d{1,2})[./-](20\d{2})/);
  if (de) return `${de[3]}-${de[2].padStart(2, "0")}-${de[1].padStart(2, "0")}`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function flattenObjects(value: unknown, result: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(value)) value.forEach((item) => flattenObjects(item, result));
  else if (value && typeof value === "object") {
    result.push(value as Record<string, unknown>);
    Object.values(value).forEach((item) => { if (item && typeof item === "object") flattenObjects(item, result); });
  }
  return result;
}

function pick(object: Record<string, unknown>, names: string[]) {
  const key = Object.keys(object).find((candidate) => names.includes(candidate.toLowerCase().replace(/[_\s-]/g, "")));
  return key ? object[key] : undefined;
}

function parsePlanJson(value: unknown): PlanItem[] {
  const candidates = flattenObjects(value);
  const items: PlanItem[] = [];
  candidates.forEach((object, index) => {
    const rawDate = pick(object, ["date", "datum", "day", "tag", "start", "startdate", "planneddate", "scheduleddate"]);
    const date = normalizeDate(rawDate);
    if (!date) return;
    const rawTitle = pick(object, ["title", "titel", "task", "aufgabe", "topic", "thema", "name", "activity", "aktivität", "lesson", "subject"]);
    const title = typeof rawTitle === "string" ? rawTitle : `Geplanter Eintrag ${index + 1}`;
    const rawType = pick(object, ["type", "typ", "category", "kategorie", "kind"]);
    const rawDuration = pick(object, ["duration", "dauer", "minutes", "minuten", "durationminutes", "estimatedminutes", "estimatedduration"]);
    const rawStatus = pick(object, ["status", "state", "zustand"]);
    const duration = typeof rawDuration === "number" ? rawDuration : Number(String(rawDuration ?? "90").match(/\d+/)?.[0] ?? 90);
    items.push({ id: `json-${index}-${date}`, date, title, type: String(rawType ?? "Plan"), duration, status: String(rawStatus ?? "planned"), source: "json" });
  });
  return items.filter((item, index, all) => all.findIndex((other) => other.date === item.date && other.title === item.title) === index);
}

function parseIcs(text: string): PlanItem[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  return unfolded.split("BEGIN:VEVENT").slice(1).map((block, index) => {
    const field = (name: string) => block.match(new RegExp(`(?:^|\\n)${name}(?:;[^:]*)?:(.*)`, "i"))?.[1]?.trim() ?? "";
    const start = field("DTSTART");
    const date = start.match(/(20\d{2})(\d{2})(\d{2})/)?.slice(1, 4).join("-") ?? normalizeDate(start) ?? new Date().toISOString().slice(0, 10);
    const end = field("DTEND");
    let duration = 60;
    if (/T\d{6}/.test(start) && /T\d{6}/.test(end)) {
      const toDate = (raw: string) => new Date(raw.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/, "$1-$2-$3T$4:$5:$6Z"));
      duration = Math.max(0, Math.round((toDate(end).getTime() - toDate(start).getTime()) / 60000));
    }
    return { id: field("UID") || `ics-${index}`, date, title: field("SUMMARY") || "Kalendertermin", type: "Kalender", duration, status: "busy", source: "calendar" as const };
  });
}

function parseEml(text: string, id: string): MailItem {
  const unfolded = text.replace(/\r?\n[ \t]+/g, " ");
  const header = (name: string) => unfolded.match(new RegExp(`^${name}:\\s*(.+)$`, "im"))?.[1]?.trim() ?? "Unbekannt";
  const body = text.split(/\r?\n\r?\n/).slice(1).join("\n\n").replace(/--[-\w]+[\s\S]*$/m, "").trim();
  const from = header("From"); const to = header("To");
  const attachments = [...text.matchAll(/filename\*?=(?:UTF-8''|["']?)([^"'\r\n;]+)/gi)].map((match) => decodeURIComponent(match[1].replace(/["']/g, "")));
  const sent = /elahe|hajimohammadi/i.test(from);
  return { id, subject: header("Subject"), from, to, date: new Date(header("Date")).toISOString(), direction: sent ? "sent" : "received", body: body || "Der Nachrichtentext ist MIME-kodiert und wird nach dem Import auf dem Server dekodiert.", attachments, imported: false };
}

function monthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }

export default function Werkzeug() {
  const [view, setView] = useState<View>("calendar");
  const [month, setMonth] = useState(new Date(2026, 7, 1));
  const [plan, setPlan] = useState<PlanItem[]>(demoPlan);
  const [mails, setMails] = useState<MailItem[]>(demoMails);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedDate, setSelectedDate] = useState("2026-08-03");
  const [noteText, setNoteText] = useState("");
  const [noteTask, setNoteTask] = useState("Artikel 01 · Hevner 1/2 · Design Science");
  const [noteFiles, setNoteFiles] = useState<string[]>([]);
  const [noteSearch, setNoteSearch] = useState("");
  const [mailSearch, setMailSearch] = useState("");
  const [mailDirection, setMailDirection] = useState<"all" | "received" | "sent">("all");
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(demoMails[0]);
  const [toast, setToast] = useState("");
  const [saveState, setSaveState] = useState("Gespeichert");
  const [embed, setEmbed] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [appName, setAppName] = useState("Einstellungen");
  const [appSubtitle, setAppSubtitle] = useState("Zentrale Konfiguration · verbundene Module");
  const [uiLabels, setUiLabels] = useState<UiLabels>(DEFAULT_UI_LABELS);
  const [appLinks, setAppLinks] = useState<AppLinks>({ settingsUrl: "/settings", embedUrl: "/settings?embed=1", sdkUrl: "/einstellungen.js", apiBaseUrl: "/api", helpUrl: "/settings" });
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trustedOrigins = useRef<string[]>([]);
  const settingsSnapshot = useRef<Record<string, unknown> | null>(null);
  const sharedState = useRef({ plan, mails, notes });
  const showToast = (message: string) => { setToast(message); setTimeout(() => setToast(""), 2800); };
  const saveAppLinks = async (nextLinks: AppLinks) => {
    const current = settingsSnapshot.current;
    if (!current) return showToast("Einstellungen werden noch geladen.");
    const integration = asRecord(current.integration);
    const storedLinks = asRecord(integration.links);
    const nextSettings = { ...current, integration: { ...integration, links: { ...storedLinks, ...nextLinks } } };
    try {
      const response = await fetch("/api/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ settings: nextSettings }) });
      const data = asRecord(await response.json());
      if (!response.ok) throw new Error(String(data.message || "save_failed"));
      const saved = asRecord(data.settings);
      settingsSnapshot.current = Object.keys(saved).length ? saved : nextSettings;
      const savedLinks = asRecord(asRecord(settingsSnapshot.current.integration).links);
      setAppLinks((currentLinks) => ({ ...currentLinks, ...savedLinks }));
      showToast("Integrationsadresse gespeichert");
    } catch { showToast("Die Adresse konnte nicht gespeichert werden."); }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const embedMode = params.get("embed");
    queueMicrotask(() => {
      setEmbed(Boolean(embedMode));
      if (embedMode === "calendar") setView("calendar");
      if (embedMode === "mail") setView("mail");
      if (embedMode === "notes") setView("notes");
    });
    const google = params.get("google");
    if (google === "config") setTimeout(() => showToast("Für Google OAuth müssen GOOGLE_CLIENT_ID und GOOGLE_CLIENT_SECRET sicher im Server hinterlegt werden."), 200);
    if (google === "connected") setTimeout(() => showToast("Google Calendar und Gmail wurden verbunden."), 200);
    if (google === "failed" || google === "invalid") setTimeout(() => showToast("Die Google-Verbindung konnte nicht bestätigt werden."), 200);
    const stored = localStorage.getItem("werkzeug-data");
    if (stored) {
      try { const data = JSON.parse(stored); queueMicrotask(() => { if (data.plan) setPlan(data.plan); if (data.mails) setMails(data.mails); if (data.notes) setNotes(data.notes); }); } catch { /* keep safe defaults */ }
    }
    fetch("/api/google/status")
      .then((response) => response.json() as Promise<{ connected?: boolean }>)
      .then((data) => setGoogleConnected(Boolean(data.connected)))
      .catch(() => undefined);
    fetch("/api/settings").then((response) => response.json() as Promise<{ settings?: unknown }>).then((data) => {
      const loadedSettings = asRecord(data.settings);
      const integration = asRecord(loadedSettings.integration);
      const labels = asRecord(loadedSettings.labels);
      const navigation = asRecord(labels.navigation);
      const cards = asRecord(labels.cards);
      const links = asRecord(integration.links);
      if (data.settings && typeof data.settings === "object") settingsSnapshot.current = loadedSettings;
      trustedOrigins.current = Array.isArray(integration.trustedOrigins) ? integration.trustedOrigins.map(String) : [];
      if (labels.appName) setAppName(String(labels.appName));
      if (labels.appSubtitle) setAppSubtitle(String(labels.appSubtitle));
      if (Object.keys(navigation).length || Object.keys(cards).length) setUiLabels((current) => ({
        navigation: { ...current.navigation, ...navigation },
        cards: { ...current.cards, ...cards },
      } as UiLabels));
      if (Object.keys(links).length) setAppLinks((current) => ({ ...current, ...links } as AppLinks));
    }).catch(() => undefined);
    fetch("/api/notes").then((response) => response.json() as Promise<{ notes?: Note[] }>).then((data) => { if (Array.isArray(data.notes) && data.notes.length) setNotes(data.notes); }).catch(() => undefined);
    const receive = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      if (event.origin !== location.origin && !trustedOrigins.current.includes(event.origin)) return;
      const source = event.source as Window | null;
      const reply = (message: Record<string, unknown>) => source?.postMessage(message, event.origin);
      if (event.data.type === "werkzeug:import-plan") {
        const imported = parsePlanJson(event.data.payload);
        if (imported.length) { setPlan((current) => [...current.filter((item) => item.source !== "json"), ...imported]); reply({ type: "werkzeug:plan-imported", payload: { count: imported.length } }); }
      }
      if (event.data.type === "werkzeug:get-state") reply({ type: "werkzeug:state", payload: sharedState.current });
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  useEffect(() => {
    sharedState.current = { plan, mails, notes };
    localStorage.setItem("werkzeug-data", JSON.stringify({ plan, mails, notes }));
    if (window.parent !== window && document.referrer) {
      try {
        const parentOrigin = new URL(document.referrer).origin;
        if (parentOrigin === location.origin || trustedOrigins.current.includes(parentOrigin)) window.parent.postMessage({ type: "werkzeug:data-change", payload: { plan, mails, notes } }, parentOrigin);
      } catch { /* ignore invalid referrer */ }
    }
  }, [plan, mails, notes]);

  useEffect(() => {
    const existing = notes.find((note) => note.date === selectedDate);
    const planned = plan.find((item) => item.date === selectedDate);
    queueMicrotask(() => { setNoteText(existing?.text ?? ""); setNoteFiles(existing?.files ?? []); setNoteTask(planned?.title ?? existing?.task ?? "Freie Tagesnotiz"); });
  }, [selectedDate, notes, plan]);

  useEffect(() => {
    if (noteTimer.current) clearTimeout(noteTimer.current);
    queueMicrotask(() => setSaveState("Wird gespeichert …"));
    noteTimer.current = setTimeout(() => {
      setNotes((all) => {
        const task = noteTask.trim() || "Unbenannte Aufgabe";
        const next: Note = { id: all.find((item) => item.date === selectedDate)?.id ?? uid(), date: selectedDate, task, text: noteText, files: noteFiles, updatedAt: new Date().toISOString() };
        fetch("/api/notes", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(next) }).then((response) => response.json() as Promise<{ persistent?: boolean }>).then((data) => setSaveState(data.persistent ? "Sicher gespeichert" : "Lokal gespeichert")).catch(() => setSaveState("Lokal gespeichert"));
        return [...all.filter((item) => item.date !== selectedDate), next];
      });
    }, 700);
    return () => { if (noteTimer.current) clearTimeout(noteTimer.current); };
  }, [noteText, noteFiles, selectedDate, noteTask]);

  const monthItems = useMemo(() => plan.filter((item) => item.date.startsWith(monthKey(month))), [plan, month]);
  const filteredMails = useMemo(() => mails.filter((mail) => (mailDirection === "all" || mail.direction === mailDirection) && `${mail.subject} ${mail.from} ${mail.to} ${mail.body}`.toLowerCase().includes(mailSearch.toLowerCase())), [mails, mailSearch, mailDirection]);
  const filteredNotes = useMemo(() => notes.filter((note) => `${note.date} ${note.task} ${note.text} ${note.files.join(" ")}`.toLowerCase().includes(noteSearch.toLowerCase())), [notes, noteSearch]);

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const parsed = parsePlanJson(JSON.parse(await file.text()));
      if (!parsed.length) return showToast("Keine Datumsfelder erkannt. Verwende date/Datum/start und title/task/topic.");
      setPlan((current) => [...current.filter((item) => item.source !== "json"), ...parsed]);
      const first = new Date(`${parsed[0].date}T12:00:00`); setMonth(new Date(first.getFullYear(), first.getMonth(), 1));
      showToast(`${parsed.length} Programmeinträge aus JSON erkannt`);
    } catch { showToast("Die JSON-Datei ist ungültig oder unvollständig."); }
    event.target.value = "";
  };

  const importIcs = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const imported = parseIcs(await file.text()); setPlan((current) => [...current.filter((item) => item.source !== "calendar"), ...imported]);
    showToast(`${imported.length} Kalendertermine gelesen`); event.target.value = "";
  };

  const importEml = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    const imported = await Promise.all(files.map(async (file) => parseEml(await file.text(), uid())));
    setMails((current) => [...imported, ...current]); showToast(`${imported.length} ausgewählte E-Mail(s) gelesen`); event.target.value = "";
  };

  const syncGoogle = async () => {
    try {
      const response = await fetch("/api/google/calendar"); const data = await response.json() as { message?: string; items?: PlanItem[] };
      if (!response.ok) throw new Error(data.message);
      const items = data.items ?? [];
      setPlan((current) => [...current.filter((item) => item.source !== "calendar"), ...items]); showToast(`${items.length} Google-Termine synchronisiert`);
    } catch (error) { showToast(error instanceof Error ? error.message : "Google Calendar ist noch nicht eingerichtet."); }
  };

  const readGmail = async () => {
    try {
      const response = await fetch("/api/google/gmail"); const data = await response.json() as { message?: string; items?: MailItem[] };
      if (!response.ok) throw new Error(data.message);
      const items = data.items ?? [];
      setMails((current) => [...items, ...current.filter((mail) => !items.some((incoming) => incoming.id === mail.id))]);
      showToast(`${items.length} E-Mail-Kopfzeilen gelesen. Importiere nur die Nachrichten, die du auswählst.`);
    } catch (error) { showToast(error instanceof Error ? error.message : "Gmail ist noch nicht eingerichtet."); }
  };

  const addNoteFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    setNoteFiles((current) => [...current, ...files.map((file) => file.name)]);
    for (const file of files) {
      const form = new FormData(); form.append("file", file);
      fetch("/api/files", { method: "POST", body: form }).catch(() => undefined);
    }
    event.target.value = "";
  };

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1); const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [month]);

  const renameTask = (value: string) => {
    setNoteTask(value);
    setPlan((current) => current.map((item) => item.date === selectedDate ? { ...item, title: value } : item));
  };
  const finishTaskRename = () => {
    const title = noteTask.trim() || "Unbenannte Aufgabe";
    setNoteTask(title);
    setPlan((current) => current.map((item) => item.date === selectedDate ? { ...item, title } : item));
  };

  return <main className={`werkzeug ${embed ? "embed" : ""}`}>
    <header className="topbar">
      <div className="brand"><span>{appName.slice(0, 1).toUpperCase() || "E"}</span><div><b>{appName}</b><small>{appSubtitle}</small></div></div>
      <div className="header-status"><span className="secure">● Sicher gespeichert</span><a className="header-link" href={appLinks.settingsUrl}>⚙ {appName}</a><a className="header-link" href={appLinks.helpUrl}>Hilfe</a></div>
    </header>
    <div className="layout">
      <aside className="sidebar">
        <p className="side-label">{uiLabels.navigation.workspace}</p>
        <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}><span>▦</span><div>{uiLabels.navigation.calendar}<small>{plan.length} {uiLabels.navigation.programEntries}</small></div></button>
        <button className={view === "mail" ? "active" : ""} onClick={() => setView("mail")}><span>✉</span><div>{uiLabels.navigation.mail}<small>{uiLabels.navigation.mailSubtitle}</small></div></button>
        <button className={view === "notes" ? "active" : ""} onClick={() => setView("notes")}><span>▤</span><div>{uiLabels.navigation.notes}<small>{uiLabels.navigation.notesSubtitle}</small></div></button>
        <button className={view === "integrations" ? "active" : ""} onClick={() => setView("integrations")}><span>⌁</span><div>{uiLabels.navigation.connections}<small>{uiLabels.navigation.connectionsSubtitle}</small></div></button>
        <a className="sidebar-settings" href={appLinks.settingsUrl}><span>⚙</span><div>{uiLabels.navigation.centralSettings}<small>{uiLabels.navigation.centralSettingsSubtitle}</small></div></a>
        <div className="side-info"><b>{uiLabels.navigation.standaloneApp}</b><p>{appName} kann vollständig oder modulweise in andere Programme eingebettet werden.</p><code>{appLinks.embedUrl}</code></div>
      </aside>

      <section className="content">
        {view === "calendar" && <>
          <div className="hero"><div><span className="eyebrow">KAPAZITÄTSPLANUNG</span><h1>{uiLabels.navigation.calendar}</h1><p>AI-Plan aus JSON erkennen, Termine lesen und Konflikte sichtbar machen.</p></div><div className="hero-actions"><label className="button primary">JSON-Plan importieren<input type="file" accept="application/json,.json" onChange={importJson}/></label><label className="button">ICS importieren<input type="file" accept="text/calendar,.ics" onChange={importIcs}/></label></div></div>
          <div className="connection-bar"><div><span className={googleConnected ? "dot online" : "dot"}/><b>Google Calendar</b><small>{googleConnected ? "Verbunden · vorhandene Termine werden nur gelesen" : "Noch nicht verbunden · ICS-Import funktioniert bereits"}</small></div><div>{googleConnected ? <><button onClick={syncGoogle}>↻ Jetzt synchronisieren</button><button onClick={() => location.assign("/api/google/disconnect")}>Trennen</button></> : <button className="connect" onClick={() => location.assign("/api/google/auth")}>Mit Google verbinden</button>}</div></div>
          <div className="calendar-card">
            <div className="calendar-head"><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button><div><h2>{MONTHS[month.getMonth()]} {month.getFullYear()}</h2><span>{monthItems.length} Einträge · {Math.round(monthItems.reduce((sum, item) => sum + item.duration, 0) / 60)} geplante Stunden</span></div><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button></div>
            <div className="weekdays">{WEEKDAYS.map((day) => <b key={day}>{day}</b>)}</div>
            <div className="calendar-grid">{days.map((day, index) => {
              if (!day) return <div className="day empty" key={`e-${index}`}/>;
              const date = `${monthKey(month)}-${String(day).padStart(2, "0")}`; const entries = plan.filter((item) => item.date === date); const used = entries.reduce((sum, item) => sum + item.duration, 0);
              return <button key={date} className={`day ${selectedDate === date ? "selected" : ""} ${entries.some((item) => item.type === "Ruhe") ? "rest" : ""} ${used > 240 ? "over" : ""}`} onClick={() => { setSelectedDate(date); if (entries.length) setView("notes"); }}><span className="day-number">{day}</span>{entries.slice(0, 3).map((item) => <span className={`event ${item.source}`} key={item.id}>{item.title}</span>)}{used > 0 && <small>{Math.round(used / 6) / 10} h belegt</small>}{used > 240 && <strong>Kapazität prüfen</strong>}</button>;
            })}</div>
          </div>
        </>}

        {view === "mail" && <>
          <div className="hero"><div><span className="eyebrow">PROJEKTAKTE</span><h1>{uiLabels.navigation.mail}</h1><p>Nur ausgewählte Nachrichten importieren und Metadaten automatisch erkennen.</p></div><div className="hero-actions"><label className="button primary">EML auswählen<input type="file" accept="message/rfc822,.eml" multiple onChange={importEml}/></label>{googleConnected ? <button className="button" onClick={readGmail}>Gmail lesen</button> : <button className="button" onClick={() => setView("integrations")}>Gmail verbinden</button>}</div></div>
          <div className="mail-shell"><div className="mail-list"><div className="list-tools"><input value={mailSearch} onChange={(event) => setMailSearch(event.target.value)} placeholder="Betreff, Name oder Text suchen …"/><select value={mailDirection} onChange={(event) => setMailDirection(event.target.value as typeof mailDirection)}><option value="all">Alle</option><option value="received">Empfangen</option><option value="sent">Gesendet</option></select></div>{filteredMails.map((mail) => <button className={selectedMail?.id === mail.id ? "mail-row active" : "mail-row"} key={mail.id} onClick={() => setSelectedMail(mail)}><span className={`direction ${mail.direction}`}>{mail.direction === "received" ? "↓" : "↑"}</span><div><b>{mail.subject}</b><small>{mail.direction === "received" ? mail.from : `An: ${mail.to}`}</small><p>{mail.body}</p></div><time>{new Date(mail.date).toLocaleDateString("de-DE")}</time>{mail.imported && <em>Importiert</em>}</button>)}</div>
            <article className="mail-detail">{selectedMail ? <><div className="mail-title"><span className={`direction ${selectedMail.direction}`}>{selectedMail.direction === "received" ? "↓" : "↑"}</span><div><h2>{selectedMail.subject}</h2><p>{selectedMail.direction === "received" ? "Empfangene Nachricht" : "Gesendete Nachricht"}</p></div></div><dl><div><dt>Von</dt><dd>{selectedMail.from}</dd></div><div><dt>An</dt><dd>{selectedMail.to}</dd></div><div><dt>Datum</dt><dd>{new Date(selectedMail.date).toLocaleString("de-DE")}</dd></div></dl><div className="mail-body">{selectedMail.body}</div>{selectedMail.attachments.length > 0 && <div className="attachments">{selectedMail.attachments.map((file) => <span key={file}>▧ {file}</span>)}</div>}<button className="primary action" onClick={() => { setMails((all) => all.map((mail) => mail.id === selectedMail.id ? { ...mail, imported: true } : mail)); setSelectedMail({ ...selectedMail, imported: true }); showToast("E-Mail mit Metadaten in die Projektakte übernommen"); }}>✓ Auswahl importieren</button></> : <p>Wähle links eine E-Mail aus.</p>}</article></div>
        </>}

        {view === "notes" && <>
          <div className="hero"><div><span className="eyebrow">TAGESKARTEN</span><h1>{uiLabels.navigation.notes}</h1><p>Text und Nachweise bleiben mit dem Arbeitstag und der Aufgabe verknüpft.</p></div><div className="note-controls"><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}/><input value={noteSearch} onChange={(event) => setNoteSearch(event.target.value)} placeholder="Notiz suchen …"/></div></div>
          <section className="note-editor-card"><div className="note-header"><div><span>TAGESKARTE · {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}</span><label className="note-title-editor"><span>✎</span><input aria-label="Titel der Aufgabe bearbeiten" value={noteTask} onChange={(event) => renameTask(event.target.value)} onBlur={finishTaskRename}/></label></div><em>{saveState}</em></div><label>Text für diesen Arbeitstag</label><textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Was habe ich verstanden, gebaut, getestet und noch nicht geklärt?"/><div className="evidence-head"><div><b>Nachweise zu dieser Notiz</b><p>Fotos, Dokumente und Aufnahmen bleiben mit dieser Notiz verknüpft.</p></div><span>{noteFiles.length} Datei(en)</span></div><label className="dropzone">⇧<b>Dateien hier ablegen oder auswählen</b><small>Fotos, PDF, Dokumente oder Audio</small><input type="file" multiple onChange={addNoteFiles}/></label><div className="file-list">{noteFiles.map((file) => <span key={file}>▧ {file}<button onClick={() => setNoteFiles((all) => all.filter((item) => item !== file))}>×</button></span>)}</div></section>
          <div className="archive"><h3>Gespeicherte Tageskarten</h3>{filteredNotes.filter((note) => note.text || note.files.length).sort((a, b) => b.date.localeCompare(a.date)).map((note) => <button key={note.id} onClick={() => { setSelectedDate(note.date); setNoteText(note.text); setNoteFiles(note.files); }}><time>{new Date(`${note.date}T12:00:00`).toLocaleDateString("de-DE")}</time><b>{note.task}</b><p>{note.text || `${note.files.length} Nachweisdatei(en)`}</p></button>)}</div>
        </>}

        {view === "integrations" && <>
          <div className="hero"><div><span className="eyebrow">MODULAR & SICHER</span><h1>{uiLabels.navigation.connections}</h1><p>Kontrolliere genau, welche Einstellungen gelesen und an freigegebene Apps weitergegeben werden dürfen.</p></div></div>
          <div className="integration-grid">
            <article><div className="integration-icon">⚙</div><h2>{uiLabels.cards.centralSettings}</h2><p>Google, OpenAI, DeepL, Zugriffsrechte, Planung und Datensicherung werden an einer Stelle verwaltet.</p><div className="integration-card-actions"><span className="status ok">Eigenständiges Modul</span><button className="primary action compact-action" onClick={() => location.assign(appLinks.settingsUrl)}>Einstellungen öffnen</button></div></article>
            <article><div className="integration-icon">{`{}`}</div><h2>{uiLabels.cards.jsonImport}</h2><p>Erkennt automatisch Felder wie date/Datum, title/task/topic, duration und status. Unklare Strukturen werden nicht stillschweigend falsch importiert.</p><label className="button primary wide">JSON auswählen<input type="file" accept="application/json,.json" onChange={importJson}/></label></article>
            <article><div className="integration-icon">↗</div><h2>{uiLabels.cards.embed}</h2><p>Vollständig oder nur als Kalender, E-Mail-Akte, Notizen oder zentrale Einstellungen.</p><div className="integration-code-editor"><div className="code-editor-head"><span>✎ Direkt editierbar</span><button onClick={() => navigator.clipboard?.writeText(`<iframe src="${appLinks.embedUrl}" />`).then(() => showToast("Iframe-Code kopiert"))}>Kopieren</button></div><label className="code-line"><code>&lt;iframe src=&quot;</code><input aria-label="Embed-Adresse bearbeiten" value={appLinks.embedUrl} onChange={(event) => setAppLinks((current) => ({ ...current, embedUrl: event.target.value }))} onBlur={(event) => void saveAppLinks({ ...appLinks, embedUrl: event.target.value })}/><code>&quot; /&gt;</code></label></div></article>
            <article><div className="integration-icon">⌁</div><h2>{uiLabels.cards.integrationApi}</h2><p>Nur freigegebene Herkunftsseiten erhalten Daten. Die Einstellungen enthalten niemals Schlüssel oder Tokens.</p><div className="integration-code-editor"><div className="code-editor-head"><span>✎ Direkt editierbar</span><button onClick={() => navigator.clipboard?.writeText(`// SDK: ${appLinks.sdkUrl}\n// API: ${appLinks.apiBaseUrl}`).then(() => showToast("SDK/API-Adressen kopiert"))}>Kopieren</button></div><label className="code-link-row"><code>{"// SDK:"}</code><input aria-label="SDK-Adresse bearbeiten" value={appLinks.sdkUrl} onChange={(event) => setAppLinks((current) => ({ ...current, sdkUrl: event.target.value }))} onBlur={(event) => void saveAppLinks({ ...appLinks, sdkUrl: event.target.value })}/></label><label className="code-link-row"><code>{"// API:"}</code><input aria-label="API-Adresse bearbeiten" value={appLinks.apiBaseUrl} onChange={(event) => setAppLinks((current) => ({ ...current, apiBaseUrl: event.target.value }))} onBlur={(event) => void saveAppLinks({ ...appLinks, apiBaseUrl: event.target.value })}/></label><pre>{`Einstellungen.get({\n  sections: ["profile", "planning"]\n}).then(settings => {\n  // Einstellungen anwenden\n})`}</pre></div></article>
          </div>
        </>}
      </section>
    </div>
    {toast && <div className="toast">✓ {toast}</div>}
  </main>;
}
