"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  emptyMastery,
  type TopicMastery,
} from "@/features/store/app-store";

const dimensions: Array<[keyof TopicMastery, string]> = [
  ["recognitionScore", "Recognize"],
  ["writingScore", "Writing"],
  ["speakingScore", "Speaking"],
  ["repairScore", "Repair"],
  ["transferScore", "Transfer"],
];

export function MasteryPanel({
  grammarTitle,
  mastery,
}: {
  grammarTitle: string;
  mastery?: TopicMastery;
}) {
  const value = mastery ?? emptyMastery(grammarTitle);
  const variant =
    value.status === "automatic"
      ? "success"
      : value.status === "stable"
        ? "default"
        : value.status === "usable"
          ? "warning"
          : "secondary";
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Current grammar status
          </p>
          <h3 className="mt-1 text-lg font-extrabold">{grammarTitle}</h3>
        </div>
        <Badge variant={variant}>{value.status}</Badge>
      </div>
      <div className="mastery-grid">
        {dimensions.map(([key, label]) => {
          const score = value[key] as number;
          return (
            <div className="mastery-row" key={key}>
              <span>{label}</span>
              <Progress aria-label={`${label} ${score}%`} value={score} />
              <output>{score}%</output>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="secondary">
          {value.successfulReviews}/2 delayed reviews
        </Badge>
        <Badge variant={value.activeErrorCount > 1 ? "destructive" : "secondary"}>
          {value.activeErrorCount} active errors
        </Badge>
      </div>
    </div>
  );
}
