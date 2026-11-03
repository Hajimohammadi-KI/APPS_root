import {
  activePracticeTasks,
  type CurriculumPack,
  type PracticeTask,
} from "../../shared/learning-core/src/automaticity/curriculum";

const version = "2026-10-31.1";
import { KNOWN_CONTENT_REPAIRS } from "../../shared/learning-core/src/content-repairs";
import {
  ACCEPTED_FORM_REVISIONS,
  ACCEPTED_FORM_VERSION,
  CHECKED_PRACTICE,
  CHECKED_PRACTICE_VERSION,
  CONTENT_REVISION,
  CONTENT_REVISION_VERSION,
  GAP_CUE_REVISIONS,
  DISTINCT_REVISIONS,
  GAP_CUE_VERSION,
  PARALLEL_PRACTICE_VERSION,
  RECALL_REVISIONS,
  RECALL_VERSION,
  UNIT_CONTENT_REVISIONS,
  retiredRepairPrompt,
  type RevisedTask,
} from "../../shared/learning-core/src/content-revisions";
import { normalizeText } from "../../shared/learning-core/src/text";
interface TargetPractice {
  unit: string;
  level: string;
  kind: "cloze" | "transformation";
  prompts: readonly [string, string];
  answers: readonly [string, string];
}
// Authored, bounded practice across A1–C2. These are not calibrated CEFR test
// items and cannot bypass independent content/evaluator qualification.
const practice: readonly TargetPractice[] = [
  {
    unit: "en.c.001",
    level: "A1",
    kind: "cloze",
    prompts: [
      "Complete with am, is or are. Write the full sentence: I ___ ready for the lesson.",
      "Complete with am, is or are. Write the full sentence: They ___ at the station.",
    ],
    answers: ["I am ready for the lesson.", "They are at the station."],
  },
  {
    unit: "en.c.015",
    level: "A2",
    kind: "cloze",
    prompts: [
      "Use the present continuous of study. Write the completed sentence: She ___ for her exam.",
      "Use the present continuous of prepare. Write the completed sentence: They ___ lunch right now.",
    ],
    answers: [
      "She is studying for her exam.",
      "They are preparing lunch right now.",
    ],
  },
  {
    unit: "en.c.034",
    level: "B1",
    kind: "cloze",
    prompts: [
      "Use will and stay. Write the completed conditional sentence: If it rains, we ___ at home.",
      "Use will and miss. Write the completed conditional sentence: Unless you hurry, you ___ the bus.",
    ],
    answers: [
      "If it rains, we will stay at home.",
      "Unless you hurry, you will miss the bus.",
    ],
  },
  {
    unit: "en.c.048",
    level: "B2",
    kind: "cloze",
    prompts: [
      "Use would and help in the third conditional. Write the full sentence: If I had known, I ___ you.",
      "Use would and catch in the third conditional. Write the full sentence: If she had left earlier, she ___ the train.",
    ],
    answers: [
      "If I had known, I would have helped you.",
      "If she had left earlier, she would have caught the train.",
    ],
  },
  {
    unit: "en.c.058",
    level: "C1",
    kind: "transformation",
    prompts: [
      "Keep the meaning. Rewrite without if, beginning Had: If I had known about the delay, I would have called.",
      "Keep the meaning. Rewrite without if, beginning Were: If she were to ask, I would agree.",
    ],
    answers: [
      "Had I known about the delay, I would have called.",
      "Were she to ask, I would agree.",
    ],
  },
  {
    unit: "en.c.072",
    level: "C2",
    kind: "transformation",
    prompts: [
      "Combine all three statements using Although and a relative clause beginning that. Keep their meaning: The data were limited. The pattern emerged. The pattern was consistent.",
      "Combine all three statements using Although and a relative clause beginning which. Keep their meaning: The study was small. Its method was transparent. Its method convinced the reviewers.",
    ],
    answers: [
      "Although the data were limited, the pattern that emerged was consistent.",
      "Although the study was small, its method, which was transparent, convinced the reviewers.",
    ],
  },
  {
    unit: "de.c.001",
    level: "A1",
    kind: "cloze",
    prompts: [
      "Ergänze die passende Form von sein und schreibe den ganzen Satz: Wir ___ bereit.",
      "Ergänze die passende Form von sein und schreibe den ganzen Satz: Du ___ heute pünktlich.",
    ],
    answers: ["Wir sind bereit.", "Du bist heute pünktlich."],
  },
  {
    unit: "de.c.015",
    level: "A2",
    kind: "cloze",
    prompts: [
      "Ergänze das Partizip II von kochen und schreibe den ganzen Satz: Ich habe gestern Suppe ___.",
      "Ergänze das Partizip II von schreiben und schreibe den ganzen Satz: Sie hat den Brief ___.",
    ],
    answers: [
      "Ich habe gestern Suppe gekocht.",
      "Sie hat den Brief geschrieben.",
    ],
  },
  {
    unit: "de.c.033",
    level: "B1",
    kind: "transformation",
    prompts: [
      "Formuliere denselben Wunsch mit würde und gern. Schreibe den ganzen Satz: Ich möchte gern nach Berlin reisen.",
      "Formuliere denselben Wunsch mit würden und gern. Schreibe den ganzen Satz: Wir möchten gern früher anfangen.",
    ],
    answers: [
      "Ich würde gern nach Berlin reisen.",
      "Wir würden gern früher anfangen.",
    ],
  },
  {
    unit: "de.c.043",
    level: "B2",
    kind: "cloze",
    prompts: [
      "Ergänze die passende Form von sein im Konjunktiv II der Vergangenheit und schreibe den ganzen Satz: Wenn ich Zeit gehabt hätte, ___ ich mitgekommen.",
      "Ergänze die passende Form von haben im Konjunktiv II der Vergangenheit und schreibe den ganzen Satz: Wenn sie geübt hätte, ___ sie den Test bestanden.",
    ],
    answers: [
      "Wenn ich Zeit gehabt hätte, wäre ich mitgekommen.",
      "Wenn sie geübt hätte, hätte sie den Test bestanden.",
    ],
  },
  {
    unit: "de.c.057",
    level: "C1",
    kind: "transformation",
    prompts: [
      "Gib Lenas Aussage in indirekter Rede mit Konjunktiv I wieder. Beginne mit Lena sagt, und verwende keinen dass-Satz: Lena sagt: Ich bin krank.",
      "Gib Toms Aussage in indirekter Rede mit Konjunktiv I wieder. Beginne mit Tom erklärt, und verwende keinen dass-Satz: Tom erklärt: Ich habe keine Zeit.",
    ],
    answers: ["Lena sagt, sie sei krank.", "Tom erklärt, er habe keine Zeit."],
  },
  {
    unit: "de.c.071",
    level: "C2",
    kind: "transformation",
    prompts: [
      "Formuliere dieselbe Möglichkeit mit könnte, ohne sie als Tatsache auszugeben: Die Maßnahme hat möglicherweise unbeabsichtigte Folgen.",
      "Formuliere dieselbe offene Möglichkeit mit Es wäre denkbar, dass: Es ist möglich, dass eine Änderung zusätzliche Kosten verursacht.",
    ],
    answers: [
      "Die Maßnahme könnte unbeabsichtigte Folgen haben.",
      "Es wäre denkbar, dass eine Änderung zusätzliche Kosten verursacht.",
    ],
  },
];

