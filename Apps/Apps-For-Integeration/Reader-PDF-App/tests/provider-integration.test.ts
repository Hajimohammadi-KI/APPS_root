import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("shared provider integration", () => {
  test("keeps provider secrets out of the PDF browser interface", () => {
    const page = source("../app/page.tsx");
    expect(page).not.toContain("openAiKey");
    expect(page).not.toContain("deeplKey");
    expect(page).not.toContain("pdf-studio-google-client-id");
    expect(page).toContain("Zentrale Einstellungen");
  });

  test("uses the central encrypted OpenAI and DeepL connections", () => {
    const aiRoute = source("../app/api/ai/route.ts");
    const translateRoute = source("../app/api/translate/route.ts");
    const statusRoute = source("../app/api/status/route.ts");

    for (const route of [aiRoute, translateRoute, statusRoute]) {
      expect(route).toContain("CENTRAL_STUDY_APP_URL");
      expect(route).toContain("http://127.0.0.1:4312");
    }
    expect(aiRoute).toContain("/api/ai");
    expect(translateRoute).toContain("/api/translate");
    expect(statusRoute).toContain("/api/status");
  });
});
