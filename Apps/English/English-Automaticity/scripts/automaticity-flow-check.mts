// Drives the Automaticity Mission (inside /progress) with a fake microphone:
// controlled practice, writing analysis, shadowing stages, recording and the
// mastery panel. Usage: node scripts/automaticity-flow-check.mts [base-url]
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

for (const width of [390, 1280]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, permissions: ["microphone"] });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`${width}px: ${error.message}`));
  await page.goto(`${base}/progress`, { waitUntil: "networkidle" });
  const disclosure = page.locator("details.quiet-disclosure", { hasText: "Additional practice" });
  await disclosure.locator("summary").click();
  const mission = page.locator("#mission");
  await mission.waitFor({ timeout: 20000 });
  check(/\d+% complete/.test(await mission.innerText()), `${width}px mission card shows completion`);
  check((await page.locator('button.text-left[aria-pressed]').count()) === 3, `${width}px three step cards`);

  // Step 1: wrong answers reveal the models, then the models pass.
  await page.locator('button.text-left[aria-pressed]').nth(0).click();
  const practice = page.locator("#daily-activity-1");
  const inputs = practice.locator("input");
  check((await inputs.count()) === 3, `${width}px step 1 has three inputs`);
  for (let i = 0; i < 3; i++) await inputs.nth(i).fill("wrong");
  await practice.locator("button", { hasText: "Check all three" }).click();
  const models = await practice.locator("span", { hasText: /^Model: / }).allInnerTexts();
  check(models.length === 3, `${width}px wrong answers show three model answers`);
  for (let i = 0; i < 3; i++) await inputs.nth(i).fill(models[i].replace(/^Model: /, ""));
  await practice.locator("button", { hasText: "Check all three" }).click();
  check((await practice.locator("span", { hasText: /^Correct$/ }).count()) === 3, `${width}px model answers are accepted`);
  check((await mission.innerText()).includes("Controlled practice complete"), `${width}px mission message updates`);
  check(/Recognition practice\s*100%/.test(await page.locator("text=Transparent mastery").locator("xpath=ancestor::*[contains(@class,'learning-card')]").innerText()), `${width}px mastery axis reflects practice`);

  // Step 2: writing analysis produces feedback (verified or honestly unassessed).
  await page.locator('button.text-left[aria-pressed]').nth(1).click();
  const writing = page.locator("#daily-activity-2");
  await writing.locator("textarea").fill("I have lived in this city for three years. I have made many friends here. I have never visited the old harbour. My sister has just moved to Berlin.");
  await writing.locator("button", { hasText: "Analyse and save writing" }).click();
  await writing.locator("div.grid-cols-3").first().waitFor({ timeout: 30000 });
  check((await writing.locator("div.grid-cols-3").count()) === 1, `${width}px writing feedback appears`);

  // Step 3: shadowing stage toggles and a fake-microphone recording.
  await page.locator('button.text-left[aria-pressed]').nth(2).click();
  const speaking = page.locator("#daily-activity-3");
  const stage = speaking.locator("button", { hasText: "Stage 1" });
  await stage.click();
  check((await stage.getAttribute("class"))?.includes("border-worksheet-teal") === true, `${width}px shadowing stage 1 marks done`);
  await speaking.locator("button", { hasText: "Record" }).first().click();
  await page.waitForTimeout(2500);
  const secondsText = await speaking.locator("span", { hasText: /^\d+s$/ }).innerText();
  check(Number.parseInt(secondsText) >= 1, `${width}px recording timer runs (${secondsText})`);
  await speaking.locator("button", { hasText: "Stop" }).click();
  check((await mission.innerText()).includes("Recording stopped"), `${width}px stop updates the message`);
  await speaking.locator("textarea").fill("I have worked here since last year and I have learned a lot.");
  await speaking.locator("button", { hasText: "Analyse and save speaking" }).click();
  await speaking.locator("div.grid-cols-3").first().waitFor({ timeout: 30000 });
  check((await speaking.locator("div.grid-cols-3").count()) === 1, `${width}px speaking feedback appears`);
  check((await mission.innerText()).includes("Speaking practice saved"), `${width}px speaking saved message`);

  await page.locator("button", { hasText: "Start another review" }).click();
  check((await mission.innerText()).includes("Review reset"), `${width}px review reset works`);
  await context.close();
}

await browser.close();
for (const error of errors) console.log(`PAGE ERROR  ${error}`);
check(errors.length === 0, "no uncaught page errors");
console.log(failures ? `\n${failures} automaticity check(s) failed` : "\nAll automaticity checks passed");
process.exit(failures ? 1 : 0);
