"use client";

import * as React from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LearningAccordion } from "@/features/components/learning-accordion";
import {
  readAIProviderStatus,
  requestAIExplanation,
} from "@/lib/desktop-ai";

export function AIExplanation({
  topic,
  content,
  learnerInput,
  offlineExplanation,
  allowOnline,
  language = "English",
}: {
  topic: string;
  content: string;
  learnerInput?: string;
  offlineExplanation: string;
  allowOnline: boolean;
  language?: string;
}) {
  const [answer, setAnswer] = React.useState("");
  const [source, setSource] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const answerSections = answer
    .split(/\n\s*\n/u)
    .map((section) => section.trim())
    .filter(Boolean);
  const sectionTitles = [
    "Simple rule",
    "Pattern to notice",
    "Common mistake",
    "Quick check",
  ];
  const sectionTones = ["blue", "emerald", "rose", "amber"] as const;
  const answerGroup = `ai-explanation-${topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")}`;

  async function explain() {
    setBusy(true);
    try {
      const status = await readAIProviderStatus();
      if (allowOnline && status.connected) {
        const result = await requestAIExplanation({
          topic,
          content,
          learnerInput,
          language,
        });
        setAnswer(result.text);
        setSource(`${result.providerLabel} · ${result.model}`);
      } else {
        setAnswer(offlineExplanation);
        setSource(
          status.connected && !allowOnline
            ? "Offline explanation · online AI is disabled by privacy settings"
            : "Offline explanation · no AI account required",
        );
      }
    } catch (error) {
      setAnswer(offlineExplanation);
      setSource(
        `${
          error instanceof Error ? error.message : "Online AI was unavailable."
        } Showing the offline explanation.`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <LearningAccordion
      eyebrow="Optional support"
      icon={Sparkles}
      summary="Offline first; connected AI is used only when you allow it."
      title="Need a clearer explanation?"
      tone="violet"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Open only the part you need. The first explanation works without an
          AI account.
        </p>
        <Button disabled={busy} onClick={explain} size="sm" variant="outline">
          {busy ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
          ) : (
            <Sparkles aria-hidden className="size-4" />
          )}
          Explain more
        </Button>
      </div>
      {answer ? (
        <div className="mt-4 space-y-2">
          {answerSections.map((section, index) => (
            <LearningAccordion
              defaultOpen={index === 0}
              group={answerGroup}
              key={`${section.slice(0, 40)}-${index}`}
              summary={`Part ${index + 1} of ${answerSections.length}`}
              title={sectionTitles[index] ?? `Explanation step ${index + 1}`}
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
