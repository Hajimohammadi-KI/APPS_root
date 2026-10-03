import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { loadRepresentativeRuntime } from "./lib/representative-model-candidate";
import { deriveAssessmentCoverage } from "./lib/assessment-readiness";
import {
  parseReviewLedger,
  validateReleaseReviews,
} from "./lib/automaticity-release-reviews";
import { activePracticeTasks } from "../shared/learning-core/src/automaticity/curriculum";

const root = resolve(import.meta.dir, ".."),
  runtime = await loadRepresentativeRuntime(root);
const ledgerPath = resolve(root, "docs/automaticity-release-reviews.json");
let ledger;
try {
  ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
} catch (error) {
  if ((error as { code?: string }).code !== "ENOENT") throw error;
  ledger = { schemaVersion: 1, reviews: [] };
  await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + "\n", {
    flag: "wx",
  });
}
const reviews = parseReviewLedger(ledger);
const cells = deriveAssessmentCoverage(runtime.packs, reviews);
const verified = await validateReleaseReviews(
  root,
  cells,
  new Map(runtime.packs.map((pack) => [pack.language, pack])),
  reviews,
);
async function save(relative: string, contents: string) {
  const path = resolve(root, relative);
  try {
    const old = await readFile(path, "utf8");
    if (old === contents) return;
    const backup = resolve(
      root,
      "backups/language-assessment-20261003/generated",
      relative,
    );
    await mkdir(dirname(backup), { recursive: true });
    try {
      await copyFile(path, backup, 1);
    } catch (error) {
      if ((error as { code?: string }).code !== "EEXIST") throw error;
    }
  } catch (error) {
    if ((error as { code?: string }).code !== "ENOENT") throw error;
  }
  await writeFile(path, contents);
}
const report = {
  schemaVersion: 1,
  cells,
  summary: {
    constructions: runtime.packs.reduce((n, pack) => n + pack.units.length, 0),
    cells: cells.length,
    reviewed: verified.reviewedCells,
    releaseEligible: verified.evaluatorApprovedCells,
  },
};
await save(
  "docs/automaticity-coverage.json",
  JSON.stringify(report, null, 2) + "\n",
);
await save(
  "docs/automaticity-coverage-backlog.json",
  JSON.stringify(
    cells.filter((cell) => !cell.releaseEligible),
    null,
    2,
  ) + "\n",
);
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
for (const pack of runtime.packs) {
  const app =
    pack.language === "en"
      ? "Apps/English/English-Automaticity"
      : "Apps/Deutsch/Deutsch-Automaticity";
  const units = pack.units.map((unit) => ({
    id: unit.id,
    title: unit.title,
    level: unit.level,
    modes: (["writing", "speaking"] as const).map((modality) => {
      const tasks = activePracticeTasks(unit).filter(
        (task) => task.modality === modality,
      );
      const approved = new Set(
        cells
          .filter(
            (cell) =>
              cell.constructionId === unit.id &&
              cell.modality === modality &&
              cell.releaseEligible,
          )
          .flatMap((cell) => cell.taskIds),
      );
      return {
        modality,
        tasks: tasks.length,
        contentReviewed: tasks.filter(
          (task) => task.contentReview === "human_reviewed",
        ).length,
        evaluatorApproved: tasks.filter((task) => approved.has(task.id)).length,
      };
    }),
  }));
  const data = { language: pack.language, contentVersion: pack.version, units };
  await save(
    `${app}/apps/web/public/assessment-readiness.json`,
    JSON.stringify(data, null, 2) + "\n",
  );
  const html = `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>پوشش ارزیابی تمرین‌ها</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f6fb;color:#192139;font:16px/1.9 Tahoma,Arial,sans-serif}main{max-width:960px;margin:auto;padding:24px}a{color:#183ea6}a:focus-visible{outline:3px solid #7149bf}h1{font-size:28px}h2{font-size:19px}article{background:white;border:1px solid #ccd4e2;border-radius:12px;padding:18px;margin:14px 0;overflow-wrap:anywhere}.muted{color:#536176}summary{cursor:pointer;min-height:44px;padding:8px 0}bdi{unicode-bidi:isolate}@media(max-width:500px){main{padding:16px}}</style><main><a href="/practice">بازگشت به تمرین</a> · <a href="/roadmap.html">رودمپ</a> · <a href="/assessment-benchmarks.html">آزمون ارزیاب‌ها</a> · <a href="/microphone-check.html">آزمون میکروفن</a><h1>پوشش ارزیابی تمرین‌ها — ${pack.language === "en" ? "انگلیسی" : "آلمانی"}</h1><p>${units.length} مبحث در نسخه محتوای <bdi>${escape(pack.version)}</bdi></p><p>هر مبحث دو وضعیت جدا دارد: بازبینی محتوای سؤال و تأیید روش ارزیابی پاسخ. عدد صفر یعنی این تأیید هنوز ثبت نشده است. بازخورد عمومی متن و خودارزیابی، تأیید دقت ۹۰ درصد یا روانی گفتار نیستند.</p><p>برای گفتار، ارزیاب باید صوت اصلی و رونویسی وفادار به آن را بررسی کند. تأیید ضبط یا متن، به‌تنهایی سنجش روانی و تلفظ نیست.</p>${units.map((unit) => `<article><h2><bdi dir="ltr">${escape(unit.level + " · " + unit.title)}</bdi></h2><details><summary>وضعیت نوشتن و گفتن</summary>${unit.modes.map((mode) => `<p><strong>${mode.modality === "writing" ? "نوشتن" : "گفتن"}:</strong> ${mode.tasks ? `${mode.tasks} تمرین فعال؛ محتوای بازبینی‌شده ${mode.contentReviewed}؛ روش ارزیابی تأییدشده ${mode.evaluatorApproved}` : "این مبحث در این شیوه تمرین ندارد."}</p>`).join("")}<p class="muted"><bdi>${escape(unit.id)}</bdi></p></details></article>`).join("")}</main></html>`;
  await save(`${app}/apps/web/public/assessment-readiness.html`, html + "\n");
}
console.log(JSON.stringify(report.summary));
