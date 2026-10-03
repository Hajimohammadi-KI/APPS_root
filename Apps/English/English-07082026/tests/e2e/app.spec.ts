import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function openNavigationLink(page: Page, label: string, group: string) {
  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
  });
  // The group's visible section label (e.g. "Daily Practice") is a plain
  // paragraph; the expandable trigger button underneath it carries its own
  // caption text (e.g. "Practice and speak today"). Locate by section
  // structure instead of the trigger's caption so this stays correct if the
  // caption copy changes.
  const section = navigation.locator("section", { hasText: group }).first();
  const trigger = section.getByRole("button").first();
  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    await trigger.click();
  }
  await navigation.getByRole("link", { name: label, exact: true }).click();
}

async function expectDailyCardsToContainLongLabels(page: Page) {
  // Stress the production card structure with realistic translated copy; this
  // catches clipped states and actions that ordinary short fixtures miss.
  await page.locator(".activity").evaluateAll((cards) => {
    cards.forEach((card) => {
      const title = card.querySelector(".act-head b");
      const status = card.querySelector(".tag");
      const action = card.querySelector(".open");
      if (title) title.textContent = "Review, correct and save your complete learning evidence";
      if (status) status.textContent = "Not started — feedback required";
      if (action) action.textContent = "Open complete practice activity";
    });
  });
  const overflow = await page.locator(".activity").evaluateAll((cards) =>
    cards.flatMap((card, index) => {
      const cardBox = card.getBoundingClientRect();
      return Array.from(card.querySelectorAll(".act-head b, .tag, .minutes, .open")).flatMap((element) => {
        const box = element.getBoundingClientRect();
        const node = element as HTMLElement;
        return box.left < cardBox.left - 1 || box.right > cardBox.right + 1 || node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1
          ? [`card ${index + 1}: ${element.className || element.tagName}`]
          : [];
      });
    }),
  );
  expect(overflow).toEqual([]);
  const pageWidth = await page.locator("body").evaluate((body) => ({
    client: body.clientWidth,
    scroll: body.scrollWidth,
  }));
  expect(pageWidth.scroll).toBeLessThanOrEqual(pageWidth.client);
}

test.beforeEach(async ({ page }) => {
  // Start every test from a clean slate — but only once per test, not once
  // per navigation within a test: the sessionStorage flag stops later
  // in-test page.goto() calls from wiping state the test itself just set up.
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("english-e2e-initialized")) {
      window.localStorage.clear();
      window.indexedDB.deleteDatabase("grammar-automaticity-audio");
      window.sessionStorage.setItem("english-e2e-initialized", "true");
    }
  });
  await page.goto("/");
});

