import {
  isRecord,
  validDate,
  type AttemptEvent,
  type Language,
} from "./contracts";
import type { CurriculumPack } from "./curriculum";
import { appendAutomaticityEvent, type LocalStore } from "./storage";
import { sha256 } from "./backup";

export interface LegacySyncResult {
  imported: number;
  existing: number;
  skipped: { source: string; reason: string }[];
}
const string = (value: unknown) => (typeof value === "string" ? value : "");
const sourceKeys = (language: Language) =>
  language === "en"
    ? [
        "grammar-automaticity:v27",
        "GrammarAutomaticityV11_en",
        "english-automaticity:grammar-open-responses:v1",
      ]
    : [
        "GrammarAutomaticityV11_de",
        "deutsch-automaticity:grammar-open-responses:v1",
      ];

/** Import original output, never reconstruct missing independence or assessment. */
export async function syncLegacyPractice(
  storage: LocalStore,
  language: Language,
  pack: CurriculumPack,
  now: string,
): Promise<LegacySyncResult> {
  if (pack.language !== language || !validDate(now))
    throw new Error("Invalid legacy import context");
  const result: LegacySyncResult = { imported: 0, existing: 0, skipped: [] };
  for (const key of sourceKeys(language)) {
    const raw = storage.getItem(key);
    if (raw === null) continue;
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      result.skipped.push({ source: key, reason: "Unreadable original kept" });
      continue;
    }
    const groups: [string, unknown[]][] = Array.isArray(data)
      ? [["responses", data]]
      : isRecord(data)
        ? [
            ["attempts", Array.isArray(data.attempts) ? data.attempts : []],
            ["sessions", Array.isArray(data.sessions) ? data.sessions : []],
          ]
        : [];
    for (const [group, rows] of groups) {
      const occurrences = new Map<string, number>();
      for (const rawRow of rows) {
        if (!isRecord(rawRow)) {
          result.skipped.push({
            source: key,
            reason: "Malformed original kept",
          });
          continue;
        }
        const text =
          string(rawRow.inputText) ||
          string(rawRow.transcript) ||
          string(rawRow.response);
        const at =
          string(rawRow.createdAt) ||
          string(rawRow.date) ||
          string(rawRow.occurredAt);
        if (
          !text.trim() ||
          !validDate(at) ||
          Date.parse(at) > Date.parse(now)
        ) {
          result.skipped.push({
            source: key,
            reason:
              "Missing original response/date or future date; no evidence inferred",
          });
          continue;
        }
        const title =
          string(rawRow.grammarTitle) ||
          string(rawRow.topic) ||
          (isRecord(rawRow.topic) ? string(rawRow.topic.topic) : "");
        const level =
          string(rawRow.level) ||
          (isRecord(rawRow.topic) ? string(rawRow.topic.level) : "");
        const matches = pack.units.filter(
          (unit) => unit.title === title && (!level || unit.level === level),
        );
        const unit = matches.length === 1 ? matches[0] : undefined;
        const modality =
          group === "sessions" ||
          ["speaking", "spoken", "transfer", "timed"].includes(
            string(rawRow.mode),
          )
            ? "speaking"
            : "writing";
        const digest = await sha256(
          JSON.stringify([
            key,
            group,
            string(rawRow.id),
            title,
            at,
            text,
            modality,
          ]),
        );
        const ordinal = occurrences.get(digest) ?? 0;
        occurrences.set(digest, ordinal + 1);
        const id = `legacy-${digest}-${ordinal}`;
        const responseHash = await sha256(text);
        const event: AttemptEvent = {
          version: 2,
          type: "attempt",
          id,
          language,
          at,
          task: {
            id: `legacy:${digest}`,
            version: "legacy-import-1",
            constructionId: unit?.id ?? "legacy.unmapped",
            familyId: unit?.familyIds[0] ?? "legacy.unmapped",
            itemFamily: `legacy:${digest}`,
            contextId: "legacy-context-unknown",
            rubricVersion: "legacy-unqualified-1",
            stage: rawRow.mode === "repair" ? "repair" : "produce",
            modality,
            partition: "practice",
            transferCondition: "none",
            contentReview: "authored",
          },
          response: {
            text,
            sha256: responseHash,
            originalTranscriptSha256: null,
            transcriptEdited: false,
          },
          timing: {
            startedAt: at,
            activeMs: null,
            firstInputMs: null,
            source: "unavailable",
          },
          // Unknown historical assistance is deliberately ineligible. No claim
          // is made about whether the learner actually used help.
          assistance: {
            hintCount: 0,
            solutionRevealed: false,
            exampleSeen: false,
            selfReportedAssistance: false,
          },
          audio: null,
          previousAttemptId: null,
        };
        const eventKey = `automaticity:v2:${language}:event:${encodeURIComponent(id)}`;
        if (storage.getItem(eventKey) === null) {
          appendAutomaticityEvent(storage, event);
          result.imported++;
        } else result.existing++;
        // No old percentage or verified flag becomes a new assessment. Original
        // stores/audio remain intact and are included in complete backups.
      }
    }
  }
  return result;
}

const packs = new Map<Language, Promise<CurriculumPack>>();
export async function syncLegacyPracticeInBrowser(
  language: Language,
): Promise<LegacySyncResult> {
  let pending = packs.get(language);
  if (!pending) {
    pending = fetch(`/learning-core/curriculum-${language}.json`).then(
      async (response) => {
        if (!response.ok)
          throw new Error("Grammar catalog unavailable for history sync");
        return (await response.json()) as CurriculumPack;
      },
    );
    packs.set(language, pending);
    pending.catch(() => packs.delete(language));
  }
  const result = await syncLegacyPractice(
    localStorage,
    language,
    await pending,
    new Date().toISOString(),
  );
  window.dispatchEvent(
    new CustomEvent("automaticity-history-updated", { detail: language }),
  );
  return result;
}
