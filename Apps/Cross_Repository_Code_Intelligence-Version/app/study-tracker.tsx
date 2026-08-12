"use client";

import {
  ChangeEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  allDays,
  defaultSettings,
  nlpCourseSessions,
  planMeta,
  planWeeks,
  sources,
  type PlannedDay,
  type PlanWeek,
  type SourceDefinition,
} from "./plan-data";
import {
  countCompletedItems,
  estimatedLearningHours,
} from "../lib/study-progress";
import { RecallCheck } from "../components/RecallCheck";
import {
  currentSessionSeconds,
  isTimedSessionState,
  readDeviceSessions,
  transitionTimedSession,
  writeDeviceSessions,
} from "../lib/device-session-store";
import { DEVICE_ONLY_STORAGE } from "../lib/storage-mode";
import { rescheduleAfterPause } from "../lib/project-schedule";
import {
  DAILY_WORK_MODES,
  DailyWorkMode,
  normalizeDailyWorkMode,
  workModeTaskMinutes,
} from "../lib/daily-work-mode";
import {
  buildPdfReaderHref,
  googleDriveFileId,
  isDirectPdfUrl,
} from "../lib/pdf-reader-link";

type StatusFilter = "all" | "open" | "started" | "done";

type PlanRevision = {
  id: string;
  createdAt: string;
  action: "started" | "paused" | "resumed" | "route_changed";
  reason: string;
  previousStartDate: string;
  previousEndDate: string;
  nextStartDate: string;
  nextEndDate: string;
};

type TrackerSettings = {
  projectName: string;
  planName: string;
  planStartDate: string;
  planEndDate: string;
  planStatus: "not_started" | "running" | "paused";
  planPausedAt: string;
  planRevisionHistory: PlanRevision[];
  dailyWorkMode: DailyWorkMode;
  dailyStart: string;
  driveFolderUrl: string;
  githubUrl: string;
  notionUrl: string;
  pdfReaderUrl: string;
  settingsAppUrl: string;
  sourceOverrides: Record<string, string>;
  sourceLinkOverrides: Record<string, string>;
};

type StoredState = {
  completedIds: string[];
  notes: Record<string, string>;
  settings: TrackerSettings;
};

