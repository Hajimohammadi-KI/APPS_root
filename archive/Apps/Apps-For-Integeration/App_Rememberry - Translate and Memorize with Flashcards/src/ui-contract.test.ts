import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");

describe("LingoBridge extension package", () => {
  it("keeps every popup controller connected to a real element", async () => {
    const source = await Bun.file(resolve(root, "src/popup.ts")).text();
    const html = await Bun.file(resolve(root, "popup.html")).text();
    const referencedIds = [...source.matchAll(/element(?:<[^>]+>)?\("([^"]+)"\)/gu)].map((match) => match[1]);

    expect(referencedIds.length).toBeGreaterThan(40);
    for (const id of referencedIds) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it("packages side panel, page selection, highlighting, and required permissions", async () => {
    const manifest = await Bun.file(resolve(root, "manifest.json")).json() as {
      permissions: string[];
      side_panel?: { default_path?: string };
      content_scripts?: Array<{ matches?: string[] }>;
    };

    expect(manifest.permissions).toContain("sidePanel");
    expect(manifest.permissions).toContain("storage");
    expect(manifest.side_panel?.default_path).toBe("popup.html");
    expect(manifest.content_scripts?.[0]?.matches).toEqual(["http://*/*", "https://*/*"]);
  });

  it("builds every file Chrome needs", async () => {
    for (const file of ["manifest.json", "popup.html", "popup.css", "popup.js", "background.js", "content.js"]) {
      expect(await Bun.file(resolve(root, "dist", file)).exists()).toBe(true);
    }
  });
});
