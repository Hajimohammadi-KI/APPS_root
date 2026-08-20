import { describe, expect, test } from "bun:test";
import {
  createPdfLibraryItem,
  formatApaCitation,
  formatBibTeX,
  sanitizePdfLibraryStore,
  upsertPdfLibraryItem,
} from "../lib/pdf-library";

describe("PDF research library", () => {
  test("creates safe metadata and a citation key from a PDF title", () => {
    const item = createPdfLibraryItem({ id: "doc-1", title: "Lewis 2020 Retrieval-Augmented Generation", pageCount: 12 });
    expect(item).toMatchObject({ id: "doc-1", year: 2020, pageCount: 12, status: "unread" });
    expect(item.citationKey).toContain("2020");
  });

  test("sanitizes imports and deduplicates documents by fingerprint", () => {
    const items = sanitizePdfLibraryStore({ items: [
      { id: "doc-1", title: "First", authors: ["A", "A"], status: "broken" },
      { id: "doc-1", title: "Updated", source: { kind: "drive", locator: "drive-id" } },
      { id: "", title: "Invalid" },
    ] });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ title: "Updated", status: "unread", source: { kind: "drive", locator: "drive-id" } });
  });

  test("updates metadata without duplicating the library item", () => {
    const first = createPdfLibraryItem({ id: "doc-1", title: "First" });
    const updated = { ...first, title: "Updated", tags: ["RAG"] };
    expect(upsertPdfLibraryItem([first], updated)).toEqual([updated]);
  });

  test("exports reusable APA and BibTeX citations", () => {
    const item = {
      ...createPdfLibraryItem({ id: "doc-1", title: "Retrieval-Augmented Generation" }),
      authors: ["Patrick Lewis", "Ethan Perez"],
      year: 2020,
      publication: "NeurIPS",
      doi: "10.1000/example",
      citationKey: "lewis2020",
    };
    expect(formatApaCitation(item)).toContain("Patrick Lewis & Ethan Perez (2020)");
    expect(formatBibTeX(item)).toContain("@article{lewis2020");
    expect(formatBibTeX(item)).toContain("author = {Patrick Lewis and Ethan Perez}");
  });
});
