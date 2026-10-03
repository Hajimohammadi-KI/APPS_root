import { createHash } from "node:crypto";
import type {
  CurriculumPack,
  ConstructionUnit,
  PracticeTask,
} from "../../shared/learning-core/src/automaticity/curriculum";
import { activePracticeTasks, validateCurriculum } from "../../shared/learning-core/src/automaticity/curriculum";

export const STAGES = [
  "notice",
  "retrieve",
  "vary",
  "produce",
  "repair",
  "transfer",
  "retain",
] as const;
export const MODES = ["writing", "speaking"] as const;
export const TASK_TYPES = [
  "comprehension",
  "recall",
  "correction",
  "transformation",
  "constrained_production",
  "free_production",
  "interaction",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];
export type Mode = (typeof MODES)[number];
export interface Specification {
  id: string;
  form: string;
  meaning: string;
  use: string;
  contrast: string;
  alternatives: string;
}
export interface Reference {
  id: string;
  title: string;
  url: string;
  access: string;
  topics: string;
}
export interface FamilyAudit {
  language: string;
  family: string;
  references: string[];
  decision: string;
  gaps: string[];
}
export interface Lesson {
  id: string;
  language: string;
  title: string;
  level: string;
  aliases: string[];
  sha256: string;
}
export interface Construction extends Specification {
  language: string;
  title: string;
  level: string | null;
  familyIds: string[];
  kind: "existing_unit" | "additional_target" | "missing_target";
  lessonLinks: {
    id: string;
    relationship: "primary" | "reinforcement" | "partial_only";
  }[];
  prerequisites: {
    hard: { id: string; reason: string }[];
    suggested: { id: string; reason: string }[];
  };
  review: {
    kind: "model_authored";
    reviewerId: string;
    role: string;
    date: string;
    humanApproved: false;
  };
  references: string[];
  examples: string[];
  applicability: Record<
    Mode,
    { required: boolean; reason: string | null; referenceId: string | null }
  >;
}
export interface ScopeInput {
  specifications: Specification[];
  additions: (Specification & {
    family: string;
    title: string;
    related: string[];
  })[];
  familyAudit: FamilyAudit[];
  references: Reference[];
  packs: CurriculumPack[];
  baseline: Lesson[];
  reinforcements: string[][];
  date: string;
}
export const hash = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
export const canonical = (value: unknown): string => JSON.stringify(value);
export function rows(text: string, columns: number): string[][] {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line, i) => {
      const values = line.split("|").map((value) => value.trim());
      if (values.length !== columns)
        throw new Error(`Expected ${columns} columns at data row ${i + 1}`);
      return values;
    });
}
export function specification(values: string[]): Specification {
  const [id, form, meaning, use, contrast, alternatives] = values;
  if (
    ![id, form, meaning, use, contrast, alternatives].every((value) =>
      value?.trim(),
    )
  )
    throw new Error("Incomplete construction specification");
  return {
    id: id!,
    form: form!,
    meaning: meaning!,
    use: use!,
    contrast: contrast!,
    alternatives: alternatives!,
  };
}
export function lesson(unit: ConstructionUnit): Lesson {
  return {
    id: unit.id,
    language: unit.language,
    title: unit.title,
    level: unit.level,
    aliases: [...new Set([unit.lessonAlias, ...(unit.lessonAliases ?? [])])],
    sha256: hash(canonical(unit)),
  };
}
function unique(values: string[], message: string) {
  if (new Set(values).size !== values.length) throw new Error(message);
}
export function validatePrerequisites(inventory: Construction[]): void {
  const byId = new Map(inventory.map((row) => [row.id, row]));
  for (const row of inventory)
    for (const type of ["hard", "suggested"] as const) {
      unique(
        row.prerequisites[type].map((edge) => edge.id),
        `Duplicate ${type} prerequisite: ${row.id}`,
      );
      for (const edge of row.prerequisites[type]) {
        if (
          !byId.has(edge.id) ||
          !edge.reason.trim() ||
          edge.id === row.id ||
          byId.get(edge.id)!.language !== row.language
        )
          throw new Error(`Invalid ${type} prerequisite: ${row.id}`);
        if (
          type === "hard" &&
          row.prerequisites.suggested.some((other) => other.id === edge.id)
        )
          throw new Error(`Ambiguous prerequisite: ${row.id}`);
      }
    }
  const active = new Set<string>(),
    done = new Set<string>();
  const visit = (id: string) => {
    if (active.has(id)) throw new Error(`Hard prerequisite cycle: ${id}`);
    if (done.has(id)) return;
    active.add(id);
    for (const edge of byId.get(id)!.prerequisites.hard) visit(edge.id);
    active.delete(id);
    done.add(id);
  };
  for (const id of byId.keys()) visit(id);
}
export function buildInventory(input: ScopeInput): Construction[] {
  if (
    input.packs.length !== 2 ||
    new Set(input.packs.map((pack) => pack.language)).size !== 2 ||
    input.packs.some((pack) => !["en", "de"].includes(pack.language))
  )
    throw new Error("Both language packs are required");
  for (const pack of input.packs) {
    const issues = validateCurriculum(pack);
    if (issues.length) throw new Error(issues.join("\n"));
    for (const unit of pack.units)
      for (const task of unit.tasks) {
        if (
          !STAGES.includes(task.stage) ||
          !MODES.includes(task.modality) ||
          !task.version?.trim() ||
          !unit.familyIds.includes(
            task.familyId as (typeof unit.familyIds)[number],
          ) ||
          !task.itemFamily?.trim() ||
          !task.contextId?.trim() ||
          !task.rubricVersion?.trim()
        )
          throw new Error(`Invalid/stale task identity: ${task.id}`);
      }
  }
  const units = input.packs.flatMap((pack) => pack.units),
    live = units.map(lesson);
  unique(
    live.map((row) => row.id),
    "Duplicate live lesson ID",
  );
  unique(
    input.baseline.map((row) => row.id),
    "Duplicate baseline ID",
  );
  for (const [language, minimum] of [
    ["en", 112],
    ["de", 144],
  ] as const)
    if (
      input.baseline.filter((row) => row.language === language).length < minimum
    )
      throw new Error(`Incomplete migration baseline: ${language}`);
  for (const original of input.baseline) {
    const current = live.find((row) => row.id === original.id);
    if (
      !current ||
      current.language !== original.language ||
      original.aliases.some((alias) => !current.aliases.includes(alias))
    )
      throw new Error(`Lost original lesson/alias: ${original.id}`);
  }
  unique(
    input.references.map((row) => row.id),
    "Duplicate reference ID",
  );
  for (const source of input.references)
    if (
      !/^https:\/\//.test(source.url) ||
      !source.title.trim() ||
      !source.topics.trim() ||
      !["page", "search-index", "pdf"].includes(source.access)
    )
      throw new Error(`Invalid reference: ${source.id}`);
  const knownRefs = new Set(input.references.map((row) => row.id));
  unique(
    input.familyAudit.map((row) => `${row.language}:${row.family}`),
    "Duplicate family audit",
  );
  for (const language of ["en", "de"])
    for (let i = 1; i <= 21; i++) {
      const id = `G${String(i).padStart(2, "0")}`;
      const audit = input.familyAudit.find(
        (row) => row.language === language && row.family === id,
      );
      if (
        !audit ||
        !audit.decision.trim() ||
        !audit.references.length ||
        audit.references.some((ref) => !knownRefs.has(ref))
      )
        throw new Error(`Missing reference audit: ${language}:${id}`);
    }
  if (input.familyAudit.length !== 42)
    throw new Error("Unexpected family audit rows");
  unique(
    input.specifications.map((row) => row.id),
    "Duplicate specification ID",
  );
  if (input.additions.some(row => input.specifications.some(spec => spec.id === row.id)))
    throw new Error("Reused construction ID");
  if (input.specifications.length !== units.filter(unit=>!input.additions.some(row=>row.id===unit.id)).length)
    throw new Error("Missing/orphan existing specification");
  for (const group of input.reinforcements) {
    unique(group, "Duplicate reinforcement member");
    if (
      group.length < 2 ||
      group.some((id) => !units.some((unit) => unit.id === id)) ||
      new Set(group.map((id) => id.slice(0, 2))).size !== 1
    )
      throw new Error("Invalid reinforcement group");
  }
  const all = [
    ...units.filter(unit=>!input.additions.some(row=>row.id===unit.id)).map((unit) => {
      const spec = input.specifications.find((row) => row.id === unit.id);
      if (!spec) throw new Error(`Missing specification: ${unit.id}`);
      return {
        spec,
        unit,
        title: unit.title,
        families: unit.familyIds as string[],
        related: [] as string[],
      };
    }),
    ...input.additions.map((spec) => ({
      spec,
      unit: units.find(unit=>unit.id===spec.id),
      title: spec.title,
      families: [spec.family],
      related: spec.related,
    })),
  ];
  unique(
    all.map((row) => row.spec.id),
    "Reused construction ID",
  );
  const inventory = all.map(
    ({ spec, unit, title, families, related }): Construction => {
      specification([
        spec.id,
        spec.form,
        spec.meaning,
        spec.use,
        spec.contrast,
        spec.alternatives,
      ]);
      const language = spec.id.slice(0, 2);
      if (
        !/^(en|de)\.c\.\d{3}$/.test(spec.id) ||
        (unit && unit.language !== language)
      )
        throw new Error(`Invalid construction ID: ${spec.id}`);
      const audits = families.map((family) =>
        input.familyAudit.find(
          (row) => row.language === language && row.family === family,
        ),
      );
      if (!families.length || audits.some((row) => !row))
        throw new Error(`Invalid family: ${spec.id}`);
      for (const id of related)
        if (!units.some((row) => row.id === id && row.language === language))
          throw new Error(`Unknown partial lesson: ${id}`);
      const peers = input.reinforcements
        .filter((group) => group.includes(spec.id))
        .flat()
        .filter((id) => id !== spec.id);
      return {
        ...spec,
        language,
        title,
        level: unit?.level ?? null,
        familyIds: families,
        kind: unit ? input.additions.some(row=>row.id===spec.id) ? "additional_target" : "existing_unit" : "missing_target",
        lessonLinks: unit
          ? [
              { id: unit.id, relationship: "primary" },
              ...related.map(id=>({id,relationship:"partial_only" as const})),
              ...[...new Set(peers)].map((id) => ({
                id,
                relationship: "reinforcement" as const,
              })),
            ]
          : related.map((id) => ({ id, relationship: "partial_only" })),
        prerequisites: {
          hard: [],
          suggested: (unit?.prerequisites ?? []).map((id) => ({
            id,
            reason:
              "Retained legacy teaching-order suggestion; no mandatory learner gate has been established.",
          })),
        },
        review: {
          kind: "model_authored",
          reviewerId: "codex",
          role: "automated curriculum specification author",
          date: input.date,
          humanApproved: false,
        },
        references: [...new Set(audits.flatMap((row) => row!.references))],
        examples: unit?.examples ?? [],
        applicability: {
          writing: { required: true, reason: null, referenceId: null },
          speaking: ["en.c.124", "de.c.156"].includes(spec.id)
            ? {
                required: false,
                reason:
                  "This target is the graphic spelling of a form. Spoken production cannot demonstrate the written letter or word-boundary choice; an oral explanation tests a different target.",
                referenceId: language === "en" ? "en-spelling" : "de-writing",
              }
            : { required: true, reason: null, referenceId: null },
        },
      };
    },
  );
  for (const audit of input.familyAudit)
    for (const id of audit.gaps)
      if (
        !inventory.some(
          (row) =>
            row.id === id &&
            row.kind !== "existing_unit" &&
            row.language === audit.language &&
            row.familyIds.includes(audit.family),
        )
      )
        throw new Error(`Unaccounted reference omission: ${id}`);
  for (const added of input.additions)
    if (!input.familyAudit.some((row) => row.gaps.includes(added.id)))
      throw new Error(`Unaudited addition: ${added.id}`);
  validatePrerequisites(inventory);
  validateApplicability(inventory, knownRefs);
  return inventory;
}
export function validateApplicability(
  inventory: Construction[],
  knownRefs: Set<string>,
): void {
  for (const row of inventory)
    for (const mode of MODES) {
      const policy = row.applicability[mode];
      if (!policy || typeof policy.required !== "boolean")
        throw new Error(`Missing applicability: ${row.id}:${mode}`);
      if (
        !policy.required &&
        (mode !== "speaking" ||
          !["en.c.124", "de.c.156"].includes(row.id) ||
          !policy.reason?.trim() ||
          !policy.referenceId ||
          !knownRefs.has(policy.referenceId))
      )
        throw new Error(`Unsupported N/A: ${row.id}:${mode}`);
      if (
        policy.required &&
        (policy.reason !== null || policy.referenceId !== null)
      )
        throw new Error(`Contradictory applicability: ${row.id}:${mode}`);
    }
}
export interface PartitionItem {
  id: string;
  language: string;
  partition: PracticeTask["partition"];
  templateFamily: string;
  scenarioFamily: string;
  contentFingerprints: string[];
  exposed: boolean;
}
/** Connected template/scenario/content families are indivisible across held-out and learning sets. */
export function selectPracticePartition(items: PartitionItem[]): {
  selected: string[];
  quarantined: string[];
} {
  unique(
    items.map((row) => row.id),
    "Duplicate partition task ID",
  );
  const byKey = new Map<string, string[]>(),
    byId = new Map(items.map((row) => [row.id, row]));
  for (const row of items) {
    if (
      !["en", "de"].includes(row.language) ||
      !["teaching", "practice", "calibration", "evaluation"].includes(
        row.partition,
      ) ||
      !row.id ||
      !row.templateFamily ||
      !row.scenarioFamily ||
      typeof row.exposed !== "boolean" ||
      !row.contentFingerprints.length ||
      row.contentFingerprints.some((hash) => !/^[a-f0-9]{64}$/.test(hash))
    )
      throw new Error(`Invalid partition identity: ${row.id}`);
    for (const key of [
      `t:${row.templateFamily}`,
      `s:${row.scenarioFamily}`,
      ...row.contentFingerprints.map((hash) => `c:${hash}`),
    ]) {
      // Family identifiers are global: translated variants must share family IDs.
      // Literal content hashes are language-scoped to avoid unrelated homographs.
      const scoped = key.startsWith("c:") ? `${row.language}:${key}` : key;
      byKey.set(scoped, [...(byKey.get(scoped) ?? []), row.id]);
    }
  }
  const links = new Map(items.map((row) => [row.id, new Set<string>()]));
  for (const group of byKey.values())
    for (const id of group) for (const peer of group) links.get(id)!.add(peer);
  const visited = new Set<string>(),
    quarantined = new Set<string>();
  for (const item of items) {
    if (visited.has(item.id)) continue;
    const component: string[] = [],
      queue = [item.id];
    while (queue.length) {
      const id = queue.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      component.push(id);
      for (const peer of links.get(id)!)
        if (!visited.has(peer)) queue.push(peer);
    }
    const heldOut = component.some((id) =>
      ["calibration", "evaluation"].includes(byId.get(id)!.partition),
    );
    const leaked = component.some(
      (id) =>
        byId.get(id)!.exposed ||
        ["practice", "teaching"].includes(byId.get(id)!.partition),
    );
    const mixedHeldOut =
      component.some((id) => byId.get(id)!.partition === "calibration") &&
      component.some((id) => byId.get(id)!.partition === "evaluation");
    if ((heldOut && leaked) || mixedHeldOut)
      component.forEach((id) => quarantined.add(id));
  }
  return {
    selected: items
      .filter((row) => row.partition === "practice" && !quarantined.has(row.id))
      .map((row) => row.id)
      .sort(),
    quarantined: [...quarantined].sort(),
  };
}
export function taskType(task: PracticeTask): TaskType {
  if (task.answerPolicy === "reflection" || task.responseKind === "choice")
    return "comprehension";
  if (task.responseKind === "correction") return "correction";
  if (task.responseKind === "transformation") return "transformation";
  if (task.responseKind === "cloze") return "constrained_production";
  return ["retrieve", "retain"].includes(task.stage)
    ? "recall"
    : "free_production";
}
export function partitionItem(
  task: PracticeTask,
  language: string,
): PartitionItem {
  const normalise = (text: string) =>
    text
      .normalize("NFC")
      .replace(/\s+/gu, " ")
      .trim()
      .toLocaleLowerCase(language);
  return {
    id: task.id,
    language,
    partition: task.partition,
    templateFamily: task.itemFamily,
    scenarioFamily: task.contextId,
    contentFingerprints: [
      ...new Set(
        [task.prompt, task.solution, ...task.acceptedAnswers]
          .filter((text): text is string => !!text?.trim())
          .map((text) => hash(normalise(text))),
      ),
    ],
    exposed: task.partition === "teaching",
  };
}

