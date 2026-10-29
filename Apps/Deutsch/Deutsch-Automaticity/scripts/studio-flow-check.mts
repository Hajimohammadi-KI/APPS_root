// Drives the Konversationsstudio with a fake microphone: record, stop, type,
// evaluate, step through the flow, and open it from the Heute deep link.
// Usage: node scripts/studio-flow-check.mts [base-url]
import { chromium } from "@playwright/test";

const base = (process.argv[2] ?? "http://127.0.0.1:3210").replace(/\/$/, "");
const browser = await chromium.launch({
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
  ],
});
const errors: string[] = [];
let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failures += 1;
};
const open = async (width: number, path: string) => {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    permissions: ["microphone"],
  });
  const page = await context.newPage();
  page.on("pageerror", (error) =>
    errors.push(`${width}px ${path}: ${error.message}`),
  );
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.locator(".studio-main h1").waitFor({ timeout: 20000 });
  return page;
};

for (const width of [390, 1280]) {
  const page = await open(width, "/studio");
  const stepSummary = page.locator(".studio-step-picker > summary");
  check(
    /Schritt 2 \/ 7/.test(await stepSummary.innerText()),
    `${width}px studio opens on the Antwort step`,
  );
  check(
    (await page.locator(".record-main strong").innerText()).includes("/ 2:00"),
    `${width}px guided mode allows 2:00`,
  );

  await page.locator(".studio-options > summary").click();
  await page.locator(".mode-cards button").nth(1).click();
  check(
    (await page.locator(".record-main strong").innerText()).includes("/ 1:00"),
    `${width}px challenge mode shortens the limit to 1:00`,
  );
  await page.locator(".mode-cards button").nth(0).click();

  await page.locator(".record-controls button", { hasText: "Record" }).click();
  await page.waitForTimeout(1500);
  const live = await page.locator(".record-main .ready").innerText();
  check(
    live === "Listening",
    `${width}px recording starts with a fake microphone (${live})`,
  );
  await page.locator(".record-controls button", { hasText: "Pause" }).click();
  check(
    (await page.locator(".record-main .ready").innerText()) === "Paused",
    `${width}px pause is reflected`,
  );
  await page.locator(".record-controls button", { hasText: "Resume" }).click();
  await page.waitForTimeout(600);
  await page.locator(".record-controls button", { hasText: "Stop" }).click();
  await page.locator(".audio-player").waitFor({ timeout: 10000 });
  check(
    /Schritt 3 \/ 7/.test(await stepSummary.innerText()),
    `${width}px stopping moves to the replay step`,
  );

  await page.locator(".transcript textarea").fill("Ich gehe");
  await page.locator(".record-controls button.primary").click();
  const short = page.locator(".mic-error", { hasText: "Wörter" });
  await short.waitFor({ timeout: 10000 }).catch(() => {});
  check(
    (await short.count()) === 1,
    `${width}px a too-short answer is held back by the minimum word count`,
  );

  await page
    .locator(".transcript textarea")
    .fill(
      "Am Wochenende besuche ich normalerweise meine Familie und wir kochen zusammen ein großes Essen.",
    );
  let sentBeforeConsent = 0;
  const countSends = (request: { url(): string }) => {
    if (request.url().includes("/api/conversation/evaluate"))
      sentBeforeConsent += 1;
  };
  page.on("request", countSends);
  await page.locator(".record-controls button.primary").click();
  await page.locator(".online-consent").waitFor({ timeout: 10000 });
  check(
    sentBeforeConsent === 0,
    `${width}px without online consent nothing is sent to LanguageTool`,
  );
  page.off("request", countSends);
  await page.locator(".online-consent").click();
  await Promise.race([
    page.locator(".review-panel").waitFor({ timeout: 30000 }),
    page
      .locator(".mic-error", { hasText: "LanguageTool ist nicht erreichbar" })
      .waitFor({ timeout: 30000 }),
  ]).catch(() => {});
  const reviewed = (await page.locator(".review-panel").count()) === 1;
  const unavailable =
    (await page
      .locator(".mic-error", { hasText: "LanguageTool ist nicht erreichbar" })
      .count()) === 1;
  check(
    reviewed || unavailable,
    `${width}px evaluation either reviews or reports the provider honestly (reviewed=${reviewed})`,
  );
  if (reviewed) {
    await page.locator(".review-panel button.primary").click();
    check(
      (await page
        .locator(".correct-panel .correction-grid article")
        .count()) === 2,
      `${width}px correction panel shows both versions`,
    );
    await page.locator(".correct-panel button.primary").click();
    check(
      (await page
        .locator(".improve-panel .improve-compare article")
        .count()) === 2,
      `${width}px improve panel compares versions`,
    );
  }

  await page.locator("footer button.save-lite").click();
  check(
    /Schritt 7 \/ 7/.test(await stepSummary.innerText()),
    `${width}px footer "Übung speichern" opens the save step`,
  );
  const saveDisabled = await page
    .locator(".save-panel button.primary")
    .isDisabled();
  check(
    saveDisabled === !reviewed,
    `${width}px save button is enabled only with a real evaluation (disabled=${saveDisabled})`,
  );

  await page.locator(".studio-results > summary").click();
  check(
    (
      await page.locator(".studio-results .panel.feedback h3").innerText()
    ).includes("Echte Sprechdaten"),
    `${width}px session details disclosure opens`,
  );
  await page.context().close();
}

{
  const page = await open(1280, "/studio?from=daily&activity=2&level=A2");
  const bar = page.locator(".daily-context-bar");
  check(
    (await bar.innerText()).includes("Aktivität 2"),
    "daily deep link shows the daily context bar",
  );
  check(
    (
      await page.locator(".studio-options > summary span").innerText()
    ).startsWith("A2"),
    "daily deep link preselects the A2 level",
  );
  await page.context().close();
}

await browser.close();
for (const error of errors) console.log(`PAGE ERROR  ${error}`);
check(errors.length === 0, "no uncaught page errors");
console.log(
  failures
    ? `\n${failures} studio check(s) failed`
    : "\nAll studio checks passed",
);
process.exit(failures ? 1 : 0);
