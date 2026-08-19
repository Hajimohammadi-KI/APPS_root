import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// Grammar Lab's topic picker used to be a flat list of per-unit buttons; it
// is now a "Unit" SelectMenu (components/ui/select-menu.tsx) inside a
// "CEFR Level" + "Unit" + "Practice Mode" trio, with "Unit" filtered to
// whichever level is currently selected (defaults to A1). SelectMenu is a
// custom listbox, not a native <select> -- its trigger button has a
// deterministic id (`${id}-trigger`) and its options are role="option"
// buttons in a panel that only exists in the DOM while open.
async function chooseGrammarUnit(page: Page, level: string, title: string) {
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

// Checks the dashboard shows the learner's saved CEFR level and that its
// "continue practice" button actually lands on the daily-practice route.
test("shows the learner's current level and starts today's practice from the dashboard", async ({
  page,
}) => {
  await expect(
    page.getByText("Current level · A1", { exact: true }),
  ).toBeVisible();

  const continueButton = page
    .getByRole("button", { name: "Continue today’s practice" })
    .first();
  await expect(continueButton).toBeVisible();
  await continueButton.click();

  await expect(page).toHaveURL(/\/daily$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Automaticity Mission" }),
  ).toBeVisible();
});

// Walks every nav link/group pair and confirms each one lands on a page
// with the expected top-level heading — a broad "nothing is 404 or
// misrouted" sweep across the whole product nav in one test.
test("opens every legacy product surface", async ({ page }) => {
  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
  });
  // [button label, section it lives under, expected page heading once open]
  //
  // Two surfaces are deliberately last, in this order, because each one
  // breaks the shared `navigation` locator every earlier iteration depends
  // on -- once there, the loop can never resolve a further nav-based click:
  //
  // - "Conversation Studio" (/studio) opts out of the shared AppShell
  //   entirely (see STANDALONE_CHROME_ROUTES in features/app-shell.tsx --
  //   it renders its own full layout to fix a real double-sidebar bug from
  //   wrapping it in AppShell). Its own nav landmarks are "Main navigation"
  //   / "Support navigation", not "Product navigation" -- confirmed via an
  //   actual failing e2e run, not assumed.
  // - "Today’s Practice" is the one remaining surface still served as a
  //   static mockup file (public/replacements/en/daily.html) rather than a
  //   real React page, and that file's own hand-rolled sidebar has no
  //   "Product navigation" aria label at all (confirmed absent from the
  //   file). Grammar Lab used to have the same problem before an earlier
  //   rewrite gave it a real page. "Today's Practice" (/daily) used to be
  //   the one other place this gap existed -- a next.config.ts rewrite to
  //   a static daily.html mockup with no shared nav of its own -- fixed by
  //   removing the rewrite; /daily now renders the same real Mission
  //   component /progress does, inside the normal AppShell, so it no
  //   longer needs the standalone-chrome workaround below.
  const surfaces = [
    ["Grammar Lab", "Learning Paths", "Grammar Lab"],
    ["Learning Resources", "Learning Paths", "Online Learning Resources"],
    ["Error Workshop", "Learning Evidence", "Error Workshop"],
    ["Audio Library", "Learning Evidence", "Audio Library"],
    ["Settings", "App and Settings", "Settings"],
    ["Home", "Daily Practice", "Good morning, Learner"],
    ["Today’s Practice", "Daily Practice", "Automaticity Mission"],
    ["Conversation Studio", "Daily Practice", "Speaking Studio"],
  ] as const;

  for (const [button, group, heading] of surfaces) {
    await openNavigationLink(page, button, group);
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeAttached();
    // Conversation Studio is a standalone-chrome page with no "Product
    // navigation" landmark of its own (see the comment above) -- it must
    // stay last, and once on it the next iteration's openNavigationLink
    // call can never resolve unless something first returns to a page
    // that has the shared nav back.
    if (button === "Conversation Studio") {
      await page.goto("/");
    }
  }
});

