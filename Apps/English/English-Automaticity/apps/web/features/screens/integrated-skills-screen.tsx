"use client";

import * as React from "react";
import {
  BookOpen,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Headphones,
  Mic2,
  PenLine,
  Save,
  ShieldCheck,
  Sparkles,
  Square,
  Volume2,
} from "lucide-react";
import {
  INTEGRATED_SKILLS,
  buildAutomaticitySteps,
  getIntegratedSkillsLevel,
  integratedSkillsLevels,
  type CefrLevel,
  type IntegratedSkill,
  type IntegratedSkillsUnit,
} from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScreenHeading } from "@/features/components/screen-heading";
import { QSkillsResources } from "@/features/components/qskills-resources";
import { useAppStore } from "@/features/store/app-store";
import { requiredFirst, todayKey } from "@/lib/utils";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const skillMeta: Record<
  IntegratedSkill,
  {
    label: string;
    description: string;
    icon: typeof Headphones;
    className: string;
  }
> = {
  listening: {
    label: "Listening",
    description: "Understand, notice, recall, and explain",
    icon: Headphones,
    className: "border-sky-300 bg-sky-50 text-sky-950",
  },
  speaking: {
    label: "Speaking",
    description: "Repeat, reformulate, and speak without a script",
    icon: Mic2,
    className: "border-violet-300 bg-violet-50 text-violet-950",
  },
  reading: {
    label: "Reading",
    description: "Find meaning, evidence, and structure",
    icon: BookOpen,
    className: "border-blue-300 bg-blue-50 text-blue-950",
  },
  writing: {
    label: "Writing",
    description: "Build, revise, and transfer a clear message",
    icon: PenLine,
    className: "border-amber-300 bg-amber-50 text-amber-950",
  },
};

const levelTone: Record<CefrLevel, string> = {
  A1: "border-violet-500 bg-violet-700 text-white",
  A2: "border-blue-500 bg-blue-700 text-white",
  B1: "border-indigo-500 bg-indigo-700 text-white",
  B2: "border-purple-500 bg-purple-800 text-white",
  C1: "border-slate-600 bg-slate-800 text-white",
  C2: "border-violet-700 bg-violet-950 text-white",
};

const REVIEW_DELAY_MS = 86_400_000;

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

function lessonMaterial(unit: IntegratedSkillsUnit, skill: IntegratedSkill) {
  if (skill === "listening") return unit.listeningText;
  if (skill === "reading") return unit.readingText;
  if (skill === "speaking") return unit.model;
  return unit.model;
}

function lessonGoal(unit: IntegratedSkillsUnit, skill: IntegratedSkill) {
  if (skill === "listening") {
    return `Understand the main point and details, then explain them from memory: ${unit.outcome}`;
  }
  if (skill === "speaking") return unit.speakingPrompt;
  if (skill === "reading") {
    return `Read for meaning and evidence, then explain the message: ${unit.outcome}`;
  }
  return unit.writingPrompt;
}

