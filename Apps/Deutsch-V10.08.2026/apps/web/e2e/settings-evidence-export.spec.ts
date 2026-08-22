import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("settings export includes the normalized learning-evidence ledger", async ({
  page,
}) => {
  await page.goto("/einstellungen");

  const downloadPromise = page.waitForEvent("download");
  const exportButton = page.getByRole("button", {
    name: "Lerndaten exportieren",
  });
  await expect(exportButton).toBeVisible();
  await exportButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^DeutschFlow-Lerndaten-\d{4}-\d{2}-\d{2}\.json$/,
  );
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const backup = JSON.parse(await readFile(downloadPath!, "utf8")) as {
    kind?: string;
    schemaVersion?: string;
    language?: string;
    learnerState?: { settings?: { dailyStudyMinutes?: number } };
    learningEvidence?: {
      responses?: unknown[];
      evidence?: unknown[];
      events?: unknown[];
    };
  };

  expect(backup.kind).toBe("automaticity.learning-data-export");
  expect(backup.schemaVersion).toBe("1.0.0");
  expect(backup.language).toBe("de");
  expect(backup.learnerState?.settings?.dailyStudyMinutes).toBe(15);
  expect(backup.learningEvidence?.responses).toEqual([]);
  expect(backup.learningEvidence?.evidence).toEqual([]);
  expect(backup.learningEvidence?.events).toEqual([]);
});

test("optionale Messung ist eingewilligt, datensparsam, widerrufbar und löschbar", async ({
  page,
}) => {
  await page.goto("/einstellungen");
  await page.evaluate(() => {
    window.localStorage.setItem("learner-progress-sentinel", "keep-me");
  });

  const consent = page.getByRole("checkbox", {
    name: "Ich willige in die optionale Wirksamkeitsmessung ein",
  });
  await consent.check();
  await expect(
    page.getByText(
      "Einwilligung erteilt und Ausgangsmessung vor einer Intervention lokal erfasst.",
    ),
  ).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Datenschutzsichere Messdaten herunterladen",
    })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("automaticity-messdaten-de.json");
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const contents = await readFile(downloadPath!, "utf8");
  const measurement = JSON.parse(contents) as {
    kind?: string;
    language?: string;
    consent?: { status?: string; purpose?: string };
    baseline?: { capturedBeforeIntervention?: boolean };
    cohortStatistics?: { status?: string; reason?: string };
    outcomes?: unknown[];
  };

  expect(measurement.kind).toBe("automaticity.privacy-safe-measurement-export");
  expect(measurement.language).toBe("de");
  expect(measurement.consent).toMatchObject({
    status: "granted",
    purpose: "product-effectiveness-research",
  });
  expect(measurement.baseline?.capturedBeforeIntervention).toBe(true);
  expect(measurement.cohortStatistics).toEqual({
    status: "not-computed",
    reason: "production-telemetry-unavailable",
  });
  expect(measurement.outcomes).toEqual([]);
  expect(contents).not.toMatch(
    /"(?:inputText|correctedText|prompt|transcript|audio|email|hardwareId|freeform|intention)"/i,
  );

  await consent.uncheck();
  await expect(
    page.getByRole("button", {
      name: "Datenschutzsichere Messdaten herunterladen",
    }),
  ).toBeDisabled();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Messdaten löschen" }).click();
  const localState = await page.evaluate(() => ({
    consent: window.localStorage.getItem("automaticity:measurement-consent:v1"),
    baseline: window.localStorage.getItem(
      "automaticity:measurement-baseline:v1",
    ),
    progress: window.localStorage.getItem("learner-progress-sentinel"),
  }));
  expect(localState).toEqual({
    consent: null,
    baseline: null,
    progress: "keep-me",
  });
});

test("optionale Wenn-dann-Pläne sind tastaturbedienbar, lokal und zeigen standardmäßig keinen Hinweis", async ({
  page,
}) => {
  await page.goto("/einstellungen");
  const onboarding = page.getByTestId("implementation-intentions-onboarding");
  await expect(onboarding).toHaveAttribute("dir", "ltr");
  await expect(
    onboarding.getByRole("heading", { name: "Meine Wenn-dann-Lernpläne" }),
  ).toBeVisible();
  await expect(
    onboarding.getByRole("button", { name: "Jetzt überspringen" }),
  ).toBeVisible();

  const add = onboarding.getByRole("button", { name: "Plan hinzufügen" });
  await add.focus();
  await page.keyboard.press("Enter");
  await expect(onboarding.getByRole("group", { name: "Plan 1" })).toBeVisible();
  await add.focus();
  await page.keyboard.press("Enter");
  await expect(onboarding.getByRole("group", { name: "Plan 2" })).toBeVisible();

  await onboarding
    .getByLabel("Wenn das passiert 1")
    .selectOption("after_event");
  await onboarding
    .getByLabel("Uhrzeit oder kurze Situation 1")
    .fill("Nach dem Frühstück");
  const save = onboarding.getByRole("button", {
    name: "Pläne auf diesem Gerät speichern",
  });
  await expect(save).toBeEnabled();
  await save.focus();
  await page.keyboard.press("Enter");
  await expect(
    onboarding
      .getByRole("status")
      .getByText(
        "Pläne lokal gespeichert. Es wurde keine Erinnerung gesendet.",
      ),
  ).toBeVisible();

  const local = await page.evaluate(() => {
    const profile = JSON.parse(
      window.localStorage.getItem("adherence-core-v1") ?? "{}",
    ) as {
      intentions?: Array<{ triggerLabel?: string }>;
      nudgeOptIn?: boolean;
      streak?: unknown;
    };
    return {
      intentions: profile.intentions,
      nudgeOptIn: profile.nudgeOptIn,
      hasStreak: Boolean(profile.streak),
      nudgeEvents: JSON.parse(
        window.localStorage.getItem("adherence-nudge-events-v1") ?? "[]",
      ) as Array<{ type?: string }>,
    };
  });
  expect(local.intentions).toHaveLength(2);
  expect(local.intentions?.[0]?.triggerLabel).toBe("Nach dem Frühstück");
  expect(local.nudgeOptIn).toBe(false);
  expect(local.hasStreak).toBe(true);
  expect(local.nudgeEvents.every((event) => event.type === "evaluated")).toBe(
    true,
  );

  await page.reload();
  await expect(onboarding.getByRole("group", { name: "Plan 2" })).toBeVisible();
  await onboarding
    .getByRole("button", { name: "Plan löschen" })
    .first()
    .click();
  await expect(save).toBeDisabled();
  await expect(
    onboarding.getByText("Speichere entweder keinen oder 2–5 aktive Pläne."),
  ).toBeVisible();

  for (const viewport of [
    { width: 800, height: 1280 },
    { width: 412, height: 915 },
  ]) {
    await page.setViewportSize(viewport);
    await page.reload();
    await expect(onboarding).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  }
});

