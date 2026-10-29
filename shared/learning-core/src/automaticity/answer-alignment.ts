import { tokenizeText } from "../text";

export interface AnswerEdit {
  readonly type: "missing" | "extra" | "replace" | "order";
  readonly start: number;
  readonly end: number;
  readonly original: string;
  readonly expected: string;
}

/** Descriptive edit alignment to a reference, never a correctness decision. */
export function alignAnswers(actual: string, expected: string): AnswerEdit[] {
  const a = tokenizeText(actual),
    b = tokenizeText(expected);
  if (a.length > 200 || b.length > 200) return [];
  const av = a.map((t) => t.normalized),
    bv = b.map((t) => t.normalized);
  if (av.join("\0") === bv.join("\0")) return [];
  if (
    av.length === bv.length &&
    [...av].sort().join("\0") === [...bv].sort().join("\0")
  )
    return [
      {
        type: "order",
        start: 0,
        end: actual.length,
        original: actual,
        expected,
      },
    ];
  const d = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) d[i]![0] = i;
  for (let j = 0; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i]![j] = Math.min(
        d[i - 1]![j]! + 1,
        d[i]![j - 1]! + 1,
        d[i - 1]![j - 1]! + (av[i - 1] === bv[j - 1] ? 0 : 1),
      );
  const edits: AnswerEdit[] = [];
  let i = a.length,
    j = b.length;
  while (i || j) {
    if (i && j && av[i - 1] === bv[j - 1]) {
      i--;
      j--;
      continue;
    }
    if (i && j && d[i]![j] === d[i - 1]![j - 1]! + 1) {
      const token = a[--i]!;
      edits.push({
        type: "replace",
        start: token.start,
        end: token.end,
        original: token.text,
        expected: b[--j]!.text,
      });
    } else if (i && d[i]![j] === d[i - 1]![j]! + 1) {
      const token = a[--i]!;
      edits.push({
        type: "extra",
        start: token.start,
        end: token.end,
        original: token.text,
        expected: "",
      });
    } else {
      const position = a[i]?.start ?? actual.length;
      edits.push({
        type: "missing",
        start: position,
        end: position,
        original: "",
        expected: b[--j]!.text,
      });
    }
  }
  return edits.reverse();
}

export function describeAnswerEdits(
  edits: readonly AnswerEdit[],
  language: "en" | "de",
): string {
  return edits
    .slice(0, 8)
    .map((e) =>
      language === "en"
        ? e.type === "missing"
          ? `Reference adds “${e.expected}”.`
          : e.type === "extra"
            ? `Reference omits “${e.original}”.`
            : e.type === "order"
              ? `Reference order: “${e.expected}”.`
              : `Reference uses “${e.expected}” instead of “${e.original}”.`
        : e.type === "missing"
          ? `Die Vorlage ergänzt „${e.expected}“.`
          : e.type === "extra"
            ? `Die Vorlage enthält „${e.original}“ nicht.`
            : e.type === "order"
              ? `Reihenfolge der Vorlage: „${e.expected}“.`
              : `Die Vorlage verwendet „${e.expected}“ statt „${e.original}“.`,
    )
    .join(" ");
}