type AttachmentMeta = {
  id: string;
  dayId: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

type ExposeMeta = {
  name: string;
  size: number | null;
  updatedAt: string | null;
  custom: boolean;
};

type AttachmentKind = "image" | "pdf" | "audio" | "video" | "text" | "office" | "other";

type FocusSession = {
  id: string;
  contextId: string;
  contextTitle: string;
  source: string;
  status: "running" | "paused" | "completed";
  accumulatedSeconds: number;
  startedAt: string | null;
  lastStartedAt: string | null;
  endedAt: string | null;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PhaseGroup = {
  id: string;
  title: string;
  weeks: PlanWeek[];
};

const baseSettings: TrackerSettings = {
  ...defaultSettings,
  planRevisionHistory: [],
  sourceOverrides: { ...defaultSettings.sourceOverrides },
  sourceLinkOverrides: {},
};

const validItemIds = new Set(
  allDays.flatMap((day) =>
    day.tasks.flatMap((task) => task.items.map((item) => item.id)),
  ),
);
const LOCAL_STATE_KEY = "cross-repository-study-tracker:state:v2";
const LOCAL_FOCUS_KEY = "cross-repository-study-tracker:focus:v1";

const priorityMeta: Record<
  SourceDefinition["priority"],
  { label: string; stars: string }
> = {
  core: { label: "Kernquelle", stars: "★★★★★" },
  important: { label: "Wichtig", stars: "★★★★☆" },
  support: { label: "Technische Referenz", stars: "★★★☆☆" },
  optional: { label: "Optional", stars: "★★☆☆☆" },
  course: { label: "Kursquelle", stars: "★★★☆☆" },
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    spark: (
      <>
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
        <path d="M5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
        <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
        <path d="M4 19h16" />
      </>
    ),
    upload: (
      <>
        <path d="M12 21V9m0 0 4 4m-4-4-4 4" />
        <path d="M4 5h16" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    note: (
      <>
        <path d="M5 3h11l3 3v15H5Z" />
        <path d="M8 10h8M8 14h8M8 18h5" />
      </>
    ),
    book: (
      <>
        <path d="M4 5a3 3 0 0 1 3-3h5v18H7a3 3 0 0 0-3 3Z" />
        <path d="M20 5a3 3 0 0 0-3-3h-5v18h5a3 3 0 0 1 3 3Z" />
      </>
    ),
    paperclip: (
      <path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4 4 0 0 1 5.7 5.7l-9.6 9.6a2 2 0 0 1-2.8-2.8l8.9-8.9" />
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    file: (
      <>
        <path d="M6 2h8l4 4v16H6Z" />
        <path d="M14 2v5h5" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <circle cx="9" cy="10" r="2" />
        <path d="m4 18 5-5 3 3 2-2 6 6" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    flag: (
      <>
        <path d="M5 22V4" />
        <path d="M5 5h11l-2 4 2 4H5" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7Z" />,
    pulse: <path d="M3 12h4l2-7 4 14 2-7h6" />,
    flame: (
      <path d="M13 22c4 0 7-3 7-7 0-3-1.5-5-4-7 .2 2-1 3-2 3-1-3-3-5-5-7 0 4-5 6-5 11 0 4 3 7 7 7 2 0 4-1 5-3-3 .3-5-2-4-5 2 1 5 3 5 6 0 3-2 5-5 5" />
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] ?? paths.spark}
    </svg>
  );
}

function formatDate(date: string, compact = false) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: compact ? undefined : "long",
    day: "numeric",
    month: compact ? "short" : "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}

function systemLocalIsoDate(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayNumber(value: number) {
  return new Intl.NumberFormat("de-DE").format(value);
}

function addDaysToIsoDate(date: string, days: number) {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function daysBetweenIsoDates(from: string, to: string) {
  const fromDate = new Date(`${from}T12:00:00Z`);
  const toDate = new Date(`${to}T12:00:00Z`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return 0;
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
}

function shiftedPlanDate(originalDate: string, selectedStart: string) {
  const offset = daysBetweenIsoDates(planMeta.start, selectedStart);
  return addDaysToIsoDate(originalDate, offset) || originalDate;
}

function suggestedPlanEnd(startDate: string) {
  return shiftedPlanDate(planMeta.end, startDate);
}

function continuousWeeksEnd(startDate: string) {
  return addDaysToIsoDate(startDate, planMeta.totalWeeks * 7 - 1);
}

function attachmentKind(attachment: AttachmentMeta): AttachmentKind {
  const mime = attachment.mimeType.toLowerCase();
  const extension = attachment.name.split(".").pop()?.toLowerCase() ?? "";
  if (/^image\/(?:png|jpe?g|gif|webp|avif)$/.test(mime)) return "image";
  if (mime === "application/pdf" || extension === "pdf") return "pdf";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (/^(docx|xlsx|pptx|odt|ods|odp)$/.test(extension)) return "office";
  if (
    mime.startsWith("text/") ||
    /^(application\/(?:json|xml|javascript)|application\/x-(?:httpd-php|sh))$/.test(mime) ||
    /^(txt|md|markdown|csv|tsv|json|xml|yaml|yml|js|jsx|ts|tsx|py|java|cs|cpp|c|h|css|html|sql|sh|log)$/.test(extension)
  ) {
    return "text";
  }
  return "other";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${displayNumber(bytes)} B`;
  if (bytes < 1024 * 1024) return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`;
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}

function focusSeconds(session: FocusSession, now = Date.now()) {
  return currentSessionSeconds(session, session.accumulatedSeconds, now);
}

function isFocusSession(value: unknown): value is FocusSession {
  if (!isTimedSessionState(value)) return false;
  const session = value as Record<string, unknown>;
  return typeof session.id === "string"
    && typeof session.contextId === "string"
    && typeof session.contextTitle === "string"
    && typeof session.source === "string"
    && typeof session.accumulatedSeconds === "number"
    && Number.isFinite(session.accumulatedSeconds)
    && (typeof session.startedAt === "string" || session.startedAt === null);
}

const readLocalFocusSessions = () => readDeviceSessions(LOCAL_FOCUS_KEY, isFocusSession);
const writeLocalFocusSessions = (sessions: FocusSession[]) => writeDeviceSessions(LOCAL_FOCUS_KEY, sessions);

function formatFocusDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

const DEFAULT_EXPOSE_FOCUS =
  "Projektziel, Forschungsfragen, Scope, Architektur und Erfolgskriterien";

function exposeReaderHref(
  pdfReaderUrl: string,
  focus = DEFAULT_EXPOSE_FOCUS,
  context = "Projekt-Exposé",
) {
  return buildPdfReaderHref({
    readerUrl: pdfReaderUrl,
    document: "expose",
    name: "Cross_Repository_Code_Intelligence – Exposé",
    focus,
    context,
  });
}

function internalLinkProps(href: string) {
  return href.startsWith("/")
    ? {}
    : { target: "_blank", rel: "noopener noreferrer" };
}

async function extractOfficeText(blob: Blob, name: string) {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  const { default: JSZip } = await import("jszip");
  const archive = await JSZip.loadAsync(blob);
  const paths = Object.keys(archive.files)
    .filter((path) => {
      if (extension === "docx") return /^word\/(?:document|header\d+|footer\d+)\.xml$/.test(path);
      if (extension === "pptx") return /^ppt\/(?:slides\/slide\d+|notesSlides\/notesSlide\d+)\.xml$/.test(path);
      if (extension === "xlsx") return /^(?:xl\/sharedStrings|xl\/worksheets\/sheet\d+)\.xml$/.test(path);
      return path === "content.xml";
    })
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .slice(0, 80);

  const sections: string[] = [];
  let totalLength = 0;
  for (const path of paths) {
    const file = archive.file(path);
    if (!file) continue;
    const xml = await file.async("string");
    const withBreaks = xml.replace(
      /<\/(?:w:p|a:p|text:p|text:h|row|c|si)>/gi,
      "$&\n",
    );
    const document = new DOMParser().parseFromString(withBreaks, "application/xml");
    const text = (document.documentElement.textContent ?? "")
      .replace(/[\t ]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (!text) continue;
    const heading = extension === "pptx" ? `\n\n── ${path.split("/").pop()} ──\n` : "\n";
    const remaining = 500_000 - totalLength;
    if (remaining <= 0) break;
    sections.push(`${heading}${text.slice(0, remaining)}`);
    totalLength += text.length;
  }
  return sections.join("\n").trim() || "In dieser Datei wurde kein lesbarer Text gefunden.";
}

function safeSettings(value: unknown): TrackerSettings {
  if (!value || typeof value !== "object") return baseSettings;
  const partial = value as Partial<TrackerSettings>;
  const planRevisionHistory = Array.isArray(partial.planRevisionHistory)
    ? partial.planRevisionHistory
        .filter((entry): entry is PlanRevision => Boolean(entry) && typeof entry === "object")
        .filter((entry) =>
          typeof entry.id === "string" &&
          typeof entry.createdAt === "string" &&
          ["started", "paused", "resumed", "route_changed"].includes(entry.action) &&
          typeof entry.reason === "string" &&
          typeof entry.previousStartDate === "string" &&
          typeof entry.previousEndDate === "string" &&
          typeof entry.nextStartDate === "string" &&
          typeof entry.nextEndDate === "string",
        )
        .slice(0, 50)
    : [];
  const normalizeLegacyAppUrl = (url: unknown, app: "reader" | "settings") => {
    const text = typeof url === "string" ? url.trim() : "";
    if (!text) return app === "reader" ? "/pdf-reader" : "/settings";
    if (/^https:\/\/[^/]+\.chatgpt\.site(?:\/|$)/i.test(text)) {
      if (app === "settings") return "/settings";
      const query = text.includes("?") ? `?${text.split("?").slice(1).join("?")}` : "";
      return `/pdf-reader${query}`;
    }
    return text;
  };
  return {
    ...baseSettings,
    ...partial,
    planStatus: partial.planStatus === "paused" || partial.planStatus === "running"
      ? partial.planStatus
      : "not_started",
    planPausedAt: /^\d{4}-\d{2}-\d{2}$/.test(partial.planPausedAt ?? "")
      ? partial.planPausedAt!
      : "",
    planRevisionHistory,
    dailyWorkMode: normalizeDailyWorkMode(partial.dailyWorkMode),
    pdfReaderUrl: normalizeLegacyAppUrl(partial.pdfReaderUrl, "reader"),
    settingsAppUrl: normalizeLegacyAppUrl(partial.settingsAppUrl, "settings"),
    sourceOverrides:
      partial.sourceOverrides && typeof partial.sourceOverrides === "object"
        ? partial.sourceOverrides
        : {},
    sourceLinkOverrides:
      partial.sourceLinkOverrides &&
      typeof partial.sourceLinkOverrides === "object"
        ? partial.sourceLinkOverrides
        : {},
  };
}

function addPlanRevision(
  current: TrackerSettings,
  next: Pick<PlanRevision, "action" | "reason" | "nextStartDate" | "nextEndDate">,
): PlanRevision[] {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return [
    {
      id,
      createdAt: new Date().toISOString(),
      action: next.action,
      reason: next.reason,
      previousStartDate: current.planStartDate,
      previousEndDate: current.planEndDate,
      nextStartDate: next.nextStartDate,
      nextEndDate: next.nextEndDate,
    },
    ...current.planRevisionHistory,
  ].slice(0, 50);
}

function normalizeState(payload: unknown): Partial<StoredState> {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  const value =
    root.state && typeof root.state === "object"
      ? (root.state as Record<string, unknown>)
      : root;
  const progress = Array.isArray(value.progress) ? value.progress : [];
  const progressObject =
    value.progress && typeof value.progress === "object" && !Array.isArray(value.progress)
      ? (value.progress as Record<string, unknown>)
      : null;
  const completed = Array.isArray(value.completedIds)
    ? value.completedIds
    : Array.isArray(value.completedTaskIds)
      ? value.completedTaskIds
      : progressObject
        ? Object.entries(progressObject)
            .filter(([, isDone]) => Boolean(isDone))
            .map(([id]) => id)
        : progress
            .filter(
              (item): item is Record<string, unknown> =>
                Boolean(item) && typeof item === "object",
            )
            .filter((item) => item.completed)
            .map((item) => item.taskId ?? item.itemId);

  let notes: Record<string, string> = {};
  if (value.notes && typeof value.notes === "object" && !Array.isArray(value.notes)) {
    notes = Object.fromEntries(
      Object.entries(value.notes as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } else if (Array.isArray(value.notes)) {
    notes = Object.fromEntries(
      value.notes
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object",
        )
        .filter(
          (item) =>
            typeof item.dayId === "string" && typeof item.note === "string",
        )
        .map((item) => [item.dayId as string, item.note as string]),
    );
  }

  return {
    completedIds: completed.filter(
      (id): id is string => typeof id === "string" && validItemIds.has(id),
    ),
    notes,
    settings: safeSettings(value.settings),
  };
}

function readLocalState(): Partial<StoredState> {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(LOCAL_STATE_KEY) || "{}"));
  } catch {
    return {};
  }
}

function writeLocalState(body: Record<string, unknown>) {
  try {
    const current = readLocalState();
    const completed = new Set(current.completedIds ?? []);
    const notes = { ...(current.notes ?? {}) };
    let settings = safeSettings(current.settings);
    if (body.action === "toggle" && typeof body.taskId === "string" && typeof body.completed === "boolean") {
      if (body.completed) completed.add(body.taskId);
      else completed.delete(body.taskId);
    } else if (body.action === "note" && typeof body.dayId === "string" && typeof body.note === "string") {
      if (body.note.trim()) notes[body.dayId] = body.note;
      else delete notes[body.dayId];
    } else if (body.action === "settings") {
      settings = safeSettings(body.settings);
    } else if (body.action === "import") {
      completed.clear();
      for (const id of Array.isArray(body.completedIds) ? body.completedIds : []) {
        if (typeof id === "string" && validItemIds.has(id)) completed.add(id);
      }
      Object.keys(notes).forEach((key) => delete notes[key]);
      if (body.notes && typeof body.notes === "object" && !Array.isArray(body.notes)) {
        for (const [dayId, note] of Object.entries(body.notes)) {
          if (typeof note === "string" && note.trim()) notes[dayId] = note;
        }
      }
      settings = safeSettings(body.settings);
    } else if (body.action === "reset") {
      completed.clear();
      Object.keys(notes).forEach((key) => delete notes[key]);
      settings = baseSettings;
    }
    localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify({
      completedIds: [...completed],
      notes,
      settings,
    }));
    return true;
  } catch {
    return false;
  }
}

function Highlight({ text, query }: { text: string; query: string }) {
  const clean = query.trim();
  if (!clean) return <>{text}</>;
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pieces = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {pieces.map((piece, index) =>
        piece.toLocaleLowerCase().includes(clean.toLocaleLowerCase()) ? (
          <mark key={`${piece}-${index}`}>{piece}</mark>
        ) : (
          <span key={`${piece}-${index}`}>{piece}</span>
        ),
      )}
    </>
  );
}

function sourceText(
  source: SourceDefinition,
  settings: TrackerSettings,
) {
  return settings.sourceOverrides[source.id]?.trim() || source.label;
}

function sourceHref(
  source: SourceDefinition,
  settings: TrackerSettings,
) {
  return settings.sourceLinkOverrides[source.id]?.trim() || source.href;
}

function pdfReaderHref(
  source: SourceDefinition,
  settings: TrackerSettings,
  options: { focus?: string; context?: string } = {},
) {
  const href = sourceHref(source, settings) || "";
  const driveId = googleDriveFileId(href);
  if (source.id === "proposal" || href.includes("document=expose")) {
    return exposeReaderHref(settings.pdfReaderUrl, options.focus, options.context);
  }
  if (!driveId && !isDirectPdfUrl(href)) return null;
  return buildPdfReaderHref({
    readerUrl: settings.pdfReaderUrl,
    sourceUrl: href,
    driveId: driveId ?? undefined,
    name: source.driveName || sourceText(source, settings),
    focus: options.focus,
    context: options.context,
  });
}

function googleDriveDownloadHref(href?: string) {
  const driveId = googleDriveFileId(href);
  return driveId
    ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveId)}`
    : null;
}

function ProgressRing({
  percent,
  label,
  compact = false,
}: {
  percent: number;
  label: string;
  compact?: boolean;
}) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <span
      className={`circular-progress ${compact ? "compact" : ""}`}
      style={{ "--progress": `${safePercent * 3.6}deg` } as React.CSSProperties}
      role="img"
      aria-label={`${label}: ${safePercent} Prozent`}
    >
      <span>
        <strong>{displayNumber(safePercent)}%</strong>
        {!compact && <small>{label}</small>}
      </span>
    </span>
  );
}

export default function StudyTracker({
  displayName,
  today,
}: {
  displayName: string | null;
  today: string;
}) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [systemToday, setSystemToday] = useState(today);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [settings, setSettings] =
    useState<TrackerSettings>(baseSettings);
  const [settingsDraft, setSettingsDraft] =
    useState<TrackerSettings>(baseSettings);
  const [query, setQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"plan" | "settings">("plan");
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [showProgressOverview, setShowProgressOverview] = useState(false);
  const [showJourneyOverview, setShowJourneyOverview] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resumeDate, setResumeDate] = useState(today);
  const [requestedStartDate, setRequestedStartDate] = useState(today);
  const [routeChangeReason, setRouteChangeReason] = useState("");
  const [attachments, setAttachments] = useState<Record<string, AttachmentMeta[]>>({});
  const [exposeMeta, setExposeMeta] = useState<ExposeMeta>({
    name: "Cross_Repository_Code_Intelligence_Expose_DE_2026_v2_4.pdf",
    size: 0,
    updatedAt: null,
    custom: false,
  });
  const [exposeUploading, setExposeUploading] = useState(false);
  const [uploadingDayId, setUploadingDayId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentMeta | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<
    "loading" | "saved" | "saving" | "error"
  >("loading");
  const [toast, setToast] = useState("");
  const [expandedIntegration, setExpandedIntegration] = useState(false);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [focusActive, setFocusActive] = useState<FocusSession | null>(null);
  const [focusOpen, setFocusOpen] = useState(false);
  const [focusTargetDayId, setFocusTargetDayId] = useState(allDays[0]?.id ?? "");
  const [focusBusy, setFocusBusy] = useState(false);
  const [focusNow, setFocusNow] = useState(() => Date.now());
  const [focusStoredSeconds, setFocusStoredSeconds] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [appInstalled, setAppInstalled] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const exposeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refreshSystemDate = () => setSystemToday(systemLocalIsoDate());
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshSystemDate();
    };

    refreshSystemDate();
    const timer = window.setInterval(refreshSystemDate, 60_000);
    window.addEventListener("focus", refreshSystemDate);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshSystemDate);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const navigatorStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const refresh = () => setAppInstalled(standalone.matches || navigatorStandalone);
    const installed = () => {
      setAppInstalled(true);
      setInstallPrompt(null);
    };
    refresh();
    standalone.addEventListener("change", refresh);
    window.addEventListener("appinstalled", installed);
    return () => {
      standalone.removeEventListener("change", refresh);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);

  useEffect(() => {
    const syncHashView = () => {
      if (window.location.hash === "#plan") {
        setActiveView("plan");
        setShowFullPlan(true);
        window.requestAnimationFrame(() => {
          document.getElementById("plan")?.scrollIntoView({ block: "start" });
        });
      } else if (["", "#rhythm", "#start-dashboard"].includes(window.location.hash)) {
        setShowFullPlan(false);
        if (window.location.hash === "#rhythm") {
          setShowProgressOverview(true);
          window.requestAnimationFrame(() => {
            document.getElementById("rhythm")?.scrollIntoView({ block: "start" });
          });
        }
      }
    };
    syncHashView();
    window.addEventListener("hashchange", syncHashView);
    return () => window.removeEventListener("hashchange", syncHashView);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const statePromise: Promise<Partial<StoredState>> = DEVICE_ONLY_STORAGE
          ? Promise.resolve(readLocalState())
          : fetch("/api/state", { cache: "no-store" })
              .then(async (response) => {
                if (!response.ok) throw new Error("state-load-failed");
                return normalizeState(await response.json());
              })
              .catch(() => readLocalState());

        const centralSettingsPromise = DEVICE_ONLY_STORAGE
          ? Promise.resolve(null)
          : fetch("/api/settings", { cache: "no-store" })
              .then(async (response) => response.ok ? response.json() as Promise<{
                settings?: { planning?: {
                  projectName?: string;
                  planName?: string;
                  planStartDate?: string;
                  planEndDate?: string;
                  planStatus?: "not_started" | "running" | "paused";
                  planPausedAt?: string;
                  dailyWorkMode?: DailyWorkMode;
                  workdayStart?: string;
                } };
              }> : null)
              .then((payload) => payload?.settings?.planning ?? null)
              .catch(() => null);

        const attachmentsPromise = DEVICE_ONLY_STORAGE
          ? Promise.resolve<AttachmentMeta[]>([])
          : fetch("/api/attachments", { cache: "no-store" })
              .then(async (response) => response.ok
                ? ((await response.json()) as { attachments?: AttachmentMeta[] }).attachments ?? []
                : [])
              .catch(() => [] as AttachmentMeta[]);

        const exposePromise = fetch("/api/expose?meta=1", { cache: "no-store" })
          .then(async (response) => response.ok
            ? ((await response.json()) as { expose?: ExposeMeta }).expose ?? null
            : null)
          .catch(() => null);

        const [state, planning, attachmentList, expose] = await Promise.all([
          statePromise,
          centralSettingsPromise,
          attachmentsPromise,
          exposePromise,
        ]);
        if (!active) return;
        setCompleted(new Set(state.completedIds ?? []));
        setNotes(state.notes ?? {});
        let nextSettings = safeSettings(state.settings);
        if (planning) {
          nextSettings = safeSettings({
            ...nextSettings,
            projectName: planning.projectName || nextSettings.projectName,
            planName: planning.planName || nextSettings.planName,
            planStartDate: planning.planStartDate || nextSettings.planStartDate,
            planEndDate: planning.planEndDate || nextSettings.planEndDate,
            planStatus: planning.planStatus === "paused" || planning.planStatus === "running"
              ? planning.planStatus
              : nextSettings.planStatus,
            planPausedAt: planning.planPausedAt || nextSettings.planPausedAt,
            dailyWorkMode: normalizeDailyWorkMode(planning.dailyWorkMode ?? nextSettings.dailyWorkMode),
            dailyStart: planning.workdayStart || nextSettings.dailyStart,
          });
        }
        setSettings(nextSettings);
        setSettingsDraft(nextSettings);
        setSyncState("saved");

        if (!DEVICE_ONLY_STORAGE && attachmentList.length) {
          const grouped: Record<string, AttachmentMeta[]> = {};
          for (const attachment of attachmentList) {
            (grouped[attachment.dayId] ??= []).push(attachment);
          }
          setAttachments(grouped);
        }
        if (expose) setExposeMeta(expose);
      } catch {
        if (active) setSyncState("error");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (DEVICE_ONLY_STORAGE) {
      const sessions = readLocalFocusSessions();
      queueMicrotask(() => {
        if (!active) return;
        setFocusActive(sessions.find((session) => session.status !== "completed") ?? null);
        setFocusSessions(sessions);
        setFocusStoredSeconds(sessions
          .filter((session) => session.status === "completed")
          .reduce((sum, session) => sum + session.accumulatedSeconds, 0));
      });
      return () => { active = false; };
    }
    void fetch("/api/focus", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("focus-load-failed");
        return response.json() as Promise<{
          active?: FocusSession | null;
          sessions?: FocusSession[];
          storedSeconds?: number;
        }>;
      })
      .then((payload) => {
        if (!active) return;
        setFocusActive(payload.active ?? null);
        setFocusSessions(payload.sessions ?? []);
        setFocusStoredSeconds(Number(payload.storedSeconds ?? 0));
      })
      .catch(() => {
        if (active) setToast("Fokuszeiten konnten noch nicht geladen werden.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (focusActive?.status !== "running") return;
    const interval = window.setInterval(() => setFocusNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [focusActive?.status]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function installUnifiedApp() {
    if (appInstalled) {
      setToast("Die vollständige App ist bereits installiert.");
      return;
    }
    if (!installPrompt) {
      setToast("Wähle im Browser-Menü „App installieren“, um alle drei Bereiche gemeinsam zu installieren.");
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
      setAppInstalled(true);
      setToast("Study Tracker, PDF Visual und Einstellungen wurden gemeinsam installiert.");
    }
  }

  async function postState(body: Record<string, unknown>) {
    setSyncState("saving");
    if (DEVICE_ONLY_STORAGE) {
      const savedLocally = writeLocalState(body);
      setSyncState(savedLocally ? "saved" : "error");
      return savedLocally;
    }
    try {
      const response = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("state-save-failed");
      writeLocalState(body);
      setSyncState("saved");
      return true;
    } catch {
      const savedLocally = writeLocalState(body);
      setSyncState(savedLocally ? "saved" : "error");
      return savedLocally;
    }
  }

  function itemCount(day: PlannedDay) {
    return countCompletedItems(day, completed);
  }

  function dayStatus(day: PlannedDay): StatusFilter {
    const count = itemCount(day);
    if (count === 0) return "open";
    if (count === 9) return "done";
    return "started";
  }

  const phaseGroups = useMemo<PhaseGroup[]>(() => {
    const map = new Map<string, PhaseGroup>();
    for (const week of planWeeks) {
      const existing = map.get(week.phaseId);
      if (existing) existing.weeks.push(week);
      else
        map.set(week.phaseId, {
          id: week.phaseId,
          title: week.phase,
          weeks: [week],
        });
    }
    return [...map.values()];
  }, []);

  const filteredGroups = useMemo(() => {
    return phaseGroups
      .filter((phase) => phaseFilter === "all" || phase.id === phaseFilter)
      .map((phase) => ({
        ...phase,
        weeks: phase.weeks
          .map((week) => ({
            ...week,
            days: week.days.filter(
              (day) =>
                statusFilter === "all" || dayStatus(day) === statusFilter,
            ),
          }))
          .filter((week) => week.days.length > 0),
      }))
      .filter((phase) => phase.weeks.length > 0);
    // dayStatus intentionally depends on the current completion snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseGroups, phaseFilter, statusFilter, completed]);

  const searchResults = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return [];
    return allDays
      .filter((day) => {
        const haystack = [
          day.title,
          day.phase,
          day.weekTitle,
          day.why,
          day.module,
          day.deliverable,
          ...day.lookFor,
          ...day.proposal,
          ...day.sourceIds.flatMap((id) => {
            const source = sources[id];
            return source
              ? [sourceText(source, settings), source.driveName ?? ""]
              : [];
          }),
        ]
          .join(" ")
          .toLocaleLowerCase();
        return haystack.includes(needle);
      })
      .slice(0, 12);
  }, [query, settings]);

  const completedItems = completed.size;
  const completedDays = allDays.filter((day) => itemCount(day) === 9).length;
  const estimatedHours = estimatedLearningHours(completedItems);
  const nextDay = allDays.find((day) => itemCount(day) < 9) ?? allDays.at(-1)!;
  const systemTodayDay = allDays.find(
    (day) => shiftedPlanDate(day.date, settings.planStartDate) === systemToday,
  );
  const planCanRecordToday = settings.planStatus === "running" && Boolean(systemTodayDay);
  const todayCourseSession = nlpCourseSessions.find(
    (session) => session.date === systemToday,
  );
  const dashboardDay = systemTodayDay ?? nextDay;
  const activeFocusSeconds = focusActive ? focusSeconds(focusActive, focusNow) : 0;
  const measuredFocusSeconds = focusStoredSeconds + (
    focusActive?.status === "running" && focusActive.lastStartedAt
      ? Math.max(0, Math.floor((focusNow - new Date(focusActive.lastStartedAt).getTime()) / 1000))
      : 0
  );
  const designMilestoneDate = shiftedPlanDate(
    planMeta.designEnd,
    settings.planStartDate,
  );
  const milestoneDaysRemaining = Math.max(
    0,
    daysBetweenIsoDates(systemToday, designMilestoneDate),
  );
  const firstName = displayName?.trim().split(/\s+/)[0] || "Forscherin";
  const dashboardDayWeekNumber = Math.max(
    1,
    planWeeks.findIndex((week) => week.days.some((day) => day.id === dashboardDay.id)) + 1,
  );
  const displayedProjectName = settings.projectName
    .replace(/^Cross_Repository/i, "Cross-Repository")
    .replaceAll("_", " ");
  const completedTaskGroups = dashboardDay.tasks.filter((task) =>
    task.items.every((item) => completed.has(item.id)),
  ).length;
  const currentTodayTask = dashboardDay.tasks.find((task) =>
    task.items.some((item) => !completed.has(item.id)),
  ) ?? dashboardDay.tasks[dashboardDay.tasks.length - 1];
  const currentTodayTaskIndex = Math.max(
    0,
    dashboardDay.tasks.findIndex((task) => task.id === currentTodayTask?.id),
  );
  const activeDailyWorkMode = DAILY_WORK_MODES[settings.dailyWorkMode];
  const designDays = allDays.filter((day) => day.phaseId.startsWith("design-"));
  const designCompletedItems = designDays.reduce(
    (sum, day) => sum + itemCount(day),
    0,
  );
  const designPercent = Math.round(
    (designCompletedItems / Math.max(1, designDays.length * 9)) * 100,
  );
  const nextWeekIndex = Math.max(
    0,
    planWeeks.findIndex((week) => week.days.some((day) => day.id === nextDay.id)),
  );
  const rhythmStart = Math.max(0, Math.min(nextWeekIndex, planWeeks.length - 5));
  const rhythmWeeks = planWeeks.slice(rhythmStart, rhythmStart + 5);
  const rhythmTotalItems = rhythmWeeks.reduce((sum, week) => sum + week.days.length * 9, 0);
  const rhythmCompletedItems = rhythmWeeks.reduce(
    (sum, week) => sum + week.days.reduce((daySum, day) => daySum + itemCount(day), 0),
    0,
  );
  const rhythmActiveDays = rhythmWeeks.reduce(
    (sum, week) => sum + week.days.filter((day) => itemCount(day) > 0).length,
    0,
  );
  const rhythmPercent = rhythmTotalItems ? Math.round((rhythmCompletedItems / rhythmTotalItems) * 100) : 0;
  const journeyStages = [
    { number: 1, title: "Design", weeks: "Woche 1–6", start: 1, end: 6 },
    { number: 2, title: "Extraktion", weeks: "Woche 7–12", start: 7, end: 12 },
    { number: 3, title: "Graph & Retrieval", weeks: "Woche 13–16", start: 13, end: 16 },
    { number: 4, title: "Evaluation", weeks: "Woche 17–20", start: 17, end: 20 },
    { number: 5, title: "Abgabe", weeks: "Woche 21–25", start: 21, end: 25 },
  ];

  function upsertFocusSession(session: FocusSession) {
    const previous = focusSessions.find((item) => item.id === session.id);
    if (previous && session.accumulatedSeconds !== previous.accumulatedSeconds) {
      setFocusStoredSeconds((current) => current + session.accumulatedSeconds - previous.accumulatedSeconds);
    }
    setFocusSessions((current) => [
      session,
      ...current.filter((item) => item.id !== session.id),
    ].slice(0, 30));
    setFocusActive(session.status === "completed" ? null : session);
  }

  async function focusAction(
    action: "start" | "pause" | "resume" | "finish",
    targetDayId?: string,
  ) {
    if (action === "start" && settings.planStatus !== "running") {
      setToast("Starte oder setze den Lernplan zuerst fort. Vorher wird keine Fokuszeit gespeichert.");
      return;
    }
    setFocusBusy(true);
    try {
      const selectedDay = allDays.find((day) => day.id === (targetDayId || focusTargetDayId)) ?? nextDay;
      const body =
        action === "start"
          ? {
              action,
              contextId: selectedDay.id,
              contextTitle: selectedDay.title,
            }
          : { action, id: focusActive?.id };
      if (DEVICE_ONLY_STORAGE) {
        const now = new Date();
        const timestamp = now.toISOString();
        const storedSessions = readLocalFocusSessions();
        let session: FocusSession;
        if (action === "start") {
          session = {
            id: `local-focus-${crypto.randomUUID()}`,
            contextId: selectedDay.id,
            contextTitle: selectedDay.title,
            source: "tracker",
            status: "running",
            accumulatedSeconds: 0,
            startedAt: timestamp,
            lastStartedAt: timestamp,
            endedAt: null,
          };
        } else {
          const current = storedSessions.find((item) => item.id === focusActive?.id) ?? focusActive;
          if (!current) throw new Error("Keine aktive Fokuszeit gefunden.");
          const timing = transitionTimedSession(current, action, current.accumulatedSeconds, now);
          session = {
            ...current,
            status: timing.status,
            accumulatedSeconds: timing.storedSeconds,
            lastStartedAt: timing.lastStartedAt,
            endedAt: timing.endedAt,
          };
        }
        const nextSessions = [session, ...storedSessions.filter((item) => item.id !== session.id)].slice(0, 30);
        if (!writeLocalFocusSessions(nextSessions)) throw new Error("Die Fokuszeit konnte auf diesem Gerät nicht gespeichert werden.");
        upsertFocusSession(session);
        setFocusNow(now.getTime());
        setToast(
          action === "start"
            ? "Fokuszeit gestartet."
            : action === "pause"
              ? "Fokuszeit pausiert."
              : action === "resume"
                ? "Fokuszeit wird fortgesetzt."
                : "Fokussitzung auf diesem Gerät gespeichert.",
        );
        return;
      }
      const response = await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(await responseError(response, "Die Fokuszeit konnte nicht gespeichert werden."));
      }
      const payload = (await response.json()) as { session?: FocusSession };
      if (!payload.session) throw new Error("Die Fokuszeit wurde nicht zurückgegeben.");
      upsertFocusSession(payload.session);
      setToast(
        action === "start"
          ? "Fokuszeit gestartet."
          : action === "pause"
            ? "Fokuszeit pausiert."
            : action === "resume"
              ? "Fokuszeit wird fortgesetzt."
              : "Fokussitzung abgeschlossen und gespeichert.",
      );
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Die Fokuszeit konnte nicht gespeichert werden.");
    } finally {
      setFocusBusy(false);
    }
  }

  const weekProgress = useMemo(
    () =>
      planWeeks.map((week) => {
        const total = week.days.length * 9;
        const done = week.days.reduce((sum, day) => sum + itemCount(day), 0);
        return {
          number: week.number,
          title: week.title,
          percent: total ? Math.round((done / total) * 100) : 0,
        };
      }),
    // itemCount intentionally depends on current completion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [completed],
  );

  async function toggleItem(itemId: string, checked: boolean, day: PlannedDay) {
    const next = new Set(completed);
    if (checked) next.add(itemId);
    else next.delete(itemId);
    setCompleted(next);
    if (checked) {
      const dayDone = day.tasks.every((task) =>
        task.items.every((item) => next.has(item.id)),
      );
      setToast(
        dayDone
          ? "Tag abgeschlossen – du hast ein echtes Ergebnis erstellt. Stark!"
          : "Gut gemacht – ein weiterer Schritt ist erledigt.",
      );
    }
    await postState({
      action: "toggle",
      itemId,
      taskId: itemId,
      completed: checked,
    });
  }

  async function toggleTaskGroup(
    day: PlannedDay,
    task: PlannedDay["tasks"][number],
    checked: boolean,
  ) {
    const next = new Set(completed);
    for (const item of task.items) {
      if (checked) next.add(item.id);
      else next.delete(item.id);
    }
    setCompleted(next);
    const ok = await postState({
      action: "import",
      completedIds: [...next],
      notes,
      settings,
    });
    setToast(
      ok
        ? checked
          ? "Große Aufgabe mit allen drei Schritten abgeschlossen."
          : "Aufgabe wieder geöffnet."
        : "Die Änderung konnte noch nicht dauerhaft gespeichert werden.",
    );
  }

  async function saveNote(dayId: string) {
    const ok = await postState({
      action: "note",
      dayId,
      note: notes[dayId] ?? "",
    });
    if (ok) setToast("Tagesnotiz gespeichert.");
  }

  async function responseError(response: Response, fallback: string) {
    try {
      const payload = (await response.json()) as { error?: string };
      return payload.error || fallback;
    } catch {
      return fallback;
    }
  }

  async function uploadDayFiles(dayId: string, selectedFiles: File[]) {
    const files = selectedFiles.slice(0, 10);
    if (!files.length) return;
    const oversized = files.find((file) => file.size > 25 * 1024 * 1024);
    if (oversized) {
      setToast(`„${oversized.name}“ ist größer als 25 MB.`);
      return;
    }

    setUploadingDayId(dayId);
    let uploadedCount = 0;
    let lastError = "";
    try {
      for (const file of files) {
        const form = new FormData();
        form.set("dayId", dayId);
        form.set("file", file);
        const response = await fetch("/api/attachments", {
          method: "POST",
          body: form,
        });
        if (!response.ok) {
          lastError = await responseError(
            response,
            `„${file.name}“ konnte nicht hochgeladen werden.`,
          );
          continue;
        }
        const payload = (await response.json()) as {
          attachment?: AttachmentMeta;
        };
        if (!payload.attachment) continue;
        uploadedCount += 1;
        setAttachments((current) => ({
          ...current,
          [dayId]: [payload.attachment!, ...(current[dayId] ?? [])],
        }));
      }
    } catch {
      lastError = "Die Verbindung zum Dateispeicher wurde unterbrochen.";
    } finally {
      setUploadingDayId(null);
    }

    if (uploadedCount > 0) {
      setToast(
        `${displayNumber(uploadedCount)} Datei(en) dauerhaft gespeichert.${lastError ? ` ${lastError}` : ""}`,
      );
    } else {
      setToast(lastError || "Es wurde keine Datei gespeichert.");
    }
  }

  function closeAttachmentPreview() {
    setPreviewAttachment(null);
    setPreviewText("");
    setPreviewLoading(false);
    setPreviewUrl("");
  }

  async function openAttachment(attachment: AttachmentMeta) {
    closeAttachmentPreview();
    setPreviewAttachment(attachment);
    const kind = attachmentKind(attachment);
    if (kind === "other") return;
    if (kind === "text" && attachment.size > 3 * 1024 * 1024) {
      setToast("Große Textdateien werden aus Sicherheitsgründen heruntergeladen.");
      return;
    }
    if (kind === "office" && attachment.size > 8 * 1024 * 1024) {
      setToast("Große Office-Dateien werden aus Sicherheitsgründen heruntergeladen.");
      return;
    }

    setPreviewLoading(true);
    try {
      const response = await fetch(
        `/api/attachments?id=${encodeURIComponent(attachment.id)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error(
          await responseError(response, "Die Datei konnte nicht geöffnet werden."),
        );
      }
      if (kind === "text") {
        setPreviewText(await response.text());
      } else if (kind === "office") {
        setPreviewText(await extractOfficeText(await response.blob(), attachment.name));
      } else {
        setPreviewUrl(URL.createObjectURL(await response.blob()));
      }
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Die Datei konnte nicht geöffnet werden.",
      );
      setPreviewAttachment(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function deleteAttachment(attachment: AttachmentMeta) {
    const confirmed = window.confirm(
      `„${attachment.name}“ wirklich dauerhaft löschen?`,
    );
    if (!confirmed) return;
    const response = await fetch(
      `/api/attachments?id=${encodeURIComponent(attachment.id)}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      setToast(
        await responseError(response, "Die Datei konnte nicht gelöscht werden."),
      );
      return;
    }
    setAttachments((current) => ({
      ...current,
      [attachment.dayId]: (current[attachment.dayId] ?? []).filter(
        (item) => item.id !== attachment.id,
      ),
    }));
    if (previewAttachment?.id === attachment.id) closeAttachmentPreview();
    setToast("Datei gelöscht.");
  }

  async function uploadExpose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setToast("Bitte wähle eine PDF-Datei für das Exposé aus.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setToast("Die Exposé-PDF darf höchstens 50 MB groß sein.");
      return;
    }
    setExposeUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/expose", { method: "POST", body: form });
      const payload = (await response.json().catch(() => ({}))) as { expose?: ExposeMeta; message?: string };
      if (!response.ok || !payload.expose) throw new Error(payload.message || "Das Exposé konnte nicht gespeichert werden.");
      setExposeMeta(payload.expose);
      setToast("Die neue Exposé-Version wurde lokal gespeichert.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Das Exposé konnte nicht gespeichert werden.");
    } finally {
      setExposeUploading(false);
    }
  }

  async function restoreBundledExpose() {
    if (!window.confirm("Die eigene Exposé-Version entfernen und wieder die mitgelieferte Version verwenden?")) return;
    try {
      const response = await fetch("/api/expose", { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { expose?: ExposeMeta; message?: string };
      if (!response.ok || !payload.expose) throw new Error(payload.message || "Die Standardversion konnte nicht wiederhergestellt werden.");
      setExposeMeta(payload.expose);
      setToast("Die mitgelieferte Exposé-Version ist wieder aktiv.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Die Standardversion konnte nicht wiederhergestellt werden.");
    }
  }

  async function saveSettings() {
    if (!settingsDraft.planName.trim()) {
      setToast("Bitte gib einen Namen für den Lernplan ein.");
      return;
    }
    if (
      !settingsDraft.planStartDate ||
      !settingsDraft.planEndDate ||
      settingsDraft.planEndDate < settingsDraft.planStartDate
    ) {
      setToast("Das Enddatum muss am oder nach dem Startdatum liegen.");
      return;
    }
    setSettings(settingsDraft);
    const ok = await postState({
      action: "settings",
      settings: settingsDraft,
    });
    const centralSaved = await saveCentralPlanning(settingsDraft);
    if (ok) {
      setSettingsOpen(false);
      setToast(
        DEVICE_ONLY_STORAGE
          ? "Lernplan und Einstellungen wurden auf diesem Gerät gespeichert."
          : centralSaved
          ? "Lernplan und zentrale Einstellungen wurden gemeinsam gespeichert."
          : "Lernplan gespeichert; die zentrale Einstellung wird beim nächsten Versuch abgeglichen.",
      );
    }
  }

  async function saveCentralPlanning(nextSettings: TrackerSettings) {
    if (DEVICE_ONLY_STORAGE) return true;
    try {
      const current = await fetch("/api/settings", { cache: "no-store" });
      if (!current.ok) return false;
      const payload = (await current.json()) as { settings?: Record<string, unknown> & { planning?: Record<string, unknown> } };
      const centralSettings = payload.settings;
      if (!centralSettings) return false;
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...centralSettings,
            planning: {
              ...(centralSettings.planning ?? {}),
              projectName: nextSettings.projectName,
              planName: nextSettings.planName,
              planStartDate: nextSettings.planStartDate,
              planEndDate: nextSettings.planEndDate,
              planStatus: nextSettings.planStatus,
              planPausedAt: nextSettings.planPausedAt,
              dailyWorkMode: nextSettings.dailyWorkMode,
              totalPlanWeeks: planMeta.totalWeeks,
              workdayStart: nextSettings.dailyStart,
            },
          },
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async function setDailyWorkMode(mode: DailyWorkMode) {
    const nextSettings = safeSettings({ ...settings, dailyWorkMode: mode });
    setSettings(nextSettings);
    setSettingsDraft(nextSettings);
    const [stateSaved, centralSaved] = await Promise.all([
      postState({ action: "settings", settings: nextSettings }),
      saveCentralPlanning(nextSettings),
    ]);
    setToast(stateSaved && centralSaved
      ? `${DAILY_WORK_MODES[mode].label} ist jetzt dein Arbeitsmodus.`
      : "Der Arbeitsmodus konnte nicht vollständig gespeichert werden.");
  }

  async function pausePlan() {
    if (settings.planStatus !== "running") return;
    const nextSettings = safeSettings({
      ...settings,
      planStatus: "paused",
      planPausedAt: systemToday,
      planRevisionHistory: addPlanRevision(settings, {
        action: "paused",
        reason: "Plan wurde vorübergehend pausiert.",
        nextStartDate: settings.planStartDate,
        nextEndDate: settings.planEndDate,
      }),
    });
    setSettings(nextSettings);
    setSettingsDraft(nextSettings);
    setResumeDate(systemToday);
    const [ok, centralSaved] = await Promise.all([postState({ action: "settings", settings: nextSettings }), saveCentralPlanning(nextSettings)]);
    setToast(ok && centralSaved
      ? `Lernplan seit ${formatDate(systemToday)} pausiert. Fortschritt und Dateien bleiben erhalten.`
      : "Die Pause konnte nicht gespeichert werden.");
  }

  async function startPlan() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedStartDate)) {
      setToast("Bitte wähle ein gültiges Startdatum.");
      return;
    }
    const isRouteChange = settings.planStatus === "running";
    const reason = routeChangeReason.trim();
    if (isRouteChange && !reason) {
      setToast("Bitte dokumentiere kurz, warum der Projektweg geändert wird.");
      return;
    }
    if (isRouteChange && !window.confirm(
      "Den Zeitplan wirklich neu berechnen? Erledigte Aufgaben, Notizen und Dateien bleiben erhalten.",
    )) return;
    const nextEndDate = suggestedPlanEnd(requestedStartDate);
    const nextSettings = safeSettings({
      ...settings,
      planStartDate: requestedStartDate,
      planEndDate: nextEndDate,
      planStatus: "running",
      planPausedAt: "",
      planRevisionHistory: addPlanRevision(settings, {
        action: isRouteChange ? "route_changed" : "started",
        reason: isRouteChange ? reason : "Lernplan wurde gestartet.",
        nextStartDate: requestedStartDate,
        nextEndDate,
      }),
    });
    setSettings(nextSettings);
    setSettingsDraft(nextSettings);
    setRouteChangeReason("");
    const [ok, centralSaved] = await Promise.all([postState({ action: "settings", settings: nextSettings }), saveCentralPlanning(nextSettings)]);
    setToast(ok && centralSaved
      ? isRouteChange
        ? `Projektweg ab ${formatDate(requestedStartDate)} neu geplant. Erledigte Arbeit blieb erhalten.`
        : `Plan am ${formatDate(requestedStartDate)} gestartet. Das Enddatum und alle Plantage wurden neu berechnet.`
      : "Der Planstart konnte nicht gespeichert werden.");
  }

  async function resumePlan() {
    if (settings.planStatus !== "paused" || !settings.planPausedAt) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(resumeDate) || resumeDate < settings.planPausedAt) {
      setToast("Das Fortsetzungsdatum darf nicht vor dem Pausendatum liegen.");
      return;
    }
    const recalculated = rescheduleAfterPause({
      planStartDate: settings.planStartDate,
      pausedAt: settings.planPausedAt,
      resumeDate,
      calculateEnd: suggestedPlanEnd,
    });
    const nextSettings = safeSettings({
      ...settings,
      planStartDate: recalculated.planStartDate,
      planEndDate: recalculated.planEndDate,
      planStatus: "running",
      planPausedAt: "",
      planRevisionHistory: addPlanRevision(settings, {
        action: "resumed",
        reason: `Nach ${recalculated.pauseDays} Pausentagen fortgesetzt.`,
        nextStartDate: recalculated.planStartDate,
        nextEndDate: recalculated.planEndDate,
      }),
    });
    setSettings(nextSettings);
    setSettingsDraft(nextSettings);
    const [ok, centralSaved] = await Promise.all([postState({ action: "settings", settings: nextSettings }), saveCentralPlanning(nextSettings)]);
    setToast(ok && centralSaved
      ? `Plan fortgesetzt. Alle Termine wurden um ${displayNumber(recalculated.pauseDays)} Tage neu berechnet; erledigte Arbeit blieb erhalten.`
      : "Der neue Zeitplan konnte nicht gespeichert werden.");
  }

  function revealDay(day: PlannedDay, searchQuery = query) {
    setActiveView("plan");
    setShowFullPlan(true);
    if (phaseFilter !== "all" && phaseFilter !== day.phaseId) {
      setPhaseFilter(day.phaseId);
    }
    setStatusFilter("all");
    setActiveDayId(day.id);
    if (searchQuery && !query) setQuery(searchQuery);
    window.setTimeout(() => {
      const element = document.getElementById(`day-${day.id}`);
      if (!element) return;
      if (element instanceof HTMLDetailsElement) element.open = true;
      let parent = element.parentElement;
      while (parent) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const headerOffset = 92;
          const top = Math.max(0, window.scrollY + element.getBoundingClientRect().top - headerOffset);
          window.scrollTo({ top, behavior: "smooth" });
          element.focus({ preventScroll: true });
        });
      });
    }, 140);
  }

  function openFullPlan(focusSearch = false) {
    setActiveView("plan");
    setShowFullPlan(true);
    window.setTimeout(() => {
      document.getElementById("plan")?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (focusSearch) document.getElementById("plan-search")?.focus();
    }, 80);
  }

  function openToday() {
    const currentDate = systemLocalIsoDate();
    const currentPlanDay = allDays.find(
      (day) => shiftedPlanDate(day.date, settings.planStartDate) === currentDate,
    );
    setSystemToday(currentDate);

    if (currentPlanDay) {
      setFocusTargetDayId(currentPlanDay.id);
      setToast(`Systemdatum erkannt: ${formatDate(currentDate)}. Der zugehörige Plantag wird geöffnet.`);
      window.history.replaceState(null, "", `#day-${currentPlanDay.id}`);
      revealDay(currentPlanDay, "");
      return;
    }

    setActiveView("plan");
    setShowFullPlan(false);
    setActiveDayId(null);
    window.history.replaceState(null, "", "#start-dashboard");
    setToast(`Systemdatum erkannt: ${formatDate(currentDate)}. Für heute ist kein Lernplan-Eintrag geplant.`);
    window.setTimeout(() => {
      document.getElementById("start-dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  }

  function exportJson() {
    downloadText(
      `${settings.projectName || "study-plan"}-progress.json`,
      JSON.stringify(
        {
          schema: "cross-repository-study-tracker.v1",
          exportedAt: new Date().toISOString(),
          completedIds: [...completed],
          notes,
          settings,
        },
        null,
        2,
      ),
      "application/json",
    );
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const normalized = normalizeState(parsed);
      const nextCompleted = new Set(normalized.completedIds ?? []);
      const nextNotes = normalized.notes ?? {};
      const nextSettings = safeSettings(normalized.settings);
      setCompleted(nextCompleted);
      setNotes(nextNotes);
      setSettings(nextSettings);
      setSettingsDraft(nextSettings);
      const ok = await postState({
        action: "import",
        completedIds: [...nextCompleted],
        notes: nextNotes,
        settings: nextSettings,
      });
      setToast(
        ok
          ? "Fortschrittsdatei geprüft und importiert."
          : "Datei gelesen, aber nicht auf dem Server gespeichert.",
      );
    } catch {
      setToast("Diese Datei ist keine gültige JSON-Datei des Lernplans.");
    }
  }

  function exportIcs(remainingOnly = false) {
    const visibleDays = remainingOnly
      ? allDays.filter((day) => itemCount(day) < 9)
      : allDays;
    const days = visibleDays.filter(
      (day) =>
        !settings.planEndDate ||
        shiftedPlanDate(day.date, settings.planStartDate) <= settings.planEndDate,
    );
    const [hours, minutes] = settings.dailyStart
      .split(":")
      .map((value) => Number(value));
    const startMinutes = (Number.isFinite(hours) ? hours : 9) * 60 +
      (Number.isFinite(minutes) ? minutes : 0);
    const planEvents = days
      .map((day) => {
        const effectiveDate = shiftedPlanDate(day.date, settings.planStartDate);
        const start = localIcsDate(effectiveDate, startMinutes);
        const end = localIcsDate(effectiveDate, startMinutes + 240);
        return [
          "BEGIN:VEVENT",
          `UID:${day.id}-${settings.projectName.replace(/\s+/g, "-")}@study-tracker`,
          `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
          `DTSTART;TZID=Europe/Berlin:${start}`,
          `DTEND;TZID=Europe/Berlin:${end}`,
          `SUMMARY:${escapeIcs(`${settings.planName || settings.projectName} — ${day.title}`)}`,
          `DESCRIPTION:${escapeIcs(`Ergebnis: ${day.deliverable}\nModul: ${day.module}`)}`,
          "END:VEVENT",
        ].join("\r\n");
      })
      .join("\r\n");
    const courseEvents = nlpCourseSessions
      .map((session) => {
        const start = localIcsDate(session.date, 17 * 60 + 30);
        const end = localIcsDate(session.date, 19 * 60 + 10);
        return [
          "BEGIN:VEVENT",
          `UID:nlp-live-${session.number}-2026@study-tracker`,
          `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
          `DTSTART;TZID=Europe/Berlin:${start}`,
          `DTEND;TZID=Europe/Berlin:${end}`,
          `SUMMARY:${escapeIcs(`NLP Live ${session.number}/10 — ${session.title}`)}`,
          `DESCRIPTION:${escapeIcs(`Projektfrage: ${session.projectQuestion}\nUse Case: ${session.useCase}\nErgebnisse: ${session.deliverables.join(", ")}`)}`,
          "END:VEVENT",
        ].join("\r\n");
      })
      .join("\r\n");
    const events = [planEvents, courseEvents].filter(Boolean).join("\r\n");
    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Cross Repository Study Tracker//FA",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      events,
      "END:VCALENDAR",
    ].join("\r\n");
    downloadText(
      `${settings.projectName || "study-plan"}.ics`,
      calendar,
      "text/calendar;charset=utf-8",
    );
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#start-dashboard">
        Zum Tagesdashboard springen
      </a>

      <header className="topbar">
        <a
          className="brand"
          href="#start-dashboard"
          aria-label="Startseite des Lernplans"
          onClick={() => { setActiveView("plan"); setShowFullPlan(false); }}
        >
          <span className="brand-mark" aria-hidden="true">
            CR
          </span>
          <span>
            <strong>{displayedProjectName}</strong>
          </span>
        </a>
        <nav className="top-actions dashboard-top-actions" aria-label="Schnellaktionen">
          <button
            className="top-icon-button"
            type="button"
            aria-label="Lernplan durchsuchen"
            onClick={() => {
              openFullPlan(true);
            }}
          >
            <Icon name="search" size={22} />
          </button>
          <button
            className={`top-icon-button sync-icon ${syncState}`}
            type="button"
            aria-label={`Speicherstatus: ${syncState === "saved" ? "gespeichert" : syncState === "saving" ? "wird gespeichert" : syncState === "loading" ? "wird geladen" : "Fehler"}`}
            title={syncState === "error" ? "Speicherverbindung nicht verfügbar" : "Speicherstatus"}
            onClick={() => setToast(syncState === "saved" ? "Alle Änderungen sind sicher gespeichert." : "Der Speicherstatus wird geprüft.")}
          >
            <Icon name="bell" size={21} />
            <i aria-hidden="true" />
          </button>
          <button
            className="top-icon-button"
            type="button"
            onClick={() => void installUnifiedApp()}
            title="Lernplan, PDF Visual und Einstellungen gemeinsam installieren"
            aria-label={appInstalled ? "App ist installiert" : installPrompt ? "Gesamte App installieren" : "Installationshinweis öffnen"}
          >
            <Icon name="download" size={21} />
          </button>
          <span className="top-avatar" title={displayName || "Persönlicher Lernpfad"}>
            {displayName?.trim().slice(0, 1) || "F"}
          </span>
        </nav>
      </header>

      <div className="workspace">
        <aside className="sidebar" aria-label="Hauptnavigation">
          <nav className="side-nav">
            <a
              href="#start-dashboard"
              className={activeView === "plan" ? "active" : ""}
              onClick={(event) => {
                event.preventDefault();
                openToday();
              }}
            >
              <Icon name="home" /> Heute
            </a>
            <a href="#plan" onClick={(event) => { event.preventDefault(); openFullPlan(); }}>
              <Icon name="calendar" /> Lernplan
            </a>
            <button type="button" onClick={() => exportIcs(false)}>
              <Icon name="calendar" /> Kalender
            </button>
            <a href={settings.pdfReaderUrl} {...internalLinkProps(settings.pdfReaderUrl)}>
              <Icon name="book" /> Bibliothek
            </a>
            <a href="#rhythm" onClick={() => { setActiveView("plan"); setShowFullPlan(false); setShowProgressOverview(true); }}>
              <Icon name="pulse" /> Fortschritt
            </a>
            <a href={settings.settingsAppUrl} {...internalLinkProps(settings.settingsAppUrl)}>
              <Icon name="settings" /> Einstellungen
            </a>
          </nav>
          <div className="sidebar-quick">
            <p>Schnellzugriff</p>
            <a href={settings.pdfReaderUrl} {...internalLinkProps(settings.pdfReaderUrl)}>
              <Icon name="file" /> PDF Visual
            </a>
            <a href={exposeReaderHref(settings.pdfReaderUrl)} title="Normal klicken: hier öffnen. Rechtsklick: in neuem Tab oder Fenster öffnen.">
              <Icon name="book" /> Exposé
            </a>
            <a href="/nlp-lab" {...internalLinkProps("/nlp-lab")}>
              <Icon name="pulse" /> NLP Retrieval Lab
            </a>
            <button
              type="button"
              className={focusActive?.status ?? ""}
              onClick={() => {
                if (!focusActive) setFocusTargetDayId(nextDay.id);
                setFocusOpen(true);
              }}
            >
              <Icon name="clock" /> {focusActive ? formatFocusDuration(activeFocusSeconds) : "Fokus-Timer"}
            </button>
          </div>
          <div className="sidebar-foot">
            <div className="profile-card">
              <span className="profile-avatar" aria-hidden="true">
                {displayName?.trim().slice(0, 1) || "F"}
              </span>
              <span>
                <strong>{displayName || "Forscherin"}</strong>
                <small>Persönlicher Lernpfad</small>
              </span>
            </div>
            <input
              ref={importInputRef}
              className="visually-hidden"
              type="file"
              accept="application/json,.json"
              onChange={importJson}
              aria-label="JSON-Fortschrittsdatei auswählen"
            />
          </div>
        </aside>

        <main className="main-content">
          {activeView === "plan" ? (
            <>
          <section className="start-dashboard" id="start-dashboard" aria-labelledby="dashboard-title">
            <header className="dashboard-welcome">
              <h1 id="dashboard-title">Guten Morgen, {firstName}</h1>
              <time dateTime={systemToday}>{formatDate(systemToday)}</time>
              <p>Ein klarer Schritt für heute.</p>
            </header>

            <section className={`plan-control-panel ${settings.planStatus}`} aria-labelledby="plan-control-title">
              <div className="plan-control-copy">
                <span className="eyebrow quiet">Projektzeitplan</span>
                <h2 id="plan-control-title">
                  {settings.planStatus === "not_started" ? "Lernplan starten" : settings.planStatus === "paused" ? "Lernplan pausiert" : "Lernplan aktiv"}
                </h2>
                <p>
                  {settings.planStatus === "not_started"
                    ? "Wähle dein tatsächliches Startdatum. Das Enddatum und alle Plantage werden automatisch berechnet."
                    : settings.planStatus === "paused"
                      ? `Seit ${formatDate(settings.planPausedAt)} pausiert. Fortschritt, Notizen und Dateien bleiben erhalten.`
                      : `Beginn ${formatDate(settings.planStartDate)} · geplantes Ende ${formatDate(settings.planEndDate)}`}
                </p>
              </div>
              {settings.planStatus === "paused" ? (
                <div className="plan-control-actions">
                  <label>
                    <span>Fortsetzen am</span>
                    <input dir="ltr" type="date" min={settings.planPausedAt} value={resumeDate} onChange={(event) => setResumeDate(event.target.value)} />
                  </label>
                  <button className="button primary" type="button" onClick={() => void resumePlan()}>
                    Plan fortsetzen und Termine neu berechnen
                  </button>
                </div>
              ) : (
                <div className="plan-control-actions">
                  <label>
                    <span>{settings.planStatus === "running" ? "Neues Startdatum" : "Startdatum"}</span>
                    <input dir="ltr" type="date" value={requestedStartDate} onChange={(event) => setRequestedStartDate(event.target.value)} />
                  </label>
                  <button className="button primary" type="button" onClick={() => void startPlan()}>
                    {settings.planStatus === "running" ? "Mit neuem Datum erneut starten" : "Lernplan starten"}
                  </button>
                  {settings.planStatus === "running" && (
                    <button className="button secondary" type="button" onClick={() => void pausePlan()}>
                      Plan vorübergehend pausieren
                    </button>
                  )}
                </div>
              )}
            </section>

            {todayCourseSession ? (
              <article className="live-course-banner" aria-label="Heutige NLP-Live-Sitzung">
                <div>
                  <span>Live-Kurs · Sitzung {todayCourseSession.number} von 10</span>
                  <h2>{todayCourseSession.title}</h2>
                  <p>{todayCourseSession.berlinTime} Berlin · {todayCourseSession.projectQuestion}</p>
                </div>
                <a className="button primary" href="/nlp-lab" {...internalLinkProps("/nlp-lab")}>
                  Sitzung und Projektaufgaben öffnen <Icon name="arrow" size={17} />
                </a>
              </article>
            ) : null}

            <div className="dashboard-primary-grid">
              <article className="today-card">
                <header className="dashboard-card-title">
                  <span><Icon name="calendar" size={21} /> Heute · <time dateTime={systemToday}>{formatDate(systemToday, true)}</time></span>
                  <div className="today-card-controls">
                    <button
                      className="button primary focus-start-button focus-start-button-top"
                      type="button"
                      disabled={!planCanRecordToday}
                      onClick={() => {
                        if (!planCanRecordToday || !systemTodayDay) return;
                        setFocusTargetDayId(systemTodayDay.id);
                        if (focusActive) setFocusOpen(true);
                        else void focusAction("start", systemTodayDay.id);
                      }}
                    >
                      <Icon name="play" size={18} />
                      {settings.planStatus === "not_started"
                        ? "Erst Lernplan starten"
                        : settings.planStatus === "paused"
                          ? "Lernplan ist pausiert"
                          : !systemTodayDay
                            ? "Heute kein Lerneintrag"
                            : focusActive
                              ? "Fokus öffnen"
                              : `Fokus starten · ${displayNumber(workModeTaskMinutes(settings.dailyWorkMode, currentTodayTaskIndex))} Min.`}
                    </button>
                    {planCanRecordToday && <small><Icon name="clock" size={17} /> {displayNumber(activeDailyWorkMode.totalMinutes)} Min.</small>}
                  </div>
                </header>
                {!planCanRecordToday && (
                  <p className="today-empty-state">
                    {settings.planStatus === "not_started"
                      ? "Dies ist nur eine Vorschau. Wähle oben dein echtes Startdatum und starte den Lernplan; vorher wird kein Fortschritt gespeichert."
                      : settings.planStatus === "paused"
                        ? "Der Lernplan ist pausiert. Du kannst Inhalte ansehen, aber bis zum Fortsetzen wird kein Fortschritt gespeichert."
                        : `Für ${formatDate(systemToday)} ist kein eigener Lernplan-Eintrag vorgesehen. Der nächste offene Plantag wird nur als Vorschau angezeigt und nicht als heutige Aktivität gespeichert.`}
                  </p>
                )}
                <span className="today-phase-chip">
                  {planCanRecordToday ? "Heutiger Plantag" : "Vorschau"} · {dashboardDay.phaseId.startsWith("design-") ? `Design ${dashboardDayWeekNumber}` : `Woche ${dashboardDayWeekNumber}`} · {dashboardDay.weekTitle}
                </span>
                <details className="daily-mode-control">
                  <summary>
                    <span><Icon name="clock" size={17} /> Arbeitsmodus</span>
                    <strong>{activeDailyWorkMode.label}</strong>
                  </summary>
                  <p>{activeDailyWorkMode.description}</p>
                  <div className="daily-mode-options" role="group" aria-label="Arbeitsmodus für heute wählen">
                    {(Object.keys(DAILY_WORK_MODES) as DailyWorkMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={settings.dailyWorkMode === mode ? "active" : ""}
                        aria-pressed={settings.dailyWorkMode === mode}
                        onClick={() => void setDailyWorkMode(mode)}
                      >
                        <strong>{DAILY_WORK_MODES[mode].shortLabel}</strong>
                        <span>{displayNumber(DAILY_WORK_MODES[mode].totalMinutes)} Min.</span>
                      </button>
                    ))}
                  </div>
                </details>
                <h2>{dashboardDay.title}</h2>
                <div className="today-task-list">
                  {dashboardDay.tasks.map((task) => {
                    const checked = task.items.every((item) => completed.has(item.id));
                    return (
                      <label key={task.id}>
                        <input
                          type="checkbox"
                          disabled={!planCanRecordToday}
                          checked={checked}
                          onChange={(event) => {
                            if (planCanRecordToday && systemTodayDay) void toggleTaskGroup(systemTodayDay, task, event.target.checked);
                          }}
                        />
                        <span>{task.title.replace(/^\d+\.\s*/, "")}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="today-progress" aria-label={`${completedTaskGroups} von 3 großen Aufgaben erledigt`}>
                  <span><i style={{ width: `${(completedTaskGroups / 3) * 100}%` }} /></span>
                  <small>{displayNumber(completedTaskGroups)} von 3 Aufgaben</small>
                </div>
                <div className="today-actions">
                  <button className="dashboard-text-action" type="button" onClick={() => revealDay(dashboardDay)}>
                    {planCanRecordToday ? "Heutigen Tagesplan öffnen" : "Plantag als Vorschau ansehen"} <Icon name="arrow" size={17} />
                  </button>
                </div>
              </article>

              <article className="milestone-card">
                <header className="dashboard-card-title milestone-title">
                  <span><Icon name="flag" size={22} /> Nächster Meilenstein</span>
                </header>
                <time dateTime={designMilestoneDate}>{formatDate(designMilestoneDate, true)}</time>
                <h2>Softwaredesign abgeschlossen</h2>
                <div className="milestone-progress">
                  <ProgressRing percent={designPercent} label="Design" />
                  <p><strong>{displayNumber(milestoneDaysRemaining)}</strong><span>Tage verbleiben</span></p>
                </div>
              </article>
            </div>

            <section className="dashboard-metrics" aria-label="Deine Lernkennzahlen">
              <button type="button" onClick={() => setFocusOpen(true)}>
                <span className="dashboard-metric-icon"><Icon name="clock" /></span>
                <span><small>Fokuszeit</small><strong>{formatFocusDuration(measuredFocusSeconds)}</strong></span>
              </button>
              <article>
                <span className="dashboard-metric-icon"><Icon name="book" /></span>
                <span><small>Lernzeit</small><strong>{displayNumber(estimatedHours)} Std.</strong></span>
              </article>
              <article>
                <span className="dashboard-metric-icon"><Icon name="flame" /></span>
                <span><small>Aktive Tage</small><strong>{displayNumber(completedDays)}</strong></span>
              </article>
            </section>

            <section className="dashboard-recall" aria-label="Fällige Wiederholungen">
              <RecallCheck />
            </section>

            <details
              className="rhythm-card dashboard-disclosure"
              id="rhythm"
              open={showProgressOverview}
              onToggle={(event) => setShowProgressOverview(event.currentTarget.open)}
            >
              <summary>
                <h2 id="rhythm-title"><Icon name="pulse" size={22} /> Dein Rhythmus</h2>
                <span>{displayNumber(rhythmWeeks.length)} Wochen</span>
              </summary>
              <div className="rhythm-content">
                <div className="rhythm-weeks">
                  {rhythmWeeks.map((week) => {
                    const firstDay = shiftedPlanDate(week.days[0].date, settings.planStartDate);
                    const lastDay = shiftedPlanDate(week.days.at(-1)!.date, settings.planStartDate);
                    return (
                      <div className="rhythm-week" key={week.number}>
                        <header>
                          <strong>Woche {displayNumber(week.number)}</strong>
                          <span>{formatDate(firstDay, true)} – {formatDate(lastDay, true)}</span>
                        </header>
                        <div className="rhythm-days">
                          {week.days.map((day) => {
                            const done = itemCount(day);
                            const level = done === 9 ? 3 : done >= 4 ? 2 : done > 0 ? 1 : 0;
                            return (
                              <button
                                type="button"
                                key={day.id}
                                className={`activity-level-${level}`}
                                title={`${formatDate(shiftedPlanDate(day.date, settings.planStartDate), true)}: ${done} von 9 Schritten`}
                                aria-label={`${formatDate(shiftedPlanDate(day.date, settings.planStartDate), true)}: ${done} von 9 Schritten erledigt`}
                                onClick={() => revealDay(day)}
                              >
                                <small>{new Intl.DateTimeFormat("de-DE", { weekday: "short" }).format(new Date(`${shiftedPlanDate(day.date, settings.planStartDate)}T12:00:00Z`)).slice(0, 2)}</small>
                                <i><span>{displayNumber(done)}</span></i>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <aside className="rhythm-summary" aria-label="Zusammenfassung der letzten fünf Planwochen">
                  <ProgressRing percent={rhythmPercent} label="5-Wochen-Fortschritt" />
                  <div>
                    <strong>{displayNumber(rhythmActiveDays)} aktive Tage</strong>
                    <span>{displayNumber(rhythmCompletedItems)} von {displayNumber(rhythmTotalItems)} Lernschritten</span>
                  </div>
                  <div className="activity-legend" aria-label="Farblegende">
                    <span><i className="activity-level-0" /> Offen</span>
                    <span><i className="activity-level-1" /> Begonnen</span>
                    <span><i className="activity-level-3" /> Erledigt</span>
                  </div>
                  <p>{rhythmActiveDays === 0 ? "Starte heute mit einem Lernschritt. Jede ausgefüllte Kachel macht deinen Fortschritt sichtbar." : "Dein Rhythmus wächst. Klicke auf eine Tageskachel, um direkt weiterzumachen."}</p>
                </aside>
              </div>
            </details>

            <details
              className="journey-card dashboard-disclosure"
              open={showJourneyOverview}
              onToggle={(event) => setShowJourneyOverview(event.currentTarget.open)}
            >
              <summary>
                <h2 id="journey-title"><Icon name="book" size={22} /> Lernreise</h2>
                <span>25 Wochen · 5 Phasen</span>
              </summary>
              <div className="journey-actions">
                <button className="button secondary compact" type="button" aria-expanded={showFullPlan} aria-controls="plan" onClick={() => openFullPlan()}>
                  Gesamten 25-Wochen-Plan ansehen <Icon name="calendar" size={17} />
                </button>
              </div>
              <div className="journey-track">
                {journeyStages.map((stage) => {
                  const stageWeeks = weekProgress.filter((week) => week.number >= stage.start && week.number <= stage.end);
                  const stagePercent = stageWeeks.length
                    ? Math.round(stageWeeks.reduce((sum, week) => sum + week.percent, 0) / stageWeeks.length)
                    : 0;
                  const current = nextWeekIndex + 1 >= stage.start && nextWeekIndex + 1 <= stage.end;
                  return (
                    <button
                      type="button"
                      key={stage.number}
                      className={current ? "current" : stagePercent === 100 ? "complete" : ""}
                      onClick={() => {
                        const target = planWeeks.find((week) => week.number === stage.start)?.days[0];
                        if (target) revealDay(target);
                      }}
                    >
                      <span>{stage.number}</span>
                      <strong>{stage.title}</strong>
                      <small>{stage.weeks}</small>
                      {current && <em>Aktuell</em>}
                    </button>
                  );
                })}
              </div>
            </details>
          </section>

          {showFullPlan && <section className="plan-section" id="plan" aria-labelledby="plan-title">
            <div className="section-heading plan-heading">
              <div>
                <span className="eyebrow quiet">Phase → Woche → Tag → Aufgabe</span>
                <h2 id="plan-title">Gesamter Lernplan</h2>
                <p>Alle Karten sind standardmäßig geschlossen. Öffne nur den Abschnitt, den du heute brauchst.</p>
              </div>
              <div className="plan-count">
                <strong>{displayNumber(planMeta.totalWeeks)}</strong>
                <span>Wochen</span>
              </div>
            </div>

            <article className="expose-plan-card" id="expose" aria-labelledby="expose-plan-title">
              <div className="expose-plan-icon" aria-hidden="true"><Icon name="book" size={24} /></div>
              <div className="expose-plan-copy">
                <span>{exposeMeta.custom ? "Eigene aktuelle Version" : "Mitgelieferte Ausgangsversion"}</span>
                <h3 id="expose-plan-title">Projekt-Exposé</h3>
                <strong>{exposeMeta.name}</strong>
                <small>
                  {exposeMeta.size && exposeMeta.size > 0 ? `${formatFileSize(exposeMeta.size)} · ` : ""}
                  {exposeMeta.updatedAt ? `aktualisiert am ${formatDate(exposeMeta.updatedAt.slice(0, 10), true)}` : "lokal in dieser App enthalten"}
                </small>
                <p className="expose-focus"><strong>Lesefokus:</strong> {DEFAULT_EXPOSE_FOCUS}</p>
                <p>Wenn sich die Anforderungen deines Professors ändern, kannst du hier jederzeit die überarbeitete PDF als neue aktuelle Version einsetzen.</p>
              </div>
              <div className="expose-plan-actions">
                <a className="button primary" href={exposeReaderHref(settings.pdfReaderUrl)} title="Normal klicken: hier öffnen. Rechtsklick: in neuem Tab oder Fenster öffnen.">
                  <Icon name="eye" size={18} /> Im PDF Visual lesen
                </a>
                <button className="button secondary" type="button" disabled={exposeUploading} onClick={() => exposeInputRef.current?.click()}>
                  <Icon name="upload" size={18} /> {exposeUploading ? "Wird gespeichert …" : "Neue PDF-Version wählen"}
                </button>
                {exposeMeta.custom && (
                  <button className="button ghost" type="button" onClick={() => void restoreBundledExpose()}>
                    Standardversion verwenden
                  </button>
                )}
                <input ref={exposeInputRef} className="visually-hidden" type="file" accept="application/pdf,.pdf" onChange={(event) => void uploadExpose(event)} />
              </div>
            </article>

            <div className="filter-panel">
              <label className="search-field">
                <span className="visually-hidden">Im Lernplan suchen</span>
                <Icon name="search" size={19} />
                <input
                  id="plan-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Artikel, Modul, Ergebnis oder genauer Begriff …"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Suche löschen"
                    onClick={() => {
                      setQuery("");
                      setActiveDayId(null);
                    }}
                  >
                    ×
                  </button>
                )}
              </label>
              <label>
                <span className="visually-hidden">Nach Phase filtern</span>
                <select
                  value={phaseFilter}
                  onChange={(event) => setPhaseFilter(event.target.value)}
                >
                  <option value="all">Alle Phasen</option>
                  {phaseGroups.map((phase) => (
                    <option value={phase.id} key={phase.id}>
                      {phase.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="visually-hidden">Nach Status filtern</span>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                >
                  <option value="all">Alle Status</option>
                  <option value="open">Noch nicht begonnen</option>
                  <option value="started">In Arbeit</option>
                  <option value="done">Abgeschlossen</option>
                </select>
              </label>
            </div>

            {query.trim() && (
              <div className="search-results" aria-live="polite">
                <p>
                  {displayNumber(searchResults.length)} passende Ergebnisse –
                  anklicken, um direkt zum Tag zu springen
                </p>
                {searchResults.length > 0 ? (
                  <div>
                    {searchResults.map((day) => (
                      <button type="button" key={day.id} onClick={() => revealDay(day)}>
                        <span><Highlight text={day.title} query={query} /></span>
                        <small>{formatDate(shiftedPlanDate(day.date, settings.planStartDate), true)} · {day.phase}</small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="empty-state">Versuche einen anderen Suchbegriff.</span>
                )}
              </div>
            )}

            <div className="phase-stack">
              {filteredGroups.map((phase) => {
                const phaseDays = phase.weeks.flatMap((week) => week.days);
                const phaseDone = phaseDays.reduce((sum, day) => sum + itemCount(day), 0);
                const phaseTotal = phaseDays.length * 9;
                return (
                  <details className="phase-card" key={phase.id}>
                    <summary>
                      <span className="summary-marker"><Icon name="arrow" size={18} /></span>
                      <span className="phase-number">{displayNumber(phase.weeks[0].number)}</span>
                      <span className="summary-main">
                        <strong>{phase.title}</strong>
                        <small>
                          {displayNumber(phase.weeks.length)} Woche(n) · {displayNumber(phaseDays.length)} Tage
                        </small>
                      </span>
                      <ProgressRing
                        percent={phaseTotal ? (phaseDone / phaseTotal) * 100 : 0}
                        label={`Fortschritt ${phase.title}`}
                        compact
                      />
                    </summary>
                    <div className="phase-content">
                      {phase.weeks.map((week) => (
                        <WeekCard
                          key={week.number}
                          week={week}
                          completed={completed}
                          activeDayId={activeDayId}
                          query={query}
                          settings={settings}
                          notes={notes}
                          attachments={attachments}
                          uploadingDayId={uploadingDayId}
                          setNotes={setNotes}
                          onToggle={toggleItem}
                          onSaveNote={saveNote}
                          onUploadFiles={uploadDayFiles}
                          onOpenAttachment={openAttachment}
                          onDeleteAttachment={deleteAttachment}
                          onReveal={revealDay}
                          onStartFocus={(day) => {
                            setFocusTargetDayId(day.id);
                            if (focusActive) setFocusOpen(true);
                            else void focusAction("start", day.id);
                          }}
                        />
                      ))}
                    </div>
                  </details>
                );
              })}
              {filteredGroups.length === 0 && (
                <div className="empty-card">
                  <Icon name="search" />
                  <strong>Für diesen Filter wurde kein Tag gefunden.</strong>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setPhaseFilter("all");
                      setStatusFilter("all");
                    }}
                  >
                    Filter zurücksetzen
                  </button>
                </div>
              )}
            </div>
          </section>}

            </>
          ) : (
          <section className="integrations-section settings-workspace" id="settings-workspace" aria-labelledby="integration-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow quiet">Lernplan, Quellen und verbundene Apps</span>
                <h2 id="integration-title">Einstellungen</h2>
                <p>Diese Seite wird nur über den Menüpunkt „Einstellungen“ geöffnet. Schlüssel, Tokens und Passwörter werden weder angezeigt noch exportiert.</p>
              </div>
              <button
                className="button secondary compact"
                type="button"
                aria-expanded={expandedIntegration}
                onClick={() => setExpandedIntegration((value) => !value)}
              >
                {expandedIntegration ? "Details schließen" : "Details anzeigen"}
              </button>
            </div>
            <div className="settings-plan-overview">
              <article>
                <span className="metric-icon violet"><Icon name="calendar" /></span>
                <div>
                  <small>Lernplan</small>
                  <strong>{settings.planName}</strong>
                  <p>{displayNumber(planMeta.totalWeeks)} Planwochen · {displayNumber(planMeta.totalDays)} aktive Tage</p>
                </div>
              </article>
              <article>
                <small>Startdatum</small>
                <strong>{formatDate(settings.planStartDate)}</strong>
              </article>
              <article>
                <small>Enddatum</small>
                <strong>{formatDate(settings.planEndDate)}</strong>
                {settings.planEndDate !== suggestedPlanEnd(settings.planStartDate) && (
                  <p>Planvorschlag: {formatDate(suggestedPlanEnd(settings.planStartDate))}</p>
                )}
              </article>
              <article className={`plan-status-card ${settings.planStatus}`}>
                <small>Planstatus</small>
                <strong>{settings.planStatus === "paused" ? "Pausiert" : settings.planStatus === "running" ? "Aktiv" : "Noch nicht gestartet"}</strong>
                {settings.planStatus === "paused" ? (
                  <p>Seit {formatDate(settings.planPausedAt)}</p>
                ) : settings.planStatus === "not_started" ? (
                  <p>Wähle zuerst das tatsächliche Startdatum.</p>
                ) : (
                  <p>Termine werden nach dem Startdatum berechnet.</p>
                )}
              </article>
              {settings.planStatus === "running" ? (
                <button className="button secondary" type="button" onClick={() => void pausePlan()}>
                  <Icon name="clock" size={18} /> Plan pausieren
                </button>
              ) : settings.planStatus === "paused" ? (
                <div className="plan-resume-control">
                  <label>
                    <span>Fortsetzen am</span>
                    <input
                      dir="ltr"
                      type="date"
                      min={settings.planPausedAt}
                      value={resumeDate}
                      onChange={(event) => setResumeDate(event.target.value)}
                    />
                  </label>
                  <button className="button primary" type="button" onClick={() => void resumePlan()}>
                    Plan fortsetzen und Termine neu berechnen
                  </button>
                </div>
              ) : (
                <p className="plan-pause-help">Der Plan wird über die Startkarte auf dem Tagesdashboard gestartet.</p>
              )}
              <button
                className="button primary"
                type="button"
                onClick={() => {
                  setSettingsDraft(settings);
                  setSettingsOpen(true);
                }}
              >
                <Icon name="settings" size={18} /> Lernplan bearbeiten
              </button>
            </div>
            <h3 className="settings-subtitle">Quellen und verbundene Apps</h3>
            <div className="integration-grid">
              <IntegrationCard
                name="Google Drive"
                status="Geprüft"
                tone="ready"
                summary="Quellenordner und 45 PDF-Dateien wurden identifiziert."
                href={settings.driveFolderUrl}
                expanded={expandedIntegration}
              >
                Artikel aus dem Lernplan führen direkt zur jeweiligen Drive-Datei, zum Download und zum PDF Reader.
              </IntegrationCard>
              <IntegrationCard
                name="PDF Visual"
                status="Verknüpft"
                tone="ready"
                summary="Öffnet die ausgewählte Drive-PDF direkt im integrierten PDF Visual."
                href={settings.pdfReaderUrl}
                expanded={expandedIntegration}
              >
                Private Drive-Dateien werden ausschließlich über die offizielle Google-Freigabe im PDF Reader geöffnet; Tokens stehen niemals in der URL.
              </IntegrationCard>
              <IntegrationCard
                name="Einstellungen"
                status="Verknüpft"
                tone="ready"
                summary="Die zentrale Konfiguration ist als interner Bereich dieser installierten App verfügbar."
                href={settings.settingsAppUrl}
                expanded={expandedIntegration}
              >
                OpenAI, Google Translation, Drive, Kalender und persönliche Einstellungen werden innerhalb derselben App verwaltet. Geheimnisse werden nie exportiert.
              </IntegrationCard>
              <IntegrationCard
                name="Notion"
                status="Synchronisierung aus"
                tone="warning"
                summary="Die vorhandene Datenbank „DbEviGraph Daily Reports“ wurde gefunden."
                href={settings.notionUrl}
                expanded={expandedIntegration}
              >
                Der Connector war im Chat verfügbar; diese Website hat jedoch noch keine Freigabe für eine Live-Synchronisierung und der Datenbankname ist veraltet.
              </IntegrationCard>
              <IntegrationCard
                name="GitHub"
                status="Kein Zugriff"
                tone="blocked"
                summary="Das eingetragene Repository war mit der aktuellen Freigabe nicht lesbar."
                href={settings.githubUrl}
                expanded={expandedIntegration}
              >
                Für die Synchronisierung müssen Repository und GitHub-Zugriff separat bestätigt werden. Die Website hat das Repository nicht verändert.
              </IntegrationCard>
              <IntegrationCard
                name="Google Calendar"
                status="Kalenderkonflikt"
                tone="warning"
                summary="Die vorhandenen Ruhetermine bis 20. Oktober überschneiden sich mit dem Start am 1. Oktober."
                expanded={expandedIntegration}
              >
                Die direkte Synchronisierung bleibt aus. Nutze vorerst den sicheren ICS-Export; Termine werden nur nach deiner ausdrücklichen Bestätigung geändert oder gelöscht.
              </IntegrationCard>
              <IntegrationCard
                name="Sider Scholar"
                status="Manuell geprüft"
                tone="neutral"
                summary="Für die Quellensuche geprüft; automatische Synchronisierung ist nicht aktiv."
                expanded={expandedIntegration}
              >
                Nur genaue und relevante Quellen wurden in den Kernplan übernommen.
              </IntegrationCard>
            </div>
            <div className="integration-actions">
              <button className="button secondary" type="button" onClick={() => exportIcs(false)}>
                <Icon name="calendar" size={18} /> Gesamten Plan als ICS exportieren
              </button>
              <button className="button secondary" type="button" onClick={exportJson}>
                <Icon name="download" size={18} /> Fortschritt als JSON exportieren
              </button>
              <button className="button secondary" type="button" onClick={() => importInputRef.current?.click()}>
                <Icon name="upload" size={18} /> Fortschrittsdatei importieren
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  setSettingsDraft(settings);
                  setSettingsOpen(true);
                }}
              >
                <Icon name="settings" size={18} /> Lernplan, Namen und Links bearbeiten
              </button>
            </div>
          </section>
          )}
        </main>
      </div>

      {settingsOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSettingsOpen(false)}>
          <section
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="eyebrow quiet">Alle Namen und Links sind bearbeitbar</span>
                <h2 id="settings-title">Lernplan-Einstellungen</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Einstellungen schließen" onClick={() => setSettingsOpen(false)}>
                ×
              </button>
            </header>
            <div className="settings-scroll">
              <div className="form-grid">
                <label className="full-field">
                  <span>Lernplan</span>
                  <input
                    value={settingsDraft.planName}
                    onChange={(event) => setSettingsDraft({ ...settingsDraft, planName: event.target.value })}
                  />
                </label>
                <label className="full-field">
                  <span>Projektname</span>
                  <input
                    value={settingsDraft.projectName}
                    onChange={(event) => setSettingsDraft({ ...settingsDraft, projectName: event.target.value })}
                  />
                </label>
                <label>
                  <span>Startdatum</span>
                  <input
                    dir="ltr"
                    type="date"
                    value={settingsDraft.planStartDate}
                    onChange={(event) => {
                      const nextStart = event.target.value;
                      const previousSuggestion = suggestedPlanEnd(settingsDraft.planStartDate);
                      const shouldFollowSuggestion =
                        !settingsDraft.planEndDate ||
                        settingsDraft.planEndDate === previousSuggestion;
                      setSettingsDraft({
                        ...settingsDraft,
                        planStartDate: nextStart,
                        planEndDate: shouldFollowSuggestion
                          ? suggestedPlanEnd(nextStart)
                          : settingsDraft.planEndDate,
                      });
                    }}
                  />
                </label>
                <label>
                  <span>Enddatum</span>
                  <input
                    dir="ltr"
                    type="date"
                    min={settingsDraft.planStartDate}
                    value={settingsDraft.planEndDate}
                    onChange={(event) => setSettingsDraft({ ...settingsDraft, planEndDate: event.target.value })}
                  />
                </label>
                <div className="plan-date-suggestion full-field">
                  <div>
                    <strong>Vorgeschlagenes Enddatum</strong>
                    <span>{formatDate(suggestedPlanEnd(settingsDraft.planStartDate))}</span>
                    <small>
                      Aus {displayNumber(planMeta.totalWeeks)} Planwochen und der vorhandenen Erholungspause berechnet.
                      Ohne Sonderpause wären es {formatDate(continuousWeeksEnd(settingsDraft.planStartDate))}.
                    </small>
                  </div>
                  <button
                    className="button secondary compact"
                    type="button"
                    onClick={() =>
                      setSettingsDraft({
                        ...settingsDraft,
                        planEndDate: suggestedPlanEnd(settingsDraft.planStartDate),
                      })
                    }
                  >
                    Vorschlag übernehmen
                  </button>
                </div>
                <div className="plan-pause-help full-field">
                  <strong>Unterbrechungen sicher behandeln</strong>
                  <p>
                    „Plan pausieren“ hält den Zeitplan an. Beim Fortsetzen wählst du das neue Datum;
                    Start- und Enddatum sowie alle Kalendertermine werden neu berechnet. Erledigte
                    Aufgaben, Notizen, Nachweise und Anhänge bleiben unverändert gespeichert.
                  </p>
                </div>
                <label>
                  <span>Täglicher Start</span>
                  <input
                    dir="ltr"
                    type="time"
                    value={settingsDraft.dailyStart}
                    onChange={(event) => setSettingsDraft({ ...settingsDraft, dailyStart: event.target.value })}
                  />
                </label>
                <div className="timezone-note">
                  <Icon name="clock" size={18} /> Zeitzone: Europe/Berlin · Dauer jeder Lerneinheit: 4 Stunden
                </div>
                <label className="full-field">
                  <span>Google-Drive-Ordner</span>
                  <input
                    dir="ltr"
                    type="url"
                    value={settingsDraft.driveFolderUrl}
                    onChange={(event) => setSettingsDraft({ ...settingsDraft, driveFolderUrl: event.target.value })}
                  />
                </label>
                <label className="full-field">
                  <span>GitHub-Link</span>
                  <input
                    dir="ltr"
                    type="url"
                    value={settingsDraft.githubUrl}
                    onChange={(event) => setSettingsDraft({ ...settingsDraft, githubUrl: event.target.value })}
                  />
                </label>
                <label className="full-field">
                  <span>Notion-Link</span>
                  <input
                    dir="ltr"
                    type="url"
                    value={settingsDraft.notionUrl}
                    onChange={(event) => setSettingsDraft({ ...settingsDraft, notionUrl: event.target.value })}
                  />
                </label>
                <label className="full-field">
                  <span>Interner PDF-Visual-Pfad</span>
                  <input
                    dir="ltr"
                    type="url"
                    value={settingsDraft.pdfReaderUrl}
                    onChange={(event) => setSettingsDraft({ ...settingsDraft, pdfReaderUrl: event.target.value })}
                  />
                </label>
                <label className="full-field">
                  <span>Interner Einstellungen-Pfad</span>
                  <input
                    dir="ltr"
                    type="url"
                    value={settingsDraft.settingsAppUrl}
                    onChange={(event) => setSettingsDraft({ ...settingsDraft, settingsAppUrl: event.target.value })}
                  />
                </label>
              </div>
              <details className="source-settings">
                <summary>
                  <span>Namen und Links aller Quellen bearbeiten</span>
                  <small>{displayNumber(Object.keys(sources).length)} Quellen</small>
                </summary>
                <div>
                  {Object.values(sources).map((source) => (
                    <fieldset key={source.id}>
                      <legend>{source.label}</legend>
                      <label>
                        <span>Anzeigename</span>
                        <input
                          value={settingsDraft.sourceOverrides[source.id] ?? ""}
                          placeholder={source.label}
                          onChange={(event) =>
                            setSettingsDraft({
                              ...settingsDraft,
                              sourceOverrides: {
                                ...settingsDraft.sourceOverrides,
                                [source.id]: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
                      <label>
                        <span>Link</span>
                        <input
                          dir="ltr"
                          type="url"
                          value={settingsDraft.sourceLinkOverrides[source.id] ?? ""}
                          placeholder={source.href || "Kein Link"}
                          onChange={(event) =>
                            setSettingsDraft({
                              ...settingsDraft,
                              sourceLinkOverrides: {
                                ...settingsDraft.sourceLinkOverrides,
                                [source.id]: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
                    </fieldset>
                  ))}
                </div>
              </details>
            </div>
            <footer>
              <button className="button ghost" type="button" onClick={() => setSettingsOpen(false)}>
                Abbrechen
              </button>
              <button className="button primary" type="button" onClick={saveSettings}>
                Einstellungen speichern
              </button>
            </footer>
          </section>
        </div>
      )}

      {previewAttachment && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={closeAttachmentPreview}
        >
          <section
            className="file-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="file-preview-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="eyebrow quiet">Dateivorschau</span>
                <h2 id="file-preview-title">{previewAttachment.name}</h2>
                <p>{formatFileSize(previewAttachment.size)} · {previewAttachment.mimeType || "Unbekannter Dateityp"}</p>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Dateivorschau schließen"
                onClick={closeAttachmentPreview}
              >
                ×
              </button>
            </header>
            <div className="file-preview-body">
              {previewLoading ? (
                <div className="preview-loading" role="status">
                  <span /> Datei wird geöffnet …
                </div>
              ) : attachmentKind(previewAttachment) === "image" && previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={previewAttachment.name} />
              ) : attachmentKind(previewAttachment) === "pdf" && previewUrl ? (
                <iframe src={previewUrl} title={previewAttachment.name} />
              ) : attachmentKind(previewAttachment) === "audio" && previewUrl ? (
                <audio src={previewUrl} controls autoPlay={false} />
              ) : attachmentKind(previewAttachment) === "video" && previewUrl ? (
                <video src={previewUrl} controls />
              ) : (
                attachmentKind(previewAttachment) === "text" && previewAttachment.size <= 3 * 1024 * 1024
              ) || (
                attachmentKind(previewAttachment) === "office" && previewAttachment.size <= 8 * 1024 * 1024
              ) ? (
                <pre>{previewText}</pre>
              ) : (
                <div className="preview-unavailable">
                  <span><Icon name="file" size={34} /></span>
                  <h3>Für diesen Dateityp gibt es keine sichere Browser-Vorschau.</h3>
                  <p>Die Datei ist gespeichert. Du kannst sie herunterladen und mit dem passenden Programm öffnen.</p>
                </div>
              )}
            </div>
            <footer>
              <a
                className="button primary"
                href={`/api/attachments?id=${encodeURIComponent(previewAttachment.id)}&download=1`}
              >
                <Icon name="download" size={18} /> Datei herunterladen
              </a>
              <button className="button ghost" type="button" onClick={closeAttachmentPreview}>
                Schließen
              </button>
            </footer>
          </section>
        </div>
      )}

      {focusOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setFocusOpen(false)}
        >
          <section
            className="focus-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="focus-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="eyebrow quiet">Studienzeit messen und speichern</span>
                <h2 id="focus-title">Fokus-Timer</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Fokus-Timer schließen"
                onClick={() => setFocusOpen(false)}
              >
                ×
              </button>
            </header>

            <div className="focus-modal-body">
              <div className={`focus-clock ${focusActive?.status ?? "idle"}`}>
                <span className="focus-pulse" aria-hidden="true" />
                <strong>{formatFocusDuration(activeFocusSeconds)}</strong>
                <small>
                  {focusActive?.status === "running"
                    ? "Läuft – konzentrierte Lernzeit wird gemessen"
                    : focusActive?.status === "paused"
                      ? "Pausiert – die Pause wird nicht mitgezählt"
                      : "Bereit für eine neue Fokussitzung"}
                </small>
              </div>

              {focusActive ? (
                <article className="focus-current">
                  <span>Aktueller Lerntag</span>
                  <strong>{focusActive.contextTitle}</strong>
                  <div className="focus-actions">
                    {focusActive.status === "running" ? (
                      <button className="button secondary" type="button" disabled={focusBusy} onClick={() => void focusAction("pause")}>
                        Pause
                      </button>
                    ) : (
                      <button className="button primary" type="button" disabled={focusBusy} onClick={() => void focusAction("resume")}>
                        Fortsetzen
                      </button>
                    )}
                    <button className="button finish" type="button" disabled={focusBusy} onClick={() => void focusAction("finish")}>
                      Sitzung beenden und speichern
                    </button>
                  </div>
                </article>
              ) : (
                <div className="focus-start-panel">
                  <label htmlFor="focus-day">
                    <span>Lerntag auswählen</span>
                    <select id="focus-day" value={focusTargetDayId} onChange={(event) => setFocusTargetDayId(event.target.value)}>
                      {allDays.map((day) => (
                        <option value={day.id} key={day.id}>
                          {formatDate(shiftedPlanDate(day.date, settings.planStartDate), true)} · {day.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="button primary" type="button" disabled={focusBusy || settings.planStatus !== "running"} onClick={() => void focusAction("start")}>
                    <Icon name="clock" size={18} /> {settings.planStatus === "running" ? "Fokus starten" : "Erst Lernplan starten"}
                  </button>
                </div>
              )}

              <section className="focus-history" aria-labelledby="focus-history-title">
                <div>
                  <h3 id="focus-history-title">Letzte Sitzungen</h3>
                  <span>Gesamt: {formatFocusDuration(measuredFocusSeconds)}</span>
                </div>
                {focusSessions.filter((session) => session.status === "completed").length ? (
                  <ul>
                    {focusSessions
                      .filter((session) => session.status === "completed")
                      .slice(0, 8)
                      .map((session) => (
                        <li key={session.id}>
                          <span>
                            <strong>{session.contextTitle}</strong>
                            <small>{session.startedAt ? formatDate(session.startedAt.slice(0, 10), true) : "Gespeichert"}</small>
                          </span>
                          <b>{formatFocusDuration(session.accumulatedSeconds)}</b>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="empty-state">Nach dem Beenden erscheint deine erste gespeicherte Sitzung hier.</p>
                )}
              </section>
            </div>
          </section>
        </div>
      )}

      {loading && <div className="loading-line" aria-label="Wird geladen" />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function WeekCard({
  week,
  completed,
  activeDayId,
  query,
  settings,
  notes,
  attachments,
  uploadingDayId,
  setNotes,
  onToggle,
  onSaveNote,
  onUploadFiles,
  onOpenAttachment,
  onDeleteAttachment,
  onReveal,
  onStartFocus,
}: {
  week: PlanWeek;
  completed: Set<string>;
  activeDayId: string | null;
  query: string;
  settings: TrackerSettings;
  notes: Record<string, string>;
  attachments: Record<string, AttachmentMeta[]>;
  uploadingDayId: string | null;
  setNotes: (value: Record<string, string>) => void;
  onToggle: (itemId: string, checked: boolean, day: PlannedDay) => void;
  onSaveNote: (dayId: string) => void;
  onUploadFiles: (dayId: string, files: File[]) => void;
  onOpenAttachment: (attachment: AttachmentMeta) => void;
  onDeleteAttachment: (attachment: AttachmentMeta) => void;
  onReveal: (day: PlannedDay) => void;
  onStartFocus: (day: PlannedDay) => void;
}) {
  const weekDone = week.days.reduce(
    (sum, day) =>
      sum +
      day.tasks.reduce(
        (taskSum, task) =>
          taskSum + task.items.filter((item) => completed.has(item.id)).length,
        0,
      ),
    0,
  );
  const weekTotal = week.days.length * 9;

  return (
    <details className="week-card">
      <summary>
        <span className="summary-marker"><Icon name="arrow" size={18} /></span>
        <span className="week-badge">Woche {displayNumber(week.number)}</span>
        <span className="summary-main">
          <strong>{week.title}</strong>
          <small>{week.goal}</small>
        </span>
        <span className="week-progress-group">
          <span className="completion-chip">{displayNumber(weekDone)} / {displayNumber(weekTotal)}</span>
          <ProgressRing
            percent={weekTotal ? (weekDone / weekTotal) * 100 : 0}
            label={`Fortschritt Woche ${week.number}`}
            compact
          />
        </span>
      </summary>
      <div className="day-stack">
        {week.days.map((day) => (
          <DayCard
            key={day.id}
            day={day}
            active={activeDayId === day.id}
            query={query}
            completed={completed}
            settings={settings}
            note={notes[day.id] ?? ""}
            attachments={attachments[day.id] ?? []}
            uploading={uploadingDayId === day.id}
            onNoteChange={(note) => setNotes({ ...notes, [day.id]: note })}
            onToggle={onToggle}
            onSaveNote={onSaveNote}
            onUploadFiles={onUploadFiles}
            onOpenAttachment={onOpenAttachment}
            onDeleteAttachment={onDeleteAttachment}
            onReveal={onReveal}
            onStartFocus={onStartFocus}
          />
        ))}
      </div>
    </details>
  );
}

function DayCard({
  day,
  active,
  query,
  completed,
  settings,
  note,
  attachments,
  uploading,
  onNoteChange,
  onToggle,
  onSaveNote,
  onUploadFiles,
  onOpenAttachment,
  onDeleteAttachment,
  onReveal,
  onStartFocus,
}: {
  day: PlannedDay;
  active: boolean;
  query: string;
  completed: Set<string>;
  settings: TrackerSettings;
  note: string;
  attachments: AttachmentMeta[];
  uploading: boolean;
  onNoteChange: (value: string) => void;
  onToggle: (itemId: string, checked: boolean, day: PlannedDay) => void;
  onSaveNote: (dayId: string) => void;
  onUploadFiles: (dayId: string, files: File[]) => void;
  onOpenAttachment: (attachment: AttachmentMeta) => void;
  onDeleteAttachment: (attachment: AttachmentMeta) => void;
  onReveal: (day: PlannedDay) => void;
  onStartFocus: (day: PlannedDay) => void;
}) {
  const count = day.tasks.reduce(
    (sum, task) =>
      sum + task.items.filter((item) => completed.has(item.id)).length,
    0,
  );
  const state = count === 9 ? "done" : count > 0 ? "started" : "open";
  const stateLabel = state === "done" ? "Abgeschlossen" : state === "started" ? "In Arbeit" : "Noch nicht begonnen";
  const effectiveDate = shiftedPlanDate(day.date, settings.planStartDate);
  const taskProgress = day.tasks.map((task) => task.items.filter((item) => completed.has(item.id)).length);
  const currentTaskIndex = taskProgress.findIndex((done) => done < 3);
  const focusTaskIndex = currentTaskIndex < 0 ? day.tasks.length - 1 : currentTaskIndex;
  const focusMinutes = workModeTaskMinutes(settings.dailyWorkMode, focusTaskIndex);
  const planIsRunning = settings.planStatus === "running";

  return (
    <details
      className={`day-card ${state} ${active ? "search-hit" : ""}`}
      id={`day-${day.id}`}
      tabIndex={-1}
    >
      <summary>
        <span className="summary-marker"><Icon name="arrow" size={17} /></span>
        <time dateTime={effectiveDate}>{formatDate(effectiveDate)}</time>
        <span className="summary-main">
          <strong><Highlight text={day.title} query={active ? query : ""} /></strong>
          <small>{day.module} · Ergebnis: {day.deliverable}</small>
        </span>
        <span className={`status-chip ${state}`}>{stateLabel} · {displayNumber(count)}/9</span>
        <button
          className="day-focus-button"
          type="button"
          disabled={!planIsRunning}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!planIsRunning) return;
            onStartFocus(day);
          }}
        >
          <Icon name="play" size={17} /> {planIsRunning ? `Fokus starten · ${displayNumber(focusMinutes)} Min.` : "Vorschau"}
        </button>
      </summary>
      <div className="day-body">
        <div className="day-intro-grid">
          <article className="reason-card">
            <span>Warum heute?</span>
            <p><Highlight text={day.why} query={active ? query : ""} /></p>
          </article>
          <article className="output-card">
            <span>Heutige Ziellinie</span>
            <p className="ltr-inline">{day.deliverable}</p>
            <button className="text-button" type="button" onClick={() => onReveal(day)}>
              Direktlink zu diesem Tag
            </button>
          </article>
        </div>

        <div className="context-grid">
          <section>
            <h4>Wonach soll ich suchen?</h4>
            <ul>
              {day.lookFor.map((item) => <li key={item}><Highlight text={item} query={active ? query : ""} /></li>)}
            </ul>
          </section>
          <section>
            <h4>Bezug zum Exposé</h4>
            <div className="tag-list">
              {day.proposal.map((item) => <span key={item}>§ {item}</span>)}
            </div>
            <p className="module-line"><strong>Projektmodul:</strong> <span className="ltr-inline">{day.module}</span></p>
          </section>
        </div>

        <section className="sources-block">
          <h4><Icon name="book" size={18} /> Genaue Quelle für heute</h4>
          <div className="source-list">
            {day.sourceIds.map((sourceId) => {
              const source = sources[sourceId];
              if (!source) return null;
              const href = sourceHref(source, settings);
              const meta = priorityMeta[source.priority];
              const driveId = googleDriveFileId(href);
              const focus = source.id === "proposal"
                ? `Exposé-Abschnitte: ${day.proposal.map((item) => `§ ${item}`).join(" · ")}`
                : day.lookFor.join(" · ");
              const readerHref = pdfReaderHref(source, settings, {
                focus,
                context: `${day.title} · ${day.module}`,
              });
              const downloadHref = googleDriveDownloadHref(href);
              return (
                <article key={source.id}>
                  <div>
                    <span className={`priority priority-${source.priority}`} title={meta.label}>
                      {meta.stars}
                    </span>
                    <strong><Highlight text={sourceText(source, settings)} query={active ? query : ""} /></strong>
                  </div>
                  {source.driveName && (
                    <code dir="ltr"><Highlight text={source.driveName} query={active ? query : ""} /></code>
                  )}
                  {source.id === "proposal" && (
                    <p className="source-focus"><strong>Lesefokus:</strong> {focus}</p>
                  )}
                  {readerHref ? (
                    <div className="source-actions" aria-label={`Aktionen für ${sourceText(source, settings)}`}>
                      <a
                        className="source-action primary"
                        href={readerHref}
                        title="Normal klicken: hier öffnen. Rechtsklick: in neuem Tab oder Fenster öffnen."
                      >
                        <Icon name="book" size={15} /> Im PDF Reader öffnen
                      </a>
                      {driveId && href && (
                        <details className="source-more">
                          <summary aria-label={`Weitere Aktionen für ${sourceText(source, settings)}`}>⋯</summary>
                          <div>
                            <a href={href} target="_blank" rel="noopener noreferrer">
                              <Icon name="link" size={15} /> In Google Drive öffnen
                            </a>
                            {downloadHref && (
                              <a href={downloadHref} target="_blank" rel="noopener noreferrer">
                                <Icon name="download" size={15} /> PDF herunterladen
                              </a>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  ) : href ? (
                    <div className="source-actions">
                      <a className="source-action primary" href={href} {...internalLinkProps(href)}>
                        <Icon name="link" size={15} /> Originalquelle öffnen
                      </a>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
          {day.recording && <p className="recording"><strong>Kurs/Aufzeichnung:</strong> {day.recording}</p>}
        </section>

        <div className="task-stack">
          {day.tasks.map((task, taskIndex) => {
            const taskDone = taskProgress[taskIndex] ?? 0;
            const taskState = taskDone === 3 ? "done" : taskIndex === currentTaskIndex ? "current" : "open";
            const taskStateLabel = taskState === "done" ? "Erledigt" : taskState === "current" ? "In Arbeit" : "Offen";
            const plannedMinutes = workModeTaskMinutes(settings.dailyWorkMode, taskIndex);
            return (
              <details className={`task-card ${taskState}`} key={task.id}>
                <summary>
                  <span className="summary-marker"><Icon name="arrow" size={16} /></span>
                  <span className="task-index">{task.title.slice(0, 2)}</span>
                  <span className="summary-main">
                    <strong>{task.title.slice(3)}</strong>
                    <small>{displayNumber(plannedMinutes)} Minuten Fokus</small>
                  </span>
                  <span className="task-metadata">
                    <span className={`task-state ${taskState}`}>{taskStateLabel}</span>
                    <span>{displayNumber(plannedMinutes)} Min.</span>
                    <span>{displayNumber(taskDone)}/3 Aufgaben</span>
                  </span>
                </summary>
                <div className="checklist">
                  {task.items.map((item) => (
                    <label key={item.id} className={completed.has(item.id) ? "checked" : ""}>
                      <input
                        type="checkbox"
                        disabled={!planIsRunning}
                        checked={completed.has(item.id)}
                        onChange={(event) => {
                          if (planIsRunning) onToggle(item.id, event.target.checked, day);
                        }}
                      />
                      <span className="custom-check"><Icon name="check" size={15} /></span>
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </details>
            );
          })}
        </div>

        <p className="break-note">
          <Icon name="clock" size={17} />
          {settings.dailyWorkMode === "rescue"
            ? "12 Minuten Rettungsmodus ohne Pflichtpause. Offene Arbeit bleibt erhalten."
            : settings.dailyWorkMode === "light"
              ? "70 Minuten Arbeit in drei Fokusblöcken + eine Pause von 10 Minuten."
              : "210 Minuten Arbeit + zwei Pausen à 15 Minuten = 4 Stunden."}
        </p>

        <section className="note-box">
          <label htmlFor={`note-${day.id}`}>
            <Icon name="note" size={18} /> Tagesabschlussnotiz
          </label>
          <textarea
            id={`note-${day.id}`}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Was habe ich verstanden? Was hat funktioniert? Wo mache ich morgen genau weiter?"
          />
          <div>
            <span>{displayNumber(note.length)} Zeichen</span>
            <button className="button secondary compact" type="button" onClick={() => onSaveNote(day.id)}>
              Notiz speichern
            </button>
          </div>
        </section>

        <section className="attachment-box" aria-labelledby={`attachments-${day.id}`}>
          <div className="attachment-heading">
            <div>
              <h4 id={`attachments-${day.id}`}>
                <Icon name="paperclip" size={18} /> Dateien und Bilder
              </h4>
              <p>Die Dateien bleiben dauerhaft mit diesem Lerntag verknüpft.</p>
            </div>
            <span>{displayNumber(attachments.length)} Datei(en)</span>
          </div>

          <label
            className={`attachment-dropzone ${uploading ? "uploading" : ""}`}
            htmlFor={`files-${day.id}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (!uploading) onUploadFiles(day.id, Array.from(event.dataTransfer.files));
            }}
          >
            <input
              id={`files-${day.id}`}
              className="visually-hidden"
              type="file"
              multiple
              disabled={uploading}
              onChange={(event) => {
                onUploadFiles(day.id, Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
            <span className="attachment-upload-icon">
              <Icon name="upload" size={21} />
            </span>
            <span>
              <strong>{uploading ? "Dateien werden gespeichert …" : "Dateien hier ablegen oder auswählen"}</strong>
              <small>Bilder, PDF, Office, Text, Audio, Video und weitere Formate · maximal 25 MB je Datei</small>
            </span>
          </label>

          {attachments.length > 0 && (
            <div className="attachment-grid">
              {attachments.map((attachment) => {
                const kind = attachmentKind(attachment);
                return (
                  <article className="attachment-card" key={attachment.id}>
                    <button
                      className="attachment-open"
                      type="button"
                      onClick={() => onOpenAttachment(attachment)}
                      aria-label={`${attachment.name} ansehen`}
                    >
                      <span className={`attachment-thumb ${kind}`}>
                        {kind === "image" ? (
                          // The same-origin route enforces the signed-in owner before serving bytes.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/attachments?id=${encodeURIComponent(attachment.id)}`}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          <Icon name={kind === "pdf" ? "book" : kind === "text" ? "note" : "file"} />
                        )}
                      </span>
                      <span className="attachment-meta">
                        <strong title={attachment.name}>{attachment.name}</strong>
                        <small>{formatFileSize(attachment.size)} · {kind === "other" ? "Datei" : kind.toUpperCase()}</small>
                      </span>
                      <span className="attachment-view"><Icon name="eye" size={17} /> Ansehen</span>
                    </button>
                    <button
                      className="attachment-delete"
                      type="button"
                      onClick={() => onDeleteAttachment(attachment)}
                      aria-label={`${attachment.name} löschen`}
                      title="Datei löschen"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </details>
  );
}

function IntegrationCard({
  name,
  status,
  tone,
  summary,
  href,
  expanded,
  children,
}: {
  name: string;
  status: string;
  tone: "ready" | "warning" | "blocked" | "neutral";
  summary: string;
  href?: string;
  expanded: boolean;
  children: ReactNode;
}) {
  return (
    <article className="integration-card">
      <header>
        <span className="integration-logo">{name.slice(0, 1)}</span>
        <div>
          <h3>{name}</h3>
          <span className={`connection-state ${tone}`}>{status}</span>
        </div>
      </header>
      <p>{summary}</p>
      {expanded && <div className="integration-detail">{children}</div>}
      {href && (
        <a href={href} {...internalLinkProps(href)}>
          {href.startsWith("/") ? "In dieser App öffnen" : "Adresse öffnen"} <Icon name="link" size={15} />
        </a>
      )}
    </article>
  );
}

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function localIcsDate(date: string, minutesFromMidnight: number) {
  const dayOffset = Math.floor(minutesFromMidnight / 1440);
  const minuteOfDay = ((minutesFromMidnight % 1440) + 1440) % 1440;
  const base = new Date(`${date}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + dayOffset);
  const datePart = base.toISOString().slice(0, 10).replace(/-/g, "");
  const hours = String(Math.floor(minuteOfDay / 60)).padStart(2, "0");
  const minutes = String(minuteOfDay % 60).padStart(2, "0");
  return `${datePart}T${hours}${minutes}00`;
}