export function reviseMasteryContent(source: CurriculumPack): CurriculumPack {
  const pack = structuredClone(source);
  let changed = false;
  for (const spec of practice.filter((row) =>
    row.unit.startsWith(pack.language + "."),
  )) {
    const unit = pack.units.find((row) => row.id === spec.unit);
    if (!unit || unit.level !== spec.level)
      throw Error(`Changed target scope: ${spec.unit}`);
    const template = unit.tasks.find(
      (task) => task.modality === "writing" && task.partition === "practice",
    );
    if (!template) throw Error(`Missing written target: ${unit.id}`);
    for (let i = 0; i < 2; i++) {
      const id = `${unit.id}.retrieve.mastery-20261031-${i}.writing`;
      if (unit.tasks.some((task) => task.id === id)) continue;
      const task: PracticeTask = {
        ...template,
        id,
        version,
        itemFamily: `${unit.id}.mastery-20261031-${i}`,
        contextId: `${unit.id}.mastery-20261031-${i}`,
        rubricVersion: "closed-nfc-case-v1",
        stage: "retrieve",
        modality: "writing",
        partition: "practice",
        transferCondition: "none",
        contentReview: "authored",
        prompt: spec.prompts[i]!,
        answerPolicy: "closed",
        responseKind: spec.kind,
        acceptedAnswers: [spec.answers[i]!],
        solution: spec.answers[i]!,
        sourceId: `authored-target-practice-${version}:${unit.id}:${i}`,
      };
      delete task.constructionAssessment;
      unit.tasks.push(task);
      changed = true;
    }
  }
  const repair = KNOWN_CONTENT_REPAIRS.find(
    (row) => row.language === pack.language,
  )!;
  const repairUnit = pack.units.find(
    (unit) => unit.id === repair.constructionId,
  )!;
  repairUnit.commonError = `${repair.source} → ${repair.answer}`;
  for (const modality of ["writing", "speaking"] as const) {
    const original = activePracticeTasks(repairUnit).find(
      (task) =>
        task.id ===
        `${repairUnit.id}.repair.${modality === "writing" ? "0" : "98"}.${modality}`,
    );
    if (!original) continue;
    const id = `${repairUnit.id}.repair.mastery-20261031.${modality}`;
    const english = pack.language === "en";
    const prompt = repair.prompt;
    const answer = repair.answer;
    const replacement: PracticeTask = {
      ...original,
      id,
      version,
      itemFamily: `${repairUnit.id}.repair.mastery-20261031`,
      contextId: `${repairUnit.id}.repair.mastery-20261031`,
      contentReview: "authored",
      transferCondition: "none",
      prompt:
        modality === "speaking"
          ? (english
              ? "Say and record your answer. "
              : "Sprich deine Antwort und nimm sie auf. ") + prompt
          : prompt,
      answerPolicy: modality === "writing" ? "closed" : "open",
      responseKind: modality === "writing" ? "correction" : "free_output",
      acceptedAnswers: modality === "writing" ? [answer] : [],
      solution: modality === "writing" ? answer : null,
      sourceId: `authored-content-repair-${version}:${repairUnit.id}`,
    };
    delete replacement.constructionAssessment;
    repairUnit.tasks.push(replacement);
    repairUnit.retiredTasks ??= [];
    repairUnit.retiredTasks.push({
      taskId: original.id,
      replacementTaskId: id,
      reason:
        "Replace a non-sentence correction prompt or a grammatical assertion whose proposed correction changed its meaning.",
      retiredOn: "2026-10-31",
    });
    changed = true;
  }
  if (changed) pack.version = version;
  if (reviseUnitContent(pack)) pack.version = CONTENT_REVISION_VERSION;
  if (reviseAcceptedForms(pack)) pack.version = ACCEPTED_FORM_VERSION;
  if (
    reviseTasks(pack, GAP_CUE_REVISIONS, {
      version: GAP_CUE_VERSION,
      tag: "cues",
      source: "authored-gap-cue",
      reason:
        "Show a cue for the missing words; without one, many correct sentences fit the gap.",
    })
  )
    pack.version = GAP_CUE_VERSION;
  // The pack carries the latest content version applied.
  const latest = (applied: string | null | false) => {
    if (applied && applied > pack.version) pack.version = applied;
  };
  latest(addCheckedPractice(pack));
  latest(
    reviseTasks(pack, RECALL_REVISIONS, {
      version: RECALL_VERSION,
      tag: "recall",
      source: "authored-recall",
      reason:
        "Make the learner recall the form: the cue gave the answer away, the sentence repeated another item, or it hid words of the answer.",
      retiredOn: "2026-11-02",
      kind: (prompt) =>
        /^(?:Correct|Korrigiere)\b/u.test(prompt)
          ? "correction"
          : responseKindFor(prompt),
    }) && RECALL_VERSION,
  );
  latest(
    reviseTasks(pack, DISTINCT_REVISIONS, {
      version: PARALLEL_PRACTICE_VERSION,
      tag: "distinct",
      source: "authored-distinct",
      reason:
        "Replace an item that asked for the same sentence and answer as another item of the unit.",
      retiredOn: "2026-11-02",
      kind: (prompt) =>
        /^(?:Correct|Korrigiere)\b/u.test(prompt)
          ? "correction"
          : responseKindFor(prompt),
    }) && PARALLEL_PRACTICE_VERSION,
  );
  return pack;
}

