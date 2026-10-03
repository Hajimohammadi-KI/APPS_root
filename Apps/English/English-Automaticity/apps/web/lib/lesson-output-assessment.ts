import type { GrammarUnit } from "@grammar/content";
import type { Settings } from "@/features/store/app-store";
import { evaluateResponse } from "@/lib/assessment";
import {
  analyzePresentPerfect,
  type AutomaticityAnalysis,
} from "@/lib/automaticity-analysis";

export interface LessonOutputAssessment extends AutomaticityAnalysis {
  verified: boolean;
  masteryEligible: boolean;
  corrected: string;
}

/** Local pattern practice cannot replace a valid language assessment. */
export async function assessLessonOutput(
  text: string,
  grammar: Pick<GrammarUnit, "title" | "rule" | "examples">,
  minimumSentences: number,
  settings: Settings,
): Promise<LessonOutputAssessment> {
  const evaluation = await evaluateResponse(
    text,
    {
      grammar,
      minWords: minimumSentences * 4,
      minSentences: minimumSentences,
      requiredTargetUses: 1,
      taskPrompt: `Use ${grammar.title} in original sentences connected to your life.`,
    },
    settings,
  );
  const local =
    grammar.title.toLocaleLowerCase("en") === "present perfect"
      ? analyzePresentPerfect(text)
      : null;
  const issues: AutomaticityAnalysis["issues"] = [
    ...(local?.issues ?? []),
    ...evaluation.matches.map((match) => ({
      code: "language_error" as const,
      message: match.message,
      original: match.context?.text ?? evaluation.original,
      corrected: match.replacements[0]?.value ?? evaluation.corrected,
    })),
  ];
  if (
    evaluation.targetUses < evaluation.required &&
    !issues.some((issue) => issue.code === "missing_target")
  ) {
    issues.push({
      code: "missing_target",
      message: `Use the lesson pattern from ${grammar.title} at least once.`,
      original: text,
      corrected: grammar.examples[0] ?? "",
    });
  }
  if (!evaluation.complete) {
    issues.push({
      code: "unfinished_sentence",
      message: `Write at least ${minimumSentences} complete sentences.`,
      original: text,
      corrected: grammar.examples.join(" "),
    });
  }
  const targetHit = evaluation.pass && (local?.targetHit ?? true);
  return {
    sentenceCount: evaluation.sentences,
    wordCount: evaluation.words,
    targetUses: local?.targetUses ?? evaluation.targetUses,
    score: Math.min(evaluation.accuracyScore, local?.score ?? 100),
    targetHit,
    issues,
    verified: evaluation.online,
    masteryEligible: evaluation.masteryEligible && targetHit,
    corrected: evaluation.corrected,
  };
}
