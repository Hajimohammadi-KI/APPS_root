import { afterEach, describe, expect, test } from "bun:test";

import { GET as openNotebook } from "../app/notizbuch/route";
import { GET as openPdfReader } from "../app/pdf-reader/route";
import { pdfReaderHrefForMaterial } from "./pdf-reader-link";

const originalReaderUrl = process.env.NEXT_PUBLIC_PDF_READER_URL;

afterEach(() => {
  if (originalReaderUrl === undefined) {
    delete process.env.NEXT_PUBLIC_PDF_READER_URL;
  } else {
    process.env.NEXT_PUBLIC_PDF_READER_URL = originalReaderUrl;
  }
});

describe("gemeinsame PDF-Reader-Links", () => {
  test("nutzt lokal den gemeinsamen PDF-Studio-Port", () => {
    delete process.env.NEXT_PUBLIC_PDF_READER_URL;

    const response = openPdfReader(
      new Request("https://deutsch.example/pdf-reader"),
    );
    const location = new URL(response.headers.get("location") ?? "");

    expect(location.origin).toBe("http://127.0.0.1:4332");
  });

  test("Notizbuch-Übergabe enthält einen sichtbaren Rückweg", () => {
    delete process.env.NEXT_PUBLIC_PDF_READER_URL;
    const response = openNotebook(
      new Request("https://deutsch.example/notizbuch?activity=7"),
    );
    const location = new URL(response.headers.get("location") ?? "");

    expect(location.searchParams.get("return")).toBe(
      "https://deutsch.example/",
    );
    expect(location.searchParams.get("returnLabel")).toBe(
      "Zurück zu DeutschFlow",
    );
  });

  test("öffnet genau die ausgewählte Drive-Datei mit Lesefokus", () => {
    const href = pdfReaderHrefForMaterial({
      sourceUrl:
        "https://drive.google.com/file/d/1TV1AAAHkng5USBOeewMc3NpHFk97eMwi/view",
      name: "Begegnungen A1",
      focus: "Lektion 1 · Nominativ erkennen",
      context: "Deutsch A1 · Grammatik",
      isPdf: true,
    });
    expect(href).not.toBeNull();
    const url = new URL(href ?? "");

    expect(url.origin).toBe("http://127.0.0.1:4332");
    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("driveId")).toBe(
      "1TV1AAAHkng5USBOeewMc3NpHFk97eMwi",
    );
    expect(url.searchParams.get("focus")).toBe(
      "Lektion 1 · Nominativ erkennen",
    );
    expect(url.searchParams.get("context")).toBe("Deutsch A1 · Grammatik");
  });

  test("bevorzugt eine vorhandene lokale Original-PDF und behält Drive als Rückweg", () => {
    const sourceUrl =
      "https://drive.google.com/file/d/1x1TfLy_Az6Ztd0HBO52exAEh2FmptFxZ/view";
    const href = pdfReaderHrefForMaterial({
      sourceUrl,
      materialId: "idiom-day-1",
      name: "Tag 1 · Redewendungen",
      focus: "Erfolg und Misserfolg",
      context: "Deutsch B2–C2",
      isPdf: true,
    });
    expect(href).not.toBeNull();
    const url = new URL(href ?? "");

    expect(url.searchParams.get("sourceUrl")).toBe(
      "http://127.0.0.1:3199/api/materials/idiom-day-1.pdf",
    );
    expect(url.searchParams.get("originalSourceUrl")).toBe(sourceUrl);
    expect(url.searchParams.get("driveId")).toBeNull();
  });

  test("lässt Ordner und Audiodateien in ihrer ursprünglichen Anwendung", () => {
    expect(
      pdfReaderHrefForMaterial({
        sourceUrl: "https://drive.google.com/drive/folders/folder-id",
        name: "Kursordner",
        focus: "Material wählen",
        context: "Deutsch B2",
      }),
    ).toBeNull();
  });

  test("öffnet PDF und Notizbuch im gehosteten Reader", () => {
    process.env.NEXT_PUBLIC_PDF_READER_URL =
      "https://research-pdf-studio.vercel.app/";

    const pdfResponse = openPdfReader(
      new Request("https://deutsch.example/pdf-reader?topic=nebensatz"),
    );
    const notebookResponse = openNotebook(
      new Request("https://deutsch.example/notizbuch?activity=7"),
    );
    const pdfLocation = new URL(pdfResponse.headers.get("location") ?? "");
    const notebookLocation = new URL(
      notebookResponse.headers.get("location") ?? "",
    );

    expect(pdfResponse.status).toBe(307);
    expect(pdfLocation.origin).toBe("https://research-pdf-studio.vercel.app");
    expect(pdfLocation.searchParams.get("lang")).toBe("de");
    expect(pdfLocation.searchParams.get("topic")).toBe("nebensatz");
    expect(notebookResponse.status).toBe(307);
    expect(notebookLocation.searchParams.get("source")).toBe("german-notebook");
    expect(notebookLocation.searchParams.get("activity")).toBe("7");
  });
});
