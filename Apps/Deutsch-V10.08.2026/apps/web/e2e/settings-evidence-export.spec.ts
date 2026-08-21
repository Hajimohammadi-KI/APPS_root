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