/** Adds the authored checkable items as new retrieval tasks of their unit;
 * item N of a version is checks-<version>-N. Returns the latest version added. */
function addCheckedPractice(pack: CurriculumPack): string | null {
  let added: string | null = null;
  const rows = CHECKED_PRACTICE.filter((row) =>
    row.unit.startsWith(`${pack.language}.`),
  );
  for (const unit of pack.units) {
    const own = rows.filter((row) => row.unit === unit.id);
    if (!own.length) continue;
    const template = unit.tasks.find(
      (task) => task.modality === "writing" && task.partition === "practice",
    );
    if (!template) throw Error(`Missing written target: ${unit.id}`);
    const count = new Map<string, number>();
    for (const row of own) {
      const index = count.get(row.version) ?? 0;
      count.set(row.version, index + 1);
      const tag = `checks-${row.version.replace(/\D/gu, "")}`;
      const id = `${unit.id}.retrieve.${tag}-${index}.writing`;
      if (unit.tasks.some((task) => task.id === id)) continue;
      const task: PracticeTask = {
        ...template,
        id,
        version: row.version,
        itemFamily: `${unit.id}.${tag}-${index}`,
        contextId: `${unit.id}.${tag}-${index}`,
        rubricVersion: "closed-nfc-case-v1",
        stage: "retrieve",
        modality: "writing",
        partition: "practice",
        transferCondition: "none",
        contentReview: "authored",
        prompt: row.prompt,
        answerPolicy: "closed",
        responseKind: /_{2,}/u.test(row.prompt)
          ? "cloze"
          : /^(?:Correct|Korrigiere)\b/u.test(row.prompt)
            ? "correction"
            : "transformation",
        acceptedAnswers: [...row.answers],
        hints: [unit.rule],
        solution: row.answers[0]!,
        // The practice page finds the error-notebook items by this source.
        sourceId: row.notebook
          ? `learner-notebook-${row.version}:${unit.id}:${index}:${row.notebook}`
          : `authored-checked-practice-${row.version}:${unit.id}:${index}`,
      };
      delete task.constructionAssessment;
      delete task.rejectedAnswers;
      if (row.rejected?.length)
        task.rejectedAnswers = row.rejected.map((wrong) => ({ ...wrong }));
      unit.tasks.push(task);
      if (!added || row.version > added) added = row.version;
    }
  }
  return added;
}

