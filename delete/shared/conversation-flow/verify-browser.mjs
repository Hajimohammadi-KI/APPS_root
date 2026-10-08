import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertTestTarget } from "../device-access/browser-target.mjs";

// Connect to a disposable local Chrome profile; never use the learner's browser storage.
const language = process.env.CONVERSATION_LANGUAGE || "de";
const app =
  process.env.CONVERSATION_TEST_URL ||
  (language === "en" ? "http://127.0.0.1:3251" : "http://127.0.0.1:3250");
assertTestTarget(app);
const output = resolve(
  import.meta.dirname,
  `../../artifacts/conversation-flow/${process.env.DEVICE_TEST_HOST ? "devices/" : ""}${language}`,
);
const pdfOutput = resolve(
  import.meta.dirname,
  `../../artifacts/conversation-flow/${process.env.DEVICE_TEST_HOST ? "devices/" : ""}${language}/pdf`,
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
    `performance.timeOrigin !== ${previous} && document.querySelector('.conversation-flow')?.dataset.hydrated === 'true'`,
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

// Synthetic input is confined to this disposable test tab. The real MediaRecorder
// encodes a generated tone; no personal microphone or external ASR is accessed.
await cdp("Page.enable");
await cdp("Runtime.enable");
// Test-profile exception only. Device trust is verified separately using the private CA.
if (new URL(app).protocol === "https:" && process.env.DEVICE_TEST_HOST)
  await cdp("Security.setIgnoreCertificateErrors", { ignore: true });
await cdp("Page.addScriptToEvaluateOnNewDocument", { source: `
localStorage.removeItem('studio:instructions:de');localStorage.removeItem('studio:instructions:en');
window.__micError = '';
window.__providerDown = false;
window.__transcript = ${JSON.stringify(language === "de" ? "Ich haben zwei Kinder." : "He have two kids.")};
navigator.mediaDevices.getUserMedia = async () => {
  if (window.__micError) throw new DOMException('Test microphone state', window.__micError);
  const context = new AudioContext(); const destination = context.createMediaStreamDestination();
  const tone = context.createOscillator(); tone.frequency.value = 220; tone.connect(destination); tone.start();
  await context.resume(); window.__testContext = context;
  return destination.stream;
};
window.SpeechRecognition = class {
  start() { setTimeout(() => this.onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:window.__transcript}}]}), 150); }
  stop() { this.onend?.(); }
};
const realFetch = window.fetch.bind(window);
window.fetch = async (url, options) => {
  if (url !== '/api/conversation/evaluate') return realFetch(url, options);
  if (window.__providerDown) return new Response('{}', {status:503});
  const {text} = JSON.parse(options.body);
  return new Response(JSON.stringify({original:text,corrected:text,provider:'LanguageTool',checkedAt:new Date().toISOString(),issues:[{offset:${language === 'de' ? 4 : 3},length:${language === 'de' ? 5 : 4},replacements:[${JSON.stringify(language === "de" ? "habe" : "has")}],message:'Synthetic provider fixture: subject and verb must agree.',ruleId:'TEST_AGREEMENT',category:'Grammar'}]}),{headers:{'content-type':'application/json'}});
};
window.__records = async (store='attempts-v2') => new Promise((resolve,reject) => {
  const request = indexedDB.open('conversation-studio',2);
  request.onsuccess=()=>{const db=request.result;const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>{db.close();resolve(r.result)};r.onerror=()=>reject(r.error)};
});
` });
await cdp("Emulation.setDeviceMetricsOverride", { width: 1672, height: 941, deviceScaleFactor: 1, mobile: false });
await cdp("Page.navigate", { url: `${app}/studio` });
await until("document.querySelector('.conversation-flow')?.dataset.hydrated === 'true'");
// Remove only this test origin's attempts before a repeat run.
await evaluate(`new Promise(resolve=>{const r=indexedDB.open('conversation-studio',2);r.onsuccess=()=>{const db=r.result;const t=db.transaction(['attempts-v2','reviews-v2'],'readwrite');t.objectStore('attempts-v2').clear();t.objectStore('reviews-v2').clear();t.oncomplete=()=>{db.close();resolve(true)}}})`);
await reload();
assert.equal(await evaluate("document.querySelectorAll('.cf-hint').length"), 2);
assert.equal(await evaluate("!!document.querySelector('.cf-task') && !document.querySelector('textarea') && !document.querySelector('.cf-measurements')"), true);
await screenshot("prepare-desktop");
await click('.cf-primary.cf-wide');
assert.equal(await evaluate("!document.querySelector('.cf-task') && !document.querySelector('.cf-measurements')"), true);
for (const name of ["NotAllowedError", "NotFoundError", "NotReadableError"]) {
  await evaluate(`window.__micError=${JSON.stringify(name)}`);
  await click('.cf-mic');
  await until("!!document.querySelector('.cf-status') && !document.querySelector('.cf-mic').disabled");
  assert.ok(await evaluate("document.querySelector('.cf-status').textContent.length > 20"));
}
await evaluate("window.__micError=''");
await click('.cf-mic');
await until("document.querySelector('.cf-mic')?.dataset.recording === 'true' && document.querySelector('.cf-time').textContent !== '0:00'");
await screenshot("speak-desktop");
await click('.cf-record-actions button:first-child');
const paused = await evaluate("document.querySelector('.cf-time').textContent");
await new Promise(resolve => setTimeout(resolve, 1200));
assert.equal(await evaluate("document.querySelector('.cf-time').textContent"), paused);
await click('.cf-record-actions button:first-child');
await new Promise(resolve => setTimeout(resolve, 1000));
await click('.cf-record-actions button:last-child');
await until("document.querySelector('.conversation-flow').dataset.stage === 'feedback' && document.querySelector('audio') && document.querySelector('textarea').value.length > 0");
await until("window.__records().then(rows=>rows.length===1 && rows[0].captureState==='stopped' && rows[0].audio.size>0)");
const original = await evaluate("window.__records().then(async rows=>{const a=rows[0];return {id:a.id,raw:a.rawTranscript,duration:a.durationMs,size:a.audio.size,hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await a.audio.arrayBuffer()))).join(','),evaluated:!!a.evaluation,completed:!!a.completedAt}})");
assert.equal(original.evaluated, false); assert.equal(original.completed, false); assert.ok(original.duration > 1500);
await evaluate("document.querySelector('.audio-playback-speed select').value='0.75';document.querySelector('.audio-playback-speed select').dispatchEvent(new Event('change',{bubbles:true}))");
await until("document.querySelector('audio').playbackRate===0.75");
await click('.cf-transcript + button');
await evaluate("window.__providerDown=true");
await click('.cf-transcript-editor > .cf-primary');
await until("!!document.querySelector('.cf-status')");
assert.equal(await evaluate("window.__records().then(rows=>!!rows[0].evaluation)"), false);
await evaluate("window.__providerDown=false");
await click('.cf-transcript-editor > .cf-primary');
await until("!!document.querySelector('.cf-correction')");
await screenshot("feedback-desktop");
assert.ok(await evaluate("document.querySelector('.cf-cause').textContent.includes('Synthetic provider')"));
await click('.cf-review-days input');
await until("window.__records('reviews-v2').then(rows=>rows.length===1)");
assert.equal(await evaluate("window.__records('reviews-v2').then(rows=>!!rows[0].completedAt)"), false);
await click('.cf-transcript-editor > summary');
// Editing invalidates grammar feedback but keeps the original recording immutable.
await evaluate(`(()=>{const t=document.querySelector('.cf-transcript textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(t,${JSON.stringify(language === "de" ? "Ich habe drei Kinder." : "He has three children.")});t.dispatchEvent(new Event('input',{bubbles:true}));})()`);
await until("!document.querySelector('.cf-correction')");
assert.equal(await evaluate("window.__records().then(rows=>rows[0].rawTranscript)"), original.raw);
await click('.cf-primary.cf-wide');
await click('.cf-mic');
await until("document.querySelector('.cf-time').textContent !== '0:00'");
await click('.cf-record-actions button:last-child');
await until("document.querySelector('.conversation-flow').dataset.stage==='feedback'");
await until("window.__records().then(rows=>rows.length===2 && rows.every(r=>r.captureState==='stopped'))");
const retained = await evaluate(`window.__records().then(async rows=>{const a=rows.find(r=>r.id===${JSON.stringify(original.id)});const retry=rows.find(r=>r.id!==a.id);return {hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await a.audio.arrayBuffer()))).join(','),kind:retry.kind,parent:retry.parentId,duration:a.durationMs}})`);
assert.equal(retained.hash, original.hash); assert.equal(retained.duration, original.duration); assert.equal(retained.kind, "immediate-retry"); assert.equal(retained.parent, original.id);
const backupModule = await readFile(resolve(import.meta.dirname, '../../.codex-tmp/conversation-flow/backup-test.js'));
await evaluate(`import('data:text/javascript;base64,${backupModule.toString('base64')}').then(module=>{window.TestBackup=module;return true;})`);
const backupResult = await evaluate(`(async()=>{
 const p={storage:localStorage,indexedDB}; const backup=await TestBackup.captureCompleteBackup(p,${JSON.stringify(language)});
 const studio=backup.databases.find(db=>db.name==='conversation-studio');
 if(!studio) throw new Error('Conversation media omitted from complete backup');
 await new Promise(resolve=>{const r=indexedDB.open('conversation-studio',2);r.onsuccess=()=>{const db=r.result;const t=db.transaction('attempts-v2','readwrite');t.objectStore('attempts-v2').clear();t.oncomplete=()=>{db.close();resolve()}}});
 await TestBackup.restoreCompleteBackup(p,backup,${JSON.stringify(language)});
 const rows=await window.__records();const first=rows.find(r=>r.id===${JSON.stringify(original.id)});
 return {count:rows.length,hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await first.audio.arrayBuffer()))).join(',')};
})()`);
assert.equal(backupResult.count,2); assert.equal(backupResult.hash,original.hash);
await cdp("Page.navigate", { url: `${app}/studio?attempt=${original.id}` });
await until("document.querySelector('.conversation-flow')?.dataset.stage==='feedback' && document.querySelector('audio')?.playbackRate===0.75");
for (const width of [390, 768, 1117]) {
  await cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: true });
  await screenshot(`feedback-${width}`);
  assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth"), `Feedback overflow at ${width}`);
  assert.ok(await evaluate("(() => { const el=document.querySelector('.cf-top select'); const r=el.getBoundingClientRect(); return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===el; })()"), `Instruction selector covered at ${width}`);
}
await cdp("Page.navigate", { url: `${app}${language === "en" ? "/?screen=library" : "/audio"}` });
await until("document.querySelectorAll('.conversation-library-card audio').length===2");
assert.ok(await evaluate("[...document.querySelectorAll('.conversation-library-card audio')].every(a=>a.playbackRate===0.75)"));
await screenshot("audio-library-mobile");
await cdp("Page.navigate", { url: `${app}/studio` });
await until("document.querySelector('.conversation-flow')?.dataset.stage==='prepare'");
await evaluate(`new Promise(resolve=>{const r=indexedDB.open('conversation-studio',2);r.onsuccess=()=>{const db=r.result;const t=db.transaction('reviews-v2','readwrite');const store=t.objectStore('reviews-v2');const all=store.getAll();all.onsuccess=()=>store.put({...all.result[0],dueAt:new Date(Date.now()-60000).toISOString()});t.oncomplete=()=>{db.close();resolve()}}})`);
await reload();
await click('.cf-library > summary');
await click('.cf-library > div:last-child button');
assert.equal(await evaluate("document.querySelectorAll('.cf-hint').length"),0);
assert.equal(await evaluate("document.querySelector('textarea')===null"),true);
assert.ok(await evaluate(`document.querySelector('.cf-task').textContent.includes(${JSON.stringify(language === 'de' ? 'Neue Situation' : 'New situation')})`));
await cdp("Page.navigate", { url: `${app}/studio` });
await until("document.querySelector('.conversation-flow')?.dataset.stage==='prepare'");
await cdp("Emulation.setDeviceMetricsOverride", { width:390,height:844,deviceScaleFactor:1,mobile:true });
await screenshot("prepare-mobile");
await evaluate("document.querySelector('.cf-top select').value='fa';document.querySelector('.cf-top select').dispatchEvent(new Event('change',{bubbles:true}))");
await screenshot("prepare-persian-mobile");
assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth"));
const report = {language, app, status:"PASS", original, retained, backupResult, checks:["three exclusive screens", "two optional hints", "permission/missing/device failure", "real MediaRecorder with synthetic tone", "pause excludes elapsed time", "draft saved before evaluation", "provider unavailable retains draft", "confirmed evaluation", "edit invalidation", "retry retains first audio hash", "review schedule is not completion", "fresh delayed review hides hints and previous answers", "complete backup restores both audio blobs", "speed persists after navigation", "audio library contains both attempts", "mobile/tablet layout", "Persian instructions"], runtimeErrors:errors};
assert.deepEqual(errors, []);
await writeFile(resolve(output,"verification.json"),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
socket.close();
await fetch(`http://127.0.0.1:9337/json/close/${target.id}`);
