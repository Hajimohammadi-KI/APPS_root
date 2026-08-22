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

test("optionale Wenn-dann-Pläne sind tastaturbedienbar, lokal und senden keinen Nudge", async ({
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
      nudgeEventKeys: Object.keys(window.localStorage).filter((key) =>
        /nudge.*(?:event|shown|action)/i.test(key),
      ),
    };
  });
  expect(local.intentions).toHaveLength(2);
  expect(local.intentions?.[0]?.triggerLabel).toBe("Nach dem Frühstück");
  expect(local.nudgeOptIn).toBe(false);
  expect(local.hasStreak).toBe(true);
  expect(local.nudgeEventKeys).toEqual([]);

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