/** Replaces each listed task with its authored revision as a new version;
 * spoken variants that repeat the written prompt move with it, and links to
 * earlier versions follow one hop. */
function reviseTasks(
  pack: CurriculumPack,
  revisions: readonly {
    readonly taskId: string;
    readonly prompt: string;
    readonly answers?: readonly string[];
  }[],
  options: {
    readonly version: string;
    readonly tag: string;
    readonly source: string;
    readonly reason: string;
    readonly retiredOn?: string;
    readonly kind?: (prompt: string) => PracticeTask["responseKind"];
  },
): boolean {
  let changed = false;
  const { version, source } = options;
  const suffix = `.${options.tag}-${version.replace(/\D/gu, "")}`;
  for (const revision of revisions) {
    if (!revision.taskId.startsWith(`${pack.language}.`)) continue;
    const unit = pack.units.find((row) =>
      revision.taskId.startsWith(`${row.id}.`),
    );
    const id = revision.taskId.replace(/\.writing$/u, `${suffix}.writing`);
    if (!unit || unit.tasks.some((task) => task.id === id)) continue;
    const active = activePracticeTasks(unit);
    const original = active.find((task) => task.id === revision.taskId);
    if (!original || original.answerPolicy !== "closed")
      throw Error(`Revision target not active: ${revision.taskId}`);
    const answers = revision.answers ?? original.acceptedAnswers;
    const replace = (task: PracticeTask, replacement: PracticeTask) => {
      unit.tasks.splice(unit.tasks.indexOf(task) + 1, 0, replacement);
      unit.retiredTasks ??= [];
      for (const retired of unit.retiredTasks)
        if (retired.replacementTaskId === task.id)
          retired.replacementTaskId = replacement.id;
      unit.retiredTasks.push({
        taskId: task.id,
        replacementTaskId: replacement.id,
        reason: options.reason,
        retiredOn: options.retiredOn ?? CONTENT_REVISION,
      });
    };
    for (const variant of active.filter(
      (task) =>
        task.modality === "speaking" &&
        task.stage === original.stage &&
        normalizeText(task.prompt).endsWith(normalizeText(original.prompt)),
    ))
      replace(variant, {
        ...variant,
        id: variant.id.replace(/\.speaking$/u, `${suffix}.speaking`),
        version,
        contentReview: "authored",
        prompt:
          (variant.prompt.endsWith(original.prompt)
            ? variant.prompt.slice(0, -original.prompt.length)
            : pack.language === "en"
              ? "Say and record your answer. "
              : "Sprich deine Antwort und nimm sie auf. ") + revision.prompt,
        sourceId: `${source}-${version}:${variant.id}`,
      });
    replace(original, {
      ...original,
      id,
      version,
      contentReview: "authored",
      ...(options.kind ? { responseKind: options.kind(revision.prompt) } : {}),
      prompt: revision.prompt,
      acceptedAnswers: [...answers],
      solution: answers[0]!,
      sourceId: `${source}-${version}:${original.id}`,
    });
    changed = true;
  }
  return changed;
}

