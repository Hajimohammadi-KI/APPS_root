const DRIVE_FILE_ID = /^[a-zA-Z0-9_-]{10,200}$/;
const DEFAULT_PDF_READER_URL = "http://127.0.0.1:4312/pdf-reader";

function driveFileId(value: string) {
  try {
    const url = new URL(value);
    if (!url.hostname.endsWith("google.com")) return null;
    const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1]
      || url.searchParams.get("id");
    return id && DRIVE_FILE_ID.test(id) ? id : null;
  } catch {
    return null;
  }
}

function isPdfUrl(value: string) {
  try {
    return /\.pdf$/i.test(new URL(value).pathname);
  } catch {
    return false;
  }
}

export function pdfReaderHrefForResource({
  sourceUrl,
  name,
  focus,
  context,
}: {
  sourceUrl: string;
  name: string;
  focus: string;
  context: string;
}) {
  const driveId = driveFileId(sourceUrl);
  if (!driveId && !isPdfUrl(sourceUrl)) return null;

  const readerUrl = process.env.NEXT_PUBLIC_PDF_READER_URL?.trim()
    || DEFAULT_PDF_READER_URL;
  const url = new URL(readerUrl);
  if (driveId) url.searchParams.set("driveId", driveId);
  else url.searchParams.set("sourceUrl", sourceUrl);
  url.searchParams.set("name", name.trim().slice(0, 600));
  url.searchParams.set("focus", focus.trim().slice(0, 600));
  url.searchParams.set("context", context.trim().slice(0, 600));
  return url.toString();
}
