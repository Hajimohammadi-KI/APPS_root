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

test("optional measurement is consented, privacy-safe, revocable, and deletable", async ({
	page,
}) => {
	await page.goto("/settings");
	await page.evaluate(() => {
		window.localStorage.setItem("learner-progress-sentinel", "keep-me");
	});

	const consent = page.getByRole("checkbox", {
		name: "I consent to optional effectiveness measurement",
	});
	await consent.check();
	await expect(
		page.getByText(
			"Consent granted and a pre-intervention baseline was captured locally.",
		),
	).toBeVisible();

	const downloadPromise = page.waitForEvent("download");
	await page
		.getByRole("button", { name: "Download privacy-safe measurement" })
		.click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toBe("automaticity-measurement-en.json");
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

	expect(measurement.kind).toBe(
		"automaticity.privacy-safe-measurement-export",
	);
	expect(measurement.language).toBe("en");
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
		page.getByRole("button", { name: "Download privacy-safe measurement" }),
	).toBeDisabled();

	page.once("dialog", (dialog) => dialog.accept());
	await page.getByRole("button", { name: "Delete measurement data" }).click();
	const localState = await page.evaluate(() => ({
		consent: window.localStorage.getItem(
			"automaticity:measurement-consent:v1",
		),
		baseline: window.localStorage.getItem(
			"automaticity:measurement-baseline:v1",
		),
		progress: window.localStorage.getItem("learner-progress-sentinel"),
	}));
	expect(localState).toEqual({ consent: null, baseline: null, progress: "keep-me" });
});

test("optional if-then plans are keyboard accessible, local-only, and emit no nudge", async ({
	page,
}) => {
	await page.goto("/settings");
	const onboarding = page.getByTestId("implementation-intentions-onboarding");
	await expect(onboarding).toHaveAttribute("dir", "ltr");
	await expect(
		onboarding.getByRole("heading", { name: "My if–then practice plans" }),
	).toBeVisible();
	await expect(onboarding.getByRole("button", { name: "Skip for now" })).toBeVisible();

	const add = onboarding.getByRole("button", { name: "Add a plan" });
	await add.focus();
	await page.keyboard.press("Enter");
	await expect(onboarding.getByRole("group", { name: "Plan 1" })).toBeVisible();
	await add.focus();
	await page.keyboard.press("Enter");
	await expect(onboarding.getByRole("group", { name: "Plan 2" })).toBeVisible();

	await onboarding.getByLabel("If this happens 1").selectOption("after_event");
	await onboarding
		.getByLabel("Time or short situation 1")
		.fill("After breakfast");
	const save = onboarding.getByRole("button", {
		name: "Save plans on this device",
	});
	await expect(save).toBeEnabled();
	await save.focus();
	await page.keyboard.press("Enter");
	await expect(
		onboarding.getByRole("status").getByText("Plans saved locally. No reminder was sent."),
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
			nudgeEventKeys: Object.keys(window.localStorage).filter(
				(key) => /nudge.*(?:event|shown|action)/i.test(key),
			),
		};
	});
	expect(local.intentions).toHaveLength(2);
	expect(local.intentions?.[0]?.triggerLabel).toBe("After breakfast");
	expect(local.nudgeOptIn).toBe(false);
	expect(local.hasStreak).toBe(true);
	expect(local.nudgeEventKeys).toEqual([]);

	await page.reload();
	await expect(onboarding.getByRole("group", { name: "Plan 2" })).toBeVisible();
	await onboarding.getByRole("button", { name: "Delete plan" }).first().click();
	await expect(save).toBeDisabled();
	await expect(onboarding.getByText("Save either no active plans or 2–5 active plans.")).toBeVisible();

	for (const viewport of [
		{ width: 800, height: 1280 },
		{ width: 412, height: 915 },
	]) {
		await page.setViewportSize(viewport);
		await page.reload();
		await expect(onboarding).toBeVisible();
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
			),
		).toBe(true);
	}
});