/** Adds reviewed equivalent forms as a new version of each task. Links to
 * earlier versions follow one hop, so they move to the new version. */
function reviseAcceptedForms(pack: CurriculumPack): boolean {
  let changed = false;
  for (const revision of ACCEPTED_FORM_REVISIONS) {
    if (!revision.taskId.startsWith(`${pack.language}.`)) continue;
    const unit = pack.units.find((row) =>
      revision.taskId.startsWith(`${row.id}.`),
    );
    const id = revision.taskId.replace(
      /\.writing$/u,
      `.forms-${ACCEPTED_FORM_VERSION.replace(/\D/gu, "")}.writing`,
    );
    if (!unit || unit.tasks.some((task) => task.id === id)) continue;
    const original = activePracticeTasks(unit).find(
      (task) => task.id === revision.taskId,
    );
    if (!original || original.answerPolicy !== "closed")
      throw Error(`Accepted-form target not active: ${revision.taskId}`);
    const added = revision.answers.filter(
      (answer) =>
        !original.acceptedAnswers.some((known) => same(known, answer)),
    );
    if (!added.length) throw Error(`No new form for ${revision.taskId}`);
    unit.tasks.splice(unit.tasks.indexOf(original) + 1, 0, {
      ...original,
      id,
      version: ACCEPTED_FORM_VERSION,
      acceptedAnswers: [...original.acceptedAnswers, ...added],
      sourceId: `authored-accepted-forms-${ACCEPTED_FORM_VERSION}:${original.id}`,
    });
    unit.retiredTasks ??= [];
    for (const retired of unit.retiredTasks)
      if (retired.replacementTaskId === original.id)
        retired.replacementTaskId = id;
    unit.retiredTasks.push({
      taskId: original.id,
      replacementTaskId: id,
      reason: "Accept reviewed equivalent contracted or full forms.",
      retiredOn: CONTENT_REVISION,
    });
    changed = true;
  }
  return changed;
}

const tag = `content-${CONTENT_REVISION.replaceAll("-", "")}`;
const same = (a: string, b: string) => normalizeText(a) === normalizeText(b);
const responseKindFor = (prompt: string): PracticeTask["responseKind"] =>
  /_{2,}/u.test(prompt)
    ? "cloze"
    : /^Wähle\b/u.test(prompt)
      ? "choice"
      : "transformation";

/** Apply the authored 2026-11-01 revisions. Originals stay for saved attempts
 * and are retired with a link to their replacement; a second run changes nothing. */
