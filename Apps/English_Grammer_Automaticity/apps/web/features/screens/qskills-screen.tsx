"use client";

import {
  Archive,
  BookOpen,
  ExternalLink,
  FileText,
  FolderOpen,
  Headphones,
  LibraryBig,
  Mic2,
  PenLine,
  PlaySquare,
  Sparkles,
} from "lucide-react";
import {
  qSkillsIntroResources,
  qSkillsLevels,
  qSkillsSourceFolder,
  type QSkillsUnit,
  type QSkillsResource,
} from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LearningAccordion } from "@/features/components/learning-accordion";
import { ScreenHeading } from "@/features/components/screen-heading";

const skillCards = [
  {
    key: "listening",
    label: "Listening",
    icon: Headphones,
    className: "border-emerald-200 bg-emerald-50/70",
    labelClassName: "text-emerald-800",
  },
  {
    key: "speaking",
    label: "Speaking",
    icon: Mic2,
    className: "border-violet-200 bg-violet-50/70",
    labelClassName: "text-violet-800",
  },
  {
    key: "reading",
    label: "Reading",
    icon: BookOpen,
    className: "border-sky-200 bg-sky-50/70",
    labelClassName: "text-sky-800",
  },
  {
    key: "writing",
    label: "Writing",
    icon: PenLine,
    className: "border-amber-200 bg-amber-50/70",
    labelClassName: "text-amber-900",
  },
] as const;

const localQSkillsSourcePath = "Apps/Sources/English/QSK";

function buildPracticePlan(
  unit: QSkillsUnit,
  skillKey: "listening" | "speaking" | "reading" | "writing",
) {
  if (skillKey === "listening") {
    return {
      bookExercise: `Complete the official listening activity for Unit ${unit.number}: ${unit.listeningSkill}.`,
      steps: [
        "Pre-listening: Predict two possible answers to the unit question.",
        "First pass: Listen once without pausing and write only key words.",
        "Second pass: Listen again and capture supporting details and signal words.",
        "Post-listening: Give a 60-second spoken summary using your notes only.",
      ],
      transfer:
        "Transfer task: Create 3 new comprehension questions and answer them from memory.",
      reflection:
        "Reflection: Which detail was hardest to catch, and what listening strategy fixed it?",
      rubric: [
        "Task completion (0-2): You answered the listening goal completely.",
        "Accuracy (0-2): Details and key words match the source.",
        "Language control (0-2): Your summary is clear and grammatically controlled.",
      ],
      answerTemplate:
        "Template: The main idea is ____. Two key details are ____ and ____. This means ____.",
    };
  }

  if (skillKey === "speaking") {
    return {
      bookExercise: `Perform the official speaking task for Unit ${unit.number}: ${unit.speakingAssignment}.`,
      steps: [
        `Language focus: Practice this communication skill: ${unit.speakingSkill}.`,
        "Guided run: Speak for 45-60 seconds with notes.",
        "Independent run: Repeat without notes and keep natural pacing.",
        "Repair run: Listen to yourself, fix weak sentences, and record one final version.",
      ],
      transfer:
        "Transfer task: Reuse the same speaking structure on a new personal example.",
      reflection:
        "Reflection: Which phrase made your speech clearer and easier to follow?",
      rubric: [
        "Task completion (0-2): You completed the required speaking task.",
        "Fluency and delivery (0-2): Your speech flows with clear pacing and confidence.",
        "Interaction strategy (0-2): You used the target speaking strategy effectively.",
      ],
      answerTemplate:
        "Template: First, ____. A useful example is ____. In conclusion, ____.",
    };
  }

  if (skillKey === "reading") {
    return {
      bookExercise: `Complete the official reading activity for Unit ${unit.number}: ${unit.readingSkill}.`,
      steps: [
        "Preview: Scan headings, visuals, and key terms before deep reading.",
        "Focused read: Apply the target reading strategy and annotate evidence.",
        "Comprehension check: Write 4 answers supported by exact text evidence.",
        "Skill check: Explain how the strategy improved your understanding.",
      ],
      transfer:
        `Transfer task: Answer the reading-writing question in 4-6 sentences: ${unit.readingWritingQuestion}`,
      reflection:
        "Reflection: Which annotation helped you understand the text fastest?",
      rubric: [
        "Task completion (0-2): You applied the reading strategy to the full text.",
        "Evidence quality (0-2): Answers include relevant text-based support.",
        "Interpretation (0-2): Your interpretation is logical and well explained.",
      ],
      answerTemplate:
        "Template: The text suggests ____. Evidence includes ____. Therefore, ____.",
    };
  }

  return {
    bookExercise: `Complete the official writing task for Unit ${unit.number}: ${unit.writingAssignment}.`,
    steps: [
      `Model focus: Follow the writing objective: ${unit.writingSkill}.`,
      "Planning: Build a mini-outline (main idea, support, examples, conclusion).",
      "Drafting: Write one full draft with clear structure and transitions.",
      "Revision: Improve grammar, clarity, and sentence variety in a second draft.",
    ],
    transfer:
      "Transfer task: Rewrite the same idea for a different audience (friend, teacher, or workplace).",
    reflection:
      "Reflection: What changed most between draft 1 and draft 2, and why?",
    rubric: [
      "Task completion (0-2): You addressed the writing prompt fully.",
      "Organization (0-2): Your paragraph/essay structure is clear and coherent.",
      "Language quality (0-2): Grammar, vocabulary, and sentence variety support meaning.",
    ],
    answerTemplate:
      "Template: Main claim: ____. Support point 1: ____. Support point 2: ____. Final insight: ____.",
  };
}

