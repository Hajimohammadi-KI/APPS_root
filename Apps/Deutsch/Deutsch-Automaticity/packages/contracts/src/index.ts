import { z } from "zod";

export const apiVersion = "v1" as const;

export const cefrLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("grammar-api"),
  version: z.string().min(1),
  timestamp: z.iso.datetime(),
});

export const bootstrapResponseSchema = z.object({
  apiVersion: z.literal(apiVersion),
  product: z.object({
    name: z.string().min(1),
    locale: z.literal("de"),
  }),
  content: z.object({
    topics: z.number().int().nonnegative(),
    grammarUnits: z.number().int().nonnegative(),
    levels: z.array(cefrLevelSchema),
  }),
  learning: z.object({
    dailySteps: z.array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        minutes: z.number().int().positive(),
      }),
    ),
    reviewIntervalsDays: z.array(z.number().int().positive()),
  }),
  capabilities: z.object({
    persistence: z.literal("local-first"),
    sync: z.literal("planned"),
    languageFeedback: z.literal("external"),
  }),
});

export const evaluationKindSchema = z.enum([
  "conversation",
  "free",
  "recall",
  "review",
  "sentences",
  "why",
]);

export const feedbackStatusSchema = z.enum([
  "correct",
  "nearly_correct",
  "wrong_language",
  "language_uncertain",
  "incomplete",
  "needs_revision",
]);

export const feedbackCategorySchema = z.enum([
  "wrong_output_language",
  "missing_word",
  "wrong_article",
  "wrong_case",
  "wrong_noun_ending",
  "wrong_plural_form",
  "wrong_verb_conjugation",
  "wrong_tense",
  "wrong_word_order",
  "wrong_preposition",
  "wrong_adjective_ending",
  "incomplete_sentence",
  "spelling_or_typo",
  "vocabulary_or_meaning",
  "register_or_style",
]);

export const grammarTargetSchema = z.object({
  title: z.string().min(1).max(300),
  rule: z.string().min(1).max(5_000),
  examples: z.array(z.string().max(2_000)).max(20),
});

export const evaluationRequestSchema = z.object({
  text: z.string().trim().min(1).max(10_000),
  grammar: grammarTargetSchema,
  kind: evaluationKindSchema,
  taskPrompt: z.string().trim().max(2_000).optional(),
});

export const languageToolMatchSchema = z.object({
  offset: z.number().int().nonnegative(),
  length: z.number().int().nonnegative(),
  message: z.string().optional(),
  context: z
    .object({
      text: z.string().optional(),
    })
    .optional(),
  replacements: z
    .array(
      z.object({
        value: z.string().optional(),
      }),
    )
    .optional(),
  rule: z
    .object({
      issueType: z.string().optional(),
    })
    .optional(),
});

export const evaluationIssueSchema = z.object({
  type: z.string(),
  message: z.string(),
  context: z.string().optional(),
  suggestion: z.string().optional(),
  errorClass: z.enum([
    "word_order",
    "case",
    "article",
    "auxiliary",
    "ending",
    "tense",
    "agreement",
    "spelling",
    "target_grammar",
    "other",
  ]),
  severity: z.enum(["minor", "major", "critical"]),
  category: feedbackCategorySchema.optional(),
  userText: z.string().optional(),
  correctedText: z.string().optional(),
  explanation: z.string().optional(),
  hint: z.string().optional(),
});

export const evaluationResponseSchema = z
  .object({
    original: z.string(),
    corrected: z.string(),
    changed: z.boolean(),
    matches: z.array(languageToolMatchSchema),
    online: z.boolean(),
    networkError: z.string().optional(),
    issues: z.array(evaluationIssueSchema),
    practiceReady: z.boolean(),
    verified: z.boolean(),
    ok: z.boolean(),
    targetHit: z.boolean(),
    relevant: z.boolean(),
    accuracyScore: z.number().min(0).max(100).nullable(),
    nextAction: z.enum(["repeat", "repair", "transfer", "schedule_review"]),
    status: feedbackStatusSchema.optional(),
    answerLanguage: z.enum(["de", "fa", "en", "other"]).optional(),
    correctParts: z.array(z.string()).optional(),
    nextActionText: z.string().optional(),
  })
  .superRefine((report, context) => {
    if (report.accuracyScore === null && (report.verified || report.ok)) {
      context.addIssue({
        code: "custom",
        path: ["accuracyScore"],
        message: "Unassessed answers cannot be verified or successful.",
      });
    }
    if (
      report.status === "language_uncertain" &&
      report.accuracyScore !== null
    ) {
      context.addIssue({
        code: "custom",
        path: ["accuracyScore"],
        message: "Uncertain language has no grammar accuracy score.",
      });
    }
  });

export type CefrLevel = z.infer<typeof cefrLevelSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type BootstrapResponse = z.infer<typeof bootstrapResponseSchema>;
export type EvaluationKind = z.infer<typeof evaluationKindSchema>;
export type FeedbackStatus = z.infer<typeof feedbackStatusSchema>;
export type FeedbackCategory = z.infer<typeof feedbackCategorySchema>;
export type GrammarTarget = z.infer<typeof grammarTargetSchema>;
export type EvaluationRequest = z.infer<typeof evaluationRequestSchema>;
export type EvaluationResponse = z.infer<typeof evaluationResponseSchema>;
