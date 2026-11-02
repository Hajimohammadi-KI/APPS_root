export interface TextPolicy {
  readonly allowOptionalFinalPeriod?: boolean;
}
export { detectTextLanguage } from "./language";

/** Canonical comparison only. Case, accents, apostrophes and punctuation are
 * meaningful; a keyboard apostrophe and a typographic one are the same sign. */
export function normalizeText(value: string, policy: TextPolicy = {}): string {
  const normalized = value
    .normalize("NFC")
    .trim()
    .replace(/\s+/gu, " ")
    .replace(/[’‘ʼ]/gu, "'");
  return policy.allowOptionalFinalPeriod
    ? normalized.replace(/(?<![.!?])\.$/u, "")
    : normalized;
}

/** What an answer puts into the single gap (a trailing bracket cue aside), or
 * null when the answer does not fit the words next to it. The answer may
 * begin inside the instruction ("Complete: British English: We met ___.")
 * and the sentence may be followed by one ("… Write the full sentence."). */
export function gapFill(prompt: string, answer: string): string | null {
  const parts = prompt.replace(/\s*\([^()]+\)\s*$/u, "").split(/_{2,}/u);
  if (parts.length !== 2) return null;
  const spaced = (text: string) =>
    text.normalize("NFC").replace(/\s+/gu, " ").replace(/[’‘ʼ]/gu, "'");
  const before = spaced(parts[0]!),
    after = spaced(parts[1]!);
  const key = normalizeText(answer);
  const letter = /\p{L}/u;
  const glued = (a = "", b = "") => letter.test(a) && letter.test(b);
  let pre = "";
  for (let at = 0; at < before.length && !pre; at++) {
    const text = before.slice(at).trimEnd();
    if ((at === 0 || before[at - 1] === " ") && text && key.startsWith(text))
      if (!glued(text.at(-1), key[text.length])) pre = text;
  }
  let post = "";
  for (let end = after.length; end > 0 && !post; end--) {
    const text = after.slice(0, end).trimStart();
    if ((end === after.length || after[end] === " ") && text)
      if (
        key.endsWith(text) &&
        key.length - text.length >= pre.length &&
        !glued(text[0], key[key.length - text.length - 1])
      )
        post = text;
  }
  // A word of the sentence next to the gap must belong to the answer; a word
  // ending in a colon closes the instruction.
  const last = before.trimEnd().split(" ").at(-1) ?? "",
    next = after.trimStart().split(" ")[0] ?? "";
  if (
    (letter.test(last) && !last.endsWith(":") && !pre) ||
    (letter.test(next) && !post)
  )
    return null;
  return key.slice(pre.length, key.length - post.length).trim();
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
    source.matchAll(
      /[\p{L}\p{N}][\p{L}\p{N}\p{M}]*(?:['’\-][\p{L}\p{N}][\p{L}\p{N}\p{M}]*)*|\p{P}/gu,
    ),
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
  const words = (value: string) =>
    tokenizeText(value.replace(/[’‘]/gu, "'"))
      .filter((t) => t.kind === "word")
      .map((t) => t.normalized.toLocaleLowerCase());
  const haystack = words(source),
    needle = words(phrase);
  return (
    needle.length > 0 &&
    haystack.some((_, start) =>
      needle.every((word, offset) => haystack[start + offset] === word),
    )
  );
}
