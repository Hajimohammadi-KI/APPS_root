import { developmentCandidateReady } from "../research/assessment-benchmark/holdout-policy";
import type { loadEditCandidate } from "./r59-benchmark-report";

type Candidate = Awaited<ReturnType<typeof loadEditCandidate>>;
const ratio = (numerator: number, denominator: number) => `<bdi>${numerator} / ${denominator}</bdi>`;

export function r61BenchmarkSection(baseline: Candidate, candidate: Candidate) {
  const passed = developmentCandidateReady(candidate.report);
  const status = passed
    ? "این تنظیم شرط اولیهٔ توسعه را گذرانده است؛ هنوز نیازمند آزمون نهایی و اعتبارسنجی مستقل است و مجوز فعال‌سازی ندارد."
    : "این تنظیم هم شرط دقت و پوشش توسعه را نگذرانده است؛ ارزیاب عمومی فعال نشده است.";
  const tables = (["en", "de"] as const).map(language => {
    const before = baseline.report.languages[language].candidate;
    const after = candidate.report.languages[language].candidate;
    const rows = [
      ["پذیرش جملهٔ دارای اصلاح مرجع", ratio(before.falseAccept, before.errors), ratio(after.falseAccept, after.errors)],
      ["پذیرش جملهٔ بدون اصلاح مرجع", ratio(before.trueAccept, before.clean), ratio(after.trueAccept, after.clean)],
      ["تشخیص جملهٔ دارای اصلاح مرجع", ratio(before.detectedErrors, before.errors), ratio(after.detectedErrors, after.errors)],
      ["تغییر جملهٔ بدون اصلاح مرجع", ratio(baseline.diagnostics[language].falseCorrections, before.clean), ratio(candidate.diagnostics[language].falseCorrections, after.clean)],
      ["پاسخ نامطمئن یا نامعتبر", ratio(before.abstentions, before.count), ratio(after.abstentions, after.count)],
    ];
    return `<table><caption>${language === "en" ? "انگلیسی" : "آلمانی"} — همان ۶۴ جمله</caption><thead><tr><th scope="col">شاخص</th><th scope="col">تنظیم قبلی</th><th scope="col">با استدلال</th></tr></thead><tbody>${rows.map(([label, first, second]) => `<tr><th scope="row">${label}</th><td>${first}</td><td>${second}</td></tr>`).join("")}</tbody></table>`;
  }).join("");
  const diagnostics = candidate.report.completionDiagnostics;
  return `<section id="r61"><h2>بررسی دقت با فرصت استدلال بیشتر — R61</h2><p>برای بررسی خطاهای باقی‌مانده، همان مدل ۲۷ میلیاردی و همان ۱۲۸ جمله با تنظیم تازهٔ تولید پاسخ و فرصت استدلال آزمایش شدند. هر جمله دو بررسی جدا داشت؛ متن سؤال، برچسب‌ها، شیوهٔ ترکیب دو پاسخ و معیار قبولی ثابت ماندند.</p><p class="notice">${status}</p>${tables}<p>ساختار معتبر: ${ratio(candidate.report.structurallyValidCalls, candidate.report.requestsStarted)} پاسخ. اعلام صریح نامطمئن توسط مدل: ${candidate.report.explicitUncertaintyCalls} پاسخ. دو پاسخ قابل ارزیابی برای ${ratio(candidate.report.bothPhasesAssessed, candidate.report.count)} جمله دریافت شد.</p><p>میانهٔ زمان دو بررسی <bdi>${(candidate.report.latencyMs.median / 1000).toFixed(1)}</bdi> ثانیه و صدک ۹۵ آن <bdi>${(candidate.report.latencyMs.p95 / 1000).toFixed(1)}</bdi> ثانیه بود. این زمان مربوط به اجرای محلی است؛ سرعت نسخهٔ آنلاین نیست.</p><details><summary>جزئیات و حدود اعتبار آزمون</summary><p>${diagnostics.reasoningResponses} پاسخ بخش استدلال داشتند؛ ${diagnostics.finishReasons.length ?? 0} پاسخ به سقف طول رسیدند و ${diagnostics.timeoutFailures} مرحله با خطای زمان یا لغو مواجه شد. متن استدلال منتشر نمی‌شود و دلیل معتبر بودن پاسخ محسوب نمی‌شود.</p><p>حد استدلال ۷۶۸ توکن، سقف خروجی ۱۸۰۰ توکن و مهلت مشترک دو پاسخ ۲۴۰ ثانیه بود. تنظیم تولید و حالت استدلال با هم تغییر کردند؛ اثر جداگانهٔ هرکدام معلوم نیست. <a href="https://huggingface.co/Qwen/Qwen3.5-27B#best-practices" rel="noreferrer">راهنمای رسمی مدل</a> مبنای تنظیم نمونه‌گیری بود؛ محدودیت‌های محلی کوچک‌تر از توصیهٔ عمومی سازنده‌اند.</p><p>مرجع شامل املا، نشانه‌گذاری و انتخاب واژه هم هست. نبود اصلاح مرجع اثبات مستقلِ صحت جمله نیست؛ اختلاف با مرجع هم الزاماً خطای قطعی گرامری نیست. هیچ نمونه یا برچسبی حذف یا تغییر نکرد. دادهٔ آزمون نهایی مصرف نشده و داوری مستقلِ معنا و هدف تمرین تکمیل نشده است. تکرار داوری با همان مدل مستقل نیست.</p></details></section>`;
}
