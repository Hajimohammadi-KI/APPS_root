"use client";

import {
	Activity,
	ArrowRight,
	CalendarCheck2,
	FlaskConical,
	ShieldCheck,
	TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildEnglishEvidence, useAppStore } from "@/features/store/app-store";
import { todayKey } from "@/lib/utils";

function dayDifference(from: string, to: string) {
	const fromDate = new Date(`${from}T12:00:00`);
	const toDate = new Date(`${to}T12:00:00`);
	return Math.floor((toDate.valueOf() - fromDate.valueOf()) / 86_400_000);
}

function mean(values: number[]) {
	return values.length
		? Math.round(
				values.reduce((total, value) => total + value, 0) / values.length,
			)
		: null;
}

export function EffectivenessPanel({
	navigate,
}: {
	navigate: (screen: string) => void;
}) {
	const { state } = useAppStore();
	const evidence = buildEnglishEvidence(state);
	const today = todayKey();
	const thisWeek = evidence.dailyActivity.filter((row) => {
		const days = dayDifference(row.date, today);
		return days >= 0 && days < 7;
	});
	const activeDays = thisWeek.filter((row) => row.practiceCount > 0).length;
	const productiveSamples = thisWeek.reduce(
		(total, row) =>
			total + row.speakingSamples + row.writingSamples + row.spontaneousSamples,
		0,
	);
	const scoredDays = evidence.dailyActivity.filter(
		(row) => row.averageScore !== null,
	);
	const baseline = mean(
		scoredDays
			.slice(0, 3)
			.flatMap((row) => (row.averageScore === null ? [] : [row.averageScore])),
	);
	const recent = mean(
		scoredDays
			.slice(-3)
			.flatMap((row) => (row.averageScore === null ? [] : [row.averageScore])),
	);
	const trend = baseline === null || recent === null ? null : recent - baseline;
	const outcomeGain =
		state.outcomes.baselineScore === null ||
		state.outcomes.followupScore === null
			? null
			: state.outcomes.followupScore - state.outcomes.baselineScore;
	const lastActiveDate = evidence.dailyActivity
		.filter((row) => row.practiceCount > 0)
		.at(-1)?.date;
	const daysAway = lastActiveDate ? dayDifference(lastActiveDate, today) : null;
	const dueReviews = state.reviews.filter(
		(review) => review.status === "pending" && review.dueAt <= Date.now(),
	).length;
	const returning = daysAway !== null && daysAway >= 2;
	const sessionTarget = returning ? 2 : 3;
	const recommendation = returning
		? "Return gently: complete the first two steps, then add one short coached answer."
		: dueReviews >= 4
			? `Start with one grammar check, then clear due reviews before coaching.`
			: "Use all three steps: Grammar, Read aloud, and Coach conversation.";

	return (
		<section
			aria-labelledby="effectiveness-title"
			className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6"
		>
			<div className="flex flex-col gap-5 xl:flex-row xl:items-start">
				<div className="min-w-0 flex-1">
					<p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-primary">
						<FlaskConical aria-hidden className="size-4" />
						Measurable learning
					</p>
					<h2 className="mt-2 text-xl font-extrabold" id="effectiveness-title">
						Evidence over streaks alone
					</h2>
					<p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
						These privacy-friendly app metrics show practice and change over
						time, but they do not replace an independent CEFR certificate.
					</p>
					<dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<EvidenceMetric
							icon={CalendarCheck2}
							label="Active days this week"
							value={`${activeDays}/5`}
						/>
						<EvidenceMetric
							icon={Activity}
							label="Productive samples"
							value={String(productiveSamples)}
						/>
						<EvidenceMetric
							icon={TrendingUp}
							label="Outcome change"
							value={
								outcomeGain === null
									? trend === null
										? "Missing baseline"
										: `${trend >= 0 ? "+" : ""}${trend} app points`
									: `${outcomeGain >= 0 ? "+" : ""}${outcomeGain} rubric points`
							}
						/>
						<EvidenceMetric
							icon={ShieldCheck}
							label="Independent rating"
							value={
								state.outcomes.independentlyRated
									? state.outcomes.retentionScore === null
										? "Rated · retention due"
										: "Rated + retained"
									: "Not captured"
							}
						/>
					</dl>
				</div>
				<aside className="w-full rounded-2xl border border-primary/15 bg-primary/5 p-4 xl:max-w-sm">
					<p className="text-xs font-extrabold uppercase tracking-wider text-primary">
						Adaptive session · {sessionTarget} of 3 steps
					</p>
					<h3 className="mt-2 font-extrabold">
						{returning
							? "Return plan"
							: dueReviews >= 4
								? "Retention-first plan"
								: "Balanced plan"}
					</h3>
					<p className="mt-2 text-sm leading-6 text-muted-foreground">
						{recommendation}
					</p>
					<Button
						className="mt-4 w-full"
						onClick={() =>
							navigate(state.learner.selfDeclaredLevel ? "daily" : "settings")
						}
					>
						{state.learner.selfDeclaredLevel
							? "Start recommended session"
							: "Choose my level"}
						<ArrowRight aria-hidden className="size-4" />
					</Button>
				</aside>
			</div>

			<div className="mt-5 rounded-2xl border bg-background p-4">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-xs font-extrabold uppercase tracking-wider text-primary">
							Adaptive 15/30/45/60-minute daily protocol
						</p>
						<h3 className="mt-1 font-extrabold">
							Scientific pacing for automaticity
						</h3>
					</div>
					<p className="text-sm text-muted-foreground">
						This is the target routine for steady progress, not a guarantee.
					</p>
				</div>
				<div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
					{[
						["Grammar", "6 min", "Write one original sentence in context."],
						["Read aloud", "10 min", "Read or record the corrected sentence."],
						[
							"Coach conversation",
							"14 min",
							"Answer once and submit for feedback.",
						],
					].map(([title, minutes, description]) => (
						<div key={title} className="rounded-xl border bg-card p-3 text-sm">
							<strong className="block">{title}</strong>
							<span className="block text-xs font-semibold text-primary">
								{minutes}
							</span>
							<span className="mt-1 block text-xs leading-5 text-muted-foreground">
								{description}
							</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function EvidenceMetric({
	icon: Icon,
	label,
	value,
}: {
	icon: typeof Activity;
	label: string;
	value: string;
}) {
	return (
		<div className="min-w-0 rounded-2xl border bg-background p-4">
			<Icon aria-hidden className="size-4 text-primary" />
			<dt className="mt-3 text-xs font-bold text-muted-foreground">{label}</dt>
			<dd className="mt-1 break-words text-base font-extrabold">{value}</dd>
		</div>
	);
}
