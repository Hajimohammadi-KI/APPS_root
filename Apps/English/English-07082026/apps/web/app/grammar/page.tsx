"use client";

import * as React from "react";
import { grammarUnits, type CefrLevel } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectMenu } from "@/components/ui/select-menu";
import { AutomaticityScreen } from "@/features/screens/automaticity-screen";
import { useAppStore } from "@/features/store/app-store";

const CEFR_ORDER: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

// The Mission renders one step at a time and already accepts a `focusedStep`
// prop (undefined = the full Mission with its overview cards), so these modes
// are real navigation rather than labels: choosing one sets the unit AND the
// step in a single gesture.
//
// No "Shadowing and free speaking" entry here. Grammar Lab covers the rule
// and controlled/written practice; the speaking step now opens Speaking
// Studio instead of rendering inline (see the step-3 card in
// AutomaticityScreen), so Grammar Lab's own mode picker should not offer a
// way to land on it directly either -- both entry points into that step
// should agree on where it lives.
const PRACTICE_MODES: readonly { value: string; label: string; step: number | undefined }[] = [
	{ value: "full", label: "Full Automaticity Mission", step: undefined },
	{ value: "controlled", label: "Lesson and controlled practice", step: 0 },
	{ value: "writing", label: "Daily writing", step: 1 },
];

export default function GrammarPage() {
	const { state, setTodayGrammar } = useAppStore();
	const selectedTitle = state.todayGrammar?.title;

	// Level is local UI state for browsing the list; it starts on the level of
	// whatever unit is already today's topic so the page opens where the
	// learner left off rather than always at A1.
	const [level, setLevel] = React.useState<CefrLevel>(
		() =>
			grammarUnits.find((unit) => unit.title === selectedTitle)?.level ?? "A1",
	);
	const [mode, setMode] = React.useState("full");

	const unitsForLevel = React.useMemo(
		() => grammarUnits.filter((unit) => unit.level === level),
		[level],
	);

	// Keep the unit selection valid whenever the level changes.
	const [unitTitle, setUnitTitle] = React.useState<string>(
		() =>
			grammarUnits.find((unit) => unit.title === selectedTitle)?.title ??
			grammarUnits.find((unit) => unit.level === "A1")?.title ??
			"",
	);
	React.useEffect(() => {
		const persistedUnit = grammarUnits.find(
			(unit) => unit.title === selectedTitle,
		);
		if (!persistedUnit) return;
		setLevel(persistedUnit.level);
		setUnitTitle(persistedUnit.title);
	}, [selectedTitle]);
	React.useEffect(() => {
		if (!unitsForLevel.some((unit) => unit.title === unitTitle)) {
			setUnitTitle(unitsForLevel[0]?.title ?? "");
		}
	}, [unitTitle, unitsForLevel]);

	const activeUnit = grammarUnits.find((unit) => unit.title === unitTitle);
	const activeMode = PRACTICE_MODES.find((entry) => entry.value === mode);
	const [focusedStep, setFocusedStep] = React.useState<number | undefined>(
		undefined,
	);

	function startPractice() {
		if (!activeUnit) return;
		setTodayGrammar(activeUnit);
		setFocusedStep(activeMode?.step);
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
						Selecting a unit sets it as today's practice topic. Its evidence is
						checked the same way as any other Mission -- exact-match controlled
						practice, online-verified writing and speaking, and transfer.
					</CardDescription>
				</CardHeader>
				<CardContent data-testid="grammar-topic-list">
					<div className="grid gap-3 md:grid-cols-3">
						<SelectMenu
							id="grammar-level"
							label="CEFR Level"
							onChange={(next) => setLevel(next as CefrLevel)}
							options={CEFR_ORDER.map((entry) => ({
								value: entry,
								label: `${entry} · ${
									grammarUnits.filter((unit) => unit.level === entry).length
								} units`,
							}))}
							value={level}
						/>
						<SelectMenu
							id="grammar-unit"
							label="Unit"
							onChange={setUnitTitle}
							options={unitsForLevel.map((unit) => ({
								value: unit.title,
								label: unit.title,
							}))}
							value={unitTitle}
						/>
						<SelectMenu
							id="grammar-mode"
							label="Practice Mode"
							onChange={setMode}
							options={PRACTICE_MODES.map(({ value, label }) => ({
								value,
								label,
							}))}
							value={mode}
						/>
					</div>
					{activeUnit ? (
						<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<p className="max-w-2xl text-sm text-muted-foreground">
								{activeUnit.rule}
							</p>
							<Button className="shrink-0" onClick={startPractice} type="button">
								{selectedTitle === activeUnit.title
									? "Go to this Mission"
									: "Start this unit"}
							</Button>
						</div>
					) : null}
				</CardContent>
			</Card>
			{/* `embedded` drops the Mission's own hero, its Due-reviews list and
			    its unit summary strip. On this page all three were duplicates:
			    the hero added a SECOND <h1> ("Automaticity Mission") under
			    "Grammar Lab" plus a second start button, and the strip repeated
			    the level and rule that "Choose a unit" already shows, along with
			    a "Practice in Speaking Studio" link that jumped away before the
			    learner had begun. That was five competing start controls on one
			    page. What remains is one route: choose a unit, then the step bar,
			    then the work. The position bar, step cards and result message are
			    no longer gated on this flag, so embedding keeps the wayfinding. */}
			<AutomaticityScreen embedded focusedStep={focusedStep} />
		</div>
	);
}
