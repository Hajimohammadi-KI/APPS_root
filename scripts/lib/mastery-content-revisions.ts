import {
  activePracticeTasks,
  type CurriculumPack,
  type PracticeTask,
} from "../../shared/learning-core/src/automaticity/curriculum";

const version = "2026-10-31.1";
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
  const repairUnit = pack.units.find(
    (unit) => unit.id === (pack.language === "en" ? "en.c.072" : "de.c.071"),
  )!;
  repairUnit.commonError =
    pack.language === "en"
      ? "Although the data were limited, the pattern that emerge was consistent. → Although the data were limited, the pattern that emerged was consistent."
      : "Es wären denkbar, dass die Maßnahme unbeabsichtigte Folgen hat. → Es wäre denkbar, dass die Maßnahme unbeabsichtigte Folgen hat.";
  for (const modality of ["writing", "speaking"] as const) {
    const original = activePracticeTasks(repairUnit).find(
      (task) =>
        task.id ===
        `${repairUnit.id}.repair.${modality === "writing" ? "0" : "98"}.${modality}`,
    );
    if (!original) continue;
    const id = `${repairUnit.id}.repair.mastery-20261031.${modality}`;
    const english = pack.language === "en";
    const prompt = english
      ? "Correct only the verb form and keep the meaning: Although the data were limited, the pattern that emerge was consistent."
      : "Korrigiere nur die Verbform im Hauptsatz und behalte die Bedeutung bei: Es wären denkbar, dass die Maßnahme unbeabsichtigte Folgen hat.";
    const answer = english
      ? "Although the data were limited, the pattern that emerged was consistent."
      : "Es wäre denkbar, dass die Maßnahme unbeabsichtigte Folgen hat.";
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
  return pack;
}
