"use client";

import * as React from "react";
import { Play } from "lucide-react";
import { grammarUnits } from "@grammar/content";
import {
  appendLearningEvidenceBundleToStorage,
  buildAttemptVerticalSlice,
  normalizeDailySessionMinutes,
  type CefrLevel,
} from "@automaticity/learning-core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  DelayedTransferCard,
  MasteryCard,
  MissionProgressCard,
  PatternPlanCard,
  PracticeStepCard,
  QualityGateCard,
  SpeakingStepCard,
  StepCards,
  WritingStepCard,
} from "./automaticity/automaticity-panels";
import {
  defaultGrammar,
  lessonExercises,
  lessonKey,
  lessonModel,
  shadowingStages,
  speak,
} from "./automaticity/lesson-content";
import { useLessonRecorder } from "./automaticity/use-lesson-recorder";

const contentSourceId = "english-authored-grammar-curriculum-v27";

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
  const [message, setMessage] = React.useState(
    `Ready for your ${missionMinutes}-minute evidence practice.`,
  );
  const recorder = useLessonRecorder({ transcript, setTranscript });
  const restoredRef = React.useRef(false);

  React.useEffect(() => {
    if (!hydrated || restoredRef.current) return;
    restoredRef.current = true;
    setJournal(plan.answers[`${key}:journal`] ?? "");
    setTranscript(plan.answers[`${key}:transcript`] ?? "");
  }, [hydrated, key, plan.answers]);

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

  function evidenceBundle(
    analysis: LessonOutputAssessment,
    input: {
      attemptId: string;
      occurredAt: string;
      prompt: string;
      mode: "writing" | "transfer";
      inputText: string;
      fromDueReview?: boolean;
    },
  ) {
    return buildAttemptVerticalSlice({
      attemptId: input.attemptId,
      occurredAt: input.occurredAt,
      language: "en",
      cefrLevel: grammar.level as CefrLevel,
      contentVersion: `27.3.13-${grammar.level.toLowerCase()}-runtime`,
      topic,
      targetForm: grammar.rule,
      prompt: input.prompt,
      mode: input.mode,
      inputText: input.inputText,
      correctedText: analysis.corrected,
      targetHit: analysis.targetHit,
      accuracyScore: analysis.score,
      attemptVerified: analysis.verified,
      assessedBy: analysis.verified ? "online" : "offline",
      sessionMinutes: normalizeDailySessionMinutes(missionMinutes),
      ...(input.fromDueReview ? { fromDueReview: true } : {}),
      sourceId: contentSourceId,
    });
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
      evidenceBundle(analysis, {
        attemptId: crypto.randomUUID(),
        occurredAt,
        prompt: `Write four original sentences using ${topic}.`,
        mode: "writing",
        inputText: journal,
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
    setDelayedTransferAnalysis(analysis);
    appendLearningEvidenceBundleToStorage(
      window.localStorage,
      evidenceBundle(analysis, {
        attemptId: crypto.randomUUID(),
        occurredAt,
        prompt: `Recall ${topic} after a delay and transfer it to a new context.`,
        mode: "transfer",
        inputText: delayedTransfer,
        fromDueReview: true,
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
    const error = await recorder.startRecording();
    setMessage(
      error
        ? `${error} Type the transcript instead.`
        : "Recording. Speak about recent experiences for one minute.",
    );
  }

  async function stopRecording() {
    if (await recorder.stopRecording()) {
      setMessage("Recording stopped. Check and save the transcript.");
    }
  }

  async function saveSpeaking() {
    if (recorder.recording) await stopRecording();
    const seconds = recorder.seconds;
    const audio = recorder.audioBlob();
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
        analysis.masteryEligible && seconds >= 45 && Boolean(audio?.size),
      verified: false,
    });
    addIssuesToErrorWorkshop(analysis, transcript);
    writePlan(
      `${key}:speaking`,
      analysis.masteryEligible && seconds >= 45 && audio?.size
        ? "done"
        : "unassessed",
    );
    if (state.settings.saveAudio && audio) {
      await putAudio({
        id: makeId("automaticity-audio"),
        blob: audio,
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

  const step = focusedStep ?? activeStep;

  return (
    <div className="page-stack">
      {!embedded ? (
        <PageHeading
          actions={
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
          }
          className="automaticity-hero"
          description="Activate, use accurately, automate aloud, and transfer into free speech. The mission ends with saved evidence, not a simple click."
          eyebrow={<Badge>Today · {missionMinutes} minutes</Badge>}
          title="Automaticity Mission"
        />
      ) : focusedStep === undefined ? (
        <Card className="border-worksheet-line! bg-worksheet-cyan/70">
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
        <>
          <MissionProgressCard
            topic={topic}
            grammar={grammar}
            progress={progress}
            message={message}
          />
          <StepCards
            completion={completion}
            activeStep={activeStep}
            onSelect={setActiveStep}
          />
          <QualityGateCard />
        </>
      ) : null}

      {!embedded && dueReview ? (
        <DelayedTransferCard
          topic={topic}
          value={delayedTransfer}
          analysis={delayedTransferAnalysis}
          onChange={setDelayedTransfer}
          onSave={() => void saveDelayedTransfer()}
        />
      ) : null}

      {step === 0 ? (
        <PracticeStepCard
          number={stepOffset + 1}
          grammar={grammar}
          exercises={exercises}
          answers={answers}
          checkedAnswers={checkedAnswers}
          onAnswer={(index, value) =>
            setAnswers((rows) =>
              rows.map((row, rowIndex) => (rowIndex === index ? value : row)),
            )
          }
          onCheck={checkPractice}
        />
      ) : null}

      {step === 1 ? (
        <WritingStepCard
          number={stepOffset + 2}
          topic={topic}
          grammar={grammar}
          value={journal}
          analysis={journalAnalysis}
          onChange={setJournal}
          onSave={() => void saveWriting()}
        />
      ) : null}

      {step === 2 ? (
        <SpeakingStepCard
          number={stepOffset + 3}
          modelText={modelText}
          shadowing={shadowing}
          recording={recorder.recording}
          seconds={recorder.seconds}
          transcript={transcript}
          analysis={speechAnalysis}
          onPlayModel={() => speak(modelText)}
          onToggleStage={(index) =>
            writePlan(`${key}:shadow:${index}`, shadowing[index] ? "" : "done")
          }
          onRecord={() => void startRecording()}
          onStop={() => void stopRecording()}
          onTranscript={setTranscript}
          onSave={() => void saveSpeaking()}
        />
      ) : null}

      {focusedStep === undefined ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <MasteryCard
            recognition={
              checkedAnswers.length
                ? Math.round((checkedAnswers.filter(Boolean).length / 3) * 100)
                : (verifiedMastery?.recognitionScore ?? 0)
            }
            writing={journalAnalysis?.score ?? verifiedMastery?.writingScore ?? 0}
            speaking={speechAnalysis?.score ?? verifiedMastery?.speakingScore ?? 0}
            verifiedAutomaticity={verifiedMastery?.automaticityScore ?? 0}
          />
          <PatternPlanCard
            issueCount={
              (journalAnalysis?.issues.length ?? 0) +
              (speechAnalysis?.issues.length ?? 0)
            }
            onReset={() => {
              setCheckedAnswers([]);
              setJournalAnalysis(null);
              setSpeechAnalysis(null);
              setMessage("Review reset. Your saved evidence remains available.");
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
