import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Connect to a disposable local Chrome profile; never use the learner's browser storage.
const language = process.env.WORKSHEET_LANGUAGE || "de";
const app =
  process.env.WORKSHEET_TEST_URL ||
  (language === "en" ? "http://127.0.0.1:3202" : "http://127.0.0.1:3210");
assert(["127.0.0.1", "localhost"].includes(new URL(app).hostname));
const output = resolve(
  import.meta.dirname,
  `../../artifacts/grammar-worksheets/${language}`,
);
const pdfOutput = resolve(
  import.meta.dirname,
  `../../artifacts/grammar-worksheets/${language}/pdf`,
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


const report = {language, cases: [], errors};
try {
  await cdp("Runtime.enable"); await cdp("Page.enable");
  await cdp("Emulation.setDeviceMetricsOverride", {width: 1200, height: 1000, deviceScaleFactor: 1, mobile: false});
  const route = language === "en" ? "grammar" : "grammatik";
  await cdp("Page.navigate", {url: `${app}/${route}`});
  await until("document.querySelectorAll('.ws-paper').length === 3");
  await click('[data-page-select="3"]');
  const text = Array.from({length: 55}, (_, i) => `Line ${i + 1}: A saved learner response.`).join("\n") + "\nEND_OF_LEARNER_RESPONSE";
  await click('[data-ws-field="E1"]');
  await evaluate("document.querySelector('[data-ws-field=E1]').select()");
  await cdp("Input.insertText", {text});
  await click('[data-ink-field="E1"] [data-ink-open]');
  if (!await evaluate("document.querySelector('[data-ink-clear]').disabled")) await click('[data-ink-clear]');
  const pad = await evaluate("(() => {const r=document.querySelector('.ws-ink-pad').getBoundingClientRect();return {x:r.x+r.width*.2,y:r.y+r.height*.3}})()");
  await cdp("Input.dispatchMouseEvent", {type:"mousePressed",button:"left",buttons:1,pointerType:"pen",force:.5,clickCount:1,...pad});
  await cdp("Input.dispatchMouseEvent", {type:"mouseMoved",button:"left",buttons:1,pointerType:"pen",force:.7,x:pad.x+60,y:pad.y+35});
  await cdp("Input.dispatchMouseEvent", {type:"mouseReleased",button:"left",pointerType:"pen",clickCount:1,x:pad.x+60,y:pad.y+35});
  await click('[data-ink-close]');
  // Resizing an on-screen answer must not stretch the blank three-page handout.
  await evaluate("document.querySelector('[data-ws-field=E1]').style.height='600px'; window.print=()=>{};");
  await click('[data-ws-print]');
  await cdp("Emulation.setEmulatedMedia", {media:"print"});
  await cdp("Emulation.setDeviceMetricsOverride", {width:718,height:1047,deviceScaleFactor:1,mobile:false});
  const blank = await cdp("Page.printToPDF", {printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
  await writeFile(resolve(pdfOutput, `${language}-blank-after-writing-test.pdf`), Buffer.from(blank.data,"base64"));
  await cdp("Emulation.setEmulatedMedia", {media:""});
  await cdp("Emulation.setDeviceMetricsOverride", {width:1200,height:1000,deviceScaleFactor:1,mobile:false});
  report.cases.push("Blank export after long writing, ink and field resizing is saved for a three-page check");
  // Exercise the actual export button while suppressing only the native dialog.
  await evaluate("window.__originalWorksheetPrint=window.print; window.print=()=>{};");
  await click('[data-ws-print-answers]');
  assert.equal(await evaluate("document.body.classList.contains('ws-print-answers')"), true);
  await cdp("Emulation.setEmulatedMedia", {media:"print"});
  await cdp("Emulation.setDeviceMetricsOverride", {width:718,height:1047,deviceScaleFactor:1,mobile:false});
  await evaluate("dispatchEvent(new Event('beforeprint'))");
  assert.equal(await evaluate("document.querySelector('[data-ink-field=E1] .ws-typed-print').textContent.endsWith('END_OF_LEARNER_RESPONSE')"), true);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('[data-ink-field=E1] .ws-ink-preview')).display"), "block");
  const file = await cdp("Page.printToPDF", {printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
  await writeFile(resolve(pdfOutput, `${language}-filled-answers-test.pdf`), Buffer.from(file.data,"base64"));
  report.cases.push("Actual answer export includes full long text and visible ink; saved as a PDF for text and image inspection");
  await cdp("Emulation.setEmulatedMedia", {media:""});
  await cdp("Emulation.setDeviceMetricsOverride", {width:1200,height:1000,deviceScaleFactor:1,mobile:false});
  await evaluate("window.print=window.__originalWorksheetPrint; window.__saveWorksheet=Storage.prototype.setItem; Storage.prototype.setItem=function(){throw new DOMException('Test quota','QuotaExceededError')}");
  await click('[data-ws-field="E1-why"]'); await cdp("Input.insertText",{text:"Unsaved reason"});
  assert.match(await evaluate("document.querySelector('[data-save-status]').textContent"), /Saving is unavailable|Speichern nicht möglich/);
  await evaluate("Storage.prototype.setItem=window.__saveWorksheet");
  report.cases.push("Storage quota failure is reported without claiming the draft was saved");
  assert.deepEqual(errors,[]); report.status="passed";
} catch (error) { report.status="failed"; report.failure=error.stack; process.exitCode=1; }
finally {
  await writeFile(resolve(output,"input-export-verification.json"),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2)); socket.close();
  await fetch(`http://127.0.0.1:9337/json/close/${target.id}`).catch(()=>{});
}
