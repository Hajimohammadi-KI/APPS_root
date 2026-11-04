import { expect, test } from "bun:test";

for (const [language, app] of [
  ["en", "English/English-Automaticity"],
  ["de", "Deutsch/Deutsch-Automaticity"],
] as const) {
  test(`${language} readiness gives the teacher exact cycle links without claiming human validation`, async () => {
    const base = `Apps/${app}/apps/web/public/`;
    const data = await Bun.file(base + "assessment-readiness.json").json();
    const html = await Bun.file(base + "assessment-readiness.html").text();
    expect(data.reviewReadiness?.status).toBe("awaiting_human_evidence");
    expect(data.reviewReadiness?.contentReviewedTasks).toBe(0);
    expect(data.reviewReadiness?.evaluatorApprovedTasks).toBe(0);
    expect(data.reviewReadiness?.selectedCycleReviewLinks).toHaveLength(6);
    expect(data.reviewReadiness?.missingExpandedScopeFiles).toContain(
      "docs/grammar-scope/references.json",
    );
    for (const link of data.reviewReadiness.selectedCycleReviewLinks) {
      expect(link.url).toBe(
        `/learning-core/content-review.html?unit=${link.unitId}&focus=cycle`,
      );
      expect(html).toContain(link.url.replaceAll("&", "&amp;"));
      expect(link.unitId.startsWith(language + ".")).toBe(true);
    }
    expect(html).toContain("دانلود فایل");
    expect(html).toContain("دو داور مستقل");
  });
}
