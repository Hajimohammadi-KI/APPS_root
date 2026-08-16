export type SpeakingEvidenceBlock =
  "missing-audio" | "too-short" | "incomplete-shadowing" | null;

export function speakingEvidenceBlock({
  audioSize,
  seconds,
  requiredSeconds,
  shadowingComplete,
}: Readonly<{
  audioSize: number;
  seconds: number;
  requiredSeconds: number;
  shadowingComplete: boolean;
}>): SpeakingEvidenceBlock {
  if (audioSize <= 0) return "missing-audio";
  if (seconds < requiredSeconds) return "too-short";
  if (!shadowingComplete) return "incomplete-shadowing";
  return null;
}