export function validateGeneratedPractice(
  packs: CurriculumPack[],
  protectedItems: PartitionItem[],
) {
  const items = packs.flatMap((pack) =>
    pack.units.flatMap((unit) =>
      unit.tasks.map((task) => partitionItem(task, pack.language)),
    ),
  );
  if (items.some((row) => !["teaching", "practice"].includes(row.partition)))
    throw new Error(
      "Learner curriculum contains held-out calibration/evaluation material",
    );
  if (
    protectedItems.some(
      (row) => !["calibration", "evaluation"].includes(row.partition),
    )
  )
    throw new Error("Protected registry contains a learning item");
  const selection = selectPracticePartition([...items, ...protectedItems]);
  if (selection.quarantined.length)
    throw new Error(
      `Leaked evaluation families: ${selection.quarantined.join(",")}`,
    );
  return { items, selection };
}
export function buildCoverage(
  inventory: Construction[],
  packs: CurriculumPack[],
) {
  return inventory.flatMap((row) =>
    STAGES.flatMap((stage) =>
      MODES.map((mode) => {
        const pack = packs.find((pack) => pack.language === row.language)!;
        const unit = pack.units.find((unit) => unit.id === row.id);
        const tasks =
          (unit ? activePracticeTasks(unit) : []).filter(
            (task) => task.stage === stage && task.modality === mode,
          ) ?? [];
        const required = row.applicability[mode].required;
        return {
          id: `${row.id}:${stage}:${mode}`,
          constructionId: row.id,
          language: row.language,
          stage,
          modality: mode,
          required,
          naReason: row.applicability[mode].reason,
          referenceIds: row.references,
          contentVersion: pack.version,
          mappingVersion: pack.mappingVersion,
          status: !required
            ? "not_applicable"
            : tasks.length
              ? "authored_unqualified"
              : "missing_tasks",
          taskIds: tasks.map((task) => task.id),
          taskTypes: [...new Set(tasks.map(taskType))],
          evaluatorNeeds: !required
            ? []
            : mode === "speaking"
              ? [
                  "audio-aware grammar/content review",
                  "separate fluency and pronunciation evidence",
                ]
              : tasks.some((task) => task.answerPolicy === "closed")
                ? [
                    "qualified closed-answer rubric",
                    ...(tasks.some((task) => task.answerPolicy !== "closed")
                      ? ["qualified open-response review"]
                      : []),
                  ]
                : ["qualified open-response review"],
          releaseEligible: false,
          work: !required
            ? []
            : [
                ...(tasks.length
                  ? []
                  : [
                      `Author ${stage} ${mode} tasks for ${row.title}; partial lesson links do not supply task coverage.`,
                    ]),
                "Record independent content review and acceptable variants.",
                "Qualify the evaluator for the exact task and rubric before awarding learning evidence.",
              ],
        };
      }),
    ),
  );
}

