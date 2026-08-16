"use client";

import { grammarUnits, type CefrLevel } from "@grammar/content";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AutomaticityScreen } from "@/features/screens/automaticity-screen";
import { useAppStore } from "@/features/store/app-store";

const CEFR_ORDER: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function GrammarPage() {
	const { state, setTodayGrammar } = useAppStore();
	const selectedTitle = state.todayGrammar?.title;
	const selectedLevel = grammarUnits.find((unit) => unit.title === selectedTitle)?.level;

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
						Selecting a unit sets it as today's practice topic. Its evidence
						is checked the same way as any other Mission -- exact-match
						controlled practice, online-verified writing and speaking, and
						transfer.
					</CardDescription>
				</CardHeader>
				<CardContent data-testid="grammar-topic-list">
					<Accordion
						type="multiple"
						defaultValue={selectedLevel ? [selectedLevel] : ["A1"]}
					>
						{CEFR_ORDER.map((level) => {
							const units = grammarUnits.filter((unit) => unit.level === level);
							if (units.length === 0) return null;
							return (
								<AccordionItem key={level} value={level}>
									<AccordionTrigger className="text-sm font-bold text-muted-foreground">
										{level} · {units.length} units
									</AccordionTrigger>
									<AccordionContent>
										<div className="flex flex-wrap gap-2">
											{units.map((unit) => (
												<button
													aria-pressed={selectedTitle === unit.title}
													className={`rounded-full border px-3 py-1.5 text-left text-sm font-bold ${
														selectedTitle === unit.title
															? "border-violet-700 bg-violet-100 text-violet-950"
															: "bg-background"
													}`}
													key={unit.title}
													onClick={() => {
														setTodayGrammar(unit);
														document
															.getElementById("mission")
															?.scrollIntoView({ behavior: "smooth" });
													}}
													type="button"
												>
													{unit.title}
												</button>
											))}
										</div>
									</AccordionContent>
								</AccordionItem>
							);
						})}
					</Accordion>
				</CardContent>
			</Card>
			<AutomaticityScreen />
		</div>
	);
}
