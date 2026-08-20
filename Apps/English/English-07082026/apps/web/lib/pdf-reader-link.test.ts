import { describe, expect, test } from "bun:test";

import { pdfReaderHrefForResource } from "./pdf-reader-link";

describe("shared PDF reader links", () => {
  test("sends an exact Drive PDF to the shared reader", () => {
    const href = pdfReaderHrefForResource({
      sourceUrl: "https://drive.google.com/file/d/1TV1AAAHkng5USBOeewMc3NpHFk97eMwi/view",
      name: "A1 reading.pdf",
      focus: "Find the main idea",
      context: "English A1 · Reading",
    });
    expect(href).not.toBeNull();
    const url = new URL(href ?? "", "http://english-automaticity.local");

    expect(url.searchParams.get("driveId")).toBe("1TV1AAAHkng5USBOeewMc3NpHFk97eMwi");
    expect(url.searchParams.get("focus")).toBe("Find the main idea");
    expect(url.pathname).toBe("/pdf-reader");
  });

  test("leaves non-PDF learning pages outside the PDF reader", () => {
    expect(pdfReaderHrefForResource({
      sourceUrl: "https://learnenglish.britishcouncil.org/skills/reading/a1-reading",
      name: "A1 Reading",
      focus: "Reading",
      context: "English A1",
    })).toBeNull();
  });
});