function ResourceIcon({ kind }: Readonly<{ kind: QSkillsResource["kind"] }>) {
  if (kind === "pdf") return <FileText aria-hidden className="size-4" />;
  if (kind === "audio") return <Headphones aria-hidden className="size-4" />;
  if (kind === "video") return <PlaySquare aria-hidden className="size-4" />;
  return <Archive aria-hidden className="size-4" />;
}

function ResourceList({
  resources,
}: Readonly<{ resources: QSkillsResource[] }>) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {resources.map((resource, index) => (
        <Button
          asChild
          className="h-auto min-h-11 justify-between whitespace-normal text-left"
          key={`${resource.kind}-${resource.title}-${index}`}
          variant="outline"
        >
          <a href={resource.url} rel="noreferrer" target="_blank">
            <span className="flex items-center gap-2">
              <ResourceIcon kind={resource.kind} />
              {resource.title}
            </span>
            <ExternalLink aria-hidden className="size-4 shrink-0" />
          </a>
        </Button>
      ))}
    </div>
  );
}

export function QSkillsScreen() {
  return (
    <div className="page-stack">
      <ScreenHeading
        actions={
          <Button asChild variant="outline">
            <a href={qSkillsSourceFolder} rel="noreferrer" target="_blank">
              <FolderOpen aria-hidden className="size-4" />
              Open source folder
              <ExternalLink aria-hidden className="size-4" />
            </a>
          </Button>
        }
        description="Five complete proficiency levels, eight units per level, and a four-skill path in every unit. Open only the level and unit you need right now."
        eyebrow="Q: Skills for Success · 5 levels"
        title="Q: Skills Learning Path"
      />

      <Card className="overflow-hidden border-sky-200 bg-gradient-to-br from-sky-50 via-white to-violet-50">
        <CardContent className="grid gap-5 pt-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <Badge variant="success">
              40 units · 160 skill paths
            </Badge>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
              One unit, all four skills
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Every unit connects listening, speaking, reading, and writing
              with official Q: Skills targets and a final production task.
              Opening a file alone does not count as finished practice.
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[.08em] text-slate-600">
              Local source path: {localQSkillsSourcePath}
            </p>
          </div>
          <div
            className="grid grid-cols-4 gap-2"
            aria-label="Four skills"
          >
            {skillCards.map(({ icon: Icon, label, labelClassName }) => (
              <span
                className={`grid size-12 place-items-center rounded-2xl border bg-white shadow-sm ${labelClassName}`}
                key={label}
                title={label}
              >
                <Icon aria-hidden className="size-5" />
                <span className="sr-only">{label}</span>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <LearningAccordion
        eyebrow="Optional Start"
        icon={Sparkles}
        summary="Intro book plus audio, source, and video collections from your Q: Skills folder."
        title="Introduction Materials"
        tone="amber"
      >
        <ResourceList resources={qSkillsIntroResources} />
      </LearningAccordion>

      <div className="space-y-3">
        {qSkillsLevels.map((level) => (
          <LearningAccordion
            eyebrow={`Level ${level.level}`}
            group="qskills-levels"
            icon={LibraryBig}
            key={level.level}
            summary={`8 units · 32 skill paths · ${level.resources.length} source collections`}
            title={`Q: Skills Level ${level.level}`}
            tone={level.level % 2 === 0 ? "violet" : "blue"}
          >
            <div className="space-y-3">
              {level.units.map((unit) => (
                <LearningAccordion
                  eyebrow={`${unit.domain} · Unit ${unit.number}`}
                  group={`qskills-level-${level.level}-units`}
                  key={`${level.level}-${unit.number}`}
                  summary={unit.question}
                  title={`Unit ${unit.number} · ${unit.question}`}
                  tone={
                    unit.number % 3 === 0
                      ? "amber"
                      : unit.number % 2 === 0
                        ? "emerald"
                        : "violet"
                  }
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    {skillCards.map(
                      ({ className, icon: Icon, key, label, labelClassName }) => {
                        const practice = buildPracticePlan(unit, key);
                        const skill =
                          key === "listening"
                            ? unit.listeningSkill
                            : key === "speaking"
                              ? unit.speakingSkill
                              : key === "reading"
                                ? unit.readingSkill
                                : unit.writingSkill;
                        const task =
                          key === "speaking"
                            ? unit.speakingAssignment
                            : key === "writing"
                              ? unit.writingAssignment
                              : key === "reading"
                                ? unit.readingWritingQuestion
                                : unit.question;
                        return (
                          <article
                            className={`rounded-2xl border p-4 ${className}`}
                            key={key}
                          >
                            <div
                              className={`flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] ${labelClassName}`}
                            >
                              <Icon aria-hidden className="size-4" />
                              {label}
                            </div>
                            <h4 className="mt-3 font-extrabold leading-6 text-slate-950">
                              {skill}
                            </h4>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {task}
                            </p>
                            <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3">
                              <p className="text-xs font-black uppercase tracking-[.12em] text-slate-600">
                                Book Exercise
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {practice.bookExercise}
                              </p>
                              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-700">
                                {practice.steps.map((step) => (
                                  <li key={step}>{step}</li>
                                ))}
                              </ol>
                              <p className="mt-2 text-sm leading-6 text-slate-800">
                                <strong>Extension:</strong> {practice.transfer}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-slate-800">
                                <strong>Reflection:</strong> {practice.reflection}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-800">
                                <strong>Answer Template:</strong> {practice.answerTemplate}
                              </p>
                              <div className="mt-2">
                                <p className="text-xs font-black uppercase tracking-[.12em] text-slate-600">
                                  Rubric (0-6)
                                </p>
                                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                                  {practice.rubric.map((criterion) => (
                                    <li key={criterion}>{criterion}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </article>
                        );
                      },
                    )}
                  </div>
                </LearningAccordion>
              ))}

              <LearningAccordion
                eyebrow={`Level ${level.level}`}
                icon={FolderOpen}
                summary="Student book, teacher handbook, audio, source and video collections."
                title="Resources for this level"
                tone="amber"
              >
                <ResourceList resources={level.resources} />
              </LearningAccordion>
            </div>
          </LearningAccordion>
        ))}
      </div>

      <Card className="border-amber-200 bg-amber-50/70">
        <CardContent className="flex gap-3 pt-5">
          <FileText
            aria-hidden
            className="mt-0.5 size-5 shrink-0 text-amber-800"
          />
          <div>
            <h2 className="font-extrabold text-amber-950">
              Source coverage
            </h2>
            <p className="mt-1 text-sm leading-6 text-amber-950/80">
              All distinct files in the supplied five-level Drive folder are
              indexed. The uploaded student books are the Listening & Speaking
              editions. Reading and Writing lesson goals are mapped in every
              unit; add the paired Reading & Writing books to Drive when you
              want exact page-level source links for those two skills.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
