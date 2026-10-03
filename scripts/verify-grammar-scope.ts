import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  buildInventory,
  buildCoverage,
  validatePrerequisites,
  validateApplicability,
  selectPracticePartition,
  partitionItem,
  validateTransformation,
  hash,
  rows,
  type ScopeInput,
  type PartitionItem,
  type Transformation,
} from "./lib/grammar-scope";
import {
  loadScopeInput,
  buildScope,
  verifyGrammarScope,
} from "./lib/grammar-scope-files";
const root = resolve(import.meta.dir, "..");
const output = resolve(
  root,
  `artifacts/grammar-scope/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(output, { recursive: true });
const cases: { name: string; passed: boolean }[] = [];
const input = await loadScopeInput(root),
  inventory = buildInventory(input),
  cells = buildCoverage(inventory, input.packs);
function test(name: string, run: () => void) {
  run();
  cases.push({ name, passed: true });
}
function reject(
  name: string,
  mutate: (fixture: ScopeInput) => void,
  expected: RegExp,
) {
  test(name, () => {
    const fixture = structuredClone(input);
    mutate(fixture);
    assert.throws(() => buildInventory(fixture), expected);
  });
}
const receipt: {
  status: string;
  cases: typeof cases;
  summary?: unknown;
  error?: string;
} = { status: "running", cases };
try {
  test("all baseline lessons retained without exact exercise-count assumptions", () => {
    for (const baseline of input.baseline)
      assert(
        inventory.some((row) =>
          row.lessonLinks.some(
            (link) =>
              link.id === baseline.id && link.relationship === "primary",
          ),
        ),
      );
    assert.equal(input.baseline.length, 256);
  });
  test("all language/family audits have source references", () =>
    assert.equal(input.familyAudit.length, 42));
  test("every target has form meaning use contrasts and alternative limits", () => {
    for (const row of inventory)
      for (const key of [
        "form",
        "meaning",
        "use",
        "contrast",
        "alternatives",
      ] as const)
        assert(row[key].trim());
  });
  test("model author role and date never assert human approval", () =>
    assert(
      inventory.every(
        (row) =>
          row.review.kind === "model_authored" &&
          row.review.humanApproved === false &&
          row.review.role &&
          row.review.date,
      ),
    ));
  test("many-to-many reinforcement is recorded separately from primary mapping", () => {
    const row = inventory.find((row) => row.id === "de.c.105")!;
    assert(
      row.lessonLinks.some(
        (link) =>
          link.id === "de.c.095" && link.relationship === "reinforcement",
      ),
    );
    assert(
      inventory
        .find((row) => row.id === "de.c.095")!
        .lessonLinks.some((link) => link.id === row.id),
    );
  });
  test("partial lesson links do not satisfy added-target coverage", () => {
    const fixture = structuredClone(input);
    fixture.packs.forEach(pack => { pack.units = pack.units.filter(unit => !fixture.additions.some(row => row.id === unit.id)); });
    const removed = buildInventory(fixture);
    const missingCells = buildCoverage(removed, fixture.packs);
    const added = removed.filter((row) => row.kind === "missing_target");
    assert.equal(added.length, 24);
    assert(
      added.every(
        (row) =>
          row.lessonLinks.length > 0 &&
          row.lessonLinks.every((link) => link.relationship === "partial_only"),
      ),
    );
    assert(
      missingCells
        .filter(
          (cell) =>
            added.some((row) => row.id === cell.constructionId) &&
            cell.required,
        )
        .every(
          (cell) => cell.status === "missing_tasks" && !cell.taskIds.length,
        ),
    );
  });
  test("coverage distinguishes missing tasks from authored but unqualified", () => {
    assert.equal(
      cells.filter((row) => row.status === "missing_tasks").length,
      0,
    );
    assert.equal(
      cells.filter((row) => row.status === "authored_unqualified").length,
      3906,
    );
    assert(cells.every((row) => row.releaseEligible === false));
  });
  test("only graphic targets have reasoned spoken N/A cells", () => {
    const na = cells.filter((row) => !row.required);
    assert.equal(na.length, 14);
    assert(
      na.every(
        (row) =>
          row.modality === "speaking" &&
          row.naReason &&
          ["en.c.124", "de.c.156"].includes(row.constructionId),
      ),
    );
  });
  reject(
    "lost lesson rejected",
    (f) => {
      f.packs[0]!.units.shift();
      f.specifications.shift();
    },
    /Missing prerequisite|Lost original lesson/,
  );
  reject(
    "truncated migration baseline rejected",
    (f) => {
      f.baseline.pop();
    },
    /Incomplete migration baseline/,
  );
  reject(
    "removed alias rejected",
    (f) => {
      f.packs[0]!.units[0]!.lessonAlias = "renamed";
      f.packs[0]!.units[0]!.lessonAliases = ["renamed"];
    },
    /Lost original lesson/,
  );
  test("renamed title is allowed while original alias remains", () => {
    const f = structuredClone(input);
    f.packs[0]!.units[0]!.title = "Be for identity and description";
    assert.doesNotThrow(() => buildInventory(f));
  });
  reject(
    "missing specification rejected",
    (f) => {
      f.specifications.pop();
    },
    /Missing\/orphan/,
  );
  reject(
    "duplicate specification rejected",
    (f) => {
      f.specifications[1]!.id = f.specifications[0]!.id;
    },
    /Duplicate specification/,
  );
  reject(
    "empty meaning rejected",
    (f) => {
      f.specifications[0]!.meaning = "";
    },
    /Incomplete construction/,
  );
  reject(
    "unknown construction family rejected",
    (f) => {
      f.additions[0]!.family = "G99";
    },
    /Invalid family/,
  );
  reject(
    "missing family audit rejected",
    (f) => {
      f.familyAudit.pop();
    },
    /Missing reference audit/,
  );
  reject(
    "invented source reference rejected",
    (f) => {
      f.familyAudit[0]!.references = ["not-a-source"];
    },
    /Missing reference audit/,
  );
  reject(
    "orphan omission rejected",
    (f) => {
      f.familyAudit[0]!.gaps.push("en.c.999");
    },
    /Unaccounted reference omission/,
  );
  reject(
    "unaudited new target rejected",
    (f) => {
      f.familyAudit.forEach((row) => {
        row.gaps = row.gaps.filter((id) => id !== f.additions[0]!.id);
      });
    },
    /Unaudited addition/,
  );
  reject(
    "new target cannot reuse a current ID",
    (f) => {
      f.additions[0]!.id = f.specifications[0]!.id;
    },
    /Reused construction ID/,
  );
  reject(
    "unknown partial lesson rejected",
    (f) => {
      f.additions[0]!.related.push("en.c.999");
    },
    /Unknown partial lesson/,
  );
  reject(
    "cross-language reinforcement rejected",
    (f) => {
      f.reinforcements.push(["en.c.001", "de.c.001"]);
    },
    /Invalid reinforcement/,
  );
  reject(
    "empty task version rejected",
    (f) => {
      f.packs[0]!.units[0]!.tasks[0]!.version = "";
    },
    /Invalid\/stale task/,
  );
  test("soft suggestions do not become mandatory learner gates", () => {
    const f = structuredClone(inventory);
    f[0]!.prerequisites.suggested = [
      { id: f[1]!.id, reason: "optional teaching order" },
    ];
    f[1]!.prerequisites.suggested = [
      { id: f[0]!.id, reason: "optional teaching order" },
    ];
    assert.doesNotThrow(() => validatePrerequisites(f));
  });
  test("hard prerequisite cycle rejected", () => {
    const f = structuredClone(inventory);
    for (const row of f.slice(0, 2)) row.prerequisites.suggested = [];
    f[0]!.prerequisites.hard = [
      { id: f[1]!.id, reason: "synthetic hard dependency" },
    ];
    f[1]!.prerequisites.hard = [
      { id: f[0]!.id, reason: "synthetic hard dependency" },
    ];
    assert.throws(() => validatePrerequisites(f), /Hard prerequisite cycle/);
  });
  test("unexplained hard dependency rejected", () => {
    const f = structuredClone(inventory);
    f[0]!.prerequisites.hard = [{ id: f[1]!.id, reason: "" }];
    assert.throws(() => validatePrerequisites(f), /Invalid hard/);
  });
  test("missing evaluator cannot justify N/A", () => {
    const f = structuredClone(inventory);
    f[0]!.applicability.speaking = {
      required: false,
      reason: "No speech evaluator",
      referenceId: "en-syntax",
    };
    assert.throws(
      () =>
        validateApplicability(
          f,
          new Set(input.references.map((row) => row.id)),
        ),
      /Unsupported N\/A/,
    );
  });
  test("N/A without reference rejected", () => {
    const f = structuredClone(inventory);
    f.find((row) => row.id === "en.c.124")!.applicability.speaking.referenceId =
      null;
    assert.throws(
      () =>
        validateApplicability(
          f,
          new Set(input.references.map((row) => row.id)),
        ),
      /Unsupported N\/A/,
    );
  });
  const item = (
    id: string,
    partition: PartitionItem["partition"] = "practice",
  ): PartitionItem => ({
    id,
    language: "en",
    partition,
    templateFamily: `template:${id}`,
    scenarioFamily: `scenario:${id}`,
    contentFingerprints: [hash(id)],
    exposed: false,
  });
  test("evaluation never appears in practice selection", () =>
    assert.deepEqual(
      selectPracticePartition([item("p"), item("e", "evaluation")]).selected,
      ["p"],
    ));
  test("teaching and calibration never appear in practice selection", () =>
    assert.deepEqual(
      selectPracticePartition([
        item("p"),
        item("t", "teaching"),
        item("c", "calibration"),
      ]).selected,
      ["p"],
    ));
  test("shared template quarantines learning and evaluation", () => {
    const a = item("a"),
      b = item("b", "evaluation");
    b.templateFamily = a.templateFamily;
    assert.deepEqual(selectPracticePartition([a, b]), {
      selected: [],
      quarantined: ["a", "b"],
    });
  });
  test("shared scenario quarantines learning and evaluation", () => {
    const a = item("a"),
      b = item("b", "evaluation");
    b.scenarioFamily = a.scenarioFamily;
    assert.equal(selectPracticePartition([a, b]).quarantined.length, 2);
  });
  test("renamed duplicate content cannot evade separation", () => {
    const a = item("a"),
      b = item("renamed", "evaluation");
    b.contentFingerprints = a.contentFingerprints;
    assert.equal(selectPracticePartition([a, b]).quarantined.length, 2);
  });
  test("transitive family leakage is rejected", () => {
    const a = item("a"),
      b = item("b"),
      c = item("c", "evaluation");
    b.templateFamily = a.templateFamily;
    c.scenarioFamily = b.scenarioFamily;
    assert.equal(selectPracticePartition([a, b, c]).quarantined.length, 3);
  });
  test("calibration and final evaluation remain separate", () => {
    const a = item("a", "calibration"),
      b = item("b", "evaluation");
    b.templateFamily = a.templateFamily;
    assert.equal(selectPracticePartition([a, b]).quarantined.length, 2);
  });
  test("exposed final material is quarantined without a practice copy", () => {
    const a = item("a", "evaluation");
    a.exposed = true;
    assert.deepEqual(selectPracticePartition([a]).quarantined, ["a"]);
  });
  test("declared translations share contamination family", () => {
    const a = item("a"),
      b = item("b", "evaluation");
    b.language = "de";
    b.templateFamily = a.templateFamily;
    assert.equal(selectPracticePartition([a, b]).quarantined.length, 2);
  });
  test("normalisation catches case and whitespace changes", () => {
    const task = structuredClone(input.packs[0]!.units[0]!.tasks[0]!);
    task.solution = null;
    task.acceptedAnswers = [];
    task.prompt = "New  sample.";
    const other = structuredClone(task);
    other.id += "-other";
    other.prompt = " NEW sample. ";
    other.partition = "evaluation";
    assert.deepEqual(
      partitionItem(task, "en").contentFingerprints,
      partitionItem(other, "en").contentFingerprints,
    );
  });
  test("duplicate partition identities rejected", () =>
    assert.throws(
      () => selectPracticePartition([item("same"), item("same")]),
      /Duplicate partition/,
    ));
  test("malformed content hash rejected", () => {
    const a = item("a");
    a.contentFingerprints = ["not-a-hash"];
    assert.throws(() => selectPracticePartition([a]), /Invalid partition/);
  });
  const examples = (
    JSON.parse(
      await readFile(
        resolve(root, "docs/grammar-scope/transformation-examples.json"),
        "utf8",
      ),
    ) as { examples: Transformation[] }
  ).examples;
  test("four original transformation illustrations satisfy the declared contract", () => {
    assert.equal(examples.length, 4);
    examples.forEach(validateTransformation);
  });
  for (const field of [
    "predicate",
    "agent",
    "patient",
    "time",
    "polarity",
    "modality",
  ] as const)
    test(`changed ${field} cannot claim meaning preservation`, () => {
      const f = structuredClone(examples[0]!);
      f.outputMeaning[field] = "different";
      assert.throws(
        () => validateTransformation(f),
        /Changed transformation meaning/,
      );
    });
  test("unlicensed personal passive rejected", () => {
    const f = structuredClone(examples[0]!);
    f.transitive = false;
    assert.throws(
      () => validateTransformation(f),
      /No licensed personal passive/,
    );
  });
  test("purpose reduction with different controller rejected", () => {
    const f = structuredClone(examples[2]!);
    f.sameController = false;
    assert.throws(() => validateTransformation(f), /changes controller/);
  });
  test("specification parser rejects missing columns", () =>
    assert.throws(() => rows("a|b", 6), /Expected 6/));
  const scope = await verifyGrammarScope(root);
  test("interaction remains a named missing task type", () =>
    assert.equal(
      scope.taskTypeRequirements.find((row) => row.id === "interaction")!
        .presentTasks,
      0,
    ));
  test("generated inventory matches current sources", () =>
    assert.equal(scope.summary.currentLessons, input.baseline.length + input.additions.length));
  const repeated = await buildScope(root);
  test("generation is deterministic", () =>
    assert.equal(JSON.stringify(scope), JSON.stringify(repeated)));
  receipt.summary = scope.summary;
  receipt.status = "passed";
} catch (error) {
  receipt.status = "failed";
  receipt.error = String(error);
  throw error;
} finally {
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(
      { createdAt: new Date().toISOString(), ...receipt },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      output,
      status: receipt.status,
      cases: cases.length,
      error: receipt.error,
    }),
  );
}
