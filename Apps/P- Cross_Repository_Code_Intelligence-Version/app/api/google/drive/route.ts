import { googleAccessToken } from "../../../../lib/google-provider";
import { friendlyGoogleDriveError } from "../../../../lib/google-errors";

const DRIVE_ID = /^[a-zA-Z0-9_-]{10,200}$/;
const MAX_PDF_BYTES = 50 * 1024 * 1024;

export async function GET(request: Request) {
  const access = await googleAccessToken(request);
  const headers = { "Cache-Control": "no-store" };
  if (!access.token) return Response.json({ message: access.message || "Google Drive ist nicht verbunden." }, { status: 401, headers });
  if (!String(access.tokens?.scope || "").split(/\s+/).includes("https://www.googleapis.com/auth/drive.readonly")) return Response.json({ message: "Google Drive wurde für diese Verbindung nicht freigegeben." }, { status: 403, headers });
  const requestUrl = new URL(request.url);
  const fileId = requestUrl.searchParams.get("fileId")?.trim() || "";
  if (fileId) {
    if (!DRIVE_ID.test(fileId)) {
      return Response.json({ message: "Die Google-Drive-Datei-ID ist ungültig." }, { status: 400, headers });
    }
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
      { headers: { Authorization: `Bearer ${access.token}` }, signal: AbortSignal.timeout(35_000) },
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { error?: { message?: string } };
      return Response.json({ message: friendlyGoogleDriveError(payload.error?.message || "Die private Drive-PDF konnte nicht geladen werden.") }, { status: response.status, headers });
    }
    const length = Number(response.headers.get("content-length") || 0);
    if (length > MAX_PDF_BYTES) return Response.json({ message: "Die PDF ist größer als 50 MB." }, { status: 413, headers });
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_PDF_BYTES) return Response.json({ message: "Die PDF ist größer als 50 MB." }, { status: 413, headers });
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
      return Response.json({ message: "Die ausgewählte Drive-Datei ist keine gültige PDF." }, { status: 415, headers });
    }
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="drive-${fileId}.pdf"`,
      },
    });
  }
  const rawFolder = requestUrl.searchParams.get("folder") || requestUrl.searchParams.get("folderId") || "";
  const folderFromLink = rawFolder.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1];
  const folderId = folderFromLink || (/^[a-zA-Z0-9_-]{8,}$/.test(rawFolder) ? rawFolder : "");
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  const query = ["mimeType='application/pdf'", "trashed=false"];
  if (folderId) query.push(`'${folderId}' in parents`);
  url.searchParams.set("q", query.join(" and "));
  url.searchParams.set("pageSize", "100");
  const pageToken = requestUrl.searchParams.get("pageToken");
  if (pageToken) url.searchParams.set("pageToken", pageToken.slice(0, 2000));
  url.searchParams.set("orderBy", "modifiedTime desc");
  url.searchParams.set("fields", "nextPageToken,files(id,name,mimeType,modifiedTime,size,webViewLink,parents)");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${access.token}` } });
  const data = await response.json() as { files?: unknown[]; nextPageToken?: string; error?: { message?: string } };
  if (!response.ok) return Response.json({ message: friendlyGoogleDriveError(data.error?.message || "Google Drive konnte nicht gelesen werden.") }, { status: response.status, headers });
  return Response.json({ files: data.files || [], folderId: folderId || null, nextPageToken: data.nextPageToken || null }, { headers });
}
