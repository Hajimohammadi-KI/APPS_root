import { z } from "zod";

export const assessmentRequestSchema = z.object({
  // Preserve the source exactly: provider offsets must address the learner's text.
  text: z
    .string()
    .min(1)
    .max(20_000)
    .refine((text) => text.trim().length > 0),
  language: z.enum(["en-US", "en-GB"]).default("en-US"),
});

export type AssessmentRequest = z.infer<typeof assessmentRequestSchema>;

export interface LanguageToolMatch {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements: Array<{ value: string }>;
  context?: {
    text: string;
    offset: number;
    length: number;
  };
  rule?: {
    id: string;
    category?: { id?: string; name?: string };
  };
}

export interface AssessmentResponse {
  original: string;
  corrected: string;
  changed: boolean;
  online: true;
  matches: LanguageToolMatch[];
}

const positionSchema = z.number().int().nonnegative();
const contextSchema = z
  .object({
    text: z.string(),
    offset: positionSchema,
    length: positionSchema,
  })
  .refine(
    (context) =>
      context.offset <= context.text.length &&
      context.length <= context.text.length - context.offset,
    "Invalid context span",
  );

const languageToolResponseSchema = z.object({
  matches: z.array(
    z.object({
      message: z.string(),
      shortMessage: z.string().optional(),
      offset: positionSchema,
      length: positionSchema,
      // LanguageTool permits a suggestion object without a value. It is not an edit.
      replacements: z
        .array(z.object({ value: z.string().optional() }))
        .transform((items) =>
          items.flatMap((item) =>
            item.value === undefined ? [] : [{ value: item.value }],
          ),
        ),
      context: contextSchema.optional(),
      rule: z
        .object({
          id: z.string(),
          category: z
            .object({ id: z.string().optional(), name: z.string().optional() })
            .optional(),
        })
        .optional(),
    }),
  ),
});

/** Validate offsets against the exact submitted UTF-16 string before editing. */
export function parseLanguageToolResponse(
  payload: unknown,
  text: string,
): LanguageToolMatch[] {
  const { matches } = languageToolResponseSchema.parse(payload);
  for (const match of matches) {
    if (
      match.offset > text.length ||
      match.length > text.length - match.offset
    ) {
      throw new Error("Invalid assessment source span");
    }
  }
  // Diagnostic spans may overlap. Proposed automatic edits must be unambiguous.
  const edits = matches
    .filter((match) => match.replacements.length > 0)
    .toSorted((left, right) => left.offset - right.offset);
  let previous: LanguageToolMatch | undefined;
  for (const current of edits) {
    if (
      previous &&
      (current.offset === previous.offset ||
        current.offset < previous.offset + previous.length)
    ) {
      throw new Error("Overlapping assessment edits");
    }
    previous = current;
  }
  return matches;
}