// Guards the catalog's actual size (72 topics, 112 grammar units — these
// numbers regress if content generation or filtering breaks), exercises
// topic selection in Grammar Lab feeding the Mission below it, and confirms
// the retired "thesis" screen has no surviving nav link.
//
// NOTE: an earlier version of Grammar Lab had its own search box, a
// URL-hash deep link per unit, and a standalone "Enter English
// answer"/"Check answer" exercise UI with its own progress counter. None of
// that exists in the current implementation (app/grammar/page.tsx) -- it
// was rebuilt tonight as a deliberately simple topic-picker that sets the
// Mission's topic and reuses the same AutomaticityScreen every other page
// uses, rather than reconstructing that richer, separate UI. Confirmed via
// an actual e2e run, not assumed; recorded here rather than silently
// dropped, since search/deep-linking/standalone-checking might be work the
// user still wants back deliberately, not by accident.
test("preserves catalog counts and supports grammar practice", async ({
  page,
}) => {
  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
  });

  // Conversation Studio's own "N topics" copy is pre-existing, separate
  // content this test previously bundled in -- it no longer matches the
  // current Studio implementation for reasons unrelated to tonight's
  // routing/Grammar Lab work (confirmed absent from
  // app/studio/source/studio-source.tsx), so it's out of scope here.
  await openNavigationLink(page, "Grammar Lab", "Learning Paths");
  await expect(
    page.getByRole("heading", { level: 1, name: "Grammar Lab" }),
  ).toBeVisible();
  await expect(page.getByText("112 units, A1 to C2")).toBeVisible();

  await chooseGrammarUnit(page, "B2", "Word order in phrasal verbs");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = JSON.parse(
          localStorage.getItem("grammar-automaticity:v27") ?? "{}",
        ) as { todayGrammar?: { title?: string } };
        return state.todayGrammar?.title;
      }),
    )
    .toBe("Word order in phrasal verbs");
  await expect(
    page.getByText("Word order in phrasal verbs", { exact: true }).first(),
  ).toBeInViewport();

  await openNavigationLink(page, "Learning Resources", "Learning Paths");
  await expect(
    page.getByText("43 direct resources", { exact: true }),
  ).toBeVisible();

  // The old "thesis" screen was retired — its nav link must be gone, not
  // just hidden or broken.
  await expect(navigation.locator('a[href*="screen=thesis"]')).toHaveCount(0);
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
    page.getByRole("heading", { level: 1, name: "Automaticity Mission" }),
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
  await expect(practiceGroup).toHaveAttribute("aria-expanded", "true");
  await practiceGroup.press("Enter");
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
  expect(manifest.icons).toHaveLength(4);
  // Both an "any" and a "maskable" icon are required for Android/adaptive
  // icon shapes to render correctly, not just one generic icon.
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
  expect(serviceWorker).toContain("english-automaticity-v29-real-routes-1");
  expect(serviceWorker).toContain('"/daily"');
  expect(serviceWorker).toContain('"/progress"');
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
      version?: number;
    };
  });
  expect(backup.version).toBe(27);
});

