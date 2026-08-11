import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function openNavigationLink(page: Page, label: string, group: string) {
  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
  });
  const trigger = navigation.getByRole("button", {
    name: new RegExp(`^${group}`),
  });
  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    await trigger.click();
  }
  await navigation.getByRole("link", { name: label, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("english-e2e-initialized")) {
      window.localStorage.clear();
      window.indexedDB.deleteDatabase("grammar-automaticity-audio");
      window.sessionStorage.setItem("english-e2e-initialized", "true");
    }
  });
  await page.goto("/");
});

test("loads the focused dashboard and complete product navigation", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Use English confidently and automatically",
    }),
  ).toBeAttached();
  const heroProof = page.locator(".dashboard-hero-proof");
  await expect(
    heroProof.getByText("112 grammar units", { exact: true }),
  ).toBeVisible();
  await expect(
    heroProof.getByText("72 conversation topics", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Product navigation" }),
  ).toBeVisible();
  const productNavigation = page.getByRole("navigation", {
    name: "Product navigation",
  });
  await expect(
    productNavigation.getByRole("link", {
      name: "Today’s Practice",
      exact: true,
    }),
  ).toHaveCount(1);
  await expect(
    productNavigation.getByRole("link", { name: "Daily Training", exact: true }),
  ).toHaveCount(0);
  await expect(
    productNavigation.getByRole("link", {
      name: "Automaticity Mission",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Start confidently in three steps" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open help" }).click();
  const help = page.getByRole("dialog", {
    name: "How to use English Automaticity",
  });
  await expect(help).toBeVisible();
  await expect(
    help.getByText(/progress is automatically saved on this device/i),
  ).toBeVisible();
  await help.getByRole("button", { name: "Close help" }).click();

  await page.screenshot({
    fullPage: true,
    path: "test-results/dashboard-desktop.png",
  });
});

test("selects a level and turns it into today's exact next action", async ({
  page,
}) => {
  let practiceCard = page.locator(".dashboard-hero-action");

  await expect(
    practiceCard.getByRole("heading", {
      name: "Build your first daily practice",
    }),
  ).toBeVisible();
  await practiceCard.getByLabel("Your English level").selectOption("B1");
  await expect(practiceCard.getByText("B1", { exact: true })).toBeVisible();
  await expect(
    practiceCard.getByRole("button", { name: /start 15-minute practice/i }),
  ).toBeVisible();

  await page.reload();
  practiceCard = page.locator(".dashboard-hero-action");
  await expect(practiceCard.getByText("B1", { exact: true })).toBeVisible();
  await practiceCard
    .getByRole("button", { name: /start 15-minute practice/i })
    .click();

  await expect(page).toHaveURL(/screen=daily/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Today’s Practice" }),
  ).toBeVisible();
});

test("opens every legacy product surface", async ({ page }) => {
  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
  });
  const surfaces = [
    ["Conversation Studio", "Daily Practice", "Conversation Studio"],
    ["Today’s Practice", "Daily Practice", "Today’s Practice"],
    ["Grammar Lab", "Learning Paths", "Grammar Lab"],
    ["Learning Resources", "Learning Paths", "Online Learning Resources"],
    ["Error Workshop", "Learning Evidence", "Error Workshop"],
    ["Audio Library", "Learning Evidence", "Audio Library"],
    ["Settings", "App and Settings", "Settings"],
    ["Home", "Daily Practice", "Use English confidently and automatically"],
  ] as const;

  for (const [button, group, heading] of surfaces) {
    await openNavigationLink(page, button, group);
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeAttached();
  }
});

