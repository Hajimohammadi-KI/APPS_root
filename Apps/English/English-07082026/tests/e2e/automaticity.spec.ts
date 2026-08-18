import { expect, test } from "@playwright/test";

// Grammar Lab's topic picker is a "Unit" SelectMenu (components/ui/select-menu.tsx),
// not a flat list of per-unit buttons -- its trigger has a deterministic id
// (`${id}-trigger`) and its options only exist in the DOM while the panel is
// open, filtered to whichever "CEFR Level" is currently selected (defaults
// to A1). Mirrors app.spec.ts's identical helper.
async function chooseGrammarUnit(
  page: import("@playwright/test").Page,
  level: string,
  title: string,
) {
  await page.locator("#grammar-level-trigger").click();
  await page
    .getByRole("option", { name: new RegExp(`^${level} ·`) })
    .click();
  await page.locator("#grammar-unit-trigger").click();
  await page.getByRole("option", { name: title, exact: true }).click();
  // Choosing a Unit only updates the picker's own local state
  // (grammar/page.tsx's setUnitTitle) -- it does not itself call
  // setTodayGrammar. Only this button click actually commits the selection
  // to todayGrammar/localStorage, which is what every caller is really
  // waiting to observe.
  await page
    .getByRole("button", { name: /Start this unit|Go to this Mission/ })
    .click();
}

// Present perfect's controlled-practice pool is a fixed 3-item hardcoded
// set (presentPerfectExercises in automaticity-screen.tsx), so -- unlike
// every other grammar unit's now-expanded, shuffled pool -- these three
// prompt/answer pairs are always exactly the ones shown, just in a
// possibly-shuffled order. Target each by its own prompt label rather than
// by position so the test doesn't depend on shuffle order.
const PRESENT_PERFECT_ANSWERS: Record<string, string> = {
  "Transform: I started this project in May and I still work on it.":
    "I have worked on this project since May",
  "Complete: She ___ already ___ the report. (write)":
    "She has already written the report",
  "Transform: This is my first experience with shadowing.":
    "I have never tried shadowing before",
};

test("automaticity mission saves writing evidence and restores it", async ({
  page,
}) => {
  await page.goto("/grammar");
  await chooseGrammarUnit(page, "B1", "Present perfect");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = JSON.parse(
          localStorage.getItem("grammar-automaticity:v27") ?? "{}",
        ) as { todayGrammar?: { title?: string } };
        return state.todayGrammar?.title;
      }),
    )
    .toBe("Present perfect");

  await page.goto("/progress");
  await expect(
    page.getByRole("heading", { level: 1, name: "Automaticity Mission" }),
  ).toBeVisible();
  const evidence = page;
  await expect(evidence.getByText("Present perfect", { exact: true })).toBeVisible();

  // Controlled practice now starts in a study phase with the rule and
  // examples on screen -- and every expected answer is printed in them, so a
  // round answered with them open is recorded as study, not as retrieval
  // evidence. Hide them first: that is the path that actually earns evidence,
  // and it is what the rest of this test depends on.
  await evidence
    .getByRole("button", { name: "Hide the rule and answer from memory" })
    .click();
  await expect(evidence.getByText("Rule hidden — answer from memory.")).toBeVisible();

  for (const [prompt, answer] of Object.entries(PRESENT_PERFECT_ANSWERS)) {
    await evidence.getByLabel(prompt).fill(answer);
  }
  await evidence.getByRole("button", { name: "Check answers" }).click();
  await expect(
    evidence.getByText("Controlled practice complete, answered from memory."),
  ).toBeVisible();

  // The Mission shows one step at a time; it starts on step 1 (controlled
  // practice) until switched, so step 2's writing Textarea isn't in the DOM
  // until this is clicked. Not anchored with `^`: the card's accessible name
  // is its status badge ("Next"/"Start here"/"Done"/"You are here") THEN the
  // title, e.g. "Next 2. Automate & write 4 min · ..." -- confirmed via an
  // actual failing run's page snapshot, so an anchored match could never
  // succeed regardless of which badge is showing.
  await evidence
    .getByRole("button", { name: /2\. Automate & write/ })
    .click();
  const journal =
    "I have worked on my project today. I have written two notes. I have never used this method before. My friend has given me advice. The advice is useful. I feel more confident now.";
  await evidence.getByLabel("Present perfect journal").fill(journal);
  await evidence
    .getByRole("button", { name: "Analyse and save writing" })
    .click();
  await expect(evidence.getByText("Journal saved.")).toBeVisible();

  await page.reload();
  const restoredEvidence = page;
  // The Mission always reopens on step 1 (controlled practice) regardless
  // of what was last completed -- it doesn't remember which step was open,
  // only what evidence was saved.
  await restoredEvidence
    .getByRole("button", { name: /2\. Automate & write/ })
    .click();
  await expect(restoredEvidence.getByLabel("Present perfect journal")).toHaveValue(
    journal,
  );
  await expect(restoredEvidence.getByText("66% complete")).toBeVisible();
});

test("automaticity mission remains usable on a phone viewport", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/progress");

  await expect(
    page.getByRole("heading", { level: 1, name: "Automaticity Mission" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start evidence practice" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /2\. Automate & write/ })
    .click();
  // A brand-new browser context has no todayGrammar or selfDeclaredLevel
  // set, so the Mission falls back to the first A1-level unit in the
  // catalog ("Verb be: am/is/are"), not the "present perfect" default that
  // only applies once nothing else matches.
  await expect(page.getByLabel("Verb be: am/is/are journal")).toBeVisible();
  await expect(
    page.locator(
      "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
    ),
  ).toHaveCount(0);
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(consoleErrors).toEqual([]);
});

test("automaticity mission follows the lesson selected in Grammar Lab", async ({
  page,
}) => {
  await page.goto("/grammar");
  // Pick a topic other than Present perfect so this test actually proves
  // selection changes the Mission, rather than trivially matching the
  // default fallback grammar unit. Scoped to role="option" so it only
  // matches rows inside the open "Unit" SelectMenu panel, not sidebar/nav
  // buttons elsewhere on the page.
  await page.locator("#grammar-unit-trigger").click();
  const otherOption = page
    .getByRole("option")
    .filter({ hasNotText: "Present perfect" })
    .first();
  const selectedLesson = (await otherOption.textContent())?.trim() ?? "";
  expect(selectedLesson).not.toBe("");
  expect(selectedLesson).not.toBe("Present perfect");

  await otherOption.click();
  // Choosing a Unit only updates the picker's own local state -- the
  // "Start this unit" button is what actually calls setTodayGrammar (see
  // chooseGrammarUnit's comment above for the same gap found elsewhere).
  await page
    .getByRole("button", { name: /Start this unit|Go to this Mission/ })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = JSON.parse(
          localStorage.getItem("grammar-automaticity:v27") ?? "{}",
        ) as { todayGrammar?: { title?: string } };
        return state.todayGrammar?.title;
      }),
    )
    .toBe(selectedLesson);

  await page.goto("/progress");
  await expect(page.getByText(selectedLesson, { exact: true }).first()).toBeVisible();
  await page
    .getByRole("button", { name: /2\. Automate & write/ })
    .click();
  await expect(page.getByLabel(`${selectedLesson} journal`)).toBeVisible();
});