// Confirms the live dashboard (DashboardV2Screen) renders correctly and
// that the product nav lists only current route names — not the retired
// "Daily Training" / "Automaticity Mission" labels from the dead
// dashboard-screen.tsx this test used to (incorrectly) assert against.
test("loads the focused dashboard and complete product navigation", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { level: 1, name: "Good morning, Learner" }),
  ).toBeAttached();
  await expect(
    page.getByText("Personal learning dashboard", { exact: true }),
  ).toBeVisible();
  const courseList = page.locator(".home-v2-course-list");
  await expect(
    courseList.getByRole("button", { name: /Build Strong Grammar Skills/ }),
  ).toBeVisible();
  await expect(
    courseList.getByRole("button", {
      name: /Master Everyday Conversations/,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Product navigation" }),
  ).toBeVisible();
  await expect(page.getByText("Automated practice signals", { exact: true })).toBeVisible();
  await expect(page.getByText("Teacher-verified mastery", { exact: true })).toBeVisible();
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

test("progress views separate app signals from teacher verification", async ({ page }) => {
  await page.goto("/?screen=progress");
  await expect(page.getByRole("note").filter({ hasText: "Teacher-verified mastery:" })).toContainText("not recorded");
  await expect(page.getByText(/externally app-checked evidence/)).toBeVisible();
});

// Checks the dashboard presents one explained, state-driven continuation
// action and that a fresh learner resumes the saved daily-practice plan.
test("shows one explained next action and continues the learner's plan", async ({
  page,
}) => {
  await expect(
    page.getByText("Current level · A1", { exact: true }),
  ).toBeVisible();

  const continueButton = page.getByRole("button", {
    name: "Continue my plan",
  });
  await expect(continueButton).toHaveCount(1);
  await expect(continueButton).toBeVisible();
  await expect(
    page.getByText("3 practice steps remain in today’s saved plan."),
  ).toBeVisible();
  await continueButton.click();

  await expect(page).toHaveURL(/\/daily$/);
  await expect(
    page.getByRole("heading", { name: "Today's 15-minute learning mission" }),
  ).toBeVisible();
});

test("daily cards contain long labels at all roadmap widths", async ({ page }) => {
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/daily");
    await expect(page.locator(".activity")).toHaveCount(7);
    await expectDailyCardsToContainLongLabels(page);
  }
});

// Opens every in-app destination from its canonical route. The PDF reader is
// covered separately because it is a connected local service on port 4332.
test("opens every current product surface", async ({ page }) => {
  const surfaces = [
    ["/", "Good morning, Learner"],
    ["/daily", "Today's 15-minute learning mission"],
    ["/studio", "Speaking Studio"],
    ["/grammar", "Grammar Lab"],
    ["/?screen=resources", "Online Learning Resources"],
    ["/?screen=integrated-skills", "Integrated Skills Path"],
    ["/?screen=errors", "Error Workshop"],
    ["/?screen=progress", "Automaticity Mission"],
    ["/?screen=library", "Audio Library"],
    ["/flashcards", "Vocabulary & Flashcards"],
    ["/settings", "Settings"],
    ["/teacher", "Manage lessons and human audio"],
  ] as const;

  for (const [route, heading] of surfaces) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: heading })).toBeAttached();
  }
});

test("teacher review queue turns saved evidence into a next action", async ({ page }) => {
  await page.evaluate(() => {
    const state = JSON.parse(
      localStorage.getItem("grammar-automaticity:v27") || "{}",
    );
    state.learner = { ...(state.learner || {}), displayName: "Elahe" };
    state.errors = [{
      id: "error-teacher-test",
      grammarTitle: "Present perfect",
      topic: "Life experience",
      errorClass: "auxiliary",
      originalText: "I have went.",
      correctedText: "I have gone.",
      explanation: "Use the past participle.",
      occurrenceCount: 2,
      repairStatus: "new",
      nextRepairAt: 0,
      lastSeenAt: new Date().toISOString(),
    }];
    state.reviews = [];
    localStorage.setItem("grammar-automaticity:v27", JSON.stringify(state));
  });
  await page.goto("/teacher");

  await expect(page.getByRole("heading", { name: "Act on learner evidence" })).toBeVisible();
  await expect(page.getByText("1 to review", { exact: true })).toBeVisible();
  const queueItem = page.getByRole("listitem");
  await expect(queueItem.getByText("Elahe", { exact: true })).toBeVisible();
  await expect(queueItem.getByText("Correction record", { exact: true })).toBeVisible();
  await expect(queueItem.getByText(/automated signal/i)).toBeVisible();
  await expect(queueItem.getByText("I have went. → I have gone.", { exact: true })).toBeVisible();
  await expect(queueItem.getByRole("link", { name: "Open evidence and act" })).toHaveAttribute("href", "/?screen=errors");
});

test("teacher composes a reviewed local assignment with plain instructions", async ({ page }) => {
  await page.goto("/teacher");
  await page.getByLabel("CEFR level").first().selectOption("B1");
  await page.getByLabel("Skill").selectOption("speaking");
  await page.getByLabel("Topic").selectOption({ label: "Clarify a work deadline" });
  await expect(page.getByText("Could we check the original message?", { exact: false })).toBeVisible();
  await page.getByLabel("Plain-language learner instructions").fill(
    "Record four sentences. State the deadline, ask for confirmation, and check your verb forms before saving.",
  );
  const saveAssignment = page.getByRole("button", { name: "Save assignment for review" });
  await expect(saveAssignment).toBeDisabled();
  await page.getByLabel("I reviewed this original app content and the learner instructions.").check();
  await saveAssignment.click();

  await expect(page.getByText("Assignment saved locally as Ready for review.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Assignment · Clarify a work deadline" })).toBeVisible();
});

