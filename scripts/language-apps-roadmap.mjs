import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destinations = [
  "docs/language-apps-roadmap.html",
  "Apps/English/English-Automaticity/apps/web/public/roadmap.html",
  "Apps/Deutsch/Deutsch-Automaticity/apps/web/public/roadmap.html",
];
const labels = { todo: "در انتظار", doing: "در حال انجام", tested: "آزمایش‌شده", published: "منتشرشده", blocked: "متوقف: نیاز به دسترسی" };
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

const changeLabels = { published: "منتشر روی لینک اصلی", local: "فقط محلی؛ منتشر نشده", planned: "برنامه‌ریزی‌شده" };

// Optional sections. Older JSON without these fields still renders.
function renderLocalLink(app) {
  if (!app.local) return "";
  return `<a dir="ltr" href="${escape(app.local.url)}">${escape(app.local.url)}</a><small>اجرای محلی: <bdi dir="ltr">${escape(app.local.start)}</bdi></small>`;
}

function renderInstall(data) {
  if (!data.install?.length) return "";
  return `<section class="block" aria-labelledby="install-title"><h2 id="install-title">نصب اپ‌ها</h2><p>${escape(data.installIntro ?? "")}</p><div class="grid">${data.install.map((entry) => `<article><h3>${escape(entry.device)}</h3><ol>${entry.steps.map((step) => `<li>${escape(step)}</li>`).join("")}</ol></article>`).join("")}</div></section>`;
}

function renderChanges(data) {
  if (!data.changes?.length) return "";
  return `<section class="block" aria-labelledby="changes-title"><h2 id="changes-title">آخرین تغییرات</h2><ol class="changes">${data.changes.map((change) => `<li><div class="top"><span class="id"><bdi>${escape(change.date)}</bdi>${change.ref ? ` · <bdi dir="ltr">${escape(change.ref)}</bdi>` : ""}</span><span class="status ${change.state === "published" ? "published" : change.state === "local" ? "tested" : ""}">${escape(changeLabels[change.state] ?? change.state)}</span></div><strong>${escape(change.title)}</strong><p>${escape(change.detail)}</p></li>`).join("")}</ol></section>`;
}

function renderJumpLinks(data) {
  const links = [
    data.install?.length && ["install-title", "نصب اپ‌ها"],
    data.changes?.length && ["changes-title", "آخرین تغییرات"],
    ["items-title", "مراحل اصلاح"],
    data.handoff && ["handoff-title", "ادامه در گفت‌وگوی جدید"],
  ].filter(Boolean);
  if (links.length < 2) return "";
  return `<nav class="jump" aria-label="پرش به بخش‌ها">${links.map(([id, label]) => `<a href="#${id}">${label}</a>`).join("")}</nav>`;
}

function renderHandoff(data) {
  if (!data.handoff) return "";
  const { prompt, next = [], notes = [] } = data.handoff;
  return `<section class="block handoff" aria-labelledby="handoff-title"><h2 id="handoff-title">ادامه در گفت‌وگوی جدید</h2><p>این متن را در گفت‌وگوی تازه بچسبانید تا کار از همین نقطه ادامه پیدا کند.</p><pre id="handoff-prompt" dir="auto">${escape(prompt)}</pre><button type="button" id="copy-handoff">کپی متن ادامه</button> <span id="copy-status" role="status"></span>${next.length ? `<h3>قدم‌های بعدی</h3><ol>${next.map((step) => `<li>${escape(step)}</li>`).join("")}</ol>` : ""}${notes.length ? `<h3>نکته‌های مهم</h3><ul>${notes.map((note) => `<li>${escape(note)}</li>`).join("")}</ul>` : ""}<script>document.getElementById("copy-handoff").addEventListener("click",async()=>{const s=document.getElementById("copy-status");try{await navigator.clipboard.writeText(document.getElementById("handoff-prompt").textContent);s.textContent="کپی شد."}catch{s.textContent="کپی خودکار ممکن نشد؛ متن را انتخاب و کپی کنید."}});</script></section>`;
}

