import { expect, test, type Page } from "@playwright/test";

const TRANSCRIPT =
  "Technology has improved my learning because I have used it to practise every day. I have also joined online lessons, but I still value classroom discussion and personal feedback.";

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
          82, 73, 70, 70, 36, 0, 0, 0, 87, 65, 86, 69, 102, 109, 116, 32,
          16, 0, 0, 0, 1, 0, 1, 0, 64, 31, 0, 0, 128, 62, 0, 0, 2, 0, 16,
          0, 100, 97, 116, 97, 0, 0, 0, 0,
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

      addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
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

test("B1 Studio persists audio evidence, exposes provider failure, and invalidates a re-record", async ({
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

  await page.goto(
    "/studio?from=daily&level=B1&topic=Technology%20and%20learning",
  );
  await expect(
    page.getByRole("heading", { name: "Technology and learning" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Record", exact: true }).click();
  await page.getByRole("button", { name: /Stop/ }).click();
  await page.getByLabel("Your transcript").fill(TRANSCRIPT);
  await page.getByRole("button", { name: "Evaluate my answer" }).click();
  await expect(page.getByText(/LanguageTool is unavailable/)).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("automaticity:learning-evidence:v1"),
    ),
  ).toBeNull();

  providerAvailable = true;
  await page.getByRole("button", { name: "Evaluate my answer" }).click();
  await expect(page.getByRole("heading", { name: "Review your answer" })).toBeVisible();
  await page.locator(".steps button").filter({ hasText: "Replay" }).click();
  await expect(
    page.getByRole("heading", { name: "Listen to your real recording" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Review →", exact: true }).click();
  await page.getByRole("button", { name: "Corrections →", exact: true }).click();
  await expect(page.getByText("LanguageTool detected no text errors.")).toBeVisible();
  await page.getByRole("button", { name: "Improve →", exact: true }).click();
  await expect(page.getByText("Honest limit")).toBeVisible();
  await page.locator(".steps button").filter({ hasText: "Save" }).click();
  await page.getByRole("button", { name: "✓ Save session", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Session saved on this device.");

  const saved = await page.evaluate(async () => {
    const ledger = JSON.parse(
      localStorage.getItem("automaticity:learning-evidence:v1") ?? "{}",
    ) as {
      contentUnits: Array<{ cefrLevel?: string; version: string }>;
      responses: Array<{
        id: string;
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
  expect(saved.version).toBe("27.3.13-b1-runtime");
  expect(saved.response).toMatchObject({
    mode: "speaking",
    audio: { captured: true, persisted: true },
  });
  expect(saved.evidence).toMatchObject({
    verification: { status: "verified" },
    automaticityClaim: "insufficient-longitudinal-evidence",
  });
  expect(saved.audioSize).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Review my mistakes" }).click();
  await page.locator(".steps button").filter({ hasText: "Answer" }).click();
  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const ledger = JSON.parse(
          localStorage.getItem("automaticity:learning-evidence:v1") ?? "{}",
        ) as { events?: Array<{ type?: string; payload?: { evidenceId?: string } }> };
        return ledger.events?.find(
          (event) => event.type === "learning.evidence.invalidated.v1",
        )?.payload?.evidenceId;
      }),
    )
    .toBe(saved.evidence?.id);
  await page.getByRole("button", { name: /Stop/ }).click();

  const keyboardStep = page
    .locator(".steps button")
    .filter({ hasText: "Listen" });
  await keyboardStep.focus();
  await expect(keyboardStep).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Listen to the task" }),
  ).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    ),
  ).toBe(false);
});
