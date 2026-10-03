import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(
  resolve(root, "Apps/English/English-Automaticity/package.json"),
);
const { chromium, expect } = require("@playwright/test");
const folder = resolve(
  root,
  `artifacts/curriculum-revision-browser/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(folder, { recursive: true });
const hash = (value) => createHash("sha256").update(value).digest("hex");
const report = {
  at: new Date().toISOString(),
  status: "running",
  scope:
    "Installed apps with isolated synthetic drafts and responses; no real learner-profile mutation",
  cases: [],
};
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const [language, port, app, unitId] of [
    ["en", 3202, "Apps/English/English-Automaticity", "en.c.001"],
    ["de", 3210, "Apps/Deutsch-Automaticity", "de.c.002"],
  ]) {
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
    const unit = pack.units.find((unit) => unit.id === unitId),
      retirement = unit.retiredTasks.find(
        (row) => row.taskId === `${unitId}.retrieve.1.writing`,
      ),
      task = unit.tasks.find((task) => task.id === retirement.taskId);
    const replacement = unit.tasks.find(
      (task) => task.id === retirement.replacementTaskId,
    );
    const base = `http://127.0.0.1:${port}`,
      savedText =
        language === "en"
          ? "My earlier English draft."
          : "Mein früherer deutscher Entwurf.";
    const session = {
      version: 2,
      taskId: task.id,
      taskVersion: task.version,
      draft: savedText,
      startedAt: "2026-09-05T08:00:00.000Z",
      hintCount: 0,
      solutionRevealed: false,
      exampleSeen: false,
      selfReportedAssistance: false,
      previousAttemptId: null,
      submittedId: null,
      audioId: null,
    };
    const original = {
      version: 2,
      type: "attempt",
      id: `synthetic-preserved-${language}`,
      language,
      at: "2026-09-05T08:00:00.000Z",
      task,
      response: {
        text: savedText,
        sha256: hash(savedText),
        originalTranscriptSha256: null,
        transcriptEdited: false,
      },
      timing: {
        startedAt: "2026-09-05T08:00:00.000Z",
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
    const sessionKey = `automaticity:v2:${language}:session`,
      taskKey = `${sessionKey}:task:${encodeURIComponent(task.id)}`,
      eventKey = `automaticity:v2:${language}:event:${original.id}`;
    const sessionBytes = JSON.stringify(session),
      eventBytes = JSON.stringify(original);
    const context = await browser.newContext({ serviceWorkers: "block" }),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await context.addInitScript(
      ({ sessionKey, taskKey, eventKey, sessionBytes, eventBytes }) => {
        if (!localStorage.getItem("task-revision-fixture-seeded")) {
          localStorage.setItem(sessionKey, sessionBytes);
          localStorage.setItem(taskKey, sessionBytes);
          localStorage.setItem(eventKey, eventBytes);
          localStorage.setItem("task-revision-fixture-seeded", "1");
        }
      },
      { sessionKey, taskKey, eventKey, sessionBytes, eventBytes },
    );
    const asset = await context.request.get(
      base + "/learning-core/practice.js",
    );
    assert.equal(asset.status(), 200);
    assert.equal(
      hash(await asset.body()),
      hash(
        await readFile(
          resolve(root, "shared/learning-core/browser/practice.js"),
        ),
      ),
    );
    await page.goto(`${base}/practice?task=${encodeURIComponent(task.id)}`);
    const archived = page.getByRole("textbox", {
      name: language === "en" ? "Archived response" : "Archivierte Antwort",
    });
    await expect(archived).toHaveValue(savedText);
    assert.equal(await archived.getAttribute("readonly"), "");
    await expect(
      page.getByRole("button", {
        name: language === "en" ? "Save and check" : "Speichern und prüfen",
        exact: true,
      }),
    ).toHaveCount(0);
    const originalStored = () =>
      page.evaluate(
        ({ taskKey, eventKey }) => ({
          draft: localStorage.getItem(taskKey),
          attempt: localStorage.getItem(eventKey),
        }),
        { taskKey, eventKey },
      );
    assert.deepEqual(await originalStored(), {
      draft: sessionBytes,
      attempt: eventBytes,
    });
    await page.screenshot({
      path: resolve(folder, `${language}-archived-draft.png`),
    });
    await page
      .getByRole("button", {
        name:
          language === "en" ? "Open replacement exercise" : "Neue Übung öffnen",
        exact: true,
      })
      .click();
    await expect(page.locator(".task-prompt")).toHaveText(replacement.prompt);
    await expect(
      page.getByRole("textbox", {
        name: language === "en" ? "Your response" : "Deine Antwort",
        exact: true,
      }),
    ).toHaveValue("");
    assert.deepEqual(await originalStored(), {
      draft: sessionBytes,
      attempt: eventBytes,
    });
    const response = language === "en" ? "I am ready." : "Ich habe heute Zeit.";
    await page
      .getByRole("textbox", {
        name: language === "en" ? "Your response" : "Deine Antwort",
        exact: true,
      })
      .fill(response);
    await page.reload();
    await expect(
      page.getByRole("textbox", {
        name: language === "en" ? "Your response" : "Deine Antwort",
        exact: true,
      }),
    ).toHaveValue(response);
    await page
      .getByRole("button", {
        name: language === "en" ? "Save and check" : "Speichern und prüfen",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", {
        name: language === "en" ? "Save and check" : "Speichern und prüfen",
        exact: true,
      }),
    ).toBeDisabled();
    await expect
      .poll(() =>
        page.evaluate(
          ({ language, taskId }) => {
            const rows = Object.keys(localStorage)
              .filter((key) =>
                key.startsWith(`automaticity:v2:${language}:event:`),
              )
              .map((key) => JSON.parse(localStorage.getItem(key)));
            const attempt = rows.find(
              (row) => row.type === "attempt" && row.task.id === taskId,
            );
            return Boolean(
              attempt &&
              rows.some(
                (row) =>
                  row.type === "assessment" && row.attemptId === attempt.id,
              ),
            );
          },
          { language, taskId: replacement.id },
        ),
      )
      .toBe(true);
    const events = await page.evaluate(
      (language) =>
        Object.keys(localStorage)
          .filter((key) => key.startsWith(`automaticity:v2:${language}:event:`))
          .map((key) => JSON.parse(localStorage.getItem(key))),
      language,
    );
    const attempt = events.find(
      (row) => row.type === "attempt" && row.task.id === replacement.id,
    );
    assert(attempt);
    assert.equal(attempt.response.text, response);
    assert(
      events
        .filter(
          (row) => row.type === "assessment" && row.attemptId === attempt.id,
        )
        .every((row) => row.evaluator.scopeApproved === false),
    );
    assert.deepEqual(await originalStored(), {
      draft: sessionBytes,
      attempt: eventBytes,
    });
    const retiredIds = new Set(unit.retiredTasks.map((row) => row.taskId));
    for (let step = 0; step < 8; step++) {
      await page
        .getByRole("button", {
          name: language === "en" ? "Next task" : "Nächste Aufgabe",
          exact: true,
        })
        .click();
      await expect(page.locator(".task-prompt")).toBeVisible();
      assert(!retiredIds.has(new URL(page.url()).searchParams.get("task")));
    }
    await page.goto(`${base}/practice?task=${encodeURIComponent(task.id)}`);
    await expect(archived).toHaveValue(savedText);
    assert.deepEqual(await originalStored(), {
      draft: sessionBytes,
      attempt: eventBytes,
    });
    assert.deepEqual(errors, []);
    const spoken = unit.tasks.find(
      (candidate) =>
        candidate.modality === "speaking" && retiredIds.has(candidate.id),
    );
    assert(spoken, "Fixture requires an archived speaking task");
    await page.addScriptTag({
      url: base + "/learning-core/automaticity-v2.js",
    });
    const audioHash = await page.evaluate(
      async ({ language, spoken, sessionKey, session }) => {
        const wav = new ArrayBuffer(16044),
          view = new DataView(wav);
        const text = (at, value) =>
          [...value].forEach((char, index) =>
            view.setUint8(at + index, char.charCodeAt(0)),
          );
        text(0, "RIFF");
        view.setUint32(4, 16036, true);
        text(8, "WAVEfmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, 8000, true);
        view.setUint32(28, 16000, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        text(36, "data");
        view.setUint32(40, 16000, true);
        for (let index = 0; index < 8000; index++)
          view.setInt16(
            44 + index * 2,
            Math.sin((index * 2 * Math.PI * 440) / 8000) * 2000,
            true,
          );
        const saved = await window.AutomaticityV2.storeRecording(indexedDB, {
          id: "archived-speaking-fixture",
          blob: new Blob([wav], { type: "audio/wav" }),
          durationMs: 1000,
          createdAt: session.startedAt,
          language,
          taskId: spoken.id,
        });
        localStorage.setItem(
          `${sessionKey}:task:${encodeURIComponent(spoken.id)}`,
          JSON.stringify({
            ...session,
            taskId: spoken.id,
            taskVersion: spoken.version,
            draft: "Archived spoken transcript",
            audioId: saved.id,
          }),
        );
        return saved.sha256;
      },
      { language, spoken, sessionKey, session },
    );
    await page.goto(`${base}/practice?task=${encodeURIComponent(spoken.id)}`);
    await expect(archived).toHaveValue("Archived spoken transcript");
    const audio = page.locator("audio");
    await expect(audio).toHaveCount(1);
    await expect
      .poll(() => audio.evaluate((player) => player.duration))
      .toBe(1);
    const archivedAudioHash = await audio.evaluate(async (player) => {
      const bytes = await (await fetch(player.src)).arrayBuffer();
      return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
    });
    assert.equal(archivedAudioHash, audioHash);
    await page
      .getByRole("button", {
        name:
          language === "en" ? "Open replacement exercise" : "Neue Übung öffnen",
        exact: true,
      })
      .click();
    await expect(archived).toHaveCount(0);
    assert.deepEqual(await originalStored(), {
      draft: sessionBytes,
      attempt: eventBytes,
    });
    assert.deepEqual(errors, []);
    report.cases.push(
      `${language}: archived link is read-only; original draft/attempt bytes preserved; replacement draft reload and save work; next-task selection excludes retirement; archived speaking audio loads with its original hash`,
    );
    await context.close();
  }
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  throw error;
} finally {
  await browser.close();
  await writeFile(
    resolve(folder, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      status: report.status,
      folder,
      cases: report.cases.length,
    }),
  );
}
