const advancedCues = {
  en: {
    connectors: [
      "however",
      "nevertheless",
      "furthermore",
      "whereas",
      "consequently",
    ],
    hedges: [
      "arguably",
      "possibly",
      "to some extent",
      "it appears that",
      "tends to",
    ],
    suggestion:
      "For contrast: nevertheless. For a cautious claim: to some extent. Choose according to meaning; these are optional.",
  },
  de: {
    connectors: [
      "allerdings",
      "dennoch",
      "darüber hinaus",
      "wohingegen",
      "folglich",
    ],
    hedges: [
      "möglicherweise",
      "es scheint",
      "tendenziell",
      "bis zu einem gewissen Grad",
    ],
    suggestion:
      "Für einen Gegensatz: dennoch. Für eine vorsichtige Behauptung: möglicherweise. Wähle nach der Bedeutung; dies ist freiwillig.",
  },
};
interface DiscourseSpan {
  readonly text: string;
  readonly start: number;
  readonly end: number;
}
export function discourseFeedback(
  text: string,
  language: "en" | "de",
  level: string,
) {
  const collect = (pattern: RegExp): DiscourseSpan[] =>
    Array.from(text.slice(0, 20000).matchAll(pattern), (m) => ({
      text: m[0],
      start: m.index,
      end: m.index + m[0].length,
    }));
  const claimCues = collect(
    language === "en"
      ? /\b(?:I think|in my view|should|I believe)\b/giu
      : /\b(?:ich denke|meiner Meinung nach|sollten?|ich glaube)\b/giu,
  );
  const reasonCues = collect(
    language === "en"
      ? /\b(?:because|for this reason)\b/giu
      : /\b(?:weil|denn|aus diesem Grund)\b/giu,
  );
  const cues = advancedCues[language];
  const find = (list: readonly string[]) =>
    collect(
      new RegExp(
        "(?<![\\p{L}\\p{M}])(?:" + list.join("|") + ")(?![\\p{L}\\p{M}])",
        "giu",
      ),
    );
  const advanced = ["C1", "C2"].includes(level)
    ? {
        connectors: find(cues.connectors),
        hedges: find(cues.hedges),
        suggestion: cues.suggestion,
      }
    : null;
  return {
    claimCues,
    reasonCues,
    score: null,
    level,
    advanced,
    description:
      language === "en"
        ? `Structure observations: ${claimCues.length} opinion/claim cues and ${reasonCues.length} reason cues. These counts do not assess logic, truth or argument quality.`
        : `Strukturbeobachtungen: ${claimCues.length} Meinungs-/Behauptungssignale und ${reasonCues.length} Begründungssignale. Diese Zahlen bewerten weder Logik noch Wahrheit oder Argumentationsqualität.`,
  } as const;
}