export function renderRoadmap(data) {
  const complete = data.items.filter((item) => ["tested", "published"].includes(item.status)).length;
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>رودمپ اصلاح اپ‌های زبان</title><style>
  *{box-sizing:border-box}body{margin:0;background:#f4f5f9;color:#192139;font:16px/1.85 Tahoma,Arial,sans-serif}main{max-width:1080px;margin:auto;padding:32px 20px 60px}header{border-bottom:1px solid #ccd4e2;padding-bottom:24px}h1{font-size:clamp(25px,5vw,38px);margin:10px 0}h2{font-size:21px}h3{margin:0;font-size:19px}p{margin:10px 0}a{color:#183ea6;text-underline-offset:4px;overflow-wrap:anywhere}a:focus-visible,summary:focus-visible{outline:3px solid #8b3cd6;outline-offset:5px}.muted{color:#526078}.eyebrow{color:#4b338e;font-weight:bold}.apps,.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.app,article{background:white;border:1px solid #d6deeb;border-radius:16px;padding:20px}.apps{margin:24px 0}.app a{display:block;padding:6px 0;min-height:44px}.app small{display:block}.progress{display:flex;align-items:center;flex-wrap:wrap;gap:16px;margin:20px 0}progress{accent-color:#5e42a4;height:16px;width:min(100%,360px)}.status{display:inline-block;border-radius:20px;padding:3px 12px;font-size:13px;background:#edf0f5;color:#35435b}.doing{background:#e9e5fb;color:#453078}.tested{background:#e0f3e9;color:#14603d}.published{background:#d5efe4;color:#114b36}.blocked{background:#fff0d8;color:#704700}.top{display:flex;gap:12px;justify-content:space-between;align-items:start}.id{font:13px/1.6 monospace;color:#65718a}.finding{border-right:3px solid #cbbde6;padding-right:12px}summary{cursor:pointer;padding:10px 0;min-height:44px}details p{font-size:14px;color:#526078}.history{background:#e9edf5;border-radius:16px;padding:20px;margin-top:24px}li{margin:10px 0}footer{margin-top:30px;font-size:14px;color:#526078}.block{margin-top:28px}.jump{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.jump a{display:inline-flex;align-items:center;min-height:44px;padding:6px 14px;border-radius:22px;background:white;border:1px solid #cbbde6;text-decoration:none}.block article h3{margin-bottom:8px}ol,ul{padding-right:22px}.changes{list-style:none;padding:0;display:grid;gap:12px}.changes li{background:white;border:1px solid #d6deeb;border-radius:16px;padding:16px;margin:0}.changes p{margin:6px 0 0;font-size:15px;color:#35435b}.handoff{background:white;border:2px solid #cbbde6;border-radius:16px;padding:20px}.handoff pre{white-space:pre-wrap;background:#f4f5f9;border-radius:12px;padding:14px;font:14px/1.8 Tahoma,Arial,sans-serif;max-height:420px;overflow:auto}.handoff button{min-height:44px;padding:8px 18px;border-radius:12px;border:1px solid #5e42a4;background:#5e42a4;color:white;font:inherit;cursor:pointer}@media(max-width:660px){main{padding:20px 14px 40px}.apps,.grid{grid-template-columns:1fr}.top{flex-wrap:wrap}.app,article{padding:17px}}
  </style></head><body><main><header><span class="eyebrow">برنامه بهبود دو اپ زبان</span><h1>رودمپ نقد، اصلاح و انتشار</h1><p>${escape(data.summary)}</p><p class="muted">به‌روزرسانی: <bdi>${escape(data.updated)}</bdi> · نسخه این برنامه: <bdi>${escape(data.release)}</bdi></p><a href="/">بازگشت به اپ</a>${renderJumpLinks(data)}</header><section class="apps" aria-label="لینک‌های ثابت">${data.apps.map((app) => `<div class="app"><strong dir="ltr">${escape(app.name)}</strong><a dir="ltr" href="${escape(app.url)}">${escape(app.url)}</a>${renderLocalLink(app)}<a href="${escape(new URL("assessment-benchmarks.html", app.url).href)}">آزمون ارزیاب‌های متن و صوت</a><a href="${escape(new URL("microphone-check.html", app.url).href)}">آزمون میکروفن و بازپخش</a><small>${escape(app.publication)}</small></div>`).join("")}</section>${renderInstall(data)}${renderChanges(data)}<p>لینک‌های اصلی ثابت می‌مانند. «آزمایش‌شده» به معنی تأیید محلی است؛ «منتشرشده» فقط پس از تأیید نسخه روی لینک اصلی ثبت می‌شود.</p><div class="progress"><progress value="${complete}" max="${data.items.length}" aria-label="تعداد بخش‌های آزمایش‌شده یا منتشرشده"></progress><span>${complete} از ${data.items.length} بخش آزمایش یا منتشر شده</span></div><h2 id="items-title">مراحل اصلاح</h2><section class="grid" aria-label="مراحل اصلاح">${data.items.map((item) => `<article><div class="top"><span class="id">${escape(item.id)}</span><span class="status ${escape(item.status)}">${escape(labels[item.status] ?? item.status)}</span></div><h2>${escape(item.title)}</h2><p class="finding">${escape(item.finding)}</p><p>${escape(item.action)}</p><details><summary>شواهد و نتیجه بررسی</summary><p>${escape(item.evidence)}</p></details></article>`).join("")}</section><section class="history"><h2>سابقه تغییرات</h2><ul>${data.history.map((entry) => `<li>${escape(entry)}</li>`).join("")}</ul></section>${renderHandoff(data)}<footer>با انتشار هر مجموعه اصلاح، همین رودمپ هم به‌روزرسانی می‌شود. برای دیدن آخرین وضعیت، صفحه را تازه کنید. پاسخ‌ها و پیشرفت یادگیری هر دستگاه مستقل هستند مگر انتقال یا همگام‌سازی جداگانه انجام شود.</footer></main></body></html>`;
}

export function renderRoadmapMarkdown(data) {
  return [
    "# رودمپ نقد و اصلاح اپ‌های زبان",
    `به‌روزرسانی: ${data.updated} · نسخه: ${data.release}`,
    data.summary,
    ...data.apps.map((app) => `- [${app.name}](${app.url})${app.local ? ` · محلی: ${app.local.url} (${app.local.start})` : ""} — ${app.publication}`),
    ...(data.install?.length ? ["## نصب اپ‌ها", ...data.install.map((entry) => `**${entry.device}:** ${entry.steps.join("؛ ")}`)] : []),
    ...(data.changes?.length ? ["## آخرین تغییرات", ...data.changes.map((change) => `- ${change.date}${change.ref ? ` (${change.ref})` : ""} — ${change.title} [${changeLabels[change.state] ?? change.state}]: ${change.detail}`)] : []),
    "",
    ...data.items.flatMap((item) => [
      `## ${item.id} — ${item.title} (${labels[item.status]})`,
      item.finding, item.action, `نتیجه: ${item.evidence}`, "",
    ]),
    "## سابقه", ...data.history.map((entry) => `- ${entry}`),
    ...(data.handoff ? ["## ادامه در گفت‌وگوی جدید", data.handoff.prompt, ...(data.handoff.next ?? []).map((step) => `- ${step}`)] : []),
    "",
    "منبع وضعیت: language-apps-roadmap.json. صفحه قابل مشاهده: language-apps-roadmap.html.",
  ].join("\n\n");
}

