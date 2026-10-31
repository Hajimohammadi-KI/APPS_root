import { readFileSync } from "node:fs";
import { auditClosedTask } from "./curriculum-audit";
import {
  activePracticeTasks,
  validateCurriculum,
  type CurriculumPack,
} from "./curriculum";
import { assertWritingPrecision } from "../writing-precision";
const path = process.argv[2];
if (!path) throw Error("Curriculum path is required");
const pack = JSON.parse(readFileSync(path, "utf8")) as CurriculumPack;
const structuralIssues = validateCurriculum(pack);
if (structuralIssues.length)
  throw Error(`Invalid curriculum: ${structuralIssues.join("; ")}`);
const issues = pack.units.flatMap((u) =>
  activePracticeTasks(u).flatMap(auditClosedTask),
);
const errors = issues.filter((i) => i.severity === "error");
if (errors.length)
  throw Error(
    `Closed content audit failed: ${JSON.stringify(errors.slice(0, 20))}`,
  );
const correct = [
  ...new Set(
    pack.units.flatMap((u) => [
      ...u.examples,
      ...u.tasks.flatMap((t) => t.acceptedAnswers),
    ]),
  ),
];
assertWritingPrecision(correct, pack.language);
console.log(
  `Content audit: ${pack.language}, ${correct.length} distinct correct forms, zero writing-rule alerts; ${issues.length} content warnings.`,
);
if (issues.length) console.log(JSON.stringify(issues.slice(0, 10)));
