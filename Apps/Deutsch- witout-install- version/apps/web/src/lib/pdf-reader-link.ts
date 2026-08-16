import localMaterialManifest from "./local-material-manifest.json";

const DRIVE_FILE_ID = /^[a-zA-Z0-9_-]{10,200}$/;
const DEFAULT_PDF_READER_URL = "http://127.0.0.1:4312/pdf-reader";
const DEFAULT_LOCAL_MATERIAL_URL = "http://127.0.0.1:3199/api/materials";
const localMaterialIds = new Set(Object.keys(localMaterialManifest));

function driveFileId(value: string) {
  try {
    const url = new URL(value);
    if (!url.hostname.endsWith("google.com")) return null;
    const id =
      url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ||
      url.searchParams.get("id");
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

export function pdfReaderHrefForMaterial({
  sourceUrl,
  name,
  focus,
  context,
  isPdf = false,
  materialId,
}: {
  sourceUrl: string;
  name: string;
  focus: string;
  context: string;
  isPdf?: boolean;
  materialId?: string;
}) {
  const localSourceUrl =
    isPdf && materialId && localMaterialIds.has(materialId)
      ? `${process.env.NEXT_PUBLIC_LOCAL_MATERIAL_URL?.trim() || DEFAULT_LOCAL_MATERIAL_URL}/${encodeURIComponent(materialId)}.pdf`
      : null;
  const effectiveSourceUrl = localSourceUrl || sourceUrl;
  const driveId = driveFileId(effectiveSourceUrl);
  if (!isPdf && !isPdfUrl(sourceUrl)) return null;

  const readerUrl =
    process.env.NEXT_PUBLIC_PDF_READER_URL?.trim() || DEFAULT_PDF_READER_URL;
  const url = new URL(readerUrl);
  if (driveId) url.searchParams.set("driveId", driveId);
  else url.searchParams.set("sourceUrl", effectiveSourceUrl);
  if (localSourceUrl) url.searchParams.set("originalSourceUrl", sourceUrl);
  url.searchParams.set("name", name.trim().slice(0, 600));
  url.searchParams.set("focus", focus.trim().slice(0, 600));
  url.searchParams.set("context", context.trim().slice(0, 600));
  return url.toString();
}
