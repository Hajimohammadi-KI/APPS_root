"use client";

import { useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LearningAccordion } from "@/components/learning-accordion";
import { readAIProviderStatus, requestAIExplanation } from "@/lib/desktop-ai";

export function AIExplanation({
  topic,
  content,
  learnerInput,
  offlineExplanation,
  allowOnline,
}: Readonly<{
  topic: string;
  content: string;
  learnerInput?: string;
  offlineExplanation: string;
  allowOnline: boolean;
}>) {
  const [answer, setAnswer] = useState("");
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const answerSections = answer
    .split(/\n\s*\n/u)
    .map((section) => section.trim())
    .filter(Boolean);
  const sectionTitles = [
    "Einfach erklärt",
    "Muster erkennen",
    "Typischen Fehler vermeiden",
    "Kurzer Selbstcheck",
  ];
  const sectionTones = ["blue", "emerald", "rose", "amber"] as const;
  const answerGroup = `ki-erklaerung-${topic
    .toLocaleLowerCase("de")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")}`;

  async function explain() {
    setBusy(true);
    try {
      const status = await readAIProviderStatus();
      if (allowOnline && status.connected) {
        const result = await requestAIExplanation({
          topic,
          content,
          ...(learnerInput ? { learnerInput } : {}),
          language: "German",
        });
        setAnswer(result.text);
        setSource(`${result.providerLabel} · ${result.model}`);
      } else {
        setAnswer(offlineExplanation);
        setSource(
          status.connected && !allowOnline
            ? "Offline-Erklärung · Online-KI ist im Datenschutz ausgeschaltet"
            : "Offline-Erklärung · kein KI-Konto erforderlich",
        );
      }
    } catch (error) {
      setAnswer(offlineExplanation);
      setSource(
        `${
          error instanceof Error
            ? error.message
            : "Online-KI war nicht verfügbar."
        } Offline-Erklärung wird angezeigt.`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <LearningAccordion
      eyebrow="Freiwillige Hilfe"
      icon={Sparkles}
      summary="Zuerst offline; verbundene KI nur mit deiner Einwilligung."
      title="Brauchst du eine klarere Erklärung?"
      tone="violet"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Öffne nur den Teil, den du gerade brauchst. Die erste Erklärung
          funktioniert ohne KI-Konto.
        </p>
        <Button disabled={busy} onClick={explain} size="sm" variant="outline">
          {busy ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Sparkles aria-hidden="true" className="size-4" />
          )}
          Mehr erklären
        </Button>
      </div>
      {answer ? (
        <div className="mt-4 space-y-2">
          {answerSections.map((section, index) => (
            <LearningAccordion
              defaultOpen={index === 0}
              group={answerGroup}
              key={`${section.slice(0, 40)}-${index}`}
              summary={`Teil ${index + 1} von ${answerSections.length}`}
              title={sectionTitles[index] ?? `Erklärung ${index + 1}`}
              tone={sectionTones[index % sectionTones.length] ?? "blue"}
            >
              <p className="whitespace-pre-wrap text-sm leading-7">{section}</p>
            </LearningAccordion>
          ))}
          <p className="mt-3 text-xs text-muted-foreground">{source}</p>
        </div>
      ) : null}
    </LearningAccordion>
  );
}
