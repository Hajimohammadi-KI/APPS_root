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
  test(`${language} study preparation is distinct from a completed study and exposes no future questions`, async () => {
    const base = `Apps/${app}/apps/web/public/`;
    const data = await Bun.file(base + "assessment-readiness.json").json();
    const study = data.personalStudyPreparation;
    expect(study?.status).toBe("awaiting_human_evidence");
    expect(study?.actualObservations).toBe(0);
    expect(study?.activePlan).toBe(false);
    expect(study?.automaticMasteryGranted).toBe(false);
    expect(study?.causalBenefitEstablished).toBe(false);
    expect(
      study?.phases.map((phase: { phase: string }) => phase.phase),
    ).toEqual(["pre", "post", "day7", "day30"]);
    expect(JSON.stringify(study)).not.toMatch(
      /"(?:prompt|acceptedAnswers|solution|response)"/u,
    );
    const html = await Bun.file(base + "assessment-readiness.html").text();
    expect(html).toContain("آماده‌سازی مطالعهٔ شخصی");
    expect(html).toContain("۷ روز");
    expect(html).toContain("۳۰ روز");
    expect(html).toContain("پس از تمرین");
  });
}
