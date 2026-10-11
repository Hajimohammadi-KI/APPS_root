// Drives the Automatik-Mission (/automatik) with a fake microphone:
// controlled practice, writing, shadowing stages, recording and the gates
// that keep an incomplete speaking attempt from counting.
// Usage: node scripts/automaticity-flow-check.mts [base-url]
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

for (const width of [390, 1280]) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    permissions: ["microphone"],
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`${width}px: ${error.message}`));
  await page.goto(`${base}/automatik`, { waitUntil: "networkidle" });
  const mission = page.locator("#mission");
  await mission.waitFor({ timeout: 20000 });
  check(
    /\d+% erledigt/.test(await mission.innerText()),
    `${width}px mission card shows completion`,
  );
  const steps = page.locator("button[aria-pressed]");
  check((await steps.count()) === 3, `${width}px three step cards`);

  await steps.nth(0).click();
  const practice = page.locator("text=Lektion und kontrollierte Übung").locator("xpath=ancestor::*[@data-slot='card']");
  const inputs = practice.locator("input");
  check((await inputs.count()) === 3, `${width}px step 1 has three inputs`);
  for (let i = 0; i < 3; i++) await inputs.nth(i).fill("falsch");
  await practice.locator("button", { hasText: "Alle drei prüfen" }).click();
  const models = await practice.locator("span", { hasText: /^Modell: / }).allInnerTexts();
  check(models.length === 3, `${width}px wrong answers show three model answers`);
  for (let i = 0; i < 3; i++) await inputs.nth(i).fill(models[i].replace(/^Modell: /, ""));
  await practice.locator("button", { hasText: "Alle drei prüfen" }).click();
  check(
    (await practice.locator("span", { hasText: /^Richtig$/ }).count()) === 3,
    `${width}px model answers are accepted`,
  );
  check(
    (await mission.innerText()).includes("Kontrollierte Übung geschafft"),
    `${width}px mission message updates`,
  );

  await steps.nth(1).click();
  const writing = page.locator("text=Grammatik-Tagebuch").locator("xpath=ancestor::*[@data-slot='card']");
  await writing.locator("textarea").fill(
    "Ich wohne seit drei Jahren in dieser Stadt. Ich habe hier viele Freunde gefunden. Ich lerne jeden Tag Deutsch. Meine Schwester wohnt in Berlin.",
  );
  await writing.locator("button", { hasText: "Schreiben analysieren" }).click();
  await page.waitForTimeout(3000);
  const writingText = (await writing.innerText()) + (await mission.innerText());
  check(
    /Sätze|bewertet|gespeichert/.test(writingText),
    `${width}px writing produces feedback or an honest status`,
  );

  await steps.nth(2).click();
  const speaking = page.locator("text=Fünfstufiges Shadowing").locator("xpath=ancestor::*[@data-slot='card']");
  const stage = speaking.locator("button", { hasText: "Stufe 1" });
  await stage.click();
  check(
    (await stage.getAttribute("class"))?.includes("border-worksheet-teal") === true,
    `${width}px shadowing stage 1 marks done`,
  );
  const save = speaking.locator("button", { hasText: "Sprechen analysieren" });
  check(await save.isDisabled(), `${width}px save is disabled before any recording`);
  await speaking.locator("button", { hasText: "Aufnehmen" }).click();
  await page.waitForTimeout(2500);
  await speaking.locator("button", { hasText: "Stoppen" }).click();
  await speaking.locator("audio").waitFor({ timeout: 10000 });
  check((await speaking.locator("audio").count()) === 1, `${width}px recording can be replayed`);
  check(!(await save.isDisabled()), `${width}px save enabled after recording`);
  await save.click();
  await page.waitForTimeout(500);
  check(
    /Sprich mindestens|Schließe zuerst alle fünf/.test(await mission.innerText()),
    `${width}px short or unshadowed attempt is held back honestly`,
  );

  await page.locator("button", { hasText: "Neue Wiederholung" }).click();
  check(
    (await mission.innerText()).includes("Neue Wiederholung gestartet"),
    `${width}px review reset works`,
  );
  await context.close();
}

await browser.close();
for (const error of errors) console.log(`PAGE ERROR  ${error}`);
check(errors.length === 0, "no uncaught page errors");
console.log(
  failures
    ? `\n${failures} automaticity check(s) failed`
    : "\nAll automaticity checks passed",
);
process.exit(failures ? 1 : 0);
