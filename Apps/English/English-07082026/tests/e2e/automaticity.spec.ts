import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("automaticity mission saves writing evidence and restores it", async ({
  page,
}) => {
  await page.goto("/daily");
  await expect(page).toHaveURL(/\/daily$/);

  await page.goto("/grammar?topic=Present%20perfect#grammar-topic");
  await expect(page.getByText("Present perfect", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Use today" }).click();
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
  await page.goto("/?screen=progress");
  await expect(
    page.getByRole("heading", { level: 1, name: "Automaticity Mission" }),
  ).toBeVisible();
  const evidence = page;
  await expect(evidence.getByText("Present perfect", { exact: true })).toBeVisible();

  const answers = [
    "I have worked on this project since May",
    "She has already written the report",
    "I have never tried shadowing before",
  ];
  const controlledAnswers = evidence.locator('input:not([type="checkbox"])');
  for (const [index, answer] of answers.entries()) {
    await controlledAnswers.nth(index).fill(answer);
  }
  await evidence.getByRole("button", { name: "Check all three" }).click();
  await expect(
    evidence.getByText("Controlled practice complete."),
  ).toBeVisible();
  await evidence.getByRole("button", { name: /2\. Automate & write/ }).click();

  const journal =
    "I have worked on my project today. I have written two notes. I have never used this method before. My friend has given me advice. The advice is useful. I feel more confident now.";
  await evidence.getByLabel("Present perfect journal").fill(journal);
  await evidence
    .getByRole("button", { name: "Analyse and save writing" })
    .click();
  await expect(evidence.getByText("Journal saved.")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const ledger = JSON.parse(
          localStorage.getItem("automaticity:learning-evidence:v1") ?? "{}",
        ) as {
          contentUnits?: Array<{ cefrLevel?: string }>;
          responses?: Array<{ mode?: string; inputText?: string }>;
          evidence?: Array<{ automaticityClaim?: string }>;
          events?: Array<{ type?: string }>;
        };
        return {
          level: ledger.contentUnits?.at(-1)?.cefrLevel,
          mode: ledger.responses?.at(-1)?.mode,
          text: ledger.responses?.at(-1)?.inputText,
          claim: ledger.evidence?.at(-1)?.automaticityClaim,
          eventTypes: ledger.events?.map((event) => event.type),
        };
      }),
    )
    .toEqual({
      level: "B1",
      mode: "writing",
      text: journal,
      claim: "insufficient-longitudinal-evidence",
      eventTypes: [
        "learning.response.submitted.v1",
        "learning.evidence.recorded.v1",
      ],
    });

  await page.reload();
  const restoredEvidence = page;
  await restoredEvidence
    .getByRole("button", { name: /2\. Automate & write/ })
    .click();
  await expect(restoredEvidence.getByLabel("Present perfect journal")).toHaveValue(
    journal,
  );
  await expect(restoredEvidence.getByText("66% complete")).toBeVisible();

  await page.evaluate(() => {
    const key = "grammar-automaticity:v27";
    const state = JSON.parse(localStorage.getItem(key) ?? "{}") as {
      reviews?: Array<{ sourceId?: string; dueAt?: number; status?: string }>;
    };
    state.reviews = (state.reviews ?? []).map((review) =>
      review.sourceId === "Present perfect"
        ? { ...review, dueAt: 0, status: "pending" }
        : review,
    );
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  const delayedTransfer =
    "I have joined a new project. My manager has shared the goals. We have planned the first sprint. The team has created a prototype. Today the work feels clearer. This experience helps me communicate.";
  await page.getByLabel("Delayed Present perfect transfer").fill(delayedTransfer);
  await page.getByRole("button", { name: "Save delayed transfer" }).click();
  await expect(
    page.getByText(
      "Delayed recall and novel transfer saved as separate evidence events.",
    ),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const ledger = JSON.parse(
          localStorage.getItem("automaticity:learning-evidence:v1") ?? "{}",
        ) as { events?: Array<{ type?: string }> };
        return ledger.events?.slice(-4).map((event) => event.type);
      }),
    )
    .toEqual([
      "learning.response.submitted.v1",
      "learning.evidence.recorded.v1",
      "learning.delayed-recall.recorded.v1",
      "learning.novel-transfer.recorded.v1",
    ]);

  await page.goto("/settings");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export data" }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const exported = JSON.parse(await readFile(downloadPath!, "utf8")) as {
    learningEvidence?: {
      contentUnits?: Array<{ version?: string }>;
      responses?: Array<{ mode?: string }>;
      events?: Array<{ type?: string }>;
    };
  };
  expect(exported.learningEvidence?.contentUnits?.at(-1)?.version).toBe(
    "27.3.13-b1-runtime",
  );
  expect(exported.learningEvidence?.responses?.map((row) => row.mode)).toEqual([
    "writing",
    "transfer",
  ]);
  expect(exported.learningEvidence?.events?.map((row) => row.type)).toContain(
    "learning.delayed-recall.recorded.v1",
  );
  expect(exported.learningEvidence?.events?.map((row) => row.type)).toContain(
    "learning.novel-transfer.recorded.v1",
  );
});

test("automaticity mission remains usable on a phone viewport", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const current = JSON.parse(
      localStorage.getItem("grammar-automaticity:v27") ?? "{}",
    );
    localStorage.setItem(
      "grammar-automaticity:v27",
      JSON.stringify({
        ...current,
        learner: { ...current.learner, selfDeclaredLevel: "B1" },
        todayGrammar: {
          date: new Date().toISOString().slice(0, 10),
          level: "B1",
          title: "Present perfect",
        },
      }),
    );
  });
  await page.goto("/?screen=progress");

  await expect(
    page.getByRole("heading", { level: 1, name: "Automaticity Mission" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start evidence practice" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /2\. Automate & write/ }).click();
  await expect(page.getByLabel("Present perfect journal")).toBeVisible();
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
  const useToday = page.getByRole("button", { name: "Use today" }).first();
  await expect(useToday).toBeVisible();
  await useToday.click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = JSON.parse(
          localStorage.getItem("grammar-automaticity:v27") ?? "{}",
        ) as { todayGrammar?: { title?: string } };
        return state.todayGrammar?.title;
      }),
    )
    .not.toBeUndefined();
  const title = await page.evaluate(() => {
    const state = JSON.parse(
      localStorage.getItem("grammar-automaticity:v27") ?? "{}",
    ) as { todayGrammar?: { title?: string } };
    return state.todayGrammar?.title ?? "";
  });
  expect(title).not.toBe("");
  await page.goto("/?screen=progress");

  await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: /2\. Automate & write/ }).click();
  await expect(page.getByLabel(`${title} journal`)).toBeVisible();
});
