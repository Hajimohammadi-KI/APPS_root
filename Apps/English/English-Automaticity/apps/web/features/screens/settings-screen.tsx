"use client";

import * as React from "react";
import { captureCompleteBackup, validateCompleteBackup, restoreCompleteBackup } from "@automaticity/learning-core/automaticity";
import Link from "next/link";
import {
	Download,
	Eye,
	House,
	PenLine,
	ShieldCheck,
	Trash2,
	Upload,
	Wand2,
} from "lucide-react";
import {
	buildPrivacySafeMeasurementExport,
	captureMeasurementBaseline,
	deleteLocalMeasurementData,
	enforceMeasurementRetention,
	grantMeasurementConsent,
	normalizeDailySessionMinutes,
	parseLearningDataExport,
	readLearningEvidenceLedger,
	readMeasurementBaseline,
	readMeasurementConsent,
	revokeMeasurementConsent,
	validatePrivacySafeMeasurementExport,
	type MeasurementBaseline,
	type MeasurementConsent,
} from "@automaticity/learning-core";
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
import { ImplementationIntentionsCard } from "@/features/settings/implementation-intentions-card";

const TEXT_SCALE_OPTIONS: Array<{
	value: Settings["textScale"];
	label: string;
	hint: string;
}> = [
	{ value: 100, label: "100%", hint: "Default text size" },
	{ value: 112, label: "112%", hint: "Larger, easier-to-track text" },
	{ value: 125, label: "125%", hint: "Largest text for maximum ease" },
];

const MEASUREMENT_APP_VERSION = "27.3.13";
const MEASUREMENT_FILE_NAME = "automaticity-measurement-en.json";

