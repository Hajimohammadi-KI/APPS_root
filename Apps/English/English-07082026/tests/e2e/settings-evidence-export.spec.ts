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

test("optional if-then plans are keyboard accessible, local-only, and show no prompt by default", async ({
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
			nudgeEvents: JSON.parse(
				window.localStorage.getItem("adherence-nudge-events-v1") ?? "[]",
			) as Array<{ type?: string }>,
		};
	});
	expect(local.intentions).toHaveLength(2);
	expect(local.intentions?.[0]?.triggerLabel).toBe("After breakfast");
	expect(local.nudgeOptIn).toBe(false);
	expect(local.hasStreak).toBe(true);
	expect(local.nudgeEvents.every((event) => event.type === "evaluated")).toBe(
		true,
	);

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

test("guarded prompt needs local opt-in and announces without stealing focus", async ({
	page,
}) => {
	await page.clock.setFixedTime(new Date("2026-08-22T10:00:00.000Z"));
	await page.goto("/settings");
	const onboarding = page.getByTestId("implementation-intentions-onboarding");
	const add = onboarding.getByRole("button", { name: "Add a plan" });
	const optIn = onboarding.getByRole("checkbox", {
		name: "Show an occasional prompt inside this app when one of my time plans matches.",
	});
	await expect(optIn).not.toBeChecked();
	await optIn.check();
	await onboarding
		.getByRole("button", { name: "Save plans on this device" })
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
			name: "Your planned practice window is open",
		}),
	).toBeVisible();
	await expect(nudge.getByRole("status")).toContainText(
		"Would a small start be useful?",
	);
	expect(await page.evaluate(() => document.activeElement?.textContent)).toContain(
		"Add a plan",
	);
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

	await nudge.getByRole("button", { name: "Not now — no penalty" }).click();
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
	expect(events.every((event) => event.learningOutcome === "not-evaluated")).toBe(
		true,
	);
	expect(JSON.stringify(events)).not.toMatch(/triggerLabel|transcript|email|audio/i);
});
