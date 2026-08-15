"use client";

import * as React from "react";
import {
  Check,
  Headphones,
  Layers,
  Mic,
  PenLine,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { grammarUnits, type CefrLevel, type GrammarUnit } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { HumanAudioRecorder } from "@/features/components/human-audio-player";
import { useAppStore, CEFR_ORDER } from "@/features/store/app-store";
import { EVIDENCE_CONTENT_VERSION } from "@/features/screens/automaticity-screen";
import {
  evaluatePracticeAnswer,
  practiceAnswerMatches,
} from "@/lib/automaticity-analysis";
import {
  AUTOMATIZATION_DAILY_MINUTES_OPTIONS,
  AUTOMATIZATION_MODULE_LABELS,
  AUTOMATIZATION_MODULE_TYPES,
  AUTOMATIZATION_SKILL_FOCUS_OPTIONS,
  CHECKPOINT_SESSION_INTERVAL,
  SHADOWING_RECOVERY_RATE,
  SHADOWING_SPEED_LADDER,
  SHADOWING_STAGES,
  VARIATION_DRILL_STAGE_MARKER,
  buildAutomatizationMatrix,
  countAutomatizationSessionDays,
  gradeFreeRetelling,
  nextShadowingSpeed,
  parsePassageMarkup,
  pickAutoPronunciationTarget,
  shouldPromptCheckpoint,
  stripPassageMarkup,
  summarizeCheckpoints,
  type AutomatizationModuleType,
  type CheckpointAnswer,
} from "@/lib/automatization";
import { putAudio } from "@/lib/audio-db";
import { speak } from "@/lib/speech";
import { makeId } from "@/lib/utils";

// -- shared shuffling helpers (mirrors automaticity-screen.tsx's private
// shuffled()/pickRound(); kept local rather than extracted since both are
// 6-line generic array helpers, not grading/domain logic the "reuse, don't
// duplicate" guidance is about). ---------------------------------------
function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = copy[index]!;
    copy[index] = copy[swapIndex]!;
    copy[swapIndex] = temp;
  }
  return copy;
}

function pickRound<T>(pool: readonly T[], size: number): T[] {
  return shuffled(pool).slice(0, Math.min(size, pool.length));
}

function requireDefaultGrammar(): GrammarUnit {
  const grammar = grammarUnits.at(0);
  if (!grammar) throw new Error("The grammar catalog is empty.");
  return grammar;
}
const defaultGrammar = requireDefaultGrammar();

const MODULE_ICONS: Record<AutomatizationModuleType, typeof PenLine> = {
  retrieval: PenLine,
  shadowing: Headphones,
  formulaic: Layers,
};

function moduleForSkillFocus(skillFocus: "speaking" | "writing"): AutomatizationModuleType {
  return skillFocus === "speaking" ? "shadowing" : "retrieval";
}

// -- Retrieval practice ---------------------------------------------------

