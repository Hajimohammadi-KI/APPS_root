import { hash, writingMetrics } from "../research/assessment-benchmark/core";
import { combineEditReviews, parseEditAssessment } from "../research/assessment-benchmark/edit-assessment";
import { developmentCandidateReady } from "../research/assessment-benchmark/holdout-policy";

type Verdict = "correct" | "incorrect" | "uncertain";
type Metrics = ReturnType<typeof writingMetrics>;
type Row = { id: string; language: "en" | "de"; label: "clean" | "error"; verdict: Verdict; correction: string; phases: { assessment: ReturnType<typeof parseEditAssessment> | null; raw: { choices?: { message?: { content?: string } }[] } | null; failure: string | null; requestStarted: boolean }[] };
export function editScopeDiagnostics(inputs: { content: string | undefined; target: string; before: string; after: string }[]) {
  const result = { quotedEdits: 0, uniqueTargetQuotes: 0, ambiguousTargetQuotes: 0, contextOnlyQuotes: 0, absentQuotes: 0, unchangedEdits: 0, unreadablePhases: 0 };
  const normalize = (text: string) => text.normalize("NFC").trim().replace(/\s+/gu, " ");
  for (const input of inputs) {
    let body: { edits?: { original?: unknown; replacement?: unknown }[] };
    try { body = JSON.parse(input.content ?? ""); } catch { result.unreadablePhases++; continue; }
    if (!body || !Array.isArray(body.edits)) { result.unreadablePhases++; continue; }
    for (const edit of body.edits) {
      if (!edit || typeof edit.original !== "string" || !edit.original.trim()) continue;
      result.quotedEdits++;
      const start = input.target.indexOf(edit.original);
      if (start >= 0) {
        if (input.target.indexOf(edit.original, start + 1) === -1) result.uniqueTargetQuotes++;
        else result.ambiguousTargetQuotes++;
      } else if (input.before.includes(edit.original) || input.after.includes(edit.original)) result.contextOnlyQuotes++;
      else result.absentQuotes++;
      if (typeof edit.replacement === "string" && normalize(edit.original) === normalize(edit.replacement)) result.unchangedEdits++;
    }
  }
  return result;
}
export function editDiagnostics(rows: Pick<Row, "language" | "label" | "verdict" | "phases">[]) {
  return Object.fromEntries((["en", "de"] as const).map(language => {
    const subset = rows.filter(row => row.language === language);
    const byPhase = (index: number) => subset.filter(row => row.label === "clean" && row.phases[index]?.assessment?.verdict === "incorrect").length;
    return [language, {
      falseCorrections: subset.filter(row => row.label === "clean" && row.verdict === "incorrect").length,
      firstFalseCorrections: byPhase(0), reviewFalseCorrections: byPhase(1),
      reviewDisagreements: subset.filter(row => row.phases.every(phase => phase.assessment && phase.assessment.verdict !== "uncertain") && combineEditReviews(row.phases[0]!.assessment, row.phases[1]!.assessment).verdict === "uncertain").length,
    }];
  })) as Record<"en" | "de", { falseCorrections: number; firstFalseCorrections: number; reviewFalseCorrections: number; reviewDisagreements: number }>;
}