test("preserves catalog counts and supports grammar practice", async ({
  page,
}) => {
  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
  });

  await openNavigationLink(page, "Conversation Studio", "Daily Practice");
  await expect(page.getByText("72 topics", { exact: true })).toBeVisible();

  await openNavigationLink(page, "Grammar Lab", "Learning Paths");
  await expect(page.getByText("112 units", { exact: true })).toBeVisible();
  await page.getByLabel("Search grammar").fill("Word order in phrasal verbs");
  await expect(page.getByText("1 of 112 units", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: /Word order in phrasal verbs/ })
    .click();
  await expect(page).toHaveURL(
    /screen=grammar.*topic=Word(?:\+|%20)order(?:\+|%20)in(?:\+|%20)phrasal(?:\+|%20)verbs#grammar-topic$/,
  );
  await expect(page.locator("#grammar-topic")).toBeInViewport();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Word order in phrasal verbs",
    }),
  ).toBeVisible();
  await expect(page.getByText("1/9", { exact: true })).toBeVisible();

  const answer = page.getByPlaceholder("Enter English answer");
  await answer.fill("Turn it down.");
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByText("Correct. Say the full answer out loud, then continue."),
  ).toBeVisible();

  await openNavigationLink(page, "Learning Resources", "Learning Paths");
  await expect(
    page.getByText("43 direct resources", { exact: true }),
  ).toBeVisible();

  await expect(navigation.locator('a[href*="screen=thesis"]')).toHaveCount(0);
});

test("is usable through the compact mobile navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
  });

  await expect(
    page.getByRole("heading", { name: "From recall to confident speaking" }),
  ).toBeVisible();
  await expect(page.locator(".progress-story-card")).toHaveCount(3);
  await expect(
    page
      .locator(".dashboard-hero-image")
      .evaluate(
        (image) =>
          image instanceof HTMLImageElement &&
          image.complete &&
          image.naturalWidth > 0,
      ),
  ).resolves.toBe(true);
  await page.screenshot({
    fullPage: true,
    path: "test-results/dashboard-mobile.png",
  });

  await expect(navigation).not.toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(navigation).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    path: "test-results/accordion-mobile.png",
  });
  await navigation.getByRole("link", { name: "Today’s Practice" }).click();
  await expect(
    page.getByRole("heading", { name: "Today’s Practice" }),
  ).toBeVisible();
  await expect(navigation).not.toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: "test-results/daily-mobile.png",
  });
});

test("provides accordion navigation and cross-platform installation", async ({
  page,
  request,
}) => {
  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
  });
  const practiceGroup = navigation.getByRole("button", {
    name: /^Daily Practice/,
  });

  await expect(practiceGroup).toHaveAttribute("aria-expanded", "true");
  await practiceGroup.press("Enter");
  await expect(practiceGroup).toHaveAttribute("aria-expanded", "false");
  await expect(
    navigation.getByRole("link", { name: "Home", exact: true }),
  ).not.toBeAttached();
  await practiceGroup.press("Enter");
  await expect(
    navigation.getByRole("link", { name: "Home", exact: true }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Open installation guide" })
    .press("Enter");
  const guide = page.getByRole("dialog", {
    name: "Install English Automaticity",
  });
  await expect(guide).toBeVisible();
  await expect(
    guide.getByText(
      "Slack, Vercel, paid software, and extra developer tools are not required.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(guide.locator('a[href*="slack.com"]')).toHaveCount(0);
  await expect(
    guide.getByRole("heading", {
      name: "1. Choose backup folder",
    }),
  ).toBeVisible();
  await expect(
    guide.getByText(
      "The operating system chooses the protected install location.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    guide.getByRole("heading", {
      name: "2. Install on this device",
    }),
  ).toBeVisible();
  await expect(guide.getByRole("heading", { name: "Windows" })).toBeVisible();
  await expect(guide.getByRole("heading", { name: "Android" })).toBeVisible();
  await expect(
    guide.getByRole("heading", { name: "iPhone / iPad" }),
  ).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    path: "test-results/install-guide-desktop.png",
  });
  await guide.getByRole("button", { name: "Close installation guide" }).click();
  await expect(guide).not.toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Install English Automaticity" })
    .press("Enter");
  await expect(guide).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    path: "test-results/install-guide-mobile.png",
  });
  await guide.getByRole("button", { name: "Close installation guide" }).click();

  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    display: "standalone",
    id: "/",
    scope: "/",
    start_url: "/",
  });
  expect(manifest.icons).toHaveLength(4);
  expect(
    manifest.icons.map((icon: { purpose: string }) => icon.purpose),
  ).toEqual(expect.arrayContaining(["any", "maskable"]));
  expect(manifest.shortcuts).toHaveLength(3);

  const serviceWorkerResponse = await request.get("/sw.js");
  expect(serviceWorkerResponse.ok()).toBeTruthy();
  const serviceWorker = await serviceWorkerResponse.text();
  expect(serviceWorker).toContain(
    "grammar-automaticity-v27-unified-daily-practice-v2",
  );
  expect(serviceWorker).toContain('"/?screen=daily"');
  expect(serviceWorker).toContain("SKIP_WAITING");
});

