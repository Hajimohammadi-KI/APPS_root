"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Captions,
  Check,
  Gauge,
  Headphones,
  MessagesSquare,
  Mic,
  RotateCcw,
  Shuffle,
  Sparkles,
  Target,
  Timer,
  Volume2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SelectMenu } from "@/components/ui/select-menu";
import { Textarea } from "@/components/ui/textarea";
import { grammarUnits } from "@grammar/content";
import {
  AUTOMATIZATION_MATRIX_COLUMNS,
  CEFR_LEVELS,
  SHADOWING_STAGES,
  automatizationModuleLabels,
  buildAutomatizationTopic,
  computeAutomatizationMatrix,
  parseAutomatizationTopic,
  shadowingStageLabels,
  type AutomatizationModule,
  type CefrLevel,
  type ShadowingStage,
} from "@grammar/domain";
import { Feedback } from "@/features/automaticity/automaticity-lab";
import {
  practiceAnswerMatches,
  type AutomatikAnalysis,
} from "@/features/automaticity/automaticity-analysis";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
import { HumanAudioPlayer, HumanAudioRecorder } from "@/components/human-audio-player";
import {
  findTeacherContentByContextKey,
  playTeacherAudioByContextKey,
} from "@/lib/teacher-content";
import { requestEvaluation } from "@/lib/evaluation-client";
import { API_BASE_URL } from "@/lib/api-config";
import { saveAudio } from "@/features/audio/audio-repository";
import {
  formulaicSequencesForLevel,
  shadowingPassagesForLevel,
  type FormulaicSequence,
  type ShadowingPassage,
} from "./automatization-content";

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

// Reads the same target-CEFR-level state every other feature already reads
// (learningLevel first, then the learner's self-declared level -- see
// automaticity-lab.tsx's identical fallback chain), never a parallel one.
function resolveTargetLevel(
  learningLevel: string | null | undefined,
  selfDeclaredLevel: CefrLevel | null,
): CefrLevel {
  if (selfDeclaredLevel) return selfDeclaredLevel;
  if (
    learningLevel &&
    (CEFR_LEVELS as readonly string[]).includes(learningLevel)
  ) {
    return learningLevel as CefrLevel;
  }
  return "A1";
}

// Suggested round size from the learner's own daily-duration setting
// (settings.dailyStudyMinutes) -- the trainer's "custom duration" parameter
// is that existing setting, not a second parallel one.
function roundSizeForMinutes(minutes: number): number {
  if (minutes <= 15) return 4;
  if (minutes <= 30) return 6;
  return 8;
}

async function speakAtRate(
  text: string,
  rate: number,
  contextKey?: string,
): Promise<void> {
  if (contextKey) {
    const played = await playTeacherAudioByContextKey(contextKey, rate).catch(
      () => false,
    );
    if (played) return;
  }
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}

