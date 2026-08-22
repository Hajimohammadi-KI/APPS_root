"use client";

import * as React from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import {
	IMPLEMENTATION_INTENTION_COPY,
	loadProfile,
	NUDGE_COPY,
	replaceImplementationIntentions,
	replaceNudgeOptIn,
	saveProfile,
	validateImplementationIntentions,
	type ImplementationIntention,
	type ImplementationIntentionAction,
	type ImplementationIntentionTrigger,
} from "@automaticity/learning-core";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const copy = IMPLEMENTATION_INTENTION_COPY.en;
const nudgeCopy = NUDGE_COPY.en;
const triggerOptions = Object.keys(
	copy.triggers,
) as ImplementationIntentionTrigger[];
const actionOptions = Object.keys(
	copy.actions,
) as ImplementationIntentionAction[];

function makeDraft(index: number): ImplementationIntention {
	return {
		id: `intention-${crypto.randomUUID()}`,
		trigger: "time",
		triggerLabel: index === 0 ? "18:00" : "08:00",
		action: "full_session",
		active: true,
	};
}

export function ImplementationIntentionsCard() {
	const [intentions, setIntentions] = React.useState<ImplementationIntention[]>(
		[],
	);
	const [ready, setReady] = React.useState(false);
	const [nudgeOptIn, setNudgeOptIn] = React.useState(false);
	const [status, setStatus] = React.useState("");

	React.useEffect(() => {
		const profile = loadProfile(window.localStorage, {
			now: new Date().toISOString(),
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
		});
		setIntentions(profile.intentions.map((intention) => ({ ...intention })));
		setNudgeOptIn(profile.nudgeOptIn);
		setReady(true);
	}, []);

	const validation = validateImplementationIntentions(intentions);

	function updateIntention(
		id: string,
		change: Partial<ImplementationIntention>,
	) {
		setStatus("");
		setIntentions((current) =>
			current.map((intention) =>
				intention.id === id ? { ...intention, ...change } : intention,
			),
		);
	}

	function addIntention() {
		setStatus("");
		setIntentions((current) =>
			current.length >= 5 ? current : [...current, makeDraft(current.length)],
		);
	}

	function saveIntentions() {
		if (!validation.valid) {
			setStatus(
				validation.code === "active-count" ? copy.countError : copy.labelError,
			);
			return;
		}
		const now = new Date().toISOString();
		const profile = loadProfile(window.localStorage, {
			now,
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
		});
		const intentionsNext = replaceImplementationIntentions(
			profile,
			intentions,
			now,
		);
		const next = replaceNudgeOptIn(intentionsNext, nudgeOptIn, now);
		try {
			saveProfile(window.localStorage, next);
		} catch {
			setStatus("This browser blocked local storage. Nothing was changed.");
			return;
		}
		setIntentions(next.intentions.map((intention) => ({ ...intention })));
		setStatus(
			`${copy.saved} ${nudgeOptIn ? nudgeCopy.savedOn : nudgeCopy.savedOff}`,
		);
	}

	return (
		<Card
			data-testid="implementation-intentions-onboarding"
			dir={copy.direction}
		>
			<CardHeader>
				<p className="settings-intention-eyebrow">{copy.eyebrow}</p>
				<CardTitle>
					<CalendarClock aria-hidden className="mr-2 inline size-5" />
					{copy.title}
				</CardTitle>
				<CardDescription>{copy.description}</CardDescription>
			</CardHeader>
			<CardContent className="settings-intentions">
				{intentions.length === 0 ? (
					<div className="settings-intentions-empty">
						<p>No plan is configured. Daily practice works normally.</p>
						<Button onClick={() => setStatus(copy.skipped)} variant="outline">
							{copy.skip}
						</Button>
					</div>
				) : null}

				{intentions.map((intention, index) => (
					<fieldset className="settings-intention" key={intention.id}>
						<legend>Plan {index + 1}</legend>
						<div className="settings-intention-fields">
							<label>
								<span>{copy.trigger}</span>
								<select
									aria-label={`${copy.trigger} ${index + 1}`}
									onChange={(event) => {
										const trigger = event.target
											.value as ImplementationIntentionTrigger;
										updateIntention(intention.id, {
											trigger,
											triggerLabel: trigger === "time" ? "18:00" : "",
										});
									}}
									value={intention.trigger}
								>
									{triggerOptions.map((trigger) => (
										<option key={trigger} value={trigger}>
											{copy.triggers[trigger]}
										</option>
									))}
								</select>
							</label>
							<label>
								<span>{copy.triggerValue}</span>
								<input
									aria-label={`${copy.triggerValue} ${index + 1}`}
									dir="auto"
									maxLength={120}
									onChange={(event) =>
										updateIntention(intention.id, {
											triggerLabel: event.target.value,
										})
									}
									type={intention.trigger === "time" ? "time" : "text"}
									value={intention.triggerLabel}
								/>
							</label>
							<label>
								<span>{copy.action}</span>
								<select
									aria-label={`${copy.action} ${index + 1}`}
									onChange={(event) =>
										updateIntention(intention.id, {
											action: event.target
												.value as ImplementationIntentionAction,
										})
									}
									value={intention.action}
								>
									{actionOptions.map((action) => (
										<option key={action} value={action}>
											{copy.actions[action]}
										</option>
									))}
								</select>
							</label>
						</div>
						<div className="settings-intention-actions">
							<label className="settings-intention-active">
								<input
									checked={intention.active}
									onChange={(event) =>
										updateIntention(intention.id, {
											active: event.target.checked,
										})
									}
									type="checkbox"
								/>
								{copy.active}
							</label>
							<Button
								onClick={() => {
									setIntentions((current) =>
										current.filter(
											(candidate) => candidate.id !== intention.id,
										),
									);
									setStatus("");
								}}
								type="button"
								variant="ghost"
							>
								<Trash2 aria-hidden className="size-4" />
								{copy.remove}
							</Button>
						</div>
					</fieldset>
				))}

				<p className="settings-intention-privacy">{copy.privacy}</p>
				<section
					className="settings-nudge-consent"
					aria-labelledby="nudge-settings-title-en"
				>
					<h3 id="nudge-settings-title-en">{nudgeCopy.settingsTitle}</h3>
					<label className="settings-toggle">
						<input
							checked={nudgeOptIn}
							onChange={(event) => {
								setNudgeOptIn(event.target.checked);
								setStatus("");
							}}
							type="checkbox"
						/>
						<span>
							<strong>{nudgeCopy.optInLabel}</strong>
							<small>{nudgeCopy.policy}</small>
						</span>
					</label>
				</section>
				{!validation.valid ? (
					<p className="settings-intention-error">
						{validation.code === "active-count"
							? copy.countError
							: copy.labelError}
					</p>
				) : null}
				<div className="settings-export-actions">
					<Button
						disabled={!ready || intentions.length >= 5}
						onClick={addIntention}
						variant="outline"
					>
						<Plus aria-hidden className="size-4" />
						{copy.add}
					</Button>
					<Button
						disabled={!ready || !validation.valid}
						onClick={saveIntentions}
					>
						{copy.save}
					</Button>
				</div>
				{status ? (
					<p
						aria-live="polite"
						className="settings-export-status"
						role="status"
					>
						{status}
					</p>
				) : null}
			</CardContent>
		</Card>
	);
}
