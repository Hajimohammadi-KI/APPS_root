/** OpenSLR 101: parentheses and square brackets mark errors; braces indicate
 * correct but accented phones. At least three independent raters must flag an
 * error; disagreement is not silently converted to a correct label. */
export function speechOceanConsensus(
  value: unknown,
): "correct" | "error" | null {
  if (
    !value ||
    typeof value !== "object" ||
    !("words" in value) ||
    !Array.isArray(value.words) ||
    !value.words.length
  )
    return null;
  const flagged = [false, false, false, false, false];
  for (const word of value.words) {
    if (
      !word ||
      typeof word !== "object" ||
      !Array.isArray(word.phones) ||
      word.phones.length !== 5 ||
      word.phones.some((p: unknown) => typeof p !== "string" || !p.trim())
    )
      return null;
    for (let i = 0; i < 5; i++) flagged[i] ||= /[\(\[]/u.test(word.phones[i]);
  }
  const votes = flagged.filter(Boolean).length;
  return votes === 0 ? "correct" : votes >= 3 ? "error" : null;
}
/** Choose from corpus order using speaker and utterance IDs alone, before labels. */
export function selectSpeakerCandidates<
  T extends { readonly sampleId: string; readonly speakerId: string },
>(records: readonly T[], limit = 3): T[] {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 20)
    throw Error("Invalid per-speaker limit");
  const counts = new Map<string, number>(),
    seen = new Set<string>(),
    selected: T[] = [];
  for (const record of records) {
    if (!record.sampleId || !record.speakerId || seen.has(record.sampleId))
      throw Error("Invalid or duplicate corpus ID");
    seen.add(record.sampleId);
    const count = counts.get(record.speakerId) ?? 0;
    if (count < limit) {
      selected.push(record);
      counts.set(record.speakerId, count + 1);
    }
  }
  return selected;
}
function normalizePhones(tokens: readonly string[]): string[] {
  return tokens
    .map((s) =>
      s
        .normalize("NFC")
        .replace(/[ˈˌ\s]/gu, "")
        .replace(/ɹ/gu, "r")
        .replace(/ɡ/gu, "g"),
    )
    .filter(Boolean);
}
/** Normalized edit distance between phone sequences. Not an error probability
 * and not proof that the learner pronounced any sound incorrectly. */
export function phoneDisagreement(
  reference: readonly string[],
  recognized: readonly string[],
): number | null {
  if (reference.length > 200 || recognized.length > 300) return null;
  const a = normalizePhones(reference),
    b = normalizePhones(recognized);
  if (!a.length) return null;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++)
      next.push(
        Math.min(
          previous[j + 1]! + 1,
          next[j]! + 1,
          previous[j]! + Number(a[i] !== b[j]),
        ),
      );
    previous = next;
  }
  return Math.min(1, previous[b.length]! / a.length);
}
