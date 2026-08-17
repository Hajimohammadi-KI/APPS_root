"use client";

import * as React from "react";
import { grammarUnits, type CefrLevel } from "@grammar/content";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AutomaticityScreen } from "@/features/screens/automaticity-screen";
import { useAppStore } from "@/features/store/app-store";

const CEFR_ORDER: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

// The Mission renders one step at a time and already accepts a `focusedStep`
// prop (undefined = the full Mission with its overview cards). Exposing those
// steps as rows here means picking a unit and a practice mode is one gesture
// instead of "select unit, scroll, then hunt for the right step".
const PRACTICE_MODES: readonly {
	readonly label: string;
	readonly detail: string;
	readonly step: number | undefined;
}[] = [
	{
		label: "Full Automaticity Mission",
		detail: "All steps in order, with the progress overview",
		step: undefined,
	},
	{
		label: "Lesson and controlled practice",
		detail: "Rule, examples, and exact-match exercises",
		step: 0,
	},
	{
		label: "Daily writing",
		detail: "Produce sentences of your own, checked online",
		step: 1,
	},
	{
		label: "Five-stage shadowing and free speaking",
		detail: "Listen, shadow, delay, then retell without the audio",
		step: 2,
	},
];

export default function GrammarPage() {
	const { state, setTodayGrammar } = useAppStore();
	const selectedTitle = state.todayGrammar?.title;
	const selectedLevel = grammarUnits.find(
		(unit) => unit.title === selectedTitle,
	)?.level;

	// Which Mission step to show after a practice mode is chosen. Undefined
	// keeps the Mission's normal full view, so choosing "Full Automaticity
	// Mission" is a real way back out of a single-step view.
	const [focusedStep, setFocusedStep] = React.useState<number | undefined>(
		undefined,
	);

	function startPractice(unitTitle: string, step: number | undefined) {
		const unit = grammarUnits.find((candidate) => candidate.title === unitTitle);
		if (!unit) return;
		setTodayGrammar(unit);
		setFocusedStep(step);
		document.getElementById("mission")?.scrollIntoView({ behavior: "smooth" });
	}

	return (
		<div className="page-stack">
			<div className="page-heading">
				<Badge>{grammarUnits.length} units, A1 to C2</Badge>
				<h1>Grammar Lab</h1>
				<p>Pick a unit to make it today's Automaticity Mission below.</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Choose a unit</CardTitle>
					<CardDescription>
						Open a level, then a unit, then the practice mode you want. Its
						evidence is checked the same way as any other Mission -- exact-match
						controlled practice, online-verified writing and speaking, and
						transfer.
					</CardDescription>
				</CardHeader>
				<CardContent data-testid="grammar-topic-list">
					{/* type="single" so only one CEFR level is open at a time; the
					    previous "multiple" let every level stay open, which is what
					    made this list overwhelming. `collapsible` allows closing the
					    last open one. */}
					<Accordion
						collapsible
						defaultValue={selectedLevel ?? "A1"}
						type="single"
					>
						{CEFR_ORDER.map((level) => {
							const units = grammarUnits.filter((unit) => unit.level === level);
							if (units.length === 0) return null;
							return (
								<AccordionItem key={level} value={level}>
									<AccordionTrigger className="text-sm font-bold">
										{level} · {units.length} units
									</AccordionTrigger>
									<AccordionContent>
										{/* Nested single-open accordion: one unit per full-width
										    row on its own line, replacing the wrapped pill chips
										    that made units hard to scan. */}
										<Accordion collapsible type="single">
											{units.map((unit) => {
												const isSelected = selectedTitle === unit.title;
												return (
													<AccordionItem
														className="border-b last:border-b-0"
														key={unit.title}
														value={unit.title}
													>
														<AccordionTrigger
															className={`w-full px-1 text-left text-sm font-semibold ${
																isSelected ? "text-primary" : ""
															}`}
														>
															<span className="flex min-w-0 flex-1 items-center gap-2">
																<span className="min-w-0 flex-1 truncate">
																	{unit.title}
																</span>
																{isSelected ? (
																	<Badge variant="secondary">Today</Badge>
																) : null}
															</span>
														</AccordionTrigger>
														<AccordionContent>
															<p className="px-1 pb-2 text-xs text-muted-foreground">
																{unit.rule}
															</p>
															<div className="grid gap-1">
																{PRACTICE_MODES.map((mode) => (
																	<button
																		className="flex w-full flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
																		key={mode.label}
																		onClick={() =>
																			startPractice(unit.title, mode.step)
																		}
																		type="button"
																	>
																		<span className="text-sm font-bold">
																			{mode.label}
																		</span>
																		<span className="text-xs text-muted-foreground">
																			{mode.detail}
																		</span>
																	</button>
																))}
															</div>
														</AccordionContent>
													</AccordionItem>
												);
											})}
										</Accordion>
									</AccordionContent>
								</AccordionItem>
							);
						})}
					</Accordion>
				</CardContent>
			</Card>
			<AutomaticityScreen focusedStep={focusedStep} />
		</div>
	);
}