test("teacher reviews evidence and prepares one focused repair assignment within ten minutes", async ({ page }) => {
  const startedAt = Date.now();
  await page.evaluate(() => {
    const state = JSON.parse(
      localStorage.getItem("grammar-automaticity:v27") || "{}",
    );
    state.errors = [{
      id: "error-focused-workflow",
      grammarTitle: "Present perfect",
      topic: "Life experience",
      errorClass: "auxiliary",
      originalText: "I have went.",
      correctedText: "I have gone.",
      explanation: "Use the past participle.",
      occurrenceCount: 2,
      repairStatus: "new",
      nextRepairAt: 0,
      lastSeenAt: new Date().toISOString(),
    }];
    localStorage.setItem("grammar-automaticity:v27", JSON.stringify(state));
  });
  await page.goto("/teacher");
  await expect(page.getByText("I have went. → I have gone.", { exact: true })).toBeVisible();
  await page.getByLabel("CEFR level").first().selectOption("B1");
  await page.getByLabel("Skill").selectOption("speaking");
  await page.getByLabel("Topic").selectOption({ label: "Clarify a work deadline" });
  await page.getByLabel("Plain-language learner instructions").fill(
    "Repair the verb, then record four sentences about one completed experience.",
  );
  await page.getByLabel("I reviewed this original app content and the learner instructions.").check();
  await page.getByRole("button", { name: "Save assignment for review" }).click();
  await expect(page.getByText("Assignment saved locally as Ready for review.")).toBeVisible();

  // The automated journey enforces the product's ten-minute ceiling; a real
  // teacher observation remains a separate roadmap evidence requirement.
  expect(Date.now() - startedAt).toBeLessThan(10 * 60 * 1000);
});

// Guards the catalog's actual size (72 speaking topics, 112 authored grammar
// units with 672 controlled exercises, 43 resources), exercises search +
// deep-link + reload, and
// confirms the retired "thesis" screen has no surviving nav link.
test("preserves catalog counts and supports grammar practice", async ({
  page,
}) => {
  await openNavigationLink(page, "Conversation Studio", "Daily Practice");
  await expect(page.getByLabel("Topic").locator("option")).toHaveCount(72);

  await page.goto("/grammar");
  await expect(
    page.getByText("112 CEFR-aligned units · 672 tracked exercises"),
  ).toBeVisible();
  // Search narrows the list down to exactly one matching unit...
  await page.getByLabel("Search topics").fill("Verb be: am/is/are");
  await expect(page.locator(".topic:visible")).toHaveCount(1);
  await page.getByRole("button", { name: /Verb be: am\/is\/are/ }).click();
  // ...and opening it updates the URL to a deep link that identifies the
  // exact topic, so it can be reloaded or shared directly.
  await expect(page).toHaveURL(
    /\/grammar\?topic=Verb(?:\+|%20)be%3A(?:\+|%20)am%2Fis%2Fare#grammar-topic$/,
  );
  await expect(page.locator("#grammar-topic")).toBeInViewport();
  // A hard reload from that deep link must land back on the same unit —
  // not just an animated scroll within one page session.
  await page.reload();
  await expect(
    page.getByRole("heading", {
      level: 3,
      name: "Correct the sentence: I am agree.",
    }),
  ).toBeVisible();
  await expect(page.getByText("0/6", { exact: true }).first()).toBeVisible();

  // Answer the first practice item correctly and confirm real feedback.
  const answer = page.getByPlaceholder("Enter English answer");
  await answer.fill("I agree.");
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByText("Correct — well recalled."),
  ).toBeVisible();

  await page.goto("/?screen=resources");
  await expect(
    page.getByText("43 direct resources", { exact: true }),
  ).toBeVisible();

  // The old "thesis" screen was retired — its nav link must be gone, not
  // just hidden or broken.
  await page.goto("/");
  await expect(
    page
      .getByRole("navigation", { name: "Product navigation" })
      .locator('a[href*="screen=thesis"]'),
  ).toHaveCount(0);
});

