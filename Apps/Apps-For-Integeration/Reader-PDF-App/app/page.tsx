"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PdfDocument, {
  type PdfAnchor,
  type PdfMarkVisual,
  type PdfSelection,
  type PdfSelectionMenuPosition,
} from "./components/PdfDocument";
import ReadingRuler from "./components/ReadingRuler";
import { sanitizePdfReaderStateStore, type PdfReaderState } from "../lib/pdf-reader-state";
import { flashcardsToCsv, pdfToExcel, pdfToImages, pdfToWord } from "../lib/document-converters";

type Tab = "ai" | "translate" | "notes";
type Tone = PdfMarkVisual["tone"];
type MarkType = PdfMarkVisual["type"];
type Mark = PdfMarkVisual & {
  text: string;
  note?: string;
  translation?: string;
  createdAt: string;
};
type SelectionMenuState = PdfSelectionMenuPosition;
type DriveFile = { id: string; name: string; modifiedTime?: string; size?: string };
type DriveTarget = { kind: "file" | "folder" | "invalid"; id: string };
type TokenResponse = { access_token?: string; error?: string; error_description?: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
            error_callback?: (error: { type?: string }) => void;
          }) => { requestAccessToken: (options?: { prompt?: string }) => void };
        };
      };
    };
  }
}

const sampleText =
  "Design science creates and evaluates artifacts intended to solve identified organizational problems. Behavioral science develops and justifies theories that explain or predict human or organizational phenomena.";

const toneLabels: Record<Tone, string> = {
  yellow: "Wichtig",
  green: "Definition",
  blue: "Beispiel",
  pink: "Frage",
  red: "Prüfen",
};

const targetLanguages: Record<string, string> = { DE: "Deutsch", EN: "English", FA: "فارسی" };
const MAX_PDF_BYTES = 200 * 1024 * 1024;
const MARK_STORE = "research-pdf-studio:marks:v2";
const READER_STATE_STORE = "research-pdf-studio:reader-state:v1";
const READING_RULER_STORE = "research-pdf-studio:reading-ruler:v1";

function safeReturnUrl(value: string | null) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
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

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFileName(name);
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function validateMarks(value: unknown): Mark[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const item = candidate as Partial<Mark> & { id?: string | number };
    if (typeof item.text !== "string" || !item.text.trim()) return [];
    const tone = (Object.keys(toneLabels) as Tone[]).includes(item.tone as Tone) ? (item.tone as Tone) : "yellow";
    const type = (["highlight", "underline", "strike"] as MarkType[]).includes(item.type as MarkType) ? (item.type as MarkType) : "highlight";
    return [{
      id: String(item.id ?? crypto.randomUUID()),
      text: item.text,
      page: Number(item.page) || 1,
      tone,
      type,
      note: typeof item.note === "string" ? item.note : undefined,
      translation: typeof item.translation === "string" ? item.translation : undefined,
      anchor: item.anchor,
      createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    }];
  });
}

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
  const digest = await crypto.subtle.digest("SHA-256", head);
  return Array.from(new Uint8Array(digest).slice(0, 12), (part) => part.toString(16).padStart(2, "0")).join("");
}

