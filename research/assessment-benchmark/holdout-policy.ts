import { resolve } from "node:path";
import { hash } from "./core";

export function developmentCandidateReady(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const report = value as { split?: string; count?: number; languages?: Record<string, { candidate?: { errors: number; clean: number; falseAccept: number; trueAccept: number; detectedErrors: number } }> };
  return report.split === "development" && report.count === 128 && ["en", "de"].every(language => {
    const c = report.languages?.[language]?.candidate;
    return c && c.errors === 32 && c.clean === 32 && c.falseAccept === 0 && Number.isInteger(c.trueAccept) && c.trueAccept >= 29 && c.trueAccept <= 32 && Number.isInteger(c.detectedErrors) && c.detectedErrors >= 29 && c.detectedErrors <= 32;
  });
}
export async function verifyDevelopmentSelection(dataDir: string, candidateFingerprint: string, developmentSha256: string) {
  const selected = await Bun.file(resolve(dataDir, "selected-candidate.json")).json();
  if (selected.candidateFingerprint !== candidateFingerprint || typeof selected.developmentRun !== "string" || !/^writing-(context|qwen35(?:-evidence)?)-development-(direct|thinking)-v\d+$/.test(selected.developmentRun) || !/^[a-f0-9]{64}$/.test(selected.developmentReportSha256)) throw Error("Candidate not selected on pinned development evidence");
  const bytes = await Bun.file(resolve(import.meta.dir, "runs", selected.developmentRun, "public-report.json")).text(), report = JSON.parse(bytes);
  if (hash(bytes) !== selected.developmentReportSha256 || report.candidateFingerprint !== candidateFingerprint || report.selectionSha256 !== developmentSha256 || !developmentCandidateReady(report)) throw Error("Development evidence does not meet the frozen selection rule");
}