test("writes progress backups to the folder selected during setup", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        const storage = navigator.storage as StorageManager & {
          getDirectory: () => Promise<{
            getDirectoryHandle: (
              name: string,
              options: { create: boolean },
            ) => Promise<FileSystemDirectoryHandle>;
          }>;
        };
        const root = await storage.getDirectory();
        return root.getDirectoryHandle("Grammar Backups", { create: true });
      },
    });
  });
  await page.reload();

  await page
    .getByRole("button", { name: "Install English Automaticity" })
    .click();
  const guide = page.getByRole("dialog", {
    name: "Install English Automaticity",
  });
  await guide.getByRole("button", { name: "Choose folder" }).click();
  await expect(
    guide.getByText("Grammar Backups", { exact: true }),
  ).toBeVisible();
  await guide.getByRole("button", { name: "Close installation guide" }).click();

  await page.goto("/?screen=settings");
  await page.getByRole("button", { name: "Export data" }).click();
  await expect(
    page.getByText('Backup saved to "Grammar Backups".', {
      exact: true,
    }),
  ).toBeVisible();

  const backup = await page.evaluate(async () => {
    const storage = navigator.storage as StorageManager & {
      getDirectory: () => Promise<FileSystemDirectoryHandle>;
    };
    const root = await storage.getDirectory();
    const directory = await root.getDirectoryHandle("Grammar Backups");
    const handle = await directory.getFileHandle(
      "grammar-automaticity-v27-backup.json",
    );
    return JSON.parse(await (await handle.getFile()).text()) as {
      version?: number;
    };
  });
  expect(backup.version).toBe(27);
});

test("deep-links every screen and preserves browser navigation", async ({
  page,
}) => {
  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
  });

  await openNavigationLink(page, "Grammar Lab", "Learning Paths");
  await expect(page).toHaveURL(/\?screen=grammar$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { level: 1, name: "Grammar Lab" }),
  ).toBeVisible();

  await openNavigationLink(page, "Settings", "App and Settings");
  await expect(page).toHaveURL(/\?screen=settings$/);
  await page.goBack();
  await expect(
    page.getByRole("heading", { level: 1, name: "Grammar Lab" }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", { level: 1, name: "Settings" }),
  ).toBeVisible();
});

test("retires the private route and removes its old local data", async ({
  page,
}) => {
  await page.evaluate(() => {
    const current = JSON.parse(
      localStorage.getItem("grammar-automaticity:v27") ?? "{}",
    );
    localStorage.setItem(
      "grammar-automaticity:v27",
      JSON.stringify({
        ...current,
        thesis: { selected: "private-unit", units: { "private-unit": {} } },
      }),
    );
    localStorage.setItem("thesis-b2-sprint-v24", '{"selected":"private-unit"}');
  });

  await page.goto("/?screen=thesis");
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Use English confidently and automatically",
    }),
  ).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const current = JSON.parse(
          localStorage.getItem("grammar-automaticity:v27") ?? "{}",
        );
        return {
          retired: localStorage.getItem("thesis-b2-sprint-v24"),
          hasPrivateState: Object.hasOwn(current, "thesis"),
        };
      }),
    )
    .toEqual({ retired: null, hasPrivateState: false });
});