function RetrievalModule({ grammar, roundSize }: { grammar: GrammarUnit; roundSize: number }) {
  const { recordAttempt } = useAppStore();
  const pool = grammar.exercises;
  const [round, setRound] = React.useState<[string, string][]>(() =>
    pickRound(pool, roundSize),
  );
  const previousUnitRef = React.useRef(grammar.title);
  React.useEffect(() => {
    if (previousUnitRef.current === grammar.title) return;
    previousUnitRef.current = grammar.title;
    setRound(pickRound(pool, roundSize));
    setIndex(0);
    setAnswer("");
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the unit identity changes
  }, [grammar.title]);
  const [index, setIndex] = React.useState(0);
  const [answer, setAnswer] = React.useState("");
  const [result, setResult] = React.useState<boolean | null>(null);
  const startRef = React.useRef<number | null>(null);
  const current = round[index];

  function checkAnswer() {
    if (!current) return;
    const [prompt, expected] = current;
    const isCorrect = evaluatePracticeAnswer(answer, { prompt, expected });
    setResult(isCorrect);
    const latencyMs = startRef.current ? Date.now() - startRef.current : null;
    startRef.current = null;
    recordAttempt({
      grammarTitle: grammar.title,
      mode: "auto_retrieval",
      inputText: answer,
      correctedText: expected,
      targetHit: isCorrect,
      accuracyScore: isCorrect ? 100 : 0,
      fluencyScore: 0,
      latencyMs,
      passed: isCorrect,
      verified: isCorrect,
      assessedBy: "offline",
      contentVersion: EVIDENCE_CONTENT_VERSION,
    });
  }

  function next() {
    if (index + 1 < round.length) {
      setIndex((value) => value + 1);
    } else {
      setRound(pickRound(pool, roundSize));
      setIndex(0);
    }
    setAnswer("");
    setResult(null);
  }

  if (!current) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retrieval practice</CardTitle>
        <CardDescription>
          Produce the target form before you see it -- not listen-and-repeat.
          Item {index + 1} of {round.length}, topic: {grammar.title}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="rounded-2xl bg-violet-50 p-4 text-sm font-bold">
          {current[0]}
        </p>
        <input
          aria-label="Your answer"
          className="min-h-11 w-full rounded-xl border bg-background px-3"
          disabled={result !== null}
          onChange={(event) => {
            if (startRef.current === null) startRef.current = Date.now();
            setAnswer(event.target.value);
          }}
          value={answer}
        />
        {result === null ? (
          <Button disabled={!answer.trim()} onClick={checkAnswer}>
            <Check className="size-4" /> Check
          </Button>
        ) : (
          <div className="space-y-3">
            <p
              className={
                result
                  ? "text-sm font-bold text-violet-800"
                  : "text-sm font-bold text-red-800"
              }
            >
              {result ? "Correct." : `Model: ${current[1]}`}
            </p>
            <Button onClick={next}>Next item</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// -- Formulaic sequence drills ---------------------------------------------

function FormulaicModule({ grammar }: { grammar: GrammarUnit }) {
  const { recordAttempt } = useAppStore();
  const pool = grammar.formulaicSequences ?? [];
  const [round, setRound] = React.useState<string[]>(() => shuffled(pool));
  const previousUnitRef = React.useRef(grammar.title);
  React.useEffect(() => {
    if (previousUnitRef.current === grammar.title) return;
    previousUnitRef.current = grammar.title;
    setRound(shuffled(pool));
    setIndex(0);
    setPhase("study");
    setAnswer("");
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the unit identity changes
  }, [grammar.title]);
  const [index, setIndex] = React.useState(0);
  const [phase, setPhase] = React.useState<"study" | "recall">("study");
  const [answer, setAnswer] = React.useState("");
  const [result, setResult] = React.useState<boolean | null>(null);
  const startRef = React.useRef<number | null>(null);
  const current = round[index];

  function checkAnswer() {
    if (!current) return;
    const isCorrect = practiceAnswerMatches(answer, current);
    setResult(isCorrect);
    const latencyMs = startRef.current ? Date.now() - startRef.current : null;
    startRef.current = null;
    recordAttempt({
      grammarTitle: grammar.title,
      mode: "auto_formulaic",
      inputText: answer,
      correctedText: current,
      targetHit: isCorrect,
      accuracyScore: isCorrect ? 100 : 0,
      fluencyScore: 0,
      latencyMs,
      passed: isCorrect,
      verified: isCorrect,
      assessedBy: "offline",
      contentVersion: EVIDENCE_CONTENT_VERSION,
    });
  }

  function next() {
    if (index + 1 < round.length) {
      setIndex((value) => value + 1);
    } else {
      setRound(shuffled(pool));
      setIndex(0);
    }
    setPhase("study");
    setAnswer("");
    setResult(null);
  }

  if (pool.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Formulaic sequence drills</CardTitle>
          <CardDescription>
            This unit has no fixed-phrase chunks derived from its examples yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  if (!current) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulaic sequence drills</CardTitle>
        <CardDescription>
          Fixed and semi-fixed multi-word chunks, not single words. Chunk{" "}
          {index + 1} of {round.length}, from {grammar.title}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {phase === "study" ? (
          <>
            <p className="rounded-2xl bg-violet-950 p-5 text-center text-lg font-bold text-violet-50">
              {current}
            </p>
            <Button onClick={() => setPhase("recall")}>
              I've studied it -- hide and recall
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Type the fixed phrase from memory.
            </p>
            <input
              aria-label="Recall the phrase"
              className="min-h-11 w-full rounded-xl border bg-background px-3"
              disabled={result !== null}
              onChange={(event) => {
                if (startRef.current === null) startRef.current = Date.now();
                setAnswer(event.target.value);
              }}
              value={answer}
            />
            {result === null ? (
              <Button disabled={!answer.trim()} onClick={checkAnswer}>
                <Check className="size-4" /> Check
              </Button>
            ) : (
              <div className="space-y-3">
                <p
                  className={
                    result
                      ? "text-sm font-bold text-violet-800"
                      : "text-sm font-bold text-red-800"
                  }
                >
                  {result ? "Correct." : `Phrase: ${current}`}
                </p>
                <Button onClick={next}>Next chunk</Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// -- Oral repetition / shadowing (5-stage progression) ---------------------

function ShadowingModule({ grammar }: { grammar: GrammarUnit }) {
  const { recordAttempt } = useAppStore();
  const defaultPassage = grammar.testAnswer?.trim() || grammar.examples.join(" ");
  const [customPassage, setCustomPassage] = React.useState("");
  const activePassage = customPassage.trim() || defaultPassage;
  const [stageIndex, setStageIndex] = React.useState(0);
  const [playCount, setPlayCount] = React.useState(0);
  const [repetitions, setRepetitions] = React.useState(0);
  const [retelling, setRetelling] = React.useState("");
  const [retellFeedback, setRetellFeedback] = React.useState<{
    passed: boolean;
    overlapRatio: number;
  } | null>(null);
  const stage = SHADOWING_STAGES[stageIndex]!;

  function resetStageProgress() {
    setPlayCount(0);
    setRepetitions(0);
    setRetelling("");
    setRetellFeedback(null);
  }

  function play() {
    if (stage.maxPlays !== null && playCount >= stage.maxPlays) return;
    speak(activePassage, { rate: stage.rate ?? 1 });
    setPlayCount((value) => value + 1);
  }

  function recordStageAttempt(accuracyScore: number, passed: boolean) {
    recordAttempt({
      grammarTitle: grammar.title,
      mode: "auto_shadowing",
      inputText: stage.stage === 5 ? retelling : activePassage,
      correctedText: activePassage,
      targetHit: passed,
      accuracyScore,
      fluencyScore: 0,
      latencyMs: null,
      passed,
      verified: passed,
      assessedBy: "offline",
      contentVersion: EVIDENCE_CONTENT_VERSION,
      stage: stage.stage,
    });
  }

  function completeStage() {
    recordStageAttempt(100, true);
    advanceStage();
  }

  function checkRetelling() {
    const grade = gradeFreeRetelling(activePassage, retelling);
    setRetellFeedback(grade);
    recordStageAttempt(Math.round(grade.overlapRatio * 100), grade.passed);
  }

  function advanceStage() {
    resetStageProgress();
    setStageIndex((value) => Math.min(value + 1, SHADOWING_STAGES.length - 1));
  }

  function restartSequence() {
    resetStageProgress();
    setStageIndex(0);
  }

  const canCompleteRepetitionStage =
    stage.requiredRepetitions === 0 || repetitions >= stage.requiredRepetitions;
  const sequenceDone = stageIndex === SHADOWING_STAGES.length - 1 && retellFeedback !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Oral repetition / shadowing</CardTitle>
        <CardDescription>
          A 5-stage progression per passage, from imitation toward genuinely
          free production -- not a single listen-and-repeat step.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <label className="block space-y-2">
          <span className="text-sm font-bold">
            Optional: use your own passage instead of the default model text
          </span>
          <Textarea
            aria-label="Your own passage"
            onChange={(event) => setCustomPassage(event.target.value)}
            placeholder={defaultPassage}
            value={customPassage}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {SHADOWING_STAGES.map((step, position) => (
            <Badge
              key={step.stage}
              variant={
                position === stageIndex
                  ? "default"
                  : position < stageIndex
                    ? "success"
                    : "secondary"
              }
            >
              {step.stage}. {position < stageIndex ? "done" : step.mostImportant ? "key stage" : ""}
            </Badge>
          ))}
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
          <strong className="flex items-center gap-2">
            {stage.title}
            {stage.mostImportant ? <Badge variant="warning">Most important</Badge> : null}
          </strong>
          <p className="mt-2 text-sm text-muted-foreground">{stage.instruction}</p>
        </div>

        {stage.showTranscript ? (
          <p className="rounded-2xl bg-violet-950 p-5 leading-7 text-violet-50">
            {activePassage}
          </p>
        ) : null}

        {stage.rate !== null ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={stage.maxPlays !== null && playCount >= stage.maxPlays}
              onClick={play}
            >
              <Volume2 className="size-4" /> Play
              {stage.rate !== 1 ? ` (${stage.rate}x)` : ""}
            </Button>
            {stage.maxPlays !== null ? (
              <Badge variant="secondary">
                {playCount}/{stage.maxPlays} plays used
              </Badge>
            ) : (
              <Badge variant="secondary">Played {playCount}x</Badge>
            )}
          </div>
        ) : null}

        {stage.stage !== 5 ? (
          <div className="flex flex-wrap items-center gap-3">
            {stage.requiredRepetitions > 0 ? (
              <>
                <Button
                  onClick={() => setRepetitions((value) => value + 1)}
                  variant="outline"
                >
                  <Mic className="size-4" /> I repeated it
                </Button>
                <Badge variant="secondary">
                  {repetitions}/{stage.requiredRepetitions} repetitions
                </Badge>
              </>
            ) : null}
            <Button disabled={!canCompleteRepetitionStage} onClick={completeStage}>
              <Check className="size-4" /> Mark stage complete
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              aria-label="Free retelling"
              onChange={(event) => setRetelling(event.target.value)}
              placeholder="Retell the message in your own words, without looking at the passage."
              value={retelling}
            />
            <Button disabled={!retelling.trim() || retellFeedback !== null} onClick={checkRetelling}>
              Check retelling
            </Button>
            {retellFeedback ? (
              <p
                className={
                  retellFeedback.passed
                    ? "text-sm font-bold text-violet-800"
                    : "text-sm font-bold text-red-800"
                }
              >
                {retellFeedback.passed
                  ? "Good -- your retelling shows the pattern is usable, not just memorized."
                  : "Not enough of the original meaning came through. Listen again and retry, or move on."}
              </p>
            ) : null}
          </div>
        )}

        {sequenceDone ? (
          <Button onClick={restartSequence} variant="outline">
            <RotateCcw className="size-4" /> Start a new 5-stage sequence
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

// -- 4-week tracking matrix -------------------------------------------------

function TrackingMatrix() {
  const { state } = useAppStore();
  const matrix = React.useMemo(
    () => buildAutomatizationMatrix(state.attempts),
    [state.attempts],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>4-week automatization progress</CardTitle>
        <CardDescription>
          Attempts and average accuracy per module type, in rolling 7-day
          windows over the last 28 days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left font-bold">Module</th>
                {matrix.weekLabels.map((label) => (
                  <th className="p-2 text-left font-bold" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUTOMATIZATION_MODULE_TYPES.map((moduleType) => {
                const Icon = MODULE_ICONS[moduleType];
                return (
                  <tr className="border-t" key={moduleType}>
                    <td className="p-2 font-bold">
                      <span className="flex items-center gap-2">
                        <Icon className="size-4" /> {AUTOMATIZATION_MODULE_LABELS[moduleType]}
                      </span>
                    </td>
                    {matrix.cells[moduleType].map((cell, weekIndex) => (
                      <td className="p-2" key={weekIndex}>
                        {cell.attempts === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span>
                            {cell.accuracy}% · {cell.attempts} attempt
                            {cell.attempts === 1 ? "" : "s"}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// -- Screen -----------------------------------------------------------------

export function AutomatizationTrainerScreen() {
  const { state, mutate } = useAppStore();
  const selectedLevel: CefrLevel = state.learner.selfDeclaredLevel ?? "A1";
  const dailyMinutes = state.settings.automatizationDailyMinutes;
  const skillFocus = state.settings.automatizationSkillFocus;
  const grammar =
    grammarUnits.find((unit) => unit.level === selectedLevel) ?? defaultGrammar;
  const [activeModule, setActiveModule] = React.useState<AutomatizationModuleType>(() =>
    moduleForSkillFocus(skillFocus),
  );
  const roundSize = Math.max(3, Math.round(dailyMinutes / 2));

  return (
    <div className="page-stack">
      <div className="page-heading">
        <Badge>Automatization Trainer</Badge>
        <h1>Deliberate-practice exercise planner</h1>
        <p>
          Retrieval, oral shadowing, and formulaic-sequence drills -- the
          practice types skill-acquisition research (Suzuki, DeKeyser) links
          to durable, fast, automatic use, not passive review.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session parameters</CardTitle>
          <CardDescription>
            Level reads from your existing proficiency setting -- change it
            here or anywhere else in the app, it stays in sync.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-bold">Daily practice duration</p>
            <div className="flex flex-wrap gap-2">
              {AUTOMATIZATION_DAILY_MINUTES_OPTIONS.map((minutes) => (
                <button
                  aria-pressed={dailyMinutes === minutes}
                  className={`rounded-full border px-3 py-1.5 text-sm font-bold ${
                    dailyMinutes === minutes
                      ? "border-violet-700 bg-violet-100 text-violet-950"
                      : "bg-background"
                  }`}
                  key={minutes}
                  onClick={() =>
                    mutate((draft) => {
                      draft.settings.automatizationDailyMinutes = minutes;
                    })
                  }
                  type="button"
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold">Skill focus</p>
            <div className="flex flex-wrap gap-2">
              {AUTOMATIZATION_SKILL_FOCUS_OPTIONS.map((focus) => (
                <button
                  aria-pressed={skillFocus === focus}
                  className={`rounded-full border px-3 py-1.5 text-sm font-bold capitalize ${
                    skillFocus === focus
                      ? "border-violet-700 bg-violet-100 text-violet-950"
                      : "bg-background"
                  }`}
                  key={focus}
                  onClick={() =>
                    mutate((draft) => {
                      draft.settings.automatizationSkillFocus = focus;
                    })
                  }
                  type="button"
                >
                  {focus}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold">Target CEFR level</p>
            <div className="flex flex-wrap gap-2">
              {CEFR_ORDER.map((level) => (
                <button
                  aria-pressed={selectedLevel === level}
                  className={`rounded-full border px-3 py-1.5 text-sm font-bold ${
                    selectedLevel === level
                      ? "border-violet-700 bg-violet-100 text-violet-950"
                      : "bg-background"
                  }`}
                  key={level}
                  onClick={() =>
                    mutate((draft) => {
                      draft.learner.selfDeclaredLevel = level;
                    })
                  }
                  type="button"
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {AUTOMATIZATION_MODULE_TYPES.map((moduleType) => {
          const Icon = MODULE_ICONS[moduleType];
          return (
            <Button
              key={moduleType}
              onClick={() => setActiveModule(moduleType)}
              variant={activeModule === moduleType ? "default" : "outline"}
            >
              <Icon className="size-4" /> {AUTOMATIZATION_MODULE_LABELS[moduleType]}
            </Button>
          );
        })}
      </div>

      {activeModule === "retrieval" ? (
        <RetrievalModule grammar={grammar} roundSize={roundSize} />
      ) : null}
      {activeModule === "shadowing" ? <ShadowingModule grammar={grammar} /> : null}
      {activeModule === "formulaic" ? <FormulaicModule grammar={grammar} /> : null}

      <TrackingMatrix />
    </div>
  );
}
