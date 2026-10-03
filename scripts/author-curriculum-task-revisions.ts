import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import type {
  CurriculumPack,
  ConstructionUnit,
  PracticeTask,
} from "../shared/learning-core/src/automaticity/curriculum";
const sha256 = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const packs = new Map<string, CurriculumPack>();
for (const language of ["en", "de"])
  packs.set(
    language,
    JSON.parse(
      await readFile(
        `artifacts/curriculum-task-revisions/baseline-20260905/${language}.json`,
        "utf8",
      ),
    ),
  );
const specifications = new Map(
  (await readFile("docs/grammar-scope/english-specifications.psv", "utf8"))
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [id, form, meaning, use] = line.split("|");
      return [id!, { form: form!, meaning: meaning!, use: use! }];
    }),
);
const revisions: {
  constructionId: string;
  retired: {
    taskId: string;
    sha256: string;
    replacementTaskId: string;
    reason: string;
    retiredOn: string;
  }[];
  replacements: PracticeTask[];
}[] = [];
function revision(unit: ConstructionUnit) {
  let row = revisions.find((row) => row.constructionId === unit.id);
  if (!row) {
    row = { constructionId: unit.id, retired: [], replacements: [] };
    revisions.push(row);
  }
  return row;
}
function replace(
  unit: ConstructionUnit,
  originals: PracticeTask[],
  slug: string,
  reason: string,
  prompt: string,
  answers: string[] | null,
  kind: PracticeTask["responseKind"] = "free_output",
) {
  const row = revision(unit);
  for (const modality of [...new Set(originals.map((task) => task.modality))]) {
    const scoped = originals.filter((task) => task.modality === modality),
      original = scoped[0]!;
    const taskId = `${unit.id}.${original.stage}.revision1-${slug}.${modality}`;
    const closed = modality === "writing" && answers !== null;
    const replacement: PracticeTask = {
      id: taskId,
      version: "2026-09-05.4",
      constructionId: unit.id,
      familyId: original.familyId,
      itemFamily: `${unit.id}.revision1-${slug}`,
      contextId: `${unit.id}.revision1-${slug}`,
      rubricVersion: closed ? "closed-nfc-case-v1" : "open-review-v1",
      stage: original.stage,
      modality,
      partition: "practice",
      transferCondition: "none",
      contentReview: "authored",
      prompt:
        modality === "speaking"
          ? unit.language === "en"
            ? "Record your answer. " + prompt.replace(/\bWrite\b/g, "Say")
            : "Nimm deine Antwort auf. " +
              prompt.replace(/\bSchreibe\b/g, "Sage")
          : prompt,
      answerPolicy: closed ? "closed" : "open",
      responseKind: modality === "speaking" ? "free_output" : kind,
      acceptedAnswers: closed ? answers! : [],
      hints: [unit.rule],
      solution: answers?.[0] ?? null,
      normalisation: {
        nfc: true,
        whitespace: true,
        terminalFullStop: true,
        preserveCase: true,
      },
      sourceId: `authored-task-revision-2026-09-05.1:${unit.id}:${slug}`,
    };
    row.replacements.push(replacement);
    for (const task of scoped) {
      if (row.retired.some((row) => row.taskId === task.id))
        throw Error(`Duplicate retirement ${task.id}`);
      row.retired.push({
        taskId: task.id,
        sha256: sha256(task),
        replacementTaskId: taskId,
        reason,
        retiredOn: "2026-09-05",
      });
    }
  }
}
for (const unit of packs.get("en")!.units) {
  const originals = unit.tasks.filter(
    (task) =>
      task.stage === "retrieve" &&
      /Type (?:another |the )?model sentence:|State the rule for|Write the transfer model for|Repair this common error for/.test(
        task.prompt,
      ),
  );
  if (!originals.length) continue;
  const spec = specifications.get(unit.id);
  if (!spec) throw Error(`Missing specification ${unit.id}`);
  replace(
    unit,
    originals,
    "meaning-recall",
    "The old prompt exposed a model, asked for a rule rather than language use, or omitted the sentence to repair.",
    `${spec.use} Write one or two connected English sentences using ${unit.title}. Express ${spec.meaning}. Write the sentences themselves rather than a grammar rule or a claim about your ability. Choose your own details.`,
    null,
  );
}
function german(
  id: string,
  stage: "retrieve" | "repair",
  indices: number[],
  slug: string,
  reason: string,
  prompt: string,
  answers: string[] | null,
  kind: PracticeTask["responseKind"],
) {
  const unit = packs.get("de")!.units.find((unit) => unit.id === id)!;
  const written = indices.map((index) => {
    const task = unit.tasks.find(
      (task) => task.id === `${id}.${stage}.${index}.writing`,
    );
    if (!task) throw Error(`Missing original ${id}:${stage}:${index}`);
    return task;
  });
  const spoken = unit.tasks.filter(
    (task) =>
      task.stage === stage &&
      task.modality === "speaking" &&
      written.some((original) => task.prompt.endsWith(original.prompt)),
  );
  replace(unit, [...written, ...spoken], slug, reason, prompt, answers, kind);
}
const offTarget =
  "The blank tested an unrelated lexical word instead of the target construction.";
