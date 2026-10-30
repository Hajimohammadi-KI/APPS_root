import { expect, test } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test("W26 research CLI preserves all unusable ASR results through extraction and reporting", () => {
  const root = mkdtempSync(join(tmpdir(), "w26-abstention-"));
  try {
    const corpus = join(root, "corpus"),
      hama = join(root, "hama");
    mkdirSync(join(corpus, "resource"), { recursive: true });
    mkdirSync(join(hama, "dist/node"), { recursive: true });
    writeFileSync(
      join(hama, "package.json"),
      JSON.stringify({ name: "hama-js", version: "1.7.0", type: "module" }),
    );
    // Synthetic inference and annotations exercise plumbing, never model quality.
    writeFileSync(
      join(hama, "dist/node/index.js"),
      `
      export class ASRNodeModel {
        static async create() { return new ASRNodeModel(); }
        async transcribeWavFile() { return { phonemes: [] }; }
      }
      export class G2PNodeModel {
        static async create() { return new G2PNodeModel(); }
        async predict() { return { alignments: [{ phoneme: "a" }] }; }
      }
    `,
    );
    const labels = {};
    for (const [split, speaker, sample] of [
      ["train", "0001", "000000001"],
      ["test", "0002", "000000002"],
    ]) {
      mkdirSync(join(corpus, split));
      writeFileSync(join(corpus, split, "utt2spk"), `${sample} ${speaker}\n`);
      writeFileSync(join(corpus, split, "spk2age"), `${speaker} 25\n`);
      writeFileSync(join(corpus, split, "spk2gender"), `${speaker} f\n`);
      mkdirSync(join(corpus, "WAVE", `SPEAKER${speaker}`), { recursive: true });
      writeFileSync(
        join(corpus, "WAVE", `SPEAKER${speaker}`, `${sample}.WAV`),
        "fixture-not-real-audio",
      );
      labels[sample] = {
        text: "a",
        words: [{ phones: ["A", "A", "A", "A", "A"] }],
      };
    }
    writeFileSync(
      join(corpus, "resource/scores-detail.json"),
      JSON.stringify(labels),
    );
    const observations = join(root, "observations.json");
    const run = (mode) =>
      Bun.spawnSync([
        process.execPath,
        resolve(import.meta.dirname, "pronunciation-research.mjs"),
        mode,
        "--corpus",
        corpus,
        "--hama",
        hama,
        "--observations",
        observations,
        "--groups",
        "zh",
      ]);
    const extraction = run("extract");
    expect(extraction.exitCode).toBe(0);
    const saved = JSON.parse(readFileSync(observations, "utf8"));
    expect(saved.rows.map((row) => [row.status, row.score])).toEqual([
      ["unusable", null],
      ["unusable", null],
    ]);
    const result = run("report");
    expect(result.stderr.toString()).toBe("");
    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout.toString());
    expect(report.observations).toBe(0);
    expect(report.unusableScores).toBe(2);
    expect(report.population.readyForProduction).toBe(false);
    expect(report.population.meetsStatisticalGate).toBe(false);
    expect(
      report.population.slices.find((slice) => slice.group === "zh").coverage
        .evaluation.correct,
    ).toEqual({ total: 1, scored: 0, unusable: 1 });
    expect(
      report.demographics.slices.find((slice) => slice.group === "zh_adult_f")
        .coverage.calibration.correct.unusable,
    ).toBe(1);
    // Previous extraction semantics must not be reused as current evidence.
    delete saved.scoringVersion;
    writeFileSync(observations, JSON.stringify(saved));
    const stale = run("report");
    expect(stale.exitCode).not.toBe(0);
    expect(stale.stderr.toString()).toContain("scoring version");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