async function readSource(root) {
  return JSON.parse(await readFile(resolve(root, "docs/language-apps-roadmap.json"), "utf8"));
}

// A root parameter keeps checks testable without changing working directories.
export async function synchronizeRoadmap({ root = repositoryRoot, check = false, app } = {}) {
  if (app !== undefined && !["en", "de"].includes(app)) throw new Error(`Unknown app: ${app}. Use en or de.`);
  if (app !== undefined && !check) throw new Error("--app requires --check; generation updates every roadmap output.");
  const data = await readSource(root);
  const html = renderRoadmap(data);
  const outputs = app === undefined
    ? [...destinations.map((destination) => [destination, html]), ["docs/LANGUAGE-APPS-IMPROVEMENT-ROADMAP.md", renderRoadmapMarkdown(data)]]
    : [[destinations[app === "en" ? 1 : 2], html]];
  if (check) {
    const stale = [];
    for (const [destination, content] of outputs) {
      try {
        const actual = await readFile(resolve(root, destination));
        if (!actual.equals(Buffer.from(content, "utf8"))) stale.push(destination);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        stale.push(destination);
      }
    }
    if (stale.length) throw new Error(`Generated roadmap files are stale or missing:\n${stale.map((path) => `- ${path}`).join("\n")}\nFinalize docs/language-apps-roadmap.json, then run bun scripts/language-apps-roadmap.mjs from the repository root before building.`);
  } else {
    for (const [destination, content] of outputs) {
      const file = resolve(root, destination);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, content);
    }
  }
  return outputs.map(([destination]) => destination);
}

function parseOptions(args) {
  const options = { check: false, serve: false };
  for (const arg of args) {
    if (arg === "--check") options.check = true;
    else if (arg === "--serve") options.serve = true;
    else if (arg.startsWith("--app=")) {
      if (options.app !== undefined) throw new Error("--app may only be provided once.");
      options.app = arg.slice("--app=".length);
    } else throw new Error(`Unknown option: ${arg}. Use --check, --app=en|de, or --serve.`);
  }
  if (options.app !== undefined && !["en", "de"].includes(options.app)) throw new Error(`Unknown app: ${options.app}. Use en or de.`);
  if (options.app !== undefined && !options.check) throw new Error("--app requires --check.");
  if (options.serve && (options.check || options.app !== undefined)) throw new Error("--serve cannot be combined with --check or --app.");
  return options;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseOptions(process.argv.slice(2));
    if (options.serve) {
      Bun.serve({ hostname: "127.0.0.1", port: 3318, async fetch(request) {
        if (!["/", "/roadmap.html"].includes(new URL(request.url).pathname)) return new Response("Not found", { status: 404 });
        return new Response(renderRoadmap(await readSource(repositoryRoot)), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
      }});
      console.log("Roadmap: http://127.0.0.1:3318/");
    } else {
      const paths = await synchronizeRoadmap(options);
      console.log(options.check ? `Roadmap current in ${paths.length} files.` : `Roadmap updated in ${destinations.length} locations.`);
    }
  } catch (error) {
    console.error(`Roadmap: ${error.message}`);
    process.exitCode = 1;
  }
}
