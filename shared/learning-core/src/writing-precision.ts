import { writingIssues } from "./writing-rules";
/** Zero false alerts on the supplied correct corpus is a necessary release gate,
 * not proof of general accuracy. Synthetic errors never belong in this input. */
export function assertWritingPrecision(correctSentences: readonly string[], language: "en" | "de"): void {
  if (!correctSentences.length) throw Error("A correct corpus is required");
  const failures = correctSentences.flatMap(text => writingIssues(text, language).map(issue => `${issue.ruleId}: ${text}`));
  if (failures.length) throw Error(`Writing precision gate failed:\n${failures.slice(0, 20).join("\n")}`);
}
