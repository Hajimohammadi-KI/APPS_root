import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

const WRITING =
  "Gestern ging ich früh zur Arbeit. Dort traf ich meine Kollegin. Wir besprachen ein neues Projekt. Danach schrieb ich den Bericht. Am Abend fuhr ich zufrieden nach Hause.";
const TRANSCRIPT =
  "Digitale Werkzeuge helfen mir beim Lernen, weil ich regelmäßig üben kann. Trotzdem brauche ich Gespräche im Kurs, denn persönliche Rückmeldungen zeigen mir Fehler und helfen mir beim selbstständigen Sprechen.";

async function installSyntheticAudioCapture(page: Page) {
  await page.addInitScript(() => {
    const track = { stop() {} };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () =>
          ({ getTracks: () => [track] }) as unknown as MediaStream,
      },
    });

    class SyntheticMediaRecorder {
      state: RecordingState = "inactive";
      readonly mimeType = "audio/wav";
      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onstop: ((event: Event) => void) | null = null;
      private readonly stopListeners: EventListener[] = [];

      start() {
        this.state = "recording";
      }

      stop() {
        this.state = "inactive";
        const wavHeader = new Uint8Array([
          82, 73, 70, 70, 36, 0, 0, 0, 87, 65, 86, 69, 102, 109, 116, 32, 16, 0,
          0, 0, 1, 0, 1, 0, 64, 31, 0, 0, 128, 62, 0, 0, 2, 0, 16, 0, 100, 97,
          116, 97, 0, 0, 0, 0,
        ]);
        this.ondataavailable?.({
          data: new Blob([wavHeader], { type: this.mimeType }),
        } as BlobEvent);
        const event = new Event("stop");
        this.onstop?.(event);
        for (const listener of this.stopListeners) listener(event);
      }

      pause() {
        this.state = "paused";
      }

      resume() {
        this.state = "recording";
      }

      addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
      ) {
        if (type !== "stop") return;
        this.stopListeners.push(
          typeof listener === "function"
            ? listener
            : (event) => listener.handleEvent(event),
        );
      }
    }

    Object.defineProperty(window, "MediaRecorder", {
      configurable: true,
      value: SyntheticMediaRecorder,
    });
  });
}

test("B1 writing reaches the versioned local evidence ledger", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "GrammarAutomaticityV11_de",
      JSON.stringify({
        learningLevel: "B1",
        todayGrammar: {
          date: new Date().toISOString().slice(0, 10),
          level: "B1",
          title: "Präteritum in Erzählungen",
        },
        reviews: [
          {
            id: "b1-delayed-transfer",
            due: 0,
            stage: 2,
            topic: "Präteritum in Erzählungen",
            original: "Übertrage das Präteritum in eine neue kurze Erzählung.",
            corrected: "Am Morgen öffnete ich das Fenster und sah die Sonne.",
            sourceType: "grammar_topic",
            sourceId: "Präteritum in Erzählungen",
            successStreak: 1,
            stabilityScore: 30,
            reviewMode: "mixed",
          },
        ],
      }),
    );
  });
  await page.goto("/automatik");
  await page
    .getByRole("button", { name: /2\. Automatisieren & schreiben/ })
    .click();
  await page.getByLabel("Präteritum in Erzählungen-Tagebuch").fill(WRITING);
  await page
    .getByRole("button", { name: "Schreiben analysieren und speichern" })
    .click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const ledger = JSON.parse(
          localStorage.getItem("automaticity:learning-evidence:v1") ?? "{}",
        ) as {
          contentUnits?: Array<{ cefrLevel?: string; version?: string }>;
          responses?: Array<{ mode?: string; inputText?: string }>;
          evidence?: Array<{ automaticityClaim?: string }>;
        };
        return {
          level: ledger.contentUnits?.at(-1)?.cefrLevel,
          version: ledger.contentUnits?.at(-1)?.version,
          mode: ledger.responses?.at(-1)?.mode,
          text: ledger.responses?.at(-1)?.inputText,
          claim: ledger.evidence?.at(-1)?.automaticityClaim,
        };
      }),
    )
    .toEqual({
      level: "B1",
      version: "20.8.23-b1-runtime",
      mode: "writing",
      text: WRITING,
      claim: "insufficient-longitudinal-evidence",
    });

  await page.goto("/wiederholungen");
  await page
    .getByLabel("Richtige Fassung")
    .fill("Am Morgen öffnete ich das Fenster und sah die Sonne.");
  await page.getByRole("button", { name: "Antwort prüfen" }).click();
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

  await page.goto("/einstellungen");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Lerndaten exportieren" }).click();
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
    "20.8.23-b1-runtime",
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

