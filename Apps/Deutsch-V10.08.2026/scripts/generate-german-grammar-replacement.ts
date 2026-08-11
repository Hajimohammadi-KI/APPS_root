import { grammarUnits } from "../packages/content/src/index";

const outputPath = new URL(
  "../apps/web/public/replacements/de/grammar-catalog.js",
  import.meta.url,
);

const payload = grammarUnits.map((unit) => ({
  level: unit.level,
  title: unit.title,
  rule: unit.rule,
  explanation: unit.explanation,
  examples: unit.examples,
  commonError: unit.commonError,
  exercises: unit.exercises,
  testAnswer: unit.testAnswer,
  recallTest: unit.recallTest,
  repairTest: unit.repairTest,
  transferTest: unit.transferTest,
}));

await Bun.write(
  outputPath,
  `window.GERMAN_GRAMMAR_UNITS = ${JSON.stringify(payload)};\n`,
);

console.log(`Generated ${payload.length} German grammar units.`);
