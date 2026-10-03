import {
  activePracticeTasks,
  type CurriculumPack,
  type PracticeTask,
} from "../../shared/learning-core/src/automaticity/curriculum";

const revision = "2026-10-02.1";

/** Replace the legacy rule-recall fallback, preserving every historical definition. */
export function reviseVariationTasks(source: CurriculumPack): CurriculumPack {
  const pack = structuredClone(source);
  let changed = false;
  for (const unit of pack.units) {
    const active = activePracticeTasks(unit);
    const written = active.find(
      (task) =>
        task.id === `${unit.id}.vary.99.writing` &&
        task.partition === "practice" &&
        task.contentReview === "authored",
    );
    if (!written) continue;
    const example = unit.examples.find((value) => value.trim());
    if (!example) throw new Error(`A starting example is required: ${unit.id}`);
    const originals = [
      written,
      ...active.filter(
        (task) =>
          task.id === `${unit.id}.vary.98.speaking` &&
          task.prompt.endsWith(written.prompt) &&
          task.partition === "practice" &&
          task.contentReview === "authored",
      ),
    ];
    for (const original of originals) {
      const speaking = original.modality === "speaking";
      const prompt =
        pack.language === "en"
          ? `Practise “${unit.title}” by changing this example:\n${example}\n${speaking ? "Say and record" : "Write"} two new versions. In the first, change one detail, such as a person, action, object, place or time. In the second, change a different detail. Keep the target grammar pattern and adjust any words that must agree. Give the complete sentences themselves.`
          : `Übe „${unit.title}“, indem du dieses Beispiel veränderst:\n${example}\n${speaking ? "Sprich zwei neue Fassungen und nimm sie auf" : "Schreibe zwei neue Fassungen"}. Ändere in der ersten ein Detail, zum Beispiel eine Person, Handlung, Sache, einen Ort oder eine Zeitangabe. Ändere in der zweiten ein anderes Detail. Behalte das grammatische Muster bei und passe zusammengehörige Wörter an. Formuliere die vollständigen Sätze.`;
      const replacement: PracticeTask = {
        ...original,
        id: `${unit.id}.vary.pattern-20261002.${original.modality}`,
        version: revision,
        itemFamily: `${unit.id}.vary.pattern-20261002`,
        contextId: `${unit.id}.vary.pattern-20261002`,
        rubricVersion: "open-review-v1",
        prompt,
        answerPolicy: "open",
        responseKind: speaking ? "free_output" : "transformation",
        acceptedAnswers: [],
        solution: null,
        transferCondition: "none",
        sourceId: `authored-variation-revision-${revision}:${unit.id}`,
      };
      delete replacement.constructionAssessment;
      unit.tasks.splice(unit.tasks.indexOf(original) + 1, 0, replacement);
      unit.retiredTasks ??= [];
      unit.retiredTasks.push({
        taskId: original.id,
        replacementTaskId: replacement.id,
        reason:
          "Replace rule recall with two variations of a supplied sentence pattern.",
        retiredOn: "2026-10-02",
      });
      changed = true;
    }
  }
  if (changed) pack.version = revision;
  return pack;
}