export interface Transformation {
  id: string;
  language: string;
  kind: "voice" | "purpose";
  input: string;
  output: string;
  inputMeaning: Record<
    "predicate" | "agent" | "patient" | "time" | "polarity" | "modality",
    string
  >;
  outputMeaning: Transformation["inputMeaning"];
  transitive: boolean;
  sameController: boolean;
  changesFocus: boolean;
  status: "model_authored";
}
/** Metadata contract only. It never treats a self-declared meaning as an automatic linguistic assessment. */
export function validateTransformation(row: Transformation): void {
  if (
    !row.id ||
    !["en", "de"].includes(row.language) ||
    !["voice", "purpose"].includes(row.kind) ||
    !row.input.trim() ||
    !row.output.trim() ||
    row.status !== "model_authored" ||
    typeof row.transitive !== "boolean" ||
    typeof row.sameController !== "boolean" ||
    typeof row.changesFocus !== "boolean"
  )
    throw new Error("Invalid transformation contract");
  for (const key of [
    "predicate",
    "agent",
    "patient",
    "time",
    "polarity",
    "modality",
  ] as const)
    if (
      !row.inputMeaning[key]?.trim() ||
      row.inputMeaning[key] !== row.outputMeaning[key]
    )
      throw new Error(`Changed transformation meaning: ${key}`);
  if (row.kind === "voice" && !row.transitive)
    throw new Error(
      "No licensed personal passive for this declared intransitive pattern",
    );
  if (row.kind === "purpose" && !row.sameController)
    throw new Error("Purpose reduction changes controller");
}
