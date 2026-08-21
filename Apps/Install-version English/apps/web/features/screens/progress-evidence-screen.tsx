"use client";

import {
	Activity,
	CircleAlert,
	Mic2,
	PenLine,
	Repeat2,
	ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/features/store/app-store";

const PRODUCTIVE_MODES = ["speaking", "writing", "transfer", "repair"] as const;

export function ProgressEvidenceScreen() {
	const { state } = useAppStore();
	const verified = state.attempts.filter(
		(attempt) => attempt.verified === true,
	);
	const automaticTopics = Object.values(state.mastery).filter(
		(mastery) => mastery.status === "automatic",
	).length;
	const activeErrors = state.errors.filter(
		(error) => error.repairStatus !== "fixed",
	).length;
	const dueReviews = state.reviews.filter(
		(review) => review.status === "pending" && review.dueAt <= Date.now(),
	).length;
	const rows = PRODUCTIVE_MODES.map((mode) => ({
		mode,
		count: verified.filter((attempt) => attempt.mode === mode).length,
	}));
	const maximum = Math.max(1, ...rows.map((row) => row.count));

	return (
		<div className="page-stack">
			<header className="rounded-3xl border border-violet-200 bg-gradient-to-br from-white via-violet-50/70 to-blue-50/70 p-5 shadow-sm sm:p-7">
				<Badge>Measured learning evidence</Badge>
				<h1 className="mt-3 text-3xl font-black tracking-tight">
					Progress &amp; evidence
				</h1>
				<p className="mt-2 max-w-3xl text-muted-foreground">
					This page separates completed practice from verified production,
					delayed review, and automatic use. It does not repeat today’s mission.
				</p>
			</header>

			<section
				aria-label="Progress summary"
				className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
			>
				<EvidenceMetric
					icon={ShieldCheck}
					label="Verified attempts"
					value={verified.length}
				/>
				<EvidenceMetric
					icon={Activity}
					label="Automatic topics"
					value={automaticTopics}
				/>
				<EvidenceMetric icon={Repeat2} label="Reviews due" value={dueReviews} />
				<EvidenceMetric
					icon={CircleAlert}
					label="Active errors"
					value={activeErrors}
				/>
			</section>

			<div className="grid gap-4 xl:grid-cols-[1.35fr_.85fr]">
				<Card className="analytics-card">
					<CardHeader>
						<CardTitle>Verified productive evidence</CardTitle>
						<p className="text-sm text-muted-foreground">
							Only attempts explicitly marked as verified are counted.
						</p>
					</CardHeader>
					<CardContent>
						<div
							aria-label="Verified attempts by productive mode"
							className="analytics-bars"
							role="img"
						>
							{rows.map((row) => (
								<div className="analytics-bar-row" key={row.mode}>
									<div>
										<strong className="capitalize">{row.mode}</strong>
										<span>{row.count}</span>
									</div>
									<div className="analytics-bar-track">
										<span
											style={{ width: `${(row.count / maximum) * 100}%` }}
										/>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card className="analytics-card">
					<CardHeader>
						<CardTitle>What these numbers prove</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-3 text-sm leading-6 text-muted-foreground">
						<p className="flex gap-2">
							<Mic2
								aria-hidden
								className="mt-1 size-4 shrink-0 text-violet-700"
							/>
							Speaking evidence requires a saved attempt and independent
							checking.
						</p>
						<p className="flex gap-2">
							<PenLine
								aria-hidden
								className="mt-1 size-4 shrink-0 text-violet-700"
							/>
							Writing, transfer, and repair remain separate evidence dimensions.
						</p>
						<p>
							External CEFR certification and long-term outcome claims remain
							N/A until independently measured.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function EvidenceMetric({
	icon: Icon,
	label,
	value,
}: {
	icon: typeof Activity;
	label: string;
	value: number;
}) {
	return (
		<Card className="analytics-card">
			<CardContent className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 pt-5">
				<Icon
					aria-hidden
					className="row-span-2 size-10 rounded-xl bg-violet-100 p-2 text-violet-700"
				/>
				<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
					{label}
				</span>
				<strong className="text-2xl tabular-nums">{value}</strong>
			</CardContent>
		</Card>
	);
}
