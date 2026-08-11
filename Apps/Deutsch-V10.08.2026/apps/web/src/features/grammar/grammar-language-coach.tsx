"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Brain,
  Check,
  Eye,
  EyeOff,
  Languages,
  PencilLine,
} from "lucide-react";

import type { GrammarUnit } from "@grammar/content";

import { Button } from "@/components/ui/button";
import { LearningAccordion } from "@/components/learning-accordion";

import {
  grammarCoachFor,
  isGrammarSupportLanguage,
  type GrammarSupportLanguage,
} from "./grammar-learning-coach";

const LANGUAGE_KEY = "deutschflow:honovr-language";

const uiCopy = {
  de: {
    eyebrow: "Aktiver Abruf · kurze Schritte",
    title: "Aktiver Grammatik-Abruf",
    summary:
      "Kurz lesen, abdecken, selbst erinnern, vergleichen und gezielt reparieren.",
    language: "Erklärungssprache (HONOVR)",
    retrieval: [
      "Kurz lesen",
      "Regel abdecken",
      "Selbst erinnern",
      "Vergleichen",
      "Einen Fehler reparieren",
    ],
    anchor: "20-Sekunden-Lernanker",
    anchorHelp:
      "Lies nur diesen kurzen Anker. Schließe ihn dann und erkläre die Regel aus dem Gedächtnis.",
    cover: "Regel abdecken und selbst erinnern",
    attempt:
      "Schreibe unten zuerst deine eigene Antwort. Auch ein unsicherer Versuch ist wertvoll; die Regelhilfe bleibt bis dahin geschlossen.",
    ownAnswer: "Zur eigenen Antwort",
    readyCompare: "Deine Antwort ist vorhanden. Jetzt darfst du vergleichen.",
    compare: "Mit der vollständigen Regel vergleichen",
    repairHelp:
      "Regelhilfe ist geöffnet. Repariere nur einen Unterschied und sage die verbesserte Form danach laut.",
    repair: "Antwort gezielt reparieren",
    strategy: "Lernstrategie für dieses Thema anzeigen",
    review:
      "Nach erfolgreichem Abschluss wird die Wiederholung automatisch nach 1, 3, 7, 14 und 30 Tagen geplant.",
    aria: "Fünf Schritte des aktiven Grammatik-Abrufs",
  },
  en: {
    eyebrow: "Active recall · short steps",
    title: "Active grammar recall",
    summary:
      "Read briefly, hide the rule, recall, compare, and repair one difference.",
    language: "Explanation language (HONOVR)",
    retrieval: [
      "Read briefly",
      "Hide the rule",
      "Recall yourself",
      "Compare",
      "Repair one error",
    ],
    anchor: "20-second learning anchor",
    anchorHelp:
      "Read only this short anchor. Then hide it and explain the rule from memory.",
    cover: "Hide rule and recall",
    attempt:
      "Write your own answer below first. An uncertain attempt is still useful; rule help stays closed until then.",
    ownAnswer: "Go to my answer",
    readyCompare: "Your answer is present. You may now compare it.",
    compare: "Compare with the complete rule",
    repairHelp:
      "Rule help is open. Repair only one difference, then say the improved form aloud.",
    repair: "Repair my answer",
    strategy: "Show the learning strategy for this topic",
    review:
      "After successful completion, review is scheduled after 1, 3, 7, 14, and 30 days.",
    aria: "Five active grammar recall steps",
  },
  fa: {
    eyebrow: "بازیابی فعال · قدم‌های کوتاه",
    title: "بازیابی فعال گرامر",
    summary:
      "کوتاه بخوان، قانون را ببند، از حافظه بگو، مقایسه کن و فقط یک خطا را اصلاح کن.",
    language: "زبان توضیح (HONOVR)",
    retrieval: [
      "کوتاه بخوان",
      "قانون را ببند",
      "خودت به یاد بیاور",
      "مقایسه کن",
      "یک خطا را اصلاح کن",
    ],
    anchor: "راهنمای ۲۰ ثانیه‌ای",
    anchorHelp:
      "فقط این راهنمای کوتاه را بخوان. سپس آن را ببند و قانون را از حافظه توضیح بده.",
    cover: "قانون را ببند و خودت به یاد بیاور",
    attempt:
      "ابتدا پاسخ خودت را پایین بنویس. حتی پاسخ نامطمئن هم ارزش دارد؛ راهنمای قانون تا آن زمان بسته می‌ماند.",
    ownAnswer: "رفتن به پاسخ خودم",
    readyCompare: "پاسخ تو نوشته شده است. حالا می‌توانی آن را مقایسه کنی.",
    compare: "مقایسه با قانون کامل",
    repairHelp:
      "راهنمای قانون باز است. فقط یک تفاوت را اصلاح کن و شکل بهتر را بلند بگو.",
    repair: "اصلاح هدفمند پاسخ",
    strategy: "نمایش روش یادگیری این موضوع",
    review: "پس از موفقیت، مرور در روزهای ۱، ۳، ۷، ۱۴ و ۳۰ برنامه‌ریزی می‌شود.",
    aria: "پنج مرحله بازیابی فعال گرامر",
  },
} as const;

