import {
  CEFR_LEVELS,
  type CefrLevel,
  type PlacementMode,
} from "@grammar/domain";

export type LanguageId = "english" | "german";

export interface EvidenceScores {
  readonly listening: number | null;
  readonly reading: number | null;
  readonly spoken_interaction: number | null;
  readonly spoken_production: number | null;
  readonly writing: number | null;
  readonly grammar: number | null;
  readonly vocabulary: number | null;
  readonly pronunciation: number | null;
  readonly fluency: number | null;
}

export interface DailyEvidence {
  readonly date: string;
  readonly practiceCount: number;
  readonly speakingSamples: number;
  readonly writingSamples: number;
  readonly spontaneousSamples: number;
  readonly delayedReviews: number;
  readonly averageScore: number | null;
}

export interface EvidenceSummary {
  readonly speakingSamples: number;
  readonly writingSamples: number;
  readonly spontaneousSamples: number;
  readonly delayedReviews: number;
  readonly criticalErrorCount: number;
  readonly dailyActivity: readonly DailyEvidence[];
  readonly scores: EvidenceScores;
}

export interface LanguageTrack {
  readonly language: LanguageId;
  readonly selfDeclaredLevel: CefrLevel | null;
  readonly verifiedLevel: CefrLevel | null;
  readonly placementMode: PlacementMode;
  readonly placementCheckedAt: string | null;
  readonly evidence: EvidenceSummary;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
}

export interface LearnerProfile {
  readonly schemaVersion: 1;
  readonly profileId: string;
  readonly displayName: string;
  readonly avatarDataUrl: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly privacy: {
    readonly shareAcrossApps: boolean;
    readonly allowOnlineAI: boolean;
    readonly storeAudio: boolean;
    readonly includeEvidenceInExport: boolean;
  };
  readonly languages: Readonly<Record<LanguageId, LanguageTrack>>;
}

export interface LearnerProfileUpdate {
  readonly displayName?: string;
  readonly avatarDataUrl?: string;
  readonly privacy?: Partial<LearnerProfile["privacy"]>;
  readonly language?: LanguageId;
  readonly track?: Partial<LanguageTrack>;
}

interface LearnerProfileBridge {
  readonly read: () => Promise<unknown>;
  readonly merge: (update: LearnerProfileUpdate) => Promise<unknown>;
  readonly replace: (profile: unknown) => Promise<unknown>;
  readonly export: () => Promise<unknown>;
}

declare global {
  interface Window {
    learnerProfile?: LearnerProfileBridge;
  }
}

const PROFILE_STORAGE_KEY = "study-suite:learner-profile:v1";
const cefrLevels = new Set<string>(CEFR_LEVELS);
const placementModes = new Set<string>(["not_set", "manual", "optional_test"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeScore(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(Math.min(100, Math.max(0, value)))
    : null;
}

function normalizeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(100_000, Math.max(0, Math.floor(value)))
    : 0;
}

function normalizeTimestamp(
  value: unknown,
  fallback: string | null,
): string | null {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    return fallback;
  }
  return new Date(value).toISOString();
}

function normalizeAvatarDataUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const candidate = value.trim();
  if (
    candidate.length > 350_000 ||
    !/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/]+={0,2}$/i.test(candidate)
  ) {
    return "";
  }
  return candidate;
}

export function emptyEvidenceSummary(): EvidenceSummary {
  return {
    speakingSamples: 0,
    writingSamples: 0,
    spontaneousSamples: 0,
    delayedReviews: 0,
    criticalErrorCount: 0,
    dailyActivity: [],
    scores: {
      listening: null,
      reading: null,
      spoken_interaction: null,
      spoken_production: null,
      writing: null,
      grammar: null,
      vocabulary: null,
      pronunciation: null,
      fluency: null,
    },
  };
}

function normalizeEvidence(value: unknown): EvidenceSummary {
  const source = isRecord(value) ? value : {};
  const scores = isRecord(source.scores) ? source.scores : {};
  return {
    speakingSamples: normalizeCount(source.speakingSamples),
    writingSamples: normalizeCount(source.writingSamples),
    spontaneousSamples: normalizeCount(source.spontaneousSamples),
    delayedReviews: normalizeCount(source.delayedReviews),
    criticalErrorCount: normalizeCount(source.criticalErrorCount),
    dailyActivity: normalizeDailyActivity(source.dailyActivity),
    scores: {
      listening: normalizeScore(scores.listening),
      reading: normalizeScore(scores.reading),
      spoken_interaction: normalizeScore(scores.spoken_interaction),
      spoken_production: normalizeScore(scores.spoken_production),
      writing: normalizeScore(scores.writing),
      grammar: normalizeScore(scores.grammar),
      vocabulary: normalizeScore(scores.vocabulary),
      pronunciation: normalizeScore(scores.pronunciation),
      fluency: normalizeScore(scores.fluency),
    },
  };
}

function normalizeDailyActivity(value: unknown): readonly DailyEvidence[] {
  if (!Array.isArray(value)) return [];
  const rows = new Map<string, DailyEvidence>();
  for (const candidate of value) {
    if (!isRecord(candidate)) continue;
    const date =
      typeof candidate.date === "string" ? candidate.date.slice(0, 10) : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    rows.set(date, {
      date,
      practiceCount: normalizeCount(candidate.practiceCount),
      speakingSamples: normalizeCount(candidate.speakingSamples),
      writingSamples: normalizeCount(candidate.writingSamples),
      spontaneousSamples: normalizeCount(candidate.spontaneousSamples),
      delayedReviews: normalizeCount(candidate.delayedReviews),
      averageScore: normalizeScore(candidate.averageScore),
    });
  }
  return [...rows.values()]
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-90);
}

