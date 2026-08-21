import type { CefrLevel } from "@grammar/content";

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type PlacementMode = "not_set" | "manual" | "optional_test";
export type LanguageId = "english" | "german";

export interface EvidenceScores {
  listening: number | null;
  reading: number | null;
  spoken_interaction: number | null;
  spoken_production: number | null;
  writing: number | null;
  grammar: number | null;
  vocabulary: number | null;
  pronunciation: number | null;
  fluency: number | null;
}

export interface DailyEvidence {
  date: string;
  practiceCount: number;
  speakingSamples: number;
  writingSamples: number;
  spontaneousSamples: number;
  delayedReviews: number;
  averageScore: number | null;
}

export interface EvidenceSummary {
  speakingSamples: number;
  writingSamples: number;
  spontaneousSamples: number;
  delayedReviews: number;
  criticalErrorCount: number;
  dailyActivity: DailyEvidence[];
  scores: EvidenceScores;
}

export interface LanguageTrack {
  language: LanguageId;
  selfDeclaredLevel: CefrLevel | null;
  verifiedLevel: CefrLevel | null;
  placementMode: PlacementMode;
  placementCheckedAt: string | null;
  evidence: EvidenceSummary;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface LearnerProfile {
  schemaVersion: 1;
  profileId: string;
  displayName: string;
  avatarDataUrl: string;
  createdAt: string;
  updatedAt: string;
  privacy: {
    shareAcrossApps: boolean;
    allowOnlineAI: boolean;
    storeAudio: boolean;
    includeEvidenceInExport: boolean;
  };
  languages: Record<LanguageId, LanguageTrack>;
}

export interface LearnerProfileUpdate {
  displayName?: string;
  avatarDataUrl?: string;
  privacy?: Partial<LearnerProfile["privacy"]>;
  language?: LanguageId;
  track?: Partial<LanguageTrack>;
}

interface LearnerProfileBridge {
  read: () => Promise<unknown>;
  merge: (update: LearnerProfileUpdate) => Promise<unknown>;
  replace: (profile: unknown) => Promise<unknown>;
  export: () => Promise<unknown>;
}

declare global {
  interface Window {
    learnerProfile?: LearnerProfileBridge;
  }
}

const PROFILE_STORAGE_KEY = "study-suite:learner-profile:v1";
const cefrLevels = new Set<string>(CEFR_LEVELS);
const placementModes = new Set<string>([
  "not_set",
  "manual",
  "optional_test",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function score(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(Math.min(100, Math.max(0, value)))
    : null;
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(100_000, Math.max(0, Math.floor(value)))
    : 0;
}

function timestamp(value: unknown, fallback: string | null): string | null {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    return fallback;
  }
  return new Date(value).toISOString();
}

function avatarDataUrl(value: unknown): string {
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
    speakingSamples: count(source.speakingSamples),
    writingSamples: count(source.writingSamples),
    spontaneousSamples: count(source.spontaneousSamples),
    delayedReviews: count(source.delayedReviews),
    criticalErrorCount: count(source.criticalErrorCount),
    dailyActivity: normalizeDailyActivity(source.dailyActivity),
    scores: {
      listening: score(scores.listening),
      reading: score(scores.reading),
      spoken_interaction: score(scores.spoken_interaction),
      spoken_production: score(scores.spoken_production),
      writing: score(scores.writing),
      grammar: score(scores.grammar),
      vocabulary: score(scores.vocabulary),
      pronunciation: score(scores.pronunciation),
      fluency: score(scores.fluency),
    },
  };
}

function normalizeDailyActivity(value: unknown): DailyEvidence[] {
  if (!Array.isArray(value)) return [];
  const rows = new Map<string, DailyEvidence>();
  for (const candidate of value) {
    if (!isRecord(candidate)) continue;
    const date =
      typeof candidate.date === "string" ? candidate.date.slice(0, 10) : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    rows.set(date, {
      date,
      practiceCount: count(candidate.practiceCount),
      speakingSamples: count(candidate.speakingSamples),
      writingSamples: count(candidate.writingSamples),
      spontaneousSamples: count(candidate.spontaneousSamples),
      delayedReviews: count(candidate.delayedReviews),
      averageScore: score(candidate.averageScore),
    });
  }
  return [...rows.values()]
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-90);
}

function normalizeTrack(
  value: unknown,
  language: LanguageId,
): LanguageTrack {
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
    placementCheckedAt: timestamp(source.placementCheckedAt, null),
    evidence: normalizeEvidence(source.evidence),
    updatedAt: timestamp(source.updatedAt, null),
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
    avatarDataUrl: avatarDataUrl(value.avatarDataUrl),
    createdAt: timestamp(value.createdAt, fallback.createdAt) ?? fallback.createdAt,
    updatedAt: timestamp(value.updatedAt, fallback.updatedAt) ?? fallback.updatedAt,
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
  const nextTrack =
    language && update.track
      ? normalizeTrack(
          {
            ...current.languages[language],
            ...update.track,
            updatedAt: now,
            updatedBy: "english-grammar-automaticity",
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
    languages: nextTrack
      ? { ...current.languages, [nextTrack.language]: nextTrack }
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
    // A clean profile is safer than accepting malformed local data.
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
