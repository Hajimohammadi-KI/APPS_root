import { readFile, stat } from "node:fs/promises";
import { join, sep } from "node:path";

import manifest from "@/lib/local-material-manifest.json";

const MAX_PDF_BYTES = 200 * 1024 * 1024;
const localMaterials = manifest as Record<string, string>;

async function findSourceRoot() {
  const configured = process.env.GERMAN_SOURCE_ROOT?.trim();
  const candidates = configured
    ? [configured, "D:\\APPS_root\\Sources\\German"]
    : ["D:\\APPS_root\\Sources\\German"];

  for (const candidate of candidates) {
    try {
      if ((await stat(/* turbopackIgnore: true */ candidate)).isDirectory()) {
        return candidate;
      }
    } catch {
      // Continue to the next known installation layout.
    }
  }
  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  const materialId = decodeURIComponent(file).replace(/\.pdf$/i, "");
  const relativePath = localMaterials[materialId];
  if (!relativePath) {
    return Response.json(
      {
        message:
          "Für dieses Material ist keine lokale Original-PDF registriert.",
      },
      { status: 404 },
    );
  }

  const sourceRoot = await findSourceRoot();
  if (!sourceRoot) {
    return Response.json(
      {
        message:
          "Der lokale Ordner D:\\APPS_root\\Sources\\German wurde nicht gefunden.",
      },
      { status: 404 },
    );
  }

  const materialPath = join(
    /* turbopackIgnore: true */ sourceRoot,
    relativePath,
  );
  if (
    !materialPath.startsWith(`${sourceRoot}${sep}`) ||
    !materialPath.toLowerCase().endsWith(".pdf")
  ) {
    return Response.json(
      { message: "Ungültiger Materialpfad." },
      { status: 400 },
    );
  }

  try {
    const info = await stat(/* turbopackIgnore: true */ materialPath);
    if (!info.isFile()) throw new Error("not-file");
    if (info.size > MAX_PDF_BYTES) {
      return Response.json(
        { message: "Die PDF ist größer als 200 MB." },
        { status: 413 },
      );
    }
    const bytes = await readFile(/* turbopackIgnore: true */ materialPath);
    if (bytes.subarray(0, 5).toString("utf8") !== "%PDF-") {
      return Response.json(
        { message: "Die Quelldatei ist keine gültige PDF." },
        { status: 415 },
      );
    }
    return new Response(bytes, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="${materialId}.pdf"`,
        "Content-Length": String(info.size),
        "Content-Type": "application/pdf",
      },
    });
  } catch {
    return Response.json(
      { message: "Die registrierte lokale Original-PDF wurde nicht gefunden." },
      { status: 404 },
    );
  }
}
