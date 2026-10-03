import type {
  AdherenceProfileV1,
  ImplementationIntention,
  ImplementationIntentionSignal,
  ImplementationIntentionValidation,
} from "./types";

export const MAX_ACTIVE_IMPLEMENTATION_INTENTIONS = 5 as const;
export const MIN_ACTIVE_IMPLEMENTATION_INTENTIONS = 2 as const;
export const MAX_IMPLEMENTATION_INTENTION_LABEL_LENGTH = 120 as const;

function normalizeLabel(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function isTimeLabel(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(":").map(Number);
  return hours! >= 0 && hours! <= 23 && minutes! >= 0 && minutes! <= 59;
}

/**
 * Validate the optional 0-or-2-to-5 contract before local persistence.
 * A learner may skip or disable every intention; a lone active intention is a
 * draft, not a saved onboarding configuration.
 */
export function validateImplementationIntentions(
  intentions: readonly ImplementationIntention[],
): ImplementationIntentionValidation {
  const activeCount = intentions.filter((intention) => intention.active).length;
  if (
    activeCount !== 0 &&
    (activeCount < MIN_ACTIVE_IMPLEMENTATION_INTENTIONS ||
      activeCount > MAX_ACTIVE_IMPLEMENTATION_INTENTIONS)
  ) {
    return { valid: false, code: "active-count", activeCount };
  }

  const ids = new Set<string>();
  for (const intention of intentions) {
    const id = intention.id.trim();
    if (!id || id.length > 80) {
      return { valid: false, code: "invalid-id", activeCount };
    }
    if (ids.has(id)) {
      return { valid: false, code: "duplicate-id", activeCount };
    }
    ids.add(id);

    const label = intention.triggerLabel.trim();
    if (
      !label ||
      label.length > MAX_IMPLEMENTATION_INTENTION_LABEL_LENGTH ||
      (intention.trigger === "time" && !isTimeLabel(label))
    ) {
      return { valid: false, code: "invalid-label", activeCount };
    }
  }

  return { valid: true, code: "valid", activeCount };
}

/** Pure matcher only. It never emits, schedules, or persists a nudge. */
export function matchIntention(
  intention: ImplementationIntention,
  signal: ImplementationIntentionSignal,
): boolean {
  if (!intention.active || intention.trigger !== signal.trigger) return false;
  const intendedLabel = normalizeLabel(intention.triggerLabel);
  const observedLabel = normalizeLabel(signal.triggerLabel);
  if (!intendedLabel || !observedLabel) return false;
  if (intention.trigger === "time") {
    return isTimeLabel(intendedLabel) && intendedLabel === observedLabel;
  }
  return intendedLabel === observedLabel;
}

/**
 * Replace only the local intention list. Streak and opt-in state are preserved
 * byte-for-byte and no external side effect occurs.
 */
export function replaceImplementationIntentions(
  profile: AdherenceProfileV1,
  intentions: readonly ImplementationIntention[],
  updatedAt: string,
): AdherenceProfileV1 {
  const now = new Date(updatedAt);
  if (Number.isNaN(now.getTime()))
    throw new RangeError("updatedAt must be valid");
  if (intentions.length > MAX_ACTIVE_IMPLEMENTATION_INTENTIONS) {
    throw new RangeError(
      "At most five implementation intentions can be stored",
    );
  }
  const validation = validateImplementationIntentions(intentions);
  if (!validation.valid) {
    throw new RangeError(
      `Invalid implementation intentions: ${validation.code}`,
    );
  }
  return {
    ...profile,
    updatedAt: now.toISOString(),
    streak: { ...profile.streak },
    intentions: intentions.map((intention) => ({
      ...intention,
      id: intention.id.trim(),
      triggerLabel: intention.triggerLabel
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " "),
    })),
  };
}