function reviseUnitContent(pack: CurriculumPack): boolean {
  let changed = false;
  for (const revision of UNIT_CONTENT_REVISIONS.filter(
    (row) => row.language === pack.language,
  )) {
    const unit = pack.units.find((row) => row.id === revision.constructionId);
    if (!unit || unit.title !== revision.title)
      throw Error(`Changed revision scope: ${revision.constructionId}`);
    const active = activePracticeTasks(unit);
    // Speaking variants repeat the written prompt after an instruction to record.
    const spoken = (written: PracticeTask) =>
      active.filter(
        (task) =>
          task.modality === "speaking" &&
          task.stage === written.stage &&
          normalizeText(task.prompt).endsWith(normalizeText(written.prompt)),
      );
    const replace = (
      original: PracticeTask,
      id: string,
      revised: RevisedTask,
      responseKind: PracticeTask["responseKind"],
      reason: string,
    ) => {
      const speaking = original.modality === "speaking";
      const family = id.replace(/\.(?:writing|speaking)$/u, "");
      const replacement: PracticeTask = {
        ...original,
        id,
        version: CONTENT_REVISION_VERSION,
        itemFamily: family,
        contextId: family,
        contentReview: "authored",
        transferCondition: "none",
        prompt: revised.prompt,
        answerPolicy: speaking ? "open" : "closed",
        responseKind: speaking ? "free_output" : responseKind,
        acceptedAnswers: speaking
          ? []
          : [revised.answer, ...(revised.alternatives ?? [])],
        solution: speaking ? null : revised.answer,
        sourceId: `authored-content-revision-${CONTENT_REVISION_VERSION}:${unit.id}`,
      };
      delete replacement.constructionAssessment;
      unit.tasks.splice(unit.tasks.indexOf(original) + 1, 0, replacement);
      unit.retiredTasks ??= [];
      unit.retiredTasks.push({
        taskId: original.id,
        replacementTaskId: id,
        reason,
        retiredOn: CONTENT_REVISION,
      });
      changed = true;
    };
    const replaceWithSpoken = (
      written: PracticeTask,
      id: string,
      revised: RevisedTask,
      responseKind: PracticeTask["responseKind"],
      reason: string,
    ) => {
      for (const variant of spoken(written)) {
        const lead = variant.prompt.endsWith(written.prompt)
          ? variant.prompt.slice(0, -written.prompt.length)
          : pack.language === "en"
            ? "Say and record your answer. "
            : "Sprich deine Antwort und nimm sie auf. ";
        replace(
          variant,
          id.replace(/\.writing$/u, ".speaking"),
          { ...revised, prompt: lead + revised.prompt },
          responseKind,
          reason,
        );
      }
      replace(written, id, revised, responseKind, reason);
    };
    const repair = revision.repair;
    const repairId = `${unit.id}.repair.${tag}.writing`;
    if (
      repair &&
      !repair.labOnly &&
      !unit.tasks.some((t) => t.id === repairId)
    ) {
      const primary = retiredRepairPrompt(pack.language, repair.old);
      const matches = active.filter(
        (task) =>
          task.modality === "writing" &&
          task.answerPolicy === "closed" &&
          same(task.prompt, primary),
      );
      if (matches.length !== 1)
        throw Error(`Repair target not found once: ${unit.id} ${primary}`);
      replaceWithSpoken(
        matches[0]!,
        repairId,
        repair,
        repair.transformation ? "transformation" : "correction",
        "Replace a correction whose key was a fragment, placeholder or rule label, or whose prompt marked a rule statement as wrong.",
      );
    }
    if (repair) unit.commonError = `${repair.source} → ${repair.answer}`;
    if (revision.examples) unit.examples = [...revision.examples];
    for (const item of revision.retrieval ?? []) {
      const id = item.taskId.replace(
        /\.retrieve\.(\d+)\.writing$/u,
        `.retrieve.${tag}-$1.writing`,
      );
      if (id === item.taskId)
        throw Error(`Unexpected retrieval id: ${item.taskId}`);
      if (unit.tasks.some((task) => task.id === id)) continue;
      const original = active.find((task) => task.id === item.taskId);
      if (!original) throw Error(`Retrieval target not active: ${item.taskId}`);
      replaceWithSpoken(
        original,
        id,
        item,
        responseKindFor(item.prompt),
        "Replace a retrieval item built from a rule statement or note with practice of the target language.",
      );
    }
  }
  return changed;
}
