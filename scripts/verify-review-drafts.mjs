import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  require = createRequire(
    resolve(root, "Apps/English/English-Automaticity/package.json"),
  );
const { chromium, expect } = require("@playwright/test");
const baseline = process.argv.includes("--baseline"),
  installed = process.argv.includes("--installed");
const output = resolve(
  root,
  `artifacts/review-drafts/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = {
  createdAt: new Date().toISOString(),
  scope: `${installed ? "Installed" : "Compiled source"} review UI with isolated synthetic responses; no real learner profiles`,
  baseline,
  cases: [],
};
try {
  for (const language of ["en", "de"]) {
    const app =
      language === "en"
        ? "Apps/English/English-Automaticity"
        : "Apps/Deutsch-Automaticity";
    const pack = JSON.parse(
      await readFile(
        resolve(
          root,
          app,
          `apps/web/public/learning-core/curriculum-${language}.json`,
        ),
        "utf8",
      ),
    );
    const task = pack.units[0].tasks.find(
      (task) => task.stage === "produce" && task.modality === "writing",
    );
    const server = createServer(async (req, res) => {
      const path = new URL(req.url, "http://localhost").pathname;
      const file =
        path === "/practice"
          ? `shared/learning-core/browser/practice-${language}.html`
          : path === `/learning-core/curriculum-${language}.json`
            ? `${app}/apps/web/public${path}`
            : [
                  "/learning-core/practice.js",
                  "/learning-core/practice.css",
                ].includes(path)
              ? `shared/learning-core/browser/${path.split("/").at(-1)}`
              : null;
      if (!file) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.setHeader(
        "Content-Type",
        file.endsWith(".js")
          ? "text/javascript"
          : file.endsWith(".css")
            ? "text/css"
            : file.endsWith(".json")
              ? "application/json"
              : "text/html",
      );
      res.end(await readFile(resolve(root, file)));
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = installed
      ? `http://127.0.0.1:${language === "en" ? 3202 : 3210}`
      : `http://127.0.0.1:${server.address().port}`;
    const context = await browser.newContext({
        viewport: { width: 1200, height: 1000 },
      }),
      page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(30000);
    const row = { language, status: "running", checks: [] };
    report.cases.push(row);
    try {
      await page.addInitScript(
        ({ language, task }) => {
          if (localStorage.getItem("review-draft-fixture")) return;
          localStorage.setItem("review-draft-fixture", "1");
          for (const [id, offset, text] of [
            ["review-first", 120000, "Synthetic first response."],
            ["review-second", 60000, "Synthetic second response."],
          ]) {
            const at = new Date(Date.now() - offset).toISOString();
            const attempt = {
              version: 2,
              type: "attempt",
              id,
              language,
              at,
              task,
              response: {
                text,
                sha256: "a".repeat(64),
                originalTranscriptSha256: null,
                transcriptEdited: false,
              },
              timing: {
                startedAt: at,
                activeMs: null,
                firstInputMs: null,
                source: "unavailable",
              },
              assistance: {
                hintCount: 0,
                solutionRevealed: false,
                exampleSeen: false,
                selfReportedAssistance: false,
              },
              audio: null,
              previousAttemptId: null,
            };
            localStorage.setItem(
              `automaticity:v2:${language}:event:${id}`,
              JSON.stringify(attempt),
            );
          }
        },
        { language, task },
      );
      await page.goto(`${base}/practice?review=1`);
      await page.locator("#review-attempt").selectOption("review-first");
      await page
        .locator("#review-feedback")
        .fill("Unfinished feedback for the first response.");
      const toggle = async () => {
        await Promise.all([
          page.evaluate(
            () =>
              new Promise((resolve) =>
                document
                  .getElementById("response-review")
                  .addEventListener("toggle", () => resolve(), { once: true }),
              ),
          ),
          page.locator("#response-review > summary").click(),
        ]);
      };
      await toggle();
      await toggle();
      const value = await page.locator("#review-feedback").inputValue();
      if (baseline) {
        row.lostOnReopen = value === "";
        row.status = row.lostOnReopen ? "reproduced" : "not-reproduced";
        assert(row.lostOnReopen);
        continue;
      }
      await expect(page.locator("#review-feedback")).toHaveValue(
        "Unfinished feedback for the first response.",
      );
      row.checks.push("collapse-reopen-preserves-draft");
      await page.locator("#review-kind").selectOption("human");
      await page.locator("#reviewer-name").fill("Synthetic reviewer");
      await page.locator("#review-verdict").selectOption("needs_repair");
      await page.locator("#review-opportunities").fill("2");
      await page
        .locator("#review-correction")
        .fill("Synthetic suggested correction.");
      await page.locator("#review-attempt").selectOption("review-second");
      await expect(page.locator("#review-feedback")).toHaveValue("");
      await expect(page.locator("#reviewer-name")).toHaveValue("");
      await page.locator("#review-feedback").fill("Separate second draft.");
      await page.locator("#review-attempt").selectOption("review-first");
      await expect(page.locator("#review-feedback")).toHaveValue(
        "Unfinished feedback for the first response.",
      );
      await expect(page.locator("#review-kind")).toHaveValue("human");
      await expect(page.locator("#review-opportunities")).toHaveValue("2");
      row.checks.push("per-response-drafts-do-not-leak");
      await page.reload();
      await expect(page.locator("#review-attempt")).toHaveValue("review-first");
      await expect(page.locator("#review-feedback")).toHaveValue(
        "Unfinished feedback for the first response.",
      );
      await expect(page.locator("#review-correction")).toHaveValue(
        "Synthetic suggested correction.",
      );
      row.checks.push("reload-restores-selected-response-and-draft");
      const originalBytes = await page.evaluate(
        (language) =>
          localStorage.getItem(
            `automaticity:v2:${language}:event:review-first`,
          ),
        language,
      );
      await page.evaluate((language) => {
        const original = JSON.parse(
          localStorage.getItem(
            `automaticity:v2:${language}:event:review-first`,
          ),
        );
        const newer = {
          version: 2,
          type: "assessment",
          id: "competing-review",
          language,
          at: new Date().toISOString(),
          attemptId: original.id,
          responseSha256: original.response.sha256,
          taskVersion: original.task.version,
          rubricVersion: original.task.rubricVersion,
          verdict: "pass",
          dimensions: {
            grammar: "pass",
            target: "observed",
            relevance: "pass",
            opportunities: 1,
          },
          evaluator: {
            id: "synthetic-other-reviewer",
            version: "1",
            kind: "human",
            scopeApproved: false,
            reviewId: "synthetic-review-id",
          },
          uncertainty: false,
          confidence: null,
          feedback: "Newer synthetic feedback",
          correction: null,
          spans: [],
          supersedes: null,
        };
        localStorage.setItem(
          `automaticity:v2:${language}:event:${newer.id}`,
          JSON.stringify(newer),
        );
      }, language);
      const submit = page.getByRole("button", {
        name:
          language === "en"
            ? "Save separate review"
            : "Separate Bewertung speichern",
        exact: true,
      });
      await submit.click();
      await expect(page.locator("#review-save-status")).toContainText(
        language === "en" ? "Feedback changed" : "Rückmeldung hat sich",
      );
      await expect(page.locator("#review-feedback")).toHaveValue(
        "Unfinished feedback for the first response.",
      );
      row.checks.push("newer-feedback-is-not-silently-superseded");
      await page.locator("#review-compare").click();
      await expect(page.locator("#review-current-feedback")).toContainText(
        "Newer synthetic feedback",
      );
      await submit.click();
      await expect(page.locator("#review-save-status")).toContainText(
        language === "en"
          ? "Review saved separately"
          : "Bewertung separat gespeichert",
      );
      const reviews = await page.evaluate(
        (language) =>
          Object.keys(localStorage)
            .filter((key) =>
              key.startsWith(`automaticity:v2:${language}:event:`),
            )
            .map((key) => JSON.parse(localStorage.getItem(key)))
            .filter((event) => event.type === "assessment"),
        language,
      );
      assert.equal(reviews.length, 2);
      const saved = reviews.find((event) => event.id !== "competing-review");
      assert.equal(saved.supersedes, "competing-review");
      assert.equal(
        saved.feedback,
        "Unfinished feedback for the first response.",
      );
      assert.equal(saved.correction, "Synthetic suggested correction.");
      assert.equal(saved.evaluator.scopeApproved, false);
      assert.equal(
        await page.evaluate(
          (language) =>
            localStorage.getItem(
              `automaticity:v2:${language}:event:review-first`,
            ),
          language,
        ),
        originalBytes,
      );
      assert.equal(
        await page.evaluate(
          (language) =>
            localStorage.getItem(
              `automaticity:v2:${language}:review-draft:review-first`,
            ),
          language,
        ),
        null,
      );
      row.checks.push(
        "review-save-preserves-original-and-clears-only-its-draft",
      );
      await page.locator("#review-attempt").selectOption("review-second");
      await expect(page.locator("#review-feedback")).toHaveValue(
        "Separate second draft.",
      );
      const backupDownload = page.waitForEvent("download");
      await page
        .getByRole("button", {
          name:
            language === "en"
              ? "Download complete backup"
              : "Vollständige Sicherung herunterladen",
          exact: true,
        })
        .click();
      const backupPath = resolve(output, `${language}-backup.json`);
      await (await backupDownload).saveAs(backupPath);
      const backup = JSON.parse(await readFile(backupPath, "utf8"));
      assert(
        backup.localStorage.some(
          ([key, value]) =>
            key === `automaticity:v2:${language}:review-draft:review-second` &&
            JSON.parse(value).feedback === "Separate second draft.",
        ),
      );
      row.checks.push("complete-backup-includes-review-drafts");
      const second = await context.newPage();
      await second.goto(`${base}/practice?review=1`);
      await expect(second.locator("#review-feedback")).toBeDisabled();
      await expect(
        second.getByRole("button", {
          name:
            language === "en"
              ? "Save separate review"
              : "Separate Bewertung speichern",
          exact: true,
        }),
      ).toBeDisabled();
      await second.close();
      row.checks.push("second-tab-cannot-edit-the-same-review");
      const beforeQuota = await page.evaluate(
        (language) =>
          localStorage.getItem(
            `automaticity:v2:${language}:review-draft:review-second`,
          ),
        language,
      );
      await page.evaluate(() => {
        const original = Storage.prototype.setItem;
        window.restoreReviewWrites = () => {
          Storage.prototype.setItem = original;
        };
        Storage.prototype.setItem = function (key, value) {
          if (key.includes(":review-draft:"))
            throw new DOMException(
              "Synthetic full store",
              "QuotaExceededError",
            );
          return original.call(this, key, value);
        };
      });
      await page
        .locator("#review-feedback")
        .fill("Unsaved quota draft to export.");
      await expect(page.locator("#review-draft-status")).toContainText(
        language === "en"
          ? "could not be saved"
          : "konnten aber nicht gespeichert",
      );
      const draftDownload = page.waitForEvent("download");
      await page.locator("#review-export-draft").click();
      const draftPath = resolve(output, `${language}-quota-draft.json`);
      await (await draftDownload).saveAs(draftPath);
      assert.equal(
        JSON.parse(await readFile(draftPath, "utf8")).draft.feedback,
        "Unsaved quota draft to export.",
      );
      assert.equal(
        await page.evaluate(
          (language) =>
            localStorage.getItem(
              `automaticity:v2:${language}:review-draft:review-second`,
            ),
          language,
        ),
        beforeQuota,
      );
      row.checks.push("quota-failure-keeps-original-and-exports-current-draft");
      await page.evaluate(() => window.restoreReviewWrites());
      await page.locator("#review-feedback").fill("Saved after recovery.");
      await expect(page.locator("#review-draft-status")).toContainText(
        language === "en"
          ? "saved on this device"
          : "auf diesem Gerät gespeichert",
      );
      await page.evaluate(
        async ({ language, task }) => {
          const bytes = new Uint8Array(444),
            view = new DataView(bytes.buffer);
          const ascii = (at, text) =>
            [...text].forEach(
              (char, i) => (bytes[at + i] = char.charCodeAt(0)),
            );
          ascii(0, "RIFF");
          view.setUint32(4, 436, true);
          ascii(8, "WAVEfmt ");
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true);
          view.setUint16(22, 1, true);
          view.setUint32(24, 8000, true);
          view.setUint32(28, 16000, true);
          view.setUint16(32, 2, true);
          view.setUint16(34, 16, true);
          ascii(36, "data");
          view.setUint32(40, 400, true);
          const hash = async (value) =>
            Array.from(
              new Uint8Array(await crypto.subtle.digest("SHA-256", value)),
            )
              .map((byte) => byte.toString(16).padStart(2, "0"))
              .join("");
          const blob = new Blob([bytes], { type: "audio/wav" }),
            sha = await hash(bytes),
            text = "Synthetic recorded response.",
            textHash = await hash(new TextEncoder().encode(text)),
            at = new Date(Date.now() - 1000).toISOString();
          const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open(`automaticity-v2-${language}`, 1);
            request.onupgradeneeded = () =>
              request.result.createObjectStore("audio", { keyPath: "id" });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          await new Promise((resolve, reject) => {
            const transaction = db.transaction("audio", "readwrite");
            transaction
              .objectStore("audio")
              .put({
                id: "synthetic-review-audio",
                blob,
                sha256: sha,
                durationMs: 25,
                createdAt: at,
                language,
                taskId: task.id,
              });
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
          });
          db.close();
          const attempt = {
            version: 2,
            type: "attempt",
            id: "review-audio",
            language,
            at,
            task,
            response: {
              text,
              sha256: textHash,
              originalTranscriptSha256: textHash,
              transcriptEdited: false,
            },
            timing: {
              startedAt: at,
              activeMs: null,
              firstInputMs: null,
              source: "unavailable",
            },
            assistance: {
              hintCount: 0,
              solutionRevealed: false,
              exampleSeen: false,
              selfReportedAssistance: false,
            },
            audio: {
              id: "synthetic-review-audio",
              sha256: sha,
              bytes: blob.size,
              durationMs: 25,
              mime: "audio/wav",
              persisted: true,
            },
            previousAttemptId: null,
          };
          localStorage.setItem(
            `automaticity:v2:${language}:event:review-audio`,
            JSON.stringify(attempt),
          );
        },
        {
          language,
          task: pack.units[0].tasks.find(
            (task) => task.stage === "produce" && task.modality === "speaking",
          ),
        },
      );
      await toggle();
      await toggle();
      await page.locator("#review-attempt").selectOption("review-audio");
      await page.evaluate(() => {
        const get = IDBObjectStore.prototype.get;
        window.audioReadFinished = false;
        window.restoreAudioGet = () => {
          IDBObjectStore.prototype.get = get;
        };
        IDBObjectStore.prototype.get = function (key) {
          const request = get.call(this, key);
          if (this.name === "audio" && key === "synthetic-review-audio") {
            const setter = Object.getOwnPropertyDescriptor(
              IDBRequest.prototype,
              "onsuccess",
            ).set;
            Object.defineProperty(request, "onsuccess", {
              set(callback) {
                setter.call(this, (event) =>
                  setTimeout(() => {
                    callback.call(request, event);
                    window.audioReadFinished = true;
                  }, 400),
                );
              },
            });
          }
          return request;
        };
      });
      await page
        .getByRole("button", {
          name:
            language === "en"
              ? "Load original recording"
              : "Originalaufnahme laden",
          exact: true,
        })
        .click();
      await page.locator("#review-attempt").selectOption("review-second");
      await page.waitForFunction(() => window.audioReadFinished);
      assert.equal(await page.locator("#response-review audio").count(), 0);
      row.checks.push("late-audio-load-cannot-attach-to-another-response");
      await page.evaluate(() => window.restoreAudioGet());
      await page.locator("#review-attempt").selectOption("review-audio");
      await page
        .getByRole("button", {
          name:
            language === "en"
              ? "Load original recording"
              : "Originalaufnahme laden",
          exact: true,
        })
        .click();
      await expect(page.locator("#response-review audio")).toHaveCount(1);
      await page.waitForFunction(
        () => document.querySelector("#response-review audio").readyState >= 1,
      );
      row.checks.push("original-recording-remains-playable");
      await page.locator("#review-attempt").selectOption("review-second");
      await page.evaluate(
        (language) =>
          localStorage.setItem(
            `automaticity:v2:${language}:review-draft:review-second`,
            "broken original draft",
          ),
        language,
      );
      await page.reload();
      await expect(page.locator("#review-draft-status")).toContainText(
        language === "en" ? "could not be read" : "konnte nicht gelesen",
      );
      await page
        .locator("#review-feedback")
        .fill("New draft beside corrupt original.");
      assert.equal(
        await page.evaluate(
          (language) =>
            localStorage.getItem(
              `automaticity:v2:${language}:review-draft:review-second`,
            ),
          language,
        ),
        "broken original draft",
      );
      row.checks.push("corrupt-draft-bytes-are-preserved");
      await page.setViewportSize({ width: 390, height: 844 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.locator("#review-feedback").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: resolve(output, `${language}-review-mobile.png`),
      });
      row.checks.push("mobile-review-form-fits");
      row.status = "passed";
    } catch (error) {
      row.status = "failed";
      row.error = String(error);
      row.body = await page
        .locator("body")
        .innerText()
        .catch(() => "");
    } finally {
      await context.close();
      await new Promise((resolve) => server.close(resolve));
      console.log(JSON.stringify({ ...row, body: undefined }));
    }
  }
} finally {
  await browser.close();
  report.status = report.cases.every(
    (row) => row.status === (baseline ? "reproduced" : "passed"),
  )
    ? "passed"
    : "failed";
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(`Evidence: ${output}`);
}
assert.equal(report.status, "passed");