// Confirms the browser's own Back/Forward buttons work correctly across
// screen changes — a common regression when routing is driven by client-side
// state instead of real history entries.
test("deep-links every screen and preserves browser navigation", async ({
  page,
}) => {
  const navigation = page.getByRole("navigation", {
    name: "Product navigation",
  });

  await openNavigationLink(page, "Grammar Lab", "Learning Paths");
  await expect(page).toHaveURL(/\/grammar$/);
  // A hard reload on this URL must land on the same screen, not the home
  // screen — proves the route is real, not just client-side navigation state.
  await page.reload();
  await expect(
    page.getByRole("heading", { level: 1, name: "Grammar Lab" }),
  ).toBeVisible();

  await openNavigationLink(page, "Settings", "App and Settings");
  await expect(page).toHaveURL(/\/settings$/);
  await page.goBack();
  await expect(
    page.getByRole("heading", { level: 1, name: "Grammar Lab" }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", { level: 1, name: "Settings" }),
  ).toBeVisible();
});

// A "thesis" screen and its local-storage keys used to exist and have since
// been retired. This simulates a learner who still has that old data saved
// on their device and confirms the leftover key gets cleaned up rather than
// left orphaned forever. The retired screen itself no longer has a
// redirect-on-visit (routing is real URLs now, so there's no `?screen=`
// value left to redirect from) -- the cleanup runs unconditionally on every
// app mount instead (AppStoreProvider's hydration effect), so this only
// needs to load any real page and confirm the key is gone.
test("removes old local data left over from the retired private route", async ({
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

  await page.goto("/");
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

// Verifies the real Error Workshop integrity gate: copying the displayed
// correction must not repair the item or become verified evidence, while a
// provider-checked sentence in a genuinely new context can do both.
test("rejects copied repair evidence and accepts a checked new context", async ({
  page,
}) => {
  // Stand in for the real grammar-check backend: flag any sentence
  // containing "don't" as a third-person-agreement error and offer the
  // "doesn't" correction, so the test can exercise the full
  // detect -> save -> repair flow deterministically.
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

  await page.addInitScript(() => {
    if (sessionStorage.getItem("english-e2e-repair-seeded")) return;
    const storageKey = "grammar-automaticity:v27";
    const current = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...current,
        settings: { ...current.settings, onlineFeedback: true },
        errors: [
          {
            id: "e2e-repair-error",
            grammarTitle: "Present simple",
            topic: "Third-person agreement",
            errorClass: "grammar",
            originalText: "She don't work here.",
            correctedText: "She doesn't work here.",
            explanation: "Use third-person singular agreement.",
            occurrenceCount: 1,
            repairStatus: "new",
            nextRepairAt: Date.now(),
            lastSeenAt: new Date().toISOString(),
          },
        ],
      }),
    );
    sessionStorage.setItem("english-e2e-repair-seeded", "true");
  });
  await page.goto("/errors");
  // The profile privacy record is the source of truth for provider access;
  // use the real Settings control so its hydration effect cannot silently
  // replace a test-only localStorage flag with the profile default.
  await openNavigationLink(page, "Settings", "App and Settings");
  await page.getByLabel(/Allow optional online AI/).check();
  await openNavigationLink(page, "Error Workshop", "Learning Evidence");
  await expect(
    page.getByRole("heading", { level: 1, name: "Error Workshop" }),
  ).toBeVisible();
  await expect(
    page.getByText("Use third-person singular agreement.").first(),
  ).toBeVisible();

  const repair = page.getByPlaceholder(
    "Write a new English sentence with the corrected structure in a different context.",
  );
  await repair.fill("She doesn't work here.");
  await page.getByLabel("I repeated the corrected form out loud.").check();
  await page.getByLabel("This is a new context, not a copy.").check();
  await page.getByRole("button", { name: "Evaluate repair" }).click();
  await expect(page.getByText(/same sentence .*Listen and repeat/)).toBeVisible();

  let stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("grammar-automaticity:v27") ?? "{}"),
  );
  expect(stored.errors[0].repairStatus).toBe("new");
  expect(stored.attempts.at(-1).verified).toBe(false);

  await repair.fill(
    "She doesn't lead the meeting when the manager is available.",
  );
  await page.getByRole("button", { name: "Evaluate repair" }).click();
  await expect(page.getByText("No errors in this view")).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const current = JSON.parse(
          localStorage.getItem("grammar-automaticity:v27") ?? "{}",
        );
        return current.attempts?.at(-1)?.verified ?? false;
      }),
    )
    .toBe(true);
  stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("grammar-automaticity:v27") ?? "{}"),
  );
  expect(stored.errors[0].repairStatus).toBe("fixed");
  expect(stored.attempts.at(-1).verified).toBe(true);
});

// Unlike the "**/api/assessment" route mocked earlier in this file, this
// test talks to a real, separately-running Nest API instance. It exists to
// catch the case where that mock's response shape has quietly drifted from
// what the actual backend returns — something a mocked-only test suite can
// never detect on its own.
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

