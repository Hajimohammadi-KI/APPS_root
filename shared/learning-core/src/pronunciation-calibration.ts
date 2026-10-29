/** A score is a model-specific signal, not necessarily a probability. */
export interface AcousticObservation {
  readonly sampleId: string;
  readonly speakerId: string;
  readonly split: "calibration" | "evaluation";
  readonly group: string;
  readonly language: "en" | "de";
  readonly label: "correct" | "error";
  readonly labelSource: "human";
  readonly score: number;
}
export interface CalibrationConfig {
  readonly language: "en" | "de";
  readonly requiredGroups: readonly string[];
  readonly modelSha256: string;
  readonly labelsSha256: string;
  readonly sourceUrl: string;
}
export interface CalibrationSlice {
  readonly group: string;
  readonly calibrationNegativeSpeakers: number;
  readonly calibrationPositiveSpeakers: number;
  readonly negativeSpeakers: number;
  readonly falseAlertSpeakers: number;
  readonly falseAlertUpper95: number;
  readonly positiveSpeakers: number;
  readonly detectedSpeakers: number;
  readonly sensitivity: number | null;
}
interface SpeakerScores {
  correct: number | null;
  error: number | null;
  group: string;
  split: AcousticObservation["split"];
}

/** Exact one-sided 95% Clopper–Pearson upper bound, including zero events. */
export function falseAlertUpper95(events: number, trials: number): number {
  if (
    !Number.isSafeInteger(events) ||
    !Number.isSafeInteger(trials) ||
    trials <= 0 ||
    events < 0 ||
    events > trials
  )
    return 1;
  if (events === trials) return 1;
  if (events === 0) return 1 - Math.pow(0.05, 1 / trials);
  const cdf = (probability: number) => {
    let logTerm = trials * Math.log1p(-probability),
      logSum = logTerm;
    for (let k = 1; k <= events; k++) {
      logTerm +=
        Math.log(trials - k + 1) -
        Math.log(k) +
        Math.log(probability) -
        Math.log1p(-probability);
      const maximum = Math.max(logSum, logTerm);
      logSum =
        maximum +
        Math.log(Math.exp(logSum - maximum) + Math.exp(logTerm - maximum));
    }
    return Math.exp(logSum);
  };
  let low = 0,
    high = 1;
  for (let i = 0; i < 60; i++) {
    const middle = (low + high) / 2;
    if (cdf(middle) > 0.05) low = middle;
    else high = middle;
  }
  return high;
}

/** Threshold is selected only on calibration speakers, then audited on held-out
 * speakers. All numerical results are research evidence, never model approval. */
export function evaluatePronunciationCalibration(
  observations: readonly AcousticObservation[],
  config: CalibrationConfig,
) {
  if (
    !/^[a-f0-9]{64}$/u.test(config.modelSha256) ||
    !/^[a-f0-9]{64}$/u.test(config.labelsSha256)
  )
    throw Error("Invalid artifact hash");
  if (
    !/^https:\/\//u.test(config.sourceUrl) ||
    !["en", "de"].includes(config.language) ||
    !config.requiredGroups.length ||
    config.requiredGroups.some((g) => !/^[A-Za-z0-9_-]{1,64}$/u.test(g))
  )
    throw Error("Invalid calibration scope");
  if (!observations.length || observations.length > 100_000)
    throw Error("Invalid observation count");
  const samples = new Set<string>(),
    speakers = new Map<string, SpeakerScores>();
  for (const row of observations) {
    if (row.labelSource !== "human") throw Error("A human label is required");
    if (!Number.isFinite(row.score) || row.score < 0 || row.score > 1)
      throw Error("Invalid score");
    if (!row.sampleId || row.sampleId.length > 128 || samples.has(row.sampleId))
      throw Error("Invalid or duplicate sample");
    if (
      !row.speakerId ||
      row.speakerId.length > 128 ||
      !/^[A-Za-z0-9_-]{1,64}$/u.test(row.group) ||
      row.language !== config.language ||
      !["calibration", "evaluation"].includes(row.split) ||
      !["correct", "error"].includes(row.label)
    )
      throw Error("Invalid speaker, split or scope");
    samples.add(row.sampleId);
    const existing = speakers.get(row.speakerId);
    if (
      existing &&
      (existing.split !== row.split || existing.group !== row.group)
    )
      throw Error("Each speaker must belong to exactly one split and group");
    const speaker = existing ?? {
      correct: null,
      error: null,
      group: row.group,
      split: row.split,
    };
    speaker[row.label] = Math.max(speaker[row.label] ?? -1, row.score);
    speakers.set(row.speakerId, speaker);
  }
  const training = [...speakers.values()].filter(
    (s) => s.split === "calibration",
  );
  const events = new Map<number, { negative: number; positive: number }>();
  for (const person of training)
    for (const kind of ["correct", "error"] as const) {
      const score = person[kind];
      if (score === null) continue;
      const event = events.get(score) ?? { negative: 0, positive: 0 };
      if (kind === "correct") event.negative++;
      else event.positive++;
      events.set(score, event);
    }
  let missed = training.filter((s) => s.error !== null).length,
    falseAlerts = 0;
  let threshold = 1.000001,
    bestCost = missed;
  for (const [score, event] of [...events].sort((a, b) => b[0] - a[0])) {
    falseAlerts += event.negative;
    missed -= event.positive;
    const cost = 10 * falseAlerts + missed;
    if (cost < bestCost) {
      threshold = score;
      bestCost = cost;
    }
  }
  const groups = [
    ...new Set([...config.requiredGroups, ...observations.map((r) => r.group)]),
  ].sort();
  const slices: CalibrationSlice[] = groups.map((group) => {
    const cal = training.filter((s) => s.group === group);
    const held = [...speakers.values()].filter(
      (s) => s.group === group && s.split === "evaluation",
    );
    const negative = held.filter((s) => s.correct !== null),
      positive = held.filter((s) => s.error !== null);
    const falseAlertSpeakers = negative.filter(
      (s) => s.correct! >= threshold,
    ).length;
    const detectedSpeakers = positive.filter(
      (s) => s.error! >= threshold,
    ).length;
    return {
      group,
      calibrationNegativeSpeakers: cal.filter((s) => s.correct !== null).length,
      calibrationPositiveSpeakers: cal.filter((s) => s.error !== null).length,
      negativeSpeakers: negative.length,
      falseAlertSpeakers,
      falseAlertUpper95: falseAlertUpper95(falseAlertSpeakers, negative.length),
      positiveSpeakers: positive.length,
      detectedSpeakers,
      sensitivity: positive.length ? detectedSpeakers / positive.length : null,
    };
  });
  const meetsStatisticalGate =
    threshold <= 1 &&
    config.requiredGroups.every((group) => {
      const s = slices.find((slice) => slice.group === group)!;
      return (
        s.calibrationNegativeSpeakers >= 60 &&
        s.calibrationPositiveSpeakers >= 20 &&
        s.negativeSpeakers >= 60 &&
        s.positiveSpeakers >= 20 &&
        s.falseAlertUpper95 <= 0.05 &&
        (s.sensitivity ?? 0) >= 0.2
      );
    });
  return {
    threshold,
    slices,
    meetsStatisticalGate,
    readyForProduction: false as const,
    modelSha256: config.modelSha256,
    labelsSha256: config.labelsSha256,
    sourceUrl: config.sourceUrl,
    language: config.language,
  };
}
