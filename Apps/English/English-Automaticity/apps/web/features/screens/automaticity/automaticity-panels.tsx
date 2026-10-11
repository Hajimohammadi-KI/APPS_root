import type * as React from "react";
import {
  BookOpenCheck,
  Check,
  CircleAlert,
  Headphones,
  Mic,
  PenLine,
  RotateCcw,
  Square,
  Volume2,
} from "lucide-react";
import type { GrammarUnit } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Textarea } from "@/components/ui/textarea";
import type { LessonOutputAssessment } from "@/lib/lesson-output-assessment";
import { shadowingStages } from "./lesson-content";

export function Axis({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm font-bold">
        <span>{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-worksheet-cyan!">
        <div
          aria-hidden
          className="h-full rounded-full bg-worksheet-teal! border-worksheet-teal! text-white! transition-[width]"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

export function Feedback({ analysis }: { analysis: LessonOutputAssessment }) {
  return (
    <div className="space-y-3 rounded-2xl border border-worksheet-line! bg-worksheet-cyan! p-4">
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
        <p className="flex items-center gap-2 text-sm font-bold text-worksheet-teal!">
          <Check className="size-4" />{" "}
          {analysis.verified
            ? "The language check found no listed issue."
            : "Draft saved. Local practice checks do not verify this answer."}
        </p>
      )}
    </div>
  );
}

export function MissionProgressCard({
  topic,
  grammar,
  progress,
  message,
}: {
  topic: string;
  grammar: GrammarUnit;
  progress: number;
  message: string;
}) {
  return (
    <Card className="border-worksheet-line! bg-worksheet-cyan/70" id="mission">
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
        <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-worksheet-line">
          <div
            className="h-full bg-worksheet-teal! border-worksheet-teal! text-white! transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p
          aria-live="polite"
          className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-worksheet-teal!"
        >
          {message}
        </p>
      </CardContent>
    </Card>
  );
}

const stepCards = [
  [BookOpenCheck, "1. Activate & use accurately", "3 min · three controlled transformations"],
  [PenLine, "2. Automate & write", "4 min · six sentences with four target forms"],
  [Mic, "3. Speak freely & transfer", "5 min · shadowing and 60 seconds without a script"],
] as const;

export function StepCards({
  completion,
  activeStep,
  onSelect,
}: {
  completion: readonly boolean[];
  activeStep: number;
  onSelect: (step: number) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {stepCards.map(([StepIcon, title, detail], index) => (
        <button
          aria-pressed={activeStep === index}
          className="text-left"
          key={title}
          onClick={() => onSelect(index)}
          type="button"
        >
          <Card className={completion[index] ? "border-worksheet-teal" : ""}>
            <CardContent className="flex gap-3 pt-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-worksheet-cyan! text-worksheet-teal">
                {completion[index] ? <Check /> : <StepIcon />}
              </span>
              <div>
                <strong>{title}</strong>
                <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
              </div>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}

export function QualityGateCard() {
  return (
    <Card className="border-worksheet-line!">
      <CardHeader>
        <CardTitle>Mission quality gate</CardTitle>
        <CardDescription>
          Completed does not automatically mean mastered. Automaticity needs
          three separate kinds of evidence.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-worksheet-cyan! p-4 text-sm">
          <strong>Accurate</strong>
          <p className="mt-1 text-muted-foreground">
            Use the target form correctly in your own sentences.
          </p>
        </div>
        <div className="rounded-2xl bg-worksheet-cyan! p-4 text-sm">
          <strong>Spontaneous</strong>
          <p className="mt-1 text-muted-foreground">
            Speak for at least 60 seconds without reading.
          </p>
        </div>
        <div className="rounded-2xl bg-worksheet-cyan! p-4 text-sm">
          <strong>Retained</strong>
          <p className="mt-1 text-muted-foreground">
            Recall the same form again in a later review.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DelayedTransferCard({
  topic,
  value,
  analysis,
  onChange,
  onSave,
}: {
  topic: string;
  value: string;
  analysis: LessonOutputAssessment | null;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <Card className="border-worksheet-success-line!" id="delayed-transfer">
      <CardHeader>
        <CardTitle>Delayed recall and novel transfer</CardTitle>
        <CardDescription>
          Recall {topic} without copying your earlier answer, then use it in a
          genuinely new situation. These are saved as two separate events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          aria-label={`Delayed ${topic} transfer`}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Write a new context from your life…"
          value={value}
        />
        <Button onClick={onSave}>
          <RotateCcw className="size-4" /> Save delayed transfer
        </Button>
        {analysis ? <Feedback analysis={analysis} /> : null}
      </CardContent>
    </Card>
  );
}

export function PracticeStepCard({
  number,
  grammar,
  exercises,
  answers,
  checkedAnswers,
  onAnswer,
  onCheck,
}: {
  number: number;
  grammar: GrammarUnit;
  exercises: readonly { readonly prompt: string; readonly expected: string }[];
  answers: readonly string[];
  checkedAnswers: readonly boolean[];
  onAnswer: (index: number, value: string) => void;
  onCheck: () => void;
}) {
  return (
    <Card id={`daily-activity-${number}`}>
      <CardHeader>
        <CardTitle>{number}. Lesson and controlled practice</CardTitle>
        <CardDescription>
          Recognition is only the first part. Every item leads to your own
          output.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-worksheet-cyan! p-4">
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
              onChange={(event) => onAnswer(index, event.target.value)}
              value={answers[index]}
            />
            {checkedAnswers.length ? (
              <span
                className={
                  checkedAnswers[index]
                    ? "text-sm font-bold text-worksheet-teal!"
                    : "text-sm font-bold text-red-800"
                }
              >
                {checkedAnswers[index] ? "Correct" : `Model: ${item.expected}`}
              </span>
            ) : null}
          </label>
        ))}
        <Button onClick={onCheck}>Check all three</Button>
      </CardContent>
    </Card>
  );
}

export function WritingStepCard({
  number,
  topic,
  grammar,
  value,
  analysis,
  onChange,
  onSave,
}: {
  number: number;
  topic: string;
  grammar: GrammarUnit;
  value: string;
  analysis: LessonOutputAssessment | null;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <Card id={`daily-activity-${number}`}>
      <CardHeader>
        <CardTitle>
          {number}. {topic} daily writing
        </CardTitle>
        <CardDescription>
          Write four or more connected sentences from your own life. Use the
          lesson pattern accurately, then review the feedback.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          aria-label={`${topic} journal`}
          onChange={(event) => onChange(event.target.value)}
          placeholder={grammar.examples[0] ?? "Write your own example…"}
          value={value}
        />
        <Button onClick={onSave}>
          <PenLine className="size-4" /> Analyse and save writing
        </Button>
        {analysis ? <Feedback analysis={analysis} /> : null}
      </CardContent>
    </Card>
  );
}

export function SpeakingStepCard({
  number,
  modelText,
  shadowing,
  recording,
  seconds,
  transcript,
  analysis,
  onPlayModel,
  onToggleStage,
  onRecord,
  onStop,
  onTranscript,
  onSave,
}: {
  number: number;
  modelText: string;
  shadowing: readonly boolean[];
  recording: boolean;
  seconds: number;
  transcript: string;
  analysis: LessonOutputAssessment | null;
  onPlayModel: () => void;
  onToggleStage: (index: number) => void;
  onRecord: () => void;
  onStop: () => void;
  onTranscript: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <Card id={`daily-activity-${number}`}>
      <CardHeader>
        <CardTitle>
          {number}. Five-stage shadowing and free speaking
        </CardTitle>
        <CardDescription>
          Listen, copy the rhythm, then retell the idea for 45–60 seconds
          without reading.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl bg-worksheet-ink! text-white! p-5">
          <p className="leading-7">{modelText}</p>
          <Button
            className="mt-4 bg-white text-worksheet-teal! hover:bg-worksheet-cyan"
            onClick={onPlayModel}
          >
            <Volume2 className="size-4" /> Play model
          </Button>
        </div>
        <div className="grid gap-2 md:grid-cols-5">
          {shadowingStages.map((stage, index) => (
            <button
              className={`min-h-24 rounded-2xl border p-3 text-left text-sm font-bold ${shadowing[index] ? "border-worksheet-teal bg-worksheet-cyan! text-worksheet-teal" : "bg-background"}`}
              key={stage}
              onClick={() => onToggleStage(index)}
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
          <Button disabled={recording} onClick={onRecord}>
            <Mic className="size-4" /> Record
          </Button>
          <Button disabled={!recording} onClick={onStop} variant="outline">
            <Square className="size-4" /> Stop
          </Button>
          <Badge variant="secondary">{seconds}s</Badge>
        </div>
        <Textarea
          aria-label="Speaking transcript"
          onChange={(event) => onTranscript(event.target.value)}
          placeholder="Your live or typed transcript…"
          value={transcript}
        />
        <Button onClick={onSave}>Analyse and save speaking</Button>
        {analysis ? <Feedback analysis={analysis} /> : null}
      </CardContent>
    </Card>
  );
}

export function MasteryCard({
  recognition,
  writing,
  speaking,
  verifiedAutomaticity,
}: {
  recognition: number;
  writing: number;
  speaking: number;
  verifiedAutomaticity: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transparent mastery</CardTitle>
        <CardDescription>
          Practice evidence is visible now. Only externally checked attempts
          raise verified mastery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Axis label="Recognition practice" value={recognition} />
        <Axis label="Writing practice" value={writing} />
        <Axis label="Speaking practice" value={speaking} />
        <div className="flex gap-2">
          <Badge>Offline practice</Badge>
          <Badge variant="secondary">
            Verified mastery: {verifiedAutomaticity}%
          </Badge>
        </div>
        {/* External app checks are evidence signals, not a teacher decision. */}
        <Notice role="note" tone="info">
          <strong>Teacher-verified mastery:</strong> not recorded. The score
          above is externally app-checked evidence and remains labelled
          separately from human verification.
        </Notice>
      </CardContent>
    </Card>
  );
}

export function PatternPlanCard({
  issueCount,
  onReset,
}: {
  issueCount: number;
  onReset: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My grammar pattern plan</CardTitle>
        <CardDescription>
          Generated from today’s journal and speaking errors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3 text-sm">
          <li className="rounded-xl bg-worksheet-cyan! p-3">
            <b>1. Repair:</b> correct five similar sentences.
          </li>
          <li className="rounded-xl bg-worksheet-cyan! p-3">
            <b>2. Transfer:</b> create five new examples from your life.
          </li>
          <li className="rounded-xl bg-worksheet-cyan! p-3">
            <b>3. Automate:</b> repeat one shadowing passage and retell it.
          </li>
        </ol>
        <Button className="mt-4" onClick={onReset} variant="outline">
          <RotateCcw className="size-4" /> Start another review
        </Button>
        {issueCount > 0 ? (
          <Notice className="mt-3 flex items-start gap-2" tone="warning">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /> Detected errors
            were also added to Error Workshop for spaced repair.
          </Notice>
        ) : null}
      </CardContent>
    </Card>
  );
}

export type PanelProps = React.ComponentProps<typeof MasteryCard>;