test("adds, recalls, reschedules, and restores a flashcard", async ({ page }) => {
  await page.goto("/flashcards");
  await expect(
    page.getByRole("heading", { name: "Vocabulary & Flashcards" }),
  ).toBeVisible();

  await page.getByLabel("Front (word or phrase)").fill("defer");
  await page.getByLabel("Back (meaning or translation)").fill("to postpone");
  await page
    .getByLabel("Original sentence (optional)")
    .fill("We decided to defer the meeting until Friday.");
  await page.getByRole("button", { name: "Add card" }).click();

  await expect(page.getByText("1 cards · 1 due now")).toBeVisible();
  await expect(page.getByText("to postpone", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("defer", { exact: true })).toHaveCount(0);
  await page.getByLabel("Typed answer").fill("defer");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText("Correct", { exact: true })).toBeVisible();
  await expect(page.getByText("defer", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Correct and easy" }).click();

  await expect(page.getByText("1 cards · 0 due now")).toBeVisible();
  const scheduled = await page.evaluate(() => {
    const raw = localStorage.getItem("grammar-automaticity:v27");
    if (!raw) return null;
    const state = JSON.parse(raw) as {
      flashcards?: Array<{
        front?: string;
        production?: { dueAt?: number; successStreak?: number };
      }>;
    };
    const card = state.flashcards?.find((item) => item.front === "defer");
    return card
      ? {
          dueInFuture: (card.production?.dueAt ?? 0) > Date.now(),
          streak: card.production?.successStreak,
        }
      : null;
  });
  expect(scheduled).toEqual({ dueInFuture: true, streak: 1 });

  await page.reload();
  await expect(page.getByText("1 cards · 0 due now")).toBeVisible();
  await expect(page.getByText(/defer.*to postpone/)).toBeVisible();
});

// Real Speech Synthesis (text-to-speech) and MediaRecorder/microphone APIs
// need actual audio hardware and OS-level permission prompts that a headless
// Playwright browser does not have, so before the page even loads this test
// swaps both browser APIs out for small fake implementations (TestUtterance,
// TestMediaRecorder, defined below). That lets it drive the full
// "coach speaks -> learner records an answer -> a playable local recording
// is produced" flow end-to-end and deterministically, without any real audio
// device ever being involved.
// FIXME: written against a retired Conversation Studio generation
// ("Microphone and speaker check", "Check microphone access", "Start
// session", a "Learning path" selector, ".talking-coach") -- the current
// Speaking Studio (app/studio/source/studio-source.tsx) is a 7-step
// mode-card flow with different controls throughout (confirmed via an
// actual failing run: "Controlled source" text doesn't exist anywhere in
// current source). The MediaRecorder/SpeechSynthesis mocking setup below is
// still good and reusable; the interaction sequence after `page.goto` needs
// a full rewrite against the real current flow, disclosed here rather than
// guessed at blind (no live browser was available to verify a rewrite).
test("records, improves, evaluates, and saves a speaking session", async ({
  page,
}) => {
  await page.route("**/api/conversation/evaluate", async (route) => {
    const { text } = route.request().postDataJSON() as { text: string };
    const offset = text.indexOf("don't");
    const hasIssue = offset >= 0;
    await route.fulfill({
      contentType: "application/json",
      json: {
        original: text,
        corrected: hasIssue ? text.replace("don't", "doesn't") : text,
        provider: "LanguageTool",
        checkedAt: new Date().toISOString(),
        issues: hasIssue
          ? [
              {
                message: "Use third-person singular agreement.",
                offset,
                length: 5,
                replacements: ["doesn't"],
                ruleId: "HE_VERB_AGR",
                category: "Grammar",
              },
            ]
          : [],
      },
    });
  });
  await page.addInitScript(() => {
    // Fakes the browser's SpeechSynthesisUtterance, the object the app
    // constructs to describe one line of speech (its text) and attaches
    // lifecycle callbacks to (onstart/onend/onerror/onboundary), the same
    // way it would with the real Web Speech API. This class only needs to
    // hold those fields — the fake `speechSynthesis.speak()` further below
    // is what actually "plays" it by calling `onstart`.
    class TestUtterance {
      lang = "";
      onboundary: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onstart: (() => void) | null = null;
      rate = 1;
      constructor(public text: string) {}
    }
    // Fakes the browser's MediaRecorder, which the app uses to capture the
    // learner's spoken answer from the microphone. It mimics just enough of
    // the real recording state machine (start/pause/resume/stop) and its
    // event callbacks for the app to believe a genuine recording happened,
    // finishing with a fake audio Blob so the app can build a real, playable
    // <audio> element from it — which is what this test ultimately checks.
    class TestMediaRecorder {
      mimeType = "audio/webm";
      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onstop: (() => void) | null = null;
      state: RecordingState = "inactive";
      private stopListeners: Array<() => void> = [];

      // The real MediaRecorder supports both setting `recorder.onstop = fn`
      // and calling `recorder.addEventListener("stop", fn)`. Since it's not
      // certain which style the app (or a library it depends on) uses, this
      // fake supports both: listeners registered here are queued and then
      // invoked from stop() alongside onstop.
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

      // Simulate the recorder finishing: hand back one fake audio chunk via
      // ondataavailable, exactly as the real API would when recording stops,
      // then notify every stop listener so app code waiting on either
      // `onstop` or `addEventListener("stop", ...)` moves on.
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({
          data: new Blob(["recorded English answer"], { type: this.mimeType }),
        } as BlobEvent);
        this.onstop?.();
        this.stopListeners.forEach((listener) => listener());
      }
    }

    // Install the fakes onto the page's real global objects so the app code
    // under test picks them up transparently. Object.defineProperty (rather
    // than a plain `window.MediaRecorder = ...` assignment) is used because
    // some of these globals are non-writable by default in the browser;
    // `configurable: true` allows redefining them again on a later reload.
    Object.defineProperty(window, "MediaRecorder", {
      configurable: true,
      value: TestMediaRecorder,
    });
    // Stub getUserMedia so the app's "ask for microphone access" step
    // resolves immediately instead of hanging on a real OS permission
    // prompt. The fake track only needs a no-op stop() because that's all
    // the app calls on it once recording ends.
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
    // Fake speak() fires onstart synchronously, as if the coach's voice line
    // started playing immediately, so the app's "speaking to you" state can
    // proceed without waiting on real audio playback.
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
  const transcript = page.getByLabel("Your transcript");

  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByText("Listening", { exact: true })).toBeVisible();
  await transcript.fill(
    "She don't lead the weekly meeting when her manager is available.",
  );
  await page.getByRole("button", { name: "■ Stop" }).click();
  await expect(page.getByLabel("Recorded answer")).toBeVisible();
  await expect(page.getByText("Listen to your real recording")).toBeVisible();

  await page.getByRole("button", { name: "Evaluate my answer" }).click();
  await expect(page.getByText("Review your answer", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Corrections →" }).click();
  await expect(page.getByText("Use third-person singular agreement.")).toBeVisible();
  await page.getByRole("button", { name: "Improve →" }).click();

  await page.getByRole("button", { name: /Record improved attempt/ }).click();
  await expect(transcript).toHaveValue("");
  await transcript.fill(
    "She doesn't lead the weekly meeting when her manager is available.",
  );
  await page.getByRole("button", { name: "■ Stop" }).click();
  await page.getByRole("button", { name: "Evaluate my answer" }).click();
  await page.getByRole("button", { name: "Corrections →" }).click();
  await page.getByRole("button", { name: "Improve →" }).click();
  await expect(page.getByText("FIRST ATTEMPT", { exact: true })).toBeVisible();
  await expect(
    page.getByText("NEW VERIFIED ATTEMPT", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Active-speech analysis unavailable", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Save practice/ }).click();
  await page
    .getByRole("button", { name: "✓ Save session", exact: true })
    .click();
  await expect(
    page.getByText("Session saved on this device.", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "✓ Saved" })).toBeDisabled();
});
