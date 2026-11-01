// Node + Playwright. Learner comments on a checked answer, against the static
// practice page with a simulated /api/learner-feedback; no GitHub request.
// Usage: node scripts/verify-learner-feedback-browser.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(
  resolve(root, "Apps/English/English-Automaticity/package.json"),
);
const { chromium } = require("@playwright/test");

const copy = {
  en: {
    check: /save and check/i,
    summary: "Comment on this check",
    repair: "Try again as a repair",
    category: "My answer is correct",
    send: "Send comment",
    receipts: "My comments",
    status: "Check status",
    withdraw: "Withdraw",
    accepted: "Your answer was accepted as correct",
  },
  de: {
    check: /speichern und prüfen/i,
    summary: "Kommentar zu dieser Prüfung",
    repair: "Als Korrektur erneut versuchen",
    category: "Meine Antwort ist richtig",
    send: "Kommentar senden",
    receipts: "Meine Kommentare",
    status: "Status prüfen",
    withdraw: "Zurückziehen",
    accepted: "Deine Antwort wurde als richtig angenommen",
  },
};
const browser = await chromium.launch();
const results = [];
try {
  for (const language of ["en", "de"]) {
    const t = copy[language];
    const publicRoot = resolve(
      root,
      `Apps/${language === "en" ? "English/English-Automaticity" : "Deutsch/Deutsch-Automaticity"}/apps/web/public`,
    );
    const server = createServer(async (req, res) => {
      try {
        const path = new URL(req.url, "http://localhost").pathname;
        const file =
          path === "/practice"
            ? resolve(
                root,
                `shared/learning-core/browser/practice-${language}.html`,
              )
            : resolve(publicRoot, "." + path);
        const inside = relative(publicRoot, file);
        if (
          path !== "/practice" &&
          (isAbsolute(inside) || inside.startsWith(".."))
        )
          throw Error("Outside public assets");
        const data = await readFile(file);
        res.setHeader(
          "Content-Type",
          file.endsWith(".js")
            ? "text/javascript"
            : file.endsWith(".json")
              ? "application/json"
              : file.endsWith(".css")
                ? "text/css"
                : "text/html",
        );
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end();
      }
    });
    await new Promise((done) => server.listen(0, "127.0.0.1", done));
    const base = `http://127.0.0.1:${server.address().port}`;
    const answer = async (page, text) => {
      await page.goto(`${base}/practice`, { waitUntil: "networkidle" });
      await page.locator("#practice-response").fill(text);
      await page.getByRole("button", { name: t.check }).first().click();
      await page.getByRole("button", { name: t.repair }).first().waitFor();
      await page.waitForLoadState("networkidle");
    };
    try {
      // 1. Without the service, the panel stays hidden and nothing is sent.
      const off = await browser.newContext();
      const offPage = await off.newPage();
      const offPosts = [];
      offPage.on(
        "request",
        (r) =>
          r.method() === "POST" &&
          r.url().includes("learner-feedback") &&
          offPosts.push(r.url()),
      );
      await answer(offPage, "A synthetic answer that is not stored.");
      assert.equal(
        await offPage.getByText(t.summary, { exact: true }).first().isVisible(),
        false,
      );
      assert.equal(
        await offPage.locator("#learner-feedback-receipts").isVisible(),
        false,
      );
      assert.equal(offPosts.length, 0);
      await off.close();

      // 2. With the service: exact preview, fresh consent, receipt, status, withdrawal.
      const context = await browser.newContext();
      const page = await context.newPage();
      const posted = [];
      const deleted = [];
      await page.route("**/api/learner-feedback**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (request.method() === "POST") {
          posted.push(JSON.parse(request.postData()));
          return route.fulfill({
            status: 201,
            json: {
              receipt: { id: 42, token: "s".repeat(43) },
              state: "received",
            },
          });
        }
        if (request.method() === "DELETE") {
          deleted.push(url.search);
          return route.fulfill({ json: { state: "withdrawn" } });
        }
        if (url.searchParams.get("id"))
          return route.fulfill({
            json: {
              state: "answer_accepted",
              reply: "Thanks, that is correct.",
            },
          });
        return route.fulfill({ json: { available: true } });
      });
      const text = "A synthetic answer for review.";
      await answer(page, text);
      await page.getByText(t.summary, { exact: true }).first().click();
      const send = page.getByRole("button", { name: t.send });
      await send.waitFor();
      assert.equal(await send.isDisabled(), true, "no category and no consent");
      await page.getByLabel(t.category).check();
      assert.equal(await send.isDisabled(), true, "no consent yet");
      const consent = page.locator(
        'input[type="checkbox"][id^="learner-feedback-consent-"]',
      );
      await consent.check();
      assert.equal(await send.isDisabled(), false);
      await page
        .locator('textarea[id^="learner-feedback-comment-"]')
        .fill("Comment written after consent.");
      assert.equal(
        await consent.isChecked(),
        false,
        "editing withdraws the consent",
      );
      assert.match(
        await page.locator(".learner-feedback pre").innerText(),
        /Comment written after consent\./,
      );
      await consent.check();
      await send.click();
      await page.getByText("#42").first().waitFor();
      assert.equal(posted.length, 1);
      const body = posted[0];
      assert.equal(body.response, text);
      assert.equal(body.category, "answer_correct");
      assert.equal(body.comment, "Comment written after consent.");
      assert.equal(body.language, language);
      assert.deepEqual(Object.keys(body).sort(), [
        "category",
        "check",
        "comment",
        "consent",
        "contentVersion",
        "kind",
        "language",
        "release",
        "response",
        "task",
        "version",
      ]);
      const receipts = await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)),
        `automaticity:v2:${language}:learner-feedback:receipts`,
      );
      assert.equal(receipts[0].id, 42);

      await page.reload({ waitUntil: "networkidle" });
      const list = page.locator("#learner-feedback-receipts");
      await list.evaluate((node) => {
        for (
          let el = node;
          el;
          el = el.parentElement?.closest("details") ?? null
        )
          el.setAttribute("open", "");
      });
      await list.getByRole("button", { name: t.status }).click();
      await list.getByText(t.accepted).waitFor();
      await list.getByText("Thanks, that is correct.").waitFor();
      page.once("dialog", (dialog) => dialog.accept());
      await list.getByRole("button", { name: t.withdraw }).click();
      await list
        .getByText(/Withdrawn|Zurückgezogen/)
        .first()
        .waitFor();
      assert.equal(deleted.length, 1);
      assert.match(deleted[0], /id=42&token=s{43}/);
      await context.close();

      // 3. The owner's review page shows learner text literally and records a decision.
      const review = await browser.newContext();
      const reviewPage = await review.newPage();
      const decisions = [];
      await reviewPage.route(
        "**/api/learner-feedback/review",
        async (route) => {
          const request = route.request();
          if (request.headers()["x-review-key"] !== "owner-key-for-this-check")
            return route.fulfill({
              status: 401,
              json: { error: "The review key is not valid." },
            });
          if (request.method() === "POST") {
            decisions.push(JSON.parse(request.postData()));
            return route.fulfill({ json: { state: "answer_rejected" } });
          }
          return route.fulfill({
            json: {
              items: [
                {
                  number: 7,
                  url: null,
                  createdAt: "2026-11-01T10:00:00Z",
                  feedback: {
                    ...body,
                    response: '<img src=x onerror="window.injected=1">',
                  },
                },
              ],
            },
          });
        },
      );
      await reviewPage.goto(`${base}/learning-core/feedback-review.html`, {
        waitUntil: "networkidle",
      });
      await reviewPage
        .locator('input[type="password"]')
        .fill("owner-key-for-this-check");
      await reviewPage
        .getByRole("button", { name: "بارگذاری کامنت‌ها" })
        .click();
      await reviewPage.getByText("#7", { exact: false }).first().waitFor();
      assert.equal(await reviewPage.locator("article img").count(), 0);
      assert.equal(await reviewPage.evaluate(() => window.injected), undefined);
      await reviewPage.locator("article select").selectOption("known_wrong");
      await reviewPage
        .locator("article textarea")
        .first()
        .fill("Explained for later learners.");
      await reviewPage.getByRole("button", { name: "ثبت تصمیم" }).click();
      await reviewPage.getByText("ثبت شد", { exact: false }).waitFor();
      assert.equal(decisions[0].issue, 7);
      assert.equal(decisions[0].decision, "known_wrong");
      assert.equal(decisions[0].explanation, "Explained for later learners.");
      await review.close();
      results.push({ language, status: "pass" });
    } finally {
      server.close();
    }
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(results));
