"use client";

import * as React from "react";
import {
  BookMarked,
  Check,
  ChevronRight,
  ExternalLink,
  Flame,
  Lightbulb,
  Volume2,
} from "lucide-react";
import {
  GRAMMAR_CATEGORIES,
  grammarCategory,
  grammarUnits,
  type GrammarUnit,
} from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EvaluationResult } from "@/features/components/evaluation-result";
import { AIExplanation } from "@/features/components/ai-explanation";
import { LearningAccordion } from "@/features/components/learning-accordion";
import { useAppStore } from "@/features/store/app-store";
import { evaluateResponse, type Evaluation } from "@/lib/assessment";
import { speak } from "@/lib/speech";
import { wordCount } from "@/lib/utils";

interface PracticeItem {
  type: "controlled" | "production";
  prompt: string;
  answer: string;
  model: string;
}

function practiceItems(grammar: GrammarUnit): PracticeItem[] {
  return [
    ...grammar.exercises.map(([prompt, answer]) => ({
      type: "controlled" as const,
      prompt,
      answer,
      model: answer,
    })),
    ...grammar.examples.slice(0, 3).map((model) => ({
      type: "production" as const,
      prompt: "Create your own complete sentence using this grammar.",
      answer: "",
      model,
    })),
  ];
}

export function GrammarScreen({
  navigate,
}: {
  navigate: (screen: string) => void;
}) {
  const { state, recordAttempt, setTodayGrammar } = useAppStore();
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("All");
  const [level, setLevel] = React.useState("All");
  const [selectedTitle, setSelectedTitle] = React.useState(
    state.todayGrammar?.title ?? grammarUnits[0]?.title ?? "",
  );
  const [itemIndex, setItemIndex] = React.useState(0);
  const [attempts, setAttempts] = React.useState(0);
  const [correct, setCorrect] = React.useState(0);
  const [answer, setAnswer] = React.useState("");
  const [hint, setHint] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [evaluation, setEvaluation] = React.useState<Evaluation | null>(null);
  const [checking, setChecking] = React.useState(false);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return grammarUnits.filter(
      (grammar) =>
        (level === "All" || grammar.level === level) &&
        (category === "All" || grammarCategory(grammar) === category) &&
        (!query ||
          [
            grammar.title,
            grammar.rule,
            grammar.commonError,
            ...grammar.examples,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)),
    );
  }, [category, level, search]);
  const groupedFiltered = React.useMemo(
    () =>
      ["A1", "A2", "B1", "B2", "C1", "C2"]
        .map((cefrLevel) => ({
          level: cefrLevel,
          units: filtered.filter((unit) => unit.level === cefrLevel),
        }))
        .filter((group) => group.units.length > 0),
    [filtered],
  );

  React.useEffect(() => {
    if (!filtered.some((grammar) => grammar.title === selectedTitle)) {
      setSelectedTitle(filtered[0]?.title ?? "");
    }
  }, [filtered, selectedTitle]);

  const grammar =
    grammarUnits.find((unit) => unit.title === selectedTitle) ?? filtered[0];
  const items = grammar ? practiceItems(grammar) : [];
  const item = items[itemIndex] ?? items[0];
  const mastery = grammar ? state.mastery[grammar.title] : undefined;

  React.useEffect(() => {
    setItemIndex(0);
    setAttempts(0);
    setCorrect(0);
    setAnswer("");
    setHint("");
    setMessage("");
    setEvaluation(null);
  }, [selectedTitle]);

  if (!grammar || !item) {
    return (
      <div className="page-stack">
        <div className="page-heading">
          <div>
            <h1>Grammar Lab</h1>
            <p>No grammar unit matches these filters.</p>
          </div>
        </div>
      </div>
    );
  }

  const advance = () => {
    if (itemIndex < items.length - 1) {
      setItemIndex((value) => value + 1);
      setAnswer("");
      setHint("");
      setMessage("");
      setEvaluation(null);
    } else {
      setMessage(
        "Unit completed. Add it to today's path for transfer and review.",
      );
    }
  };

  const checkAnswer = async () => {
    const own = answer.trim();
    setAttempts((value) => value + 1);
    setMessage("");
    setEvaluation(null);
    if (!own) {
      setMessage("Enter your own English answer first.");
      return;
    }

    if (item.type === "controlled") {
      const passed = own.toLowerCase() === item.answer.trim().toLowerCase();
      recordAttempt({
        grammarTitle: grammar.title,
        mode: "recognition",
        inputText: own,
        correctedText: item.answer,
        targetHit: passed,
        accuracyScore: passed ? 100 : 0,
        fluencyScore: 0,
        latencyMs: null,
        passed,
        verified: true,
      });
      if (passed) {
        setCorrect((value) => value + 1);
        setMessage(
          "Correct. Say the full answer out loud, then continue.",
        );
        speak(item.answer);
      } else {
        setMessage(
          "Not correct yet. Try again or open a step-by-step hint.",
        );
      }
      return;
    }

    if (wordCount(own) < 4) {
      setMessage(
        "Write a complete English sentence with at least four words.",
      );
      return;
    }
    setChecking(true);
    const result = await evaluateResponse(
      own,
      {
        grammar,
        minWords: 4,
        requiredTargetUses: 1,
        taskPrompt: item.prompt,
      },
      state.settings,
    );
    setChecking(false);
    setEvaluation(result);
    recordAttempt({
      grammarTitle: grammar.title,
      mode: "writing",
      inputText: own,
      correctedText: result.corrected,
      targetHit: result.targetUses >= result.required,
      accuracyScore: result.accuracyScore,
      fluencyScore: 0,
      latencyMs: null,
      passed: result.masteryEligible && result.pass,
      verified: result.masteryEligible,
    });
    if (result.pass) {
      setCorrect((value) => value + 1);
      setMessage(
        "Free production passed. Listen, repeat, continue.",
      );
      speak(result.corrected);
    }
  };

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <h1>Grammar Lab</h1>
          <p>
            All {grammarUnits.length} CEFR units are searchable and include at
            least five controlled tasks, free production, targeted help, and
            separate mastery evidence.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge>{grammarUnits.length} units</Badge>
          <Badge variant="secondary">A1–C2</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-2 pt-5 sm:grid-cols-3">
          <div className="rounded-xl border bg-muted/30 p-3 text-sm">
            <strong className="block">Daily target</strong>
            <span className="text-muted-foreground">
              1 controlled task + 1 free production
            </span>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3 text-sm">
            <strong className="block">Skill balance</strong>
            <span className="text-muted-foreground">
              Verify writing, then confirm speaking
            </span>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3 text-sm">
            <strong className="block">Review policy</strong>
            <span className="text-muted-foreground">
              Add completed units to today's path
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="grammar-layout">
            <aside className="page-stack">
              <div className="field-stack">
                <Label htmlFor="grammar-search">Search grammar</Label>
                <Input
                  autoComplete="off"
                  id="grammar-search"
                  name="grammar-search"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="z. B. past, passive, conditionals"
                  type="search"
                  value={search}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="field-stack">
                  <Label htmlFor="grammar-category">Grammar category</Label>
                  <Select
                    id="grammar-category"
                    name="grammar-category"
                    onChange={(event) => setCategory(event.target.value)}
                    value={category}
                  >
                    <option value="All">All</option>
                    {GRAMMAR_CATEGORIES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </div>
                <div className="field-stack">
                  <Label htmlFor="grammar-level">Level</Label>
                  <Select
                    id="grammar-level"
                    name="grammar-level"
                    onChange={(event) => setLevel(event.target.value)}
                    value={level}
                  >
                    <option value="All">All</option>
                    {["A1", "A2", "B1", "B2", "C1", "C2"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <p className="text-xs font-bold text-muted-foreground">
                {filtered.length} of {grammarUnits.length} units
              </p>
              <div className="grammar-list gap-2">
                {groupedFiltered.map((group, groupIndex) => (
                  <LearningAccordion
                    className="shrink-0 shadow-none"
                    defaultOpen={group.units.some(
                      (unit) => unit.title === grammar.title,
                    )}
                    eyebrow={`${group.level} · CEFR`}
                    group="english-grammar-levels"
                    key={`${level}-${category}-${search}-${group.level}`}
                    summary={`${group.units.length} matching ${
                      group.units.length === 1 ? "unit" : "units"
                    }`}
                    title={`Grammar ${group.level}`}
                    tone={
                      (
                        [
                          "blue",
                          "emerald",
                          "amber",
                          "violet",
                          "rose",
                          "blue",
                        ] as const
                      )[groupIndex]
                    }
                  >
                    <div className="grid gap-1">
                      {group.units.map((unit) => (
                        <button
                          className="grammar-button"
                          data-active={unit.title === grammar.title}
                          key={`${unit.level}-${unit.title}`}
                          onClick={() => setSelectedTitle(unit.title)}
                          type="button"
                        >
                          <strong className="block text-sm">
                            {unit.title}
                          </strong>
                          <span className="mt-1 flex justify-between gap-2 text-xs text-muted-foreground">
                            <span>{unit.level}</span>
                            <span>{grammarCategory(unit)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </LearningAccordion>
                ))}
              </div>
            </aside>

            <section className="page-stack">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{grammar.level}</Badge>
                    <Badge variant="secondary">
                      {grammarCategory(grammar)}
                    </Badge>
                    {mastery ? (
                      <Badge
                        variant={
                          mastery.status === "automatic" ? "success" : "warning"
                        }
                      >
                        {mastery.status}
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">
                    {grammar.title}
                  </h2>
                </div>
                <Button
                  onClick={() => {
                    setTodayGrammar(grammar);
                    navigate("daily");
                  }}
                >
                  <Flame aria-hidden className="size-4" />
                  Use today
                </Button>
              </div>

              <Progress value={(itemIndex / Math.max(1, items.length)) * 100} />
              <div className="grid grid-cols-3 gap-2">
                <div className="metric-card">
                  <strong>{attempts}</strong>
                  <span>Attempts</span>
                </div>
                <div className="metric-card">
                  <strong>{correct}</strong>
                  <span>Correct</span>
                </div>
                <div className="metric-card">
                  <strong>
                    {itemIndex + 1}/{items.length}
                  </strong>
                  <span>Task</span>
                </div>
              </div>

              <div className="practice-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge
                    variant={item.type === "production" ? "warning" : "default"}
                  >
                    {item.type === "production"
                      ? "Free production"
                      : "Controlled recall"}
                  </Badge>
                  <Button
                    onClick={() => speak(item.prompt)}
                    size="sm"
                    variant="ghost"
                  >
                    <Volume2 aria-hidden className="size-4" />
                    Listen
                  </Button>
                </div>
                <p className="practice-prompt">{item.prompt}</p>
                {item.type === "controlled" ? (
                  <Input
                    aria-label="Controlled grammar answer"
                    autoComplete="off"
                    name="controlled-grammar-answer"
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Enter English answer"
                    value={answer}
                  />
                ) : (
                  <Textarea
                    aria-label="Original English grammar production"
                    autoComplete="off"
                    name="grammar-production"
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Write a new English sentence; do not copy the model."
                    value={answer}
                  />
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button disabled={checking} onClick={checkAnswer}>
                    <Check aria-hidden className="size-4" />
                    {checking ? "Evaluating..." : "Check answer"}
                  </Button>
                  <Button
                    onClick={() =>
                      setHint(
                        hint
                          ? `Model form: ${item.model}`
                          : item.type === "controlled"
                            ? `The answer starts with "${item.answer.charAt(0)}".`
                            : "Check subject, tense, and target pattern.",
                      )
                    }
                    variant="secondary"
                  >
                    <Lightbulb aria-hidden className="size-4" />
                    {hint ? "More help" : "Hint"}
                  </Button>
                  <Button onClick={advance} variant="outline">
                    Next task
                    <ChevronRight aria-hidden className="size-4" />
                  </Button>
                </div>
                {message ? (
                  <p className="mt-3 rounded-xl border bg-secondary p-3 text-sm">
                    {message}
                  </p>
                ) : null}
                {hint ? (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    {hint}
                  </p>
                ) : null}
                {evaluation ? (
                  <EvaluationResult evaluation={evaluation} />
                ) : null}
              </div>

              <div className="grid gap-2">
                <LearningAccordion
                  defaultOpen
                  eyebrow="Understand"
                  group={`english-reference-${grammar.title}`}
                  icon={BookMarked}
                  summary="Shortest reliable description of this structure"
                  title="Rule and pattern"
                  tone="blue"
                >
                  <p className="leading-7">{grammar.rule}</p>
                </LearningAccordion>
                <LearningAccordion
                  eyebrow="Recognize"
                  group={`english-reference-${grammar.title}`}
                  icon={Lightbulb}
                  summary={`${grammar.examples.length} model sentences`}
                  title="Examples to compare"
                  tone="emerald"
                >
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                    {grammar.examples.map((example) => (
                      <li key={example}>{example}</li>
                    ))}
                  </ul>
                </LearningAccordion>
                <LearningAccordion
                  eyebrow="Improve"
                  group={`english-reference-${grammar.title}`}
                  summary="Open this when your answer fails"
                  title="Typical mistake"
                  tone="rose"
                >
                  <p className="text-sm leading-7">{grammar.commonError}</p>
                </LearningAccordion>
                <LearningAccordion
                  eyebrow="Continue"
                  group={`english-reference-${grammar.title}`}
                  icon={ExternalLink}
                  summary={`${grammar.links.length} topic-specific links`}
                  title="Resources and extra practice"
                  tone="amber"
                >
                  <div className="resource-links">
                    {grammar.links.map((link) => (
                      <Button
                        asChild
                        key={`${link[0]}-${link[1]}-${link[3]}`}
                        size="sm"
                        variant="outline"
                      >
                        <a href={link[1]} rel="noreferrer" target="_blank">
                          {link[0]}
                          <ExternalLink aria-hidden className="size-3.5" />
                        </a>
                      </Button>
                    ))}
                  </div>
                </LearningAccordion>
              </div>
              <AIExplanation
                key={grammar.title}
                allowOnline={state.learner.allowOnlineAI}
                content={[
                  `Level: ${grammar.level}`,
                  `Rule: ${grammar.rule}`,
                  `Common error: ${grammar.commonError}`,
                  `Examples: ${grammar.examples.join(" | ")}`,
                  `Current exercise: ${item.prompt}`,
                ].join("\n")}
                learnerInput={answer}
                offlineExplanation={[
                  `In simple words: ${grammar.rule}`,
                  `Notice the pattern in this example: ${grammar.examples[0] ?? item.model}`,
                  `Avoid this common mistake: ${grammar.commonError}`,
                  `Quick check: explain why the target form fits “${item.prompt}” before you continue.`,
                ].join("\n\n")}
                topic={grammar.title}
              />
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
