import { describe, expect, test } from "bun:test";

import {
  buildPdfReaderHref,
  googleDriveFileId,
  isDirectPdfUrl,
} from "../lib/pdf-reader-link";

describe("PDF reader deep links", () => {
  test("opens the exact Drive file and carries the reading focus", () => {
    const href = buildPdfReaderHref({
      readerUrl: "/pdf-reader",
      sourceUrl: "https://drive.google.com/file/d/1TV1AAAHkng5USBOeewMc3NpHFk97eMwi/view",
      name: "Begegnungen A1.pdf",
      focus: "Kapitel 1 · Nominativ",
      context: "German A1",
      page: 7,
    });
    const url = new URL(href, "https://app.local");

    expect(url.searchParams.get("driveId")).toBe("1TV1AAAHkng5USBOeewMc3NpHFk97eMwi");
    expect(url.searchParams.get("name")).toBe("Begegnungen A1.pdf");
    expect(url.searchParams.get("focus")).toBe("Kapitel 1 · Nominativ");
    expect(url.searchParams.get("context")).toBe("German A1");
    expect(url.searchParams.get("page")).toBe("7");
  });

  test("builds an Exposé link without losing an existing reader query", () => {
    const href = buildPdfReaderHref({
      readerUrl: "/pdf-reader?embed=1",
      document: "expose",
      focus: "§ 3.2 · Architektur",
    });
    const url = new URL(href, "https://app.local");

    expect(url.searchParams.get("embed")).toBe("1");
    expect(url.searchParams.get("document")).toBe("expose");
    expect(url.searchParams.get("focus")).toBe("§ 3.2 · Architektur");
  });

  test("recognizes Drive IDs and direct PDF URLs only", () => {
    expect(googleDriveFileId("https://drive.google.com/file/d/1TV1AAAHkng5USBOeewMc3NpHFk97eMwi/view"))
      .toBe("1TV1AAAHkng5USBOeewMc3NpHFk97eMwi");
    expect(isDirectPdfUrl("https://cdn.example.test/paper.pdf?download=1")).toBe(true);
    expect(isDirectPdfUrl("https://example.test/course")).toBe(false);
  });
});