export async function loadEditCandidate(root: string, run: string, name: string) {
  const directory = `${root}/research/assessment-benchmark/runs/${run}`;
  const report = await Bun.file(`${directory}/public-report.json`).json();
  const config = await Bun.file(`${directory}/config.json`).json();
  const predictions = await Bun.file(`${directory}/predictions.jsonl`).text();
  if (hash(predictions) !== report.predictionsSha256 || hash(JSON.stringify(config)) !== report.configSha256) throw Error("R59 report provenance mismatch");
  for (const [file, expected] of Object.entries(config.codeHashes)) {
    const snapshot = await Bun.file(`${directory}/${file}.snapshot`).text();
    if (hash(snapshot) !== expected) throw Error("R59 snapshot changed");
    if (file === "edit-assessment.ts" && hash(await Bun.file(`${root}/research/assessment-benchmark/${file}`).text()) !== expected) throw Error("R59 parser changed after inference");
  }
  const dataset = await Bun.file(`${root}/research/assessment-benchmark/runs/writing-context-data-v2/development.jsonl`).text();
  if (hash(dataset) !== report.selectionSha256 || config.split !== "development") throw Error("Wrong R59 development data");
  const cases = new Map(dataset.trim().split("\n").map(line => { const row = JSON.parse(line); return [row.id, row]; }));
  const rows: Row[] = predictions.trim().split("\n").map(line => JSON.parse(line));
  if (rows.length !== cases.size || new Set(rows.map(row => row.id)).size !== cases.size || rows.length !== report.count) throw Error("Missing or duplicate R59 predictions");
  for (const row of rows) {
    const source = cases.get(row.id);
    if (!source || row.label !== source.label || row.language !== source.language || row.phases.length !== 2) throw Error("R59 reference mismatch");
    for (const phase of row.phases) {
      if (phase.assessment) {
        const reconstructed = parseEditAssessment(JSON.parse(phase.raw!.choices![0]!.message!.content!), source.text);
        if (JSON.stringify(reconstructed) !== JSON.stringify(phase.assessment) || phase.failure || !phase.requestStarted) throw Error("R59 raw response mismatch");
      }
    }
    const combined = combineEditReviews(row.phases[0]!.assessment, row.phases[1]!.assessment);
    if (combined.verdict !== row.verdict || combined.correction !== row.correction) throw Error("R59 combination mismatch");
  }
  for (const language of ["en", "de"] as const) {
    const subset = rows.filter(row => row.language === language);
    for (const [key, index] of [["candidate", null], ["firstPass", 0], ["reviewPass", 1]] as const) {
      const metrics = writingMetrics(subset.map(row => ({ label: row.label, verdict: index === null ? row.verdict : row.phases[index]!.assessment?.verdict ?? "uncertain" })));
      if (JSON.stringify(metrics) !== JSON.stringify(report.languages[language][key])) throw Error("R59 metric mismatch");
    }
  }
  const scopeDiagnostics = editScopeDiagnostics(rows.flatMap(row => {
    const source = cases.get(row.id)!;
    return row.phases.map(phase => ({ content: phase.raw?.choices?.[0]?.message?.content, target: source.text, before: source.before, after: source.after }));
  }));
  const sourceCorrectionDisagreements = rows.filter(row => row.label === "error" && row.verdict === "correct").map(row => ({ language: row.language, annotationTypes: cases.get(row.id)!.types }));
  return { name, run, report, diagnostics: editDiagnostics(rows), scopeDiagnostics, referenceAdjudication: { status: "not-independently-adjudicated", sourceCorrectionDisagreements } };
}
type Candidate = Awaited<ReturnType<typeof loadEditCandidate>>;
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const ratio = (a: number, b: number) => `<bdi>${a} / ${b}</bdi>`;
export function r59BenchmarkSection(candidates: Candidate[]) {
  const selectionStatus = candidates.some(candidate => developmentCandidateReady(candidate.report))
    ? "یک تنظیم شرط اولیهٔ توسعه را گذرانده است؛ این نتیجه هنوز تأیید آزمون نهایی یا صلاحیت ارزیاب عمومی نیست."
    : "هیچ‌یک از این تنظیم‌ها شرط توسعه را نگذرانده است؛ صفر پذیرش غلط با پاسخ‌های بی‌نمرهٔ فراوان، قبولی محسوب نمی‌شود.";
  const tables = candidates.map(({ name, report, diagnostics, scopeDiagnostics: scope }) => `<h3 dir="ltr">${escape(name)}</h3>${(["en", "de"] as const).map(language => {
    const first: Metrics = report.languages[language].firstPass, combined: Metrics = report.languages[language].candidate, d = diagnostics[language];
    return `<table><caption>${language === "en" ? "انگلیسی" : "آلمانی"} — همان ۶۴ جمله</caption><thead><tr><th scope="col">شاخص</th><th scope="col">داوری اول</th><th scope="col">پس از بازبینی</th></tr></thead><tbody>
      <tr><th scope="row">پذیرش جملهٔ دارای اصلاح مرجع</th><td>${ratio(first.falseAccept, first.errors)}</td><td>${ratio(combined.falseAccept, combined.errors)}</td></tr>
      <tr><th scope="row">پذیرش جملهٔ بدون اصلاح مرجع</th><td>${ratio(first.trueAccept, first.clean)}</td><td>${ratio(combined.trueAccept, combined.clean)}</td></tr>
      <tr><th scope="row">تشخیص جملهٔ دارای اصلاح</th><td>${ratio(first.detectedErrors, first.errors)}</td><td>${ratio(combined.detectedErrors, combined.errors)}</td></tr>
      <tr><th scope="row">تغییر جملهٔ بدون اصلاح مرجع</th><td>${ratio(d.firstFalseCorrections, first.clean)}</td><td>${ratio(d.falseCorrections, combined.clean)}</td></tr>
      <tr><th scope="row">نامطمئن یا نامعتبر</th><td>${ratio(first.abstentions, first.count)}</td><td>${ratio(combined.abstentions, combined.count)}</td></tr>
      </tbody></table><p>${d.reviewDisagreements} اختلاف میان دو پاسخِ قطعی به نتیجهٔ نامطمئن تبدیل شد. اختلاف می‌تواند در حکم یا متن اصلاح باشد.</p>`;
  }).join("")}<p>خروجی معتبر از نظر ساختار: ${ratio(report.structurallyValidCalls, report.requestsStarted)} درخواست واقعی. میانهٔ زمان دو بررسی: <bdi>${(report.latencyMs.median / 1000).toFixed(1)}</bdi> ثانیه.</p><p>از ${scope.quotedEdits} تغییرِ دارای عبارت شاهد، ${scope.contextOnlyQuotes} مورد فقط در متن اطراف بود؛ ${scope.unchangedEdits} تغییر هم بی‌اثر بود. این تعداد مربوط به پیشنهادهاست، نه جمله‌های مستقل؛ دو دسته ممکن است هم‌پوشانی داشته باشند.</p>`).join("");
  return `<section id="r59"><h2>اصلاح قرارداد خروجی و بازبینی ضرورت اصلاح — R58 و R59</h2><p>در مسیر اپ، پیشنهاد اصلاح هم اکنون به بازبینی تازهٔ متن اصلی نیاز دارد؛ اختلاف دربارهٔ اصلاح، حفظ معنا یا کاربرد هدف، بی‌نمره می‌ماند و بازخورد تأییدنشده نمایش داده نمی‌شود. این اصلاح فنی، مجوز فعال‌کردن مدل نیست.</p><p>در آزمایش تازه، مدل تغییرهای مشخص را پیشنهاد می‌کند و برنامه متن اصلاح‌شده را از همان تغییرها می‌سازد. عبارت ناموجود، تغییر هم‌پوشان و اصلاح بی‌اثر پذیرفته نمی‌شود. دو بررسی متن اصلی را جدا می‌بینند؛ اختلاف هرگز به پاسخ «درست» تبدیل نمی‌شود.</p>${tables}<p class="notice">${selectionStatus}</p><p>در این جدول، بدون اصلاح یا دارای اصلاح بر اساس برچسب مرجع مجموعه‌داده است؛ نبود اصلاح مرجع نیز تأیید مستقلِ درست‌بودن جمله نیست. شاخص پذیرش، همان شمارش قبلی است؛ همهٔ اختلاف‌ها الزاماً خطای قطعی گرامری نیستند و ممکن است املا، نشانه‌گذاری یا انتخاب واژه و معنای وابسته به بافت باشند. خطای واقعی مثل جاافتادن حرف تعریف هم در خروجی باقی مانده است. برچسب‌ها مستقل داوری نشده‌اند؛ هیچ اختلافی حذف یا بازبرچسب‌گذاری نشده است. تشخیص وجود خطا، تأیید درستی همهٔ اصلاح‌های پیشنهادی نیست.</p><p>هر تنظیم روی همان ۱۲۸ جملهٔ توسعه اجرا شده است. ستون اول فقط تشخیصی است؛ نامزد انتخاب‌شدنی، نتیجهٔ پس از بازبینی است. داوری دوم از همان مدل است و ممکن است همان اشتباه را تکرار کند. قالب معتبر و توافق دو خروجی، اثبات درستی زبانی نیستند.</p><p>شرط ورود به آزمون نهایی تغییر نکرد: صفر پذیرش غلط و دست‌کم ۲۹ از ۳۲ مورد برای پذیرش درست و تشخیص خطا در هر دو زبان. هیچ برچسب یا نمونه‌ای برای بهترشدن نتیجه حذف نشده است. این آزمایش، تلفظ، روانی یا هدف همهٔ تمرین‌ها را تأیید نمی‌کند.</p><p><a href="https://huggingface.co/Qwen/Qwen3.5-27B">مدل پایهٔ Qwen3.5-27B</a> · <a href="https://huggingface.co/unsloth/Qwen3.5-27B-GGUF">وزن کم‌حجم تهیه‌شده توسط Unsloth</a> · <a href="/assessment-benchmarks.json">نتایج و مشخصات اجرا</a></p></section>`;
}
