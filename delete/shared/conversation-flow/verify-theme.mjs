import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Connect to a disposable local Chrome profile; never use the learner's browser storage.
const language = process.env.CONVERSATION_LANGUAGE || "de";
const app =
  process.env.CONVERSATION_TEST_URL ||
  (language === "en" ? "http://127.0.0.1:3251" : "http://127.0.0.1:3250");
assert(["127.0.0.1", "localhost"].includes(new URL(app).hostname));
const output = resolve(
  import.meta.dirname,
  `../../artifacts/conversation-flow/${language}`,
);
const pdfOutput = resolve(
  import.meta.dirname,
  `../../artifacts/conversation-flow/${language}/pdf`,
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

await cdp('Page.enable'); await cdp('Runtime.enable');
await cdp('Emulation.setDeviceMetricsOverride',{width:1500,height:1000,deviceScaleFactor:1,mobile:false});
const routes = language === 'de' ? ['/', '/heute', '/grammatik', '/studio', '/audio', '/fertigkeiten', '/fehler', '/wiederholungen', '/fortschritt', '/einstellungen', '/ressourcen', '/lehrkraft', '/automatik', '/themen', '/practice'] : ['/', '/daily', '/grammar', '/studio', '/?screen=library', '/?screen=integrated-skills', '/?screen=errors', '/?screen=progress', '/settings', '/resources', '/teacher', '/flashcards', '/practice'];
const rows=[];
for(const [index,route] of routes.entries()) {
  await cdp('Page.navigate',{url:app+route});
  await until("document.readyState==='complete' && document.body.innerText.length>100");
  await new Promise(resolve=>setTimeout(resolve,700));
  const result = await evaluate(`(()=>{
    function green(value) { const v=value.match(/[\\d.]+/g)?.map(Number); if(!v || v.length<3 || v[3]===0)return false;const [r,g,b]=v;return g>r*1.15 && g>b*1.06 && g-r>20; }
    const findings=[]; for(const el of document.querySelectorAll('body *')) {const box=el.getBoundingClientRect();if(!box.width||!box.height||el.closest('nextjs-portal'))continue;const css=getComputedStyle(el);if(css.visibility==='hidden')continue;for(const property of ['color','backgroundColor','borderTopColor','fill','stroke'])if(green(css[property]))findings.push({tag:el.tagName,class:el.getAttribute('class')?.slice(0,180),property,color:css[property],text:el.textContent.slice(0,55)});}
    const unreadableActiveNav = [...document.querySelectorAll('.nav-button[data-active="true"]')].some(el => { const css=getComputedStyle(el); return css.color===css.backgroundColor || (css.backgroundImage!=='none' && css.backgroundImage.includes(css.color)); });
    return {title:document.title,background:getComputedStyle(document.body).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth,unreadableActiveNav,sidebarOverlap:!!document.querySelector(".side") && !!document.querySelector(".content") && document.querySelector(".side").getBoundingClientRect().right > document.querySelector(".content").getBoundingClientRect().left+1,green:findings.slice(0,30)};
  })()`);
  rows.push({route,...result}); await screenshot(`page-${index}-desktop`);
}
await writeFile(resolve(output,'theme-verification.json'),JSON.stringify({language,rows},null,2));
assert.ok(rows.every(row=>!row.overflow && !row.sidebarOverlap && !row.unreadableActiveNav && row.green.length===0), 'Visible layout or palette regression; see theme-verification.json');
console.log(JSON.stringify({language,rows}));socket.close();await fetch(`http://127.0.0.1:9337/json/close/${target.id}`);