export function GrammarLanguageCoach({
  grammar,
  hasOwnAnswer,
  ruleHelpVisible,
  onRevealRuleHelp,
  onStartRecall,
}: Readonly<{
  grammar: GrammarUnit;
  hasOwnAnswer: boolean;
  ruleHelpVisible: boolean;
  onRevealRuleHelp: () => void;
  onStartRecall: () => void;
}>) {
  const [supportLanguage, setSupportLanguage] =
    useState<GrammarSupportLanguage>("de");
  const [studyVisible, setStudyVisible] = useState(true);
  const coach = grammarCoachFor(grammar, supportLanguage);
  const ui = uiCopy[supportLanguage];
  const isPersian = supportLanguage === "fa";

  useEffect(() => {
    const saved = window.localStorage.getItem(LANGUAGE_KEY);
    if (isGrammarSupportLanguage(saved)) setSupportLanguage(saved);
  }, []);

  useEffect(() => {
    setStudyVisible(true);
  }, [grammar.title]);

  const currentStep = studyVisible
    ? 0
    : !hasOwnAnswer
      ? 2
      : !ruleHelpVisible
        ? 3
        : 4;
  const icons = [BookOpen, EyeOff, Brain, Eye, PencilLine] as const;

  function changeLanguage(value: string) {
    if (!isGrammarSupportLanguage(value)) return;
    setSupportLanguage(value);
    window.localStorage.setItem(LANGUAGE_KEY, value);
  }

  function closeRuleAndStartRecall() {
    setStudyVisible(false);
    onStartRecall();
  }

  return (
    <LearningAccordion
      defaultOpen
      eyebrow={ui.eyebrow}
      icon={Brain}
      summary={ui.summary}
      title={ui.title}
      tone="violet"
    >
      <div className="grid gap-4" dir={isPersian ? "rtl" : "ltr"}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl text-start">
            <p className="text-sm font-semibold text-violet-900">
              {coach.title}
            </p>
            <p className="mt-1 leading-7">{coach.goal}</p>
          </div>
          <label className="grid gap-1 text-start text-sm font-medium">
            <span className="flex items-center gap-1.5">
              <Languages className="size-4" />
              {ui.language}
            </span>
            <select
              aria-label={ui.language}
              className="h-10 min-w-40 rounded-lg border bg-background px-3 text-sm"
              onChange={(event) => changeLanguage(event.target.value)}
              value={supportLanguage}
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="fa">فارسی</option>
            </select>
          </label>
        </div>

        <ol aria-label={ui.aria} className="grid gap-2 sm:grid-cols-5">
          {ui.retrieval.map((label, index) => {
            const StepIcon = icons[index] ?? Brain;
            const completed = index < currentStep;
            const active = index === currentStep;
            return (
              <li
                aria-current={active ? "step" : undefined}
                className={`rounded-xl border p-3 text-sm leading-5 ${active ? "border-violet-500 bg-violet-100 text-violet-950 ring-2 ring-violet-200" : completed ? "border-violet-200 bg-violet-50 text-violet-950" : "bg-background text-muted-foreground"}`}
                key={label}
              >
                <span className="mb-2 flex items-center justify-between gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-white font-semibold text-violet-950 shadow-sm">
                    {completed ? <Check className="size-4" /> : index + 1}
                  </span>
                  <StepIcon aria-hidden="true" className="size-4" />
                </span>
                <span className="font-medium">{label}</span>
              </li>
            );
          })}
        </ol>

        <div className="rounded-xl border border-violet-300 bg-violet-50/70 p-4 text-violet-950">
          {studyVisible ? (
            <>
              <p className="text-xs font-semibold tracking-[0.14em] uppercase">
                {ui.anchor}
              </p>
              <p className="mt-2 text-lg leading-8 font-semibold" dir="ltr">
                {grammar.rule}
              </p>
              <p className="mt-2 text-sm leading-6">{ui.anchorHelp}</p>
              <Button
                className="mt-3"
                onClick={closeRuleAndStartRecall}
                size="sm"
                type="button"
              >
                <EyeOff data-icon="inline-start" />
                {ui.cover}
              </Button>
            </>
          ) : !hasOwnAnswer ? (
            <>
              <p className="font-semibold leading-7">{coach.recallPrompt}</p>
              <p className="mt-2 text-sm leading-6">{ui.attempt}</p>
              <Button
                className="mt-3"
                onClick={onStartRecall}
                size="sm"
                type="button"
                variant="outline"
              >
                <PencilLine data-icon="inline-start" />
                {ui.ownAnswer}
              </Button>
            </>
          ) : !ruleHelpVisible ? (
            <>
              <p className="font-semibold leading-7">{coach.comparePrompt}</p>
              <p className="mt-2 text-sm leading-6">{ui.readyCompare}</p>
              <Button
                className="mt-3"
                onClick={onRevealRuleHelp}
                size="sm"
                type="button"
                variant="outline"
              >
                <Eye data-icon="inline-start" />
                {ui.compare}
              </Button>
            </>
          ) : (
            <>
              <p className="font-semibold leading-7">{coach.comparePrompt}</p>
              <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-violet-900">
                <Eye className="mt-1 size-4 shrink-0" />
                {ui.repairHelp}
              </p>
              <Button
                className="mt-3"
                onClick={onStartRecall}
                size="sm"
                type="button"
                variant="outline"
              >
                <PencilLine data-icon="inline-start" />
                {ui.repair}
              </Button>
            </>
          )}
        </div>

        <details className="rounded-xl border bg-background p-3">
          <summary className="cursor-pointer font-medium">
            {ui.strategy}
          </summary>
          <div className="mt-3 text-start">
            <ol className="grid gap-2 sm:grid-cols-2">
              {coach.steps.map((step, index) => (
                <li
                  className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3 text-sm leading-6"
                  key={step}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {coach.sourceNote}
            </p>
          </div>
        </details>

        <p className="text-sm leading-6 text-muted-foreground">{ui.review}</p>
      </div>
    </LearningAccordion>
  );
}