export function SettingsScreen() {
	const { state, mutate } = useAppStore();
	const { settings } = state;
	const [exportStatus, setExportStatus] = React.useState("");
	const [importStatus, setImportStatus] = React.useState("");
	const [exporting, setExporting] = React.useState(false);
	const importInputRef = React.useRef<HTMLInputElement>(null);
	const [folderPickerSupported, setFolderPickerSupported] =
		React.useState(false);
	const [measurementConsent, setMeasurementConsent] =
		React.useState<MeasurementConsent | null>(null);
	const [measurementBaseline, setMeasurementBaseline] =
		React.useState<MeasurementBaseline | null>(null);
	const [measurementStatus, setMeasurementStatus] = React.useState("");

	React.useEffect(() => {
		// This browser-only capability must be detected after hydration.
		setFolderPickerSupported(supportsBackupDirectoryPicker());
		enforceMeasurementRetention(window.localStorage, new Date().toISOString());
		setMeasurementConsent(readMeasurementConsent(window.localStorage));
		setMeasurementBaseline(readMeasurementBaseline(window.localStorage));
	}, []);

	function updateMeasurementConsent(checked: boolean) {
		const now = new Date().toISOString();
		if (!checked) {
			const revoked = revokeMeasurementConsent(window.localStorage, now);
			setMeasurementConsent(revoked);
			setMeasurementStatus(
				"Consent revoked. No measurement export can be created unless you opt in again.",
			);
			return;
		}

		const participantId =
			measurementConsent?.participantId ?? `participant-${crypto.randomUUID()}`;
		const consent = grantMeasurementConsent(window.localStorage, {
			id: `consent-${crypto.randomUUID()}`,
			participantId,
			grantedAt: now,
		});
		const baselineResult = captureMeasurementBaseline(window.localStorage, {
			id: `baseline-${crypto.randomUUID()}`,
			capturedAt: now,
			language: "en",
			appVersion: MEASUREMENT_APP_VERSION,
			sessionMinutes: normalizeDailySessionMinutes(settings.dailyStudyMinutes),
			interventionFlags: {
				experimentalScheduling: false,
				aiIntervention: false,
			},
			ledger: readLearningEvidenceLedger(window.localStorage),
		});
		setMeasurementConsent(consent);
		if (baselineResult.status === "captured") {
			setMeasurementBaseline(baselineResult.baseline);
			setMeasurementStatus(
				baselineResult.reused
					? "Consent granted. Your existing pre-intervention baseline remains active."
					: "Consent granted and a pre-intervention baseline was captured locally.",
			);
		} else {
			setMeasurementStatus(
				"Consent was saved, but the baseline could not be captured before an intervention.",
			);
		}
	}

	function exportMeasurementData() {
		const result = buildPrivacySafeMeasurementExport({
			language: "en",
			appVersion: MEASUREMENT_APP_VERSION,
			exportedAt: new Date().toISOString(),
			storage: window.localStorage,
			ledger: readLearningEvidenceLedger(window.localStorage),
		});
		if (result.status !== "ready") {
			setMeasurementStatus(
				result.reason === "consent-required"
					? "Opt in before creating a measurement export."
					: "Capture a baseline before creating a measurement export.",
			);
			return;
		}
		const quality = validatePrivacySafeMeasurementExport(
			result.data,
			new Date().toISOString(),
		);
		if (quality.status === "failed") {
			setMeasurementStatus(
				"Export stopped because the privacy or data-quality checks failed.",
			);
			return;
		}
		downloadJson(MEASUREMENT_FILE_NAME, result.data);
		setMeasurementStatus(
			quality.status === "insufficient-data"
				? "Privacy-safe export downloaded. Learning outcomes are N/A because the sample is still empty."
				: `Privacy-safe export downloaded with ${quality.sampleSize} learning outcome(s).`,
		);
	}

	function deleteMeasurementData() {
		if (
			!window.confirm(
				"Delete the local measurement consent and baseline? Your learning progress and private backups will not be deleted.",
			)
		) {
			return;
		}
		deleteLocalMeasurementData(window.localStorage);
		setMeasurementConsent(null);
		setMeasurementBaseline(null);
		setMeasurementStatus(
			"Local measurement consent and baseline deleted. Learning progress was kept.",
		);
	}


  async function exportData() {
    setExporting(true); setExportStatus("");
    let contents: string | null = null;
    try {
      const backup = await captureCompleteBackup({storage: localStorage, indexedDB}, "en", new Date().toISOString(), [["grammar-automaticity:v27", JSON.stringify(state)]]);
      contents = JSON.stringify(backup, null, 2);
      const directory = supportsBackupDirectoryPicker() ? await getBackupDirectory() : null;
      if (directory) { await writeBackupToDirectory(directory, contents); setExportStatus(`Complete backup saved to "${directory.name}".`); }
      else { downloadBackup(contents); setExportStatus(`Complete backup downloaded as "${BACKUP_FILE_NAME}".`); }
    } catch (error) {
      if (contents !== null && error instanceof DOMException && ["AbortError", "SecurityError"].includes(error.name)) {
        downloadBackup(contents); setExportStatus("Folder access was unavailable. The complete backup was downloaded instead.");
      } else setExportStatus(error instanceof Error ? error.message : "Backup export failed.");
    } finally { setExporting(false); }
  }

	async function selectFolderAndExport() {
		try {
			await chooseBackupDirectory();
		} catch {
			// A normal download remains available if the chooser is cancelled.
		}
		await exportData();
	}


  async function importData(event: React.ChangeEvent<HTMLInputElement>) {
    const input=event.currentTarget, file=input.files?.[0]; if(!file)return;
    setImportStatus("");
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const legacy = parseLearningDataExport<typeof state>(parsed, "en");
      const persistence = {storage: localStorage, indexedDB};
      const backup = legacy
        ? await captureCompleteBackup(persistence, "en", legacy.exportedAt, [["grammar-automaticity:v27", JSON.stringify(legacy.learnerState)], ["automaticity:learning-evidence:v1", JSON.stringify(legacy.learningEvidence)]])
        : await validateCompleteBackup(parsed, "en");
      const message = "Close other app tabs before restoring. Replace local learning data with this backup? A recovery copy protects against interruption. The file stays on this device.";
      const legacyNote = legacy ? " This older backup contains no recordings. Existing recordings on this device will be kept." : "";
      if(!window.confirm(message + legacyNote)) {setImportStatus("Restore cancelled. Your current data was kept.");return;}
      await restoreCompleteBackup(persistence, backup, "en");
      window.location.reload();
    } catch(error) {setImportStatus(error instanceof Error ? error.message : "Restore failed. Reopen the app to recover an interrupted restore.");}
    finally {input.value="";}
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

			<ImplementationIntentionsCard />

			<Card>
				<CardHeader>
					<CardTitle>
						<ShieldCheck aria-hidden className="mr-2 inline size-5" />
						Optional effectiveness measurement
					</CardTitle>
					<CardDescription>
						A separate, revocable research export for evaluating speaking and
						writing outcomes. Nothing is uploaded automatically.
					</CardDescription>
				</CardHeader>
				<CardContent className="settings-section">
					<div className="settings-row">
						<span>Purpose and consent</span>
						<label className="settings-toggle">
							<input
								checked={measurementConsent?.status === "granted"}
								onChange={(event) =>
									updateMeasurementConsent(event.target.checked)
								}
								type="checkbox"
							/>
							<span>
								<strong>I consent to optional effectiveness measurement</strong>
								<small>
									Included: a random local participant ID, event/evidence IDs,
									timestamps, versions, scores, gates, and human-rating
									provenance if a human rating exists. Excluded: response text,
									transcripts, audio, email, hardware IDs, and free-form
									intentions.
								</small>
							</span>
						</label>
					</div>
					<div className="settings-row">
						<span>Retention and baseline</span>
						<div className="settings-measurement-summary">
							<p>
								Stored only on this device for up to 365 days; transfer happens
								only when you download a file. Revocation stops export.
							</p>
							<p>
								Baseline: {measurementBaseline ? "captured" : "not captured"}.
								Cohort statistics: N/A — no production telemetry is connected.
							</p>
						</div>
					</div>
					<div className="settings-export-actions">
						<Button
							disabled={
								measurementConsent?.status !== "granted" || !measurementBaseline
							}
							onClick={exportMeasurementData}
						>
							<Download aria-hidden className="size-4" />
							Download privacy-safe measurement
						</Button>
						<Button
							disabled={!measurementConsent && !measurementBaseline}
							onClick={deleteMeasurementData}
							variant="outline"
						>
							<Trash2 aria-hidden className="size-4" />
							Delete measurement data
						</Button>
					</div>
					{measurementStatus ? (
						<p
							aria-live="polite"
							className="settings-export-status"
							role="status"
						>
							{measurementStatus}
						</p>
					) : null}
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
										draft.settings.spellingAffectsMastery =
											event.target.checked;
									})
								}
								type="checkbox"
							/>
							<span>
								<strong>Require correct spelling for grammar mastery</strong>
								<small>
									Off by default; enable it only for a spelling goal.
								</small>
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
						Keep a private copy of your progress and move it back to this app
						when you need it.
					</CardDescription>
				</CardHeader>
				<CardContent className="settings-section">
					<div className="settings-backup-guide">
						<article>
							<strong>1. Export a copy</strong>
							<span>
								Downloads your saved progress, answers, and evidence as one JSON
								backup file.
							</span>
						</article>
						<article>
							<strong>2. Keep it local</strong>
							<span>
								The file stays in the folder you choose on your device. This app
								does not upload it to a cloud service.
							</span>
						</article>
						<article>
							<strong>3. Import to restore</strong>
							<span>
								Choose that file later. You can review a confirmation before it
								replaces progress on this device.
							</span>
						</article>
					</div>
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
						<Button
							onClick={() => importInputRef.current?.click()}
							variant="outline"
						>
							<Upload aria-hidden className="size-4" />
							Import a backup
						</Button>
						<input
							accept="application/json,.json"
							aria-label="Choose an English Automaticity backup file"
							hidden
							onChange={(event) => void importData(event)}
							ref={importInputRef}
							type="file"
						/>
					</div>
					{exportStatus ? (
						<p
							aria-live="polite"
							className="settings-export-status"
							role="status"
						>
							{exportStatus}
						</p>
					) : null}
					{importStatus ? (
						<p aria-live="polite" className="settings-export-status" role="status">
							{importStatus}
						</p>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}

function downloadJson(fileName: string, data: unknown) {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = fileName;
	anchor.click();
	URL.revokeObjectURL(url);
}
