export interface TextPolicy {
  readonly allowOptionalFinalPeriod?: boolean;
}
export { detectTextLanguage } from "./language";

/** Canonical comparison only. Case, accents, apostrophes and punctuation are meaningful. */
export function normalizeText(value: string, policy: TextPolicy = {}): string {
  const normalized = value.normalize("NFC").trim().replace(/\s+/gu, " ");
  return policy.allowOptionalFinalPeriod
    ? normalized.replace(/(?<![.!?])\.$/u, "")
    : normalized;
}

export interface TextToken {
  readonly text: string;
  readonly normalized: string;
  /** UTF-16 offsets into the untouched source, suitable for DOM spans. */
  readonly start: number;
  readonly end: number;
  readonly kind: "word" | "punctuation";
}

export function tokenizeText(source: string): TextToken[] {
  return Array.from(
    source.matchAll(/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*(?:['’\-][\p{L}\p{N}][\p{L}\p{N}\p{M}]*)*|\p{P}/gu),
    (match) => ({
      text: match[0],
      normalized: match[0].normalize("NFC"),
      start: match.index,
      end: match.index + match[0].length,
      kind: /^[\p{L}\p{N}]/u.test(match[0]) ? "word" : "punctuation",
    }),
  );
}

/** Speaking anchors ignore punctuation, but never match inside another word. */
export function containsTokenPhrase(source: string, phrase: string): boolean {
  const words = (value: string) => tokenizeText(value.replace(/[’‘]/gu, "'")).filter(t => t.kind === "word").map(t => t.normalized.toLocaleLowerCase());
  const haystack = words(source), needle = words(phrase);
  return needle.length > 0 && haystack.some((_, start) => needle.every((word, offset) => haystack[start + offset] === word));
}
