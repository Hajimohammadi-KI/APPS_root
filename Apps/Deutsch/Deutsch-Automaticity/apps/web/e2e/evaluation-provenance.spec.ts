import { expect, test } from "@playwright/test";

const JOURNAL =
  "Ich lerne, weil ich Zeit habe. Wir gehen, weil es spät ist. Sie wartet, weil er noch arbeitet. Ich bleibe, weil ich müde bin. Er liest, weil das Buch spannend ist. Wir lachen, weil sie lustig ist.";

test("local writing and a failed online review remain unverified in saved evidence", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("GrammarAutomaticityV11_de")) return;
    localStorage.setItem(
      "GrammarAutomaticityV11_de",
      JSON.stringify({
        learningLevel: "A2",
        learner: { allowOnlineAI: true },
        todayGrammar: {
          date: new Date().toISOString().slice(0, 10),
          level: "A2",
          title: "Nebensatz mit weil",
        },
        reviews: [
          {
            id: "existing-review",
            due: 0,
            stage: 0,
            topic: "Nebensatz mit weil",
            original: "Ich bleibe weil ich müde bin.",
            corrected: "Ich bleibe, weil ich müde bin.",
            reviewMode: "production",
          },
        ],
      }),
    );
  });
  await page.route("**/evaluate", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("/automatik");
  await page
    .getByRole("button", { name: /2\. Automatisieren & schreiben/ })
    .click();
  await page.getByLabel("Nebensatz mit weil-Tagebuch").fill(JOURNAL);
  await page
    .getByRole("button", { name: "Schreiben analysieren und speichern" })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const ledger = JSON.parse(
          localStorage.getItem("automaticity:learning-evidence:v1") ?? "{}",
        );
        return ledger.evidence?.at(-1)?.verification;
      }),
    )
    .toEqual({
      status: "unverified",
      provider: "offline",
      reason: "unverified-evaluation",
    });

  await page.goto("/wiederholungen");
  await page
    .getByLabel("Richtige Fassung")
    .fill("Ich bleibe, weil ich müde bin.");
  await page.getByRole("button", { name: "Antwort prüfen" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const ledger = JSON.parse(
          localStorage.getItem("automaticity:learning-evidence:v1") ?? "{}",
        );
        return {
          count: ledger.evidence?.length,
          verification: ledger.evidence?.at(-1)?.verification,
        };
      }),
    )
    .toEqual({
      count: 2,
      verification: {
        status: "unverified",
        provider: "offline",
        reason: "unverified-evaluation",
      },
    });
});
