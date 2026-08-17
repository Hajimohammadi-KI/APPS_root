"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  Check,
  CircleAlert,
  Headphones,
  Mic,
  PenLine,
  Play,
  RotateCcw,
  Square,
  Volume2,
} from "lucide-react";
import { grammarUnits, type GrammarUnit } from "@grammar/content";
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
import {
  useAppStore,
  recalculateMastery,
  lessonKey,
  dailyPlanCompletion,
  transferSituation,
} from "@/features/store/app-store";
import {
  analyzePresentPerfect,
  evaluatePracticeAnswer,
  type AutomaticityAnalysis,
  type AutomaticityIssue,
} from "@/lib/automaticity-analysis";
import { evaluateResponse } from "@/lib/assessment";
import { putAudio } from "@/lib/audio-db";
import {
  analyzeAudioFluency,
  scoreFromActiveSpeech,
  type AudioFluencyAnalysis,
} from "@/lib/audio-fluency";
import { makeId, todayKey } from "@/lib/utils";
import { DueReviews } from "@/features/components/due-reviews";

function requireDefaultGrammar() {
  const grammar =
    grammarUnits.find(
      (unit) => unit.title.toLocaleLowerCase("en") === "present perfect",
    ) ?? grammarUnits.at(0);
  if (!grammar) throw new Error("The grammar catalog is empty.");
  return grammar;
}

const defaultGrammar = requireDefaultGrammar();
// Tracks packages/content's own version so recorded evidence stays
// traceable to the exact rules/exercises that produced it if content
// changes later. Not a real Task/Rubric version (packages/evidence-domain
// defines that concept but nothing in this runtime calls it yet) -- this is
// what's honestly available today.
export const EVIDENCE_CONTENT_VERSION = "27.2.0";
// A speaking attempt needs at least this much actual decoded speech (not
// silence/pauses) before its language-correctness check is allowed to count
// as verified speaking evidence -- otherwise a two-second "yes" with a long
// typed transcript could satisfy the same bar as genuine spontaneous speech.
const MIN_ACTIVE_SPEECH_SECONDS_FOR_VERIFIED = 20;
const presentPerfectModel =
  "I have worked on an important project this week. I have already solved two difficult problems. My supervisor has given me useful feedback. I have never felt so prepared to explain my work.";

const presentPerfectExercises = [
  {
    prompt: "Transform: I started this project in May and I still work on it.",
    expected: "I have worked on this project since May",
  },
  {
    prompt: "Complete: She ___ already ___ the report. (write)",
    expected: "She has already written the report",
  },
  {
    prompt: "Transform: This is my first experience with shadowing.",
    expected: "I have never tried shadowing before",
  },
] as const;


// The full pool a topic can draw rounds from -- curriculum.ts guarantees at
// least MINIMUM_CONTROLLED_EXERCISES (10) well-formed exercises per unit.
// Each Mission round only shows ROUND_SIZE of them (see pickRound below),
// so a learner can repeat controlled practice on the same topic multiple
// times without seeing an identical round, instead of a one-shot fixed set.
const ROUND_SIZE = 6;

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

// One round must never ask for the same answer twice. Several units carry two
// prompts that point at an identical expected string -- "Verb be: am/is/are"
// has both "State the rule ... from memory" and "Recall the rule ... without
// looking it up" (both expect the unit's `rule` verbatim, because `recallTest`
// IS `rule` for that unit), plus "Repair this common error ..." and "Correct
// the sentence: I am agree." (both expect "I agree."). Drawing them into the
// same round produced a 6-item round holding only 3 distinct answers, so the
// score partly measured typing one string twice. The pool deliberately keeps
// both phrasings -- re-retrieving a verified sentence in a LATER round is real
// spaced practice -- but a single round now takes at most one prompt per
// expected answer.
function dedupeByAnswer<T extends { expected: string }>(pool: readonly T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const item of pool) {
    const answerKey = item.expected.trim().toLocaleLowerCase("en");
    if (seen.has(answerKey)) continue;
    seen.add(answerKey);
    unique.push(item);
  }
  return unique;
}

function pickRound<T extends { expected: string }>(
  pool: readonly T[],
  size: number,
): T[] {
  return dedupeByAnswer(shuffled(pool)).slice(0, size);
}

function lessonExercises(grammar: GrammarUnit) {
  if (grammar.title.toLocaleLowerCase("en") === "present perfect") {
    return presentPerfectExercises;
  }
  return grammar.exercises.map(([prompt, expected]) => ({
    prompt,
    expected,
  }));
}

function lessonModel(grammar: GrammarUnit) {
  if (grammar.title.toLocaleLowerCase("en") === "present perfect") {
    return presentPerfectModel;
  }
  return grammar.testAnswer.trim() || grammar.examples.join(" ");
}

const shadowingStages = [
  "Listen without reading",
  "Listen while following the text",
  "Shadow one sentence at a time",
  "Shadow the complete passage",
  "Retell it freely without the text",
] as const;

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
}

