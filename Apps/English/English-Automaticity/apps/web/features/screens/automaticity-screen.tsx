"use client";

import * as React from "react";
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
import {
  appendLearningEvidenceBundleToStorage,
  buildAttemptVerticalSlice,
  normalizeDailySessionMinutes,
  type CefrLevel,
} from "@automaticity/learning-core";
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
import { useAppStore, recalculateMastery } from "@/features/store/app-store";
import {
  practiceAnswerMatches,
  type AutomaticityAnalysis,
} from "@/lib/automaticity-analysis";
import {
  assessLessonOutput,
  type LessonOutputAssessment,
} from "@/lib/lesson-output-assessment";
import { putAudio } from "@/lib/audio-db";
import { makeId, todayKey } from "@/lib/utils";

function requireDefaultGrammar() {
  const grammar =
    grammarUnits.find(
      (unit) => unit.title.toLocaleLowerCase("en") === "present perfect",
    ) ?? grammarUnits.at(0);
  if (!grammar) throw new Error("The grammar catalog is empty.");
  return grammar;
}

const defaultGrammar = requireDefaultGrammar();
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

function lessonKey(grammar: GrammarUnit) {
  if (grammar.title.toLocaleLowerCase("en") === "present perfect") {
    return "automaticity:present-perfect";
  }
  return `automaticity:${grammar.title
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function lessonExercises(grammar: GrammarUnit) {
  if (grammar.title.toLocaleLowerCase("en") === "present perfect") {
    return presentPerfectExercises;
  }
  return grammar.exercises.slice(0, 3).map(([prompt, expected]) => ({
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

function Feedback({ analysis }: { analysis: LessonOutputAssessment }) {
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
          <strong className="block text-lg">
            {analysis.verified ? `${analysis.score}%` : "Unassessed"}
          </strong>
          {analysis.verified ? "practice score" : "assessment unavailable"}
        </div>
      </div>
      {analysis.issues.length ? (
        <ul className="space-y-2 text-sm">
          {analysis.issues.map((issue) => (
            <li
              className="rounded-xl bg-white p-3"
              key={`${issue.code}-${issue.original}`}
            >
              <strong className="text-red-800">{issue.message}</strong>
              <span className="mt-1 block text-muted-foreground">
                {issue.original} → {issue.corrected}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-sm font-bold text-violet-900">
          <Check className="size-4" />{" "}
          {analysis.verified
            ? "The language check found no listed issue."
            : "Draft saved. Local practice checks do not verify this answer."}
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
  const dueReview = state.reviews.find(
    (review) =>
      review.status === "pending" &&
      review.sourceType === "grammar_topic" &&
      review.sourceId === topic &&
      review.dueAt <= Date.now(),
  );
  const key = lessonKey(grammar);
  const exercises = lessonExercises(grammar);
  const modelText = lessonModel(grammar);
  const plan = state.dailyPlans[todayKey()] ?? { completed: [], answers: {} };
  const [answers, setAnswers] = React.useState(["", "", ""]);
  const [checkedAnswers, setCheckedAnswers] = React.useState<boolean[]>([]);
  const [journal, setJournal] = React.useState("");
  const [transcript, setTranscript] = React.useState("");
  const [journalAnalysis, setJournalAnalysis] =
    React.useState<LessonOutputAssessment | null>(null);
  const [delayedTransfer, setDelayedTransfer] = React.useState("");
  const [delayedTransferAnalysis, setDelayedTransferAnalysis] =
    React.useState<LessonOutputAssessment | null>(null);
  const [speechAnalysis, setSpeechAnalysis] =
    React.useState<LessonOutputAssessment | null>(null);
  const [activeStep, setActiveStep] = React.useState<number>(
    focusedStep ??
      [0, 1, 2].find((step) => !plan.completed.includes(step)) ??
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

  const completion = [
    plan.answers[`${key}:practice`] === "done",
    plan.answers[`${key}:writing`] === "done",
    plan.answers[`${key}:speaking`] === "done",
  ];
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
    const results = answers.map((answer, index) =>
      practiceAnswerMatches(answer, exercises[index]?.expected ?? ""),
    );
    setCheckedAnswers(results);
    const score = Math.round(
      (results.filter(Boolean).length / exercises.length) * 100,
    );
    recordAttempt({
      grammarTitle: topic,
      mode: "recognition",
      inputText: answers.join("\n"),
      correctedText: exercises.map((item) => item.expected).join("\n"),
      targetHit: results.every(Boolean),
      accuracyScore: score,
      fluencyScore: 0,
      latencyMs: null,
      passed: results.every(Boolean),
      verified: false,
    });
    if (results.every(Boolean)) {
      writePlan(`${key}:practice`, "done");
      setMessage(
        "Controlled practice complete. Now produce your own language.",
      );
    } else {
      setMessage("Review the model answers and correct the highlighted items.");
    }
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
              : "tense";
        const existing = draft.errors.find(
          (row) => row.grammarTitle === topic && row.errorClass === errorClass,
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
  ): Promise<LessonOutputAssessment> {
    return assessLessonOutput(text, grammar, minimumSentences, state.settings);
  }

  async function saveWriting() {
    const analysis = await analyzeLessonOutput(journal, 4);
    const occurredAt = new Date().toISOString();
    setJournalAnalysis(analysis);
    writePlan(`${key}:journal`, journal);
    recordAttempt({
      grammarTitle: topic,
      mode: "writing",
      inputText: journal,
      correctedText: analysis.corrected,
      targetHit: analysis.targetHit,
      accuracyScore: analysis.score,
      fluencyScore: 0,
      latencyMs: null,
      passed: analysis.masteryEligible,
      verified: analysis.verified,
    });
    appendLearningEvidenceBundleToStorage(
      window.localStorage,
      buildAttemptVerticalSlice({
        attemptId: crypto.randomUUID(),
        occurredAt,
        language: "en",
        cefrLevel: grammar.level as CefrLevel,
        contentVersion: `27.3.13-${grammar.level.toLowerCase()}-runtime`,
        topic,
        targetForm: grammar.rule,
        prompt: `Write four original sentences using ${topic}.`,
        mode: "writing",
        inputText: journal,
        correctedText: analysis.corrected,
        targetHit: analysis.targetHit,
        accuracyScore: analysis.score,
        attemptVerified: analysis.verified,
        assessedBy: analysis.verified ? "online" : "offline",
        sessionMinutes: normalizeDailySessionMinutes(missionMinutes),
        sourceId: "english-authored-grammar-curriculum-v27",
      }),
    );
    addIssuesToErrorWorkshop(analysis, journal);
    writePlan(
      `${key}:writing`,
      !analysis.verified
        ? "unassessed"
        : analysis.masteryEligible
          ? "done"
          : "needs_repair",
    );
    setMessage(
      !analysis.verified
        ? "Draft saved. Assessment is unavailable; this attempt does not count as verified progress."
        : analysis.masteryEligible
          ? `Journal saved. You have created real ${topic} output.`
          : `Draft saved. Use the feedback to produce complete, accurate ${topic} sentences.`,
    );
  }

  async function saveDelayedTransfer() {
    if (!dueReview) {
      setMessage("No delayed review is due for this lesson yet.");
      return;
    }
    const analysis = await analyzeLessonOutput(delayedTransfer, 4);
    const occurredAt = new Date().toISOString();
    const attemptId = crypto.randomUUID();
    setDelayedTransferAnalysis(analysis);
    appendLearningEvidenceBundleToStorage(
      window.localStorage,
      buildAttemptVerticalSlice({
        attemptId,
        occurredAt,
        language: "en",
        cefrLevel: grammar.level as CefrLevel,
        contentVersion: `27.3.13-${grammar.level.toLowerCase()}-runtime`,
        topic,
        targetForm: grammar.rule,
        prompt: `Recall ${topic} after a delay and transfer it to a new context.`,
        mode: "transfer",
        inputText: delayedTransfer,
        correctedText: analysis.corrected,
        targetHit: analysis.targetHit,
        accuracyScore: analysis.score,
        attemptVerified: analysis.verified,
        assessedBy: analysis.verified ? "online" : "offline",
        sessionMinutes: normalizeDailySessionMinutes(missionMinutes),
        fromDueReview: true,
        sourceId: "english-authored-grammar-curriculum-v27",
      }),
    );
    recordAttempt({
      grammarTitle: topic,
      mode: "transfer",
      inputText: delayedTransfer,
      correctedText: analysis.corrected,
      targetHit: analysis.targetHit,
      accuracyScore: analysis.score,
      fluencyScore: 0,
      latencyMs: null,
      passed: analysis.masteryEligible,
      verified: analysis.verified,
    });
    if (!analysis.verified) {
      setMessage(
        "Transfer draft saved without verified credit. The review remains due because assessment is unavailable.",
      );
      return;
    }
    // Transfer scores cannot supply explicit familiar-item FSRS ratings.
    // Keep existing review behavior; prospective collection uses its own gate.
    if (analysis.targetHit) {
      mutate((draft) => {
        const review = draft.reviews.find((row) => row.id === dueReview.id);
        if (!review) return;
        review.status = "done";
        review.successStreak += 1;
        review.stabilityScore = Math.min(100, review.stabilityScore + 20);
      });
    }
    setMessage(
      analysis.targetHit
        ? "Delayed recall and novel transfer saved as separate evidence events."
        : "Transfer saved, but the target form still needs repair before this review can pass.",
    );
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
        corrected: analysis.corrected,
        seconds,
        targetUses: analysis.targetUses,
      });
    });
    recordAttempt({
      grammarTitle: topic,
      mode: "speaking",
      inputText: transcript,
      correctedText: analysis.corrected,
      targetHit: analysis.targetHit && seconds >= 45,
      accuracyScore: analysis.score,
      fluencyScore: Math.min(
        100,
        Math.round((analysis.wordCount / Math.max(1, seconds) / 2) * 100),
      ),
      latencyMs: null,
      passed:
        analysis.masteryEligible &&
        seconds >= 45 &&
        Boolean(audioRef.current?.size),
      verified: false,
    });
    addIssuesToErrorWorkshop(analysis, transcript);
    writePlan(
      `${key}:speaking`,
      analysis.masteryEligible && seconds >= 45 && audioRef.current?.size
        ? "done"
        : "unassessed",
    );
    if (state.settings.saveAudio && audioRef.current) {
      await putAudio({
        id: makeId("automaticity-audio"),
        blob: audioRef.current,
        createdAt: new Date().toISOString(),
        grammarTitle: topic,
        topic: `${topic} transfer`,
        transcript,
        corrected: analysis.corrected,
        repetitionStatus: "new",
      });
    }
    setMessage(
      analysis.verified
        ? "Speaking practice saved locally. The language check assesses the transcript; speaking mastery remains unverified."
        : "Speaking practice saved locally without verified credit. Transcript assessment is unavailable.",
    );
  }

  return (
    <div className="page-stack">
      {!embedded ? (
        <div className="page-heading automaticity-hero">
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
        </div>
      ) : focusedStep === undefined ? (
        <Card className="border-violet-300 bg-violet-50/70">
          <CardHeader>
            <CardTitle>
              Steps {stepOffset + 1}–{stepOffset + 3} · Build usable evidence
            </CardTitle>
            <CardDescription>
              Finish controlled practice, connected writing, and recorded free
              speaking. Each result is analysed and saved.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!embedded ? (
        <Card className="border-violet-200 bg-violet-50/70" id="mission">
          <CardContent className="space-y-4 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <strong>{topic}</strong>
                <p className="text-sm text-muted-foreground">
                  {grammar.level} · {grammar.rule}
                </p>
              </div>
              <Badge variant={progress === 100 ? "success" : "default"}>
                {progress}% complete
              </Badge>
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
        </Card>
      ) : null}

      {!embedded ? (
        <div className="grid gap-4 lg:grid-cols-3">
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
            return (
              <button
                aria-pressed={
                  activeStep === Number(String(title).slice(0, 1)) - 1
                }
                className="text-left"
                key={String(title)}
                onClick={() =>
                  setActiveStep(Number(String(title).slice(0, 1)) - 1)
                }
                type="button"
              >
                <Card className={done ? "border-violet-500" : ""}>
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
                </Card>
              </button>
            );
          })}
        </div>
      ) : null}

      {!embedded ? (
        <Card className="border-violet-200">
          <CardHeader>
            <CardTitle>Mission quality gate</CardTitle>
            <CardDescription>
              Completed does not automatically mean mastered. Automaticity needs
              three separate kinds of evidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
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
          </CardContent>
        </Card>
      ) : null}

      {!embedded && dueReview ? (
        <Card className="border-emerald-200" id="delayed-transfer">
          <CardHeader>
            <CardTitle>Delayed recall and novel transfer</CardTitle>
            <CardDescription>
              Recall {topic} without copying your earlier answer, then use it in
              a genuinely new situation. These are saved as two separate events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              aria-label={`Delayed ${topic} transfer`}
              onChange={(event) => setDelayedTransfer(event.target.value)}
              placeholder="Write a new context from your life…"
              value={delayedTransfer}
            />
            <Button onClick={() => void saveDelayedTransfer()}>
              <RotateCcw className="size-4" /> Save delayed transfer
            </Button>
            {delayedTransferAnalysis ? (
              <Feedback analysis={delayedTransferAnalysis} />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {(focusedStep ?? activeStep) === 0 ? (
        <Card id={`daily-activity-${stepOffset + 1}`}>
          <CardHeader>
            <CardTitle>
              {stepOffset + 1}. Lesson and controlled practice
            </CardTitle>
            <CardDescription>
              Recognition is only the first part. Every item leads to your own
              output.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
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
            {exercises.map((item, index) => (
              <label className="block space-y-2" key={item.prompt}>
                <span className="text-sm font-bold">{item.prompt}</span>
                <input
                  className="min-h-11 w-full rounded-xl border bg-background px-3"
                  onChange={(event) =>
                    setAnswers((rows) =>
                      rows.map((row, rowIndex) =>
                        rowIndex === index ? event.target.value : row,
                      ),
                    )
                  }
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
            <Button onClick={checkPractice}>Check all three</Button>
          </CardContent>
        </Card>
      ) : null}

      {(focusedStep ?? activeStep) === 1 ? (
        <Card id={`daily-activity-${stepOffset + 2}`}>
          <CardHeader>
            <CardTitle>
              {stepOffset + 2}. {topic} daily writing
            </CardTitle>
            <CardDescription>
              Write four or more connected sentences from your own life. Use the
              lesson pattern accurately, then review the feedback.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              aria-label={`${topic} journal`}
              onChange={(event) => setJournal(event.target.value)}
              placeholder={grammar.examples[0] ?? "Write your own example…"}
              value={journal}
            />
            <Button onClick={saveWriting}>
              <PenLine className="size-4" /> Analyse and save writing
            </Button>
            {journalAnalysis ? <Feedback analysis={journalAnalysis} /> : null}
          </CardContent>
        </Card>
      ) : null}

      {(focusedStep ?? activeStep) === 2 ? (
        <Card id={`daily-activity-${stepOffset + 3}`}>
          <CardHeader>
            <CardTitle>
              {stepOffset + 3}. Five-stage shadowing and free speaking
            </CardTitle>
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
          </CardContent>
        </Card>
      ) : null}

      {focusedStep === undefined ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Transparent mastery</CardTitle>
              <CardDescription>
                Practice evidence is visible now. Only externally checked
                attempts raise verified mastery.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Axis
                label="Recognition practice"
                value={
                  checkedAnswers.length
                    ? Math.round(
                        (checkedAnswers.filter(Boolean).length / 3) * 100,
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
              {/* External app checks are evidence signals, not a teacher decision. */}
              <p
                className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm"
                role="note"
              >
                <strong>Teacher-verified mastery:</strong> not recorded. The
                score above is externally app-checked evidence and remains
                labelled separately from human verification.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>My grammar pattern plan</CardTitle>
              <CardDescription>
                Generated from today’s journal and speaking errors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                <li className="rounded-xl bg-violet-50 p-3">
                  <b>1. Repair:</b> correct five similar sentences.
                </li>
                <li className="rounded-xl bg-violet-50 p-3">
                  <b>2. Transfer:</b> create five new examples from your life.
                </li>
                <li className="rounded-xl bg-violet-50 p-3">
                  <b>3. Automate:</b> repeat one shadowing passage and retell
                  it.
                </li>
              </ol>
              <Button
                className="mt-4"
                onClick={() => {
                  setCheckedAnswers([]);
                  setJournalAnalysis(null);
                  setSpeechAnalysis(null);
                  setMessage(
                    "Review reset. Your saved evidence remains available.",
                  );
                }}
                variant="outline"
              >
                <RotateCcw className="size-4" /> Start another review
              </Button>
              {(journalAnalysis?.issues.length ?? 0) +
                (speechAnalysis?.issues.length ?? 0) >
              0 ? (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" /> Detected
                  errors were also added to Error Workshop for spaced repair.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