test("geschützter Hinweis braucht lokales Opt-in und stiehlt keinen Fokus", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-08-22T10:00:00.000Z"));
  await page.goto("/einstellungen");
  const onboarding = page.getByTestId("implementation-intentions-onboarding");
  const add = onboarding.getByRole("button", { name: "Plan hinzufügen" });
  const optIn = onboarding.getByRole("checkbox", {
    name: "Gelegentlich einen Hinweis in dieser App zeigen, wenn einer meiner Zeitpläne passt.",
  });
  await expect(optIn).not.toBeChecked();
  await optIn.check();
  await onboarding
    .getByRole("button", { name: "Pläne auf diesem Gerät speichern" })
    .click();
  expect(
    await page.evaluate(
      () =>
        (
          JSON.parse(
            window.localStorage.getItem("adherence-core-v1") ?? "{}",
          ) as { nudgeOptIn?: boolean }
        ).nudgeOptIn,
    ),
  ).toBe(true);
  const localTime = await page.evaluate(() => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const value = (type: "hour" | "minute") =>
      parts.find((part) => part.type === type)?.value ?? "00";
    return `${value("hour")}:${value("minute")}`;
  });
  await page.evaluate((triggerLabel) => {
    const profile = JSON.parse(
      window.localStorage.getItem("adherence-core-v1") ?? "{}",
    ) as Record<string, unknown>;
    profile.intentions = [
      {
        id: "e2e-time-plan",
        trigger: "time",
        triggerLabel,
        action: "full_session",
        active: true,
      },
      {
        id: "e2e-review-plan",
        trigger: "time",
        triggerLabel,
        action: "review_only",
        active: true,
      },
    ];
    profile.nudgeOptIn = false;
    window.localStorage.setItem("adherence-core-v1", JSON.stringify(profile));
    window.localStorage.removeItem("adherence-nudge-events-v1");
  }, localTime);

  await add.focus();
  await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
  await expect(page.getByTestId("guarded-in-app-nudge")).toHaveCount(0);

  await page.evaluate(() => {
    const profile = JSON.parse(
      window.localStorage.getItem("adherence-core-v1") ?? "{}",
    ) as Record<string, unknown>;
    profile.nudgeOptIn = true;
    window.localStorage.setItem("adherence-core-v1", JSON.stringify(profile));
    window.dispatchEvent(new Event("pageshow"));
  });
  const nudge = page.getByTestId("guarded-in-app-nudge");
  await expect(nudge).toBeVisible();
  await expect(
    nudge.getByRole("heading", {
      name: "Dein geplantes Lernfenster ist geöffnet",
    }),
  ).toBeVisible();
  await expect(nudge.getByRole("status")).toContainText(
    "Wäre ein kleiner Anfang hilfreich?",
  );
  expect(
    await page.evaluate(() => document.activeElement?.textContent),
  ).toContain("Plan hinzufügen");

  for (const viewport of [
    { width: 800, height: 1280 },
    { width: 412, height: 915 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(nudge).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  }

  await nudge
    .getByRole("button", { name: "Jetzt nicht — ohne Nachteil" })
    .click();
  await expect(nudge).toHaveCount(0);
  const events = await page.evaluate(
    () =>
      JSON.parse(
        window.localStorage.getItem("adherence-nudge-events-v1") ?? "[]",
      ) as Array<{ type?: string; learningOutcome?: string }>,
  );
  expect(events.map((event) => event.type)).toEqual(
    expect.arrayContaining(["evaluated", "shown", "dismissed"]),
  );
  expect(
    events.every((event) => event.learningOutcome === "not-evaluated"),
  ).toBe(true);
  expect(JSON.stringify(events)).not.toMatch(
    /triggerLabel|transcript|email|audio/i,
  );
});
