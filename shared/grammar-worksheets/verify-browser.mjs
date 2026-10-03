import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertTestTarget } from "../device-access/browser-target.mjs";

// Connect to a disposable local Chrome profile; never use the learner's browser storage.
const language = process.env.WORKSHEET_LANGUAGE || "de";
const app =
  process.env.WORKSHEET_TEST_URL ||
  (language === "en" ? "http://127.0.0.1:3202" : "http://127.0.0.1:3210");
assertTestTarget(app);
const output = resolve(
  import.meta.dirname,
  `../../artifacts/grammar-worksheets/${process.env.DEVICE_TEST_HOST ? "devices/" : ""}${language}`,
);
const pdfOutput = resolve(
  import.meta.dirname,
  `../../artifacts/grammar-worksheets/${process.env.DEVICE_TEST_HOST ? "devices/" : ""}${language}/pdf`,
);
await mkdir(output, { recursive: true });
await mkdir(pdfOutput, { recursive: true });
const target = await (
  await fetch("http://127.0.0.1:9337/json/new?about:blank", { method: "PUT" })
).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
let sequence = 0;
const pending = new Map();
const errors = [];
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(String(data));
  if (message.method === "Runtime.exceptionThrown")
    errors.push(message.params.exceptionDetails.text);
  if (!message.id) return;
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  clearTimeout(request.timeout);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(
        new Error(
          `CDP timeout: ${method} ${JSON.stringify(params).slice(0, 150)}`,
        ),
      );
    }, 50000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails)
    throw new Error(
      result.exceptionDetails.exception?.description ||
        result.exceptionDetails.text,
    );
  return result.result.value;
}
async function until(expression) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (await evaluate(expression).catch(() => false)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Condition did not become true: ${expression}`);
}
async function reload() {
  const previous = await evaluate("performance.timeOrigin");
  await cdp("Page.reload", { ignoreCache: true });
  await until(
    `performance.timeOrigin !== ${previous} && document.querySelectorAll('.ws-paper').length === 3`,
  );
}
async function click(selector) {
  await evaluate(
    `document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'center',behavior:'instant'})`,
  );
  await new Promise((resolve) => setTimeout(resolve, 220));
  const point = await evaluate(
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('Missing control'); const r=el.getBoundingClientRect(); const x=r.x+r.width/2,y=r.y+r.height/2; const hit=document.elementFromPoint(x,y); if(!el.contains(hit)) throw new Error('Control covered by '+hit?.outerHTML.slice(0,180)); return {x,y}; })()`,
  );
  await cdp("Input.dispatchMouseEvent", {
    type: "mousePressed",
    button: "left",
    clickCount: 1,
    ...point,
  });
  await cdp("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    button: "left",
    clickCount: 1,
    ...point,
  });
}
async function screenshot(name, selector) {
  await evaluate("window.scrollTo(0,0)");
  const clip = selector
    ? await evaluate(
        `(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}; })()`,
      )
    : undefined;
  const shot = await cdp("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    ...(clip ? { clip } : {}),
  });
  await writeFile(
    resolve(output, `${name}.png`),
    Buffer.from(shot.data, "base64"),
  );
}
async function pdf(name, solutions = false) {
  await evaluate(
    `document.body.classList.add('ws-printing'); document.body.classList.toggle('ws-print-solutions', ${solutions}); ${solutions ? "document.querySelectorAll('.ws-key').forEach(x=>x.open=true);" : ""}`,
  );
  await cdp("Emulation.setEmulatedMedia", { media: "print" });
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 718,
    height: 1047,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const geometry = await evaluate(
    "[...document.querySelectorAll('.ws-paper')].map(x=>({page:x.dataset.wsPage,height:x.offsetHeight,scroll:x.scrollHeight,break:getComputedStyle(x).breakAfter,footer:x.querySelector('footer').getBoundingClientRect().bottom-x.getBoundingClientRect().top}))",
  );
  if (!solutions)
    for (const sheet of geometry)
      assert(
        sheet.scroll <= sheet.height + 1,
        `${name}, page ${sheet.page}: print overflow ${sheet.scroll - sheet.height}px`,
      );
  report.printGeometry ??= {};
  report.printGeometry[name] = geometry;
  const file = await cdp("Page.printToPDF", {
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  });
  await writeFile(
    resolve(pdfOutput, `${name}.pdf`),
    Buffer.from(file.data, "base64"),
  );
  await evaluate(
    "document.body.classList.remove('ws-printing','ws-print-solutions'); document.querySelectorAll('.ws-key').forEach(x=>x.open=false)",
  );
  await cdp("Emulation.setEmulatedMedia", { media: "" });
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 1500,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

const report = {
  language,
  scope:
    "Synthetic browser and print verification; physical stylus hardware and learning outcomes are not measured.",
  cases: [],
  errors,
};
const storage =
  language === "en" ? "english-automaticity" : "deutsch-automaticity";
const topic = language === "en" ? "Verb be: am/is/are" : "Possessivartikel";
const route = language === "en" ? "grammar" : "grammatik";
const count = language === "en" ? 112 : 144;
const draftKey = () =>
  evaluate(
    `Object.keys(localStorage).find(k=>k.startsWith('${storage}:worksheet:v1:'))`,
  );
try {
  await cdp("Runtime.enable");
  await cdp("Page.enable");
  await cdp("Network.enable");
  await cdp("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 1500,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp("Page.navigate", {
    url: `${app}/${route}?topic=${encodeURIComponent(topic)}`,
  });
  await until("document.querySelectorAll('.ws-paper').length === 3");
  await evaluate(
    `Object.keys(localStorage).filter(k=>k.startsWith('${storage}:worksheet')).forEach(k=>localStorage.removeItem(k))`,
  );
  await reload();
  await until(
    "[...document.querySelectorAll('#grammarWorksheets img')].every(x=>x.complete && x.naturalWidth)",
  );
  assert.equal(
    await evaluate("window.GrammarWorksheets.worksheets.length"),
    count,
  );
  assert.equal(
    await evaluate("document.querySelectorAll('.topic').length"),
    count,
  );
  assert.equal(
    await evaluate(
      "getComputedStyle(document.querySelector('.ws-page-header')).backgroundColor",
    ),
    "rgb(61, 90, 158)",
  );
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.ws-answer-grid > .ws-field-label').length",
    ),
    24,
  );
  const progressBefore = await evaluate(
    `Object.fromEntries(Object.keys(localStorage).filter(k=>k.includes('grammar-progress')).map(k=>[k,localStorage[k]]))`,
  );
  await screenshot("desktop");
  for (const n of [1, 2, 3]) {
    await click(`[data-page-select="${n}"]`);
    await screenshot(`page-${n}`, `[data-ws-page="${n}"]`);
  }
  await click('[data-page-select="2"]');
  await click("[data-memory-toggle]");
  assert.equal(
    await evaluate(
      "document.querySelector('[data-memory-model]').getAttribute('aria-hidden')",
    ),
    "true",
  );
  await click("[data-memory-toggle]");
  await evaluate("document.querySelector('[data-timer-seconds]').value='3'");
  await click("[data-timer-start]");
  await until(
    "document.querySelector('[data-timer-status]').textContent.startsWith('S2:')",
  );
  await click("[data-timer-stop]");
  assert.equal(
    await evaluate("document.querySelector('[data-timer-start]').disabled"),
    false,
  );
  report.cases.push(
    "All catalog topics, local icons, exact palette, stage controls, reconstruction and timed oral drill",
  );

  await click('[data-page-select="3"]');
  await click('[data-ws-field="E1"]');
  const answer = language === "en" ? "I am ready." : "Das ist ihr Buch.";
  await cdp("Input.insertText", { text: answer });
  await click('[data-ws-field="review-3"]');
  await click('[data-ink-field="E1"] [data-ink-open]');
  assert.equal(
    await evaluate("document.querySelector('.ws-ink-dialog').open"),
    true,
  );
  const pad = await evaluate(
    "(() => {const r=document.querySelector('.ws-ink-pad').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()",
  );
  // CDP sends actual browser pen events, including pressure, not direct state mutations.
  const stroke = async (offset = 0) => {
    await cdp("Input.dispatchMouseEvent", {
      type: "mousePressed",
      button: "left",
      buttons: 1,
      pointerType: "pen",
      force: 0.3,
      x: pad.x + pad.w * 0.2,
      y: pad.y + pad.h * (0.3 + offset),
      clickCount: 1,
    });
    for (let i = 1; i <= 8; i++)
      await cdp("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        button: "left",
        buttons: 1,
        pointerType: "pen",
        force: 0.3 + i * 0.06,
        x: pad.x + pad.w * (0.2 + i * 0.05),
        y: pad.y + pad.h * (0.3 + offset + i * 0.035),
      });
    await cdp("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      button: "left",
      buttons: 0,
      pointerType: "pen",
      force: 0,
      x: pad.x + pad.w * 0.6,
      y: pad.y + pad.h * (0.58 + offset),
      clickCount: 1,
    });
  };
  await stroke();
  await stroke(0.15);
  let key = await draftKey();
  const inkCount = () =>
    evaluate(
      `JSON.parse(localStorage.getItem(${JSON.stringify(key)}))['E1:ink'].length`,
    );
  assert.equal(await inkCount(), 2);
  await click("[data-ink-undo]");
  assert.equal(await inkCount(), 1);
  await screenshot("pen-pad", ".ws-ink-dialog");
  await click("[data-ink-erase]");
  await cdp("Input.dispatchMouseEvent", {
    type: "mousePressed",
    button: "left",
    buttons: 1,
    pointerType: "pen",
    force: 0.5,
    x: pad.x + pad.w * 0.2,
    y: pad.y + pad.h * 0.3,
    clickCount: 1,
  });
  await cdp("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    button: "left",
    buttons: 0,
    pointerType: "pen",
    x: pad.x + pad.w * 0.2,
    y: pad.y + pad.h * 0.3,
    clickCount: 1,
  });
  assert.equal(await inkCount(), 0);
  await click("[data-ink-undo]");
  assert.equal(await inkCount(), 1);
  await click("[data-ink-clear]");
  assert.equal(await inkCount(), 0);
  await click("[data-ink-undo]");
  await click("[data-ink-close]");
  await reload();
  await click('[data-page-select="3"]');
  assert.equal(
    await evaluate("document.querySelector('[data-ws-field=E1]').value"),
    answer,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-ws-field=review-3]').checked",
    ),
    true,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-ink-field=E1] canvas').hidden",
    ),
    false,
  );
  assert.equal(await inkCount(), 1);
  assert.deepEqual(
    await evaluate(
      `Object.fromEntries(Object.keys(localStorage).filter(k=>k.includes('grammar-progress')).map(k=>[k,localStorage[k]]))`,
    ),
    progressBefore,
  );
  await evaluate(
    `document.querySelector('[data-ws-language]').value='${language}-fa';document.querySelector('[data-ws-language]').dispatchEvent(new Event('change',{bubbles:true}))`,
  );
  assert.equal(
    await evaluate(
      "getComputedStyle(document.querySelector('.ws-fa')).direction",
    ),
    "rtl",
  );
  assert.equal(
    await evaluate(
      "getComputedStyle(document.querySelector('[data-ws-field=E1]')).direction",
    ),
    "ltr",
  );
  assert.equal(await inkCount(), 1);
  report.cases.push(
    "Real browser pen events, pressure strokes, stroke eraser, undo/clear, typed and ink persistence after reload and language change, no mastery mutation",
  );

  for (const width of [390, 768, 1500]) {
    await cdp("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: width < 1000,
    });
    for (const n of [1, 2, 3]) {
      await click(`[data-page-select="${n}"]`);
      assert.equal(
        await evaluate("document.documentElement.scrollWidth > innerWidth"),
        false,
        `${width}px page ${n} overflow`,
      );
      if (width === 390) await screenshot(`mobile-${n}`);
    }
  }
  report.cases.push("All three stages fit phone, tablet and desktop widths");
  await click('[data-view="practice"]');
  assert.equal(
    await evaluate("document.querySelector('.lesson-stack').hidden"),
    false,
  );
  await click('[data-view="worksheets"]');

  await evaluate(
    `localStorage.removeItem('${storage}:worksheet-language'); localStorage.removeItem(${JSON.stringify(key)})`,
  );
  await cdp("Page.navigate", {
    url: `${app}/${route}?topic=${encodeURIComponent(topic)}`,
  });
  await reload();
  await pdf(`${language}-worksheets`);
  await pdf(`${language}-answer-key`, true);
  await evaluate(
    `document.querySelector('[data-ws-language]').value='${language}-fa';document.querySelector('[data-ws-language]').dispatchEvent(new Event('change',{bubbles:true}))`,
  );
  await pdf(`${language}-fa-worksheets`);
  // Measure every authored topic in both instruction modes at the actual A4 content width.
  await cdp("Emulation.setEmulatedMedia", { media: "print" });
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 718,
    height: 1047,
    deviceScaleFactor: 1,
    mobile: false,
  });
  report.layoutFailures = [];
  // Keep every catalog case, but yield between batches so a slow device does not
  // exceed one CDP command's deadline while laying out hundreds of A4 pages.
  for (let offset = 0; offset < count; offset += 12) {
    const failures = await evaluate(`(() => {
    const failures=[];
    for (const locale of ['${language}', '${language}-fa']) {
      localStorage.setItem('${storage}:worksheet-language',locale);
      for (const entry of window.GrammarWorksheets.worksheets.slice(${offset}, ${offset + 12})) {
        window.GrammarWorksheetUI.render({title:entry.topic,level:entry.level});
        document.body.classList.add('ws-printing');
        for (const paper of document.querySelectorAll('.ws-paper')) {
          const r=paper.getBoundingClientRect();
          const last=paper.querySelector('footer').getBoundingClientRect();
          if (paper.scrollHeight>paper.offsetHeight+2 || last.bottom>r.bottom+2) failures.push({topic:entry.topic,locale,page:paper.dataset.wsPage,overflow:Math.max(paper.scrollHeight-paper.offsetHeight,last.bottom-r.bottom)});
        }
      }
    }
    return failures;
  })()`);
    report.layoutFailures.push(...failures);
  }
  assert.deepEqual(
    report.layoutFailures,
    [],
    "Some worksheet topics overflow A4",
  );
  report.cases.push(
    `${count * 2 * 3} A4 page layouts fit across the full catalog and both instruction modes`,
  );
  assert.deepEqual(errors, []);
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.failure = error.stack;
  process.exitCode = 1;
  await screenshot("failure").catch(() => {});
} finally {
  await writeFile(
    resolve(output, "verification.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  socket.close();
  await fetch(`http://127.0.0.1:9337/json/close/${target.id}`).catch(() => {});
}
