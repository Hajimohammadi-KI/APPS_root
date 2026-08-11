import { describe, expect, test } from "bun:test";
import { flashcardsToCsv } from "../lib/document-converters";

describe("document conversion exports", () => {
  test("creates importable UTF-8 flashcards with safe CSV quoting", async () => {
    const blob = flashcardsToCsv([
      { front: '"Evidence", graph', back: "Evidenzgraph", page: 3, tag: "Definition" },
    ]);
    const csv = await blob.text();
    expect(Array.from(new Uint8Array(await blob.arrayBuffer()).slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(csv.startsWith('"Front","Back","Page","Tag"')).toBe(true);
    expect(csv).toContain('"""Evidence"", graph"');
    expect(csv).toContain('"Evidenzgraph","3","Definition"');
  });
});