function wordsOf(text: string): number {
  return text.match(/[A-Za-zÄÖÜäöüß]+(?:[-’'][A-Za-zÄÖÜäöüß]+)*/g)?.length ?? 0;
}

function sentencesOf(text: string): number {
  return text
    .split(/(?:[.!?]+|\n+)/)
    .map((row) => row.trim())
    .filter(Boolean).length;
}

async function evaluateRetelling(params: {
  readonly text: string;
  readonly passageTitle: string;
  readonly passageText: string;
  readonly allowOnlineFeedback: boolean;
  readonly spellingAffectsMastery: boolean;
}): Promise<AutomatikAnalysis> {
  const result = await requestEvaluation({
    allowOnlineFeedback: params.allowOnlineFeedback,
    apiBaseUrl: API_BASE_URL,
    text: params.text,
    grammar: {
      title: params.passageTitle,
      rule: "Erzähle den Inhalt in eigenen Worten nach, ohne den Text abzulesen oder wörtlich zu zitieren.",
      examples: [params.passageText],
    },
    kind: "sentences",
    taskPrompt: `Erzähle den Text „${params.passageTitle}“ in eigenen Worten nach.`,
    spellingAffectsMastery: params.spellingAffectsMastery,
  });
  const sentenceCount = sentencesOf(params.text);
  const wordCount = wordsOf(params.text);
  const minimumSentences = 2;
  const issues: AutomatikAnalysis["issues"][number][] = result.issues.map(
    (issue) => ({
      code: issue.errorClass === "word_order" ? "word_order" : "missing_target",
      message: issue.message,
      original: issue.context ?? params.text,
      corrected: issue.suggestion ?? result.corrected,
    }),
  );
  if (sentenceCount < minimumSentences) {
    issues.push({
      code: "unfinished_sentence",
      message: `Erzähle in mindestens ${minimumSentences} zusammenhängenden Sätzen nach.`,
      original: params.text,
      corrected: params.passageText,
    });
  }
  return {
    sentenceCount,
    wordCount,
    targetUses: result.targetHit ? 1 : 0,
    score: result.accuracyScore,
    targetHit:
      result.practiceReady && result.targetHit && sentenceCount >= minimumSentences,
    issues,
    online: result.online,
  };
}

interface RetrievalItem {
  readonly itemId: string;
  readonly prompt: string;
  readonly expected: string;
}

function pickRetrievalRound(level: CefrLevel, size: number): RetrievalItem[] {
  const pool = grammarUnits.filter((unit) => unit.level === level);
  const units = shuffled(pool.length > 0 ? pool : grammarUnits).slice(0, size);
  return units.map((unit) => {
    const exercise = unit.exercises[0];
    return {
      itemId: unit.title,
      prompt: exercise?.[0] ?? unit.rule,
      expected: exercise?.[1] ?? unit.testAnswer,
    };
  });
}

function pickFormulaicRound(
  level: CefrLevel,
  size: number,
): readonly FormulaicSequence[] {
  return shuffled(formulaicSequencesForLevel(level)).slice(0, size);
}

const MODULE_TABS: readonly {
  readonly key: AutomatizationModule;
  readonly label: string;
  readonly detail: string;
}[] = [
  {
    key: "retrieval",
    label: automatizationModuleLabels.retrieval,
    detail: "Zielform selbst produzieren, bevor du sie siehst",
  },
  {
    key: "shadowing",
    label: automatizationModuleLabels.shadowing,
    detail: "Fünf Stufen vom Zuhören bis zum freien Nacherzählen",
  },
  {
    key: "formulaic",
    label: automatizationModuleLabels.formulaic,
    detail: "Feste Wendungen als Ganzes abrufen",
  },
];

export function AutomatizationTrainer() {
  const {
    state,
    hydrated,
    updateSettings,
    updateLearnerProfile,
    recordAttempt,
    markActivity,
  } = useLearnerState();

  const targetLevel = resolveTargetLevel(
    state.learningLevel,
    state.learner.selfDeclaredLevel,
  );
  const dailyMinutes = state.settings.dailyStudyMinutes;
  const focus = state.settings.automatizationFocus;
  const roundSize = roundSizeForMinutes(dailyMinutes);

  const [module, setModule] = useState<AutomatizationModule>("retrieval");

  // ---- Retrieval practice -------------------------------------------------
  const [retrievalRound, setRetrievalRound] = useState<RetrievalItem[]>(() =>
    pickRetrievalRound(targetLevel, roundSize),
  );
  const [retrievalAnswers, setRetrievalAnswers] = useState<string[]>(() =>
    retrievalRound.map(() => ""),
  );
  const [retrievalChecked, setRetrievalChecked] = useState<readonly boolean[]>(
    [],
  );
  const retrievalStartRef = useRef(Date.now());
  const previousRetrievalKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `${targetLevel}:${roundSize}`;
    if (previousRetrievalKeyRef.current === key) return;
    previousRetrievalKeyRef.current = key;
    const round = pickRetrievalRound(targetLevel, roundSize);
    setRetrievalRound(round);
    setRetrievalAnswers(round.map(() => ""));
    setRetrievalChecked([]);
    retrievalStartRef.current = Date.now();
  }, [targetLevel, roundSize]);

  function checkRetrieval() {
    const results = retrievalAnswers.map((answer, index) =>
      practiceAnswerMatches(answer, retrievalRound[index]?.expected ?? ""),
    );
    setRetrievalChecked(results);
    const latencyMs = Date.now() - retrievalStartRef.current;
    for (const [index, item] of retrievalRound.entries()) {
      const hit = results[index] ?? false;
      recordAttempt({
        topic: buildAutomatizationTopic("retrieval", item.itemId),
        mode: "recognition",
        inputText: retrievalAnswers[index] ?? "",
        correctedText: item.expected,
        targetHit: hit,
        // Deterministic exact-match check, same basis automaticity-lab's
        // checkPractice() already uses to mark exact-match rounds verified.
        verified: hit,
        accuracyScore: hit ? 100 : 0,
        latencyMs,
      });
    }
    markActivity(1);
  }

  function nextRetrievalRound() {
    const round = pickRetrievalRound(targetLevel, roundSize);
    setRetrievalRound(round);
    setRetrievalAnswers(round.map(() => ""));
    setRetrievalChecked([]);
    retrievalStartRef.current = Date.now();
  }

  // ---- Formulaic sequence drills ------------------------------------------
  const [formulaicRound, setFormulaicRound] = useState<
    readonly FormulaicSequence[]
  >(() => pickFormulaicRound(targetLevel, roundSize));
  const [formulaicAnswers, setFormulaicAnswers] = useState<string[]>(() =>
    formulaicRound.map(() => ""),
  );
  const [formulaicChecked, setFormulaicChecked] = useState<readonly boolean[]>(
    [],
  );
  const formulaicStartRef = useRef(Date.now());
  const previousFormulaicKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `${targetLevel}:${roundSize}`;
    if (previousFormulaicKeyRef.current === key) return;
    previousFormulaicKeyRef.current = key;
    const round = pickFormulaicRound(targetLevel, roundSize);
    setFormulaicRound(round);
    setFormulaicAnswers(round.map(() => ""));
    setFormulaicChecked([]);
    formulaicStartRef.current = Date.now();
  }, [targetLevel, roundSize]);

  function checkFormulaic() {
    const results = formulaicAnswers.map((answer, index) =>
      practiceAnswerMatches(answer, formulaicRound[index]?.phrase ?? ""),
    );
    setFormulaicChecked(results);
    const latencyMs = Date.now() - formulaicStartRef.current;
    for (const [index, item] of formulaicRound.entries()) {
      const hit = results[index] ?? false;
      recordAttempt({
        topic: buildAutomatizationTopic("formulaic", item.id),
        mode: "recognition",
        inputText: formulaicAnswers[index] ?? "",
        correctedText: item.phrase,
        targetHit: hit,
        verified: hit,
        accuracyScore: hit ? 100 : 0,
        latencyMs,
      });
    }
    markActivity(1);
  }

  function nextFormulaicRound() {
    const round = pickFormulaicRound(targetLevel, roundSize);
    setFormulaicRound(round);
    setFormulaicAnswers(round.map(() => ""));
    setFormulaicChecked([]);
    formulaicStartRef.current = Date.now();
  }

  // ---- Shadowing (5-stage progression) ------------------------------------
  const passages = shadowingPassagesForLevel(targetLevel);
  const [passageId, setPassageId] = useState(passages[0]?.id ?? "");
  const selectedPassage: ShadowingPassage | undefined =
    passages.find((passage) => passage.id === passageId) ?? passages[0];
  const [useCustomText, setUseCustomText] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customText, setCustomText] = useState("");

  const activeTitle = useCustomText
    ? customTitle.trim() || "Eigener Text"
    : (selectedPassage?.title ?? "");
  const activeText = useCustomText ? customText.trim() : (selectedPassage?.text ?? "");
  const activeContextKey = useCustomText ? undefined : selectedPassage?.contextKey;
  const activeItemId = useCustomText
    ? `eigen-${customTitle.trim().toLocaleLowerCase("de-DE").replace(/[^a-z0-9äöüß]+/g, "-") || "text"}`
    : (selectedPassage?.id ?? "unbekannt");

  useEffect(() => {
    if (!useCustomText && !passageId && passages[0]) {
      setPassageId(passages[0].id);
    }
  }, [passageId, passages, useCustomText]);

  const [activeStage, setActiveStage] = useState<ShadowingStage>(1);
  const [completedStages, setCompletedStages] = useState<
    ReadonlySet<ShadowingStage>
  >(new Set());
  const previousItemIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (previousItemIdRef.current === activeItemId) return;
    previousItemIdRef.current = activeItemId;
    setActiveStage(1);
    setCompletedStages(new Set());
  }, [activeItemId]);

  const [slowRate, setSlowRate] = useState<0.75 | 0.85>(0.75);
  const [stage1Played, setStage1Played] = useState(false);
  const [preciseRepeated, setPreciseRepeated] = useState(false);
  const [retellText, setRetellText] = useState("");
  const [retellAnalysis, setRetellAnalysis] = useState<AutomatikAnalysis | null>(
    null,
  );
  const [retellChecking, setRetellChecking] = useState(false);
  const stageStartRef = useRef(Date.now());
  useEffect(() => {
    stageStartRef.current = Date.now();
    setStage1Played(false);
    setPreciseRepeated(false);
  }, [activeStage, activeItemId]);

  const [teacherContentId, setTeacherContentId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!activeContextKey) {
      setTeacherContentId(null);
      return;
    }
    void findTeacherContentByContextKey(activeContextKey).then((item) => {
      if (!cancelled) setTeacherContentId(item?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [activeContextKey]);

  function completeStage(stage: ShadowingStage) {
    const latencyMs = Date.now() - stageStartRef.current;
    recordAttempt({
      topic: buildAutomatizationTopic("shadowing", activeItemId, stage),
      mode: stage === 5 ? "transfer" : stage === 1 ? "recognition" : "speaking",
      inputText: stage === 5 ? retellText : "",
      correctedText: activeText,
      targetHit: true,
      // Stages 1-4 are self-paced exposure/production practice with no
      // automated grading -- recorded for the tracking matrix, but never
      // verified, so they can never silently move mastery (see
      // recordVerifiedMasteryAttempt in packages/domain/src/mastery.ts).
      verified: false,
      accuracyScore: 100,
      latencyMs,
    });
    setCompletedStages((current) => new Set(current).add(stage));
    markActivity(1);
    if (stage < 5) {
      setActiveStage((stage + 1) as ShadowingStage);
    }
  }

  async function submitRetelling() {
    if (!retellText.trim()) return;
    setRetellChecking(true);
    try {
      const latencyMs = Date.now() - stageStartRef.current;
      const analysis = await evaluateRetelling({
        text: retellText,
        passageTitle: activeTitle,
        passageText: activeText,
        allowOnlineFeedback: state.learner.allowOnlineAI,
        spellingAffectsMastery: state.settings.spellingAffectsMastery,
      });
      setRetellAnalysis(analysis);
      recordAttempt({
        topic: buildAutomatizationTopic("shadowing", activeItemId, 5),
        mode: "transfer",
        inputText: retellText,
        correctedText: activeText,
        targetHit: analysis.targetHit,
        // Real open-production grading (same contract every other
        // free-production exercise in this app uses) -- verified tracks
        // "the evaluator actually ran", not "and passed".
        verified: analysis.online,
        accuracyScore: analysis.score,
        latencyMs,
      });
      setCompletedStages((current) => new Set(current).add(5));
      markActivity(1);
    } finally {
      setRetellChecking(false);
    }
  }

  // ---- 4-week tracking matrix ---------------------------------------------
  const matrix = useMemo(
    () => computeAutomatizationMatrix(state.attempts),
    [state.attempts],
  );

  if (!hydrated) {
    return null;
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge className="mb-3 bg-violet-700 text-white">
            Automatisierungstrainer
          </Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Automatik gezielt aufbauen
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Abrufübung statt bloßem Nachsprechen, fünfstufiges Shadowing statt
            einer Wiederholung, feste Wendungen als Ganzes statt Wort für
            Wort. Sofortiges Feedback, sichtbare Automatik über vier Wochen.
          </p>
        </div>
      </section>

      <Card className="border-violet-200">
        <CardHeader>
          <CardTitle>Trainingsparameter</CardTitle>
          <CardDescription>
            Nutzt dieselbe Zielstufe und Tagesdauer wie der Rest der App —
            kein zweiter, getrennter Speicher.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectMenu
              label="Zielstufe (CEFR)"
              onChange={(next) =>
                updateLearnerProfile({
                  selfDeclaredLevel: next as CefrLevel,
                })
              }
              options={CEFR_LEVELS.map((level) => ({
                value: level,
                label: level,
              }))}
              value={targetLevel}
            />
            <SelectMenu
              label="Tägliche Übungsdauer"
              onChange={(next) =>
                updateSettings({
                  dailyStudyMinutes: Number(next) as 15 | 30 | 45 | 60,
                })
              }
              options={[
                { value: "15", label: "15 Minuten" },
                { value: "30", label: "30 Minuten" },
                { value: "45", label: "45 Minuten" },
                { value: "60", label: "60 Minuten" },
              ]}
              value={String(dailyMinutes)}
            />
            <SelectMenu
              label="Schwerpunkt"
              onChange={(next) =>
                updateSettings({
                  automatizationFocus: next as "speaking" | "writing" | "both",
                })
              }
              options={[
                { value: "both", label: "Sprechen und Schreiben" },
                { value: "speaking", label: "Vor allem Sprechen" },
                { value: "writing", label: "Vor allem Schreiben" },
              ]}
              value={focus}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {MODULE_TABS.map((tab) => (
          <button
            aria-pressed={module === tab.key}
            className="text-left"
            key={tab.key}
            onClick={() => setModule(tab.key)}
            type="button"
          >
            <Card
              className={
                module === tab.key ? "border-violet-500 bg-violet-50/70" : ""
              }
            >
              <CardContent className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-800">
                  {tab.key === "retrieval" ? (
                    <Sparkles />
                  ) : tab.key === "shadowing" ? (
                    <Headphones />
                  ) : (
                    <MessagesSquare />
                  )}
                </span>
                <div>
                  <strong>{tab.label}</strong>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tab.detail}
                  </p>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {module === "retrieval" ? (
        <Card>
          <CardHeader>
            <CardTitle>Abrufübung</CardTitle>
            <CardDescription>
              Produziere die Zielform selbst, bevor du sie siehst oder hörst
              — reines Nachsprechen ist dafür nachweislich schwächer.
              {focus === "speaking"
                ? " Sprich deine Antwort zuerst laut, bevor du sie eintippst."
                : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {retrievalRound.map((item, index) => (
              <label className="block space-y-2" key={item.itemId}>
                <span className="text-sm font-bold">{item.prompt}</span>
                <input
                  className="min-h-11 w-full rounded-xl border bg-background px-3"
                  onChange={(event) => {
                    const value = event.target.value;
                    setRetrievalAnswers((rows) => {
                      const next = [...rows];
                      next[index] = value;
                      return next;
                    });
                  }}
                  value={retrievalAnswers[index] ?? ""}
                />
                {retrievalChecked.length ? (
                  <span
                    className={
                      retrievalChecked[index]
                        ? "text-sm font-bold text-violet-800"
                        : "text-sm font-bold text-red-800"
                    }
                  >
                    {retrievalChecked[index]
                      ? "Richtig"
                      : `Modell: ${item.expected}`}
                  </span>
                ) : null}
              </label>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={checkRetrieval}>Antworten prüfen</Button>
              {retrievalChecked.length ? (
                <Button onClick={nextRetrievalRound} variant="outline">
                  <RotateCcw /> Neue Runde
                </Button>
              ) : null}
              {retrievalChecked.length ? (
                <Badge>
                  {retrievalChecked.filter(Boolean).length}/
                  {retrievalChecked.length} richtig
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {module === "formulaic" ? (
        <Card>
          <CardHeader>
            <CardTitle>Redewendungen und feste Wendungen</CardTitle>
            <CardDescription>
              Übe die ganze Wendung als Einheit, nicht Wort für Wort. Lies die
              Situation und rufe die passende feste Wendung ab.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formulaicRound.map((item, index) => (
              <label className="block space-y-2" key={item.id}>
                <span className="text-sm font-bold">{item.promptCue}</span>
                <p className="text-xs text-muted-foreground">{item.meaning}</p>
                <input
                  className="min-h-11 w-full rounded-xl border bg-background px-3"
                  onChange={(event) => {
                    const value = event.target.value;
                    setFormulaicAnswers((rows) => {
                      const next = [...rows];
                      next[index] = value;
                      return next;
                    });
                  }}
                  value={formulaicAnswers[index] ?? ""}
                />
                {formulaicChecked.length ? (
                  <span
                    className={
                      formulaicChecked[index]
                        ? "text-sm font-bold text-violet-800"
                        : "text-sm font-bold text-red-800"
                    }
                  >
                    {formulaicChecked[index]
                      ? "Richtig"
                      : `Feste Wendung: ${item.phrase}`}
                  </span>
                ) : null}
              </label>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={checkFormulaic}>Antworten prüfen</Button>
              {formulaicChecked.length ? (
                <Button onClick={nextFormulaicRound} variant="outline">
                  <RotateCcw /> Neue Runde
                </Button>
              ) : null}
              {formulaicChecked.length ? (
                <Badge>
                  {formulaicChecked.filter(Boolean).length}/
                  {formulaicChecked.length} richtig
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {module === "shadowing" ? (
        <Card>
          <CardHeader>
            <CardTitle>Fünfstufiges Schattensprechen</CardTitle>
            <CardDescription>{activeTitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectMenu
                disabled={useCustomText}
                label="Textvorlage"
                onChange={(next) => setPassageId(next)}
                options={passages.map((passage) => ({
                  value: passage.id,
                  label: `${passage.title} · ${passage.level}`,
                }))}
                value={passageId}
              />
              <label className="flex items-end gap-2 text-sm">
                <input
                  checked={useCustomText}
                  onChange={(event) => setUseCustomText(event.target.checked)}
                  type="checkbox"
                />
                <span>Eigenen Text verwenden</span>
              </label>
            </div>
            {useCustomText ? (
              <div className="space-y-2 rounded-2xl bg-violet-50 p-4">
                <input
                  className="min-h-11 w-full rounded-xl border bg-background px-3"
                  onChange={(event) => setCustomTitle(event.target.value)}
                  placeholder="Titel deines Textes"
                  value={customTitle}
                />
                <Textarea
                  aria-label="Eigener Übungstext"
                  onChange={(event) => setCustomText(event.target.value)}
                  placeholder="Füge hier deinen eigenen Text ein …"
                  value={customText}
                />
                <p className="text-xs text-muted-foreground">
                  Ohne menschliche Aufnahme wird dein eigener Text mit
                  Sprachsynthese vorgelesen.
                </p>
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-5">
              {SHADOWING_STAGES.map((stage) => (
                <button
                  className={`min-h-20 rounded-2xl border p-3 text-left text-xs font-bold ${
                    activeStage === stage
                      ? "border-violet-700 bg-violet-100 text-violet-950"
                      : completedStages.has(stage)
                        ? "border-violet-300 bg-violet-50"
                        : "bg-background"
                  }`}
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  type="button"
                >
                  <span className="mb-1 block text-muted-foreground">
                    Stufe {stage}
                  </span>
                  {completedStages.has(stage) ? (
                    <Check className="mb-1 size-4" />
                  ) : null}
                  {shadowingStageLabels[stage]}
                </button>
              ))}
            </div>

            {activeStage === 1 ? (
              <div className="space-y-3 rounded-2xl bg-violet-950 p-5 text-violet-50">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <Headphones className="size-4" /> Hören für den Sinn — nur
                  einmal abspielen, nicht wiederholen. Es geht ums Verstehen,
                  nicht ums Nachahmen.
                </p>
                <Button
                  className="bg-white text-violet-950 hover:bg-violet-100"
                  disabled={!activeText || stage1Played}
                  onClick={() => {
                    setStage1Played(true);
                    void speakAtRate(activeText, 1, activeContextKey);
                  }}
                >
                  <Volume2 /> Einmal abspielen
                </Button>
                {teacherContentId ? (
                  <div className="rounded-xl bg-white/10 p-3">
                    <HumanAudioPlayer compact contentId={teacherContentId} />
                  </div>
                ) : null}
                <Button
                  disabled={!stage1Played}
                  onClick={() => completeStage(1)}
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Weiter zu Stufe 2
                </Button>
              </div>
            ) : null}

            {activeStage === 2 ? (
              <div className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50 p-5">
                <p className="flex items-center gap-2 text-sm font-bold text-violet-950">
                  <Gauge className="size-4" /> Langsames Shadowing — sprich
                  fast gleichzeitig mit. Wenn du 2–3 Wörter verpasst, mach
                  einfach weiter — nicht neu anfangen.
                </p>
                <SelectMenu
                  className="w-44"
                  label="Geschwindigkeit"
                  onChange={(next) =>
                    setSlowRate(Number(next) as 0.75 | 0.85)
                  }
                  options={[
                    { value: "0.75", label: "0,75x" },
                    { value: "0.85", label: "0,85x" },
                  ]}
                  value={String(slowRate)}
                />
                <Button
                  disabled={!activeText}
                  onClick={() => void speakAtRate(activeText, slowRate, activeContextKey)}
                >
                  <Volume2 /> Abspielen ({slowRate}x)
                </Button>
                <Button onClick={() => completeStage(2)} variant="outline">
                  Stufe abgeschlossen
                </Button>
              </div>
            ) : null}

            {activeStage === 3 ? (
              <div className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50 p-5">
                <p className="flex items-center gap-2 text-sm font-bold text-violet-950">
                  <Captions className="size-4" /> Präzises Shadowing — achte
                  auf Wortverbindungen (Verschleifung), Wortbetonung, Pausen
                  und die Intonation am Satzende. Wiederhole den Abschnitt
                  zweimal.
                </p>
                <p className="rounded-xl bg-white p-4 leading-7">
                  {activeText}
                </p>
                <Button
                  disabled={!activeText}
                  onClick={() => void speakAtRate(activeText, 0.9, activeContextKey)}
                >
                  <Volume2 /> Abspielen
                </Button>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    checked={preciseRepeated}
                    onChange={(event) => setPreciseRepeated(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Ich habe den Abschnitt zweimal wiederholt.</span>
                </label>
                <Button
                  disabled={!preciseRepeated}
                  onClick={() => completeStage(3)}
                  variant="outline"
                >
                  Stufe abgeschlossen
                </Button>
              </div>
            ) : null}

            {activeStage === 4 ? (
              <div className="space-y-3 rounded-2xl border border-violet-500 bg-violet-100 p-5">
                <Badge className="bg-violet-700 text-white">
                  Wichtigste Stufe
                </Badge>
                <p className="flex items-center gap-2 text-sm font-bold text-violet-950">
                  <Timer className="size-4" /> Verzögertes Shadowing — sprich
                  mit 1–2 Sekunden Verzögerung nach. Halte die Phrase kurz im
                  Gedächtnis, bevor du sie sagst.
                </p>
                <Button
                  disabled={!activeText}
                  onClick={() => void speakAtRate(activeText, 0.9, activeContextKey)}
                >
                  <Volume2 /> Abspielen
                </Button>
                <Button onClick={() => completeStage(4)} variant="outline">
                  Stufe abgeschlossen
                </Button>
              </div>
            ) : null}

            {activeStage === 5 ? (
              <div className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50 p-5">
                <p className="flex items-center gap-2 text-sm font-bold text-violet-950">
                  <Mic className="size-4" /> Freies Nacherzählen — kein Audio
                  mehr. Erzähle den Inhalt in deinen eigenen Worten nach; das
                  ist der eigentliche Test, ob das Muster wirklich nutzbar
                  ist.
                </p>
                <Textarea
                  aria-label="Freie Nacherzählung"
                  onChange={(event) => setRetellText(event.target.value)}
                  placeholder="Erzähle den Inhalt mit eigenen Worten …"
                  value={retellText}
                />
                <Button
                  disabled={!retellText.trim() || retellChecking}
                  onClick={() => void submitRetelling()}
                >
                  {retellChecking ? "Wird geprüft …" : "Nacherzählung prüfen"}
                </Button>
                {retellAnalysis ? <Feedback analysis={retellAnalysis} /> : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-violet-200">
        <CardHeader>
          <CardTitle>4-Wochen-Automatik-Matrix</CardTitle>
          <CardDescription>
            Übungsart × Woche. „Automatisch“ zählt nur, wenn ein Versuch
            geprüft war, das Ziel getroffen hat und die Antwortzeit unter der
            Automatik-Schwelle lag — derselbe Maßstab wie im übrigen
            Beherrschungsmodell.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left font-bold">Woche</th>
                {AUTOMATIZATION_MATRIX_COLUMNS.map((column) => (
                  <th className="p-2 text-left font-bold" key={column.key}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr className="border-t border-violet-100" key={row.weekStart}>
                  <td className="p-2 font-bold">{row.weekLabel}</td>
                  {AUTOMATIZATION_MATRIX_COLUMNS.map((column) => {
                    const cell = row.cells[column.key];
                    return (
                      <td className="p-2" key={column.key}>
                        {cell.attempts === 0 ? (
                          <span className="text-muted-foreground">–</span>
                        ) : (
                          <span>
                            {cell.attempts}
                            {cell.automaticAttempts > 0 ? (
                              <span className="ml-1 text-xs font-bold text-violet-800">
                                ({cell.automaticAttempts} automatisch)
                              </span>
                            ) : null}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
