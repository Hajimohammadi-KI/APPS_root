// Bun-only offline research. No audio/transcript leaves this computer.
// extract --corpus <SLR101 directory> --hama <hama-js package directory> --observations <new file outside repo>
// report  --corpus <SLR101 directory> --hama <hama-js package directory> --observations <existing file> [--groups fa,zh]
// hama-js@1.7.0 is optional and installed separately; it is not a production evaluator.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  phoneDisagreement,
  selectSpeakerCandidates,
  speechOceanConsensus,
} from "../shared/learning-core/src/pronunciation-corpus.ts";
import { evaluatePronunciationCalibration } from "../shared/learning-core/src/pronunciation-calibration.ts";

const argument = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? null : process.argv[index + 1];
};
const mode = process.argv[2],
  corpus = argument("corpus"),
  hama = argument("hama"),
  observationsPath = argument("observations");
if (
  !["extract", "report"].includes(mode) ||
  !corpus ||
  !hama ||
  !observationsPath
)
  throw Error(
    "Specify extract/report, --corpus, --hama and --observations; see usage in the script.",
  );
const packageInfo = JSON.parse(
  readFileSync(join(hama, "package.json"), "utf8"),
);
if (packageInfo.name !== "hama-js" || packageInfo.version !== "1.7.0")
  throw Error("This experiment requires pinned hama-js 1.7.0.");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const modelRoot = resolve(hama, "dist/node"),
  modelHash = createHash("sha256");
function hashDirectory(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name, "en"),
  )) {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink())
      throw Error("Model package must not contain symbolic links.");
    if (entry.isDirectory()) hashDirectory(path);
    else if (entry.isFile()) {
      modelHash.update(relative(modelRoot, path).replaceAll("\\", "/") + "\0");
      modelHash.update(readFileSync(path));
    }
  }
}
hashDirectory(modelRoot);
const modelSha256 = modelHash.digest("hex"),
  labelsBytes = readFileSync(join(corpus, "resource/scores-detail.json")),
  labelsSha256 = hash(labelsBytes);
const sourceUrl = "https://www.openslr.org/101/";
const labels = JSON.parse(labelsBytes.toString("utf8"));
const candidates = [],
  expectedRows = new Map();
