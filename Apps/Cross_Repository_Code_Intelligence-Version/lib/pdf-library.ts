export const PDF_LIBRARY_STORE = "research-pdf-studio:library:v1";

export type PdfLibraryStatus = "unread" | "reading" | "done";
export type PdfLibrarySource = {
  kind: "local" | "drive" | "url" | "bundled" | "sample";
  locator?: string;
};

export type PdfLibraryItem = {
  id: string;
  title: string;
  fileName: string;
  authors: string[];
  year?: number;
  publication?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  tags: string[];
  collections: string[];
  citationKey: string;
  status: PdfLibraryStatus;
  favorite: boolean;
  source: PdfLibrarySource;
  pageCount: number;
  markCount: number;
  addedAt: string;
  updatedAt: string;
  lastOpenedAt: string;
};

const statuses = new Set<PdfLibraryStatus>(["unread", "reading", "done"]);
const sourceKinds = new Set<PdfLibrarySource["kind"]>(["local", "drive", "url", "bundled", "sample"]);
const MAX_ITEMS = 2_000;

function text(value: unknown, max = 1_000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function stringList(value: unknown, maxItems = 30) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => text(item, 120)).filter(Boolean))].slice(0, maxItems);
}

function validDate(value: unknown, fallback: string) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return fallback;
  return new Date(value).toISOString();
}

function safeYear(value: unknown) {
  const year = Number(value);
  return Number.isInteger(year) && year >= 1400 && year <= 2200 ? year : undefined;
}

function safeCount(value: unknown) {
  const count = Number(value);
  return Number.isInteger(count) && count >= 0 && count <= 1_000_000 ? count : 0;
}

function safeSource(value: unknown): PdfLibrarySource {
  if (!value || typeof value !== "object") return { kind: "local" };
  const candidate = value as Partial<PdfLibrarySource>;
  const kind = sourceKinds.has(candidate.kind as PdfLibrarySource["kind"])
    ? candidate.kind as PdfLibrarySource["kind"]
    : "local";
  const locator = text(candidate.locator, 2_000);
  return locator ? { kind, locator } : { kind };
}

function slug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join("")
    .replace(/^./, (letter) => letter.toLocaleLowerCase())
    .slice(0, 38) || "source";
}

export function createCitationKey(title: string, authors: string[], year?: number) {
  const firstAuthor = authors[0]?.split(/\s+/).at(-1) || "";
  return `${slug(firstAuthor || title)}${year || "nd"}`;
}

export function createPdfLibraryItem(input: {
  id: string;
  title: string;
  fileName?: string;
  source?: PdfLibrarySource;
  pageCount?: number;
  markCount?: number;
}, now = new Date().toISOString()): PdfLibraryItem {
  const title = text(input.title, 500) || "Unbenanntes Dokument";
  const inferredYear = title.match(/(?:19|20)\d{2}/)?.[0];
  const year = inferredYear ? Number(inferredYear) : undefined;
  return {
    id: text(input.id, 240) || `document-${Date.now()}`,
    title,
    fileName: text(input.fileName, 500) || `${title}.pdf`,
    authors: [],
    ...(year ? { year } : {}),
    tags: [],
    collections: [],
    citationKey: createCitationKey(title, [], year),
    status: "unread",
    favorite: false,
    source: input.source ?? { kind: "local" },
    pageCount: safeCount(input.pageCount),
    markCount: safeCount(input.markCount),
    addedAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };
}

export function sanitizePdfLibraryItem(value: unknown): PdfLibraryItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<PdfLibraryItem>;
  const id = text(item.id, 240);
  const title = text(item.title, 500);
  if (!id || !title) return null;
  const now = new Date(0).toISOString();
  const authors = stringList(item.authors, 40);
  const year = safeYear(item.year);
  return {
    id,
    title,
    fileName: text(item.fileName, 500) || `${title}.pdf`,
    authors,
    ...(year ? { year } : {}),
    ...(text(item.publication, 500) ? { publication: text(item.publication, 500) } : {}),
    ...(text(item.doi, 300) ? { doi: text(item.doi, 300).replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "") } : {}),
    ...(text(item.url, 2_000) ? { url: text(item.url, 2_000) } : {}),
    ...(text(item.abstract, 8_000) ? { abstract: text(item.abstract, 8_000) } : {}),
    tags: stringList(item.tags),
    collections: stringList(item.collections),
    citationKey: text(item.citationKey, 120) || createCitationKey(title, authors, year),
    status: statuses.has(item.status as PdfLibraryStatus) ? item.status as PdfLibraryStatus : "unread",
    favorite: item.favorite === true,
    source: safeSource(item.source),
    pageCount: safeCount(item.pageCount),
    markCount: safeCount(item.markCount),
    addedAt: validDate(item.addedAt, now),
    updatedAt: validDate(item.updatedAt, now),
    lastOpenedAt: validDate(item.lastOpenedAt, now),
  };
}

export function sanitizePdfLibraryStore(value: unknown): PdfLibraryItem[] {
  const candidates = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { items?: unknown }).items)
      ? (value as { items: unknown[] }).items
      : [];
  const byId = new Map<string, PdfLibraryItem>();
  for (const candidate of candidates.slice(0, MAX_ITEMS)) {
    const item = sanitizePdfLibraryItem(candidate);
    if (item) byId.set(item.id, item);
  }
  return [...byId.values()].sort((left, right) => right.lastOpenedAt.localeCompare(left.lastOpenedAt));
}

export function upsertPdfLibraryItem(items: PdfLibraryItem[], incoming: PdfLibraryItem) {
  const safe = sanitizePdfLibraryItem(incoming);
  if (!safe) return items;
  return [safe, ...items.filter((item) => item.id !== safe.id)].slice(0, MAX_ITEMS);
}

function authorLabel(authors: string[]) {
  if (!authors.length) return "Unbekannt";
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
  return `${authors[0]} et al.`;
}

export function formatApaCitation(item: PdfLibraryItem) {
  const year = item.year ? `(${item.year}).` : "(o. J.).";
  const publication = item.publication ? ` ${item.publication}.` : "";
  const locator = item.doi ? ` https://doi.org/${item.doi}` : item.url ? ` ${item.url}` : "";
  return `${authorLabel(item.authors)} ${year} ${item.title}.${publication}${locator}`.replace(/\s+/g, " ").trim();
}

function bibValue(value: string) {
  return value.replace(/[{}]/g, "").replace(/\s+/g, " ").trim();
}

export function formatBibTeX(item: PdfLibraryItem) {
  const type = item.publication ? "article" : "misc";
  const fields = [
    `  title = {${bibValue(item.title)}}`,
    ...(item.authors.length ? [`  author = {${bibValue(item.authors.join(" and "))}}`] : []),
    ...(item.year ? [`  year = {${item.year}}`] : []),
    ...(item.publication ? [`  journal = {${bibValue(item.publication)}}`] : []),
    ...(item.doi ? [`  doi = {${bibValue(item.doi)}}`] : []),
    ...(item.url ? [`  url = {${bibValue(item.url)}}`] : []),
    ...(item.tags.length ? [`  keywords = {${bibValue(item.tags.join(", "))}}`] : []),
  ];
  return `@${type}{${item.citationKey},\n${fields.join(",\n")}\n}`;
}