test("runs saved assessment, error repair, and daily gates", async ({
  page,
}) => {
  await page.route("**/api/assessment", async (route) => {
    const request = route.request();
    const payload = request.postDataJSON() as { text: string };
    const original = payload.text;
    const errorOffset = original.indexOf("don't");
    const hasError = errorOffset >= 0;
    const corrected = hasError
      ? original.replace("don't", "doesn't")
      : original;
    await route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      json: {
        changed: hasError,
        corrected,
        matches: hasError
          ? [
              {
                context: {
                  length: 5,
                  offset: errorOffset,
                  text: original,
                },
                length: 5,
                message: "Use third-person singular agreement.",
                offset: errorOffset,
                replacements: [{ value: "doesn't" }],
                rule: {
                  category: { name: "Grammar" },
                  id: "HE_VERB_AGR",
                },
              },
            ]
          : [],
        online: true,
        original,
      },
    });
  });

  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
  });
  await openNavigationLink(page, "Settings", "App and Settings");
  await page.getByLabel(/Allow optional online AI/).check();
  await openNavigationLink(page, "Conversation Studio", "Daily Practice");
  await page.getByRole("button", { name: "Start session" }).click();
  const answer = page.getByLabel("Conversation answer");
  await answer.fill(
    "I am a student. I am ready today. I am interested in research. I am tired after work. Are you a student?",
  );
  await page.getByRole("button", { name: "Evaluate answer" }).click();
  await expect(
    page.getByText(
      "Answer evaluated and saved. Continue with the follow-up prompt.",
    ),
  ).toBeVisible();

  await answer.fill(
    "She don't work here. I am a student. I am ready today. I feel tired after work. Are you ready?",
  );
  await page.getByRole("button", { name: "Evaluate answer" }).click();
  await expect(
    page.getByText(
      "Not passed yet. Improve the exact errors and evaluate again.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save to error workshop" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Error Workshop" }),
  ).toBeVisible();
  await expect(
    page.getByText("Use third-person singular agreement.").first(),
  ).toBeVisible();

  await page
    .getByPlaceholder(
      "Write a new English sentence with the corrected structure in a different context.",
    )
    .fill("She does not work there because the office closes early.");
  await page.getByLabel("I repeated the corrected form out loud.").check();
  await page.getByLabel("This is a new context, not a copy.").check();
  await page.getByRole("button", { name: "Evaluate repair" }).click();
  await expect(page.getByText("No errors in this view")).toBeVisible();

  await openNavigationLink(page, "Today’s Practice", "Daily Practice");
  await page
    .getByRole("button", { name: /Start today’s practice|Continue where you stopped/ })
    .click();
  await expect(page.locator(".daily-step").first()).toBeVisible();
  const recallAnswers = page.getByPlaceholder("Write your sentence here.");
  const examples = [
    "In today's situation, my normal activity with a friend is a long conversation.",
    "In this work situation, my real project this week is difficult.",
    "In this social situation, my simple personal detail is my job.",
    "In today's situation, my age is thirty when I talk with a friend.",
    "In this work situation, my nationality is Iranian.",
    "In this social situation, the date is Friday.",
    "In this evening situation, I am free if my planned work is finished.",
  ];
  for (let index = 0; index < examples.length; index += 1) {
    const answerField = recallAnswers.nth(index);
    await answerField.fill(examples[index] ?? "");
    await answerField
      .locator("..")
      .getByRole("button", { name: "Evaluate sentence" })
      .click({ force: true });
    await expect(
      page.getByRole("heading", { name: "✓ Answer verified" }),
    ).toHaveCount(index + 1);
  }
  await expect(page.getByText("2/3 completed", { exact: true })).toBeVisible();

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("grammar-automaticity:v27") ?? "{}"),
  );
  expect(stored.sessions).toHaveLength(1);
  expect(stored.dailyPlans).toBeTruthy();
  expect(stored.errors[0].repairStatus).toBe("fixed");
});