let googleScriptPromise: Promise<void> | null = null;
function loadGoogleIdentity() {
  if (window.google?.accounts.oauth2) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;
  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    const script = existing ?? document.createElement("script");
    const done = () => window.google?.accounts.oauth2 ? resolve() : reject(new Error("Google konnte nicht initialisiert werden."));
    script.addEventListener("load", done, { once: true });
    script.addEventListener("error", () => reject(new Error("Google-Anmeldung konnte nicht geladen werden.")), { once: true });
    if (!existing) {
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return googleScriptPromise;
}

export default function Home() {
  const [embed, setEmbed] = useState(false);
  const [tab, setTab] = useState<Tab>("ai");
  const [panelWidth, setPanelWidth] = useState(470);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"normal" | "wide">("normal");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenuState | null>(null);
  const [selectionCommentOpen, setSelectionCommentOpen] = useState(false);
  const [selectionComment, setSelectionComment] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [selectedPage, setSelectedPage] = useState(1);
  const [selectedAnchor, setSelectedAnchor] = useState<PdfAnchor | undefined>();
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);
  const [question, setQuestion] = useState("Erkläre diesen Abschnitt einfach und wissenschaftlich.");
  const [answer, setAnswer] = useState("");
  const [translation, setTranslation] = useState("");
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [readingRuler, setReadingRuler] = useState(false);
  const [driveLink, setDriveLink] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");
  const [driveToken, setDriveToken] = useState("");
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [targetLanguage, setTargetLanguage] = useState("DE");
  const [toast, setToast] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [connections, setConnections] = useState({ drive: false, calendar: false, openai: false, deepl: false });
  const [embedCode, setEmbedCode] = useState("");
  const [dailyActivity, setDailyActivity] = useState<number | null>(null);
  const [dailyReturn, setDailyReturn] = useState("");
  const [dailyTopic, setDailyTopic] = useState("");
  const [dailyLanguage, setDailyLanguage] = useState<"en" | "de">("de");
  const [dailyComplete, setDailyComplete] = useState(false);
  const [returnUrl, setReturnUrl] = useState("");
  const [returnLabel, setReturnLabel] = useState("Back");
  const [activeCollection, setActiveCollection] = useState("Bibliothek");
  const dragStart = useRef<{ x: number; width: number } | null>(null);
  const selectionMenuRef = useRef<HTMLDivElement>(null);
  const recoveryFileInputRef = useRef<HTMLInputElement>(null);
  const settingsDialogRef = useRef<HTMLElement>(null);
  const settingsReturnFocusRef = useRef<HTMLElement | null>(null);
  const requestedPage = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setEmbed(params.get("embed") === "1");
      const safeReturn = safeReturnUrl(params.get("return"));
      if (safeReturn) {
        setReturnUrl(safeReturn);
        setReturnLabel(params.get("returnLabel")?.slice(0, 80) || "Back");
      }
      if (params.get("from") === "daily") {
        setDailyActivity(Number(params.get("activity")) || 7);
        setDailyReturn(params.get("return") || (params.get("lang") === "en" ? "/daily" : "/heute"));
        setDailyTopic(params.get("topic") || "");
        setDailyLanguage(params.get("lang") === "en" ? "en" : "de");
        setTab("notes");
        setPanelOpen(true);
      }
      const savedWidth = Number(localStorage.getItem("pdf-studio-panel-width"));
      if (savedWidth) setPanelWidth(Math.min(760, Math.max(360, savedWidth)));
      setTargetLanguage(localStorage.getItem("pdf-studio-target-language") || "DE");
      setReadingRuler(localStorage.getItem(READING_RULER_STORE) === "true");
      const savedZoom = Number(localStorage.getItem("pdf-studio-zoom"));
      if (Number.isFinite(savedZoom) && savedZoom >= 0.65 && savedZoom <= 4) setZoom(savedZoom);
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
        setAnswer(readerState.answer);
        setTranslation(readerState.translation);
      }
      setStorageReady(true);
      setEmbedCode(`<iframe src="${window.location.origin}?embed=1" allow="clipboard-write" width="100%" height="900"></iframe>`);
      void fetch("/api/status")
        .then((response) => response.json() as Promise<{ openai?: boolean; deepl?: boolean; googleClientId?: string }>)
        .then((status) => {
          setConnections((value) => ({ ...value, openai: Boolean(status.openai), deepl: Boolean(status.deepl) }));
          if (status.googleClientId) setGoogleClientId((current) => current || status.googleClientId || "");
        })
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type === "research-pdf-studio:set-selection" && typeof event.data.payload === "string") {
        setSelectedText(event.data.payload);
        setSelectedAnchor(undefined);
        setPanelOpen(true);
      }
      if (event.data.type === "research-pdf-studio:open-drive-file" && typeof event.data.payload === "string") {
        setDriveLink(event.data.payload);
        setSettingsOpen(true);
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  useEffect(() => {
    localStorage.setItem("pdf-studio-panel-width", String(panelWidth));
  }, [panelWidth]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(READING_RULER_STORE, String(readingRuler));
  }, [readingRuler, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    const store = readMarkStore();
    store[documentId] = marks;
    localStorage.setItem(MARK_STORE, JSON.stringify(store));
    window.parent?.postMessage({ type: "research-pdf-studio:marks", payload: marks }, "*");
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
      localStorage.setItem("pdf-studio-zoom", String(zoom));
    } catch {
      // Storage failures must never interrupt reading.
    }
  }, [answer, currentPage, documentId, question, selectedPage, selectedText, storageReady, translation, zoom]);

  useEffect(() => {
    localStorage.setItem("pdf-studio-target-language", targetLanguage);
  }, [targetLanguage]);

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

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3_200);
  };

  const reportPdfError = (error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : fallback;
    // Keep document errors visible until the learner chooses a recovery action.
    setPdfError(message);
    showToast(message);
  };

  const applyPdf = async (bytes: ArrayBuffer, name: string) => {
    if (bytes.byteLength > MAX_PDF_BYTES) throw new Error("Die PDF ist größer als 200 MB.");
    const signature = new TextDecoder().decode(bytes.slice(0, 5));
    if (signature !== "%PDF-") throw new Error("Die ausgewählte Datei ist keine gültige PDF.");
    const id = await documentFingerprint(bytes);
    const savedReaderState = readReaderStateStore()[id];
    setPdfBytes(bytes);
    setPdfError("");
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
    setAnswer(savedReaderState?.answer ?? "");
    setTranslation(savedReaderState?.translation ?? "");
    setCurrentPage(savedReaderState?.page ?? 1);
    setPageCount(1);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const localPdfId = params.get("localPdf")?.trim().toLowerCase() || "";
    const sourceUrl = params.get("sourceUrl")?.trim() || params.get("url")?.trim() || "";
    if (!sourceUrl && !localPdfId) return;
    const requestedName = safeFileName(
      params.get("name")?.trim() || (localPdfId ? "Lokale-PDF.pdf" : "Öffentliche-PDF.pdf"),
    );
    const requestedPageValue = Number(params.get("page"));
    requestedPage.current = Number.isFinite(requestedPageValue) && requestedPageValue > 0
      ? Math.floor(requestedPageValue)
      : null;
    let cancelled = false;

    const openLinkedPdf = async () => {
      setDriveBusy(true);
      setPdfName(requestedName.replace(/\.pdf$/i, ""));
      try {
        if (localPdfId && !/^[a-f0-9]{64}$/.test(localPdfId)) {
          throw new Error("Die lokale PDF-Verknüpfung ist ungültig.");
        }
        const endpoint = localPdfId
          ? `/api/local-pdf?id=${encodeURIComponent(localPdfId)}`
          : `/api/pdf/public?url=${encodeURIComponent(sourceUrl)}`;
        const response = await fetch(endpoint, {
          cache: "no-store",
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({})) as { message?: string };
          throw new Error(payload.message || "Die ausgewählte PDF konnte nicht geöffnet werden.");
        }
        if (cancelled) return;
        await applyPdf(await response.arrayBuffer(), requestedName);
        if (!cancelled) showToast(`${requestedName} im PDF Reader geöffnet`);
      } catch (error) {
        if (!cancelled) {
          reportPdfError(error, "Die ausgewählte PDF konnte nicht geöffnet werden.");
        }
      } finally {
        if (!cancelled) setDriveBusy(false);
      }
    };

    void openLinkedPdf();
    return () => { cancelled = true; };
  }, []);

  const importLocalPdf = async (file?: File) => {
    if (!file) return;
    try {
      await applyPdf(await file.arrayBuffer(), file.name);
      showToast(`${file.name} geöffnet`);
    } catch (error) {
      reportPdfError(error, "Die PDF konnte nicht geöffnet werden.");
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

  const addMark = (options: { tone?: Tone; type?: MarkType; note?: string } = {}) => {
    if (!selectedText.trim()) {
      showToast("Bitte zuerst Text auswählen.");
      return false;
    }
    const id = crypto.randomUUID();
    const nextTone = options.tone ?? tone;
    const nextType = options.type ?? markType;
    const nextNote = options.note?.trim();
    const next: Mark = {
      id,
      text: selectedText.trim(),
      page: selectedAnchor?.page ?? selectedPage,
      tone: nextTone,
      type: nextType,
      anchor: selectedAnchor,
      ...(nextNote ? { note: nextNote } : {}),
      createdAt: new Date().toISOString(),
    };
    setMarks((current) => [next, ...current]);
    setSelectedMarkId(id);
    showToast(nextNote ? "Kommentar gespeichert" : `${toneLabels[nextTone]} gespeichert`);
    return true;
  };

  const deleteMark = useCallback((id: string) => {
    setMarks((current) => current.filter((mark) => mark.id !== id));
    setSelectedMarkId((current) => current === id ? null : current);
    showToast("Markierung gelöscht");
  }, []);

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

  const handleDocumentReady = useCallback((pages: number) => {
    setPageCount(pages);
    const savedPage = requestedPage.current ?? readReaderStateStore()[documentId]?.page ?? 1;
    requestedPage.current = null;
    const page = Math.min(pages, Math.max(1, savedPage));
    window.setTimeout(() => {
      setCurrentPage(page);
      document.getElementById(`pdf-page-${page}`)?.scrollIntoView({ block: "start" });
    }, 0);
  }, [documentId]);

  const askAi = async (mode: "explain" | "translate" | "test" = "explain", customQuestion?: string) => {
    if (mode !== "test" && !selectedText.trim()) return showToast("Kein Text ausgewählt.");
    setBusy(true);
    if (mode !== "translate") setAnswer("");
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
      if (mode === "translate") setTranslation(data.answer || "");
      else if (mode !== "test") setAnswer(data.answer || "");
      if (mode === "test") showToast("OpenAI-Verbindung erfolgreich getestet");
    } catch (error) {
      setConnections((value) => ({ ...value, openai: false }));
      const message = error instanceof Error ? error.message : "Die KI-Antwort konnte nicht geladen werden.";
      if (mode === "translate") setTranslation(message);
      else if (mode !== "test") setAnswer(message);
      else showToast(message);
    } finally {
      setBusy(false);
    }
  };

  const translateText = async (test = false) => {
    if (!test && !selectedText.trim()) return showToast("Kein Text ausgewählt.");
    setBusy(true);
    if (!test) setTranslation("");
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: test ? undefined : selectedText, target: targetLanguage, mode: test ? "test" : "translate" }),
      });
      const data = (await response.json()) as { translation?: string; message?: string };
      if (!response.ok) throw new Error(data.message);
      setConnections((value) => ({ ...value, deepl: true }));
      if (test) showToast("DeepL-Verbindung erfolgreich getestet");
      else setTranslation(data.translation || "");
    } catch (error) {
      setConnections((value) => ({ ...value, deepl: false }));
      const message = error instanceof Error ? error.message : "Übersetzung nicht verfügbar.";
      if (test) showToast(message); else setTranslation(message);
    } finally {
      setBusy(false);
    }
  };

  const saveNote = () => {
    if (!selectedText.trim() || !note.trim()) return showToast("Text und Notiz werden benötigt.");
    const id = crypto.randomUUID();
    setMarks((current) => [{
      id,
      text: selectedText.trim(),
      page: selectedAnchor?.page ?? selectedPage,
      tone,
      type: markType,
      anchor: selectedAnchor,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    }, ...current]);
    setSelectedMarkId(id);
    setNote("");
    showToast("Notiz gespeichert");
  };

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

  const openPublicDrivePdf = async () => {
    const target = extractDriveTarget(driveLink);
    if (target.kind === "folder") {
      if (driveToken) return void listDrivePdfs(driveToken);
      return showToast("Das ist ein Ordnerlink. Verbinde zuerst dein Google-Konto, um PDFs im Ordner auszuwählen.");
    }
    if (target.kind !== "file") return showToast("Bitte einen gültigen Google-Drive-Dateilink oder eine Datei-ID eingeben.");
    setDriveBusy(true);
    try {
      const response = await fetch(`/api/drive/public?fileId=${encodeURIComponent(target.id)}`);
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        throw new Error(data.message || "Die Drive-PDF konnte nicht geöffnet werden.");
      }
      await applyPdf(await response.arrayBuffer(), `Google-Drive-${target.id}.pdf`);
      setConnections((value) => ({ ...value, drive: true }));
      setSettingsOpen(false);
      showToast("Öffentliche Drive-PDF geöffnet");
    } catch (error) {
      setConnections((value) => ({ ...value, drive: false }));
      showToast(error instanceof Error ? error.message : "Die Drive-PDF konnte nicht geöffnet werden.");
    } finally {
      setDriveBusy(false);
    }
  };

  const listDrivePdfs = async (token = driveToken) => {
    if (!token) return;
    setDriveBusy(true);
    try {
      const target = extractDriveTarget(driveLink);
      const queryParts = ["mimeType='application/pdf'", "trashed=false"];
      if (target.kind === "folder") queryParts.push(`'${target.id}' in parents`);
      const params = new URLSearchParams({
        q: queryParts.join(" and "),
        pageSize: "100",
        orderBy: "modifiedTime desc",
        fields: "files(id,name,modifiedTime,size)",
      });
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = (await response.json()) as { files?: DriveFile[]; error?: { message?: string } };
      if (!response.ok) throw new Error(data.error?.message || "Drive-Dateien konnten nicht gelesen werden.");
      setDriveFiles(data.files ?? []);
      setConnections((value) => ({ ...value, drive: true }));
      showToast(`${data.files?.length ?? 0} PDF-Dateien gefunden`);
    } catch (error) {
      setConnections((value) => ({ ...value, drive: false }));
      showToast(error instanceof Error ? error.message : "Drive-Dateien konnten nicht gelesen werden.");
    } finally {
      setDriveBusy(false);
    }
  };

  const connectGoogleDrive = async () => {
    if (!googleClientId.trim()) {
      window.open("http://127.0.0.1:4312/settings", "_blank", "noopener,noreferrer");
      return showToast("Die Google-Anmeldung wird einmal in den zentralen Einstellungen vorbereitet.");
    }
    setDriveBusy(true);
    try {
      await loadGoogleIdentity();
      const token = await new Promise<string>((resolve, reject) => {
        const client = window.google?.accounts.oauth2.initTokenClient({
          client_id: googleClientId.trim(),
          scope: "https://www.googleapis.com/auth/drive.readonly",
          callback: (response) => response.access_token ? resolve(response.access_token) : reject(new Error(response.error_description || response.error || "Google hat keine Freigabe erteilt.")),
          error_callback: () => reject(new Error("Das Google-Fenster wurde geschlossen oder blockiert.")),
        });
        if (!client) return reject(new Error("Google konnte nicht initialisiert werden."));
        client.requestAccessToken({ prompt: "consent" });
      });
      setDriveToken(token);
      setConnections((value) => ({ ...value, drive: true }));
      await listDrivePdfs(token);
    } catch (error) {
      setConnections((value) => ({ ...value, drive: false }));
      showToast(error instanceof Error ? error.message : "Google Drive konnte nicht verbunden werden.");
    } finally {
      setDriveBusy(false);
    }
  };

  const importDriveFile = async (file: DriveFile) => {
    if (!driveToken) return showToast("Google Drive ist nicht verbunden.");
    setDriveBusy(true);
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`, { headers: { Authorization: `Bearer ${driveToken}` } });
      if (!response.ok) throw new Error("Die ausgewählte Drive-PDF konnte nicht heruntergeladen werden.");
      await applyPdf(await response.arrayBuffer(), file.name);
      setSettingsOpen(false);
      showToast(`${file.name} geöffnet`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Die Drive-PDF konnte nicht geöffnet werden.");
    } finally {
      setDriveBusy(false);
    }
  };

  const createCalendarEvent = () => {
    const start = new Date(Date.now() + 5 * 60_000);
    const end = new Date(start.getTime() + 45 * 60_000);
    const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", `PDF-Lesesitzung · ${pdfName}`);
    url.searchParams.set("dates", `${stamp(start)}/${stamp(end)}`);
    url.searchParams.set("details", "Fokus-Lesesitzung aus Research PDF Studio");
    window.open(url.toString(), "_blank", "noopener,noreferrer");
    setConnections((value) => ({ ...value, calendar: true }));
  };

  const returnToCallingApp = () => {
    if (returnUrl) {
      window.location.assign(returnUrl);
      return;
    }
    window.history.back();
  };

  const selectCollection = (collection: string) => {
    setActiveCollection(collection);
    if (collection === "Markierungen") {
      setTab("notes");
      setPanelOpen(true);
    }
    showToast(`${collection} ausgewählt`);
  };

  const downloadOriginal = () => {
    if (!pdfBytes) return showToast("Öffne zuerst eine PDF.");
    downloadBlob(new Blob([pdfBytes], { type: "application/pdf" }), `${safeFileName(pdfName)}.pdf`);
  };

  const exportMarks = () => {
    const payload = { version: 2, documentId, documentName: pdfName, exportedAt: new Date().toISOString(), marks };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `${safeFileName(pdfName)}-markierungen.json`);
  };

  const runDocumentExport = async (format: "word" | "excel" | "images" | "flashcards") => {
    if (!pdfBytes) return showToast("Öffne zuerst eine PDF.");
    setBusy(true);
    try {
      const baseName = safeFileName(pdfName);
      if (format === "word") {
        downloadBlob(await pdfToWord(pdfBytes, pdfName), `${baseName}.docx`);
        showToast("Word-Datei erstellt");
      }
      if (format === "excel") {
        downloadBlob(await pdfToExcel(pdfBytes), `${baseName}.xlsx`);
        showToast("Excel-Datei erstellt");
      }
      if (format === "images") {
        downloadBlob(await pdfToImages(pdfBytes), `${baseName}-seitenbilder.zip`);
        showToast("Seitenbilder als ZIP erstellt");
      }
      if (format === "flashcards") {
        const cards = marks.length
          ? marks.map((mark) => ({
              front: mark.text,
              back: mark.translation || mark.note || toneLabels[mark.tone],
              page: mark.page,
              tag: toneLabels[mark.tone],
            }))
          : selectedText.trim()
            ? [{ front: selectedText.trim(), back: translation || note || "", page: selectedPage, tag: "PDF" }]
            : [];
        if (!cards.length) {
          showToast("Markiere zuerst Text oder speichere eine Markierung für die Flashcards.");
          return;
        }
        downloadBlob(flashcardsToCsv(cards), `${baseName}-flashcards.csv`);
        showToast(`${cards.length} Flashcard${cards.length === 1 ? "" : "s"} erstellt`);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Die Datei konnte nicht erstellt werden.");
    } finally {
      setBusy(false);
    }
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

  const jumpToMark = (mark: Mark) => {
    setSelectedText(mark.text);
    setSelectedPage(mark.page);
    setSelectedAnchor(mark.anchor);
    setSelectedMarkId(mark.id);
    setPanelOpen(true);
    goToPage(mark.page);
    showToast(`Seite ${mark.page}: Textstelle angezeigt`);
  };

  const sampleMark = marks.find((mark) => !mark.anchor && sampleText.includes(mark.text));
  const activeMark = selectedMarkId ? marks.find((mark) => mark.id === selectedMarkId) : undefined;
  const effectivePanelWidth = panelMode === "wide" ? Math.min(760, Math.max(panelWidth, 620)) : panelWidth;

  const returnToDailyPractice = () => {
    if (dailyReturn) window.location.href = dailyReturn;
  };

  const completeDailyNotebook = () => {
    if (dailyActivity === null) return;
    const storageKey = dailyLanguage === "en"
      ? "english-automaticity:daily-session:v1"
      : "deutsch-automaticity:daily-session:v1";
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "{}") as {
        completedActivities?: number[];
        mistakes?: unknown[];
      };
      const completedActivities = Array.from(new Set([...(stored.completedActivities || []), dailyActivity]));
      localStorage.setItem(storageKey, JSON.stringify({
        ...stored,
        completedActivities,
        lastCompletedAt: new Date().toISOString(),
      }));
    } catch {
      localStorage.setItem(storageKey, JSON.stringify({
        completedActivities: [dailyActivity],
        lastCompletedAt: new Date().toISOString(),
      }));
    }
    setDailyComplete(true);
  };

  // Just switches to the Notes tab and scrolls it into view — there is no
  // spaced-repetition or review-queue logic here, so naming/copy must not
  // imply one.
  const openDailyNotes = () => {
    setDailyComplete(false);
    setTab("notes");
    setPanelOpen(true);
    window.setTimeout(() => document.querySelector(".notes-content")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const closeSelectionMenu = useCallback(() => {
    setSelectionMenu(null);
    setSelectionCommentOpen(false);
    setSelectionComment("");
  }, []);

  const handlePdfSelection = (selection: PdfSelection) => {
    setSelectedText(selection.text);
    setSelectedPage(selection.page);
    setSelectedAnchor(selection.anchor);
    setSelectedMarkId(null);
    if (selection.menuPosition) {
      setSelectionMenu(selection.menuPosition);
      setSelectionCommentOpen(false);
      setSelectionComment("");
    } else {
      closeSelectionMenu();
    }
    window.parent?.postMessage({ type: "research-pdf-studio:selection", payload: selection }, "*");
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

  useEffect(() => {
    if (!settingsOpen) return;

    // Keep keyboard focus inside the modal and return it to the control that opened it.
    settingsReturnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const dialog = settingsDialogRef.current;
    const focusableSelector = [
      "button:not([disabled])",
      "a[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");
    const getFocusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    getFocusable()[0]?.focus();

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSettingsOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      document.removeEventListener("keydown", handleDialogKeyDown);
      settingsReturnFocusRef.current?.focus();
    };
  }, [settingsOpen]);

  return (
    <main className={`app-shell pdf-reader-root ${embed ? "embed" : ""}`} id="main-content" tabIndex={-1}>
      {/* A shared skip target makes keyboard entry consistent with the learning and settings apps. */}
      <a className="skip-link" href="#main-content">Zum Hauptinhalt springen</a>
      <ReadingRuler enabled={readingRuler} onToggle={setReadingRuler} zoom={zoom} />
      <header className="topbar">
        <div className="reader-history">
          <button type="button" onClick={returnToCallingApp} aria-label={returnLabel}>← <b>{returnLabel}</b></button>
        </div>
        <div className="brand"><span className="brand-mark">▣</span><span>Research PDF Studio</span></div>
        <input className="document-title-input" value={pdfName} onChange={(event) => setPdfName(event.target.value)} aria-label="Dokumentname bearbeiten" />
        <div className="top-actions">
          <button className={`connection ${connections.drive ? "online" : ""}`} onClick={() => setSettingsOpen(true)}>◫ <span>Google Drive</span><small>{connections.drive ? "Verbunden" : "Einrichten"}</small></button>
          <button className={`connection ${connections.calendar ? "online" : ""}`} onClick={createCalendarEvent}>▦ <span>Kalender</span><small>{connections.calendar ? "Bereit" : "Termin"}</small></button>
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Einstellungen">⚙</button>
        </div>
      </header>

      {dailyActivity !== null && (
        <section className="daily-reader-context" aria-label={dailyLanguage === "en" ? "Today's notebook exercise" : "Heutige Notizbuchübung"}>
          <button type="button" onClick={() => window.history.back()}>← {dailyLanguage === "en" ? "Previous" : "Zurück"}</button>
          <div>
            <strong>{dailyLanguage === "en" ? "Today’s Notebook & PDF review" : "Heutige Notizbuch- und PDF-Wiederholung"}</strong>
            <span>{dailyTopic || (dailyLanguage === "en" ? "Review today’s notes and evidence." : "Notizen und Nachweise von heute wiederholen.")}</span>
          </div>
          <button type="button" className="primary" onClick={completeDailyNotebook}>
            {dailyLanguage === "en" ? "Finish today’s review" : "Heutige Wiederholung abschließen"}
          </button>
        </section>
      )}

      <section className="workspace">
        <nav className="sidebar" aria-label="Dokumentbereiche">
          <button className={`nav-item ${activeCollection === "Bibliothek" ? "active" : ""}`} onClick={() => selectCollection("Bibliothek")}>▥ <span>Bibliothek</span></button>
          <button className={`nav-item ${activeCollection === "Heute lesen" ? "active" : ""}`} onClick={() => selectCollection("Heute lesen")}>◷ <span>Heute lesen</span></button>
          <p className="nav-label">SAMMLUNGEN</p>
          {["Dissertation", "Methoden", "Literatur", "Sprachen"].map((label) => <button className={`nav-item ${activeCollection === label ? "active" : ""}`} key={label} onClick={() => selectCollection(label)}>□ <span>{label}</span></button>)}
          <div className="nav-bottom">
            <button className={`nav-item ${activeCollection === "Markierungen" ? "active" : ""}`} onClick={() => selectCollection("Markierungen")}>◇ <span>Markierungen</span></button>
            <button className="nav-item" onClick={() => setSettingsOpen(true)}>⚙ <span>Einstellungen</span></button>
          </div>
        </nav>

        <section className="reader-area">
          <div className="reader-toolbar">
            <button onClick={() => goToPage(currentPage - 1)} disabled={!pdfBytes || currentPage <= 1}>‹</button>
            <span className="page-chip">Seite <b>{currentPage}</b> von {pageCount}</span>
            <button onClick={() => goToPage(currentPage + 1)} disabled={!pdfBytes || currentPage >= pageCount}>›</button>
            <span className="separator" />
            <button onClick={() => setZoom((value) => Math.max(0.65, value - 0.1))}>−</button>
            <span className="page-chip">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((value) => Math.min(1.8, value + 0.1))}>＋</button>
            <span className="toolbar-spacer" />
            <label className="upload-button">Datei öffnen<input ref={recoveryFileInputRef} type="file" accept="application/pdf,.pdf" onChange={(event) => void importLocalPdf(event.target.files?.[0])} /></label>
            <button onClick={() => setSettingsOpen(true)}>Drive</button>
            <button className="toolbar-secondary" onClick={downloadOriginal} disabled={!pdfBytes}>Original</button>
            <button className="toolbar-secondary" onClick={() => void exportAnnotatedPdf()} disabled={!pdfBytes}>PDF exportieren</button>
            <button className="panel-toggle" onClick={() => setPanelOpen((value) => !value)}>{panelOpen ? "Panel schließen" : "Panel öffnen"}</button>
          </div>

          {pdfError ? <div className="reader-recovery" role="alert"><span><strong>PDF konnte nicht geöffnet werden.</strong>{pdfError}</span><button onClick={() => recoveryFileInputRef.current?.click()} type="button">Andere PDF auswählen</button></div> : null}

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

          <div className="paper-stage" onMouseUp={() => { captureSampleSelection(true); }} onTouchEnd={() => { window.setTimeout(() => captureSampleSelection(true), 0); }} onContextMenu={(event) => { if (!pdfBytes && captureSampleSelection(true)) event.preventDefault(); }}>
            {pdfBytes ? (
              <PdfDocument
                data={pdfBytes}
                scale={zoom}
                marks={marks}
                onDocumentReady={handleDocumentReady}
                onPageVisible={setCurrentPage}
                onSelection={handlePdfSelection}
              />
            ) : (
              <article className="paper">
                <div className="empty-reader-callout">
                  <strong>PDF öffnen und direkt bearbeiten</strong>
                  <span>Öffne eine lokale PDF oder importiere eine Datei aus Google Drive. Danach kannst du echten PDF-Text auswählen, markieren, übersetzen und exportieren.</span>
                  <label className="primary upload-button">PDF auswählen<input type="file" accept="application/pdf,.pdf" onChange={(event) => void importLocalPdf(event.target.files?.[0])} /></label>
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
              <textarea className="selected-input" value={selectedText} onChange={(event) => { setSelectedText(event.target.value); setSelectedAnchor(undefined); setSelectedMarkId(null); }} placeholder="Markiere Text im PDF …" />
              <div className="selection-actions"><button onClick={() => { setSelectedText(""); setSelectedAnchor(undefined); setSelectedMarkId(null); }}>Auswahl löschen</button><button onClick={() => navigator.clipboard.writeText(selectedText)}>Kopieren</button></div>
              <label>Meine Frage</label>
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Was möchtest du wissen?" />
              <div className="prompt-chips">{["Einfach", "Wissenschaftlich", "Zusammenfassen", "Beispiel", "Forschungsbezug"].map((label) => <button key={label} onClick={() => setQuestion(`${label}: ${question}`)}>{label}</button>)}</div>
              <button className="primary" disabled={busy} onClick={() => void askAi()}>{busy ? "Wird verarbeitet …" : "✦ Erklären"}</button>
              {answer && <div className="result-card"><strong>KI-Antwort</strong><p>{answer}</p><div><button onClick={() => navigator.clipboard.writeText(answer)}>Kopieren</button><button onClick={() => setMarks((items) => [{ id: crypto.randomUUID(), text: selectedText, page: selectedPage, tone, type: markType, anchor: selectedAnchor, note: answer, createdAt: new Date().toISOString() }, ...items])}>Speichern</button></div></div>}
            </div>}

            {tab === "translate" && <div className="panel-content">
              <div className="language-row"><select aria-label="Ausgangssprache"><option>Automatisch erkennen</option><option>Englisch</option><option>Deutsch</option><option>Persisch</option></select><span>→</span><select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)} aria-label="Zielsprache">{Object.entries(targetLanguages).map(([code, label]) => <option value={code} key={code}>{label}</option>)}</select></div>
              <label>Originaltext</label><textarea value={selectedText} onChange={(event) => { setSelectedText(event.target.value); setSelectedAnchor(undefined); }} />
              <button className="primary" disabled={busy} onClick={() => void translateText()}>{busy ? "Wird übersetzt …" : "Mit DeepL übersetzen"}</button>
              <button className="secondary" disabled={busy} onClick={() => void askAi("translate", `Übersetze den Text in ${targetLanguages[targetLanguage] || targetLanguage}.`)}>Mit KI übersetzen</button>
              {translation && <div className="result-card"><strong>Übersetzung</strong><p>{translation}</p><div><button onClick={() => navigator.clipboard.writeText(translation)}>Kopieren</button><button onClick={() => setMarks((items) => [{ id: crypto.randomUUID(), text: selectedText, page: selectedPage, tone, type: markType, anchor: selectedAnchor, translation, createdAt: new Date().toISOString() }, ...items])}>Mit Markierung speichern</button></div></div>}
              <p className="helper">Wenn DeepL eine Sprache oder dein Kontingent nicht akzeptiert, kannst du dieselbe Auswahl mit KI übersetzen.</p>
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
                <p>{item.text}</p>
                {editingMarkId === item.id ? <form className="note-edit-form" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); saveEditedMark(item.id); }}>
                  <label>Kommentar<textarea value={editingComment} onChange={(event) => setEditingComment(event.target.value)} placeholder="Kommentar hinzufügen …" /></label>
                  <label>Übersetzung<textarea value={editingTranslation} onChange={(event) => setEditingTranslation(event.target.value)} placeholder="Übersetzung ergänzen …" /></label>
                  <div><button type="button" onClick={cancelEditingMark}>Abbrechen</button><button type="submit">Änderungen speichern</button></div>
                </form> : <>{item.translation && <small>Übersetzung: {item.translation}</small>}{item.note && <small>{item.note}</small>}</>}
              </article>) : <div className="empty-notes">Keine passenden Markierungen gefunden.</div>}</div>
            </div>}
          </aside>
        </>}
      </section>

      {settingsOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
        <section ref={settingsDialogRef} className="settings-modal" aria-modal="true" role="dialog" aria-label="Integrationen und Exporte">
          <div className="modal-head"><div><small>INTEGRATIONEN</small><h2>Einstellungen</h2><p>Verbindungen werden erst nach einem echten Test als aktiv angezeigt.</p></div><button onClick={() => setSettingsOpen(false)} aria-label="Einstellungen schließen">×</button></div>

          <div className="setting-card">
            <div><strong>Leselineal</strong><p>Das gelbe Leseband folgt dem Zeiger. Seine Höhe passt sich automatisch an Schriftgröße und PDF-Zoom an.</p></div>
            <label className="settings-reading-ruler-toggle">
              <input type="checkbox" checked={readingRuler} onChange={(event) => setReadingRuler(event.target.checked)} />
              <span>{readingRuler ? "Aktiv" : "Aus"}</span>
            </label>
          </div>

          <div className="setting-card drive-card">
            <div><strong>Google Drive · PDF-Eingang</strong><p>Öffentliche Einzeldatei direkt öffnen oder private Dateien nach Google-Freigabe auswählen.</p></div>
            <span className={`status ${connections.drive ? "ok" : ""}`}>{connections.drive ? "Verbunden" : "Nicht verbunden"}</span>
            <label className="field-label">Drive-Datei- oder Ordnerlink<input value={driveLink} onChange={(event) => setDriveLink(event.target.value)} placeholder="https://drive.google.com/drive/folders/… oder /file/d/…" /></label>
            <button onClick={() => void openPublicDrivePdf()} disabled={driveBusy}>{driveBusy ? "Wird geprüft …" : "Öffentliche PDF öffnen"}</button>
            <button className="accent-button" onClick={() => void connectGoogleDrive()} disabled={driveBusy || !googleClientId}>{connections.drive ? "Erneut freigeben" : "Mit Google verbinden"}</button>
            <button className="full-row" onClick={() => window.open("http://127.0.0.1:4312/settings", "_blank", "noopener,noreferrer")}>Zentrale Google-Einstellungen öffnen</button>
            <p className="full-row setup-note">Die Google-Client-Konfiguration kommt automatisch aus den zentralen Einstellungen. E-Mail und Passwort werden nur im offiziellen Google-Fenster eingegeben.</p>
            {driveFiles.length > 0 && <div className="drive-file-list full-row">{driveFiles.map((file) => <button key={file.id} onClick={() => void importDriveFile(file)}><span>▧</span><span><b>{file.name}</b><small>{file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString("de-DE") : "PDF"}</small></span><span>Öffnen</span></button>)}</div>}
          </div>

          <div className="setting-card"><div><strong>Google Calendar</strong><p>Lesesitzung als vorbereiteten Kalendereintrag öffnen.</p></div><span className={`status ${connections.calendar ? "ok" : ""}`}>{connections.calendar ? "Bereit" : "Optional"}</span><button className="full-row" onClick={createCalendarEvent}>Testtermin erstellen</button></div>

          <div className="setting-grid">
            <div className="setting-card compact"><div className="provider-head"><strong>OpenAI</strong><span className={`status ${connections.openai ? "ok" : ""}`}>{connections.openai ? "Verbunden und geprüft" : "Nicht verbunden"}</span></div><p>PDF Visual verwendet die verschlüsselte OpenAI-Verbindung aus den zentralen Einstellungen. Der Schlüssel wird hier nie angezeigt oder gespeichert.</p><div className="button-row"><button onClick={() => void askAi("test")} disabled={busy || !connections.openai}>Verbindung testen</button><button onClick={() => window.open("http://127.0.0.1:4312/settings", "_blank", "noopener,noreferrer")}>Zentrale Einstellungen</button></div></div>
            <div className="setting-card compact"><div className="provider-head"><strong>DeepL</strong><span className={`status ${connections.deepl ? "ok" : ""}`}>{connections.deepl ? "Verbunden und geprüft" : "Nicht verbunden"}</span></div><p>DeepL wird einmal zentral verbunden und danach in allen Apps gemeinsam verwendet.</p><label className="field-label">Standard-Zielsprache<select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)}>{Object.entries(targetLanguages).map(([code, label]) => <option value={code} key={code}>{label}</option>)}</select></label><div className="button-row"><button onClick={() => void translateText(true)} disabled={busy || !connections.deepl}>Verbindung testen</button><button onClick={() => window.open("http://127.0.0.1:4312/settings", "_blank", "noopener,noreferrer")}>Zentrale Einstellungen</button></div></div>
          </div>

          <div className="setting-card export-card">
            <div><strong>Importieren & umwandeln</strong><p>Eine PDF öffnen und ohne Cloud-Dienst als PDF, Word, Excel, Seitenbilder oder Flashcards speichern.</p></div>
            <span className={`status ${pdfBytes ? "ok" : ""}`}>{pdfBytes ? "PDF geladen" : "Keine PDF"}</span>
            <div className="export-buttons full-row">
              <label className="upload-button">PDF auswählen<input type="file" accept="application/pdf,.pdf" onChange={(event) => void importLocalPdf(event.target.files?.[0])} /></label>
              <button onClick={downloadOriginal} disabled={!pdfBytes || busy}>PDF</button>
              <button onClick={() => void exportAnnotatedPdf()} disabled={!pdfBytes || busy}>Markierte PDF</button>
              <button onClick={() => void runDocumentExport("word")} disabled={!pdfBytes || busy}>Word (.docx)</button>
              <button onClick={() => void runDocumentExport("excel")} disabled={!pdfBytes || busy}>Excel (.xlsx)</button>
              <button onClick={() => void runDocumentExport("images")} disabled={!pdfBytes || busy}>Bilder (.zip)</button>
              <button onClick={() => void runDocumentExport("flashcards")} disabled={!pdfBytes || busy}>Flashcards (.csv)</button>
              <button onClick={exportMarks} disabled={!marks.length || busy}>Markierungen (.json)</button>
            </div>
            <p className="full-row conversion-note">Word und Excel enthalten den auswählbaren PDF-Text. Bilder werden mit hoher Auflösung pro Seite exportiert. Flashcards werden aus Markierungen oder dem aktuell ausgewählten Text erzeugt.</p>
          </div>

          <div className="embed-box"><strong>In andere Apps integrieren</strong><p>Der Code ist vollständig editierbar. Auswahl und Markierungen werden zusätzlich über <code>window.postMessage</code> bereitgestellt.</p><textarea className="code-editor" value={embedCode} onChange={(event) => setEmbedCode(event.target.value)} spellCheck={false} aria-label="Editierbarer Embed-Code" /><div className="embed-actions"><button onClick={() => navigator.clipboard.writeText(embedCode)}>Code kopieren</button></div></div>
        </section>
      </div>}

      {dailyComplete && (
        <div className="daily-complete-backdrop" role="presentation">
          <section className="daily-complete-card" role="dialog" aria-modal="true" aria-labelledby="daily-reader-complete-title">
            <span className="daily-complete-icon">✓</span>
            <h2 id="daily-reader-complete-title">
              {dailyLanguage === "en" ? "Today’s Notebook & PDF review is complete" : "Die heutige Notizbuch- und PDF-Wiederholung ist abgeschlossen"}
            </h2>
            <p>{dailyLanguage === "en" ? "Your place, highlights, and notes remain saved." : "Leseposition, Markierungen und Notizen bleiben gespeichert."}</p>
            <div className="daily-complete-actions">
              <button type="button" className="primary" onClick={returnToDailyPractice}>{dailyLanguage === "en" ? "OK · Return to Daily Practice" : "OK · Zurück zur Tagesübung"}</button>
              <button type="button" onClick={() => setDailyComplete(false)}>{dailyLanguage === "en" ? "Do it again" : "Noch einmal"}</button>
              <button type="button" onClick={openDailyNotes}>{dailyLanguage === "en" ? "Open notes" : "Notizen öffnen"}</button>
            </div>
          </section>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