test("B1 Gesprächsstudio persists audio evidence, reports provider failure, and invalidates a re-record", async ({
  page,
}) => {
  await installSyntheticAudioCapture(page);
  let providerAvailable = false;
  await page.route("**/api/conversation/evaluate", async (route) => {
    if (!providerAvailable) {
      await route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({ error: "LanguageTool unavailable in test" }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        original: TRANSCRIPT,
        corrected: TRANSCRIPT,
        provider: "LanguageTool",
        checkedAt: "2026-08-21T21:00:00.000Z",
        issues: [],
      }),
    });
  });

  await page.goto("/studio?from=daily&level=B1");
  await expect(page.locator(".coach-topic span")).toContainText("B1");
  await page.getByRole("button", { name: "Record", exact: true }).click();
  await page.getByRole("button", { name: /Stop/ }).click();
  await page.getByLabel("Dein Transkript").fill(TRANSCRIPT);
  await page.getByRole("button", { name: /Antwort auswerten/ }).click();
  await expect(
    page.getByText(/LanguageTool ist nicht erreichbar/),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("automaticity:learning-evidence:v1"),
    ),
  ).toBeNull();

  providerAvailable = true;
  await page.getByRole("button", { name: /Antwort auswerten/ }).click();
  await expect(
    page.getByRole("heading", { name: "Prüfe deine Antwort" }),
  ).toBeVisible();
  await page.locator(".steps button").filter({ hasText: "Replay" }).click();
  await expect(
    page.getByRole("heading", { name: "Höre deine echte Aufnahme" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Review →", exact: true }).click();
  await page
    .getByRole("button", { name: "Corrections →", exact: true })
    .click();
  await expect(
    page.getByText("LanguageTool hat keine Textfehler erkannt."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Improve →", exact: true }).click();
  await expect(page.getByText("Ehrliche Grenze")).toBeVisible();
  await page.locator(".steps button").filter({ hasText: "Speichern" }).click();
  await page
    .getByRole("button", { name: "✓ Save session", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "Sitzung wurde auf diesem Gerät gespeichert.",
  );

  const saved = await page.evaluate(async () => {
    const ledger = JSON.parse(
      localStorage.getItem("automaticity:learning-evidence:v1") ?? "{}",
    ) as {
      contentUnits: Array<{ cefrLevel?: string; version: string }>;
      responses: Array<{
        mode: string;
        audio: { captured: boolean; persisted: boolean; referenceId?: string };
      }>;
      evidence: Array<{
        id: string;
        verification: { status: string };
        automaticityClaim: string;
      }>;
    };
    const audioSize = await new Promise<number>((resolve, reject) => {
      const request = indexedDB.open("conversation-studio", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("sessions", "readonly");
        const all = transaction.objectStore("sessions").getAll();
        all.onerror = () => reject(all.error);
        all.onsuccess = () => {
          const rows = all.result as Array<{ audio?: Blob }>;
          resolve(rows.at(-1)?.audio?.size ?? 0);
          database.close();
        };
      };
    });
    return {
      level: ledger.contentUnits.at(-1)?.cefrLevel,
      version: ledger.contentUnits.at(-1)?.version,
      response: ledger.responses.at(-1),
      evidence: ledger.evidence.at(-1),
      audioSize,
    };
  });
  expect(saved.level).toBe("B1");
  expect(saved.version).toBe("20.8.23-b1-runtime");
  expect(saved.response).toMatchObject({
    mode: "speaking",
    audio: { captured: true, persisted: true },
  });
  expect(saved.evidence).toMatchObject({
    verification: { status: "verified" },
    automaticityClaim: "insufficient-longitudinal-evidence",
  });
  expect(saved.audioSize).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Meine Fehler ansehen" }).click();
  await page.locator(".steps button").filter({ hasText: "Antwort" }).click();
  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const ledger = JSON.parse(
          localStorage.getItem("automaticity:learning-evidence:v1") ?? "{}",
        ) as {
          events?: Array<{ type?: string; payload?: { evidenceId?: string } }>;
        };
        return ledger.events?.find(
          (event) => event.type === "learning.evidence.invalidated.v1",
        )?.payload?.evidenceId;
      }),
    )
    .toBe(saved.evidence?.id);
  await page.getByRole("button", { name: /Stop/ }).click();

  const keyboardStep = page
    .locator(".steps button")
    .filter({ hasText: "Hören" });
  await keyboardStep.focus();
  await expect(keyboardStep).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Höre die Aufgabe" }),
  ).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    ),
  ).toBe(false);
});