test("connects to the Nest assessment API", async ({ request }) => {
  const apiUrl = process.env.E2E_API_URL ?? "http://localhost:4201";
  const health = await request.get(`${apiUrl}/api/health`);
  expect(health.ok()).toBeTruthy();
  await expect(health.json()).resolves.toMatchObject({
    service: "grammar-automaticity-api",
    status: "ok",
  });

  const assessment = await request.post(`${apiUrl}/api/assessment`, {
    data: {
      language: "en-US",
      text: "She don't work here.",
    },
  });
  expect(assessment.ok()).toBeTruthy();
  await expect(assessment.json()).resolves.toMatchObject({
    corrected: "She doesn't work here.",
    online: true,
  });
});

test("records a speaking answer and creates a playable local recording", async ({
  page,
}) => {
  await page.addInitScript(() => {
    class TestUtterance {
      lang = "";
      onboundary: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onstart: (() => void) | null = null;
      rate = 1;
      constructor(public text: string) {}
    }
    class TestMediaRecorder {
      mimeType = "audio/webm";
      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onstop: (() => void) | null = null;
      state: RecordingState = "inactive";
      private stopListeners: Array<() => void> = [];

      addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
      ) {
        if (type !== "stop") return;
        this.stopListeners.push(() => {
          if (typeof listener === "function") listener(new Event("stop"));
          else listener.handleEvent(new Event("stop"));
        });
      }

      pause() {
        this.state = "paused";
      }

      resume() {
        this.state = "recording";
      }

      start() {
        this.state = "recording";
      }

      stop() {
        this.state = "inactive";
        this.ondataavailable?.({
          data: new Blob(["recorded English answer"], { type: this.mimeType }),
        } as BlobEvent);
        this.onstop?.();
        this.stopListeners.forEach((listener) => listener());
      }
    }

    Object.defineProperty(window, "MediaRecorder", {
      configurable: true,
      value: TestMediaRecorder,
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop: () => undefined }],
        }),
      },
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: TestUtterance,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        cancel: () => undefined,
        speak: (utterance: TestUtterance) => utterance.onstart?.(),
      },
    });
  });
  await page.goto("/?screen=studio");

  await expect(
    page.getByText("Controlled source", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Topics are not downloaded live/)).toBeVisible();
  await page
    .getByRole("button", { name: "Microphone and speaker check" })
    .click();
  await page.getByRole("button", { name: "Play speaker test" }).click();
  await expect(
    page.getByText("Test sound played", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Check microphone access" }).click();
  await expect(
    page.getByText("Microphone allowed", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Start session" }).click();
  await expect(page.locator(".talking-coach")).toHaveAttribute(
    "data-speaking",
    "true",
  );
  await expect(
    page.getByText("Speaking to you", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Record answer" }).click();
  await expect(page.getByLabel("Learning path")).toBeDisabled();
  await expect(
    page.getByText("Listening to you", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stop recording" }).click();
  await expect(page.getByLabel("Learning path")).toBeEnabled();

  await expect(page.locator("audio")).toBeVisible();
  await page.locator("audio").dispatchEvent("play");
  await expect(
    page.getByText("Replay your voice", { exact: true }).locator(".."),
  ).toHaveAttribute("aria-current", "step");
  await expect(
    page.getByText(
      "Recording stopped. Evaluate your answer once it is complete.",
      { exact: true },
    ),
  ).toBeVisible();

  await page
    .getByLabel("Conversation answer")
    .fill("This text belongs only to the first attempt.");
  await page.getByRole("button", { name: "Record improved answer" }).click();
  await expect(page.getByLabel("Conversation answer")).toHaveValue("");
  await expect(
    page
      .getByText("Record an improved attempt", { exact: true })
      .locator(".."),
  ).toHaveAttribute("aria-current", "step");
  await page.getByRole("button", { name: "Stop recording" }).click();
});
