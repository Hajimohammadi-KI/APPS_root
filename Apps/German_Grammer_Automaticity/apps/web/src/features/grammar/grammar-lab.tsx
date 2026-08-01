"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  ExternalLink,
  Flame,
  Lightbulb,
  LoaderCircle,
  Mic2,
  Search,
  Volume2,
} from "lucide-react";

import {
  catalogSummary,
  GRAMMAR_CATEGORIES,
  grammarCategoriesFor,
  grammarMaterialFolderUrl,
  grammarMaterialSources,
  grammarUnits,
  type GrammarCategory,
  type GrammarUnit,
} from "@grammar/content";
import {
  type EvaluationKind,
  type EvaluationResponse,
} from "@grammar/contracts";
import {
  countWords,
  masteryStatusLabels,
  type MasteryMode,
  type MasteryRecord,
} from "@grammar/domain";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
import { requestEvaluation } from "@/lib/evaluation-client";
import { AIExplanation } from "@/features/grammar/ai-explanation";
import {
  LearningAccordion,
  type LearningAccordionTone,
} from "@/components/learning-accordion";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type PracticeItem =
  | {
      readonly type: "gap";
      readonly phase: "Kontrolliert" | "Reparatur";
      readonly prompt: string;
      readonly answer: string;
      readonly model: string;
      readonly mode: "recognition" | "repair";
      readonly kind: "review";
      readonly requiresEvidence: false;
      readonly requiresSpoken: false;
    }
  | {
      readonly type: "produce";
      readonly phase: "Regelabruf" | "Reparatur" | "Schreiben" | "Transfer";
      readonly prompt: string;
      readonly answer: "";
      readonly model: string;
      readonly mode: "recognition" | "repair" | "writing" | "transfer";
      readonly kind: EvaluationKind;
      readonly requiresEvidence: boolean;
      readonly requiresSpoken: boolean;
    };

function grammarItems(grammar: GrammarUnit): readonly PracticeItem[] {
  const recall: PracticeItem = {
    type: "produce",
    phase: "Regelabruf",
    prompt:
      "Erkläre die Regel in eigenen Worten, ohne die Erklärung abzulesen.",
    answer: "",
    model: grammar.recallTest,
    mode: "recognition",
    kind: "recall",
    requiresEvidence: false,
    requiresSpoken: false,
  };
  const controlled: PracticeItem[] = grammar.exercises.map(
    (exercise, index) => ({
      type: "gap",
      phase: index === 0 ? "Reparatur" : "Kontrolliert",
      prompt: exercise[0] ?? "",
      answer: exercise[1] ?? "",
      model: exercise[1] ?? "",
      mode: index === 0 ? "repair" : "recognition",
      kind: "review",
      requiresEvidence: false,
      requiresSpoken: false,
    }),
  );
  const repairExplanation: PracticeItem = {
    type: "produce",
    phase: "Reparatur",
    prompt: `Erkläre den Fehler und schreibe die korrekte Fassung: ${grammar.commonError}`,
    answer: "",
    model: grammar.repairTest,
    mode: "repair",
    kind: "why",
    requiresEvidence: false,
    requiresSpoken: false,
  };
  const freePrompts = [
    "Bilde einen eigenen Satz aus deinem Alltag mit dieser Grammatik.",
    "Erkläre mit dieser Grammatik einen Aspekt deines Studiums.",
    "Formuliere einen eigenen Satz über deinen Tagesablauf oder einen bevorstehenden Termin.",
  ];
  const production: PracticeItem[] = freePrompts.map((prompt, index) => ({
    type: "produce",
    phase: "Schreiben",
    prompt,
    answer: "",
    model:
      grammar.examples[index % grammar.examples.length] ?? grammar.testAnswer,
    mode: "writing",
    kind: "free",
    requiresEvidence: true,
    requiresSpoken: true,
  }));
  const transfer: PracticeItem = {
    type: "produce",
    phase: "Transfer",
    prompt: `${grammar.transferTest} Übertrage die Struktur auf ein neues Thema aus Studium, Arbeit oder Reise.`,
    answer: "",
    model: grammar.examples[0] ?? grammar.testAnswer,
    mode: "transfer",
    kind: "free",
    requiresEvidence: true,
    requiresSpoken: false,
  };
  return [recall, ...controlled, repairExplanation, ...production, transfer];
}