// At a phone-sized viewport, the sidebar nav must start hidden and only
// appear via the explicit "Open navigation" toggle — otherwise it would
// eat most of a small screen permanently.
test("is usable through the compact mobile navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
  });

  await expect(
    page.getByRole("heading", { name: "Select a course" }),
  ).toBeVisible();
  await expect(
    page.locator(".home-v2-course-list .home-v2-course"),
  ).toHaveCount(3);
  await expect(page.locator(".home-v2-chart-wrap")).toBeVisible();
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
    page.getByRole("heading", { name: "Today's 15-minute learning mission" }),
  ).toBeVisible();
  await expect(navigation).not.toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: "test-results/daily-mobile.png",
  });
});

// Two unrelated things share one test purely because they both live in the
// sidebar chrome: (1) a nav section's expand/collapse toggle via keyboard,
// and (2) the "install this app" dialog plus the PWA manifest/service
// worker it depends on.
test("provides accordion navigation and cross-platform installation", async ({
  page,
  request,
}) => {
  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
  });
  const practiceGroup = navigation
    .locator("section", { hasText: "Daily Practice" })
    .first()
    .getByRole("button")
    .first();

  // Collapsing the group via Enter removes its links from the accessibility
  // tree entirely (not just visually hidden)...
  // Wait for the client store effect so Enter cannot land on pre-hydration
  // HTML before React has attached this button's keyboard handler.
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("grammar-automaticity:v27")),
    )
    .not.toBeNull();
  await expect(practiceGroup).toHaveAttribute("aria-expanded", "true");
  await practiceGroup.focus();
  await expect(practiceGroup).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(practiceGroup).toHaveAttribute("aria-expanded", "false");
  await expect(
    navigation.getByRole("link", { name: "Home", exact: true }),
  ).not.toBeAttached();
  // ...and pressing Enter again restores them.
  await practiceGroup.press("Enter");
  await expect(
    navigation.getByRole("link", { name: "Home", exact: true }),
  ).toBeVisible();

  // The install dialog must not mention infra the learner never sets up
  // themselves (Slack, Vercel) — it should read as consumer software.
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

  // Same dialog, reachable from a differently-labeled trigger at mobile
  // width — confirms both entry points open the same install flow.
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

  // Below: the actual PWA files a browser/OS needs to offer "install as
  // app" — the dialog above is just UI, this is what makes install real.
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    display: "standalone",
    id: "/",
    scope: "/",
    start_url: "/",
  });
  // One bundled SVG is intentionally declared twice: the browser still gets
  // distinct "any" and "maskable" roles without depending on missing PNGs.
  expect(manifest.icons).toHaveLength(2);
  expect(
    manifest.icons.every(
      (icon: { src: string; type: string }) =>
        icon.src === "/icons/automaticity.svg" && icon.type === "image/svg+xml",
    ),
  ).toBeTruthy();
  expect(
    manifest.icons.map((icon: { purpose: string }) => icon.purpose),
  ).toEqual(expect.arrayContaining(["any", "maskable"]));
  expect(manifest.shortcuts).toHaveLength(3);

  // The service worker's cache-version string changing is how a stale
  // installed copy knows to update — and these specific strings confirm it
  // actually serves the daily-practice route it's meant to.
  const serviceWorkerResponse = await request.get("/sw.js");
  expect(serviceWorkerResponse.ok()).toBeTruthy();
  const serviceWorker = await serviceWorkerResponse.text();
  expect(serviceWorker).toContain("english-automaticity-v29-local-icon-1");
  expect(serviceWorker).toContain('"/daily"');
  expect(serviceWorker).toContain("SKIP_WAITING");
});

// The real File System Access API needs a user gesture and a native folder
// picker Playwright can't drive directly, so this fakes
// `showDirectoryPicker` with one backed by the Origin Private File System
// (an in-browser virtual filesystem) — real enough to prove export actually
// writes bytes to the chosen folder.
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

  await page.goto("/settings");
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
      schemaVersion?: string;
      learnerState?: { version?: number };
    };
  });
  expect(backup.schemaVersion).toBe("1.0.0");
  expect(backup.learnerState?.version).toBe(27);
});

