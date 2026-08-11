"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- full reload keeps route-scoped reader styles isolated */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PdfDocument, {
  type PdfSelection,
  type PdfSelectionMenuPosition,
} from "./components/PdfDocument";
import { isPdfProviderFailureMessage, upsertPdfMark, validatePdfMarks, type PdfAnchor, type PdfMark, type PdfMarkVisual } from "../../lib/pdf-marks";
import { sanitizePdfReaderStateStore, type PdfReaderState } from "../../lib/pdf-reader-state";
import { DEFAULT_OPENAI_MODEL } from "../model-config";
import type { ReaderConnectionStatus } from "@cross-repo/contracts";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import {
  friendlyGoogleDriveError,
  googleDriveApiConsoleUrl,
  isGoogleDriveApiDisabled,
} from "../../lib/google-errors";
import {
  currentSessionSeconds,
  isTimedSessionState,
  readDeviceSessions,
  transitionTimedSession,
  writeDeviceSessions,
} from "../../lib/device-session-store";
import { DEVICE_ONLY_STORAGE } from "../../lib/storage-mode";

type Tab = "ai" | "translate" | "notes";
type Tone = PdfMarkVisual["tone"];
type MarkType = PdfMarkVisual["type"];
type Mark = PdfMark;
type DriveFile = { id: string; name: string; modifiedTime?: string; size?: string };
type DriveTarget = { kind: "file" | "folder" | "invalid"; id: string };
type GoogleConnectionStatus = {
  configured: boolean;
  connected: boolean;
  state: string;
  account?: string;
  message?: string;
  services?: { calendar?: boolean; drive?: boolean; gmail?: boolean };
};
type StudySession = {
  id: string;
  documentId: string;
  documentName: string;
  documentKind: string;
  status: "running" | "paused" | "completed";
  activeSeconds: number;
  startedAt: string | null;
  lastStartedAt: string | null;
  endedAt: string | null;
  startPage: number;
  endPage: number;
};
type ExposeMetadata = {
  custom?: boolean;
  fileName?: string;
  name?: string;
};
type SelectionMenuState = PdfSelectionMenuPosition;

const sampleText =
  "Design science creates and evaluates artifacts intended to solve identified organizational problems. Behavioral science develops and justifies theories that explain or predict human or organizational phenomena.";

const toneLabels: Record<Tone, string> = {
  yellow: "Wichtig",
  green: "Definition",
  blue: "Beispiel",
  pink: "Frage",
  red: "Prüfen",
};

const targetLanguages: Record<string, string> = { DE: "Deutsch", EN: "Englisch", FA: "Persisch" };
const MAX_PDF_BYTES = 200 * 1024 * 1024;
const MARK_STORE = "research-pdf-studio:marks:v2";
const READER_STATE_STORE = "research-pdf-studio:reader-state:v1";
const STUDY_SESSION_STORE = "research-pdf-studio:study-sessions:v1";
const ZOOM_LEVELS = [0.65, 0.75, 1, 1.25, 1.5, 1.8, 2, 2.5, 3, 4] as const;
const DRIVE_ID = /^[a-zA-Z0-9_-]{10,200}$/;
const BUNDLED_EXPOSE_FILE_NAME =
  "Cross_Repository_Code_Intelligence_Expose_DE_2026_v2_4.pdf";
const BUNDLED_EXPOSE_URL = "/expose.pdf";

function sessionSeconds(session: StudySession, now = Date.now()) {
  return currentSessionSeconds(session, session.activeSeconds, now);
}

function isStudySession(value: unknown): value is StudySession {
  if (!isTimedSessionState(value)) return false;
  const session = value as Record<string, unknown>;
  return typeof session.id === "string"
    && typeof session.documentId === "string"
    && typeof session.documentName === "string"
    && typeof session.documentKind === "string"
    && typeof session.activeSeconds === "number"
    && Number.isFinite(session.activeSeconds)
    && (typeof session.startedAt === "string" || session.startedAt === null)
    && typeof session.startPage === "number"
    && typeof session.endPage === "number";
}

const readLocalStudySessions = () => readDeviceSessions(STUDY_SESSION_STORE, isStudySession);
const writeLocalStudySessions = (sessions: StudySession[]) => writeDeviceSessions(STUDY_SESSION_STORE, sessions);

function formatTimer(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function postToEmbeddingParent(message: Record<string, unknown>) {
  if (window.parent === window || !document.referrer) return;
  try {
    window.parent.postMessage(message, new URL(document.referrer).origin);
  } catch {
    // Invalid referrers never receive selections or mark data.
  }
}

function extractDriveTarget(value: string): DriveTarget {
  const trimmed = value.trim();
  const folder = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1];
  if (folder) return { kind: "folder", id: folder };
  const file = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];
  if (file) return { kind: "file", id: file };
  if (/^[a-zA-Z0-9_-]{10,200}$/.test(trimmed)) return { kind: "file", id: trimmed };
  return { kind: "invalid", id: "" };
}

function safeFileName(name: string) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").trim() || "research-document";
}

function textDirection(value: string) {
  return /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/.test(value) ? "rtl" : "ltr";
}

function cleanSelectedText(value: string) {
  return value.replace(/([\p{L}\p{N}])-\s+([\p{L}\p{N}])/gu, "$1$2").replace(/\s+/g, " ").trim();
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFileName(name);
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

const validateMarks = validatePdfMarks;

function readMarkStore(): Record<string, Mark[]> {
  try {
    const parsed = JSON.parse(localStorage.getItem(MARK_STORE) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, validateMarks(value)]));
  } catch {
    return {};
  }
}

function readReaderStateStore(): Record<string, PdfReaderState> {
  try {
    return sanitizePdfReaderStateStore(JSON.parse(localStorage.getItem(READER_STATE_STORE) || "{}"));
  } catch {
    return {};
  }
}

