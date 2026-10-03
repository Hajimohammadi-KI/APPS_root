import type { Language, ReviewStatus, TaskIdentity } from "./contracts";
import type { RuleId } from "./construction-rules";
export const GRAMMAR_FAMILIES = [
  ["G01", "Basic clause structure", "Satzgrundstruktur"],
  ["G02", "Nouns and reference", "Nomen und Referenz"],
  ["G03", "Determiners", "Artikel und Determinierer"],
  ["G04", "Pronouns", "Pronomen"],
  ["G05", "Adjectives and adverbs", "Adjektive und Adverbien"],
  ["G06", "Present and past", "Gegenwart und Vergangenheit"],
  ["G07", "Future and temporal relations", "Zukunft und Zeitbezüge"],
  ["G08", "Verb patterns and valency", "Verbvalenz und Rektion"],
  ["G09", "Nonfinite constructions", "Infinitive und Partizipien"],
  ["G10", "Modality", "Modalität"],
  ["G11", "Voice and causation", "Passiv und Kausation"],
  ["G12", "Negation and questions", "Negation und Fragen"],
  ["G13", "Prepositions", "Präpositionen"],
  ["G14", "Clause linking", "Satzverknüpfung"],
  ["G15", "Relative clauses", "Relativsätze"],
  [
    "G16",
    "Conditionals and hypothetical meaning",
    "Konditionalsätze und Irreales",
  ],
  ["G17", "Reported language", "Indirekte Rede"],
  ["G18", "Information structure", "Informationsstruktur"],
  ["G19", "Cohesion and register", "Kohäsion und Register"],
  ["G20", "Advanced integration", "Komplexe Anwendung"],
  ["G21", "Orthography supporting grammar", "Grammatik und Rechtschreibung"],
] as const;
export type FamilyId = (typeof GRAMMAR_FAMILIES)[number][0];
export interface ConstructionMapping {
  id: string;
  language: Language;
  lessonAlias: string;
  lessonAliases?: string[];
  familyIds: FamilyId[];
  prerequisites: string[];
  review: ReviewStatus;
}
export interface PracticeTask extends TaskIdentity {
  constructionAssessment?: {
    rule: RuleId;
    version: string;
    scenario: 0 | 1;
    route: "bounded_rule" | "human_review";
  };
  prompt: string;
  answerPolicy: "closed" | "open" | "reflection";
  responseKind:
    | "cloze"
    | "correction"
    | "transformation"
    | "choice"
    | "free_output"
    | "reflection";
  acceptedAnswers: string[];
  hints: string[];
  solution: string | null;
  normalisation: {
    nfc: true;
    whitespace: true;
    terminalFullStop: boolean;
    preserveCase: true;
  };
  sourceId: string;
}
export interface ConstructionUnit {
  id: string;
  language: Language;
  title: string;
  level: string;
  familyIds: FamilyId[];
  prerequisites: string[];
  lessonAlias: string;
  lessonAliases?: string[];
  rule: string;
  examples: string[];
  commonError: string;
  review: ReviewStatus;
  sources: { title: string; url: string }[];
  tasks: PracticeTask[];
  retiredTasks?: {
    taskId: string;
    replacementTaskId: string;
    reason: string;
    retiredOn: string;
  }[];
}
/** Keep retired definitions available for old links and drafts, but never select them for new work. */
export function activePracticeTasks(unit: ConstructionUnit): PracticeTask[] {
  const retired = new Set(unit.retiredTasks?.map((row) => row.taskId) ?? []);
  return unit.tasks.filter((task) => !retired.has(task.id));
}
export interface CurriculumPack {
  version: string;
  language: Language;
  units: ConstructionUnit[];
  mappingVersion: string;
}

export function validateCurriculum(pack: CurriculumPack): string[] {
  const issues: string[] = [];
  const ids = new Set<string>(),
    taskIds = new Set<string>();
  const families = new Set<string>(GRAMMAR_FAMILIES.map(([id]) => id));
  for (const unit of pack.units) {
    if (ids.has(unit.id)) issues.push(`Duplicate construction ${unit.id}`);
    ids.add(unit.id);
    if (
      !unit.lessonAlias ||
      unit.lessonAliases?.some(
        (alias) => typeof alias !== "string" || !alias.trim(),
      )
    )
      issues.push(`Invalid lesson alias ${unit.id}`);
    if (unit.language !== pack.language)
      issues.push(`Wrong language ${unit.id}`);
    if (
      !unit.familyIds.length ||
      unit.familyIds.some((id) => !families.has(id))
    )
      issues.push(`Missing/invalid family ${unit.id}`);
    for (const task of unit.tasks) {
      if (taskIds.has(task.id)) issues.push(`Duplicate task ${task.id}`);
      taskIds.add(task.id);
      if (task.constructionId !== unit.id)
        issues.push(`Task mapping mismatch ${task.id}`);
      if (task.answerPolicy === "closed" && !task.acceptedAnswers.length)
        issues.push(`Closed task has no accepted form ${task.id}`);
      if (task.answerPolicy !== "closed" && task.acceptedAnswers.length)
        issues.push(`Open task must not use exact-string grading ${task.id}`);
      if (
        task.partition === "evaluation" &&
        task.contentReview !== "human_reviewed"
      )
        issues.push(`Unreviewed evaluation task ${task.id}`);
    }
    const retiredIds = new Set<string>();
    for (const retired of unit.retiredTasks ?? []) {
      const original = unit.tasks.find((task) => task.id === retired.taskId);
      const replacement = unit.tasks.find(
        (task) => task.id === retired.replacementTaskId,
      );
      if (
        retiredIds.has(retired.taskId) ||
        !original ||
        !replacement ||
        original.id === replacement.id ||
        original.stage !== replacement.stage ||
        original.modality !== replacement.modality ||
        !retired.reason?.trim() ||
        !/^\d{4}-\d{2}-\d{2}$/.test(retired.retiredOn) ||
        unit.retiredTasks?.some((row) => row.taskId === replacement.id)
      )
        issues.push(`Invalid retired task ${unit.id}:${retired.taskId}`);
      retiredIds.add(retired.taskId);
    }
  }
  const visiting = new Set<string>(),
    visited = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) {
      issues.push(`Prerequisite cycle ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    const unit = pack.units.find((row) => row.id === id);
    for (const prerequisite of unit?.prerequisites ?? []) {
      if (!ids.has(prerequisite))
        issues.push(`Missing prerequisite ${prerequisite}`);
      else visit(prerequisite);
    }
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of ids) visit(id);
  return issues;
}

/** A lesson can teach several constructions; a construction can span lessons. */
export function constructionsForLesson(
  pack: CurriculumPack,
  alias: string,
): ConstructionUnit[] {
  return pack.units.filter(
    (unit) => unit.lessonAlias === alias || unit.lessonAliases?.includes(alias),
  );
}
