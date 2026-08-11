export type PdfRect = { x: number; y: number; width: number; height: number };
export type PdfAnchor = { page: number; start: number; end: number; rects: PdfRect[] };
export type PdfMarkVisual = {
  id: string;
  page: number;
  tone: "yellow" | "green" | "blue" | "pink" | "red";
  type: "highlight" | "underline" | "strike";
  anchor?: PdfAnchor;
};
export type PdfMark = PdfMarkVisual & {
  text: string;
  note?: string;
  translation?: string;
  createdAt: string;
};

const tones = new Set<PdfMarkVisual["tone"]>(["yellow", "green", "blue", "pink", "red"]);
const types = new Set<PdfMarkVisual["type"]>(["highlight", "underline", "strike"]);

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}

function sanitizeAnchor(value: unknown): PdfAnchor | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<PdfAnchor>;
  const page = finiteNumber(candidate.page);
  const start = finiteNumber(candidate.start);
  const end = finiteNumber(candidate.end);
  if (page === null || start === null || end === null || page < 1 || end <= start) return undefined;
  if (!Array.isArray(candidate.rects)) return undefined;

  const rects = candidate.rects.flatMap((rect) => {
    if (!rect || typeof rect !== "object") return [];
    const item = rect as Partial<PdfRect>;
    const x = finiteNumber(item.x);
    const y = finiteNumber(item.y);
    const width = finiteNumber(item.width);
    const height = finiteNumber(item.height);
    if (x === null || y === null || width === null || height === null || width <= 0 || height <= 0) return [];
    return [{ x: clampUnit(x), y: clampUnit(y), width: clampUnit(width), height: clampUnit(height) }];
  }).filter((rect) => rect.width > 0 && rect.height > 0);

  return rects.length ? { page: Math.floor(page), start, end, rects } : undefined;
}

function fallbackId(index: number) {
  return `mark-${Date.now()}-${index}`;
}

const providerFailureMessages = new Set([
  "OpenAI ist noch nicht eingerichtet. Verbinde OpenAI einmal in den zentralen Einstellungen.",
  "DeepL ist noch nicht eingerichtet. Verbinde DeepL einmal in den zentralen Einstellungen.",
  "OpenAI ist vorübergehend nicht erreichbar. Bitte später erneut versuchen.",
  "DeepL ist vorübergehend nicht erreichbar. Bitte später erneut versuchen.",
  "Übersetzung nicht verfügbar.",
]);

export function isPdfProviderFailureMessage(value: unknown) {
  return typeof value === "string" && providerFailureMessages.has(value.trim());
}

function optionalResult(value: unknown) {
  if (typeof value !== "string") return undefined;
  const result = value.trim();
  if (!result || isPdfProviderFailureMessage(result)) return undefined;
  return result;
}

function normalizedText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function sameLogicalMark(left: PdfMark, right: PdfMark) {
  if (left.anchor && right.anchor) {
    return left.anchor.page === right.anchor.page
      && left.anchor.start === right.anchor.start
      && left.anchor.end === right.anchor.end;
  }
  if (left.anchor || right.anchor) return false;
  return left.page === right.page && normalizedText(left.text) === normalizedText(right.text);
}

function mergeMark(primary: PdfMark, secondary: PdfMark): PdfMark {
  return {
    ...secondary,
    ...primary,
    id: primary.id,
    note: primary.note ?? secondary.note,
    translation: primary.translation ?? secondary.translation,
    createdAt: primary.createdAt || secondary.createdAt,
  };
}

export function upsertPdfMark(current: PdfMark[], incoming: PdfMark): PdfMark[] {
  const safeIncoming = validatePdfMarks([incoming])[0];
  if (!safeIncoming) return current;
  const matchingIndex = current.findIndex((mark) => mark.id === safeIncoming.id || sameLogicalMark(mark, safeIncoming));
  if (matchingIndex < 0) return [safeIncoming, ...current];

  const existing = current[matchingIndex];
  const merged = mergeMark({ ...safeIncoming, id: existing.id, createdAt: existing.createdAt }, existing);
  return [merged, ...current.filter((_, index) => index !== matchingIndex)];
}

export function validatePdfMarks(value: unknown): PdfMark[] {
  if (!Array.isArray(value)) return [];
  const valid = value.flatMap((candidate, index) => {
    if (!candidate || typeof candidate !== "object") return [];
    const item = candidate as Partial<PdfMark> & { id?: string | number };
    if (typeof item.text !== "string" || !item.text.trim()) return [];
    const rawPage = finiteNumber(item.page);
    const page = rawPage === null || rawPage < 1 ? 1 : Math.floor(rawPage);
    const tone = tones.has(item.tone as PdfMarkVisual["tone"]) ? item.tone as PdfMarkVisual["tone"] : "yellow";
    const type = types.has(item.type as PdfMarkVisual["type"]) ? item.type as PdfMarkVisual["type"] : "highlight";
    const id = typeof item.id === "string" || typeof item.id === "number" ? String(item.id) : fallbackId(index);
    return [{
      id,
      text: item.text,
      page,
      tone,
      type,
      note: optionalResult(item.note),
      translation: optionalResult(item.translation),
      anchor: sanitizeAnchor(item.anchor),
      createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    }];
  });

  return valid.reduce<PdfMark[]>((deduplicated, mark) => {
    const matchingIndex = deduplicated.findIndex((existing) => sameLogicalMark(existing, mark));
    if (matchingIndex < 0) return [...deduplicated, mark];
    deduplicated[matchingIndex] = mergeMark(deduplicated[matchingIndex], mark);
    return deduplicated;
  }, []);
}
