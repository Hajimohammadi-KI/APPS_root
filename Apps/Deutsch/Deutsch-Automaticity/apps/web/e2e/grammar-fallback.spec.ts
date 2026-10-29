import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/replacements/de/grammar-runtime.js*", (route) =>
    route.abort(),
  );
});

test("fallback never approves free text or completes the daily activity", async ({
  page,
}) => {
  await page.goto(
    "/replacements/de/grammatik.html?from=daily&activity=1&topic=Personalpronomen",
  );
  await page.evaluate(() => {
    localStorage.setItem(
      "deutsch-automaticity:daily-session:v1",
      JSON.stringify({
        completedActivities: [2],
        answers: { draft: "keep me" },
      }),
    );
  });
  for (const answer of [
    "Ich sehe der Mann.",
    "این پاسخ اصلاً آلمانی نیست",
    "Ich sehe den Mann.",
  ]) {
    await page.locator("#answerInput").fill(answer);
    await page.locator("#checkBtn").click();
    await expect(page.locator("#feedback")).toContainText("ارزیابی نشده");
    await expect(page.locator("#feedback")).not.toHaveClass(/\bgood\b/);
    await expect(page.locator("#answerInput")).toHaveValue(answer);
    await page.locator("#nextBtn").click();
  }
  await expect(page.locator("#dailyCompleteDialog")).not.toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("deutsch-automaticity:daily-session:v1")!,
      ),
    ),
  ).toEqual({ completedActivities: [2], answers: { draft: "keep me" } });
});

test("fallback still checks exact closed answers without ignoring German case or punctuation", async ({
  page,
}) => {
  await page.goto("/replacements/de/grammatik.html");
  await page.locator("#answerInput").fill("bin");
  await page.locator("#checkBtn").click();
  await expect(page.locator("#feedback")).toHaveClass(/\bgood\b/);
  await page.locator("#nextBtn").click();
  await page.locator("#answerInput").fill("sind");
  await page.locator("#checkBtn").click();
  await expect(page.locator("#feedback")).toHaveClass(/\bgood\b/);
  await page.locator("#nextBtn").click();
  for (const answer of [
    "sie ist nicht müde",
    "Sie ist nicht müde?",
    "Sie ist nicht müde!",
  ]) {
    await page.locator("#answerInput").fill(answer);
    await page.locator("#checkBtn").click();
    await expect(page.locator("#feedback")).toHaveClass(/\bbad\b/);
  }
  await page.locator("#answerInput").fill("  Sie ist nicht müde.  ");
  await page.locator("#checkBtn").click();
  await expect(page.locator("#feedback")).toHaveClass(/\bgood\b/);
});
