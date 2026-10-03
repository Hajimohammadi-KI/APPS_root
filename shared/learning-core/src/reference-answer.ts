export interface ReferenceAnswerPolicy {
  readonly allowOptionalFinalPeriod?: boolean;
}

/** Case and punctuation can be the skill being tested; never fold them away. */
export function normalizeReferenceAnswer(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/gu, " ");
}

export function matchesReferenceAnswer(
  value: string,
  expected: string,
  policy: ReferenceAnswerPolicy = {},
): boolean {
  const normalize = (text: string) => {
    const normalized = normalizeReferenceAnswer(text);
    return policy.allowOptionalFinalPeriod
      ? normalized.replace(/(?<![.!?])\.$/u, "")
      : normalized;
  };
  const actual = normalize(value);
  return actual.length > 0 && actual === normalize(expected);
}
