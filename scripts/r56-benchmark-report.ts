interface Metrics {
  count: number; errors: number; clean: number; falseAccept: number;
  trueAccept: number; detectedErrors: number; abstentions: number;
  diagnosticScreenPassed: boolean;
}
export interface ContextReport {
  count: number; mode: string;
  latencyMs: { median: number; p95: number };
  languages: Record<"en" | "de", { candidate: Metrics; groups: number }>;
  releaseEligible: boolean;
}
export interface NamedCandidate { name: string; report: ContextReport }
const ratio = (value: number, total: number) => `<bdi>${value} / ${total}</bdi> (${total ? (100 * value / total).toFixed(1) : "—"}٪)`;
const escape = (text: string) => text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
function resultTable(candidate: NamedCandidate) {
  const metrics = (["en", "de"] as const).map(language => candidate.report.languages[language].candidate);
  return `<h3 dir="ltr">${escape(candidate.name)}</h3><div class="table-wrap"><table><thead><tr><th scope="col">شاخص</th><th scope="col">انگلیسی</th><th scope="col">آلمانی</th></tr></thead><tbody>
    <tr><th scope="row">پذیرش غلطِ جملهٔ دارای اصلاح</th>${metrics.map(c => `<td>${ratio(c.falseAccept, c.errors)}</td>`).join("")}</tr>
    <tr><th scope="row">پذیرش جملهٔ بدون اصلاح</th>${metrics.map(c => `<td>${ratio(c.trueAccept, c.clean)}</td>`).join("")}</tr>
    <tr><th scope="row">تشخیص جملهٔ دارای اصلاح</th>${metrics.map(c => `<td>${ratio(c.detectedErrors, c.errors)}</td>`).join("")}</tr>
    <tr><th scope="row">پاسخ بدون ارزیابی معتبر</th>${metrics.map(c => `<td>${ratio(c.abstentions, c.count)}</td>`).join("")}</tr>
    </tbody></table></div>`;
}
export function r56BenchmarkSection(candidates: NamedCandidate[], heldout: NamedCandidate | null, holdoutState: "unused" | "running" | "completed" | "interrupted"): string {
  if ((holdoutState === "completed") !== Boolean(heldout)) throw Error("Inconsistent holdout report state");
  const passed = heldout && Object.values(heldout.report.languages).every(x => x.candidate.diagnosticScreenPassed);
  const developmentReady = candidates.some(candidate => Object.values(candidate.report.languages).every(({candidate: c}) => c.errors === 32 && c.clean === 32 && c.falseAccept === 0 && c.trueAccept >= 29 && c.detectedErrors >= 29));
  const status = holdoutState === "completed" ? "تنظیم منتخب پس از بررسی توسعه، روی مجموعهٔ جداگانه اجرا شد." : holdoutState === "running" ? "آزمون نهایی در حال اجراست؛ هنوز گزارش کامل و قابل استناد ندارد." : holdoutState === "interrupted" ? "اجرای آزمون نهایی شروع و سپس متوقف شده است. این مجموعه دیگر دست‌نخورده محسوب نمی‌شود و نتیجهٔ کامل ندارد." : developmentReady ? "یک تنظیم شرط اولیهٔ توسعه را گذرانده است؛ آزمون نهاییِ ۵۱۲ جمله‌ای هنوز اجرا نشده و نتیجه‌ای برای آن نداریم." : "هیچ تنظیمی شرط اولیهٔ صفر پذیرش غلط همراه با پذیرش و تشخیص دست‌کم ۲۹ از ۳۲ مورد در هر زبان را نگذراند؛ بنابراین مجموعهٔ ۵۱۲ جمله‌ایِ نهایی هنوز مصرف نشده و برای مدل بعدی محفوظ است.";
  return `<section id="r56"><h2>مدل‌های تازه و آزمون با بافت جمله — R56</h2>
    <p class="notice">${passed ? "شرط‌های عددی این نمونه محقق شدند؛ تأیید عمومی مدل و نمره‌دهی تمرین‌ها همچنان انجام نشده است." : "هدف صفر پذیرش غلط همراه با تشخیص کافی هنوز محقق نشده است. مدل‌های جدید برای نمره‌دهی عمومی فعال نشده‌اند."}</p>
    <p>${candidates.length} تنظیم مدل روی همان ۱۲۸ جملهٔ توسعه بررسی شدند. متنِ اصلیِ قبل و بعد از جمله به مدل داده شد؛ برچسب و متنِ اصلاح‌شدهٔ انسانی وارد درخواست مدل نشدند.</p>
    ${candidates.map(resultTable).join("")}
    <p>${status}</p>
${heldout ? resultTable(heldout) : ""}
    <p>«دارای اصلاح» برچسب اصلیِ مجموعه‌داده است و گرامر، املا، نشانه‌گذاری و انتخاب واژه را دربر می‌گیرد. بعضی اصلاح‌ها به بافت یا ترجیح ویراستار وابسته‌اند. برچسب‌ها برای کم‌کردن خطا تغییر نکردند؛ تفکیک دسته‌ها در گزارش عددی حفظ شده است.</p>
    <p>این نمونه با آزمون R55 متفاوت است؛ درصدهای دو آزمون مقایسهٔ مستقیمِ قبل و بعد نیستند. سندها، نویسندگان شناخته‌شدهٔ انگلیسی و متن‌های تکراری از هم جدا شدند. هویت نویسندگان آلمانی فراتر از سند معلوم نیست. سابقهٔ استفاده از داده‌های عمومی در آموزش مدل هم معلوم نیست.</p>
    <details><summary>شرط انتشار و حدود این آزمون</summary><p>شرط نهایی: صفر پذیرش غلط، دست‌کم ۱۰۰ نمونهٔ متفاوت از هر گروه اصلی در هر حوزه، کران پایین اطمینان ۹۵٪ برای پذیرش درست و تشخیص خطا دست‌کم ۹۰٪، و کران بالای پذیرش غلط حداکثر ۵٪. پاسخ‌های مبهم و خطاهای فنی از مخرج حذف نمی‌شوند. صفر در یک نمونه، تضمین صفر برای همهٔ جمله‌های آینده نیست.</p><p>R57: کد بررسی صلاحیت با این شرط‌ها هماهنگ شد؛ تکرار یک متن با شناسه‌های مختلف نمی‌تواند تعداد نمونهٔ لازم را پر کند. تأیید جداگانهٔ انسانی، معنای پاسخ و هدف هر تمرین همچنان لازم است. چند جمله از یک سند مستقل نیستند؛ فاصله‌های اطمینانِ جمله‌ای توصیفی‌اند.</p><p>پیشنهادهای اصلاح از نظر قالب و وجود عبارت شاهد کنترل شدند؛ درستی همهٔ اصلاح‌ها تأیید انسانی نشده است. نتیجهٔ پژوهشی، نمرهٔ تسلط زبان‌آموز نیست.</p></details>
    <p><a href="https://huggingface.co/Qwen/Qwen3-14B-GGUF">مدل رسمی Qwen3-14B</a> · <a href="https://huggingface.co/unsloth/Qwen3.5-9B-GGUF">نسخهٔ کم‌حجم Unsloth از Qwen3.5-9B</a> · <a href="/assessment-benchmarks.json">گزارش عددی و هش‌ها</a></p></section>`;
}