function formatDueTime(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function IntegratedSkillsScreen({
  navigate,
}: {
  navigate: (screen: string, params?: Record<string, string | null>) => void;
}) {
  const { state, hydrated, mutate } = useAppStore();
  const progressState = state.integratedSkills;
  const level = getIntegratedSkillsLevel(progressState.activeLevel);
  const unit =
    level.units.find(
      (candidate) => candidate.id === progressState.activeUnitId,
    ) ?? requiredFirst(level.units, `${level.cefr} integrated-skills units`);
  const skill = progressState.activeSkill;
  const steps = buildAutomaticitySteps(level.cefr, unit, skill);
  const activeStep = Math.min(progressState.activeStep, steps.length - 1);
  const step =
    steps[activeStep] ?? requiredFirst(steps, `${unit.id} ${skill} steps`);
  const [draftResponse, setDraftResponse] = React.useState("");
  const [message, setMessage] = React.useState(
    "Choose one level, one unit, and one skill. The app will show only the next action.",
  );
  const [supportVisible, setSupportVisible] = React.useState(true);
  const [missionMode, setMissionMode] = React.useState<"standard" | "rescue">(
    "standard",
  );
  const [visibleSkills, setVisibleSkills] = React.useState<IntegratedSkill[]>(
    () => [...INTEGRATED_SKILLS],
  );
  const [visibleUnitIds, setVisibleUnitIds] = React.useState<string[]>(() => [
    unit.id,
  ]);
  const [pendingUnitIds, setPendingUnitIds] = React.useState<string[]>(() => [
    unit.id,
  ]);
  const [unitQuery, setUnitQuery] = React.useState("");
  const [dictating, setDictating] = React.useState(false);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const unitPickerRef = React.useRef<HTMLDetailsElement | null>(null);
  const currentUnitIdRef = React.useRef(unit.id);
  currentUnitIdRef.current = unit.id;

  React.useEffect(() => {
    if (!hydrated) return;
    setDraftResponse(progressState.responses[step.id] ?? "");
    setSupportVisible(step.supportAvailable);
  }, [hydrated, progressState.responses, step.id, step.supportAvailable]);

  React.useEffect(() => {
    if (unit.id === progressState.activeUnitId) return;
    mutate((draft) => {
      draft.integratedSkills.activeUnitId = unit.id;
      draft.integratedSkills.activeStep = 0;
    });
  }, [mutate, progressState.activeUnitId, unit.id]);

  React.useEffect(() => {
    // A level change gets a fresh, compact menu instead of retaining filters
    // for units that do not exist at the newly selected CEFR level.
    setVisibleUnitIds([currentUnitIdRef.current]);
    setPendingUnitIds([currentUnitIdRef.current]);
    setUnitQuery("");
  }, [level.cefr, level.units]);

  React.useEffect(
    () => () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // The browser already stopped recognition.
      }
    },
    [],
  );

  const material = lessonMaterial(unit, skill);
  const completedInPath = steps.filter(
    (candidate) => progressState.completedAt[candidate.id],
  ).length;
  const pathProgress = Math.round((completedInPath / steps.length) * 100);
  const levelStepIds = level.units.flatMap((levelUnit) =>
    INTEGRATED_SKILLS.flatMap((levelSkill) =>
      buildAutomaticitySteps(level.cefr, levelUnit, levelSkill).map(
        (candidate) => candidate.id,
      ),
    ),
  );
  const completedInLevel = levelStepIds.filter(
    (id) => progressState.completedAt[id],
  ).length;
  const levelProgress = Math.round(
    (completedInLevel / levelStepIds.length) * 100,
  );
  const responseWords = wordCount(draftResponse);
  const reviewDue = progressState.reviewDue[step.id];
  const reviewLocked =
    step.delayedReview && (!reviewDue || reviewDue > Date.now());

  function chooseLevel(nextLevel: CefrLevel) {
    const next = getIntegratedSkillsLevel(nextLevel);
    const firstUnit = requiredFirst(
      next.units,
      `${nextLevel} integrated-skills units`,
    );
    mutate((draft) => {
      draft.integratedSkills.activeLevel = nextLevel;
      draft.integratedSkills.activeUnitId = firstUnit.id;
      draft.integratedSkills.activeStep = 0;
    });
    setMessage(
      `${nextLevel} selected. Start with its foundation and first unit.`,
    );
  }

  function chooseUnit(unitId: string) {
    mutate((draft) => {
      draft.integratedSkills.activeUnitId = unitId;
      draft.integratedSkills.activeStep = 0;
    });
    setMessage("Unit selected. Continue with one skill at a time.");
  }

  function chooseSkill(nextSkill: IntegratedSkill) {
    mutate((draft) => {
      draft.integratedSkills.activeSkill = nextSkill;
      draft.integratedSkills.activeStep = 0;
    });
    setMessage(`${skillMeta[nextSkill].label} path selected.`);
  }

  function toggleVisibleSkill(nextSkill: IntegratedSkill) {
    setVisibleSkills((currentSkills) => {
      const isVisible = currentSkills.includes(nextSkill);
      // Keep one visible option: a filter with no choices gives learners a
      // confusing empty menu and hides the current learning path.
      if (isVisible && currentSkills.length === 1) return currentSkills;
      return isVisible
        ? currentSkills.filter((candidate) => candidate !== nextSkill)
        : [...currentSkills, nextSkill];
    });
  }

  function togglePendingUnit(unitId: string) {
    setPendingUnitIds((currentUnitIds) => {
      if (currentUnitIds.includes(unitId)) {
        return currentUnitIds.filter((candidate) => candidate !== unitId);
      }
      return [...currentUnitIds, unitId];
    });
  }

  function applyUnitSelection() {
    const orderedSelection = level.units
      .filter((candidate) => pendingUnitIds.includes(candidate.id))
      .map((candidate) => candidate.id);
    if (!orderedSelection.length) {
      setMessage("Select at least one unit before applying the filter.");
      return;
    }

    // Applying is explicit so exploring checkboxes never changes the learner's
    // active lesson or evidence path until they confirm the new unit menu.
    setVisibleUnitIds(orderedSelection);
    if (!orderedSelection.includes(unit.id)) {
      chooseUnit(
        requiredFirst(orderedSelection, `${level.cefr} selected units`),
      );
    }
    setMessage(
      `${orderedSelection.length} ${level.cefr} ${orderedSelection.length === 1 ? "unit" : "units"} shown in the lesson menu.`,
    );
    unitPickerRef.current?.removeAttribute("open");
  }

  function moveToStep(nextStep: number) {
    mutate((draft) => {
      draft.integratedSkills.activeStep = Math.min(6, Math.max(0, nextStep));
    });
  }

  function saveForLater() {
    mutate((draft) => {
      draft.integratedSkills.responses[step.id] = draftResponse.trim();
    });
    setMessage(
      "Saved locally. You can stop and continue from this exact step.",
    );
  }

  function completeStep() {
    if (reviewLocked) {
      setMessage(
        reviewDue
          ? `This delayed recall opens ${formatDueTime(reviewDue)}.`
          : "Complete the transfer stage first. The delayed recall will open tomorrow.",
      );
      return;
    }
    if (responseWords < step.minWords) {
      setMessage(
        `Add a little more evidence: ${responseWords}/${step.minWords} words. Dictation is available if typing is difficult.`,
      );
      return;
    }

    mutate((draft) => {
      const completedAt = new Date().toISOString();
      draft.integratedSkills.responses[step.id] = draftResponse.trim();
      draft.integratedSkills.completedAt[step.id] = completedAt;
      draft.activity[todayKey()] = Math.max(1, draft.activity[todayKey()] ?? 0);
      if (step.stage === "transfer") {
        const review = steps.find((candidate) => candidate.stage === "review");
        if (review && !draft.integratedSkills.reviewDue[review.id]) {
          draft.integratedSkills.reviewDue[review.id] =
            Date.now() + REVIEW_DELAY_MS;
        }
      }
      if (activeStep < steps.length - 1) {
        draft.integratedSkills.activeStep = activeStep + 1;
      }
    });
    setMessage(
      step.stage === "transfer"
        ? "Transfer evidence saved. Tomorrow’s delayed recall has been scheduled."
        : step.stage === "review"
          ? "Delayed recall saved. This skill now has retention evidence."
          : missionMode === "rescue"
            ? "Rescue mission complete. One real step is enough for today."
            : "Evidence saved. Continue when you feel ready.",
    );
  }

  function speak(
    text: string,
    options: { label?: string; rate?: number } = {},
  ) {
    if (!("speechSynthesis" in window)) {
      setMessage("Text-to-speech is unavailable in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = options.rate ?? state.settings.ttsRate;
    utterance.onstart = () =>
      setMessage(
        `${options.label ?? "Audio"} is playing. Listen without reading first.`,
      );
    utterance.onend = () =>
      setMessage(
        `${options.label ?? "Audio"} finished. Say the main idea from memory.`,
      );
    utterance.onerror = () =>
      setMessage("Playback stopped. Your lesson and progress are still safe.");
    window.speechSynthesis.speak(utterance);
  }

  function openConversationStudio() {
    navigate("studio", {
      source: "integrated-skills",
      unit: unit.id,
      level: level.cefr,
    });
  }

  function startDictation() {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setMessage(
        "Speech-to-text is unavailable here. You can still type or paste a short response.",
      );
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    const startingText = draftResponse.trim();
    let finalText = startingText;
    recognition.onresult = (event) => {
      let interim = "";
      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        if (!result) continue;
        if (result.isFinal) {
          finalText += `${finalText ? " " : ""}${result[0].transcript}`;
        } else {
          interim += `${interim ? " " : ""}${result[0].transcript}`;
        }
      }
      setDraftResponse(`${finalText} ${interim}`.trim());
    };
    recognition.onend = () => setDictating(false);
    recognition.onerror = () => {
      setDictating(false);
      setMessage("Dictation stopped. Your existing text is still safe.");
    };
    recognitionRef.current = recognition;
    recognition.start();
    setDictating(true);
    setMessage(
      "Listening now. Speak naturally; you can correct the transcript afterward.",
    );
  }

  function stopDictation() {
    try {
      recognitionRef.current?.stop();
    } finally {
      setDictating(false);
    }
  }

  const SkillIcon = skillMeta[skill].icon;
  const filteredUnits = level.units.filter((candidate) =>
    `${candidate.number} ${candidate.title} ${candidate.outcome}`
      .toLowerCase()
      .includes(unitQuery.trim().toLowerCase()),
  );

  /* Progressive disclosure keeps the lesson short: selection, library, and
     companion material stay available in named drop-downs instead of making
     every learner scroll past content that is not the current practice step. */

  return (
    <div className="page-stack">
      <ScreenHeading
        description="Listening, speaking, reading, and writing from A1 to C2. Every path moves from understanding to independent use and delayed recall."
        eyebrow="Original curriculum · 6 CEFR levels · 288 skill paths"
        title="Integrated Skills Path"
      />

      <details className="integrated-navigator overflow-hidden rounded-2xl border border-violet-300 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 bg-violet-50/80 px-5 py-4 marker:content-none">
          <span>
            <span className="block text-sm font-black text-violet-900">
              Lesson navigator
            </span>
            <span className="mt-1 block text-sm text-violet-950/75">
              {level.cefr} · Unit {unit.number} · {skillMeta[skill].label} ·{" "}
              {visibleSkills.length}/4 skills shown
            </span>
          </span>
          <span aria-hidden className="text-lg font-black text-violet-800">
            ▾
          </span>
        </summary>
        <div className="space-y-4 border-t border-violet-200 p-4 sm:p-5">
          {/* Multi-select is intentionally only a display filter. The active
              evidence path remains one skill at a time, so evidence cannot be
              accidentally mixed across listening, speaking, reading, and writing. */}
          <section
            aria-labelledby="skill-filter-label"
            className="rounded-2xl border border-violet-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2
                  className="text-base font-black text-violet-950"
                  id="skill-filter-label"
                >
                  Show skills in this navigator
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Select one or more skills to keep the menu compact. Choose one
                  card below to open its evidence path.
                </p>
              </div>
              <Badge variant="secondary">{visibleSkills.length} selected</Badge>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {INTEGRATED_SKILLS.map((candidate) => {
                const meta = skillMeta[candidate];
                const Icon = meta.icon;
                const checked = visibleSkills.includes(candidate);
                return (
                  <label
                    className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${
                      checked
                        ? "border-violet-400 bg-violet-50 text-violet-950"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                    key={candidate}
                  >
                    <input
                      aria-label={`Show ${meta.label} in the lesson navigator`}
                      checked={checked}
                      className="size-4 accent-violet-700"
                      onChange={() => toggleVisibleSkill(candidate)}
                      type="checkbox"
                    />
                    <Icon aria-hidden className="size-4 shrink-0" />
                    {meta.label}
                  </label>
                );
              })}
            </div>
          </section>
          <Card className="border-violet-300 bg-violet-50/80">
            <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <Badge className="bg-violet-800 text-white">
                  Today · one calm mission
                </Badge>
                <h2 className="mt-3 text-2xl font-black text-violet-950">
                  Make English usable without overload
                </h2>
                <p className="mt-2 max-w-3xl text-base leading-7 text-violet-950/80">
                  Work on one visible action. Listen to every instruction,
                  dictate instead of typing, save at any point, and return
                  without losing your place.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  aria-pressed={missionMode === "standard"}
                  onClick={() => setMissionMode("standard")}
                  variant={missionMode === "standard" ? "default" : "outline"}
                >
                  <Clock3 aria-hidden className="size-4" /> 12-minute mission
                </Button>
                <Button
                  aria-pressed={missionMode === "rescue"}
                  onClick={() => setMissionMode("rescue")}
                  variant={missionMode === "rescue" ? "default" : "outline"}
                >
                  <ShieldCheck aria-hidden className="size-4" /> Rescue: one
                  step
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>1. Choose your level</CardTitle>
              <CardDescription>
                Start at a comfortable level. You can change it without deleting
                progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {integratedSkillsLevels.map((candidate) => (
                <Button
                  aria-pressed={candidate.cefr === level.cefr}
                  className={
                    candidate.cefr === level.cefr
                      ? levelTone[candidate.cefr]
                      : "min-h-12 bg-white text-slate-900"
                  }
                  key={candidate.cefr}
                  onClick={() => chooseLevel(candidate.cefr)}
                  variant="outline"
                >
                  {candidate.cefr}
                </Button>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,.36fr)]">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge variant="secondary">
                      {level.cefr} · {level.title}
                    </Badge>
                    <CardTitle className="mt-2">Level foundation</CardTitle>
                    <CardDescription className="max-w-3xl text-base leading-7">
                      {level.descriptor}
                    </CardDescription>
                  </div>
                  <Badge>{levelProgress}% level evidence</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-base leading-7 sm:grid-cols-2">
                  {level.baseLessons.map((lesson) => (
                    <li
                      className="flex gap-2 rounded-xl bg-slate-50 p-3"
                      key={lesson}
                    >
                      <Brain
                        aria-hidden
                        className="mt-1 size-4 shrink-0 text-violet-800"
                      />
                      {lesson}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-violet-200">
              <CardHeader>
                <CardTitle>Level quality gate</CardTitle>
                <CardDescription>
                  Completion requires performance and delayed recall—not opening
                  lessons.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress
                  aria-label={`${levelProgress}% level progress`}
                  value={levelProgress}
                />
                <p className="text-sm font-bold">
                  {completedInLevel} / {levelStepIds.length} evidence stages
                </p>
                <ul className="space-y-2 text-sm leading-6">
                  {level.exitCriteria.map((criterion) => (
                    <li className="flex gap-2" key={criterion}>
                      <Check
                        aria-hidden
                        className="mt-1 size-4 shrink-0 text-violet-800"
                      />
                      {criterion}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>2. Choose one unit and one skill</CardTitle>
              <CardDescription>
                The four skills share one real-life outcome, but each has its
                own evidence path.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <label
                className="block space-y-2 text-base font-bold"
                htmlFor="integrated-unit"
              >
                Unit
                <Select
                  className="min-h-12 text-base"
                  id="integrated-unit"
                  onChange={(event) => chooseUnit(event.target.value)}
                  value={unit.id}
                >
                  {level.units
                    .filter((candidate) =>
                      visibleUnitIds.includes(candidate.id),
                    )
                    .map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.number}. {candidate.title}
                      </option>
                    ))}
                </Select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {visibleSkills.map((candidate) => {
                  const meta = skillMeta[candidate];
                  const Icon = meta.icon;
                  return (
                    <button
                      aria-pressed={candidate === skill}
                      className={`min-h-28 rounded-2xl border-2 p-4 text-left transition-[border-color,background-color,transform] active:scale-[.98] ${
                        candidate === skill
                          ? meta.className
                          : "border-slate-200 bg-white text-slate-900"
                      }`}
                      key={candidate}
                      onClick={() => chooseSkill(candidate)}
                      type="button"
                    >
                      <Icon aria-hidden className="size-5" />
                      <strong className="mt-3 block text-base">
                        {meta.label}
                      </strong>
                      <span className="mt-1 block text-sm leading-6 opacity-80">
                        {meta.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </details>

      <Card
        className="overflow-hidden border-2 border-violet-300"
        id="active-mission"
      >
        <CardHeader className="bg-violet-950 text-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-violet-200">
                {level.cefr} · Unit {unit.number} · {skillMeta[skill].label}
              </p>
              <CardTitle className="mt-2 text-2xl text-white">
                {unit.title}
              </CardTitle>
              <CardDescription className="mt-2 max-w-3xl text-base leading-7 text-violet-100">
                {lessonGoal(unit, skill)}
              </CardDescription>
            </div>
            <Badge className="bg-white text-violet-950">
              {pathProgress}% path
            </Badge>
          </div>
          <Progress
            aria-label={`${completedInPath} of 7 skill stages completed`}
            className="mt-4 bg-white/20"
            value={pathProgress}
          />
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <details className="rounded-xl border border-violet-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-black text-violet-950 marker:content-none">
              <span>
                Lesson steps · {activeStep + 1}/7: {step.title}
              </span>
              <span aria-hidden className="text-lg text-violet-800">
                ▾
              </span>
            </summary>
            <div className="grid gap-2 border-t border-violet-100 p-3 sm:grid-cols-2 xl:grid-cols-3">
              {steps.map((candidate, index) => (
                <Button
                  aria-current={index === activeStep ? "step" : undefined}
                  key={candidate.id}
                  onClick={() => moveToStep(index)}
                  variant={index === activeStep ? "default" : "outline"}
                >
                  {index + 1}. {candidate.title}
                </Button>
              ))}
            </div>
          </details>

          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary">Step {activeStep + 1} of 7</Badge>
            {progressState.completedAt[step.id] ? (
              <Badge variant="success">
                <Check aria-hidden /> Evidence saved
              </Badge>
            ) : null}
          </div>

          <section
            aria-labelledby="current-step-title"
            className="rounded-2xl bg-violet-50 p-5 sm:p-6"
          >
            <div className="flex gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-800 text-white">
                <SkillIcon aria-hidden className="size-5" />
              </span>
              <div>
                <h2
                  className="text-xl font-black text-violet-950"
                  id="current-step-title"
                >
                  {step.title}
                </h2>
                <p className="mt-2 max-w-3xl text-base leading-7 text-violet-950/85">
                  {step.instruction}
                </p>
              </div>
            </div>
            <Button
              className="mt-4"
              onClick={() => speak(step.instruction)}
              variant="outline"
            >
              <Volume2 aria-hidden className="size-4" /> Listen to this
              instruction
            </Button>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-300 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black">Lesson material</h3>
                  {skill === "listening" ? (
                    <p className="mt-1 text-xs font-bold text-violet-700">
                      Original listening script written for this lesson
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() =>
                      speak(material, {
                        label:
                          skill === "listening"
                            ? "Original listening"
                            : "Lesson model",
                      })
                    }
                    size="sm"
                    variant="outline"
                  >
                    <Volume2 aria-hidden />
                    {skill === "listening"
                      ? "Play original listening"
                      : "Play model"}
                  </Button>
                  {skill === "listening" ? (
                    <Button
                      onClick={() =>
                        speak(material, {
                          label: "Slow listening",
                          rate: Math.max(0.65, state.settings.ttsRate - 0.2),
                        })
                      }
                      size="sm"
                      variant="outline"
                    >
                      <Headphones aria-hidden /> Play slowly
                    </Button>
                  ) : null}
                  <Button
                    aria-expanded={supportVisible}
                    onClick={() => setSupportVisible((value) => !value)}
                    size="sm"
                    variant="outline"
                  >
                    {supportVisible ? (
                      <EyeOff aria-hidden />
                    ) : (
                      <Eye aria-hidden />
                    )}
                    {supportVisible ? "Hide support" : "Show support"}
                  </Button>
                </div>
              </div>
              {supportVisible ? (
                <div className="mt-4 space-y-4 text-base leading-7">
                  <p className="rounded-xl bg-slate-50 p-4">{material}</p>
                  <div>
                    <strong>Language base</strong>
                    <p className="text-slate-700">{unit.grammar}</p>
                  </div>
                  <div>
                    <strong>Word bank</strong>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {unit.vocabulary.map((word) => (
                        <Badge key={word} variant="secondary">
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <strong>Pronunciation focus</strong>
                    <p className="text-slate-700">{unit.pronunciation}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-slate-50 p-4 text-base leading-7 text-slate-700">
                  Support is hidden. Retrieve what you can before opening it
                  again.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-violet-300 bg-white p-5">
              <h3 className="text-base font-black">Your evidence</h3>
              <p className="mt-2 text-base leading-7 text-slate-700">
                {step.responsePrompt}
              </p>
              {reviewLocked ? (
                <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
                  {reviewDue
                    ? `Delayed recall opens ${formatDueTime(reviewDue)}.`
                    : "Complete the transfer stage first. Your delayed recall will open the next day."}
                </p>
              ) : null}
              <Textarea
                aria-label="Integrated skills evidence"
                className="mt-4 min-h-44 text-base leading-7"
                disabled={reviewLocked}
                onChange={(event) => setDraftResponse(event.target.value)}
                placeholder="Type here, or use speech-to-text below. Short, clear evidence is enough."
                value={draftResponse}
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-bold">
                  {responseWords} / {step.minWords} words
                </span>
                <span className="text-slate-600">
                  Spelling does not block this practice step.
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {skill === "speaking" ? (
                  <Button onClick={openConversationStudio} variant="secondary">
                    <Mic2 aria-hidden /> Practise this lesson in Conversation
                    Studio
                  </Button>
                ) : null}
                <Button
                  disabled={dictating || reviewLocked}
                  onClick={startDictation}
                  variant="outline"
                >
                  <Mic2 aria-hidden /> Dictate instead of typing
                </Button>
                {dictating ? (
                  <Button onClick={stopDictation} variant="outline">
                    <Square aria-hidden /> Stop listening
                  </Button>
                ) : null}
                <Button onClick={saveForLater} variant="outline">
                  <Save aria-hidden /> Save and continue later
                </Button>
                <Button disabled={reviewLocked} onClick={completeStep}>
                  <Check aria-hidden /> Save evidence and complete
                </Button>
              </div>
            </section>
          </div>

          <p
            aria-live="polite"
            className="rounded-xl bg-slate-100 px-4 py-3 text-base font-bold leading-7 text-slate-900"
          >
            {message}
          </p>

          <div className="flex flex-wrap justify-between gap-3 border-t pt-5">
            <Button
              disabled={activeStep === 0}
              onClick={() => moveToStep(activeStep - 1)}
              variant="outline"
            >
              <ChevronLeft aria-hidden /> Previous step
            </Button>
            <Button
              disabled={activeStep === steps.length - 1}
              onClick={() => moveToStep(activeStep + 1)}
              variant="outline"
            >
              Next step <ChevronRight aria-hidden />
            </Button>
          </div>
        </CardContent>
      </Card>

      <details className="overflow-hidden rounded-2xl border border-sky-200 bg-sky-50/70 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:content-none">
          <span>
            <span className="block text-base font-black text-sky-950">
              QSkills companion material
            </span>
            <span className="mt-1 block text-sm text-sky-950/75">
              Optional local audio, video, and book files
            </span>
          </span>
          <span aria-hidden className="text-lg font-black text-sky-900">
            ▾
          </span>
        </summary>
        <div className="border-t border-sky-200 p-4 sm:p-5">
          <QSkillsResources cefr={level.cefr} />
        </div>
      </details>

      <details
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        ref={unitPickerRef}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:content-none">
          <span>
            <span className="block text-base font-black text-slate-950">
              Unit multi-select
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              {visibleUnitIds.length} of {level.units.length} {level.cefr} units
              selected · current: Unit {unit.number}
            </span>
          </span>
          <span aria-hidden className="text-lg font-black text-slate-700">
            ▾
          </span>
        </summary>
        <div className="space-y-3 border-t border-slate-200 p-4 sm:p-5">
          {/* Pending checkboxes make this a real multi-select: the compact unit
              menu changes only after Apply, while evidence remains tied to one
              active unit and skill. */}
          <label className="block text-sm font-bold text-slate-800">
            Search units
            <input
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base"
              onChange={(event) => setUnitQuery(event.target.value)}
              placeholder="Search title, outcome, or unit number"
              type="search"
              value={unitQuery}
            />
          </label>
          <div
            aria-label={`${level.cefr} unit multi-select`}
            className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2"
          >
            {filteredUnits.map((candidate) => {
              const checked = pendingUnitIds.includes(candidate.id);
              return (
                <div
                  className={`flex min-w-0 items-center gap-2 rounded-xl border p-3 ${checked ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white"}`}
                  key={candidate.id}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm font-bold">
                    <input
                      aria-label={`Show Unit ${candidate.number}: ${candidate.title}`}
                      checked={checked}
                      onChange={() => togglePendingUnit(candidate.id)}
                      type="checkbox"
                    />
                    <span className="min-w-0 truncate">
                      Unit {candidate.number} · {candidate.title}
                    </span>
                  </label>
                  <Button
                    onClick={() => chooseUnit(candidate.id)}
                    size="sm"
                    variant={candidate.id === unit.id ? "default" : "outline"}
                  >
                    {candidate.id === unit.id ? "Current" : "Open"}
                  </Button>
                </div>
              );
            })}
            {!filteredUnits.length ? (
              <p className="p-3 text-sm text-slate-600">
                No unit matches this search.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled={!pendingUnitIds.length}
              onClick={applyUnitSelection}
              type="button"
            >
              Apply {pendingUnitIds.length} selected
            </Button>
            <Button
              onClick={() =>
                setPendingUnitIds(level.units.map((candidate) => candidate.id))
              }
              type="button"
              variant="outline"
            >
              Select all units
            </Button>
            <Button
              onClick={() => setPendingUnitIds([unit.id])}
              type="button"
              variant="outline"
            >
              Only current unit
            </Button>
            {!pendingUnitIds.length ? (
              <span
                aria-live="polite"
                className="text-sm font-bold text-red-700"
              >
                Select at least one unit.
              </span>
            ) : null}
          </div>
        </div>
      </details>

      <Card className="border-blue-200 bg-blue-50/70">
        <CardContent className="flex gap-3 pt-5">
          <Sparkles
            aria-hidden
            className="mt-1 size-5 shrink-0 text-blue-900"
          />
          <div>
            <h2 className="font-black text-blue-950">
              Calm-learning protections are active
            </h2>
            <p className="mt-1 text-base leading-7 text-blue-950/80">
              Large text, strong contrast, spoken instructions, dictation,
              untimed work, local saving, reduced writing pressure, and a
              one-step rescue mission are built into this path. Rest days do not
              erase progress.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
