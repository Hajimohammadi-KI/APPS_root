"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Eye, House, PenLine, Wand2 } from "lucide-react";
import { buildLearningDataExport } from "@automaticity/learning-core";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAppStore, type Settings } from "@/features/store/app-store";
import {
	BACKUP_FILE_NAME,
	chooseBackupDirectory,
	downloadBackup,
	getBackupDirectory,
	supportsBackupDirectoryPicker,
	writeBackupToDirectory,
} from "@/lib/backup-directory";

const TEXT_SCALE_OPTIONS: Array<{
	value: Settings["textScale"];
	label: string;
	hint: string;
}> = [
	{ value: 100, label: "100%", hint: "Default text size" },
	{ value: 112, label: "112%", hint: "Larger, easier-to-track text" },
	{ value: 125, label: "125%", hint: "Largest text for maximum ease" },
];

export function SettingsScreen() {
	const { state, mutate } = useAppStore();
	const { settings } = state;
	const [exportStatus, setExportStatus] = React.useState("");
	const [exporting, setExporting] = React.useState(false);
	const [folderPickerSupported, setFolderPickerSupported] =
		React.useState(false);

	React.useEffect(() => {
		// This browser-only capability must be detected after hydration.
		setFolderPickerSupported(supportsBackupDirectoryPicker());
	}, []);

	async function exportData() {
		setExporting(true);
		setExportStatus("");
		// Keep the legacy learner state and normalized evidence ledger together.
		// A backup that omits responses/evidence/events is not a truthful export.
		const contents = JSON.stringify(
			buildLearningDataExport({
				language: "en",
				exportedAt: new Date().toISOString(),
				learnerState: state,
				storage: window.localStorage,
			}),
			null,
			2,
		);

		try {
			const savedDirectory = supportsBackupDirectoryPicker()
				? await getBackupDirectory()
				: null;
			if (savedDirectory) {
				await writeBackupToDirectory(savedDirectory, contents);
				setExportStatus(`Backup saved to "${savedDirectory.name}".`);
			} else {
				downloadBackup(contents);
				setExportStatus(`Backup downloaded as "${BACKUP_FILE_NAME}".`);
			}
		} catch (error) {
			if (
				error instanceof DOMException &&
				(error.name === "AbortError" || error.name === "SecurityError")
			) {
				downloadBackup(contents);
				setExportStatus(
					"Folder access was unavailable, so the backup was downloaded instead.",
				);
			} else {
				setExportStatus(
					error instanceof Error ? error.message : "Backup export failed.",
				);
			}
		} finally {
			setExporting(false);
		}
	}

	async function selectFolderAndExport() {
		try {
			await chooseBackupDirectory();
		} catch {
			// A normal download remains available if the chooser is cancelled.
		}
		await exportData();
	}

	return (
		<div className="page-stack settings-screen">
			<div className="page-heading settings-heading">
				<div>
					<h1>Settings</h1>
					<p>
						Reading, focus, grammar-accuracy, and local backup preferences.
						 Changes apply immediately and stay on this device.
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href="/">
						<House aria-hidden className="size-4" />
						Back to Home
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>
						<Eye aria-hidden className="mr-2 inline size-5" />
						Reading &amp; focus
					</CardTitle>
					<CardDescription>
						ADHD- and dyslexia-friendly support that any learner can adjust.
					</CardDescription>
				</CardHeader>
				<CardContent className="settings-section">
					<fieldset className="settings-row">
						<legend>Reading style</legend>
						<div className="settings-choice-group">
							{(["standard", "dyslexia"] as const).map((profile) => (
								<label className="settings-choice" key={profile}>
									<input
										checked={settings.readingProfile === profile}
										name="reading-profile"
										onChange={() =>
											mutate((draft) => {
												draft.settings.readingProfile = profile;
											})
										}
										type="radio"
									/>
									<span>
										<strong>
											{profile === "standard"
												? "Standard reading"
												: "Dyslexia-friendly reading"}
										</strong>
										<small>
											{profile === "standard"
												? "The regular font and spacing."
												: "Wider spacing and taller lines."}
										</small>
									</span>
								</label>
							))}
						</div>
					</fieldset>

					<fieldset className="settings-row">
						<legend>Text size</legend>
						<div className="settings-choice-group">
							{TEXT_SCALE_OPTIONS.map((option) => (
								<label className="settings-choice" key={option.value}>
									<input
										checked={settings.textScale === option.value}
										name="text-scale"
										onChange={() =>
											mutate((draft) => {
												draft.settings.textScale = option.value;
											})
										}
										type="radio"
									/>
									<span>
										<strong>{option.label}</strong>
										<small>{option.hint}</small>
									</span>
								</label>
							))}
						</div>
					</fieldset>

					<div className="settings-row">
						<span>Motion &amp; visual intensity</span>
						<label className="settings-toggle">
							<input
								checked={settings.lowStimulation}
								onChange={(event) =>
									mutate((draft) => {
										draft.settings.lowStimulation = event.target.checked;
									})
								}
								type="checkbox"
							/>
							<span>
								<strong>Reduce motion and visual intensity</strong>
								<small>Reduces animation, decoration, and shadows.</small>
							</span>
						</label>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>
						<PenLine aria-hidden className="mr-2 inline size-5" />
						Grammar accuracy
					</CardTitle>
					<CardDescription>
						Spelling feedback remains visible without silently blocking grammar
						 mastery.
					</CardDescription>
				</CardHeader>
				<CardContent className="settings-section">
					<div className="settings-row">
						<span>Spelling and mastery</span>
						<label className="settings-toggle">
							<input
								checked={settings.spellingAffectsMastery}
								onChange={(event) =>
									mutate((draft) => {
										draft.settings.spellingAffectsMastery = event.target.checked;
									})
								}
								type="checkbox"
							/>
							<span>
								<strong>Require correct spelling for grammar mastery</strong>
								<small>Off by default; enable it only for a spelling goal.</small>
							</span>
						</label>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>
						<Wand2 aria-hidden className="mr-2 inline size-5" />
						Online grammar check
					</CardTitle>
					<CardDescription>
						Optional online evaluation; practice remains available offline.
					</CardDescription>
				</CardHeader>
				<CardContent className="settings-section">
					<div className="settings-row">
						<span>Online feedback</span>
						<label className="settings-toggle">
							<input
								checked={settings.onlineFeedback}
								onChange={(event) =>
									mutate((draft) => {
										draft.settings.onlineFeedback = event.target.checked;
									})
								}
								type="checkbox"
							/>
							<span>
								<strong>Allow optional online grammar checks</strong>
								<small>Off by default; local practice still works.</small>
							</span>
						</label>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>
						<Download aria-hidden className="mr-2 inline size-5" />
						Backup your progress
					</CardTitle>
					<CardDescription>
						Export learner state together with versioned responses, evidence,
						 and domain events.
					</CardDescription>
				</CardHeader>
				<CardContent className="settings-section">
					<div className="settings-export-actions">
						<Button disabled={exporting} onClick={() => void exportData()}>
							<Download aria-hidden className="size-4" />
							{exporting ? "Exporting..." : "Export data"}
						</Button>
						{folderPickerSupported ? (
							<Button
								disabled={exporting}
								onClick={() => void selectFolderAndExport()}
								variant="outline"
							>
								Choose backup folder
							</Button>
						) : null}
					</div>
					{exportStatus ? (
						<p aria-live="polite" className="settings-export-status" role="status">
							{exportStatus}
						</p>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}
