export type BoosterPromptType =
  | "picture-description"
  | "situation-reaction"
  | "continuation"
  | "transformation"
  | "mini-argument";

export type BoosterInputMode = "speaking" | "typing";

export interface BoosterFeatureFlags {
  readonly booster_mode?: boolean;
}

export interface BoosterRound {
  readonly id: string;
  readonly promptType: BoosterPromptType;
  readonly prompt: string;
  readonly durationSeconds: number;
  readonly requiredProductions: number;
  readonly requiredStructureUses: number;
}

export interface BoosterPlanV1 {
  readonly version: 1;
  readonly id: string;
  readonly language: "en" | "de";
  readonly targetStructureId: string;
  readonly targetStructureLabel: string;
  readonly sessionMinutes: 15 | 30 | 45;
  readonly sourceBlock: "automatization";
  readonly allocatedAutomatizationMinutes: number;
  readonly rounds: readonly BoosterRound[];
  readonly learningOutcome: "not-evaluated";
}

export interface BoosterAttemptInput {
  readonly attemptId: string;
  readonly planId: string;
  readonly round: BoosterRound;
  readonly targetStructureId: string;
  readonly inputMode: BoosterInputMode;
  readonly status: "completed" | "abandoned";
  readonly startedAt: Date | string;
  readonly firstProductionAt: Date | string | null;
  readonly completedAt: Date | string;
  readonly responseText: string;
  readonly audioBytes: number;
  readonly validatedStructureUses: number;
  readonly productionCount: number;
  readonly selfRepairCount?: number;
}

export interface BoosterAttemptMetrics {
  readonly structureUseScore: number;
  readonly productionCountScore: number;
  readonly latencyScore: number;
  readonly fluencyScore: number;
  readonly firstProductionLatencyMs: number;
  readonly wordsPerMinute: number;
  readonly wordCount: number;
  readonly validatedStructureUses: number;
  readonly productionCount: number;
  readonly selfRepairCount: number;
  readonly composite: number;
}

export interface BoosterAttemptResultV1 {
  readonly version: 1;
  readonly attemptId: string;
  readonly planId: string;
  readonly roundId: string;
  readonly targetStructureId: string;
  readonly inputMode: BoosterInputMode;
  readonly status: "practice-evidence" | "no-evidence";
  readonly occurredAt: string;
  readonly audioCaptured: boolean;
  readonly speakingEvidence: boolean;
  readonly typingFallback: boolean;
  readonly metrics: BoosterAttemptMetrics | null;
  readonly masteryEligible: false;
  readonly automaticityClaim: "insufficient-longitudinal-evidence";
  readonly learningOutcome: "not-evaluated";
}

export interface BoosterKeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface BoosterCopy {
  readonly direction: "ltr";
  readonly eyebrow: string;
  readonly title: string;
  readonly purpose: string;
  readonly round: string;
  readonly of: string;
  readonly seconds: string;
  readonly speak: string;
  readonly typeInstead: string;
  readonly startRecording: string;
  readonly stopRecording: string;
  readonly recordingReady: string;
  readonly microphoneUnavailable: string;
  readonly responseLabel: string;
  readonly responsePlaceholder: string;
  readonly submit: string;
  readonly next: string;
  readonly finish: string;
  readonly saved: string;
  readonly notSaved: string;
  readonly noEvidence: string;
  readonly practiceOnly: string;
  readonly metrics: {
    readonly structure: string;
    readonly productions: string;
    readonly latency: string;
    readonly wordsPerMinute: string;
  };
  readonly prompts: Readonly<Record<BoosterPromptType, string>>;
}
