import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { reviseMasteryContent } from "./lib/mastery-content-revisions";
import { reviseVariationTasks } from "./lib/variation-revisions";
import { assessControlledTask } from "../shared/learning-core/src/automaticity/assessment";
import {
  activePracticeTasks,
  validateCurriculum,
  type CurriculumPack,
} from "../shared/learning-core/src/automaticity/curriculum";
import {
  auditClosedTask,
  auditGapCue,
  auditUnitAnswers,
  optionDistractors,
} from "../shared/learning-core/src/automaticity/curriculum-audit";
import {
  DISTINCT_REVISIONS,
  GAP_CUE_REVISIONS,
  RECALL_REVISIONS,
  checkedPracticeFor,
  gapCueRevisionsFor,
} from "../shared/learning-core/src/content-revisions";
import { gapFill, normalizeText } from "../shared/learning-core/src/text";
import { assertWritingPrecision } from "../shared/learning-core/src/writing-precision";
test("W33 both legacy labs use repaired prompts while raw historical catalogs remain intact", async () => {
  const english =
    await import("../Apps/English/English-Automaticity/packages/content/src/index");
  const german =
    await import("../Apps/Deutsch/Deutsch-Automaticity/packages/content/src/index");
  const en = english.grammarUnits.find(
    (unit) => unit.title === "Layered subordination",
  )!;
  const de = german.grammarUnits.find(
    (unit) => unit.title === "Feine Bedeutungsunterschiede im Modus",
  )!;
  expect(en.exercises[0]![0]).not.toContain(
    "Stacked clauses with unclear reference",
  );
  expect(en.commonError).toContain("pattern that emerge was");
  expect(de.exercises[0]![0]).not.toContain(
    "Die Maßnahme hat sicher keine Folgen",
  );
  expect(de.commonError).toContain("Es wären denkbar");
  expect(
    english.legacyGrammarUnits.find((unit) => unit.title === en.title)!
      .commonError,
  ).toBe("Stacked clauses with unclear reference.");
});
for (const language of ["en", "de"] as const)
  test(`W33 ${language}: preserve original definitions, replace invalid corrections, and add real target practice in A1–C2`, () => {
    const source = JSON.parse(
      readFileSync(
        new URL(
          `../shared/learning-core/content/curriculum-${language}.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    ) as CurriculumPack;
    const snapshot = JSON.stringify(source);
    const revised = reviseMasteryContent(source);
    expect(JSON.stringify(source)).toBe(snapshot);
    expect(validateCurriculum(revised)).toEqual([]);
    const retiredId =
      language === "en"
        ? "en.c.072.repair.0.writing"
        : "de.c.071.repair.0.writing";
    const old = source.units
      .flatMap((u) => u.tasks)
      .find((t) => t.id === retiredId)!;
    expect(
      revised.units.flatMap((u) => u.tasks).find((t) => t.id === retiredId),
    ).toEqual(old);
    expect(
      revised.units
        .flatMap(activePracticeTasks)
        .some((t) => t.id === retiredId),
    ).toBe(false);
    const added = revised.units
      .flatMap(activePracticeTasks)
      .filter((t) => t.id.includes("mastery-20261031"));
    for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
      const units = revised.units.filter((u) => u.level === level);
      expect(
        units
          .flatMap(activePracticeTasks)
          .filter(
            (t) => t.id.includes("mastery-20261031") && t.stage === "retrieve",
          ),
      ).toHaveLength(2);
    }
    for (const t of added) {
      expect(t.contentReview).toBe("authored");
      expect(t.transferCondition).toBe("none");
      expect(auditClosedTask(t).filter((i) => i.severity === "error")).toEqual(
        [],
      );
      expect(t.prompt.match(/___/g)?.length ?? 0).toBeLessThanOrEqual(1);
    }
    assertWritingPrecision(
      added.flatMap((t) => t.acceptedAnswers),
      language,
    );
    expect(JSON.stringify(reviseMasteryContent(revised))).toBe(
      JSON.stringify(revised),
    );
  });

const built = (language: "en" | "de") =>
  reviseMasteryContent(
    reviseVariationTasks(
      JSON.parse(
        readFileSync(
          new URL(
            `../shared/learning-core/content/curriculum-${language}.json`,
            import.meta.url,
          ),
          "utf8",
        ),
      ) as CurriculumPack,
    ),
  );
// Every definition shipped in 2026-10-31.1, sorted by id: learners' saved
// attempts point at these hashes, so a repair may only add and retire tasks.
const shippedDefinitions = {
  en: "8c7da4da64cc6784529319b4bb84eaaf158b64879f0067a27c5a6c3b7a313195",
  de: "e9d645004aff584bc2828b060dc09993655720753178b0b22af48cf6b0ce3a8c",
};
// Definitions published in 2026.11.01.1, and the accepted forms of 2026.11.01.2.
const releasedNovember = {
  en: "c5b92cd6333c6abdd8edd4d4c792bd1616f5a56b779168fb821f031749b57ea2",
  de: "464ab01e01b8d9c79c9a7530c559e250b150f800863e8973454153cb262ce43d",
};
const releasedForms = {
  en: "6bbe534ab49a4d8bacf37a97e9d72ba341b3d498f645990b7b91d20d8925f6d6",
  de: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
};
// Cued gaps and added checkable items published in 2026.11.01.4.
const releasedCuesAndChecks = {
  "2026-11-01.3": {
    en: "83ee5d284b99782e1c7dbef8cc391b5704a1309631d491ca8f7d7f8f964fb196",
    de: "2d8ac49ba28c92803d41ca644cda64bc6d8a45a21a96f43ded2c19d659ffa880",
  },
  "2026-11-01.4": {
    en: "cce86aa3069f899966c3385efdc6a614a7ce0590d730fc7acbdc25a8e3baa348",
    de: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  // Published in 2026.11.02.1.
  "2026-11-02.1": {
    en: "a1072288b12e27e5e20964aadd55b8dd19248575f5697a43ff6de3fe0b978ea9",
    de: "3829f5c674697eb227d085c1e72110215b9f5bafcc493dd9ad068f8a741634bd",
  },
  // The learner's error-notebook items, published in 2026.11.03.1.
  "2026-11-03.1": {
    en: "2c3a507ab5c09865d3221a4e726330e94b491af4eb5d11f180731556d1ecf659",
    de: "dad5d798d00ec6dc35b7d04872cd3613cdd95164bed3a2726a83e08c9a2cfb0a",
  },
} as const;
for (const language of ["en", "de"] as const) {
  test(`W33 ${language}: no active closed task in the built curriculum fails the content audit`, () => {
    const issues = built(language)
      .units.flatMap((unit) => [
        ...activePracticeTasks(unit).flatMap(auditClosedTask),
        ...activePracticeTasks(unit).flatMap((task) =>
          auditGapCue(task, language),
        ),
        ...auditUnitAnswers(unit, activePracticeTasks(unit)),
      ])
      .filter((issue) => issue.severity === "error");
    expect(issues).toEqual([]);
  });
  test(`W33 ${language}: repairs keep every earlier task definition byte-identical`, () => {
    const pack = built(language);
    const earlier = pack.units
      .flatMap((unit) => unit.tasks)
      .filter((task) => task.version < "2026-11-01")
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    expect(
      createHash("sha256")
        .update(earlier.map((task) => JSON.stringify(task)).join("\n"))
        .digest("hex"),
    ).toBe(shippedDefinitions[language]);
    const released = pack.units
      .flatMap((unit) => unit.tasks)
      .filter((task) => task.version === "2026-11-01.1")
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    expect(
      createHash("sha256")
        .update(released.map((task) => JSON.stringify(task)).join("\n"))
        .digest("hex"),
    ).toBe(releasedNovember[language]);
    const forms = pack.units
      .flatMap((unit) => unit.tasks)
      .filter((task) => task.version === "2026-11-01.2")
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    expect(
      createHash("sha256")
        .update(forms.map((task) => JSON.stringify(task)).join("\n"))
        .digest("hex"),
    ).toBe(releasedForms[language]);
    for (const [version, digests] of Object.entries(releasedCuesAndChecks)) {
      const tasks = pack.units
        .flatMap((unit) => unit.tasks)
        .filter((task) => task.version === version)
        .sort((a, b) => (a.id < b.id ? -1 : 1));
      expect(
        `${version}: ${createHash("sha256")
          .update(tasks.map((task) => JSON.stringify(task)).join("\n"))
          .digest("hex")}`,
      ).toBe(`${version}: ${digests[language]}`);
    }
    expect(validateCurriculum(pack)).toEqual([]);
  });
}
test("W33 every cued gap fits its stored answer, and offered options expose the wrong one", () => {
  const active = new Map(
    (["en", "de"] as const).flatMap((language) =>
      built(language)
        .units.flatMap(activePracticeTasks)
        .map((task) => [task.id, task] as const),
    ),
  );
  // A revision whose result was revised again is checked in its later form.
  const revisedAgain = new Set(
    [...RECALL_REVISIONS, ...DISTINCT_REVISIONS].map((row) => row.taskId),
  );
  for (const [revision, suffix] of [
    ...GAP_CUE_REVISIONS.map((row) => [row, ".cues-202611013"] as const),
    ...RECALL_REVISIONS.map((row) => [row, ".recall-202611021"] as const),
    ...DISTINCT_REVISIONS.map((row) => [row, ".distinct-202611022"] as const),
  ]) {
    const id = revision.taskId.replace(/\.writing$/u, `${suffix}.writing`);
    if (revisedAgain.has(id)) continue;
    const task = active.get(id);
    expect(`${id}: ${task?.prompt}`).toBe(`${id}: ${revision.prompt}`);
    if (/_{2,}/u.test(task!.prompt))
      expect(`${task!.id}: ${gapFill(task!.prompt, task!.solution!)}`).not.toBe(
        `${task!.id}: null`,
      );
    else expect(task!.responseKind).not.toBe("cloze");
    if (
      /\([^()]*\/[^()]*\)\s*$|\bwith [\p{L}’']+ or [\p{L}’']+:/u.test(
        task!.prompt,
      )
    )
      expect(`${task!.id}: ${optionDistractors(task!).length}`).not.toBe(
        `${task!.id}: 0`,
      );
  }
  const first = active.get("de.c.086.retrieve.1.cues-202611013.writing")!;
  expect(first.prompt).toEndWith(
    "Ich ___ jeden Morgen um sieben Uhr auf. (aufstehen)",
  );
  expect(first.acceptedAnswers).toEqual([
    "Ich stehe jeden Morgen um sieben Uhr auf.",
  ]);
  expect(
    [...active.values()].some(
      (task) =>
        task.modality === "speaking" &&
        task.id === "de.c.086.retrieve.98.cues-202611013.speaking" &&
        task.prompt.endsWith(first.prompt),
    ),
  ).toBe(true);
});
test("W33 every unit offers at least three checkable written items, and offered options expose the wrong one", () => {
  for (const language of ["en", "de"] as const) {
    const thin = built(language)
      .units.map((unit) => ({
        unit: unit.id,
        checkable: activePracticeTasks(unit).filter(
          (task) =>
            task.answerPolicy === "closed" &&
            task.modality === "writing" &&
            ![...auditClosedTask(task), ...auditGapCue(task, language)].some(
              (issue) => issue.severity === "error",
            ),
        ).length,
      }))
      .filter((row) => row.checkable < 3);
    expect(thin).toEqual([]);
    // Two items of one unit never ask for the same sentence: one sentence
    // practised as a correction, a gap and a choice counted three times.
    const repeated = built(language).units.flatMap((unit) => {
      const seen = new Set<string>();
      return activePracticeTasks(unit)
        .filter(
          (task) =>
            task.answerPolicy === "closed" && task.modality === "writing",
        )
        .flatMap((task) => {
          const key = normalizeText(task.acceptedAnswers[0]!, {
            allowOptionalFinalPeriod: true,
          }).toLocaleLowerCase(language);
          const twice = seen.has(key);
          seen.add(key);
          return twice ? [task.id] : [];
        });
    });
    expect(repeated).toEqual([]);
  }
  for (const task of (["en", "de"] as const).flatMap((language) =>
    built(language).units.flatMap(activePracticeTasks),
  ))
    if (
      task.modality === "writing" &&
      /\.(?:checks|recall|distinct)-2026/u.test(task.id)
    ) {
      expect(task.solution).toBe(task.acceptedAnswers[0]!);
      if (/_{2,}/u.test(task.prompt))
        expect(`${task.id}: ${gapFill(task.prompt, task.solution!)}`).not.toBe(
          `${task.id}: null`,
        );
      else expect(task.responseKind).not.toBe("cloze");
      if (
        /\([^()]*\/[^()]*\)\s*$|\bwith [\p{L}’']+ or [\p{L}’']+:/u.test(
          task.prompt,
        )
      )
        expect(`${task.id}: ${optionDistractors(task).length}`).not.toBe(
          `${task.id}: 0`,
        );
    }
});
test("W33 a gap that several words fill correctly names its meaning or options and accepts equal alternatives", () => {
  // Each of these prompts once held a bare sentence that other correct words
  // fill too ("The keys ___ be upstairs": must, might, may, can’t).
  const ambiguous = [
    "Complete the sentence: _____ coat is this?",
    "Complete the sentence: I have _____ questions.",
    "Complete the sentence: _____ people knew the answer.",
    "Complete the sentence: There is _____ milk left.",
    "Complete the sentence: We _____ work on Sundays.",
    "Complete the sentence: The film was _____ exciting.",
    "Complete the sentence: She has _____ ideas.",
    "Complete the sentence: I _____ swim when I was six.",
    "Complete the sentence: He _____ read the sign.",
    "Complete the sentence: Every summer, we _____ visit my aunt.",
    "Complete the sentence: She taught _____ Spanish.",
    "Complete the sentence: Do it _____ I showed you.",
    "Complete the sentence: He works _____ a designer.",
    "Complete the sentence: The new route is _____ shorter.",
    "Complete the sentence: I asked _____ the train had left.",
    "Complete the sentence: The keys _____ be upstairs.",
    ": ___ du mir helfen?",
    ": Ich ___ krank.",
    ": Du ___ hier parken.",
    ": ___ ich klein war, spielte ich oft draußen.",
    ": ___ ich Zeit habe, lese ich ein Buch.",
    ": ___ Haus wurde gebaut.",
    ": ___ es regnet, gehe ich raus.",
    ": Es regnet; ___ gehe ich raus.",
    ": Die Tür ___ geschlossen.",
    ": ___ Sie dies näher erläutern?",
    ": Die ___ veröffentlichte, mehrfach zitierte Studie bestätigt den langfristigen Effekt.",
    ": ___ habe—besser gesagt: ich hatte—bereits begonnen.",
    ": ___ lerne Deutsch, denn ich lebe in Berlin.",
    ": ___ fahre nicht, sondern ich gehe zu Fuß.",
    ": ___ versuche, früher aufzustehen.",
  ];
  const active = (["en", "de"] as const).flatMap((language) =>
    built(language).units.flatMap(activePracticeTasks),
  );
  expect(
    active
      .filter((task) =>
        ambiguous.some((prompt) =>
          prompt.startsWith(":")
            ? task.prompt.endsWith(prompt)
            : task.prompt === prompt,
        ),
      )
      .map((task) => task.id),
  ).toEqual([]);
  const accepts = (answer: string) =>
    active.some((task) =>
      task.acceptedAnswers.some(
        (accepted) =>
          normalizeText(accepted, { allowOptionalFinalPeriod: true }) ===
          normalizeText(answer, { allowOptionalFinalPeriod: true }),
      ),
    );
  for (const answer of [
    "I asked if the train had left.",
    "I was able to swim when I was six.",
    "Könntest du mir helfen?",
    "Der Zug hatte Verspätung; dennoch kam ich pünktlich an.",
    "Sie mag sowohl Tee wie auch Kaffee.",
  ])
    expect(`${answer} ${accepts(answer)}`).toBe(`${answer} true`);
});
test("W33 the complete corrected sentence earns the controlled pass, typed apostrophe included", () => {
  const sha = (text: string) => createHash("sha256").update(text).digest("hex");
  for (const [language, source, answer] of [
    ["de", "Das Buch liegt auf den Tisch.", "Das Buch liegt auf dem Tisch."],
    ["de", "Ich gehe in der Schule.", "Ich gehe in die Schule."],
    ["en", "I don’t have some time.", "I don't have any time."],
    ["en", "You’re ready, isn’t it?", "You're ready, aren't you?"],
    ["en", "I ___ ready for the lesson.", "I'm ready for the lesson."],
    ["en", "She doesn’t works.", "She does not work."],
    ["en", "I don’t have some time.", "I do not have any time."],
  ] as const) {
    const task = built(language)
      .units.flatMap(activePracticeTasks)
      .find(
        (row) =>
          row.answerPolicy === "closed" &&
          row.modality === "writing" &&
          row.prompt.includes(source),
      );
    expect(task?.prompt).toBeDefined();
    const verdict = assessControlledTask(
      {
        language,
        id: "attempt",
        task: { ...task! },
        response: { text: answer, sha256: sha(answer) },
      } as never,
      task!,
      "2026-11-01T10:00:00.000Z",
      "assessment",
    ).verdict;
    expect(`${source} → ${answer}: ${verdict}`).toBe(
      `${source} → ${answer}: pass`,
    );
    for (const wrong of [source, source.replace(/[.?]$/u, "")]) {
      const result = assessControlledTask(
        {
          language,
          id: "attempt",
          task: { ...task! },
          response: { text: wrong, sha256: sha(wrong) },
        } as never,
        task!,
        "2026-11-01T10:00:00.000Z",
        "assessment",
      );
      expect(result.verdict).not.toBe("pass");
    }
  }
});
test("W33 both Grammar Labs ship no defective closed exercise", async () => {
  const labs = [
    [
      "en",
      (
        await import("../Apps/English/English-Automaticity/packages/content/src/index")
      ).grammarUnits,
    ],
    [
      "de",
      (
        await import("../Apps/Deutsch/Deutsch-Automaticity/packages/content/src/index")
      ).grammarUnits,
    ],
  ] as const;
  const issues = labs.flatMap(([language, units]) =>
    units.flatMap((unit) =>
      unit.exercises.flatMap(([prompt, answer, metadata], index) => {
        // The Lab accepts the stored answer and its listed equivalents.
        const alternatives =
          (metadata as { acceptedAnswers?: readonly string[] } | undefined)
            ?.acceptedAnswers ?? [];
        const task = {
          id: `${unit.title}#${index}`,
          answerPolicy: "closed" as const,
          modality: "writing" as const,
          responseKind: /^(Correct|Repair|Korrigiere)/u.test(prompt)
            ? ("correction" as const)
            : ("transformation" as const),
          prompt,
          acceptedAnswers: [answer, ...alternatives],
          solution: answer,
        };
        return [...auditClosedTask(task), ...auditGapCue(task, language)];
      }),
    ),
  );
  expect(issues.filter((issue) => issue.severity === "error")).toEqual([]);
});
test("W33 the Labs find each gap-cue revision under its unit title and exercise number", () => {
  for (const language of ["en", "de"] as const) {
    const pack = built(language);
    const latest = new Map<string, (typeof GAP_CUE_REVISIONS)[number]>();
    for (const revision of [
      ...GAP_CUE_REVISIONS,
      ...RECALL_REVISIONS,
      ...DISTINCT_REVISIONS,
    ]) {
      const [, unit, index] =
        revision.taskId.match(
          /^(.+?)\.retrieve\.(?:content-\d+-)?(\d+)\.(?:(?:forms|cues|recall)-\d+\.)*writing$/u,
        ) ?? [];
      if (unit?.startsWith(`${language}.`))
        latest.set(`${unit}#${index}`, revision);
    }
    for (const [key, revision] of latest) {
      const [id, index] = key.split("#");
      const unit = pack.units.find((row) => row.id === id)!;
      expect(gapCueRevisionsFor(language, unit.title).get(Number(index))).toBe(
        revision,
      );
    }
    for (const unit of pack.units)
      expect(
        checkedPracticeFor(language, unit.title).map((row) => row.prompt),
      ).toEqual(
        activePracticeTasks(unit)
          .filter(
            (task) =>
              task.modality === "writing" && task.id.includes(".checks-"),
          )
          .map((task) => task.prompt),
      );
  }
});
