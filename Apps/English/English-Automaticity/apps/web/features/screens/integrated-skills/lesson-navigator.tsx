import { Brain, Check, Clock3, ShieldCheck } from "lucide-react";
import {
  INTEGRATED_SKILLS,
  integratedSkillsLevels,
  type CefrLevel,
  type IntegratedSkill,
  type IntegratedSkillsUnit,
  type getIntegratedSkillsLevel,
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
import { levelTone, skillMeta } from "./display-meta";

type LessonNavigatorProps = {
  level: ReturnType<typeof getIntegratedSkillsLevel>;
  unit: IntegratedSkillsUnit;
  skill: IntegratedSkill;
  visibleSkills: readonly IntegratedSkill[];
  visibleUnitIds: readonly string[];
  missionMode: "standard" | "rescue";
  levelProgress: number;
  completedInLevel: number;
  levelStepCount: number;
  toggleVisibleSkill: (skill: IntegratedSkill) => void;
  setMissionMode: (mode: "standard" | "rescue") => void;
  chooseLevel: (level: CefrLevel) => void;
  chooseUnit: (unitId: string) => void;
  chooseSkill: (skill: IntegratedSkill) => void;
};

export function LessonNavigator({
  level,
  unit,
  skill,
  visibleSkills,
  visibleUnitIds,
  missionMode,
  levelProgress,
  completedInLevel,
  levelStepCount,
  toggleVisibleSkill,
  setMissionMode,
  chooseLevel,
  chooseUnit,
  chooseSkill,
}: LessonNavigatorProps) {
  return (
    <details className="integrated-navigator overflow-hidden rounded-2xl border border-worksheet-line! bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 bg-worksheet-cyan/80 px-5 py-4 marker:content-none">
        <span>
          <span className="block text-sm font-black text-worksheet-teal!">
            Lesson navigator
          </span>
          <span className="mt-1 block text-sm text-worksheet-teal/75">
            {level.cefr} · Unit {unit.number} · {skillMeta[skill].label} ·{" "}
            {visibleSkills.length}/4 skills shown
          </span>
        </span>
        <span aria-hidden className="text-lg font-black text-worksheet-teal!">
          ▾
        </span>
      </summary>
      <div className="space-y-4 border-t border-worksheet-line! p-4 sm:p-5">
        {/* Multi-select is intentionally only a display filter. The active
            evidence path remains one skill at a time, so evidence cannot be
            accidentally mixed across listening, speaking, reading, and writing. */}
        <section
          aria-labelledby="skill-filter-label"
          className="rounded-2xl border border-worksheet-line! bg-white p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2
                className="text-base font-black text-worksheet-teal!"
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
                      ? "border-worksheet-line bg-worksheet-cyan! text-worksheet-teal"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                  key={candidate}
                >
                  <input
                    aria-label={`Show ${meta.label} in the lesson navigator`}
                    checked={checked}
                    className="size-4 accent-worksheet-teal"
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
        <Card className="border-worksheet-line! bg-worksheet-cyan/80">
          <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Badge className="bg-worksheet-teal! border-worksheet-teal! text-white!">
                Today · one calm mission
              </Badge>
              <h2 className="mt-3 text-2xl font-black text-worksheet-teal!">
                Make English usable without overload
              </h2>
              <p className="mt-2 max-w-3xl text-base leading-7 text-worksheet-teal/80">
                Work on one visible action. Listen to every instruction, dictate
                instead of typing, save at any point, and return without losing
                your place.
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
                <ShieldCheck aria-hidden className="size-4" /> Rescue: one step
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
                      className="mt-1 size-4 shrink-0 text-worksheet-teal"
                    />
                    {lesson}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-worksheet-line!">
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
                {completedInLevel} / {levelStepCount} evidence stages
              </p>
              <ul className="space-y-2 text-sm leading-6">
                {level.exitCriteria.map((criterion) => (
                  <li className="flex gap-2" key={criterion}>
                    <Check
                      aria-hidden
                      className="mt-1 size-4 shrink-0 text-worksheet-teal"
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
              The four skills share one real-life outcome, but each has its own
              evidence path.
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
                  .filter((candidate) => visibleUnitIds.includes(candidate.id))
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
  );
}
