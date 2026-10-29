import { normalizeText } from "./text";
export interface ReferenceAnswerPolicy {
  readonly allowOptionalFinalPeriod?: boolean;
}

/** Case and punctuation can be the skill being tested; never fold them away. */
export function normalizeReferenceAnswer(value: string): string {
  return normalizeText(value);
}

export function matchesReferenceAnswer(
  value: string,
  expected: string,
  policy: ReferenceAnswerPolicy = {},
): boolean {
  const normalize = (text: string) => {
    return normalizeText(text, policy);
  };
  const actual = normalize(value);
  return actual.length > 0 && actual === normalize(expected);
}
