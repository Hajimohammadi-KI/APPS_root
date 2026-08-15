import { MAX_PDF_BYTES, TOO_LARGE_MESSAGE as TOO_LARGE, readCapped } from "../../../../lib/safe-remote-url";

const DRIVE_ID = /^[a-zA-Z0-9_-]{10,200}$/;

export async function GET(request: Request) {
  try {
    const fileId = new URL(request.url).searchParams.get("fileId")?.trim() || "";
    if (!DRIVE_ID.test(fileId)) {
      return Response.json({ message: "Der Google-Drive-Dateilink oder die Datei-ID ist ungültig." }, { status: 400 });
    }
    const response = await fetch(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`, {
      redirect: "follow",
      signal: AbortSignal.timeout(35_000),
    });
    if (!response.ok || !response.body) {
      return Response.json(
        { message: "Google Drive hat keinen Zugriff erlaubt. Teile die PDF als „Jeder mit dem Link“ oder verbinde dein Google-Konto." },
        { status: response.status === 404 ? 404 : 403 },
      );
    }
    const length = Number(response.headers.get("content-length") || 0);
    if (length > MAX_PDF_BYTES) return Response.json({ message: TOO_LARGE }, { status: 413 });
    const bytes = await readCapped(response);
    if (!bytes) return Response.json({ message: TOO_LARGE }, { status: 413 });
    const signature = new TextDecoder().decode(bytes.slice(0, 5));
    const contentType = response.headers.get("content-type") || "";
    if (signature !== "%PDF-" && !contentType.includes("application/pdf")) {
      return Response.json(
        { message: "Google Drive hat eine Anmelde- oder Freigabeseite statt einer PDF zurückgegeben. Prüfe die Freigabe." },
        { status: 403 },
      );
    }
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="drive-${fileId}.pdf"`,
      },
    });
  } catch (error) {
    const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return Response.json(
      { message: timeout ? "Google Drive hat nicht rechtzeitig geantwortet." : "Die Google-Drive-PDF konnte nicht geladen werden." },
      { status: timeout ? 504 : 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

