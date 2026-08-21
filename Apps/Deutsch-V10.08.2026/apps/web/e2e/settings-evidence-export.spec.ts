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
