"use client";

import type { Route } from "next";
import Link from "next/link";
import {
	ArrowRight,
	BookOpenCheck,
	Clock3,
	Gauge,
	MessagesSquare,
	Play,
	RefreshCw,
	Shuffle,
	type LucideIcon,
} from "lucide-react";
import { useAppStore } from "@/features/store/app-store";
import {
	buildDailyAutomaticityProgram,
	DAILY_SESSION_OPTIONS,
	type DailyAutomaticityBlock,
	type DailyAutomaticityBlockId,
} from "@/lib/adaptive-daily-plan";

const PROGRAM_CONTENT: Record<
	DailyAutomaticityBlockId,
	{
		readonly title: string;
		readonly description: string;
		readonly href: string;
		readonly icon: LucideIcon;
		readonly unitSingular: string;
		readonly unitPlural: string;
	}
> = {
	grammar: {
		title: "Grammar Lab",
		description: "Understand and retrieve today's target pattern.",
		href: "/grammar",
		icon: BookOpenCheck,
		unitSingular: "item",
		unitPlural: "items",
	},
	mixed_practice: {
		title: "Mixed Practice",
		description: "Mix old and new patterns without answer cues.",
		href: "/practice",
		icon: Shuffle,
		unitSingular: "item",
		unitPlural: "items",
	},
	conversation_studio: {
		title: "Conversation Studio",
		description: "Produce the target aloud in a real context.",
		href: "/studio?from=daily",
		icon: MessagesSquare,
		unitSingular: "round",
		unitPlural: "rounds",
	},
	review: {
		title: "Review & repair",
		description: "Retrieve due material and repair recurring errors.",
		href: "/errors",
		icon: RefreshCw,
		unitSingular: "item",
		unitPlural: "items",
	},
	automatization: {
		title: "Automatization Trainer",
		description: "Build speed with retrieval, shadowing, and transfer.",
		href: "/automatization",
		icon: Gauge,
		unitSingular: "round",
		unitPlural: "rounds",
	},
};

export function DailyAutomaticityProgram() {
	const { state, mutate } = useAppStore();
	const program = buildDailyAutomaticityProgram(
		state.settings.dailyStudyMinutes,
	);
	const pace =
		program.volumeMultiplier === 1
			? "Compact: the same quality gates are reached over more days."
			: program.volumeMultiplier === 2
				? "Balanced: twice the daily practice volume of the 15-minute route."
				: "Intensive: three times the daily practice volume of the 15-minute route.";
	const hrefForBlock = (block: DailyAutomaticityBlock, blockIndex: number) => {
		const content = PROGRAM_CONTENT[block.id];
		const params = new URLSearchParams({
			from: "daily",
			step: String(blockIndex + 1),
			session: String(program.sessionMinutes),
			minutes: String(block.minutes),
			units: String(block.practiceUnits),
		});
		return `${content.href}?${params.toString()}` as Route;
	};
	const firstBlock = program.blocks.find((block) => block.id === "grammar");

	return (
		<section
			aria-labelledby="daily-program-title"
			className="daily-auto-program"
		>
			<div className="daily-auto-program__header">
				<div>
					<span className="daily-auto-program__eyebrow">
						<Clock3 aria-hidden /> Adaptive daily program
					</span>
					<h2 dir="auto" id="daily-program-title">
						Choose your time, then follow all five steps
					</h2>
					<p dir="auto">
						Every duration includes grammar, mixed retrieval, conversation,
						review, and automatization. More time means more practice—not easier
						progress gates.
					</p>
				</div>
				<fieldset className="daily-auto-program__duration">
					<legend>Today&apos;s practice time</legend>
					<div>
						{DAILY_SESSION_OPTIONS.map((minutes) => (
							<button
								aria-pressed={program.sessionMinutes === minutes}
								key={minutes}
								onClick={() =>
									mutate((draft) => {
										draft.settings.dailyStudyMinutes = minutes;
									})
								}
								type="button"
							>
								{minutes} min
							</button>
						))}
					</div>
				</fieldset>
			</div>

			<p className="daily-auto-program__pace" dir="auto">
				<strong>
					{program.sessionMinutes} minutes · {program.volumeMultiplier}× daily
					volume.
				</strong>{" "}
				{pace}
			</p>

			<div className="daily-auto-program__route">
				<div>
					<strong dir="auto">One guided route, five required modules</strong>
					<span dir="auto">
						Follow the modules in order. Each card carries its own time and
						practice-volume target into the exercise.
					</span>
				</div>
				{firstBlock ? (
					<Link
						className="daily-auto-program__start"
						href={hrefForBlock(firstBlock, 0)}
					>
						<Play aria-hidden /> Start {program.sessionMinutes}-minute program
					</Link>
				) : null}
			</div>

			<ol className="daily-auto-program__grid">
				{program.blocks.map((block, index) => {
					const content = PROGRAM_CONTENT[block.id];
					const Icon = content.icon;
					return (
						<li key={block.id}>
							<Link href={hrefForBlock(block, index)}>
								<span className="daily-auto-program__number">{index + 1}</span>
								<span className="daily-auto-program__icon">
									<Icon aria-hidden />
								</span>
								<span className="daily-auto-program__copy">
									<span className="daily-auto-program__status" dir="auto">
										{index === 0 ? "Start here" : `Then · step ${index + 1}`}
									</span>
									<strong dir="auto">{content.title}</strong>
									<small dir="auto">{content.description}</small>
									<b dir="auto">
										{block.minutes} min · {block.practiceUnits}{" "}
										{block.practiceUnits === 1
											? content.unitSingular
											: content.unitPlural}
									</b>
								</span>
								<ArrowRight
									aria-hidden
									className="daily-auto-program__arrow"
								/>
							</Link>
						</li>
					);
				})}
			</ol>
		</section>
	);
}
