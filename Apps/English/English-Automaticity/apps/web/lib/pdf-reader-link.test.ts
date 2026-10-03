import { afterEach, describe, expect, test } from "bun:test";

import { GET as openNotebook } from "../app/notebook/route";
import { GET as openPdfReader } from "../app/pdf-reader/route";
import { pdfReaderHrefForResource } from "./pdf-reader-link";

const originalReaderUrl = process.env.NEXT_PUBLIC_PDF_READER_URL;

afterEach(() => {
  if (originalReaderUrl === undefined) {
    delete process.env.NEXT_PUBLIC_PDF_READER_URL;
  } else {
    process.env.NEXT_PUBLIC_PDF_READER_URL = originalReaderUrl;
  }
});

describe("shared PDF reader links", () => {
  test("notebook hands off with a visible return destination", () => {
    delete process.env.NEXT_PUBLIC_PDF_READER_URL;
    const response = openNotebook(
      new Request("https://english.example/notebook?activity=5"),
    );
    const location = new URL(response.headers.get("location") ?? "");

    expect(location.origin).toBe("http://127.0.0.1:4332");
    expect(location.searchParams.get("return")).toBe("https://english.example/");
    expect(location.searchParams.get("returnLabel")).toBe(
      "Back to English Automaticity",
    );
  });

  test("sends an exact Drive PDF to the shared reader", () => {
    const href = pdfReaderHrefForResource({
      sourceUrl: "https://drive.google.com/file/d/1TV1AAAHkng5USBOeewMc3NpHFk97eMwi/view",
      name: "A1 reading.pdf",
      focus: "Find the main idea",
      context: "English A1 · Reading",
    });
    expect(href).not.toBeNull();
    const url = new URL(href ?? "");

    expect(url.origin).toBe("http://127.0.0.1:4332");
    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("driveId")).toBe("1TV1AAAHkng5USBOeewMc3NpHFk97eMwi");
    expect(url.searchParams.get("focus")).toBe("Find the main idea");
  });

  test("leaves non-PDF learning pages outside the PDF reader", () => {
    expect(pdfReaderHrefForResource({
      sourceUrl: "https://learnenglish.britishcouncil.org/skills/reading/a1-reading",
      name: "A1 Reading",
      focus: "Reading",
      context: "English A1",
    })).toBeNull();
  });

  test("uses the hosted reader on the web and preserves incoming context", () => {
    process.env.NEXT_PUBLIC_PDF_READER_URL =
      "https://research-pdf-studio.vercel.app/";

    const response = openPdfReader(
      new Request("https://english.example/pdf-reader?topic=present-perfect"),
    );
    const location = new URL(response.headers.get("location") ?? "");

    expect(response.status).toBe(307);
    expect(location.origin).toBe("https://research-pdf-studio.vercel.app");
    expect(location.searchParams.get("lang")).toBe("en");
    expect(location.searchParams.get("topic")).toBe("present-perfect");
  });
});