function grammarSearchText(grammar: GrammarUnit): string {
  const { explanation } = grammar;
  return [
    grammar.title,
    grammar.rule,
    grammar.commonError,
    ...grammar.examples,
    explanation.overview,
    ...explanation.formation,
    ...explanation.usage,
    ...explanation.wordOrder,
    ...explanation.specialCases,
    explanation.memoryTip,
  ].join(" ");
}

function speak(text: string) {
  if (!text || !("speechSynthesis" in window)) {
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.92;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

export function GrammarLab() {
  const { state } = useLearnerState();
  const [level, setLevel] = useState("Alle");
  const [category, setCategory] = useState("Alle");
  const [search, setSearch] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [topicsMenuOpen, setTopicsMenuOpen] = useState(true);

  const levelUnits = useMemo(
    () =>
      level === "Alle"
        ? grammarUnits
        : grammarUnits.filter((grammar) => grammar.level === level),
    [level],
  );
  const availableCategories = useMemo(
    () =>
      GRAMMAR_CATEGORIES.filter((item) =>
        levelUnits.some((grammar) =>
          grammarCategoriesFor(grammar).includes(item),
        ),
      ),
    [levelUnits],
  );
  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        availableCategories.map((item) => [
          item,
          levelUnits.filter((grammar) =>
            grammarCategoriesFor(grammar).includes(item),
          ).length,
        ]),
      ) as Readonly<Record<GrammarCategory, number>>,
    [availableCategories, levelUnits],
  );
  const rows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("de");
    return levelUnits.filter(
      (grammar) =>
        (category === "Alle" ||
          grammarCategoriesFor(grammar).includes(
            category as GrammarCategory,
          )) &&
        (!query ||
          grammarSearchText(grammar).toLocaleLowerCase("de").includes(query)),
    );
  }, [category, levelUnits, search]);
  const groupedRows = useMemo(
    () =>
      catalogSummary.levels
        .map((cefrLevel) => ({
          level: cefrLevel,
          units: rows.filter((grammar) => grammar.level === cefrLevel),
        }))
        .filter((group) => group.units.length > 0),
    [rows],
  );
  const levelTones: readonly LearningAccordionTone[] = [
    "blue",
    "emerald",
    "amber",
    "violet",
    "rose",
    "blue",
  ];

  const selected =
    rows.find((grammar) => grammar.title === selectedTitle) ??
    rows.find((grammar) => grammar.title === state.todayGrammar?.title) ??
    rows[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="section-kicker">Grammatik-Labor</p>
        <h1 className="section-title">
          {catalogSummary.grammarUnitCount} vollständige Themen · A1–C2
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Kontrollierte Übungen, freie Produktion, lautes Abrufen und
          langfristige Wiederholung in einem durchgehenden Lernpfad.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            <article className="min-w-56 rounded-xl border bg-muted/20 p-3 text-sm">
              <strong className="block">Schnellstart</strong>
              <span className="text-muted-foreground">
                1 kontrollierte Aufgabe korrekt lösen.
              </span>
            </article>
            <article className="min-w-56 rounded-xl border bg-muted/20 p-3 text-sm">
              <strong className="block">Nachweis</strong>
              <span className="text-muted-foreground">
                1 freie Produktion schreiben und laut bestätigen.
              </span>
            </article>
            <article className="min-w-56 rounded-xl border bg-muted/20 p-3 text-sm">
              <strong className="block">Retention</strong>
              <span className="text-muted-foreground">
                Thema für zeitversetzte Reviews in den Tagespfad übernehmen.
              </span>
            </article>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 pt-5 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid min-w-0 gap-1.5 text-sm font-medium">
            Niveau
            <select
              className="h-10 w-full rounded-lg border bg-background px-3"
              value={level}
              onChange={(event) => {
                const nextLevel = event.target.value;
                const categoryRemainsAvailable =
                  category === "Alle" ||
                  grammarUnits.some(
                    (grammar) =>
                      (nextLevel === "Alle" || grammar.level === nextLevel) &&
                      grammarCategoriesFor(grammar).includes(
                        category as GrammarCategory,
                      ),
                  );
                setLevel(nextLevel);
                if (!categoryRemainsAvailable) {
                  setCategory("Alle");
                }
              }}
            >
              <option>Alle</option>
              {catalogSummary.levels.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="grid min-w-0 gap-1.5 text-sm font-medium">
            Themenbereich
            <select
              className="h-10 w-full rounded-lg border bg-background px-3"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option>Alle</option>
              {availableCategories.map((item) => (
                <option key={item} value={item}>
                  {item} ({categoryCounts[item]})
                </option>
              ))}
            </select>
          </label>
          <label className="grid min-w-0 gap-1.5 text-sm font-medium md:col-span-2 xl:col-span-1">
            Thema suchen
            <span className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                type="search"
                className="pl-9"
                placeholder="z. B. Perfekt, Passiv, Akkusativ"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(15rem,0.62fr)_minmax(0,1.38fr)]">
        <Card className="self-start">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>Themen</CardTitle>
                <CardDescription>
                  {rows.length} von {grammarUnits.length} Themen
                </CardDescription>
              </div>
              <Button
                aria-expanded={topicsMenuOpen}
                aria-label={
                  topicsMenuOpen
                    ? "Themenliste ausblenden"
                    : "Themenliste anzeigen"
                }
                onClick={() => setTopicsMenuOpen((value) => !value)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <ChevronRight
                  className={`size-4 transition-transform ${topicsMenuOpen ? "rotate-90" : "rotate-0"}`}
                />
                {topicsMenuOpen ? "Ausblenden" : "Anzeigen"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className={topicsMenuOpen ? undefined : "hidden"}>
            <div className="grid max-h-80 gap-2 overflow-y-auto pr-1 md:max-h-[68vh]">
              {groupedRows.map((group, groupIndex) => (
                <LearningAccordion
                  className="shrink-0 shadow-none"
                  defaultOpen={group.units.some(
                    (grammar) => grammar.title === selected?.title,
                  )}
                  eyebrow={`${group.level} · GER`}
                  group="deutsche-grammatik-niveaus"
                  key={`${level}-${category}-${search}-${group.level}`}
                  summary={`${group.units.length} passende ${
                    group.units.length === 1 ? "Einheit" : "Einheiten"
                  }`}
                  title={`Grammatik ${group.level}`}
                  tone={levelTones[groupIndex] ?? "blue"}
                >
                  <div className="grid gap-1">
                    {group.units.map((grammar) => {
                      const active = selected?.title === grammar.title;
                      const mastery = state.mastery[grammar.title];
                      return (
                        <button
                          key={grammar.title}
                          type="button"
                          onClick={() => setSelectedTitle(grammar.title)}
                          className={`flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                            active
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "hover:bg-muted"
                          }`}
                        >
                          <span className="min-w-0 flex-1">
                            {grammar.title}
                          </span>
                          {mastery && (
                            <span
                              className={`shrink-0 text-xs ${
                                active
                                  ? "text-primary-foreground/85"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {mastery.status === "automatic" && (
                                <Check className="mr-1 inline size-3.5" />
                              )}
                              {masteryStatusLabels[mastery.status]}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </LearningAccordion>
              ))}
              {rows.length === 0 && (
                <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                  Keine passenden Themen gefunden. Ändere die Filter oder den
                  Suchbegriff.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {selected ? (
          <GrammarPractice key={selected.title} grammar={selected} />
        ) : (
          <Card>
            <CardContent className="grid min-h-64 place-items-center text-muted-foreground">
              Wähle andere Filter, um ein Grammatikthema zu öffnen.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function GrammarPractice({ grammar }: Readonly<{ grammar: GrammarUnit }>) {
  const {
    state,
    setTodayGrammar,
    scheduleReview,
    markActivity,
    recordAttempt,
  } = useLearnerState();
  const items = grammarItems(grammar);
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evidence, setEvidence] = useState("");
  const [passed, setPassed] = useState(false);
  const [spoken, setSpoken] = useState(false);
  const [completed, setCompleted] = useState(() => {
    const existing = state.mastery[grammar.title];
    return Boolean(
      existing?.controlled &&
      existing.free &&
      existing.spoken &&
      existing.scores.repair > 0 &&
      existing.scores.transfer > 0,
    );
  });
  const [hintLevel, setHintLevel] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [report, setReport] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const item = items[index]!;
  const percentage = Math.round((index / Math.max(1, items.length)) * 100);
  const mastery = state.mastery[grammar.title];

  function saveAttempt(
    mode: MasteryMode,
    inputText: string,
    correctedText: string,
    targetHit: boolean,
    accuracyScore: number,
    verified: boolean,
  ) {
    recordAttempt({
      topic: grammar.title,
      mode,
      inputText,
      correctedText,
      targetHit,
      accuracyScore,
      verified,
    });
  }

  async function checkAnswer() {
    const own = answer.trim();
    setAttempts((value) => value + 1);
    setReport(null);
    if (!own) {
      setFeedback("Gib zuerst deine eigene Antwort ein.");
      return;
    }

    if (item.type === "gap") {
      const ok =
        own.toLocaleLowerCase("de") ===
        item.answer.trim().toLocaleLowerCase("de");
      setPassed(ok);
      setSpoken(true);
      setReport({
        original: own,
        corrected: item.answer,
        changed: !ok,
        matches: [],
        online: false,
        issues: ok
          ? []
          : [
              {
                type: "Antwort",
                message: "Die eingesetzte Form passt nicht in diesen Satz.",
                suggestion: item.answer,
                errorClass: item.mode === "repair" ? "target_grammar" : "other",
                severity: item.mode === "repair" ? "major" : "minor",
              },
            ],
        practiceReady: ok,
        verified: true,
        ok,
        targetHit: ok,
        relevant: true,
        accuracyScore: ok ? 100 : 40,
        nextAction: ok ? "transfer" : "repair",
      });
      saveAttempt(item.mode, own, item.answer, ok, ok ? 100 : 40, true);
      if (ok) {
        setCorrect((value) => value + 1);
        setFeedback("Richtig. Der kontrollierte Nachweis ist gespeichert.");
        speak(item.prompt.replace("__", own));
        markActivity(1);
      } else {
        setFeedback(
          "Noch nicht richtig. Nutze den Hinweis oder öffne die Regelhilfe.",
        );
        speak(item.answer);
      }
      return;
    }

    const evidenceUsed =
      !item.requiresEvidence ||
      (evidence.trim().length >= 2 &&
        own
          .toLocaleLowerCase("de")
          .includes(evidence.trim().toLocaleLowerCase("de")));
    const minimumWords = item.phase === "Transfer" ? 8 : 6;
    if (countWords(own) < minimumWords || !evidenceUsed) {
      setPassed(false);
      saveAttempt(item.mode, own, item.model, false, 30, true);
      setFeedback(
        item.requiresEvidence
          ? `Schreibe mindestens ${minimumWords} Wörter und kopiere die verwendete Zielstruktur in das zweite Feld.`
          : `Erkläre die Regel mit mindestens ${minimumWords} Wörtern in eigenen Worten.`,
      );
      return;
    }

    setLoading(true);
    try {
      const result = await requestEvaluation({
        allowOnlineFeedback: state.learner.allowOnlineAI,
        apiBaseUrl: API_BASE_URL,
        text: own,
        grammar: {
          title: grammar.title,
          rule: grammar.rule,
          examples: grammar.examples,
        },
        kind: item.kind,
        taskPrompt: item.prompt,
        spellingAffectsMastery: state.settings.spellingAffectsMastery,
      });
      setReport(result);
      setPassed(result.practiceReady);
      setSpoken(!item.requiresSpoken);
      saveAttempt(
        item.mode,
        own,
        result.corrected,
        result.practiceReady && result.targetHit,
        result.accuracyScore,
        result.verified,
      );
      if (result.practiceReady) {
        setCorrect((value) => value + 1);
        setFeedback(
          item.requiresSpoken
            ? "Der schriftliche Satz ist richtig. Sage ihn jetzt laut, damit Schreiben und Sprechen getrennt nachgewiesen werden."
            : "Der Nachweis ist richtig. Du kannst zum nächsten Schritt gehen.",
        );
        markActivity(1);
      } else {
        setFeedback(
          "Der Satz enthält noch einen Fehler oder verwendet die Zielgrammatik nicht sicher.",
        );
      }
      speak(result.corrected);
    } catch (error) {
      setPassed(false);
      setFeedback(
        error instanceof Error
          ? error.message
          : "Die Auswertung ist momentan nicht erreichbar.",
      );
    } finally {
      setLoading(false);
    }
  }

  function confirmSpoken() {
    if (!passed || !item.requiresSpoken) {
      return;
    }
    saveAttempt(
      "speaking",
      answer.trim(),
      report?.corrected ?? answer.trim(),
      true,
      report?.accuracyScore ?? 100,
      false,
    );
    setSpoken(true);
    setFeedback(
      "Mündlicher Nachweis getrennt gespeichert. Du kannst jetzt weitergehen.",
    );
  }

  function nextItem() {
    if (!passed || (item.requiresSpoken && !spoken)) {
      setFeedback(
        item.requiresSpoken
          ? "Eine richtige schriftliche Antwort und die laute Produktion sind vor dem nächsten Schritt erforderlich."
          : "Diese Aufgabe muss zuerst richtig gelöst werden.",
      );
      return;
    }
    if (index < items.length - 1) {
      setIndex((value) => value + 1);
      setAnswer("");
      setEvidence("");
      setPassed(false);
      setSpoken(false);
      setHintLevel(0);
      setReport(null);
      setFeedback("");
      return;
    }

    setCompleted(true);
    scheduleReview(grammar.title, grammar.commonError, grammar.repairTest, {
      reviewMode: "production",
    });
    markActivity(1);
    setFeedback(
      "Abschlussworkflow bestanden. Das Thema bleibt bis zu zwei erfolgreichen zeitversetzten Reviews stabil statt automatisch; Wiederholungen nach 1, 3, 7, 14 und 30 Tagen sind geplant.",
    );
  }

  const hint =
    hintLevel === 0
      ? ""
      : hintLevel === 1
        ? "Achte auf die Person, die Zeitform oder den Kasus."
        : item.answer
          ? `Der Anfangsbuchstabe der Lösung ist: ${item.answer.charAt(0)}`
          : "Vergleiche deinen Satz mit Regel und Beispielen.";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge>{grammar.level}</Badge>
              <Badge variant="secondary">{item.phase}</Badge>
              <Badge variant="outline">
                Aufgabe {index + 1} von {items.length}
              </Badge>
              <Badge
                variant={
                  mastery?.status === "automatic" ? "default" : "outline"
                }
              >
                {masteryStatusLabels[mastery?.status ?? "new"]}
              </Badge>
            </div>
            <CardTitle className="text-xl">{grammar.title}</CardTitle>
            <CardDescription className="mt-1">
              {grammarCategoriesFor(grammar).join(" · ")}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setTodayGrammar(grammar.title, grammar.level);
              setFeedback("Als heutige Grammatik gespeichert.");
            }}
          >
            <Flame data-icon="inline-start" />
            Heute verwenden
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress
          value={completed ? 100 : percentage}
          aria-label={`Fortschritt: ${completed ? 100 : percentage} Prozent`}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Score value={attempts} label="Versuche" />
          <Score value={correct} label="Richtig" />
          <Score value={completed ? "✓" : "—"} label="Erledigt" />
          <Score
            value={mastery?.scores.automaticity ?? 0}
            label="Automatik %"
          />
        </div>

        <MasteryScorePanel mastery={mastery} />

        <GrammarExplanationPanel grammar={grammar} />

        <AIExplanation
          allowOnline={state.learner.allowOnlineAI}
          content={[
            `Niveau: ${grammar.level}`,
            `Regel: ${grammar.rule}`,
            `Überblick: ${grammar.explanation.overview}`,
            `Bildung: ${grammar.explanation.formation.join(" | ")}`,
            `Verwendung: ${grammar.explanation.usage.join(" | ")}`,
            `Häufiger Fehler: ${grammar.commonError}`,
            `Beispiele: ${grammar.examples.join(" | ")}`,
            `Aktuelle Aufgabe: ${item.prompt}`,
          ].join("\n")}
          learnerInput={answer}
          offlineExplanation={[
            `Einfach erklärt: ${grammar.explanation.overview}`,
            `So wird es gebildet: ${grammar.explanation.formation.join(" ")}`,
            `Merke dir dieses Beispiel: ${grammar.examples[0] ?? item.model}`,
            `Vermeide diesen Fehler: ${grammar.commonError}`,
            `Kurztest: Erkläre, warum die Zielform in „${item.prompt}“ passt.`,
          ].join("\n\n")}
          topic={grammar.title}
        />

        <div className="rounded-2xl border bg-gradient-to-b from-white to-slate-50 p-4">
          <p className="text-lg leading-8 font-semibold">{item.prompt}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => speak(item.prompt)}
          >
            <Volume2 data-icon="inline-start" />
            Aufgabe anhören
          </Button>

          <div className="mt-4 grid gap-2">
            {item.type === "gap" ? (
              <Input
                className="h-11 text-base"
                autoComplete="off"
                placeholder="Antwort eingeben"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
              />
            ) : (
              <>
                <Textarea
                  className="text-base"
                  placeholder={
                    item.phase === "Regelabruf"
                      ? "Regel in eigenen Worten erklären"
                      : "Eigenen Satz schreiben"
                  }
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                />
                {item.requiresEvidence && (
                  <Input
                    placeholder="Verwendete Zielstruktur aus deinem Satz"
                    value={evidence}
                    onChange={(event) => setEvidence(event.target.value)}
                  />
                )}
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={checkAnswer} disabled={loading}>
              {loading ? (
                <LoaderCircle
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <Check data-icon="inline-start" />
              )}
              Prüfen
            </Button>
            {item.requiresSpoken && (
              <Button
                type="button"
                variant="secondary"
                disabled={!passed}
                onClick={confirmSpoken}
              >
                <Mic2 data-icon="inline-start" />
                {spoken ? "Sprechen bestanden ✓" : "Jetzt laut produzieren"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setHintLevel((value) => value + 1)}
            >
              <Lightbulb data-icon="inline-start" />
              Hinweis
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (!answer.trim()) {
                  setFeedback("Gib zuerst deine eigene Antwort ein.");
                } else if (item.type === "gap") {
                  setFeedback(`Lösung: ${item.answer}`);
                  speak(item.answer);
                } else {
                  void checkAnswer();
                }
              }}
            >
              Lösung zeigen
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={
                !passed || (item.requiresSpoken && !spoken) || completed
              }
              onClick={nextItem}
            >
              {index === items.length - 1 ? "Einheit abschließen" : "Weiter"}
              <ChevronRight data-icon="inline-end" />
            </Button>
          </div>

          {feedback && (
            <p
              className={`mt-3 rounded-xl p-3 text-sm ${
                passed || completed
                  ? "bg-sky-50 text-sky-900"
                  : "bg-amber-50 text-amber-950"
              }`}
            >
              {feedback}
            </p>
          )}
          {hint && (
            <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              💡 {hint}
            </p>
          )}
          {report && <CompactEvaluation report={report} />}
        </div>
      </CardContent>
    </Card>
  );
}

function GrammarExplanationPanel({
  grammar,
}: Readonly<{ grammar: GrammarUnit }>) {
  const sources = grammarMaterialSources.filter((source) =>
    source.levels.includes(grammar.level),
  );
  const accordionGroup = `grammatik-erklaerung-${grammar.title
    .toLocaleLowerCase("de")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")}`;

  return (
    <section
      aria-labelledby="complete-grammar-explanation"
      className="overflow-hidden rounded-2xl border border-sky-200 bg-sky-50/45"
    >
      <div className="border-b border-sky-200 bg-sky-100/55 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-sky-800 uppercase">
              Verstehen · Bilden · Anwenden
            </p>
            <h2
              id="complete-grammar-explanation"
              className="mt-1 text-lg font-semibold"
            >
              Vollständige Erklärung
            </h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              speak(
                `${grammar.title}. ${grammar.explanation.overview} ${grammar.rule}`,
              )
            }
          >
            <Volume2 data-icon="inline-start" />
            Erklärung anhören
          </Button>
        </div>
        <p className="mt-3 max-w-3xl leading-7">
          {grammar.explanation.overview}
        </p>
      </div>

      <div className="grid gap-2 p-4">
        <ExplanationSection
          defaultOpen
          group={accordionGroup}
          title="Bildung und Formen"
          items={grammar.explanation.formation}
          tone="blue"
        />
        <ExplanationSection
          group={accordionGroup}
          title="Wann verwendet man das?"
          items={grammar.explanation.usage}
          tone="emerald"
        />
        <ExplanationSection
          group={accordionGroup}
          title="Satzbau und Position"
          items={grammar.explanation.wordOrder}
          tone="violet"
        />
        <ExplanationSection
          group={accordionGroup}
          title="Besonderheiten und Abgrenzung"
          items={grammar.explanation.specialCases}
          tone="amber"
        />
        <LearningAccordion
          group={accordionGroup}
          icon={Lightbulb}
          summary="Regel und Merkhilfe in kompakter Form"
          title="Kurzregel und Merkhilfe"
          tone="amber"
        >
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {grammar.rule}
          </p>
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
            <Lightbulb className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong>Merkhilfe:</strong> {grammar.explanation.memoryTip}
            </span>
          </div>
        </LearningAccordion>
        <LearningAccordion
          group={accordionGroup}
          icon={BookOpen}
          summary={`${grammar.examples.length} Beispiele plus Fehlerkontrast`}
          title="Beispiele und typischer Fehler"
          tone="rose"
        >
          <ul className="mt-2 grid gap-2">
            {grammar.examples.map((example) => (
              <li
                key={example}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <BookOpen className="mt-0.5 size-4 shrink-0 text-sky-700" />
                {example}
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm leading-6 text-rose-950">
            <strong>Typischer Fehler:</strong> {grammar.commonError}
          </p>
        </LearningAccordion>
        <LearningAccordion
          group={accordionGroup}
          icon={ExternalLink}
          summary={`${sources.length + grammar.links.length + 1} Quellen und Übungen`}
          title="Materialbasis und weiterführende Übungen"
          tone="blue"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href={grammarMaterialFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-sky-200 bg-sky-50 p-3 transition-colors hover:bg-sky-100"
            >
              <span className="flex items-center justify-between gap-2 font-semibold">
                Deine Kursmaterialien in Google Drive
                <ExternalLink className="size-4" />
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                Die Erklärung wurde anhand der passenden Lehrwerke neu
                strukturiert und eigenständig formuliert.
              </span>
            </a>
            {sources.map((source) => (
              <div key={source.title} className="rounded-xl border p-3">
                <p className="font-semibold">{source.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {source.contribution}
                </p>
              </div>
            ))}
            {grammar.links.map((link) => (
              <a
                key={`${link[0]}-${link[1]}`}
                href={link[1]}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border p-3 transition-colors hover:border-primary/30 hover:bg-muted/40"
              >
                <span className="flex items-center justify-between gap-2 font-semibold">
                  {link[0]}
                  <ExternalLink className="size-4" />
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {link[2]}
                </span>
              </a>
            ))}
          </div>
        </LearningAccordion>
      </div>
    </section>
  );
}

function ExplanationSection({
  defaultOpen = false,
  group,
  title,
  items,
  tone,
}: Readonly<{
  defaultOpen?: boolean;
  group: string;
  title: string;
  items: readonly string[];
  tone: LearningAccordionTone;
}>) {
  return (
    <LearningAccordion
      defaultOpen={defaultOpen}
      group={group}
      summary={`${items.length} kompakte Punkte`}
      title={title}
      tone={tone}
    >
      <ul className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-600"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </LearningAccordion>
  );
}

function Score({
  value,
  label,
}: Readonly<{ value: number | string; label: string }>) {
  return (
    <div className="rounded-xl border bg-muted/40 p-2 text-center">
      <strong className="block text-xl text-primary">{value}</strong>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function MasteryScorePanel({
  mastery,
}: Readonly<{ mastery: MasteryRecord | undefined }>) {
  const scores = mastery?.scores ?? {
    recognition: 0,
    writing: 0,
    speaking: 0,
    repair: 0,
    transfer: 0,
    automaticity: 0,
  };
  const rows = [
    ["Erkennen", scores.recognition],
    ["Schreiben", scores.writing],
    ["Sprechen", scores.speaking],
    ["Reparieren", scores.repair],
    ["Transfer", scores.transfer],
  ] as const;

  return (
    <LearningAccordion
      summary={`${mastery?.successfulReviews ?? 0} von 2 zeitversetzten Reviews · fünf getrennte Nachweise`}
      title="Beherrschungsnachweise"
      tone="violet"
    >
      <div className="flex justify-end">
        <Badge variant="outline">
          {mastery?.successfulReviews ?? 0} / 2 zeitversetzte Reviews
        </Badge>
      </div>
      <div className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium">{label}</span>
              <span className="text-muted-foreground">{value} %</span>
            </div>
            <Progress value={value} aria-label={`${label}: ${value} Prozent`} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        „Automatisiert“ wird erst ab 85 % Erkennen, je 80 % Schreiben, Sprechen
        und Reparieren, 75 % Transfer, zwei erfolgreichen Reviews, ohne aktive
        kritische Fehler und mit schnellem Abruf vergeben.
      </p>
    </LearningAccordion>
  );
}

function CompactEvaluation({
  report,
}: Readonly<{ report: EvaluationResponse }>) {
  return (
    <div
      className={`mt-3 rounded-xl border p-3 text-sm ${
        report.practiceReady
          ? "border-sky-300 bg-sky-50"
          : "border-amber-300 bg-amber-50"
      }`}
    >
      <strong>
        {report.ok
          ? "Online geprüft und richtig"
          : report.practiceReady
            ? "Offline-Übung bereit"
            : "Noch nicht bestanden"}
      </strong>
      {report.changed && <p className="mt-1">Korrigiert: {report.corrected}</p>}
      {report.issues.map((issue, issueIndex) => (
        <p key={`${issue.type}-${issueIndex}`} className="mt-1">
          <strong>{issue.type}:</strong> {issue.message}
          {issue.suggestion ? ` Vorschlag: ${issue.suggestion}` : ""}
        </p>
      ))}
      {!report.online && (
        <p className="mt-1 text-xs text-muted-foreground">
          Die Offline-Prüfung lässt dich weiterüben, verändert aber keine
          Beherrschungs- oder CEFR-Werte.
        </p>
      )}
    </div>
  );
}