async function documentFingerprint(bytes: ArrayBuffer) {
  const head = bytes.slice(0, Math.min(bytes.byteLength, 2 * 1024 * 1024));
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", head);
    return Array.from(new Uint8Array(digest).slice(0, 12), (part) => part.toString(16).padStart(2, "0")).join("");
  }

  // Deterministic local-preview fallback for non-secure HTTP contexts where
  // WebCrypto is unavailable. This ID identifies marks; it is not a secret or
  // a cryptographic trust decision.
  const data = new Uint8Array(head);
  const hashes = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b];
  for (const byte of data) {
    for (let index = 0; index < hashes.length; index += 1) {
      hashes[index] = Math.imul((hashes[index] ^ byte) >>> 0, 0x01000193) >>> 0;
    }
  }
  return hashes
    .map((hash, index) => ((hash ^ Math.imul(bytes.byteLength, index + 1)) >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

export default function Home() {
  const [embed, setEmbed] = useState(false);
  const [tab, setTab] = useState<Tab>("ai");
  const [panelWidth, setPanelWidth] = useState(470);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"normal" | "wide">("normal");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectedPage, setSelectedPage] = useState(1);
  const [selectedAnchor, setSelectedAnchor] = useState<PdfAnchor | undefined>();
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenuState | null>(null);
  const [selectionCommentOpen, setSelectionCommentOpen] = useState(false);
  const [selectionComment, setSelectionComment] = useState("");
  const [question, setQuestion] = useState("Erkläre diesen Abschnitt einfach und wissenschaftlich.");
  const [answer, setAnswer] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [translation, setTranslation] = useState("");
  const [translationError, setTranslationError] = useState("");
  const [note, setNote] = useState("");
  const [editingMarkId, setEditingMarkId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState("");
  const [editingTranslation, setEditingTranslation] = useState("");
  const [busy, setBusy] = useState(false);
  const [driveBusy, setDriveBusy] = useState(false);
  const [tone, setTone] = useState<Tone>("yellow");
  const [markType, setMarkType] = useState<MarkType>("highlight");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [documentId, setDocumentId] = useState("sample");
  const [storageReady, setStorageReady] = useState(false);
  const [query, setQuery] = useState("");
  const [toneFilter, setToneFilter] = useState<Tone | "all">("all");
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pdfName, setPdfName] = useState("Hevner et al. · Design Science in Information Systems Research");
  const [readerFocus, setReaderFocus] = useState("");
  const [readerContext, setReaderContext] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [driveLink, setDriveLink] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveError, setDriveError] = useState("");
  const [readerError, setReaderError] = useState<{ message: string; sourceHref?: string } | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("DE");
  const [toast, setToast] = useState("");
  const [connections, setConnections] = useState({ drive: false, calendar: false, openai: false, deepl: false });
  const [providerDetails, setProviderDetails] = useState<ReaderConnectionStatus["providers"]>({
    openai: { configured: false, state: "not_configured", metadata: {}, testedAt: null },
    deepl: { configured: false, state: "not_configured", metadata: {}, testedAt: null },
  });
  const [embedCode, setEmbedCode] = useState("");
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerActive, setTimerActive] = useState<StudySession | null>(null);
  const [timerSessions, setTimerSessions] = useState<StudySession[]>([]);
  const [timerNow, setTimerNow] = useState(() => Date.now());
  const [timerBusy, setTimerBusy] = useState(false);
  const [timerStoredSeconds, setTimerStoredSeconds] = useState(0);
  const dragStart = useRef<{ x: number; width: number } | null>(null);
  const requestedPage = useRef<number | null>(null);
  const selectionMenuRef = useRef<HTMLDivElement>(null);

  const refreshProviderConnections = useCallback(async () => {
    try {
      const [providerResponse, googleResponse] = await Promise.all([
        fetch("/api/status", { cache: "no-store" }),
        fetch("/api/google/status", { cache: "no-store" }),
      ]);
      const providerStatus = providerResponse.ok ? await providerResponse.json() as ReaderConnectionStatus : null;
      const googleStatus = googleResponse.ok ? await googleResponse.json() as GoogleConnectionStatus : null;
      setConnections((value) => ({
        ...value,
        openai: providerStatus?.openai ?? value.openai,
        deepl: providerStatus?.deepl ?? value.deepl,
        calendar: Boolean(googleStatus?.connected && googleStatus.services?.calendar),
        drive: Boolean(googleStatus?.connected && googleStatus.services?.drive),
      }));
      if (providerStatus) {
        setProviderDetails(providerStatus.providers);
        if (providerStatus.googleClientId) setGoogleClientId((current) => current || providerStatus.googleClientId);
      }
    } catch {
      // Keep the reader usable offline; Settings remains the source of truth.
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = Number(params.get("page"));
    requestedPage.current = Number.isInteger(page) && page > 0 ? page : null;
    const timer = window.setTimeout(() => {
      setReaderFocus(params.get("focus")?.trim().slice(0, 600) || "");
      setReaderContext(params.get("context")?.trim().slice(0, 600) || "");
      setEmbed(params.get("embed") === "1");
      const savedWidth = Number(localStorage.getItem("pdf-studio-panel-width"));
      if (savedWidth) setPanelWidth(Math.min(760, Math.max(360, savedWidth)));
      setGoogleClientId(localStorage.getItem("pdf-studio-google-client-id") || "");
      setTargetLanguage(localStorage.getItem("pdf-studio-target-language") || "DE");
      const savedZoom = Number(localStorage.getItem("pdf-studio-zoom"));
      if (Number.isFinite(savedZoom) && savedZoom >= 0.65 && savedZoom <= 4) {
        setZoom(savedZoom);
      }
      const store = readMarkStore();
      const readerState = readReaderStateStore().sample;
      let legacyMarks: Mark[] = [];
      try {
        const legacy = localStorage.getItem("pdf-studio-marks");
        if (legacy) legacyMarks = validateMarks(JSON.parse(legacy));
      } catch {
        legacyMarks = [];
      }
      setMarks(store.sample ?? legacyMarks);
      if (readerState) {
        setCurrentPage(readerState.page);
        setSelectedText(readerState.selectedText);
        setSelectedPage(readerState.selectedPage);
        setQuestion(readerState.question || "Erkläre diesen Abschnitt einfach und wissenschaftlich.");
        setAnswer(isPdfProviderFailureMessage(readerState.answer) ? "" : readerState.answer);
        setTranslation(isPdfProviderFailureMessage(readerState.translation) ? "" : readerState.translation);
      }
      setStorageReady(true);
      setEmbedCode(`<iframe src="${window.location.origin}/pdf-reader?embed=1" allow="clipboard-write" width="100%" height="900"></iframe>`);
      void refreshProviderConnections().then(() => {
        const googleResult = params.get("google");
        if (!googleResult) return;
        const message = googleResult === "connected"
          ? "Google Calendar und Drive wurden verbunden."
          : googleResult === "cancelled"
            ? "Die Google-Anmeldung wurde abgebrochen."
            : googleResult === "config"
              ? "Die Google-Konfiguration der Installation fehlt. Bitte die App reparieren."
              : "Die Google-Verbindung konnte nicht bestätigt werden.";
        setToast(message);
        window.setTimeout(() => setToast(""), 3_200);
        params.delete("google");
        const queryString = params.toString();
        window.history.replaceState(null, "", `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshProviderConnections]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshProviderConnections();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshProviderConnections]);

  useEffect(() => {
    const compactViewport = window.matchMedia("(max-width: 720px)");
    const keepReaderVisible = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) setPanelOpen(false);
    };
    keepReaderVisible(compactViewport);
    compactViewport.addEventListener("change", keepReaderVisible);
    return () => compactViewport.removeEventListener("change", keepReaderVisible);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem("pdf-studio-zoom", String(zoom));
  }, [storageReady, zoom]);

  useEffect(() => {
    let active = true;
    if (DEVICE_ONLY_STORAGE) {
      const sessions = readLocalStudySessions();
      queueMicrotask(() => {
        if (!active) return;
        setTimerActive(sessions.find((session) => session.status !== "completed") ?? null);
        setTimerSessions(sessions);
        setTimerStoredSeconds(sessions
          .filter((session) => session.status === "completed")
          .reduce((sum, session) => sum + session.activeSeconds, 0));
      });
      return () => { active = false; };
    }
    void fetch("/api/study-sessions", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<{ active?: StudySession | null; sessions?: StudySession[]; storedSeconds?: number }>;
      })
      .then((data) => {
        if (!active) return;
        setTimerActive(data.active ?? null);
        setTimerSessions(data.sessions ?? []);
        setTimerStoredSeconds(Number(data.storedSeconds ?? 0));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (timerActive?.status !== "running") return;
    const interval = window.setInterval(() => setTimerNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [timerActive?.status]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      let trusted = event.origin === window.location.origin;
      if (!trusted && document.referrer) {
        try { trusted = event.origin === new URL(document.referrer).origin; } catch { trusted = false; }
      }
      if (!trusted) return;
      if (event.data.type === "research-pdf-studio:set-selection" && typeof event.data.payload === "string") {
        setSelectedText(event.data.payload);
        setSelectedPage(currentPage);
        setSelectedAnchor(undefined);
        setSelectedMarkId(null);
        setAnswer("");
        setAnswerError("");
        setTranslation("");
        setTranslationError("");
        setPanelOpen(true);
      }
      if (event.data.type === "research-pdf-studio:open-drive-file" && typeof event.data.payload === "string") {
        setDriveLink(event.data.payload);
        setSettingsOpen(true);
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem("pdf-studio-panel-width", String(panelWidth));
  }, [panelWidth]);

  useEffect(() => {
    if (!storageReady) return;
    const store = readMarkStore();
    store[documentId] = marks;
    localStorage.setItem(MARK_STORE, JSON.stringify(store));
    postToEmbeddingParent({ type: "research-pdf-studio:marks", payload: marks });
  }, [documentId, marks, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    try {
      const store = readReaderStateStore();
      store[documentId] = {
        page: currentPage,
        selectedText,
        selectedPage,
        question,
        answer,
        translation,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(READER_STATE_STORE, JSON.stringify(store));
    } catch {
      // Quota or private-mode failures must not interrupt reading.
    }
  }, [answer, currentPage, documentId, question, selectedPage, selectedText, storageReady, translation]);

  useEffect(() => {
    localStorage.setItem("pdf-studio-google-client-id", googleClientId);
    localStorage.setItem("pdf-studio-target-language", targetLanguage);
  }, [googleClientId, targetLanguage]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragStart.current) return;
      setPanelWidth(Math.min(760, Math.max(360, dragStart.current.width + dragStart.current.x - event.clientX)));
    };
    const up = () => (dragStart.current = null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const filteredMarks = useMemo(
    () => marks.filter((item) => {
      const matchesTone = toneFilter === "all" || item.tone === toneFilter;
      const matchesText = `${item.text} ${item.note ?? ""} ${item.translation ?? ""}`.toLowerCase().includes(query.toLowerCase());
      return matchesTone && matchesText;
    }),
    [marks, query, toneFilter],
  );
  const driveApiUrl = useMemo(
    () => googleDriveApiConsoleUrl(googleClientId),
    [googleClientId],
  );
  const driveApiDisabled = isGoogleDriveApiDisabled(driveError);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3_200);
  };

  const applyPdf = async (bytes: ArrayBuffer, name: string) => {
    if (bytes.byteLength > MAX_PDF_BYTES) throw new Error("Die PDF ist größer als 200 MB.");
    const signature = new TextDecoder().decode(bytes.slice(0, 5));
    if (signature !== "%PDF-") throw new Error("Die ausgewählte Datei ist keine gültige PDF.");
    const id = await documentFingerprint(bytes);
    const savedReaderState = readReaderStateStore()[id];
    setPdfBytes(bytes);
    setReaderError(null);
    setDocumentId(id);
    setMarks(readMarkStore()[id] ?? []);
    setPdfName(name.replace(/\.pdf$/i, ""));
    setSelectedText(savedReaderState?.selectedText ?? "");
    setSelectedPage(savedReaderState?.selectedPage ?? 1);
    setSelectedAnchor(undefined);
    setSelectedMarkId(null);
    setSelectionMenu(null);
    setSelectionCommentOpen(false);
    setSelectionComment("");
    setQuestion(savedReaderState?.question || "Erkläre diesen Abschnitt einfach und wissenschaftlich.");
    setAnswer(isPdfProviderFailureMessage(savedReaderState?.answer) ? "" : savedReaderState?.answer ?? "");
    setAnswerError("");
    setTranslation(isPdfProviderFailureMessage(savedReaderState?.translation) ? "" : savedReaderState?.translation ?? "");
    setTranslationError("");
    setCurrentPage(requestedPage.current ?? savedReaderState?.page ?? 1);
    setPageCount(1);
  };

  const fetchDrivePdf = async (fileId: string) => {
    let response = await fetch(`/api/google/drive?fileId=${encodeURIComponent(fileId)}`);
    if (!response.ok) {
      const internal = (await response.json().catch(() => ({}))) as { message?: string };
      const internalMessage = friendlyGoogleDriveError(internal.message);
      if (response.status === 403 && isGoogleDriveApiDisabled(internalMessage)) {
        throw new Error(internalMessage);
      }
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        response = await fetch(`/api/drive/public?fileId=${encodeURIComponent(fileId)}`);
      } else {
        throw new Error(internalMessage);
      }
    }
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(friendlyGoogleDriveError(data.message || "Die Drive-PDF konnte nicht geöffnet werden."));
    }
    return response.arrayBuffer();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("document") !== "expose" || params.get("driveId")) return;
    let cancelled = false;
    const requestedName =
      params.get("name")?.trim() || BUNDLED_EXPOSE_FILE_NAME;

    const openExpose = async () => {
      let metadata: ExposeMetadata = {
        custom: false,
        fileName: requestedName,
      };
      try {
        const metadataResponse = await fetch("/api/expose?meta=1", {
          cache: "no-store",
        });
        if (metadataResponse.ok) {
          const payload = await metadataResponse.json() as {
            expose?: ExposeMetadata;
          };
          if (payload.expose) metadata = payload.expose;
        }
      } catch {
        // A local database is optional; the bundled Exposé remains readable.
      }

      let response = await fetch("/api/expose", { cache: "no-store" });
      let fileName = metadata.fileName || metadata.name || requestedName;
      let custom = Boolean(metadata.custom);
      if (response.status === 404) {
        response = await fetch(BUNDLED_EXPOSE_URL, { cache: "no-store" });
        fileName = BUNDLED_EXPOSE_FILE_NAME;
        custom = false;
      }
      if (!response.ok) {
        throw new Error("Das Exposé konnte nicht geladen werden.");
      }
      const bytes = await response.arrayBuffer();
      if (cancelled) return;
      await applyPdf(bytes, fileName);
      if (!cancelled) {
        showToast(custom
          ? "Dein aktuelles Exposé im PDF Reader geöffnet"
          : "Projekt-Exposé im PDF Reader geöffnet");
      }
    };

    void openExpose().catch((error) => {
      if (!cancelled) {
        const message = error instanceof Error ? error.message : "Das Exposé konnte nicht geladen werden.";
        setReaderError({ message });
        showToast(message);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const driveId = params.get("driveId")?.trim() || "";
    if (!driveId) return;
    if (!DRIVE_ID.test(driveId)) {
      const message = "Die übergebene Google-Drive-Datei-ID ist ungültig.";
      window.setTimeout(
        () => {
          setReaderError({ message });
          showToast(message);
        },
        0,
      );
      return;
    }

    const requestedName = safeFileName(
      params.get("name")?.trim() || `Google-Drive-${driveId}.pdf`,
    );
    let cancelled = false;

    const openDeepLinkedDrivePdf = async () => {
      setDriveBusy(true);
      const sourceHref = `https://drive.google.com/file/d/${encodeURIComponent(driveId)}/view`;
      setDriveLink(sourceHref);
      setPdfName(requestedName.replace(/\.pdf$/i, ""));
      try {
        if (cancelled) return;
        await applyPdf(await fetchDrivePdf(driveId), requestedName);
        if (cancelled) return;
        setConnections((value) => ({ ...value, drive: true }));
        showToast(`${requestedName} aus Google Drive geöffnet`);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error
          ? error.message
          : "Die Drive-PDF konnte nicht geöffnet werden.";
        setReaderError({ message, sourceHref });
        showToast(message);
      } finally {
        if (!cancelled) setDriveBusy(false);
      }
    };

    void openDeepLinkedDrivePdf();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sourceUrl = params.get("sourceUrl")?.trim() || "";
    const originalSourceUrl = params.get("originalSourceUrl")?.trim() || "";
    if (!sourceUrl || params.get("driveId") || params.get("document") === "expose") return;
    let cancelled = false;
    const requestedName = safeFileName(
      params.get("name")?.trim() || "Öffentliche-PDF.pdf",
    );

    const openPublicPdf = async () => {
      setDriveBusy(true);
      setPdfName(requestedName.replace(/\.pdf$/i, ""));
      try {
        const response = await fetch(
          `/api/pdf/public?url=${encodeURIComponent(sourceUrl)}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          const payload = await response.json().catch(() => ({})) as { message?: string };
          throw new Error(payload.message || "Die ausgewählte PDF konnte nicht geöffnet werden.");
        }
        if (cancelled) return;
        await applyPdf(await response.arrayBuffer(), requestedName);
        if (!cancelled) showToast(`${requestedName} im PDF Reader geöffnet`);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Die ausgewählte PDF konnte nicht geöffnet werden.";
          setReaderError({ message, sourceHref: originalSourceUrl || sourceUrl });
          showToast(message);
        }
      } finally {
        if (!cancelled) setDriveBusy(false);
      }
    };

    void openPublicPdf();
    return () => { cancelled = true; };
  }, []);

  const importLocalPdf = async (file?: File) => {
    if (!file) return;
    try {
      await applyPdf(await file.arrayBuffer(), file.name);
      showToast(`${file.name} geöffnet`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Die PDF konnte nicht geöffnet werden.");
    }
  };

  const selectionMenuPositionForRange = (): SelectionMenuState | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const rect = Array.from(range.getClientRects()).find((item) => item.width > 1 && item.height > 1)
      ?? range.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return null;
    const menuHalfWidth = 164;
    const x = Math.min(
      window.innerWidth - menuHalfWidth - 12,
      Math.max(menuHalfWidth + 12, rect.left + rect.width / 2),
    );
    const placement = rect.top < 230 ? "below" : "above";
    return { x, y: placement === "above" ? rect.top - 10 : rect.bottom + 10, placement };
  };

  const captureSampleSelection = (openMenu = false) => {
    if (pdfBytes) return false;
    const text = window.getSelection()?.toString().trim();
    if (!text) return false;
    setSelectedText(text);
    setSelectedPage(1);
    setSelectedAnchor(undefined);
    setSelectedMarkId(null);
    setAnswer("");
    setAnswerError("");
    setTranslation("");
    setTranslationError("");
    if (openMenu) {
      const position = selectionMenuPositionForRange();
      if (position) {
        setSelectionMenu(position);
        setSelectionCommentOpen(false);
        setSelectionComment("");
      }
    } else {
      setSelectionMenu(null);
      setSelectionCommentOpen(false);
      setSelectionComment("");
    }
    return true;
  };

  const addMark = (options: { tone?: Tone; type?: MarkType; note?: string; translation?: string } = {}) => {
    const cleanText = cleanSelectedText(selectedText);
    if (!cleanText) {
      showToast("Bitte zuerst Text auswählen.");
      return false;
    }
    if (cleanText.replace(/\s+/g, "").length < 2) {
      showToast("Bitte mindestens ein vollständiges Wort auswählen.");
      return false;
    }
    const id = crypto.randomUUID();
    const nextTone = options.tone ?? tone;
    const nextType = options.type ?? markType;
    const nextNote = options.note?.trim();
    const nextTranslation = options.translation?.trim();
    const next: Mark = {
      id,
      text: cleanText,
      page: selectedAnchor?.page ?? selectedPage,
      tone: nextTone,
      type: nextType,
      anchor: selectedAnchor,
      ...(nextNote ? { note: nextNote } : {}),
      ...(nextTranslation ? { translation: nextTranslation } : {}),
      createdAt: new Date().toISOString(),
    };
    setMarks((current) => upsertPdfMark(current, next));
    setSelectedMarkId(null);
    showToast(nextNote ? "Kommentar gespeichert" : nextTranslation ? "Übersetzung mit Markierung gespeichert" : `${toneLabels[nextTone]} gespeichert`);
    return true;
  };

  const deleteMark = useCallback((id: string) => {
    setMarks((current) => current.filter((mark) => mark.id !== id));
    setSelectedMarkId((current) => current === id ? null : current);
    showToast("Markierung gelöscht");
  }, []);

  const startEditingMark = (mark: Mark) => {
    setEditingMarkId(mark.id);
    setEditingComment(mark.note ?? "");
    setEditingTranslation(mark.translation ?? "");
  };

  const cancelEditingMark = () => {
    setEditingMarkId(null);
    setEditingComment("");
    setEditingTranslation("");
  };

  const saveEditedMark = (id: string) => {
    const nextComment = editingComment.trim();
    const nextTranslation = editingTranslation.trim();
    setMarks((current) => current.map((mark) => mark.id === id ? {
      ...mark,
      note: nextComment || undefined,
      translation: nextTranslation || undefined,
    } : mark));
    cancelEditingMark();
    showToast("Kommentar aktualisiert");
  };

  const eraseSelectedMarks = () => {
    const normalizedSelection = selectedText.trim().toLocaleLowerCase();
    const matching = marks.filter((mark) => {
      if (selectedMarkId) return mark.id === selectedMarkId;
      if (selectedAnchor && mark.anchor?.page === selectedAnchor.page) {
        return mark.anchor.start < selectedAnchor.end && mark.anchor.end > selectedAnchor.start;
      }
      const markedText = mark.text.trim().toLocaleLowerCase();
      return Boolean(normalizedSelection && markedText && (markedText.includes(normalizedSelection) || normalizedSelection.includes(markedText)));
    });
    if (!matching.length) return showToast("Für diese Auswahl wurde keine gespeicherte Markierung gefunden.");
    if (matching.length > 1 && !window.confirm(`${matching.length} passende Markierungen wirklich löschen?`)) return;
    const ids = new Set(matching.map((mark) => mark.id));
    setMarks((current) => current.filter((mark) => !ids.has(mark.id)));
    setSelectedMarkId(null);
    showToast(matching.length === 1 ? "Markierung mit dem Radierer gelöscht" : `${matching.length} Markierungen gelöscht`);
  };

  const deletePageMarks = () => {
    if (!marks.some((mark) => mark.page === currentPage)) return showToast("Auf dieser Seite gibt es keine Markierungen.");
    if (!window.confirm(`Alle Markierungen auf Seite ${currentPage} wirklich löschen?`)) return;
    setMarks((current) => current.filter((mark) => mark.page !== currentPage));
    showToast(`Markierungen auf Seite ${currentPage} gelöscht`);
  };

  const deleteAllMarks = () => {
    if (!marks.length) return showToast("Es gibt keine Markierungen.");
    if (!window.confirm("Alle Markierungen, Notizen und gespeicherten Ergebnisse dieses Dokuments wirklich löschen?")) return;
    setMarks([]);
    setSelectedMarkId(null);
    showToast("Alle Markierungen gelöscht");
  };

  const askAi = async (mode: "explain" | "translate" | "test" = "explain", customQuestion?: string) => {
    if (mode !== "test" && !selectedText.trim()) return showToast("Kein Text ausgewählt.");
    setBusy(true);
    if (mode === "translate") {
      setTranslation("");
      setTranslationError("");
    } else {
      setAnswer("");
      setAnswerError("");
    }
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          selectedText: mode === "test" ? "Connection test" : selectedText,
          question: customQuestion || (mode === "test" ? "Reply only with OK." : question),
          mode,
        }),
      });
      const data = (await response.json()) as { answer?: string; message?: string };
      if (!response.ok) throw new Error(data.message);
      setConnections((value) => ({ ...value, openai: true }));
      void refreshProviderConnections();
      if (mode === "translate") {
        setTranslation(data.answer || "");
        setTranslationError("");
      } else if (mode !== "test") {
        setAnswer(data.answer || "");
        setAnswerError("");
      }
      if (mode === "test") showToast("OpenAI-Verbindung erfolgreich getestet");
    } catch (error) {
      setConnections((value) => ({ ...value, openai: false }));
      const message = error instanceof Error ? error.message : "Die KI-Antwort konnte nicht geladen werden.";
      if (mode === "translate") {
        setTranslation("");
        setTranslationError(message);
      } else if (mode !== "test") {
        setAnswer("");
        setAnswerError(message);
      }
      else showToast(message);
    } finally {
      setBusy(false);
    }
  };

  const translateText = async (test = false) => {
    if (!test && !selectedText.trim()) return showToast("Kein Text ausgewählt.");
    if (!test && targetLanguage === "FA") {
      return void askAi("translate", "Übersetze den ausgewählten Text vollständig und ausschließlich ins Persische.");
    }
    setBusy(true);
    if (!test) {
      setTranslation("");
      setTranslationError("");
    }
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: test ? undefined : selectedText, target: targetLanguage, mode: test ? "test" : "translate" }),
      });
      const data = (await response.json()) as { translation?: string; message?: string };
      if (!response.ok) throw new Error(data.message);
      setConnections((value) => ({ ...value, deepl: true }));
      void refreshProviderConnections();
      if (test) showToast("Google-Übersetzung erfolgreich getestet");
      else {
        setTranslation(data.translation || "");
        setTranslationError("");
      }
    } catch (error) {
      setConnections((value) => ({ ...value, deepl: false }));
      const message = error instanceof Error ? error.message : "Übersetzung nicht verfügbar.";
      if (test) showToast(message);
      else {
        setTranslation("");
        setTranslationError(message);
      }
    } finally {
      setBusy(false);
    }
  };

  const saveNote = () => {
    if (!selectedText.trim() || !note.trim()) return showToast("Text und Notiz werden benötigt.");
    if (addMark({ note })) setNote("");
  };

  const openPublicDrivePdf = async () => {
    const target = extractDriveTarget(driveLink);
    if (target.kind === "folder") {
      return void listDrivePdfs();
    }
    if (target.kind !== "file") return showToast("Bitte einen gültigen Google-Drive-Dateilink oder eine Datei-ID eingeben.");
    setDriveBusy(true);
    try {
      await applyPdf(await fetchDrivePdf(target.id), `Google-Drive-${target.id}.pdf`);
      setConnections((value) => ({ ...value, drive: true }));
      setSettingsOpen(false);
      showToast("Öffentliche Drive-PDF geöffnet");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Die Drive-PDF konnte nicht geöffnet werden.";
      setReaderError({ message, sourceHref: driveLink || undefined });
      showToast(message);
    } finally {
      setDriveBusy(false);
    }
  };

  const listDrivePdfs = async () => {
    setDriveBusy(true);
    try {
      const target = extractDriveTarget(driveLink);
      const params = new URLSearchParams();
      if (target.kind === "folder") params.set("folderId", target.id);
      const response = await fetch(`/api/google/drive${params.size ? `?${params}` : ""}`, { cache: "no-store" });
      const data = (await response.json()) as { files?: DriveFile[]; error?: { message?: string } };
      if (!response.ok) {
        const message = (data as { message?: string }).message || data.error?.message;
        throw new Error(friendlyGoogleDriveError(message || "Drive-Dateien konnten nicht gelesen werden."));
      }
      setDriveFiles(data.files ?? []);
      setDriveError("");
      setConnections((value) => ({ ...value, drive: true }));
      showToast(`${data.files?.length ?? 0} PDF-Dateien gefunden`);
    } catch (error) {
      setConnections((value) => ({ ...value, drive: false }));
      const message = friendlyGoogleDriveError(error instanceof Error ? error.message : "Drive-Dateien konnten nicht gelesen werden.");
      setDriveError(message);
      showToast(isGoogleDriveApiDisabled(message) ? "Google Drive API ist noch nicht aktiviert. Öffne die Hilfe in den Einstellungen." : message);
    } finally {
      setDriveBusy(false);
    }
  };

  const startGoogleConnection = () => {
    const params = new URLSearchParams({ services: "calendar,drive", returnTo: "/pdf-reader" });
    window.location.assign(`/api/google/auth?${params}`);
  };

  const connectGoogleDrive = async () => {
    if (!connections.drive) {
      startGoogleConnection();
      return;
    }
    await listDrivePdfs();
  };

  const importDriveFile = async (file: DriveFile) => {
    setDriveBusy(true);
    try {
      const response = await fetch(`/api/google/drive?fileId=${encodeURIComponent(file.id)}`, { cache: "no-store" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(friendlyGoogleDriveError(data.message || "Die ausgewählte Drive-PDF konnte nicht heruntergeladen werden."));
      }
      await applyPdf(await response.arrayBuffer(), file.name);
      setSettingsOpen(false);
      showToast(`${file.name} geöffnet`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Die Drive-PDF konnte nicht geöffnet werden.");
    } finally {
      setDriveBusy(false);
    }
  };

  const createCalendarEvent = async () => {
    if (!connections.calendar) {
      startGoogleConnection();
      return;
    }
    const start = new Date(Date.now() + 5 * 60_000);
    const end = new Date(start.getTime() + 45 * 60_000);
    try {
      const response = await fetch("/api/google/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: `PDF-Lesesitzung · ${pdfName}`,
          description: "Fokus-Lesesitzung aus Research PDF Studio",
          start: start.toISOString(),
          end: end.toISOString(),
        }),
      });
      const data = await response.json() as { message?: string };
      if (response.status === 401 || response.status === 403) {
        startGoogleConnection();
        return;
      }
      if (!response.ok) throw new Error(data.message || "Der Termin konnte nicht erstellt werden.");
      setConnections((value) => ({ ...value, calendar: true }));
      showToast("Google-Kalendertermin wurde erstellt.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Der Termin konnte nicht erstellt werden.");
    }
  };

  const timerElapsed = timerActive ? sessionSeconds(timerActive, timerNow) : 0;
  const timerTotal = timerStoredSeconds + (
    timerActive?.status === "running" && timerActive.lastStartedAt
      ? Math.max(0, Math.floor((timerNow - new Date(timerActive.lastStartedAt).getTime()) / 1000))
      : 0
  );

  const timerAction = async (action: "start" | "pause" | "resume" | "finish") => {
    setTimerBusy(true);
    try {
      if (DEVICE_ONLY_STORAGE) {
        const now = new Date();
        const timestamp = now.toISOString();
        const storedSessions = readLocalStudySessions();
        let session: StudySession;
        if (action === "start") {
          session = {
            id: `local-study-${crypto.randomUUID()}`,
            documentId,
            documentName: pdfName,
            documentKind: pdfBytes ? "pdf" : "article",
            status: "running",
            activeSeconds: 0,
            startedAt: timestamp,
            lastStartedAt: timestamp,
            endedAt: null,
            startPage: currentPage,
            endPage: currentPage,
          };
        } else {
          const current = storedSessions.find((item) => item.id === timerActive?.id) ?? timerActive;
          if (!current) throw new Error("Keine aktive Lesesitzung gefunden.");
          const timing = transitionTimedSession(current, action, current.activeSeconds, now);
          session = {
            ...current,
            status: timing.status,
            activeSeconds: timing.storedSeconds,
            lastStartedAt: timing.lastStartedAt,
            endedAt: timing.endedAt,
            endPage: currentPage,
          };
        }
        const nextSessions = [session, ...storedSessions.filter((item) => item.id !== session.id)].slice(0, 30);
        if (!writeLocalStudySessions(nextSessions)) throw new Error("Die Lesesitzung konnte auf diesem Gerät nicht gespeichert werden.");
        const previous = timerSessions.find((item) => item.id === session.id);
        if (previous && previous.activeSeconds !== session.activeSeconds) {
          setTimerStoredSeconds((current) => current + session.activeSeconds - previous.activeSeconds);
        }
        setTimerSessions((current) => [session, ...current.filter((item) => item.id !== session.id)].slice(0, 30));
        setTimerActive(session.status === "completed" ? null : session);
        setTimerNow(now.getTime());
        showToast(action === "start" ? "Lesesitzung gestartet" : action === "pause" ? "Lesesitzung pausiert" : action === "resume" ? "Lesesitzung fortgesetzt" : "Lesesitzung auf diesem Gerät gespeichert");
        return;
      }
      const response = await fetch("/api/study-sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(action === "start" ? {
          action,
          documentId,
          documentName: pdfName,
          documentKind: pdfBytes ? "pdf" : "article",
          page: currentPage,
        } : { action, id: timerActive?.id, page: currentPage }),
      });
      const data = (await response.json()) as { session?: StudySession; message?: string };
      if (!response.ok || !data.session) throw new Error(data.message || "Der Fokus-Timer konnte nicht gespeichert werden.");
      const previous = timerSessions.find((item) => item.id === data.session!.id);
      if (previous && previous.activeSeconds !== data.session.activeSeconds) {
        setTimerStoredSeconds((current) => current + data.session!.activeSeconds - previous.activeSeconds);
      }
      setTimerSessions((current) => [data.session!, ...current.filter((item) => item.id !== data.session!.id)].slice(0, 30));
      setTimerActive(data.session.status === "completed" ? null : data.session);
      setTimerNow(Date.now());
      showToast(action === "start" ? "Lesesitzung gestartet" : action === "pause" ? "Lesesitzung pausiert" : action === "resume" ? "Lesesitzung fortgesetzt" : "Lesesitzung gespeichert");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Der Fokus-Timer konnte nicht gespeichert werden.");
    } finally {
      setTimerBusy(false);
    }
  };

  const downloadOriginal = () => {
    if (!pdfBytes) return showToast("Öffne zuerst eine PDF.");
    downloadBlob(new Blob([pdfBytes], { type: "application/pdf" }), `${safeFileName(pdfName)}.pdf`);
  };

  const exportMarks = () => {
    const payload = { version: 2, documentId, documentName: pdfName, exportedAt: new Date().toISOString(), marks };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `${safeFileName(pdfName)}-markierungen.json`);
  };

  const exportAnnotatedPdf = async () => {
    if (!pdfBytes) return showToast("Öffne zuerst eine PDF.");
    if (!marks.some((mark) => mark.anchor?.rects.length)) return showToast("Für den PDF-Export gibt es noch keine positionierten Markierungen.");
    setBusy(true);
    try {
      const { PDFDocument, rgb } = await import("pdf-lib");
      const document = await PDFDocument.load(pdfBytes.slice(0));
      const colors: Record<Tone, [number, number, number]> = {
        yellow: [1, 0.82, 0.18], green: [0.25, 0.75, 0.55], blue: [0.25, 0.62, 0.95], pink: [0.92, 0.32, 0.58], red: [0.95, 0.22, 0.18],
      };
      for (const mark of marks) {
        if (!mark.anchor?.rects.length) continue;
        const page = document.getPages()[mark.page - 1];
        if (!page) continue;
        const { width, height } = page.getSize();
        const [r, g, b] = colors[mark.tone];
        for (const rect of mark.anchor.rects) {
          const x = rect.x * width;
          const y = height - (rect.y + rect.height) * height;
          const rectWidth = rect.width * width;
          const rectHeight = rect.height * height;
          if (mark.type === "highlight") page.drawRectangle({ x, y, width: rectWidth, height: rectHeight, color: rgb(r, g, b), opacity: 0.22 });
          if (mark.type === "underline") page.drawLine({ start: { x, y: y + 1 }, end: { x: x + rectWidth, y: y + 1 }, thickness: 2, color: rgb(r, g, b), opacity: 0.9 });
          if (mark.type === "strike") page.drawLine({ start: { x, y: y + rectHeight * 0.52 }, end: { x: x + rectWidth, y: y + rectHeight * 0.52 }, thickness: 2, color: rgb(r, g, b), opacity: 0.9 });
        }
      }
      const exported = await document.save();
      downloadBlob(new Blob([new Uint8Array(exported)], { type: "application/pdf" }), `${safeFileName(pdfName)}-markiert.pdf`);
      showToast("Markierte PDF exportiert");
    } catch {
      showToast("Die markierte PDF konnte nicht exportiert werden. Das Original bleibt verfügbar.");
    } finally {
      setBusy(false);
    }
  };

  const goToPage = (page: number) => {
    const next = Math.min(pageCount, Math.max(1, page));
    setCurrentPage(next);
    document.getElementById(`pdf-page-${next}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDocumentReady = useCallback((pages: number) => {
    setPageCount(pages);
    const savedPage = requestedPage.current ?? readReaderStateStore()[documentId]?.page ?? 1;
    const page = Math.min(pages, Math.max(1, savedPage));
    window.setTimeout(() => {
      setCurrentPage(page);
      document.getElementById(`pdf-page-${page}`)?.scrollIntoView({ block: "start" });
    }, 0);
  }, [documentId]);

  const jumpToMark = (mark: Mark) => {
    setSelectedText(mark.text);
    setSelectedPage(mark.page);
    setSelectedAnchor(mark.anchor);
    setSelectedMarkId(mark.id);
    setAnswer("");
    setAnswerError("");
    setTranslation("");
    setTranslationError("");
    setSelectionMenu(null);
    setPanelOpen(true);
    goToPage(mark.page);
    showToast(`Seite ${mark.page}: Textstelle angezeigt`);
  };

  const sampleMark = marks.find((mark) => !mark.anchor && sampleText.includes(mark.text));
  const activeMark = selectedMarkId ? marks.find((mark) => mark.id === selectedMarkId) : undefined;
  const effectivePanelWidth = panelMode === "wide" ? Math.min(760, Math.max(panelWidth, 620)) : panelWidth;

  const closeSelectionMenu = useCallback(() => {
    setSelectionMenu(null);
    setSelectionCommentOpen(false);
    setSelectionComment("");
  }, []);

  const handlePdfSelection = (selection: PdfSelection) => {
    setSelectedText(selection.text);
    setSelectedPage(selection.page);
    setCurrentPage(selection.page);
    setSelectedAnchor(selection.anchor);
    setSelectedMarkId(null);
    setAnswer("");
    setAnswerError("");
    setTranslation("");
    setTranslationError("");
    setNote("");
    if (selection.menuPosition) {
      setSelectionMenu(selection.menuPosition);
      setSelectionCommentOpen(false);
      setSelectionComment("");
    } else {
      closeSelectionMenu();
    }
    postToEmbeddingParent({ type: "research-pdf-studio:selection", payload: selection });
  };

  const updateSelectedTextManually = (value: string) => {
    setSelectedText(value);
    setSelectedPage(currentPage);
    setSelectedAnchor(undefined);
    setSelectedMarkId(null);
    setAnswer("");
    setAnswerError("");
    setTranslation("");
    setTranslationError("");
  };

  const markFromSelectionMenu = (selectedTone: Tone) => {
    setTone(selectedTone);
    if (addMark({ tone: selectedTone })) closeSelectionMenu();
  };

  const saveSelectionAsFlashcard = () => {
    const front = selectedText.trim();
    if (!front) {
      showToast("Bitte zuerst Text auswählen.");
      return;
    }
    const back = (connections.deepl || connections.openai) ? translation.trim() : "";
    const payload = {
      id: crypto.randomUUID(),
      front,
      back,
      note: note.trim(),
      deck: "Research PDF",
      sourceUrl: window.location.href,
      sourceTitle: pdfName,
      targetLanguage,
      createdAt: new Date().toISOString(),
    };
    window.postMessage({ type: "lexibridge:add-card", payload }, window.location.origin);
    try {
      const key = "lexibridge-fallback-cards";
      const existing = JSON.parse(localStorage.getItem(key) || "[]") as typeof payload[];
      localStorage.setItem(key, JSON.stringify([payload, ...existing].slice(0, 5_000)));
    } catch {
      // The browser extension still receives the card when local fallback storage is unavailable.
    }
    showToast("Flashkarte an LexiBridge gesendet");
    closeSelectionMenu();
  };

  const saveSelectionComment = () => {
    if (!selectionComment.trim()) {
      showToast("Bitte schreibe zuerst einen Kommentar.");
      return;
    }
    if (addMark({ note: selectionComment })) closeSelectionMenu();
  };

  useEffect(() => {
    if (!selectionMenu) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && selectionMenuRef.current?.contains(event.target)) return;
      closeSelectionMenu();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSelectionMenu();
    };
    window.addEventListener("pointerdown", closeOnOutsidePointer);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutsidePointer);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeSelectionMenu, selectionMenu]);

  return (
    <main className={`app-shell pdf-reader-root ${embed ? "embed" : ""}`}>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Zum Lernplan"><span className="brand-mark">▣</span><span>PDF Visual</span></a>
        <nav className="reader-history" aria-label="Seitennavigation">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) window.history.back();
              else window.location.assign("/");
            }}
            title="Zur vorherigen Seite"
          >
            <span aria-hidden="true">←</span><b>Zurück</b>
          </button>
          <button type="button" onClick={() => window.history.forward()} title="Zur nächsten Seite">
            <span aria-hidden="true">→</span><b>Weiter</b>
          </button>
          <a href="/" title="Zur Startseite">
            <span aria-hidden="true">⌂</span><b>Start</b>
          </a>
        </nav>
        <input className="document-title-input" id="pdf-document-title" name="pdf-document-title" value={pdfName} onChange={(event) => setPdfName(event.target.value)} aria-label="Dokumentname bearbeiten" />
        <div className="top-actions">
          <button className={`timer-top ${timerActive?.status ?? "idle"}`} onClick={() => setTimerOpen(true)} aria-label="Fokus-Timer öffnen">◷ <span>{timerActive ? formatTimer(timerElapsed) : "Fokus"}</span><small>{timerActive?.status === "running" ? "Läuft" : timerActive?.status === "paused" ? "Pausiert" : "Timer"}</small></button>
          <button className={`connection ${connections.drive ? "online" : ""}`} aria-label={connections.drive ? "Google Drive verbunden" : "Google Drive verbinden"} title={connections.drive ? "Google Drive verbunden" : "Google Drive verbinden"} onClick={() => connections.drive ? setSettingsOpen(true) : startGoogleConnection()}>◫ <span>Google Drive</span><small>{connections.drive ? "Verbunden" : "Verbinden"}</small></button>
          <button className={`connection ${connections.calendar ? "online" : ""}`} aria-label={connections.calendar ? "Google Calendar verbunden · Termin erstellen" : "Google Calendar verbinden"} title={connections.calendar ? "Google Calendar verbunden · Termin erstellen" : "Google Calendar verbinden"} onClick={() => void createCalendarEvent()}>▦ <span>Kalender</span><small>{connections.calendar ? "Verbunden" : "Verbinden"}</small></button>
          <a className="icon-btn route-link" href="/settings" aria-label="Zentrale Einstellungen" title="Zentrale Einstellungen">⌁</a>
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Einstellungen">⚙</button>
        </div>
      </header>

      <section className="workspace">
        <nav className="sidebar">
          <button className="nav-item active">▥ <span>Bibliothek</span></button>
          <button className="nav-item">◷ <span>Heute lesen</span></button>
          <p className="nav-label">SAMMLUNGEN</p>
          {["Dissertation", "Methoden", "Literatur", "Sprachen"].map((label) => <button className="nav-item" key={label}>□ <span>{label}</span></button>)}
          <div className="nav-bottom">
            <button className="nav-item" onClick={() => { setTab("notes"); setPanelOpen(true); }}>◇ <span>Markierungen</span></button>
            <button className="nav-item" onClick={() => setSettingsOpen(true)}>⚙ <span>Reader-Einstellungen</span></button>
            <a className="nav-item" href="/settings">⌁ <span>Zentrale Einstellungen</span></a>
            <a className="nav-item" href="/">⌂ <span>Lernplan</span></a>
          </div>
        </nav>

        <section className="reader-area">
          {(readerFocus || readerContext) && (
            <aside className="reader-focus-banner" aria-label="Lesefokus für das geöffnete Dokument">
              <span>Lesefokus</span>
              <div>
                {readerContext && <strong>{readerContext}</strong>}
                {readerFocus && <p>{readerFocus}</p>}
              </div>
            </aside>
          )}
          <div className="reader-toolbar">
            <button onClick={() => goToPage(currentPage - 1)} disabled={!pdfBytes || currentPage <= 1}>‹</button>
            <span className="page-chip">Seite <b>{currentPage}</b> von {pageCount}</span>
            <button onClick={() => goToPage(currentPage + 1)} disabled={!pdfBytes || currentPage >= pageCount}>›</button>
            <span className="separator" />
            <button className="zoom-button" onClick={() => setZoom((value) => [...ZOOM_LEVELS].reverse().find((level) => level < value - 0.001) ?? ZOOM_LEVELS[0])} aria-label="PDF verkleinern">−</button>
            <label className="zoom-control">
              <span className="visually-hidden">Vergrößerung auswählen</span>
              <select
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                aria-label="PDF-Vergrößerung"
                id="pdf-zoom"
                name="pdf-zoom"
              >
                {ZOOM_LEVELS.map((value) => (
                  <option key={value} value={value}>{Math.round(value * 100)}%</option>
                ))}
              </select>
            </label>
            <button className="zoom-button" onClick={() => setZoom((value) => ZOOM_LEVELS.find((level) => level > value + 0.001) ?? ZOOM_LEVELS.at(-1)!)} aria-label="PDF vergrößern">＋</button>
            <span className="toolbar-spacer" />
            <button className={`toolbar-timer ${timerActive?.status ?? "idle"}`} onClick={() => setTimerOpen(true)}>◷ {timerActive ? formatTimer(timerElapsed) : "Fokus starten"}</button>
            <label className="upload-button">PDF öffnen<input id="pdf-upload-toolbar" name="pdf-upload-toolbar" aria-label="PDF aus diesem Computer öffnen" type="file" accept="application/pdf,.pdf" onChange={(event) => void importLocalPdf(event.target.files?.[0])} /></label>
            <button onClick={() => setSettingsOpen(true)}>Drive</button>
            <button className="toolbar-secondary" onClick={downloadOriginal} disabled={!pdfBytes}>Original</button>
            <button className="toolbar-secondary" onClick={() => void exportAnnotatedPdf()} disabled={!pdfBytes}>PDF exportieren</button>
            <button className="panel-toggle" onClick={() => setPanelOpen((value) => !value)}>{panelOpen ? "Panel schließen" : "Panel öffnen"}</button>
          </div>

          {selectionMenu && selectedText && (
            <div
              ref={selectionMenuRef}
              className={`selection-context-menu ${selectionMenu.placement}`}
              style={{ left: selectionMenu.x, top: selectionMenu.y }}
              role="menu"
              aria-label="Aktionen für ausgewählten Text"
            >
              {selectionCommentOpen ? (
                <form className="selection-comment-form" onSubmit={(event) => { event.preventDefault(); saveSelectionComment(); }}>
                  <div className="selection-menu-heading">Kommentar zur Auswahl</div>
                  <p className="selection-menu-preview" title={selectedText}>{selectedText}</p>
                  <label htmlFor="selection-comment" className="visually-hidden">Kommentar</label>
                  <textarea
                    id="selection-comment"
                    autoFocus
                    value={selectionComment}
                    onChange={(event) => setSelectionComment(event.target.value)}
                    placeholder="Deine Notiz zu diesem Text …"
                    rows={3}
                  />
                  <div className="selection-comment-actions">
                    <button type="button" onClick={() => setSelectionCommentOpen(false)}>Zurück</button>
                    <button type="submit" className="primary">Kommentar speichern</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="selection-menu-heading">
                    <span>Markieren</span>
                    <span className="selection-menu-preview" title={selectedText}>{selectedText}</span>
                  </div>
                  <div className="selection-menu-style-row" role="group" aria-label="Markierungsstil">
                    <button type="button" className={markType === "highlight" ? "picked" : ""} onClick={() => setMarkType("highlight")} title="Highlight">H</button>
                    <button type="button" className={markType === "underline" ? "picked" : ""} onClick={() => setMarkType("underline")} title="Unterstreichen"><u>U</u></button>
                    <button type="button" className={markType === "strike" ? "picked" : ""} onClick={() => setMarkType("strike")} title="Durchstreichen"><s>S</s></button>
                  </div>
                  <div className="selection-menu-color-row" role="group" aria-label="Markierungsfarbe">
                    {(Object.keys(toneLabels) as Tone[]).map((color) => (
                      <button
                        type="button"
                        key={color}
                        className={`selection-color-dot ${color} ${tone === color ? "selected" : ""}`}
                        aria-label={`${toneLabels[color]} markieren`}
                        title={`${toneLabels[color]} markieren`}
                        onClick={() => markFromSelectionMenu(color)}
                      />
                    ))}
                  </div>
                  <div className="selection-context-divider" />
                  <div className="selection-menu-actions">
                    <button type="button" onClick={() => setSelectionCommentOpen(true)}>▤ Kommentar</button>
                    <button type="button" onClick={() => { setTab("translate"); setPanelOpen(true); void translateText(); closeSelectionMenu(); }}>文 Übersetzen</button>
                    <button type="button" onClick={() => { setTab("ai"); setPanelOpen(true); void askAi(); closeSelectionMenu(); }}>✦ Erklären</button>
                    <button type="button" onClick={saveSelectionAsFlashcard}>▣ Flashkarte</button>
                    <button type="button" className="eraser-action" onClick={() => { eraseSelectedMarks(); closeSelectionMenu(); }}>⌫ Radierer</button>
                    {activeMark && <button type="button" className="eraser-action" onClick={() => { deleteMark(activeMark.id); closeSelectionMenu(); }}>🗑 Markierung löschen</button>}
                    <button type="button" onClick={() => { void navigator.clipboard?.writeText(selectedText); showToast("Text kopiert"); closeSelectionMenu(); }}>⧉ Kopieren</button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="paper-stage" onMouseUp={() => { captureSampleSelection(true); }} onTouchEnd={() => { window.setTimeout(() => captureSampleSelection(true), 0); }} onContextMenu={(event) => { if (!pdfBytes && !readerError && captureSampleSelection(true)) event.preventDefault(); }}>
            {readerError ? (
              <article className="paper reader-error-card" role="alert">
                <strong>Die gewählte PDF konnte nicht geöffnet werden</strong>
                <p>{readerError.message}</p>
                <p>Es wurde keine andere oder beispielhafte PDF als Ersatz geladen.</p>
                <div className="reader-error-actions">
                  {readerError.sourceHref && (
                    <a href={readerError.sourceHref} target="_blank" rel="noopener noreferrer">
                      Originalquelle öffnen
                    </a>
                  )}
                  <label className="primary upload-button">
                    PDF lokal auswählen
                    <input id="pdf-upload-recovery" name="pdf-upload-recovery" aria-label="Lokale PDF als Ersatz auswählen" type="file" accept="application/pdf,.pdf" onChange={(event) => void importLocalPdf(event.target.files?.[0])} />
                  </label>
                </div>
              </article>
            ) : pdfBytes ? (
              <PdfDocument
                data={pdfBytes}
                scale={zoom}
                marks={marks}
                onDocumentReady={handleDocumentReady}
                onPageVisible={setCurrentPage}
                onSelection={handlePdfSelection}
                onSelectionRejected={showToast}
              />
            ) : (
              <article className="paper">
                <div className="empty-reader-callout">
                  <strong>PDF öffnen und direkt bearbeiten</strong>
                  <span>Öffne eine lokale PDF oder importiere eine Datei aus Google Drive. Danach kannst du echten PDF-Text auswählen, markieren, übersetzen und exportieren.</span>
                  <label className="primary upload-button">PDF auswählen<input id="pdf-upload-empty" name="pdf-upload-empty" aria-label="PDF zum Lesen auswählen" type="file" accept="application/pdf,.pdf" onChange={(event) => void importLocalPdf(event.target.files?.[0])} /></label>
                </div>
                <p className="journal">MIS Quarterly · Research Essay</p>
                <h1>Design Science in Information Systems Research</h1>
                <div className="authors"><span>Alan R. Hevner</span><span>Salvatore T. March</span><span>Jinsoo Park</span><span>Sudha Ram</span></div>
                <h2>Abstract</h2>
                <p>Two paradigms characterize much of the research in the Information Systems discipline: behavioral science and design science.</p>
                <h2>1. Introduction</h2>
                <p className={sampleMark ? `selected-paragraph ${sampleMark.tone} ${sampleMark.type}` : "selected-paragraph"}>
                  {sampleText} The design-science paradigm seeks to extend the boundaries of human and organizational capabilities by creating new and innovative artifacts.
                </p>
                <h2>2. Research Framework</h2>
                <p>Knowledge and understanding of a problem domain and its solution are achieved in the building and application of the designed artifact.</p>
              </article>
            )}
          </div>
        </section>

        {panelOpen && <>
          <button className="panel-scrim" type="button" aria-label="Werkzeugpanel schließen" onClick={() => setPanelOpen(false)} />
          <div className="resize-handle" onPointerDown={(event) => { dragStart.current = { x: event.clientX, width: effectivePanelWidth }; }}><span>↔</span></div>
          <aside className="study-panel" style={{ width: effectivePanelWidth }} aria-label="PDF-Werkzeuge">
            <div className="panel-tabs">
              <button className={tab === "ai" ? "active" : ""} onClick={() => setTab("ai")}>✦ KI</button>
              <button className={tab === "translate" ? "active" : ""} onClick={() => setTab("translate")}>◎ Übersetzung</button>
              <button className={tab === "notes" ? "active" : ""} onClick={() => setTab("notes")}>▤ Notizen</button>
              <button className="panel-size-button" onClick={() => setPanelMode((value) => value === "normal" ? "wide" : "normal")} title="Panelgröße wechseln">{panelMode === "normal" ? "⤢" : "⤡"}</button>
              <button className="panel-close-button" onClick={() => setPanelOpen(false)} aria-label="Panel schließen" title="Panel schließen">×</button>
            </div>

            {tab === "ai" && <div className="panel-content">
              <label>Ausgewählter Text</label>
              <textarea className="selected-input" value={selectedText} onChange={(event) => updateSelectedTextManually(event.target.value)} placeholder="Markiere Text im PDF …" />
              <div className="selection-actions"><button onClick={() => updateSelectedTextManually("")}>Auswahl löschen</button><button onClick={() => navigator.clipboard.writeText(selectedText)}>Kopieren</button></div>
              <label>Meine Frage</label>
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Was möchtest du wissen?" />
              <div className="prompt-chips">{["Einfach", "Wissenschaftlich", "Zusammenfassen", "Beispiel", "Forschungsbezug"].map((label) => <button key={label} onClick={() => setQuestion(`${label}: ${question}`)}>{label}</button>)}</div>
              <button className="primary" disabled={busy} onClick={() => void askAi()}>{busy ? "Wird verarbeitet …" : "✦ Erklären"}</button>
              {answerError && <div className="result-card provider-error" role="alert"><strong>KI ist noch nicht verfügbar</strong><p>{answerError}</p><a href="/settings">Verbindung in den Einstellungen prüfen</a></div>}
              {answer && <div className="result-card"><strong>KI-Antwort</strong><p>{answer}</p><div><button onClick={() => navigator.clipboard.writeText(answer)}>Kopieren</button><button onClick={() => addMark({ note: answer })}>Speichern</button></div></div>}
            </div>}

            {tab === "translate" && <div className="panel-content">
              <div className="language-row"><select aria-label="Ausgangssprache"><option>Automatisch erkennen</option><option>Englisch</option><option>Deutsch</option><option>Persisch</option></select><span>→</span><select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)} aria-label="Zielsprache">{Object.entries(targetLanguages).map(([code, label]) => <option value={code} key={code}>{label}</option>)}</select></div>
              <label>Originaltext</label><textarea value={selectedText} onChange={(event) => updateSelectedTextManually(event.target.value)} />
              <button className="primary" disabled={busy} onClick={() => void translateText()}>{busy ? "Wird übersetzt …" : "Mit DeepL übersetzen"}</button>
              <button className="secondary" disabled={busy} onClick={() => void askAi("translate", `Übersetze den Text in ${targetLanguages[targetLanguage] || targetLanguage}.`)}>Mit KI übersetzen</button>
              {translationError && <div className="result-card provider-error" role="alert"><strong>Übersetzung ist noch nicht verfügbar</strong><p>{translationError}</p><a href="/settings">Verbindung in den Einstellungen prüfen</a></div>}
              {translation && <div className="result-card"><strong>Übersetzung</strong><p dir={textDirection(translation)}>{translation}</p><div><button onClick={() => navigator.clipboard.writeText(translation)}>Kopieren</button><button onClick={() => addMark({ translation })}>Mit Markierung speichern</button></div></div>}
              <p className="helper">Google Translation unterstützt Deutsch, Englisch und Persisch. Für eine ausführliche Erklärung kannst du dieselbe Auswahl zusätzlich mit KI bearbeiten.</p>
            </div>}

            {tab === "notes" && <div className="panel-content notes-content">
              <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Notizen, Übersetzungen und Antworten durchsuchen" />
              <label>Neue Notiz zum ausgewählten Text</label>
              <textarea className="note-editor" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Deine Notiz …" />
              <button className="primary" onClick={saveNote}>Notiz speichern</button>
              <div className="filters"><button className={toneFilter === "all" ? "picked" : ""} onClick={() => setToneFilter("all")}>Alle</button>{(Object.keys(toneLabels) as Tone[]).map((color) => <button className={`filter-dot ${color} ${toneFilter === color ? "selected" : ""}`} key={color} onClick={() => setToneFilter(color)} title={toneLabels[color]} />)}</div>
              <div className="bulk-actions"><button onClick={deletePageMarks}>Seite {currentPage} leeren</button><button className="danger-link" onClick={deleteAllMarks}>Alle löschen</button></div>
              <div className="note-list">{filteredMarks.length ? filteredMarks.map((item) => <article className={`note-card ${item.tone}`} key={item.id} onClick={() => { if (editingMarkId !== item.id) jumpToMark(item); }}>
                <div><span className={`mini-dot ${item.tone}`} /><b>Seite {item.page}</b><span>{item.type === "highlight" ? "Highlight" : item.type === "underline" ? "Unterstrichen" : "Durchgestrichen"}</span><button className="edit-mark" title="Kommentar bearbeiten" aria-label="Kommentar bearbeiten" onClick={(event) => { event.stopPropagation(); startEditingMark(item); }}>Bearbeiten</button><button className="delete-mark" title="Markierung löschen" aria-label="Markierung löschen" onClick={(event) => { event.stopPropagation(); deleteMark(item.id); }}>Löschen</button></div>
                <p dir={textDirection(item.text)}>{item.text}</p>
                {editingMarkId === item.id ? <form className="note-edit-form" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); saveEditedMark(item.id); }}>
                  <label>Kommentar<textarea value={editingComment} onChange={(event) => setEditingComment(event.target.value)} dir={textDirection(editingComment)} placeholder="Kommentar hinzufügen …" /></label>
                  <label>Übersetzung<textarea value={editingTranslation} onChange={(event) => setEditingTranslation(event.target.value)} dir={textDirection(editingTranslation)} placeholder="Übersetzung ergänzen …" /></label>
                  <div><button type="button" onClick={cancelEditingMark}>Abbrechen</button><button type="submit" className="primary">Änderungen speichern</button></div>
                </form> : <>{item.translation && <small dir={textDirection(item.translation)}><b>Übersetzung:</b> {item.translation}</small>}{item.note && <small dir={textDirection(item.note)}><b>Kommentar:</b> {item.note}</small>}</>}
              </article>) : <div className="empty-notes">Keine passenden Markierungen gefunden.</div>}</div>
            </div>}
          </aside>
        </>}
      </section>

      {settingsOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
        <section className="settings-modal" aria-modal="true" role="dialog" aria-label="Integrationen und Exporte">
          <div className="modal-head"><div><small>INTEGRATIONEN</small><h2>Einstellungen</h2><p>Verbindungen werden erst nach einem echten Test als aktiv angezeigt.</p></div><button onClick={() => setSettingsOpen(false)} aria-label="Einstellungen schließen">×</button></div>

          <div className="integrated-settings-note">
            <div><strong>Zentrale Einstellungen derselben App</strong><p>OpenAI, Google Translation, Calendar und Drive werden einmal zentral verbunden und anschließend hier direkt verwendet.</p></div>
            <a href="/settings">Zentrale Einstellungen öffnen</a>
          </div>

          <div className="setting-card drive-card">
            <div><strong>Google Drive · PDF-Eingang</strong><p>Öffentliche Einzeldatei direkt öffnen oder private Dateien nach Google-Freigabe auswählen.</p></div>
            <span className={`status ${connections.drive ? "ok" : ""}`}>{connections.drive ? "Verbunden" : driveApiDisabled ? "Angemeldet · Drive API fehlt" : driveError ? "Angemeldet · Prüfung fehlgeschlagen" : "Nicht verbunden"}</span>
            {driveError && <div className="drive-api-error full-row" role="alert" aria-live="assertive"><div><strong>{driveApiDisabled ? "Google Drive API ist noch nicht aktiviert" : "Google Drive konnte noch nicht geprüft werden"}</strong><p>{driveError}</p></div><div className="drive-api-actions">{driveApiDisabled && <a href={driveApiUrl} target="_blank" rel="noreferrer">Drive API aktivieren ↗</a>}<button type="button" onClick={() => void listDrivePdfs()} disabled={driveBusy}>{driveBusy ? "Wird geprüft …" : "Erneut prüfen"}</button></div></div>}
            <label className="field-label">Drive-Datei- oder Ordnerlink<input value={driveLink} onChange={(event) => setDriveLink(event.target.value)} placeholder="https://drive.google.com/drive/folders/… oder /file/d/…" /></label>
            <button onClick={() => void openPublicDrivePdf()} disabled={driveBusy}>{driveBusy ? "Wird geprüft …" : "Öffentliche PDF öffnen"}</button>
            <label className="field-label">Zentrale Google-Verbindung<input value={connections.drive ? "Google Drive ist verbunden" : googleClientId ? "Bereit für die Google-Anmeldung" : "Installation muss repariert werden"} readOnly /></label>
            <button className="accent-button" onClick={() => void connectGoogleDrive()} disabled={driveBusy}>{connections.drive ? "Drive-Dateien laden" : "Mit Google verbinden"}</button>
            <div className="full-row setup-note"><p>Ein Klick öffnet die offizielle Google-Anmeldung. E-Mail und Passwort bleiben bei Google; diese App speichert nur die verschlüsselte Freigabe.</p>{driveApiDisabled ? <a href={driveApiUrl} target="_blank" rel="noreferrer">Google Drive API prüfen ↗</a> : null}</div>
            {driveFiles.length > 0 && <div className="drive-file-list full-row">{driveFiles.map((file) => <button key={file.id} onClick={() => void importDriveFile(file)}><span>▧</span><span><b>{file.name}</b><small>{file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString("de-DE") : "PDF"}</small></span><span>Öffnen</span></button>)}</div>}
          </div>

          <div className="setting-card"><div><strong>Google Calendar</strong><p>Eine 45-minütige Lesesitzung direkt im verbundenen Kalender speichern.</p></div><span className={`status ${connections.calendar ? "ok" : ""}`}>{connections.calendar ? "Verbunden" : "Nicht verbunden"}</span><button className="full-row" onClick={() => void createCalendarEvent()}>{connections.calendar ? "Testtermin erstellen" : "Calendar & Drive verbinden"}</button></div>

          <div className="setting-grid central-provider-grid">
            <Card className="central-provider-card">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div><CardTitle>OpenAI</CardTitle><CardDescription>Wissenschaftliche Erklärungen und KI-Übersetzungen verwenden automatisch die zentrale Verbindung.</CardDescription></div>
                <Badge variant={connections.openai ? "success" : providerDetails.openai.configured ? "warning" : "neutral"}>{connections.openai ? "Verbunden" : providerDetails.openai.configured ? "Prüfung nötig" : "Nicht eingerichtet"}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="model-hint">Aktives Modell: <code>{String(providerDetails.openai.metadata?.model || DEFAULT_OPENAI_MODEL)}</code></p>
                <div className="flex flex-wrap gap-3"><Button type="button" onClick={() => void askAi("test")} disabled={busy || !providerDetails.openai.configured}>Verbindung testen</Button><Button asChild variant="outline"><a href="/settings">In Einstellungen bearbeiten</a></Button></div>
              </CardContent>
            </Card>
            <Card className="central-provider-card">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div><CardTitle>Google Translation</CardTitle><CardDescription>Übersetzungen verwenden die sichere Google-Freigabe. Deutsch, Englisch und Persisch werden direkt im PDF Reader unterstützt.</CardDescription></div>
                <Badge variant={connections.deepl ? "success" : providerDetails.deepl.configured ? "warning" : "neutral"}>{connections.deepl ? "Verbunden" : providerDetails.deepl.configured ? "DeepL erneut prüfen" : "Nicht eingerichtet"}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="field-label">Standard-Zielsprache<select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)}>{Object.entries(targetLanguages).map(([code, label]) => <option value={code} key={code}>{label}</option>)}</select></label>
                <div className="flex flex-wrap gap-3"><Button type="button" onClick={() => void translateText(true)} disabled={busy || !providerDetails.deepl.configured}>Verbindung testen</Button><Button asChild variant="outline"><a href="/settings">In Einstellungen bearbeiten</a></Button></div>
              </CardContent>
            </Card>
          </div>

          <div className="setting-card export-card"><div><strong>Import & Export</strong><p>Original, markierte PDF und eine sichere JSON-Datei ohne API-Schlüssel herunterladen.</p></div><span className={`status ${pdfBytes ? "ok" : ""}`}>{pdfBytes ? "PDF geladen" : "Keine PDF"}</span><div className="export-buttons full-row"><label className="upload-button">PDF importieren<input id="pdf-upload-settings" name="pdf-upload-settings" aria-label="PDF für Import und Export auswählen" type="file" accept="application/pdf,.pdf" onChange={(event) => void importLocalPdf(event.target.files?.[0])} /></label><button onClick={downloadOriginal} disabled={!pdfBytes}>Original-PDF</button><button onClick={() => void exportAnnotatedPdf()} disabled={!pdfBytes}>Markierte PDF</button><button onClick={exportMarks} disabled={!marks.length}>Markierungen JSON</button></div></div>

          <div className="embed-box"><strong>In andere Apps integrieren</strong><p>Der Code ist vollständig editierbar. Auswahl und Markierungen werden zusätzlich über <code>window.postMessage</code> bereitgestellt.</p><textarea className="code-editor" value={embedCode} onChange={(event) => setEmbedCode(event.target.value)} spellCheck={false} aria-label="Editierbarer Embed-Code" /><div className="embed-actions"><button onClick={() => navigator.clipboard.writeText(embedCode)}>Code kopieren</button></div></div>
        </section>
      </div>}
      {timerOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setTimerOpen(false); }}>
        <section className="timer-modal" aria-modal="true" role="dialog" aria-labelledby="timer-title">
          <div className="modal-head"><div><small>STUDIENZEIT</small><h2 id="timer-title">Fokus-Timer</h2><p>Misst nur deine aktive Lesezeit und speichert jede abgeschlossene Sitzung.</p></div><button onClick={() => setTimerOpen(false)} aria-label="Timer schließen">×</button></div>
          <div className={`timer-face ${timerActive?.status ?? "idle"}`}><span /><strong>{formatTimer(timerElapsed)}</strong><small>{timerActive?.status === "running" ? "Aktive Lesezeit" : timerActive?.status === "paused" ? "Pause – wird nicht gezählt" : "Bereit zum Start"}</small></div>
          <article className="timer-document"><small>Dokument</small><strong>{timerActive?.documentName || pdfName}</strong><span>Seite {currentPage} · heute insgesamt {formatTimer(timerTotal)}</span></article>
          <div className="timer-actions">
            {!timerActive && <button className="primary" disabled={timerBusy} onClick={() => void timerAction("start")}>◷ Fokus starten</button>}
            {timerActive?.status === "running" && <button disabled={timerBusy} onClick={() => void timerAction("pause")}>Pause</button>}
            {timerActive?.status === "paused" && <button className="primary" disabled={timerBusy} onClick={() => void timerAction("resume")}>Fortsetzen</button>}
            {timerActive && <button className="danger-link" disabled={timerBusy} onClick={() => void timerAction("finish")}>Beenden und speichern</button>}
          </div>
          <section className="timer-history"><div><strong>Letzte Sitzungen</strong><span>{timerSessions.filter((item) => item.status === "completed").length} gespeichert</span></div>{timerSessions.filter((item) => item.status === "completed").length ? <ul>{timerSessions.filter((item) => item.status === "completed").slice(0, 7).map((item) => <li key={item.id}><span><b>{item.documentName}</b><small>Seite {item.startPage}–{item.endPage}</small></span><strong>{formatTimer(item.activeSeconds)}</strong></li>)}</ul> : <p>Noch keine abgeschlossene Lesesitzung.</p>}</section>
        </section>
      </div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
