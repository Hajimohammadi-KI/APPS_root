"use client";

import * as React from "react";
import { deleteCompleteLearnerData } from "@automaticity/learning-core/automaticity";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const CONFIRMATION = "DELETE";

/** Deletes everything a complete backup covers, only after a backup (or the
 * explicit choice to skip it) and the typed confirmation word. */
export function DeleteAllDataCard({
	onExport,
}: {
	onExport: () => Promise<boolean>;
}) {
	const [backedUp, setBackedUp] = React.useState(false);
	const [skipBackup, setSkipBackup] = React.useState(false);
	const [typed, setTyped] = React.useState("");
	const [status, setStatus] = React.useState("");
	const [busy, setBusy] = React.useState(false);
	const ready =
		(backedUp || skipBackup) && typed.trim() === CONFIRMATION && !busy;

	async function backup() {
		setBusy(true);
		try {
			setBackedUp(await onExport());
		} finally {
			setBusy(false);
		}
	}

	async function remove() {
		if (!ready) return;
		setBusy(true);
		setStatus("Deleting your data on this device…");
		try {
			await deleteCompleteLearnerData(
				{ storage: localStorage, indexedDB },
				"en",
			);
			setStatus("All your data in this app was deleted. The app restarts empty.");
			window.location.replace("/");
		} catch (error) {
			setStatus(
				error instanceof Error
					? error.message
					: "The deletion stopped. Your learning progress was not deleted.",
			);
			setBusy(false);
		}
	}

	return (
		<Card data-delete-all-data>
			<CardHeader>
				<CardTitle>
					<Trash2 aria-hidden className="mr-2 inline size-5" />
					Delete all my data
				</CardTitle>
				<CardDescription>
					Removes your progress, answers, recordings, and settings of this app
					from this device. The app keeps nothing on a server. Withdraw any
					comment you sent first: its receipt is deleted too.
				</CardDescription>
			</CardHeader>
			<CardContent className="settings-section">
				<div className="settings-export-actions">
					<Button
						disabled={busy || backedUp}
						onClick={() => void backup()}
						variant="outline"
					>
						{backedUp ? "Backup downloaded" : "1. Download a backup first"}
					</Button>
					<label>
						<input
							checked={skipBackup}
							disabled={busy}
							onChange={(event) => setSkipBackup(event.target.checked)}
							type="checkbox"
						/>{" "}
						Delete without a backup
					</label>
				</div>
				<label className="settings-export-actions">
					2. Type {CONFIRMATION} to confirm
					<input
						autoComplete="off"
						className="rounded-md border px-2 py-1"
						disabled={busy}
						onChange={(event) => setTyped(event.target.value)}
						spellCheck={false}
						value={typed}
					/>
				</label>
				<div className="settings-export-actions">
					<Button
						disabled={!ready}
						onClick={() => void remove()}
						variant="destructive"
					>
						<Trash2 aria-hidden className="size-4" />
						3. Delete all my data
					</Button>
				</div>
				<p className="settings-export-status" role="status">
					{status}
				</p>
			</CardContent>
		</Card>
	);
}
