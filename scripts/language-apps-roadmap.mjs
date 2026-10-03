import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destinations = [
  "docs/language-apps-roadmap.html",
  "Apps/English/English-Automaticity/apps/web/public/roadmap.html",
  "Apps/Deutsch/Deutsch-Automaticity/apps/web/public/roadmap.html",
];
const labels = { todo: "در انتظار", doing: "در حال انجام", tested: "آزمایش‌شده", published: "منتشرشده", blocked: "متوقف: نیاز به دسترسی" };
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

export function renderRoadmap(data) {
  const complete = data.items.filter((item) => ["tested", "published"].includes(item.status)).length;
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>رودمپ اصلاح اپ‌های زبان</title><style>
  *{box-sizing:border-box}body{margin:0;background:#f4f5f9;color:#192139;font:16px/1.85 Tahoma,Arial,sans-serif}main{max-width:1080px;margin:auto;padding:32px 20px 60px}header{border-bottom:1px solid #ccd4e2;padding-bottom:24px}h1{font-size:clamp(25px,5vw,38px);margin:10px 0}h2{font-size:21px}h3{margin:0;font-size:19px}p{margin:10px 0}a{color:#183ea6;text-underline-offset:4px;overflow-wrap:anywhere}a:focus-visible,summary:focus-visible{outline:3px solid #8b3cd6;outline-offset:5px}.muted{color:#526078}.eyebrow{color:#4b338e;font-weight:bold}.apps,.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.app,article{background:white;border:1px solid #d6deeb;border-radius:16px;padding:20px}.apps{margin:24px 0}.app a{display:block;padding:6px 0;min-height:44px}.app small{display:block}.progress{display:flex;align-items:center;flex-wrap:wrap;gap:16px;margin:20px 0}progress{accent-color:#5e42a4;height:16px;width:min(100%,360px)}.status{display:inline-block;border-radius:20px;padding:3px 12px;font-size:13px;background:#edf0f5;color:#35435b}.doing{background:#e9e5fb;color:#453078}.tested{background:#e0f3e9;color:#14603d}.published{background:#d5efe4;color:#114b36}.blocked{background:#fff0d8;color:#704700}.top{display:flex;gap:12px;justify-content:space-between;align-items:start}.id{font:13px/1.6 monospace;color:#65718a}.finding{border-right:3px solid #cbbde6;padding-right:12px}summary{cursor:pointer;padding:10px 0;min-height:44px}details p{font-size:14px;color:#526078}.history{background:#e9edf5;border-radius:16px;padding:20px;margin-top:24px}li{margin:10px 0}footer{margin-top:30px;font-size:14px;color:#526078}@media(max-width:660px){main{padding:20px 14px 40px}.apps,.grid{grid-template-columns:1fr}.top{flex-wrap:wrap}.app,article{padding:17px}}
  </style></head><body><main><header><span class="eyebrow">برنامه بهبود دو اپ زبان</span><h1>رودمپ نقد، اصلاح و انتشار</h1><p>${escape(data.summary)}</p><p class="muted">به‌روزرسانی: <bdi>${escape(data.updated)}</bdi> · نسخه این برنامه: <bdi>${escape(data.release)}</bdi></p><a href="/">بازگشت به اپ</a></header><section class="apps" aria-label="لینک‌های ثابت">${data.apps.map((app) => `<div class="app"><strong dir="ltr">${escape(app.name)}</strong><a dir="ltr" href="${escape(app.url)}">${escape(app.url)}</a><a href="${escape(new URL("assessment-benchmarks.html", app.url).href)}">آزمون ارزیاب‌های متن و صوت</a><a href="${escape(new URL("microphone-check.html", app.url).href)}">آزمون میکروفن و بازپخش</a><small>${escape(app.publication)}</small></div>`).join("")}</section><p>لینک‌های اصلی ثابت می‌مانند. «آزمایش‌شده» به معنی تأیید محلی است؛ «منتشرشده» فقط پس از تأیید نسخه روی لینک اصلی ثبت می‌شود.</p><div class="progress"><progress value="${complete}" max="${data.items.length}" aria-label="تعداد بخش‌های آزمایش‌شده یا منتشرشده"></progress><span>${complete} از ${data.items.length} بخش آزمایش یا منتشر شده</span></div><section class="grid" aria-label="مراحل اصلاح">${data.items.map((item) => `<article><div class="top"><span class="id">${escape(item.id)}</span><span class="status ${escape(item.status)}">${escape(labels[item.status] ?? item.status)}</span></div><h2>${escape(item.title)}</h2><p class="finding">${escape(item.finding)}</p><p>${escape(item.action)}</p><details><summary>شواهد و نتیجه بررسی</summary><p>${escape(item.evidence)}</p></details></article>`).join("")}</section><section class="history"><h2>سابقه تغییرات</h2><ul>${data.history.map((entry) => `<li>${escape(entry)}</li>`).join("")}</ul></section><footer>با انتشار هر مجموعه اصلاح، همین رودمپ هم به‌روزرسانی می‌شود. برای دیدن آخرین وضعیت، صفحه را تازه کنید. پاسخ‌ها و پیشرفت یادگیری هر دستگاه مستقل هستند مگر انتقال یا همگام‌سازی جداگانه انجام شود.</footer></main></body></html>`;
}

async function currentHtml() {
  return renderRoadmap(JSON.parse(await readFile(resolve(root, "docs/language-apps-roadmap.json"), "utf8")));
}

if (process.argv.includes("--serve")) {
  Bun.serve({ hostname: "127.0.0.1", port: 3318, async fetch(request) {
    if (!["/", "/roadmap.html"].includes(new URL(request.url).pathname)) return new Response("Not found", { status: 404 });
    return new Response(await currentHtml(), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  }});
  console.log("Roadmap: http://127.0.0.1:3318/");
} else if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const html = await currentHtml();
  for (const destination of destinations) {
    const file = resolve(root, destination);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
  }
  const data = JSON.parse(await readFile(resolve(root, "docs/language-apps-roadmap.json"), "utf8"));
  const markdown = [
    "# رودمپ نقد و اصلاح اپ‌های زبان",
    `به‌روزرسانی: ${data.updated} · نسخه: ${data.release}`,
    data.summary,
    ...data.apps.map((app) => `- [${app.name}](${app.url}) — ${app.publication}`),
    "",
    ...data.items.flatMap((item) => [
      `## ${item.id} — ${item.title} (${labels[item.status]})`,
      item.finding, item.action, `نتیجه: ${item.evidence}`, "",
    ]),
    "## سابقه", ...data.history.map((entry) => `- ${entry}`),
    "",
    "منبع وضعیت: language-apps-roadmap.json. صفحه قابل مشاهده: language-apps-roadmap.html.",
  ].join("\n\n");
  await writeFile(resolve(root, "docs/LANGUAGE-APPS-IMPROVEMENT-ROADMAP.md"), markdown);
  console.log(`Roadmap updated in ${destinations.length} locations.`);
}
