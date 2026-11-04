import {
  activePracticeTasks,
  type CurriculumPack,
  type PracticeTask,
} from "../../shared/learning-core/src/automaticity/curriculum";
import type { Stage } from "../../shared/learning-core/src/automaticity/contracts";
import {
  CONTROLLED_ERROR_FORMS,
  acceptedAnswerFingerprint,
  controlledErrorTaskId,
} from "../../shared/learning-core/src/controlled-error-forms";
import {
  LEARNING_CYCLES,
  LEARNING_CYCLE_VERSION,
} from "../../shared/learning-core/src/learning-cycles";

const stages: readonly Stage[] = [
  "notice",
  "retrieve",
  "vary",
  "produce",
  "repair",
  "transfer",
  "retain",
];
const purposes = {
  en: [
    "Interpret meaning and use from contrasting examples.",
    "Retrieve the practised form with a clear cue.",
    "Keep the pattern while changing people, words and situation.",
    "Express a personally meaningful message.",
    "Repair a definite error while preserving the facts.",
    "Practise a different communicative purpose in a new situation; human review is needed.",
    "Answer a fresh question; delayed recall requires actual elapsed time and exposure checks.",
  ],
  de: [
    "Bedeutung und Gebrauch an kontrastierenden Beispielen erklären.",
    "Die geübte Form mit klarer Vorgabe abrufen.",
    "Das Muster bei anderen Personen, Wörtern und Situationen verwenden.",
    "Eine eigene, persönlich bedeutsame Nachricht formulieren.",
    "Einen eindeutigen Fehler korrigieren und die Angaben bewahren.",
    "Einen anderen kommunikativen Zweck in einer neuen Situation üben; menschliche Prüfung ist nötig.",
    "Eine neue Frage beantworten; verzögertes Erinnern verlangt echte Zeitabstände und Expositionsprüfungen.",
  ],
};

export function applyLearningCycles(source: CurriculumPack): CurriculumPack {
  const pack = structuredClone(source);
  for (const spec of LEARNING_CYCLES.filter(
    (row) => row.language === source.language,
  )) {
    const unit = pack.units.find((row) => row.id === spec.constructionId);
    const controlled = CONTROLLED_ERROR_FORMS.find(
      (row) => row.constructionId === spec.constructionId,
    );
    if (!unit || !controlled)
      throw new Error(`Missing learning-cycle unit: ${spec.constructionId}`);
    const retrieve = activePracticeTasks(unit).find(
      (row) => row.id === controlledErrorTaskId(controlled.taskId),
    );
    if (
      !retrieve ||
      retrieve.stage !== "retrieve" ||
      retrieve.modality !== "writing" ||
      retrieve.partition !== "practice" ||
      retrieve.answerPolicy !== "closed" ||
      retrieve.prompt !== controlled.prompt ||
      acceptedAnswerFingerprint(retrieve.acceptedAnswers) !==
        acceptedAnswerFingerprint(controlled.acceptedAnswers)
    )
      throw new Error(
        `Changed learning-cycle retrieve scope: ${controlled.taskId}`,
      );
    const newTasks = stages
      .filter((stage) => stage !== "retrieve")
      .map((stage): PracticeTask => {
        const closed =
          stage === "vary"
            ? spec.vary
            : stage === "retain"
              ? spec.retain
              : null;
        const repair = stage === "repair";
        const prompt =
          stage === "notice"
            ? spec.notice
            : stage === "produce"
              ? spec.produce
              : stage === "transfer"
                ? spec.transfer
                : repair
                  ? (spec.language === "en"
                      ? "Repair this sentence without changing its facts: "
                      : "Korrigiere diesen Satz, ohne seine Angaben zu verändern: ") +
                    controlled.rejectedAnswers[0]!.answer
                  : closed!.prompt;
        return {
          id: `${unit.id}.cycle-202611042.${stage}.writing`,
          version: LEARNING_CYCLE_VERSION,
          constructionId: unit.id,
          familyId: retrieve.familyId,
          itemFamily: repair
            ? retrieve.itemFamily
            : `${unit.id}.cycle-202611042.${stage}`,
          contextId: repair
            ? retrieve.contextId
            : `${unit.id}.cycle-202611042.${stage}.context`,
          rubricVersion: "authored-learning-cycle-v1",
          stage,
          modality: "writing",
          partition: "practice",
          transferCondition: stage === "transfer" ? "elicited" : "none",
          contentReview: "authored",
          prompt,
          answerPolicy:
            repair || closed
              ? "closed"
              : stage === "notice"
                ? "reflection"
                : "open",
          responseKind: repair
            ? "correction"
            : stage === "notice"
              ? "reflection"
              : closed
                ? "transformation"
                : "free_output",
          acceptedAnswers: repair
            ? [...retrieve.acceptedAnswers]
            : [...(closed?.acceptedAnswers ?? [])],
          ...(repair
            ? {
                rejectedAnswers: controlled.rejectedAnswers.map((row) => ({
                  ...row,
                })),
              }
            : {}),
          hints: [],
          solution: repair
            ? retrieve.acceptedAnswers[0]!
            : closed
              ? closed.acceptedAnswers[0]!
              : null,
          normalisation: {
            nfc: true,
            whitespace: true,
            terminalFullStop: true,
            preserveCase: true,
          },
          sourceId: `authored-learning-cycle-${LEARNING_CYCLE_VERSION}:${unit.id}`,
        };
      });
    const metadata = {
      version: LEARNING_CYCLE_VERSION,
      goals: { ...spec.goals },
      steps: stages.map((stage, index) => ({
        stage,
        taskId:
          stage === "retrieve"
            ? retrieve.id
            : newTasks.find((row) => row.stage === stage)!.id,
        purpose: purposes[spec.language][index]!,
      })),
    };
    if (unit.learningCycle) {
      if (
        JSON.stringify(unit.learningCycle) !== JSON.stringify(metadata) ||
        newTasks.some(
          (task) =>
            !activePracticeTasks(unit).some((row) => row.id === task.id) ||
            JSON.stringify(unit.tasks.find((row) => row.id === task.id)) !==
              JSON.stringify(task),
        )
      )
        throw new Error(`Changed learning-cycle definition: ${unit.id}`);
      continue;
    }
    if (newTasks.some((task) => unit.tasks.some((row) => row.id === task.id)))
      throw new Error(`Conflicting learning-cycle tasks: ${unit.id}`);
    unit.tasks.push(...newTasks);
    unit.learningCycle = metadata;
  }
  if (pack.version < LEARNING_CYCLE_VERSION)
    pack.version = LEARNING_CYCLE_VERSION;
  return pack;
}
