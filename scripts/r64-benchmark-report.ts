import { developmentCandidateReady } from "../research/assessment-benchmark/holdout-policy";
import type { loadEditCandidate } from "./r59-benchmark-report";

type Candidate = Awaited<ReturnType<typeof loadEditCandidate>>;
const ratio = (a: number, b: number) => `<bdi>${a} / ${b}</bdi>`;

export function r64BenchmarkSection(baseline: Candidate, candidate: Candidate) {
  const status = developmentCandidateReady(candidate.report)
    ? "معیار اولیهٔ توسعه گذشت؛ آزمون نهایی و داوری مستقل هنوز لازم‌اند. این نتیجه مجوز فعال‌سازی نیست."
    : "معیار مشترکِ دقت و پوشش نگذشت؛ این مدل هم برای ارزیابی عمومی فعال نشده است.";
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
    return `<table><caption>${language === "en" ? "انگلیسی" : "آلمانی"} — همان ۶۴ جملهٔ توسعه</caption><thead><tr><th scope="col">شاخص</th><th scope="col"><bdi>Qwen 27B</bdi> بدون استدلال</th><th scope="col"><bdi>Gemma 4</bdi></th></tr></thead><tbody>${rows.map(([label, oldValue, newValue]) => `<tr><th scope="row">${label}</th><td>${oldValue}</td><td>${newValue}</td></tr>`).join("")}</tbody></table>`;
  }).join("");
  return `<section id="r64"><h2>گسترش به خانوادهٔ مدل متفاوت — R64</h2><p>مدل <bdi>Gemma 4 26B-A4B Q4_0</bdi> با همان ۱۲۸ جمله، همان برچسب‌ها و دو بررسی برای هر جمله آزمایش شد. هیچ نمونه یا برچسبی برای بهترشدن نتیجه عوض نشد.</p><p class="notice">${status}</p>${tables}<p>ساختار معتبر: ${ratio(candidate.report.structurallyValidCalls, candidate.report.requestsStarted)} پاسخ. میانهٔ زمان دو بررسی <bdi>${(candidate.report.latencyMs.median / 1000).toFixed(1)}</bdi> ثانیه و صدک ۹۵ <bdi>${(candidate.report.latencyMs.p95 / 1000).toFixed(1)}</bdi> ثانیه؛ زمان محلی است و سرعت آنلاین را تأیید نمی‌کند.</p><details><summary>معیار و حدود اعتبار این مقایسه</summary><p>شرط توسعه برای هر دو زبان هم‌زمان: صفر پذیرش نمونهٔ دارای اصلاح، پذیرش حداقل ۲۹ از ۳۲ نمونهٔ بدون اصلاح و تشخیص حداقل ۲۹ از ۳۲ نمونهٔ دارای اصلاح. پذیرش صفر با ردکردن همهٔ پاسخ‌ها موفقیت محسوب نمی‌شود.</p><p>تفاوت خانواده و اندازهٔ مدل به‌تنهایی دلیل اعتبار نیست. فایل مدل، قالب پیام‌ها، تنظیم تولید، کد و داده با هش ثابت ثبت شدند و سازگاری پاسخ پیش از آزمون با جمله‌های جداگانه بررسی شد. دو بررسی از یک مدل مستقل نیستند. این کار، آزمایش مدل موجود است؛ وزن تازه‌ای در این پروژه آموزش داده نشده است.</p><p>اصلاح مرجع ممکن است گرامری یا ویراستاری باشد. داوری انسانی مستقلِ ضرورت اصلاح و حفظ معنا هنوز کامل نشده است. نتیجهٔ توسعه تضمین دقت ۱۰۰٪ برای جمله‌های آینده نیست. <a href="https://huggingface.co/ggml-org/gemma-4-26B-A4B-it-GGUF">منبع فایل مدل</a> · <a href="https://ai.google.dev/gemma/docs/capabilities/thinking">راهنمای رسمی قالب پاسخ</a></p></details></section>`;
}