test("explains local backups and restores a validated file with keyboard access", async ({
  page,
}) => {
  await page.goto("/settings");
  await expect(page.getByText("1. Export a copy", { exact: true })).toBeVisible();
  await expect(page.getByText(/does not upload it to a cloud service/i)).toBeVisible();
  await expect(page.getByText("3. Import to restore", { exact: true })).toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }

  const currentState = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("grammar-automaticity:v27") || "{}"),
  );
  const backup = {
    kind: "automaticity.learning-data-export",
    schemaVersion: "1.0.0",
    exportedAt: "2026-08-30T08:00:00.000Z",
    language: "en",
    learnerState: {
      ...currentState,
      learner: { ...(currentState.learner || {}), displayName: "Restored learner" },
    },
    learningEvidence: {
      schemaVersion: "1.0.0",
      contentUnits: [],
      dailyPlans: [],
      responses: [],
      evidence: [],
      events: [],
    },
  };
  page.on("dialog", (dialog) => dialog.accept());
  const importButton = page.getByRole("button", { name: "Import a backup" });
  await importButton.focus();
  await expect(importButton).toBeFocused();
  const chooserPromise = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: "english-automaticity-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });

  await expect(page.getByRole("status")).toContainText("restored on this device");
  await expect.poll(() =>
    page.evaluate(() => {
      const state = JSON.parse(
        localStorage.getItem("grammar-automaticity:v27") || "{}",
      );
      return state.learner?.displayName;
    }),
  ).toBe("Restored learner");
});

// Confirms the browser's own Back/Forward buttons work correctly across
// screen changes — a common regression when routing is driven by client-side
// state instead of real history entries.
test("deep-links every screen and preserves browser navigation", async ({
  page,
}) => {
  await page.goto("/grammar");
  await expect(page).toHaveURL(/\/grammar$/);
  // A hard reload on this URL must land on the same screen, not the home
  // screen — proves the route is real, not just client-side navigation state.
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Grammar Lab" }),
  ).toBeVisible();

  await page.goto("/settings");
  await expect(page).toHaveURL(/\/settings$/);
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Grammar Lab" }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", { level: 1, name: "Settings" }),
  ).toBeVisible();
});

// A "thesis" screen and its local-storage keys used to exist and have since
// been retired. This simulates a learner who still has that old data saved
// on their device and confirms visiting the dead route both redirects them
// home instead of erroring, and cleans up the leftover data rather than
// leaving it orphaned forever.
test("retires the private route and removes its old local data", async ({
  page,
}) => {
  // Seed localStorage exactly as an old build would have left it.
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
    page.getByRole("heading", { level: 1, name: "Good morning, Learner" }),
  ).toBeVisible();

  // The cleanup may not be synchronous with the redirect, so poll instead
  // of a single immediate assertion.
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

test("persists optional online grammar feedback and keeps repair available", async ({
  page,
}) => {
  await page.goto("/settings");
  await page.getByLabel(/Allow optional online grammar checks/).check();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = JSON.parse(
          localStorage.getItem("grammar-automaticity:v27") ?? "{}",
        ) as { settings?: { onlineFeedback?: boolean } };
        return state.settings?.onlineFeedback;
      }),
    )
    .toBe(true);

  await page.goto("/?screen=errors");
  await expect(
    page.getByRole("heading", { level: 1, name: "Error Workshop" }),
  ).toBeVisible();
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
  await page.goto("/studio");

  await expect(
    page.getByRole("heading", { level: 1, name: "Speaking Studio" }),
  ).toBeVisible();
  await expect(page.getByLabel("Topic").locator("option")).toHaveCount(72);
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", {
      name: "Home",
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByLabel("Level")).toBeDisabled();
  await expect(page.getByText("Listening", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Stop/ }).click();
  await expect(page.getByLabel("Level")).toBeEnabled();

  const recording = page.getByLabel("Recorded answer");
  await expect(recording).toBeVisible();
  await recording.dispatchEvent("play");
  await expect(
    page.getByRole("heading", { name: "Listen to your real recording" }),
  ).toBeVisible();

  await page
    .getByLabel("Your transcript")
    .fill("This text belongs only to the first attempt.");
  await page.getByRole("button", { name: "Record again" }).click();
  await expect(page.getByLabel("Your transcript")).toHaveValue("");
  await page.getByRole("button", { name: /Stop/ }).click();
});