for (const split of ["train", "test"]) {
  const parseMap = (name) =>
    new Map(
      readFileSync(join(corpus, split, name), "utf8")
        .trim()
        .split(/\r?\n/u)
        .map((line) => line.trim().split(/\s+/u)),
    );
  const ages = parseMap("spk2age"),
    genders = parseMap("spk2gender");
  const metadata = readFileSync(join(corpus, split, "utt2spk"), "utf8")
    .trim()
    .split(/\r?\n/u)
    .map((line) => {
      const [sampleId, speakerId] = line.trim().split(/\s+/u);
      if (!/^\d{9}$/u.test(sampleId ?? "") || !/^\d{4}$/u.test(speakerId ?? ""))
        throw Error("Invalid corpus identifier.");
      return { sampleId, speakerId };
    });
  for (const item of selectSpeakerCandidates(metadata)) {
    const annotation = labels[item.sampleId],
      label = speechOceanConsensus(annotation);
    const age = Number(ages.get(item.speakerId)),
      gender = genders.get(item.speakerId);
    const demographic =
      Number.isFinite(age) &&
      age > 0 &&
      age < 120 &&
      ["m", "f"].includes(gender)
        ? `zh_${age < 18 ? "child" : "adult"}_${gender}`
        : "zh_unknown";
    const candidate = {
      ...item,
      split: split === "train" ? "calibration" : "evaluation",
      group: "zh",
      demographic,
      language: "en",
      label,
      labelSource: "human",
      text: annotation?.text,
    };
    candidates.push(candidate);
    if (expectedRows.has(item.sampleId))
      throw Error("Duplicate corpus ID across splits.");
    expectedRows.set(item.sampleId, candidate);
  }
}
const eligible = candidates.filter(
  (item) => item.label && typeof item.text === "string",
);
const wavFor = (item) => {
  const path = join(
      corpus,
      "WAVE",
      `SPEAKER${item.speakerId}`,
      `${item.sampleId}.WAV`,
    ),
    bytes = readFileSync(path);
  if (!bytes.length || bytes.length > 20_000_000)
    throw Error("Invalid audio size.");
  return { path, bytes };
};
if (mode === "extract") {
  const repo = resolve(fileURLToPath(new URL("..", import.meta.url)));
  const output = resolve(observationsPath),
    relativeOutput = relative(repo, output);
  if (
    !isAbsolute(relativeOutput) &&
    relativeOutput !== ".." &&
    !relativeOutput.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
  )
    throw Error(
      "Keep individual research observations outside the repository.",
    );
  const { ASRNodeModel, G2PNodeModel } = await import(
    pathToFileURL(join(modelRoot, "index.js")).href
  );
  const asr = await ASRNodeModel.create(),
    g2p = await G2PNodeModel.create(),
    expectedCache = new Map(),
    rows = [],
    audioHash = createHash("sha256");
  for (const item of eligible) {
    const wav = wavFor(item);
    const recognized = (await asr.transcribeWavFile(wav.path)).phonemes;
    if (!expectedCache.has(item.text))
      expectedCache.set(
        item.text,
        (await g2p.predict(item.text)).alignments.map((x) => x.phoneme),
      );
    const score = phoneDisagreement(expectedCache.get(item.text), recognized);
    audioHash.update(item.sampleId + "\0").update(wav.bytes);
    const { text, ...row } = item;
    rows.push({
      ...row,
      score,
      status: score === null ? "unusable" : "scored",
    });
    if (rows.length % 50 === 0)
      console.log(`Processed ${rows.length} corpus recordings.`);
  }
  writeFileSync(
    output,
    JSON.stringify({
      modelSha256,
      labelsSha256,
      audioSha256: audioHash.digest("hex"),
      rowsSha256: hash(JSON.stringify(rows)),
      sourceUrl,
      candidates: candidates.length,
      eligible: eligible.length,
      rows,
    }),
    { flag: "wx" },
  );
  console.log(
    `Saved ${rows.length} observations outside the repository; no audio or transcripts were saved.`,
  );
} else {
  const input = JSON.parse(readFileSync(observationsPath, "utf8"));
  if (
    input.modelSha256 !== modelSha256 ||
    input.labelsSha256 !== labelsSha256 ||
    input.sourceUrl !== sourceUrl ||
    !Array.isArray(input.rows) ||
    input.rowsSha256 !== hash(JSON.stringify(input.rows)) ||
    input.candidates !== candidates.length ||
    input.eligible !== eligible.length ||
    input.rows.length !== eligible.length
  )
    throw Error(
      "Observations do not match the pinned model, labels or source.",
    );
  const seen = new Set(),
    audioHash = createHash("sha256");
  for (const row of input.rows) {
    const expected = expectedRows.get(row.sampleId);
    if (
      !expected?.label ||
      typeof expected.text !== "string" ||
      seen.has(row.sampleId) ||
      !(
        (row.status === "unusable" && row.score === null) ||
        (row.status === "scored" &&
          typeof row.score === "number" &&
          Number.isFinite(row.score) &&
          row.score >= 0 &&
          row.score <= 1)
      ) ||
      [
        "speakerId",
        "split",
        "group",
        "demographic",
        "language",
        "label",
        "labelSource",
      ].some((key) => row[key] !== expected[key])
    )
      throw Error(
        "Observation does not match corpus metadata and human labels.",
      );
    seen.add(row.sampleId);
    audioHash.update(row.sampleId + "\0").update(wavFor(expected).bytes);
  }
  if (input.audioSha256 !== audioHash.digest("hex"))
    throw Error("Audio fingerprint does not match corpus recordings.");
  const groups = (argument("groups") ?? "fa").split(",").filter(Boolean);
  const config = {
    language: "en",
    requiredGroups: groups,
    modelSha256,
    labelsSha256,
    sourceUrl,
  };
  const scored = input.rows.filter((row) => row.status === "scored");
  const population = evaluatePronunciationCalibration(scored, config);
  const demographicRows = scored.map((row) => ({
    ...row,
    group: row.demographic ?? "zh_unknown",
  }));
  const demographics = evaluatePronunciationCalibration(demographicRows, {
    ...config,
    requiredGroups: ["zh_adult_f", "zh_adult_m", "zh_child_f", "zh_child_m"],
  });
  console.log(
    JSON.stringify(
      {
        dataset: "OpenSLR 101 / speechocean762",
        datasetLicense: "CC BY 4.0",
        limitations:
          "First three corpus-order recordings per speaker, with ambiguous labels excluded: not a representative random sample. Mandarin L1, not Persian. The false-alert bound counts speakers with at least one alert on selected correct utterances, not daily per-utterance alerts. Utterance-level disagreement is not a phoneme diagnosis; model-training overlap is unknown. Scores and unusable statuses are not authenticated: independent re-extraction is needed. Hashes detect corruption, not adversarial changes. Per-group confidence intervals are not a simultaneous fairness guarantee.",
        audioSha256: input.audioSha256,
        candidates: candidates.length,
        excludedAmbiguousOrMissing: candidates.length - eligible.length,
        unusableScores: eligible.length - scored.length,
        observations: scored.length,
        population,
        demographics,
      },
      null,
      2,
    ),
  );
}
