import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { loadRepresentativeRuntime } from "./lib/representative-model-candidate";
import { deriveAssessmentCoverage } from "./lib/assessment-readiness";
import {
  parseReviewLedger,
  validateReleaseReviews,
} from "./lib/automaticity-release-reviews";
import { activePracticeTasks } from "../shared/learning-core/src/automaticity/curriculum";
import { missingGrammarScopeFiles } from "./lib/installed-coverage";
import { personalStudyReadiness } from "./lib/personal-study-setup";

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
const missingExpandedScopeFiles = await missingGrammarScopeFiles(root);
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
  const selectedCycleReviewLinks = pack.units
    .filter((unit) => unit.learningCycle)
    .map((unit) => ({
      unitId: unit.id,
      title: unit.title,
      level: unit.level,
      url: `/learning-core/content-review.html?unit=${unit.id}&focus=cycle`,
    }));
  const contentReviewedTasks = units.reduce(
    (sum, unit) =>
      sum + unit.modes.reduce((n, mode) => n + mode.contentReviewed, 0),
    0,
  );
  const evaluatorApprovedTasks = units.reduce(
    (sum, unit) =>
      sum + unit.modes.reduce((n, mode) => n + mode.evaluatorApproved, 0),
    0,
  );
  const reviewReadiness = {
    status: "awaiting_human_evidence",
    contentReviewedTasks,
    evaluatorApprovedTasks,
    missingExpandedScopeFiles,
    selectedCycleReviewLinks,
  };
  const data = {
    language: pack.language,
    contentVersion: pack.version,
    units,
    reviewReadiness,
    personalStudyPreparation: personalStudyReadiness(),
  };
  await save(
    `${app}/apps/web/public/assessment-readiness.json`,
    JSON.stringify(data, null, 2) + "\n",
  );
  const html = `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>پوشش ارزیابی تمرین‌ها</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f6fb;color:#192139;font:16px/1.9 Tahoma,Arial,sans-serif}main{max-width:960px;margin:auto;padding:24px}a{color:#183ea6}a:focus-visible{outline:3px solid #7149bf}h1{font-size:28px}h2{font-size:19px}article{background:white;border:1px solid #ccd4e2;border-radius:12px;padding:18px;margin:14px 0;overflow-wrap:anywhere}.muted{color:#536176}summary{cursor:pointer;min-height:44px;padding:8px 0}bdi{unicode-bidi:isolate}@media(max-width:500px){main{padding:16px}}</style><main><a href="/practice">بازگشت به تمرین</a> · <a href="/roadmap.html">رودمپ</a> · <a href="/assessment-benchmarks.html">آزمون ارزیاب‌ها</a> · <a href="/microphone-check.html">آزمون میکروفن</a><h1>پوشش ارزیابی تمرین‌ها — ${pack.language === "en" ? "انگلیسی" : "آلمانی"}</h1><p>${units.length} مبحث در نسخه محتوای <bdi>${escape(pack.version)}</bdi></p><p>هر مبحث دو وضعیت جدا دارد: بازبینی محتوای سؤال و تأیید روش ارزیابی پاسخ. عدد صفر یعنی این تأیید هنوز ثبت نشده است. بازخورد عمومی متن و خودارزیابی، تأیید دقت ۹۰ درصد یا روانی گفتار نیستند.</p><p>برای گفتار، ارزیاب باید صوت اصلی و رونویسی وفادار به آن را بررسی کند. تأیید ضبط یا متن، به‌تنهایی سنجش روانی و تلفظ نیست.</p>${units.map((unit) => `<article><h2><bdi dir="ltr">${escape(unit.level + " · " + unit.title)}</bdi></h2><details><summary>وضعیت نوشتن و گفتن</summary>${unit.modes.map((mode) => `<p><strong>${mode.modality === "writing" ? "نوشتن" : "گفتن"}:</strong> ${mode.tasks ? `${mode.tasks} تمرین فعال؛ محتوای بازبینی‌شده ${mode.contentReviewed}؛ روش ارزیابی تأییدشده ${mode.evaluatorApproved}` : "این مبحث در این شیوه تمرین ندارد."}</p>`).join("")}<p class="muted"><bdi>${escape(unit.id)}</bdi></p></details></article>`).join("")}</main></html>`;
  const teacherGuide = `<section aria-label="بازبینی معلم"><h2>تحویل برنامه به معلم</h2><p>معلم بدون نصب، لینک یکی از مباحث زیر را باز می‌کند، نام و صلاحیت خود را می‌نویسد، هدف‌ها و تمرین‌ها را بررسی و نظر دقیق ثبت می‌کند. پس از ذخیرهٔ نظرها، دانلود فایل JSON را می‌زند و فایل را برای مالک برنامه می‌فرستد. دانلود، فایل را ارسال نمی‌کند و هیچ تغییری خودکار منتشر نمی‌شود. پیش‌نویس داوری در همان مرورگر می‌ماند.</p><p>بررسی فقط هفت قدم چرخه برای ثبت ایرادها مفید است؛ تأیید کل مبحث به بررسی همهٔ تمرین‌های فعال نوشتاری و گفتاری آن نیاز دارد. نظر یک معلم، جای دو داور مستقل برای اعتبارسنجی بانک آزمون ارزیاب را نمی‌گیرد.</p><p>تأیید محتوای ثبت‌شده: ${contentReviewedTasks} تمرین؛ روش ارزیابی تأییدشده: ${evaluatorApprovedTasks} تمرین. آماده‌بودن ابزار به معنی انجام داوری نیست.</p><ul>${selectedCycleReviewLinks.map((link) => `<li><a href="${escape(link.url)}"><bdi dir="ltr">${escape(link.level + " · " + link.title)}</bdi></a></li>`).join("")}</ul><p>بانک مستقل پاسخ‌های دیده‌نشده و فایل‌های واقعی داوری هنوز لازم‌اند. ${missingExpandedScopeFiles.length ? `ورودی‌های ممیزی دامنهٔ گسترده ناقص‌اند (${missingExpandedScopeFiles.length} فایل)؛ بررسی تمرین‌های نصب‌شده مجوز انتشار کل برنامهٔ آموزشی نیست.` : "وجود فایل‌های دامنه به‌تنهایی، تأیید انسانی نیست."}</p></section>`;
  const studyGuide = `<section aria-label="آماده‌سازی مطالعهٔ شخصی"><h2>آماده‌سازی مطالعهٔ شخصی با معلم</h2><p>هنوز طرح فعال یا مشاهدهٔ مطالعه ثبت نشده است. این قسمت، آماده‌سازی است؛ نتیجهٔ اثربخشی برنامه نیست. مرحلهٔ فعلی برای نوشتن طراحی شده است؛ نتیجهٔ نوشتن به گفتار تعمیم داده نمی‌شود.</p><ol><li>پیش‌آزمون: توانایی فعلی پیش از دورهٔ تازه سنجیده می‌شود. تمرین‌های قبلی پنهان نمی‌شوند؛ این سنجش «بدون سابقهٔ آموزش» نیست.</li><li>پس‌آزمون: پس از تمرین، فرم جدا با موقعیت و سؤال تازه توسط معلم ارائه می‌شود.</li><li>پیگیری ۷ روز پس از پایان دوره: فرم مستقل در پنجرهٔ زمانی ازپیش‌ثبت‌شده.</li><li>پیگیری ۳۰ روز پس از پایان دوره: فرم مستقل دیگر؛ آزمون روز هفتم و هر تمرین بین دو آزمون در سابقه می‌ماند. این نتیجه، «۳۰ روز بدون بازیابی» نامیده نمی‌شود.</li></ol><p>معلم چهار فرم خصوصی و دیده‌نشده با معیار صحت گرامر، حفظ معنا و تناسب موقعیت آماده و داوری می‌کند. بانک سؤال و پاسخ‌های آینده عمومی نمی‌شوند؛ فقط فرم موعدرسیده تحویل می‌شود. طرح پیش از شروع با رضایت جداگانه و شناسهٔ مستعار قفل می‌شود؛ بدون بانک داوری‌شده فعال نمی‌شود. تأیید زمان توسط معلم هم لازم است؛ ساعت محلی اثبات مستقل زمان نیست.</p><p>پاسخ اول، کمک‌ها، تمرین‌های بین آزمون‌ها و غیبت‌ها باید ثبت شوند؛ اصلاح، جای پاسخ اول را نمی‌گیرد. بازخورد انسانی با پاسخ اصلی پیوند می‌خورد و هیچ تسلطی خودکار اعطا نمی‌شود. نتیجهٔ یک زبان‌آموز توصیف پیشرفت همان شخص است؛ دلیل اثر علّی یا اثربخشی عمومی نیست. ارسال فایل نتیجه یا صدا نیازمند رضایت جداگانه است.</p></section>`;
  await save(
    `${app}/apps/web/public/assessment-readiness.html`,
    html.replace("</h1>", "</h1>" + teacherGuide + studyGuide) + "\n",
  );
}
console.log(JSON.stringify(report.summary));
