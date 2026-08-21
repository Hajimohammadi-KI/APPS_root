import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("settings export includes the normalized learning-evidence ledger", async ({
	page,
}) => {
	await page.goto("/settings");
	await expect(
		page.getByRole("heading", { level: 1, name: "Settings" }),
	).toBeVisible();
	await expect(page.getByRole("link", { name: "Back to Home" })).toBeVisible();

	const downloadPromise = page.waitForEvent("download");
	await page.getByRole("button", { name: "Export data" }).click();
	const download = await downloadPromise;
	const downloadPath = await download.path();
	expect(download.suggestedFilename()).toBe(
		"grammar-automaticity-v27-backup.json",
	);
	expect(downloadPath).not.toBeNull();

	const backup = JSON.parse(await readFile(downloadPath!, "utf8")) as {
		kind?: string;
		schemaVersion?: string;
		language?: string;
		learnerState?: { version?: number };
		learningEvidence?: {
			responses?: unknown[];
			evidence?: unknown[];
			events?: unknown[];
		};
	};

	expect(backup.kind).toBe("automaticity.learning-data-export");
	expect(backup.schemaVersion).toBe("1.0.0");
	expect(backup.language).toBe("en");
	expect(backup.learnerState?.version).toBe(27);
	expect(backup.learningEvidence?.responses).toEqual([]);
	expect(backup.learningEvidence?.evidence).toEqual([]);
	expect(backup.learningEvidence?.events).toEqual([]);
});