function normalizeTrack(value: unknown, language: LanguageId): LanguageTrack {
  const source = isRecord(value) ? value : {};
  const selfDeclaredLevel = cefrLevels.has(String(source.selfDeclaredLevel))
    ? (source.selfDeclaredLevel as CefrLevel)
    : null;
  return {
    language,
    selfDeclaredLevel,
    verifiedLevel: cefrLevels.has(String(source.verifiedLevel))
      ? (source.verifiedLevel as CefrLevel)
      : null,
    placementMode: placementModes.has(String(source.placementMode))
      ? (source.placementMode as PlacementMode)
      : selfDeclaredLevel
        ? "manual"
        : "not_set",
    placementCheckedAt: normalizeTimestamp(source.placementCheckedAt, null),
    evidence: normalizeEvidence(source.evidence),
    updatedAt: normalizeTimestamp(source.updatedAt, null),
    updatedBy:
      typeof source.updatedBy === "string"
        ? source.updatedBy.trim().slice(0, 80) || null
        : null,
  };
}

export function createLearnerProfile(): LearnerProfile {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    profileId: crypto.randomUUID(),
    displayName: "",
    avatarDataUrl: "",
    createdAt: now,
    updatedAt: now,
    privacy: {
      shareAcrossApps: true,
      allowOnlineAI: false,
      storeAudio: false,
      includeEvidenceInExport: true,
    },
    languages: {
      english: normalizeTrack(null, "english"),
      german: normalizeTrack(null, "german"),
    },
  };
}

export function normalizeLearnerProfile(value: unknown): LearnerProfile {
  const fallback = createLearnerProfile();
  if (!isRecord(value)) return fallback;
  const privacy = isRecord(value.privacy) ? value.privacy : {};
  const languages = isRecord(value.languages) ? value.languages : {};
  return {
    ...fallback,
    profileId:
      typeof value.profileId === "string" && value.profileId.trim()
        ? value.profileId.trim().slice(0, 128)
        : fallback.profileId,
    displayName:
      typeof value.displayName === "string"
        ? value.displayName.trim().slice(0, 120)
        : "",
    avatarDataUrl: normalizeAvatarDataUrl(value.avatarDataUrl),
    createdAt:
      normalizeTimestamp(value.createdAt, fallback.createdAt) ??
      fallback.createdAt,
    updatedAt:
      normalizeTimestamp(value.updatedAt, fallback.updatedAt) ??
      fallback.updatedAt,
    privacy: {
      shareAcrossApps:
        typeof privacy.shareAcrossApps === "boolean"
          ? privacy.shareAcrossApps
          : true,
      allowOnlineAI:
        typeof privacy.allowOnlineAI === "boolean"
          ? privacy.allowOnlineAI
          : false,
      storeAudio:
        typeof privacy.storeAudio === "boolean" ? privacy.storeAudio : false,
      includeEvidenceInExport:
        typeof privacy.includeEvidenceInExport === "boolean"
          ? privacy.includeEvidenceInExport
          : true,
    },
    languages: {
      english: normalizeTrack(languages.english, "english"),
      german: normalizeTrack(languages.german, "german"),
    },
  };
}

function mergeLocally(
  current: LearnerProfile,
  update: LearnerProfileUpdate,
): LearnerProfile {
  const now = new Date().toISOString();
  const language = update.language;
  const track =
    language && update.track
      ? normalizeTrack(
          {
            ...current.languages[language],
            ...update.track,
            updatedAt: now,
            updatedBy: "deutschflow-grammar",
          },
          language,
        )
      : null;
  return normalizeLearnerProfile({
    ...current,
    displayName:
      update.displayName === undefined
        ? current.displayName
        : update.displayName,
    avatarDataUrl:
      update.avatarDataUrl === undefined
        ? current.avatarDataUrl
        : update.avatarDataUrl,
    updatedAt: now,
    privacy: { ...current.privacy, ...update.privacy },
    languages: track
      ? { ...current.languages, [track.language]: track }
      : current.languages,
  });
}

export async function readLearnerProfile(): Promise<LearnerProfile> {
  if (window.learnerProfile) {
    return normalizeLearnerProfile(await window.learnerProfile.read());
  }
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) return normalizeLearnerProfile(JSON.parse(stored));
  } catch {
    // Malformed portable data never replaces the local learning state.
  }
  const profile = createLearnerProfile();
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  return profile;
}

export async function mergeLearnerProfile(
  update: LearnerProfileUpdate,
): Promise<LearnerProfile> {
  if (window.learnerProfile) {
    return normalizeLearnerProfile(await window.learnerProfile.merge(update));
  }
  const profile = mergeLocally(await readLearnerProfile(), update);
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  return profile;
}

export async function replaceLearnerProfile(
  value: unknown,
): Promise<LearnerProfile> {
  if (window.learnerProfile) {
    return normalizeLearnerProfile(await window.learnerProfile.replace(value));
  }
  const profile = normalizeLearnerProfile(value);
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  return profile;
}

export async function portableLearnerProfile(): Promise<LearnerProfile> {
  if (window.learnerProfile) {
    return normalizeLearnerProfile(await window.learnerProfile.export());
  }
  const profile = await readLearnerProfile();
  if (profile.privacy.includeEvidenceInExport) return profile;
  return {
    ...profile,
    languages: {
      english: {
        ...profile.languages.english,
        evidence: emptyEvidenceSummary(),
      },
      german: {
        ...profile.languages.german,
        evidence: emptyEvidenceSummary(),
      },
    },
  };
}
