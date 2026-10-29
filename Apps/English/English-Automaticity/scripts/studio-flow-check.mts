// Drives the Conversation Studio with a fake microphone: record, stop, type,
// evaluate, step through the flow, and open it from the Daily and Integrated
// Skills deep links. Usage: node scripts/studio-flow-check.mts [base-url]
import { chromium } from "@playwright/test";

const base = (process.argv[2] ?? "http://127.0.0.1:3202").replace(/\/$/, "");
const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
});
const errors: string[] = [];
let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failures += 1;
};
const open = async (width: number, path: string) => {
  const context = await browser.newContext({ viewport: { width, height: 900 }, permissions: ["microphone"] });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`${width}px ${path}: ${error.message}`));
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.locator(".studio-main h1").waitFor({ timeout: 20000 });
  return page;
};

for (const width of [390, 1280]) {
  const page = await open(width, "/studio");
  const stepSummary = page.locator(".studio-step-picker > summary");
  check(/Step 2 \/ 7/.test(await stepSummary.innerText()), `${width}px studio opens on the Answer step`);
  check((await page.locator(".record-main strong").innerText()).includes("/ 2:00"), `${width}px guided mode allows 2:00`);

  await page.locator(".studio-options > summary").click();
  await page.locator(".mode-cards button").nth(1).click();
  check((await page.locator(".record-main strong").innerText()).includes("/ 1:00"), `${width}px challenge mode shortens the limit to 1:00`);
  await page.locator(".mode-cards button").nth(0).click();

  await page.locator(".record-controls button", { hasText: "Record" }).click();
  await page.waitForTimeout(1500);
  const live = await page.locator(".record-main .ready").innerText();
  check(live === "Listening", `${width}px recording starts with a fake microphone (${live})`);
  await page.locator(".record-controls button", { hasText: "Pause" }).click();
  check((await page.locator(".record-main .ready").innerText()) === "Paused", `${width}px pause is reflected`);
  await page.locator(".record-controls button", { hasText: "Resume" }).click();
  await page.waitForTimeout(600);
  await page.locator(".record-controls button", { hasText: "Stop" }).click();
  await page.locator(".audio-player").waitFor({ timeout: 10000 });
  check(/Step 3 \/ 7/.test(await stepSummary.innerText()), `${width}px stopping moves to the replay step`);
  check((await page.locator(".replay-panel audio").count()) === 1, `${width}px replay panel plays the recording`);

  await page.locator(".transcript textarea").fill("I usually visit my family at the weekend and we cook together.");
  let sentBeforeConsent = 0;
  const countSends = (request: { url(): string }) => {
    if (request.url().includes("/api/conversation/evaluate")) sentBeforeConsent += 1;
  };
  page.on("request", countSends);
  await page.locator(".record-controls button.primary").click();
  await page.locator(".online-consent").waitFor({ timeout: 10000 });
  check(sentBeforeConsent === 0, `${width}px without online consent nothing is sent to LanguageTool`);
  page.off("request", countSends);
  await page.locator(".online-consent").click();
  await Promise.race([
    page.locator(".review-panel").waitFor({ timeout: 30000 }),
    page.locator(".mic-error", { hasText: "LanguageTool is unavailable" }).waitFor({ timeout: 30000 }),
  ]).catch(() => {});
  const reviewed = (await page.locator(".review-panel").count()) === 1;
  const unavailable = (await page.locator(".mic-error", { hasText: "LanguageTool is unavailable" }).count()) === 1;
  check(reviewed || unavailable, `${width}px evaluation either reviews or reports the provider honestly (reviewed=${reviewed})`);
  if (reviewed) {
    await page.locator(".review-panel button.primary").click();
    check((await page.locator(".correct-panel .correction-grid article").count()) === 2, `${width}px correction panel shows both versions`);
    await page.locator(".correct-panel button.primary").click();
    check((await page.locator(".improve-panel .improve-compare article").count()) === 2, `${width}px improve panel compares versions`);
  }

  await page.locator("footer button.save-lite").click();
  check(/Step 7 \/ 7/.test(await stepSummary.innerText()), `${width}px footer "Save practice" opens the save step`);
  const saveDisabled = await page.locator(".save-panel button.primary").isDisabled();
  check(saveDisabled === !reviewed, `${width}px save button is enabled only with a real evaluation (disabled=${saveDisabled})`);

  await page.locator(".studio-results > summary").click();
  check((await page.locator(".studio-results .panel.feedback h3").innerText()).includes("Real speaking evidence"), `${width}px session details disclosure opens`);
  await page.locator(".studio-saved-evidence > summary").click();
  check((await page.locator(".studio-saved-evidence").getAttribute("open")) !== null, `${width}px saved evidence disclosure opens`);
  await page.context().close();
}

{
  const page = await open(1280, "/studio?from=daily&activity=2&level=A2");
  const bar = page.locator(".daily-context-bar");
  check((await bar.innerText()).includes("activity 2"), "daily deep link shows the daily context bar");
  check((await page.locator(".studio-options > summary span").innerText()).startsWith("A2"), "daily deep link preselects the A2 level");
  await page.context().close();
}
{
  const page = await open(1280, "/studio?source=integrated-skills&unit=a1-introductions&level=A1");
  const bar = page.locator(".daily-context-bar");
  check(/A1 · Unit 1/.test(await bar.innerText()), "integrated-skills deep link shows the lesson context bar");
  check((await bar.locator("button").first().innerText()).includes("Integrated Skills"), "lesson bar offers a way back");
  await page.context().close();
}

await browser.close();
for (const error of errors) console.log(`PAGE ERROR  ${error}`);
check(errors.length === 0, "no uncaught page errors");
console.log(failures ? `\n${failures} studio check(s) failed` : "\nAll studio checks passed");
process.exit(failures ? 1 : 0);