german(
  "de.c.002",
  "retrieve",
  [1],
  "haben-ich",
  offTarget,
  "Setze die passende Präsensform von haben ein. Schreibe den vollständigen Satz: Ich ___ heute Zeit.",
  ["Ich habe heute Zeit."],
  "cloze",
);
german(
  "de.c.002",
  "retrieve",
  [3],
  "haben-sie",
  offTarget,
  "Setze die passende Präsensform von haben ein. Schreibe den vollständigen Satz: Meine Nachbarin ___ einen Hund.",
  ["Meine Nachbarin hat einen Hund."],
  "cloze",
);
german(
  "de.c.012",
  "retrieve",
  [1],
  "koennen-ich",
  offTarget,
  "Setze die passende Präsensform von können ein. Schreibe den vollständigen Satz: Ich ___ ohne Hilfe schwimmen.",
  ["Ich kann ohne Hilfe schwimmen."],
  "cloze",
);
german(
  "de.c.012",
  "repair",
  [0, 99],
  "koennen-infinitiv",
  "The original correction added an adverb, while another prompt supplied only a solution fragment.",
  "Korrigiere nur die Verbform nach können. Behalte die Bedeutung bei und schreibe den vollständigen Satz: Ich kann schwimme.",
  ["Ich kann schwimmen."],
  "correction",
);
german(
  "de.c.022",
  "retrieve",
  [1],
  "weil-finite",
  offTarget,
  "Verbinde die Aussagen mit weil. Beginne mit Ich bleibe zu Hause. Grund: Ich bin krank. Schreibe einen vollständigen Satz.",
  ["Ich bleibe zu Hause, weil ich krank bin."],
  "transformation",
);
german(
  "de.c.022",
  "retrieve",
  [3],
  "weil-modal",
  offTarget,
  "Ergänze den Grund mit den Wörtern ich / morgen / arbeiten / muss. Beginne den Nebensatz mit ich, nenne dann morgen und setze das Modalverb ans Ende: Ich gehe früh schlafen, weil ___. Schreibe den vollständigen Satz.",
  ["Ich gehe früh schlafen, weil ich morgen arbeiten muss."],
  "cloze",
);
german(
  "de.c.031",
  "retrieve",
  [1],
  "relative-nominative",
  offTarget,
  "Ergänze das Relativpronomen. Der Mann hilft mir. Schreibe den vollständigen Satz: Das ist der Mann, ___ mir hilft.",
  ["Das ist der Mann, der mir hilft."],
  "cloze",
);
german(
  "de.c.031",
  "retrieve",
  [3],
  "relative-accusative",
  offTarget,
  "Ergänze das Relativpronomen. Ich sehe den Mann. Schreibe den vollständigen Satz: Das ist der Mann, ___ ich sehe.",
  ["Das ist der Mann, den ich sehe."],
  "cloze",
);
german(
  "de.c.031",
  "repair",
  [0, 99],
  "relative-repair",
  "The original accepted answer removed the antecedent and did not preserve the requested sentence.",
  "Korrigiere nur das Relativpronomen. Schreibe den vollständigen Satz: Das ist der Mann, der ich sehe.",
  ["Das ist der Mann, den ich sehe."],
  "correction",
);
german(
  "de.c.069",
  "retrieve",
  [1, 2],
  "nominalise",
  "The original blank was unrelated to nominalisation; its choice task contrasted grammatical sentences with unrelated meanings.",
  "Formuliere Wir analysierten die Daten mit einer Nominalisierung um. Erhalte Inhalt und Vergangenheitsbezug. Verschiedene passende Antworten sind möglich.",
  null,
  "transformation",
);
german(
  "de.c.069",
  "retrieve",
  [3],
  "verbalise",
  offTarget,
  "Formuliere mit einem Nebensatz und einem Verb statt nach der Analyse: Nach der Analyse der Daten veröffentlichten wir die Ergebnisse. Behalte Personen, Inhalt und zeitlichen Ablauf bei.",
  null,
  "transformation",
);
german(
  "de.c.069",
  "repair",
  [0, 99],
  "preserve-meaning",
  "The original task called a grammatical sentence incorrect and replaced it with an unrelated proposition.",
  "Eine Umformulierung hat die Bedeutung verändert. Ausgangssatz: Nach der Analyse der Daten veröffentlichten wir die Ergebnisse. Vorschlag: Wir veröffentlichten die Daten vor der Analyse der Ergebnisse. Schreibe eine bedeutungstreue Fassung mit einem Nebensatz und analysieren. Verschiedene passende Antworten sind möglich.",
  null,
  "correction",
);
german(
  "de.c.086",
  "retrieve",
  [2],
  "bracket-order",
  "Explanatory Nicht/Sondern notes and an incorrect example had been included as sentence tokens.",
  "Ordne die Teile zu einem Hauptsatz. Beginne mit Ich und verwende jeden Teil genau einmal: auf / Ich / um sieben Uhr / stehe.",
  ["Ich stehe um sieben Uhr auf."],
  "transformation",
);
german(
  "de.c.086",
  "retrieve",
  [3],
  "bracket-particle",
  "The original blank required reconstructing an explicitly incorrect form inside a teaching note.",
  "Ergänze die abgetrennte Partikel von aufstehen am Satzende. Schreibe den vollständigen Satz: Ich stehe um sieben Uhr ___.",
  ["Ich stehe um sieben Uhr auf."],
  "cloze",
);
german(
  "de.c.087",
  "retrieve",
  [2],
  "time-prepositions",
  "The original sentence tokens were fragments of an explanatory note rather than a sentence.",
  "Setze am und um an den passenden Stellen ein. Schreibe den vollständigen Satz: ___ Dienstag beginnt der Kurs ___ zehn Uhr.",
  ["Am Dienstag beginnt der Kurs um zehn Uhr."],
  "cloze",
);
german(
  "de.c.087",
  "retrieve",
  [3],
  "time-sequence",
  "The original blank tested the label Sondern rather than time or sequence.",
  "Der erste Schritt ist lesen, der zweite schreiben. Ergänze zuerst und danach, ohne die Reihenfolge zu ändern. Schreibe den vollständigen Satz: Ich lese ___ den Text und schreibe ___ eine Zusammenfassung.",
  ["Ich lese zuerst den Text und schreibe danach eine Zusammenfassung."],
  "cloze",
);
const data = {
  schemaVersion: 1,
  version: "2026-09-05.1",
  author: { kind: "model", humanReview: false },
  scope:
    "Targeted replacement of exposed/metalinguistic English recall and confirmed German prompt/answer defects; not a full linguistic review",
  references: [
    "https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/present-simple-be",
    "https://grammis.ids-mannheim.de/progr%40mm/6867",
    "https://grammis.ids-mannheim.de/systematische-grammatik/1241",
  ],
  revisions,
};
const output =
  process.argv.find((value) => value.startsWith("--output="))?.slice(9) ??
  "shared/learning-core/content/task-revisions.json";
await writeFile(output, JSON.stringify(data, null, 2) + "\n", { flag: "wx" });
console.log(
  JSON.stringify({
    units: revisions.length,
    retired: revisions.reduce((n, row) => n + row.retired.length, 0),
    added: revisions.reduce((n, row) => n + row.replacements.length, 0),
  }),
);
