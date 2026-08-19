import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import {
  allDays,
  articleReadings,
  extractionSections,
  nlpCourseSessions,
  nlpLabDefinition,
  PLAN_VERSION,
  PLAN_VERSION_HISTORY,
  sources,
} from "../app/plan-data";
import {
  countRequiredCompletedItems,
  getDayStatus,
  requiredItemTotal,
} from "../lib/study-progress";

const expectedDates = [
  "2026-08-17", "2026-08-19", "2026-08-22", "2026-08-24", "2026-08-26",
  "2026-08-29", "2026-08-31", "2026-09-02", "2026-09-05", "2026-09-07",
];

const expectedTopics = [
  ["Introduction to Natural Language Processing", "Text Preprocessing", "Basic Text Representation", "Tokenization"],
  ["Bag-of-Words Model", "TF-IDF", "Vector Space Models", "Cosine Similarity"],
  ["Word2Vec", "Continuous Bag-of-Words (CBOW)", "Skip-Gram"],
  ["GloVe", "FastText", "Using Embedding Layers in Keras"],
  ["Recurrent Neural Networks (RNNs)", "The Vanishing Gradient Problem"],
  ["Advanced Recurrent Architectures: LSTM and GRU", "Sentiment Analysis Project Using LSTM"],
  ["Sequence-to-Sequence Architecture (Seq2Seq)", "Introduction to the Transformer Architecture"],
  ["Self-Attention", "Multi-Head Attention", "Positional Encoding"],
  ["Transformer Encoder and Decoder", "BERT Family—Encoder-Based Models", "GPT Family—Decoder-Based Models"],
  ["Prompt Engineering", "Parameter-Efficient Fine-Tuning (PEFT)", "LoRA and QLoRA", "Retrieval-Augmented Generation (RAG)", "BLEU and ROUGE"],
];

const readingFolder =
  "D:\\Bachelor-Thesis\\02_Literature\\09_NLP_Course_2026_Reading_Order";

describe("Advanced Deep Learning reading plan", () => {
  test("uses the ten official dates, topics, and class times", () => {
    expect(nlpCourseSessions.map((session) => session.date)).toEqual(expectedDates);
    expect(nlpCourseSessions.map((session) => session.topics)).toEqual(expectedTopics);
    expect(nlpCourseSessions).toHaveLength(10);
    for (const session of nlpCourseSessions) {
      expect(session.berlinTime).toBe("18:00–19:40");
      expect(session.iranTime).toBe("19:30–21:10");
      expect(session.readingFocus).toHaveLength(3);
      expect(session.projectConnection.length).toBeGreaterThan(40);
      expect(session.extractionGoal.length).toBeGreaterThan(40);
    }
  });

  test("maps every session only to stable, existing article readings", () => {
    const readingIds = new Set(articleReadings.map((reading) => reading.id));
    for (const session of nlpCourseSessions) {
      expect(session.readingIds.length).toBeGreaterThan(0);
      expect(session.readingIds.every((id) => readingIds.has(id as `reading-${number}`))).toBeTrue();
    }
  });

  test("contains exactly 18 unique files with course and original numbering", () => {
    expect(articleReadings).toHaveLength(18);
    expect(articleReadings.map((reading) => reading.order)).toEqual(
      Array.from({ length: 18 }, (_, index) => index + 6),
    );
    expect(
      [...articleReadings]
        .sort((a, b) => a.courseOrder - b.courseOrder)
        .map((reading) => reading.courseOrder),
    ).toEqual(Array.from({ length: 18 }, (_, index) => index + 1));
    expect(new Set(articleReadings.map((reading) => reading.id)).size).toBe(18);
    expect(new Set(articleReadings.map((reading) => reading.fileName)).size).toBe(18);
    expect(articleReadings[0]?.status).toBe("in_progress");
    for (const reading of articleReadings) {
      expect(reading.fileName.startsWith(
        `C${String(reading.courseOrder).padStart(2, "0")}-O${String(reading.order).padStart(2, "0")}_`,
      )).toBeTrue();
      expect(existsSync(join(readingFolder, reading.fileName))).toBeTrue();
      expect(Boolean(sources[reading.sourceId])).toBeTrue();
      expect(reading.readingFocus).toHaveLength(3);
    }
    expect(extractionSections).toEqual([
      "Problem", "Method", "Data / Evaluation", "Findings", "Limitations",
      "Verbindung mit RQ / Projektarchitektur",
    ]);
  });

  test("keeps technical tasks in the course window optional and outside progress", () => {
    const courseWindow = allDays.filter(
      (day) => day.date >= "2026-08-19" && day.date <= "2026-09-07",
    );
    expect(courseWindow.length).toBeGreaterThan(0);
    expect(courseWindow.every((day) => day.optionalDuringCourse)).toBeTrue();
    const optionalDay = courseWindow[0]!;
    const oneCompleted = new Set([optionalDay.tasks[0]!.items[0]!.id]);
    expect(requiredItemTotal(optionalDay)).toBe(0);
    expect(countRequiredCompletedItems(optionalDay, oneCompleted)).toBe(0);
    expect(getDayStatus(optionalDay, oneCompleted)).toBe("optional");
  });

  test("records Revision 2 and a reading-only course boundary", () => {
    expect(PLAN_VERSION).toBe(2);
    expect(PLAN_VERSION_HISTORY.at(-1)?.effectiveDate).toBe("2026-08-19");
    expect(nlpLabDefinition.courseStart).toBe("2026-08-17");
    expect(nlpLabDefinition.courseEnd).toBe("2026-09-07");
    expect(nlpLabDefinition.projectFit).toContain("optional");
    expect(nlpLabDefinition.integrationContract.boundary).toContain("Evidence Paths");
  });
});
