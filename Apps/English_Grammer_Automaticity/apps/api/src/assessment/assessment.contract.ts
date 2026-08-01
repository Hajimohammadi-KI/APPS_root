import { z } from "zod";

export const assessmentRequestSchema = z.object({
  text: z.string().trim().min(1).max(20_000),
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