function Axis({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm font-bold">
        <span>{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-violet-100">
        <div
          aria-hidden
          className="h-full rounded-full bg-violet-700 transition-[width]"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

// Turns the "why" a correction was made into something to actually go do,
// not just read. Every issue code gets a distinct follow-up action instead
// of a generic "practice more" -- the corrective step this feedback used to
// be missing entirely (was: one-line message + a bare original -> corrected
// diff, with no explicit "what do I do about it" step).
function correctiveExerciseFor(issue: AutomaticityIssue): string {
  switch (issue.code) {
    case "auxiliary_agreement":
      return `Say the corrected form aloud three times, then write one new sentence with the same subject: "${issue.corrected}"`;
    case "missing_target":
      return `Rewrite this sentence so it clearly uses the target pattern: "${issue.corrected}"`;
    case "unfinished_sentence":
      return "Read your sentence aloud and add the missing end punctuation before saving again.";
    case "spelling_error":
      return `Spell "${issue.corrected}" aloud, letter by letter, then retype it from memory.`;
    case "language_error":
      return `Compare your sentence with the corrected form and say out loud why it changed: "${issue.corrected}"`;
  }
}

function Feedback({ analysis }: { analysis: AutomaticityAnalysis }) {
  return (
    <div className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <strong className="block text-lg">{analysis.sentenceCount}</strong>
          sentences
        </div>
        <div>
          <strong className="block text-lg">{analysis.targetUses}</strong>target
          uses
        </div>
        <div>
          <strong className="block text-lg">{analysis.score}%</strong>practice
          score
        </div>
      </div>
      {analysis.issues.length ? (
        <ul className="space-y-3 text-sm">
          {analysis.issues.map((issue) => (
            <li
              className="space-y-1.5 rounded-xl bg-white p-3"
              key={`${issue.code}-${issue.original}`}
            >
              <p>
                <span className="mr-1 font-bold text-red-800">Where:</span>
                {issue.original}
              </p>
              <p>
                <span className="mr-1 font-bold text-red-800">Why:</span>
                {issue.message}
              </p>
              <p>
                <span className="mr-1 font-bold text-violet-900">
                  Correct form:
                </span>
                {issue.corrected}
              </p>
              <p className="text-muted-foreground">
                <span className="mr-1 font-bold text-violet-900">
                  Practice this:
                </span>
                {correctiveExerciseFor(issue)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-sm font-bold text-violet-900">
          <Check className="size-4" /> The offline pattern check found no target
          error.
        </p>
      )}
    </div>
  );
}

export function AutomaticityScreen({
  embedded = false,
  focusedStep,
  stepOffset = 0,
}: {
  embedded?: boolean;
  focusedStep?: number;
  stepOffset?: number;
} = {}) {
  const { state, hydrated, mutate, recordAttempt } = useAppStore();
  const missionMinutes = state.settings.dailyStudyMinutes;
  const selectedLevel = state.learner.selfDeclaredLevel ?? "A1";
  const grammar =
    grammarUnits.find((unit) => unit.title === state.todayGrammar?.title) ??
    grammarUnits.find((unit) => unit.level === selectedLevel) ??
    defaultGrammar;
  const topic = grammar.title;
  const key = lessonKey(grammar.title);
  const exercises = lessonExercises(grammar);
  const modelText = lessonModel(grammar);
  const plan = state.dailyPlans[todayKey()] ?? { completed: [], answers: {} };
  // Deterministic (unshuffled) for the very first render so server and
  // client agree during hydration -- pickRound() uses Math.random(), which
  // runs independently during SSR and the initial client render and would
  // otherwise produce two different rounds, a real hydration mismatch
  // (caught by an actual e2e run, not typecheck/unit tests).
  const [roundExercises, setRoundExercises] = React.useState<
    ReturnType<typeof lessonExercises>
    // Deduped here too (not only in pickRound) so the very first, deliberately
    // unshuffled round is subject to the same one-answer-per-round rule.
  >(() => dedupeByAnswer(exercises).slice(0, ROUND_SIZE));
  const [answers, setAnswers] = React.useState<string[]>(() =>
    roundExercises.map(() => ""),
  );
  const [checkedAnswers, setCheckedAnswers] = React.useState<boolean[]>([]);
  const [practiceRounds, setPracticeRounds] = React.useState(0);
  // Retrieval practice only measures retrieval when the answer is NOT on
  // screen. Every expected answer in this step is drawn from the unit's own
  // rule/examples/commonError -- precisely the text the lesson panel prints
  // directly above the inputs. With that panel open, "State the rule from
  // memory" is a copy-typing task and the 100% it produces is evidence of
  // nothing. The lesson stays (it IS the teaching, and the learner asked to
  // keep it); it simply closes while answering. A round answered with the
  // rule visible is still practice, but it is recorded as study rather than
  // as verified retrieval evidence, so mastery cannot be inflated by copying.
  const [lessonOpen, setLessonOpen] = React.useState(true);
  const [peeked, setPeeked] = React.useState(false);
  // Re-shuffles into a genuine random round on mount (client-only, so it
  // never runs during SSR/hydration), and again any time `key` changes --
  // `key` is derived from the grammar topic, so this also resets the round
  // whenever the topic changes on a re-render rather than a full remount
  // (e.g. picking a different unit in Grammar Lab, which renders this same
  // AutomaticityScreen instance with a new `grammar` prop instead of
  // unmounting it). Without this, roundExercises/answers stayed frozen on
  // whatever topic was active at the *first* mount -- the heading and rule
  // text would correctly show the newly selected topic while the exercises
  // below kept showing the old one, a real mismatch an actual e2e run
  // caught that no amount of typechecking would have.
  const previousKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (previousKeyRef.current === key) return;
    previousKeyRef.current = key;
    const freshRound = pickRound(exercises, ROUND_SIZE);
    setRoundExercises(freshRound);
    setAnswers(freshRound.map(() => ""));
    setCheckedAnswers([]);
    setPracticeRounds(0);
    // A new topic starts in the study phase again: the learner has not seen
    // this unit's rule yet, so opening on a hidden lesson would be a test
    // before any teaching.
    setLessonOpen(true);
    setPeeked(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `exercises` is derived from `grammar`, which `key` already uniquely identifies; re-running per `exercises` identity would refire every render
  }, [key]);
  const [journal, setJournal] = React.useState("");
  const [transcript, setTranscript] = React.useState("");
  const [journalAnalysis, setJournalAnalysis] =
    React.useState<AutomaticityAnalysis | null>(null);
  const [speechAnalysis, setSpeechAnalysis] =
    React.useState<AutomaticityAnalysis | null>(null);
  const [audioFluencyResult, setAudioFluencyResult] =
    React.useState<AudioFluencyAnalysis | null>(null);
  const [transferAttempt, setTransferAttempt] = React.useState("");
  const [transferAnalysis, setTransferAnalysis] =
    React.useState<AutomaticityAnalysis | null>(null);
  const [transferChecking, setTransferChecking] = React.useState(false);
  // Was recomputed by filtering the whole (potentially 1000-entry) attempts
  // array on every render, including ones triggered by unrelated state
  // (typing in the journal Textarea re-renders this component but doesn't
  // change state.attempts or topic).
  const priorTransferAttempts = React.useMemo(
    () =>
      state.attempts.filter(
        (attempt) => attempt.grammarTitle === topic && attempt.mode === "transfer",
      ).length,
    [state.attempts, topic],
  );
  const situation = transferSituation(grammar, priorTransferAttempts);
  const [activeStep, setActiveStep] = React.useState<number>(
    focusedStep ??
      [0, 1, 2].find((step) => !dailyPlanCompletion(plan, key)[step]) ??
      0,
  );
  const [recording, setRecording] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const [message, setMessage] = React.useState(
    `Ready for your ${missionMinutes}-minute evidence practice.`,
  );
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const audioRef = React.useRef<Blob | null>(null);
  const rawTranscriptRef = React.useRef("");
  // Timestamp of the first keystroke in each Textarea, cleared after the
  // attempt is saved. Feeds the writing/transfer latency dimension of
  // recalculateMastery -- automaticity is a speed claim, not just an
  // accuracy one, so composing quickly (not just correctly) has to be part
  // of what "automatic" measures, the same way German's domain package
  // already gates on median response latency.
  const journalStartRef = React.useRef<number | null>(null);
  const transferStartRef = React.useRef<number | null>(null);
  const startedAtRef = React.useRef(0);
  const restoredRef = React.useRef(false);

  React.useEffect(() => {
    if (!hydrated || restoredRef.current) return;
    restoredRef.current = true;
    setJournal(plan.answers[`${key}:journal`] ?? "");
    setTranscript(plan.answers[`${key}:transcript`] ?? "");
  }, [hydrated, key, plan.answers]);

  React.useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(
      () =>
        setSeconds(
          Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1_000)),
        ),
      500,
    );
    return () => window.clearInterval(timer);
  }, [recording]);

  React.useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      try {
        recognitionRef.current?.stop();
      } catch {
        /* already stopped */
      }
    },
    [],
  );

  const completion = dailyPlanCompletion(plan, key);
  const progress =
    completion.filter(Boolean).length * 33 +
    (completion.every(Boolean) ? 1 : 0);
  const shadowing = shadowingStages.map(
    (_, index) => plan.answers[`${key}:shadow:${index}`] === "done",
  );
  const verifiedMastery = state.mastery[topic];

  function writePlan(key: string, value: string) {
    mutate((draft) => {
      const date = todayKey();
      const current = draft.dailyPlans[date] ?? { completed: [], answers: {} };
      current.answers[key] = value;
      draft.dailyPlans[date] = current;
      draft.activity[date] = Math.max(1, completion.filter(Boolean).length);
    });
  }

  function checkPractice() {
    // The rule being on screen (either never hidden, or reopened mid-round)
    // makes this round open-book. Tracked as one flag so the recorded attempt
    // and the learner-facing message always agree about which it was.
    const openBook = lessonOpen || peeked;
    const results = answers.map((answer, index) =>
      evaluatePracticeAnswer(answer, {
        prompt: roundExercises[index]?.prompt ?? "",
        expected: roundExercises[index]?.expected ?? "",
      }),
    );
    setCheckedAnswers(results);
    const score = Math.round(
      (results.filter(Boolean).length / roundExercises.length) * 100,
    );
    recordAttempt({
      grammarTitle: topic,
      mode: "recognition",
      inputText: answers.join("\n"),
      correctedText: roundExercises.map((item) => item.expected).join("\n"),
      targetHit: results.every(Boolean),
      accuracyScore: score,
      fluencyScore: 0,
      latencyMs: null,
      passed: results.every(Boolean),
      // evaluatePracticeAnswer is a deterministic exact-match check against a
      // known-correct answer (with a narrow open-production allowance) --
      // not self-rated, not a network call, not fabricated. It's a distinct
      // and legitimate verification basis from the online-provider one used
      // for writing/speaking, so it can set verified on the same footing:
      // true only when the check itself passed -- AND only when the answer
      // was not readable on screen at the time. An open-book round is real
      // practice but it is not retrieval evidence, so it must not raise
      // mastery.
      verified: results.every(Boolean) && !openBook,
      assessedBy: "offline",
      contentVersion: EVIDENCE_CONTENT_VERSION,
    });
    if (results.every(Boolean)) {
      writePlan(`${key}:practice`, "done");
      setMessage(
        openBook
          ? "All correct, but the rule was visible -- this counts as study, not recall. Hide it and run one more round to earn evidence."
          : "Controlled practice complete, answered from memory. Now produce your own language.",
      );
    } else {
      setMessage("Review the model answers and correct the highlighted items.");
    }
  }

  // Repetition without repeating the same round: draws a fresh shuffled
  // subset from the full exercise pool (up to ~10 items per topic since the
  // curriculum.ts pool expansion) so a learner can do several genuinely
  // different retrieval rounds on the same topic in one sitting, instead of
  // the controlled-practice step being a one-shot, never-repeated task.
  function practiceAgain() {
    const nextRound = pickRound(exercises, ROUND_SIZE);
    setRoundExercises(nextRound);
    setAnswers(nextRound.map(() => ""));
    setCheckedAnswers([]);
    setPracticeRounds((count) => count + 1);
    // A fresh round gets a fresh closed-book chance: the peek that spoiled the
    // previous round should not permanently disqualify every later one.
    setLessonOpen(false);
    setPeeked(false);
    setMessage("New round ready, rule hidden. The step stays complete either way.");
  }

  function addIssuesToErrorWorkshop(
    analysis: AutomaticityAnalysis,
    sourceText: string,
  ) {
    mutate((draft) => {
      for (const issue of analysis.issues.filter(
        (row) => row.code !== "unfinished_sentence",
      )) {
        const errorClass =
          issue.code === "auxiliary_agreement"
            ? "auxiliary"
            : issue.code === "language_error"
              ? "other"
              : issue.code === "spelling_error"
                ? "spelling"
                : "tense";
        const existing = draft.errors.find(
          (row) =>
            row.grammarTitle === topic &&
            row.errorClass === errorClass,
        );
        if (existing) {
          existing.occurrenceCount += 1;
          existing.lastSeenAt = new Date().toISOString();
          existing.repairStatus = "scheduled";
          existing.nextRepairAt = Date.now();
        } else {
          const id = makeId("automaticity-error");
          draft.errors.push({
            id,
            grammarTitle: topic,
            topic: `${topic} output`,
            errorClass,
            originalText: issue.original || sourceText,
            correctedText: issue.corrected,
            explanation: issue.message,
            occurrenceCount: 1,
            repairStatus: "scheduled",
            nextRepairAt: Date.now(),
            lastSeenAt: new Date().toISOString(),
          });
          draft.reviews.push({
            id: makeId("automaticity-review"),
            sourceType: "error_item",
            sourceId: id,
            topic,
            original: issue.original || sourceText,
            corrected: issue.corrected,
            intervalDays: 1,
            dueAt: Date.now(),
            successStreak: 0,
            stabilityScore: 0,
            mode: "repair",
            status: "pending",
          });
        }
      }
      recalculateMastery(draft, topic);
    });
  }

  async function analyzeLessonOutput(
    text: string,
    minimumSentences: number,
  ): Promise<AutomaticityAnalysis> {
    if (topic.toLocaleLowerCase("en") === "present perfect") {
      return analyzePresentPerfect(text);
    }
    const evaluation = await evaluateResponse(
      text,
      {
        grammar,
        minWords: minimumSentences * 4,
        minSentences: minimumSentences,
        requiredTargetUses: 1,
        taskPrompt: `Use ${topic} in original sentences connected to your life.`,
      },
      state.settings,
    );
    // Spelling and grammar matches are mapped to distinct issue codes so a
    // spelling-only slip is never recorded to the Error Workshop as a
    // generic ("other"-class) language error later in
    // addIssuesToErrorWorkshop. Grammar automaticity is the pedagogical
    // target here, not spelling perfection — a learner should still see the
    // correction, but it must not read as a grammar mistake or block
    // automaticity the way an actual grammar error does.
    const issues: AutomaticityAnalysis["issues"] = [
      ...evaluation.spelling.map((match) => ({
        code: "spelling_error" as const,
        message: match.message,
        original: match.context?.text ?? evaluation.original,
        corrected: match.replacements[0]?.value ?? evaluation.corrected,
      })),
      ...evaluation.grammarIssues.map((match) => ({
        code: "language_error" as const,
        message: match.message,
        original: match.context?.text ?? evaluation.original,
        corrected: match.replacements[0]?.value ?? evaluation.corrected,
      })),
    ];
    if (evaluation.targetUses < evaluation.required) {
      issues.push({
        code: "missing_target",
        message: `Use the lesson pattern from ${topic} at least once.`,
        original: text,
        corrected: grammar.examples[0] ?? grammar.testAnswer,
      });
    }
    if (!evaluation.complete) {
      issues.push({
        code: "unfinished_sentence",
        message: `Write at least ${minimumSentences} complete sentences.`,
        original: text,
        corrected: grammar.testAnswer,
      });
    }
    return {
      sentenceCount: evaluation.sentences,
      wordCount: evaluation.words,
      targetUses: evaluation.targetUses,
      score: evaluation.accuracyScore,
      targetHit: evaluation.pass,
      issues,
      masteryEligible: evaluation.masteryEligible,
      online: evaluation.online,
    };
  }

  async function saveWriting() {
    const analysis = await analyzeLessonOutput(journal, 4);
    setJournalAnalysis(analysis);
    writePlan(`${key}:journal`, journal);
    const latencyMs = journalStartRef.current
      ? Date.now() - journalStartRef.current
      : null;
    journalStartRef.current = null;
    recordAttempt({
      grammarTitle: topic,
      mode: "writing",
      inputText: journal,
      correctedText: journal,
      targetHit: analysis.targetHit,
      accuracyScore: analysis.score,
      fluencyScore: 0,
      latencyMs,
      passed: analysis.targetHit,
      verified: analysis.masteryEligible,
      assessedBy: analysis.online ? "online" : "offline",
      contentVersion: EVIDENCE_CONTENT_VERSION,
    });
    addIssuesToErrorWorkshop(analysis, journal);
    if (analysis.targetHit) writePlan(`${key}:writing`, "done");
    setMessage(
      analysis.targetHit
        ? `Journal saved. You have created real ${topic} output.`
        : `Draft saved. Use the feedback to produce complete, accurate ${topic} sentences.`,
    );
  }

  // Transfer (contract §8.3): a distinct task requiring the same target
  // grammar in a new communicative situation, not the writing step's "your
  // life" prompt re-labeled. The reference/model is never shown before this
  // runs -- analyzeLessonOutput only evaluates what the learner already
  // submitted -- and the attempt is recorded with mode:"transfer" so
  // recalculateMastery's transferScore reflects real evidence instead of
  // staying permanently empty.
  async function saveTransfer() {
    setTransferChecking(true);
    try {
      const analysis = await analyzeLessonOutput(transferAttempt, 2);
      setTransferAnalysis(analysis);
      const latencyMs = transferStartRef.current
        ? Date.now() - transferStartRef.current
        : null;
      transferStartRef.current = null;
      recordAttempt({
        grammarTitle: topic,
        mode: "transfer",
        inputText: transferAttempt,
        correctedText: transferAttempt,
        targetHit: analysis.targetHit,
        accuracyScore: analysis.score,
        fluencyScore: 0,
        latencyMs,
        passed: analysis.targetHit,
        verified: analysis.masteryEligible,
        assessedBy: analysis.online ? "online" : "offline",
        contentVersion: EVIDENCE_CONTENT_VERSION,
      });
      addIssuesToErrorWorkshop(analysis, transferAttempt);
      if (analysis.targetHit) writePlan(`${key}:transfer`, "done");
    } finally {
      setTransferChecking(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      audioRef.current = null;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        audioRef.current = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      startedAtRef.current = Date.now();
      setSeconds(0);
      setRecording(true);

      const Recognition = getSpeechRecognition();
      if (Recognition) {
        const recognition = new Recognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;
        let finalText = transcript.trim();
        recognition.onresult = (event) => {
          let interim = "";
          for (
            let index = event.resultIndex;
            index < event.results.length;
            index += 1
          ) {
            const result = event.results[index];
            if (!result) continue;
            if (result.isFinal)
              finalText += `${finalText ? " " : ""}${result[0].transcript}`;
            else interim += `${interim ? " " : ""}${result[0].transcript}`;
          }
          setTranscript(`${finalText} ${interim}`.trim());
        };
        recognition.start();
        recognitionRef.current = recognition;
      }
      setMessage("Recording. Speak about recent experiences for one minute.");
    } catch (error) {
      setMessage(
        `${error instanceof Error ? error.message : "Microphone unavailable."} Type the transcript instead.`,
      );
    }
  }

  async function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
    // Snapshot the transcript right as recording stops, before the learner
    // has any chance to edit it in the review textarea below -- this is
    // what Attempt.rawTranscript should preserve, separately from whatever
    // (possibly edited) text ends up in inputText at save time.
    rawTranscriptRef.current = transcript;
    setRecording(false);
    setMessage("Recording stopped. Check and save the transcript.");
  }

  async function saveSpeaking() {
    if (recording) await stopRecording();
    const analysis = await analyzeLessonOutput(transcript, 2);
    setSpeechAnalysis(analysis);
    writePlan(`${key}:transcript`, transcript);
    mutate((draft) => {
      draft.sessions.push({
        id: makeId("automaticity-session"),
        date: new Date().toISOString(),
        topic: `${topic} transfer`,
        grammarTitle: topic,
        transcript,
        corrected: transcript,
        seconds,
        targetUses: analysis.targetUses,
      });
    });
    const willSaveAudio = state.settings.saveAudio && Boolean(audioRef.current);
    const audioId = willSaveAudio ? makeId("automaticity-audio") : undefined;
    // Real, audio-derived fluency when a recording is available to analyze
    // (independent of whether it's being *persisted* -- analysis just needs
    // the in-memory blob, not long-term storage). If there's no audio to
    // analyze, 0 follows this codebase's existing "not applicable/not
    // measured" convention (the same value every non-speaking mode already
    // passes here) rather than presenting a text-derived estimate as if it
    // were a measured fluency score.
    const audioFluency = audioRef.current
      ? await analyzeAudioFluency(audioRef.current)
      : null;
    setAudioFluencyResult(audioFluency);
    const fluencyScore = audioFluency
      ? scoreFromActiveSpeech(analysis.wordCount, audioFluency.activeSpeechSeconds)
      : 0;
    // A transcript can be typed, edited, or produced with no microphone
    // ever used -- evaluateResponse only ever sees text, so masteryEligible
    // alone proves the *language* was correct, never that it was actually
    // spoken. Speaking mastery specifically must additionally require real
    // decoded audio with a non-trivial amount of actual speech in it, not
    // just that the (possibly audio-free) transcript passed a text check.
    const hasValidAudioEvidence =
      Boolean(audioFluency) &&
      audioFluency!.activeSpeechSeconds >= MIN_ACTIVE_SPEECH_SECONDS_FOR_VERIFIED;
    recordAttempt({
      grammarTitle: topic,
      mode: "speaking",
      inputText: transcript,
      correctedText: transcript,
      targetHit: analysis.targetHit && seconds >= 45 && hasValidAudioEvidence,
      accuracyScore: analysis.score,
      fluencyScore,
      latencyMs: null,
      passed: analysis.targetHit && seconds >= 45 && hasValidAudioEvidence,
      verified: analysis.masteryEligible && hasValidAudioEvidence,
      audioId,
      rawTranscript: rawTranscriptRef.current || transcript,
      assessedBy: analysis.online ? "online" : "offline",
      contentVersion: EVIDENCE_CONTENT_VERSION,
    });
    addIssuesToErrorWorkshop(analysis, transcript);
    // Completing the step still only needs a real, sufficiently long
    // recording (not the stricter language-mastery bar above) -- but it may
    // never be satisfied by typing with no microphone use at all, which the
    // previous `|| !audioRef.current` bypass allowed.
    if (analysis.targetHit && seconds >= 45 && audioRef.current) {
      writePlan(`${key}:speaking`, "done");
    }
    if (willSaveAudio && audioRef.current && audioId) {
      await putAudio({
        id: audioId,
        blob: audioRef.current,
        createdAt: new Date().toISOString(),
        grammarTitle: topic,
        topic: `${topic} transfer`,
        transcript,
        corrected: transcript,
        repetitionStatus: "new",
      });
    }
    setMessage(
      "Speaking evidence saved locally. Repeat once after reviewing the feedback.",
    );
  }

  return (
    <div className="page-stack">
      {!embedded ? <div className="page-heading automaticity-hero">
        <div>
          <Badge>Today · {missionMinutes} minutes</Badge>
          <h1>Automaticity Mission</h1>
          <p>
            Activate, use accurately, automate aloud, and transfer into free
            speech. The mission ends with saved evidence, not a simple click.
          </p>
        </div>
        <Button
          className="automaticity-hero-action"
          size="lg"
          onClick={() =>
            document
              .getElementById("mission")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <Play className="size-4" /> Start evidence practice
        </Button>
      </div> : focusedStep === undefined ? (
        <Card className="border-violet-300 bg-violet-50/70">
          <CardHeader>
            <CardTitle>Steps {stepOffset + 1}–{stepOffset + 3} · Build usable evidence</CardTitle>
            <CardDescription>Finish controlled practice, connected writing, and recorded free speaking. Each result is analysed and saved.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!embedded ? <DueReviews /> : null}

      {!embedded ? <Card className="border-violet-200 bg-violet-50/70" id="mission">
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong>{topic}</strong>
              <p className="text-sm text-muted-foreground">
                {grammar.level} · {grammar.rule}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/studio?from=daily&level=${encodeURIComponent(grammar.level)}&activity=2`}
                >
                  Practice in Speaking Studio
                </Link>
              </Button>
              <Badge variant={progress === 100 ? "success" : "default"}>
                {progress}% complete
              </Badge>
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-violet-200">
            <div
              className="h-full bg-violet-700 transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p
            aria-live="polite"
            className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-violet-950"
          >
            {message}
          </p>
        </CardContent>
      </Card> : null}

      {/* Arriving here from Today's Practice previously gave no sense of a
          route: three equal-looking cards, nothing marking where to begin,
          where you are, or when the unit is finished. The bar below states the
          position in words, and each card is labelled Done / Start here / Next
          so the page reads as an ordered path rather than three options. */}
      {!embedded ? (
        <div className="rounded-2xl border border-violet-200 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-sm">
              Step {Math.min(activeStep + 1, 3)} of 3 ·{" "}
              {["Activate & use accurately", "Automate & write", "Speak freely & transfer"][activeStep] ?? ""}
            </strong>
            <span className="text-sm text-muted-foreground">
              {completion.filter(Boolean).length} of 3 finished
              {completion.every(Boolean)
                ? " · unit complete, evidence saved"
                : " · finish all three to complete this unit"}
            </span>
          </div>
          <div className="mt-2 flex gap-1" aria-hidden>
            {completion.map((done, index) => (
              <span
                className={`h-1.5 flex-1 rounded-full ${
                  done
                    ? "bg-violet-700"
                    : index === activeStep
                      ? "bg-violet-400"
                      : "bg-violet-100"
                }`}
                key={`progress-${index}`}
              />
            ))}
          </div>
        </div>
      ) : null}

      {!embedded ? <div className="grid gap-4 lg:grid-cols-3">
        {[
          [
            BookOpenCheck,
            "1. Activate & use accurately",
            "3 min · three controlled transformations",
            completion[0],
          ],
          [
            PenLine,
            "2. Automate & write",
            "4 min · six sentences with four target forms",
            completion[1],
          ],
          [
            Mic,
            "3. Speak freely & transfer",
            "5 min · shadowing and 60 seconds without a script",
            completion[2],
          ],
        ].map(([Icon, title, detail, done]) => {
          const StepIcon = Icon as typeof BookOpenCheck;
          const stepIndex = Number(String(title).slice(0, 1)) - 1;
          const isCurrent = activeStep === stepIndex;
          // "Start here" only on the current step when nothing is finished yet,
          // so exactly one card ever claims to be the entry point.
          const roleLabel = done
            ? "Done"
            : isCurrent
              ? completion.some(Boolean)
                ? "You are here"
                : "Start here"
              : "Next";
          return (
            <button
              aria-pressed={isCurrent}
              className="text-left"
              key={String(title)}
              onClick={() => setActiveStep(stepIndex)}
              type="button"
            ><Card
              className={
                done
                  ? "border-violet-500"
                  : isCurrent
                    ? "border-violet-600 ring-2 ring-violet-300"
                    : ""
              }
            >
              <span
                className={`ml-5 mt-3 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  done
                    ? "bg-violet-100 text-violet-800"
                    : isCurrent
                      ? "bg-violet-700 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {roleLabel}
              </span>
              <CardContent className="flex gap-3 pt-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-800">
                  {done ? <Check /> : <StepIcon />}
                </span>
                <div>
                  <strong>{String(title)}</strong>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {String(detail)}
                  </p>
                </div>
              </CardContent>
            </Card></button>
          );
        })}
      </div> : null}

      {/* Collapsed by default rather than deleted. Its three cards are fixed
          explanatory text -- identical on every unit and every visit -- so
          leaving them expanded pushed the actual exercises below the fold on
          each load. The message itself matters (it is what stops "completed"
          being read as "mastered"), so it stays one click away instead of
          being removed. */}
      {!embedded ? <Card className="border-violet-200">
        <CardHeader className="pb-0">
          <details>
            <summary className="cursor-pointer list-none">
              <CardTitle className="inline">Mission quality gate</CardTitle>
              <CardDescription className="mt-1">
                Completed does not automatically mean mastered. Automaticity
                needs three separate kinds of evidence. (Click to expand.)
              </CardDescription>
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-violet-50 p-4 text-sm">
            <strong>Accurate</strong>
            <p className="mt-1 text-muted-foreground">
              Use the target form correctly in your own sentences.
            </p>
          </div>
          <div className="rounded-2xl bg-violet-50 p-4 text-sm">
            <strong>Spontaneous</strong>
            <p className="mt-1 text-muted-foreground">
              Speak for at least 60 seconds without reading.
            </p>
          </div>
          <div className="rounded-2xl bg-violet-50 p-4 text-sm">
            <strong>Retained</strong>
            <p className="mt-1 text-muted-foreground">
              Recall the same form again in a later review.
            </p>
          </div>
            </div>
          </details>
        </CardHeader>
      </Card> : null}

      {(focusedStep ?? activeStep) === 0 ? <Card id={`daily-activity-${stepOffset + 1}`}>
        <CardHeader>
          <CardTitle>{stepOffset + 1}. Lesson and controlled practice</CardTitle>
          <CardDescription>
            Controlled practice is only the first part. Every item leads to
            your own output.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Study phase: the lesson is open and the learner is told plainly
              that hiding it is what turns the exercises below into recall.
              Recall phase: a compact bar replaces it, with an honest way back
              that is recorded rather than silently forgiven. */}
          {lessonOpen ? (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-violet-50 p-4">
                  <strong>Rule and form</strong>
                  <p className="mt-2">{grammar.rule}</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <strong>Examples and contrast</strong>
                  <p className="mt-2">{grammar.examples.join(" · ")}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Avoid: {grammar.commonError}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-violet-200 bg-white p-3">
                <Button onClick={() => setLessonOpen(false)} type="button">
                  Hide the rule and answer from memory
                </Button>
                <span className="text-sm text-muted-foreground">
                  Every answer below is written in these two boxes. Copying
                  them is study, not recall, so only a hidden-rule round counts
                  as evidence.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-3">
              <span className="text-sm font-bold text-violet-900">
                Rule hidden — answer from memory.
              </span>
              <Button
                onClick={() => {
                  setLessonOpen(true);
                  setPeeked(true);
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                Show the rule again
              </Button>
            </div>
          )}
          {roundExercises.map((item, index) => (
            <label className="block space-y-2" key={item.prompt}>
              <span className="text-sm font-bold">{item.prompt}</span>
              <input
                className="min-h-11 w-full rounded-xl border bg-background px-3"
                onChange={(event) => {
                  const value = event.target.value;
                  setAnswers((rows) => {
                    const next = [...rows];
                    next[index] = value;
                    return next;
                  });
                }}
                value={answers[index]}
              />
              {checkedAnswers.length ? (
                <span
                  className={
                    checkedAnswers[index]
                      ? "text-sm font-bold text-violet-800"
                      : "text-sm font-bold text-red-800"
                  }
                >
                  {checkedAnswers[index]
                    ? "Correct"
                    : `Model: ${item.expected}`}
                </span>
              ) : null}
            </label>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={checkPractice}>Check answers</Button>
            {checkedAnswers.length && exercises.length > roundExercises.length ? (
              <Button onClick={practiceAgain} variant="outline">
                <RotateCcw className="size-4" /> Practice again (new round)
              </Button>
            ) : null}
            {practiceRounds > 0 ? (
              <Badge variant="secondary">
                {practiceRounds + 1} rounds this session
              </Badge>
            ) : null}
            {/* State the evidence consequence BEFORE the learner commits,
                not only in the message afterwards. */}
            <Badge variant={lessonOpen || peeked ? "warning" : "success"}>
              {lessonOpen || peeked
                ? "Open book — counts as study"
                : "From memory — counts as evidence"}
            </Badge>
          </div>
        </CardContent>
      </Card> : null}

      {(focusedStep ?? activeStep) === 1 ? <Card id={`daily-activity-${stepOffset + 2}`}>
        <CardHeader>
          <CardTitle>{stepOffset + 2}. {topic} daily writing</CardTitle>
          <CardDescription>
            Write four or more connected sentences from your own life. Use the
            lesson pattern accurately, then review the feedback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            aria-label={`${topic} journal`}
            onChange={(event) => {
              if (journalStartRef.current === null) {
                journalStartRef.current = Date.now();
              }
              setJournal(event.target.value);
            }}
            placeholder={grammar.examples[0] ?? "Write your own example…"}
            value={journal}
          />
          <Button onClick={saveWriting}>
            <PenLine className="size-4" /> Analyse and save writing
          </Button>
          {journalAnalysis ? <Feedback analysis={journalAnalysis} /> : null}
        </CardContent>
      </Card> : null}

      {(focusedStep ?? activeStep) === 2 ? <Card id={`daily-activity-${stepOffset + 3}`}>
        <CardHeader>
          <CardTitle>{stepOffset + 3}. Five-stage shadowing and free speaking</CardTitle>
          <CardDescription>
            Listen, copy the rhythm, then retell the idea for 45–60 seconds
            without reading.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl bg-violet-950 p-5 text-violet-50">
            <p className="leading-7">{modelText}</p>
            <Button
              className="mt-4 bg-white text-violet-950 hover:bg-violet-100"
              onClick={() => speak(modelText)}
            >
              <Volume2 className="size-4" /> Play model
            </Button>
          </div>
          <div className="grid gap-2 md:grid-cols-5">
            {shadowingStages.map((stage, index) => (
              <button
                className={`min-h-24 rounded-2xl border p-3 text-left text-sm font-bold ${shadowing[index] ? "border-violet-700 bg-violet-100 text-violet-950" : "bg-background"}`}
                key={stage}
                onClick={() =>
                  writePlan(
                    `${key}:shadow:${index}`,
                    shadowing[index] ? "" : "done",
                  )
                }
                type="button"
              >
                <span className="mb-2 block text-xs text-muted-foreground">
                  Stage {index + 1}
                </span>
                {shadowing[index] ? (
                  <Check className="mb-1 size-4" />
                ) : (
                  <Headphones className="mb-1 size-4" />
                )}
                {stage}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={recording} onClick={startRecording}>
              <Mic className="size-4" /> Record
            </Button>
            <Button
              disabled={!recording}
              onClick={stopRecording}
              variant="outline"
            >
              <Square className="size-4" /> Stop
            </Button>
            <Badge variant="secondary">{seconds}s</Badge>
          </div>
          <Textarea
            aria-label="Speaking transcript"
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="Your live or typed transcript…"
            value={transcript}
          />
          <Button onClick={saveSpeaking}>Analyse and save speaking</Button>
          {speechAnalysis ? <Feedback analysis={speechAnalysis} /> : null}
          {audioFluencyResult ? (
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm sm:grid-cols-4">
              <div>
                <strong className="block text-lg">
                  {audioFluencyResult.activeSpeechSeconds.toFixed(1)}s
                </strong>
                active speech
              </div>
              <div>
                <strong className="block text-lg">{audioFluencyResult.pauseCount}</strong>
                pause(s)
              </div>
              <div>
                <strong className="block text-lg">
                  {audioFluencyResult.medianPitchHz
                    ? `${Math.round(audioFluencyResult.medianPitchHz)} Hz`
                    : "—"}
                </strong>
                typical pitch
              </div>
              <div>
                <strong className="block text-lg">
                  {audioFluencyResult.pitchVarietySemitones !== null
                    ? audioFluencyResult.pitchVarietySemitones < 1.5
                      ? "Monotone"
                      : audioFluencyResult.pitchVarietySemitones < 3.5
                        ? "Some variety"
                        : "Varied"
                    : "—"}
                </strong>
                intonation
              </div>
              <p className="col-span-2 text-xs text-muted-foreground sm:col-span-4">
                Pitch is estimated from the raw recording (no external
                service) -- a rough intonation signal, not phoneme-level
                pronunciation scoring.
              </p>
            </div>
          ) : null}

          <div className="mt-2 space-y-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
            <div>
              <p className="text-sm font-bold text-violet-950">
                Transfer: a new situation
              </p>
              <p className="text-sm text-muted-foreground">{situation}</p>
            </div>
            <Textarea
              aria-label="Transfer response"
              onChange={(event) => {
                if (transferStartRef.current === null) {
                  transferStartRef.current = Date.now();
                }
                setTransferAttempt(event.target.value);
              }}
              placeholder="Respond to the situation above using this lesson's target form."
              value={transferAttempt}
            />
            <Button
              disabled={!transferAttempt.trim() || transferChecking}
              onClick={() => void saveTransfer()}
            >
              {transferChecking ? "Checking…" : "Check transfer"}
            </Button>
            {transferAnalysis ? <Feedback analysis={transferAnalysis} /> : null}
          </div>
        </CardContent>
      </Card> : null}

      {/* Single column since "My grammar pattern plan" was removed from beside
          this card. That panel claimed "Generated from today's journal and
          speaking errors" but rendered three hardcoded list items that never
          changed for any learner, unit or error history -- it advertised
          personalisation the code did not do. Transparent mastery stays: it is
          computed from real checked answers and analyses. */}
      {focusedStep === undefined ? <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Transparent mastery</CardTitle>
            <CardDescription>
              Practice evidence is visible now. Only externally checked attempts
              raise verified mastery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Axis
              label="Controlled practice"
              value={
                checkedAnswers.length
                  ? Math.round(
                      (checkedAnswers.filter(Boolean).length /
                        checkedAnswers.length) *
                        100,
                    )
                  : (verifiedMastery?.recognitionScore ?? 0)
              }
            />
            <Axis
              label="Writing practice"
              value={
                journalAnalysis?.score ?? verifiedMastery?.writingScore ?? 0
              }
            />
            <Axis
              label="Speaking practice"
              value={
                speechAnalysis?.score ?? verifiedMastery?.speakingScore ?? 0
              }
            />
            <div className="flex gap-2">
              <Badge>Offline practice</Badge>
              <Badge variant="secondary">
                Verified mastery: {verifiedMastery?.automaticityScore ?? 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div> : null}
    </div>
  );
}
