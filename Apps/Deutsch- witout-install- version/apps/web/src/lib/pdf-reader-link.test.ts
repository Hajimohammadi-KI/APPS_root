import { describe, expect, test } from "bun:test";

import { pdfReaderHrefForMaterial } from "./pdf-reader-link";

describe("gemeinsame PDF-Reader-Links", () => {
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
    const url = new URL(href ?? "", "http://deutschflow.local");

    expect(url.searchParams.get("driveId")).toBe(
      "1TV1AAAHkng5USBOeewMc3NpHFk97eMwi",
    );
    expect(url.searchParams.get("focus")).toBe(
      "Lektion 1 · Nominativ erkennen",
    );
    expect(url.searchParams.get("context")).toBe("Deutsch A1 · Grammatik");
    expect(url.pathname).toBe("/pdf-reader");
  });

  test("öffnet Web-Material ohne lokale Reader-Abhängigkeit über Drive", () => {
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
    const url = new URL(href ?? "", "http://deutschflow.local");

    expect(url.searchParams.get("sourceUrl")).toBeNull();
    expect(url.searchParams.get("originalSourceUrl")).toBeNull();
    expect(url.searchParams.get("driveId")).toBe(
      "1x1TfLy_Az6Ztd0HBO52exAEh2FmptFxZ",
    );
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
});
