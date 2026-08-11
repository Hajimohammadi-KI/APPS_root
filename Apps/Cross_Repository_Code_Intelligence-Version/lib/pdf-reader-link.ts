const DRIVE_FILE_ID = /^[a-zA-Z0-9_-]{10,200}$/;
const MAX_QUERY_TEXT_LENGTH = 600;

export type PdfReaderTarget = {
  readerUrl: string;
  sourceUrl?: string;
  driveId?: string;
  document?: "expose";
  name?: string;
  focus?: string;
  context?: string;
  page?: number;
};

function cleanQueryText(value: string | undefined) {
  return value?.trim().slice(0, MAX_QUERY_TEXT_LENGTH) || "";
}

export function googleDriveFileId(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!url.hostname.endsWith("google.com")) return null;
    const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    const id = pathMatch?.[1] || url.searchParams.get("id");
    return id && DRIVE_FILE_ID.test(id) ? id : null;
  } catch {
    return DRIVE_FILE_ID.test(value.trim()) ? value.trim() : null;
  }
}

export function isDirectPdfUrl(value?: string) {
  if (!value) return false;
  try {
    const url = new URL(value, "https://pdf-source.local");
    return /\.pdf$/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function buildPdfReaderHref({
  readerUrl,
  sourceUrl,
  driveId,
  document,
  name,
  focus,
  context,
  page,
}: PdfReaderTarget) {
  const relative = readerUrl.startsWith("/");
  const url = new URL(readerUrl, "https://integrated-reader.local");
  const resolvedDriveId = driveId || googleDriveFileId(sourceUrl) || "";

  if (document) url.searchParams.set("document", document);
  if (resolvedDriveId) url.searchParams.set("driveId", resolvedDriveId);
  else if (sourceUrl && isDirectPdfUrl(sourceUrl)) {
    url.searchParams.set("sourceUrl", sourceUrl);
  }

  const cleanName = cleanQueryText(name);
  const cleanFocus = cleanQueryText(focus);
  const cleanContext = cleanQueryText(context);
  if (cleanName) url.searchParams.set("name", cleanName);
  if (cleanFocus) url.searchParams.set("focus", cleanFocus);
  if (cleanContext) url.searchParams.set("context", cleanContext);
  if (page && Number.isInteger(page) && page > 0) {
    url.searchParams.set("page", String(page));
  }

  return relative ? `${url.pathname}${url.search}${url.hash}` : url.toString();
}
