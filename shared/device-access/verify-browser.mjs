import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import https from "node:https";
import { assertTestTarget } from "./browser-target.mjs";
const host = process.env.DEVICE_TEST_HOST;
assert(host, "Set DEVICE_TEST_HOST explicitly.");
const output = resolve("artifacts/device-access/browser");
await mkdir(output, { recursive: true });
const target = await (
  await fetch("http://127.0.0.1:9337/json/new?about:blank", { method: "PUT" })
).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((ok, fail) => {
  socket.addEventListener("open", ok, { once: true });
  socket.addEventListener("error", fail, { once: true });
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

const report = {
  host,
  checkedAt: new Date().toISOString(),
  cases: [],
  errors,
  physicalDeviceVerified: false,
};
try {
  await cdp("Page.enable");
  await cdp("Runtime.enable");
  await cdp("Network.enable");
  await cdp("Network.setCacheDisabled", { cacheDisabled: true });
  const remoteLoopback = [];
  socket.addEventListener("message", ({ data }) => {
    const msg = JSON.parse(String(data));
    if (
      msg.method === "Network.requestWillBeSent" &&
      /^https?:\/\/(127\.0\.0\.1|localhost):/.test(msg.params.request.url)
    )
      remoteLoopback.push(msg.params.request.url);
  });
  for (const [language, port, securePort, grammar, health] of [
    ["en", 3203, 3204, "grammar", "/api/health"],
    ["de", 3211, 3212, "grammatik", "/api/v1/health"],
  ]) {
    const app = `http://${host}:${port}`;
    assertTestTarget(app);
    for (const route of ["/", `/${grammar}`, "/practice", "/studio"]) {
      await cdp("Page.navigate", { url: app + route });
      await until(
        "document.readyState==='complete' && document.body.innerText.length>100",
      );
      if (route === "/studio")
        await until(
          "document.querySelector('.conversation-flow')?.dataset.hydrated==='true'",
        );
      for (const width of [390, 768, 1117]) {
        await cdp("Emulation.setDeviceMetricsOverride", {
          width,
          height: 844,
          deviceScaleFactor: 1,
          mobile: true,
        });
        await evaluate("document.fonts.ready");
        assert(
          await evaluate("document.documentElement.scrollWidth<=innerWidth"),
          `${language} ${route} overflow at ${width}`,
        );
        if (route === "/studio")
          assert(
            await evaluate(
              "(() => {const e=document.querySelector('.cf-top select'),r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e})()",
            ),
          );
      }
    }
    assert.equal(
      await evaluate(`fetch(${JSON.stringify(health)}).then(r=>r.status)`),
      200,
    );
    report.cases.push(
      `${language}: home, grammar, practice and conversation at 390, 768, 1117px; same-origin health 200`,
    );
    const topic = language === "en" ? "Verb be: am/is/are" : "Possessivartikel";
    await cdp("Page.navigate", {
      url: `${app}/${grammar}?topic=${encodeURIComponent(topic)}`,
    });
    await until("document.querySelectorAll('.ws-paper').length===3");
    // Clear only disposable test-profile worksheet drafts so repeated verification is independent.
    const prefix =
      language === "en"
        ? "english-automaticity:worksheet"
        : "deutsch-automaticity:worksheet";
    await evaluate(
      `Object.keys(localStorage).filter(k=>k.startsWith(${JSON.stringify(prefix)})).forEach(k=>localStorage.removeItem(k))`,
    );
    await reload();
    await cdp("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await click('[data-page-select="3"]');
    await click('[data-ws-field="E1"]');
    await cdp("Input.insertText", { text: "Device draft" });
    await click('[data-ink-field="E1"] [data-ink-open]');
    const pad = await evaluate(
      "(() => {const r=document.querySelector('.ws-ink-pad').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()",
    );
    assert.equal(
      await evaluate(
        "getComputedStyle(document.querySelector('.ws-ink-pad')).touchAction",
      ),
      "none",
    );
    for (const [type, fraction] of [
      ["mousePressed", 0.2],
      ["mouseMoved", 0.35],
      ["mouseMoved", 0.5],
      ["mouseReleased", 0.6],
    ]) {
      await cdp("Input.dispatchMouseEvent", {
        type,
        pointerType: "pen",
        button: "left",
        buttons: type === "mouseReleased" ? 0 : 1,
        force: 0.55,
        clickCount: 1,
        x: pad.x + pad.w * fraction,
        y: pad.y + pad.h * 0.4,
      });
    }
    const inkCount = () =>
      evaluate(
        `Object.keys(localStorage).filter(k=>k.startsWith(${JSON.stringify(prefix)})).reduce((n,k)=>n+(JSON.parse(localStorage[k])["E1:ink"]?.length||0),0)`,
      );
    assert.equal(await inkCount(), 1);
    await click("[data-ink-undo]");
    assert.equal(await inkCount(), 0);
    for (const [type, fraction] of [
      ["mousePressed", 0.2],
      ["mouseMoved", 0.5],
      ["mouseReleased", 0.6],
    ])
      await cdp("Input.dispatchMouseEvent", {
        type,
        pointerType: "pen",
        button: "left",
        buttons: type === "mouseReleased" ? 0 : 1,
        force: 0.7,
        clickCount: 1,
        x: pad.x + pad.w * fraction,
        y: pad.y + pad.h * 0.4,
      });
    await screenshot(`${language}-phone-pen`, ".ws-ink-dialog");
    await click("[data-ink-close]");
    await reload();
    await click('[data-page-select="3"]');
    assert.equal(
      await evaluate("document.querySelector('[data-ws-field=E1]').value"),
      "Device draft",
    );
    assert.equal(await inkCount(), 1);
    report.cases.push(
      `${language}: HTTP pen pressure events, undo, typed and ink reload persistence; scrolling isolated to pad`,
    );
    if (language === "en")
      assert.match(
        await evaluate("window.AutomaticityV2.createClientId()"),
        /^[0-9a-f-]{36}$/,
      );
    assert.equal(await evaluate("window.isSecureContext"), false);
    const ca = await readFile(
      resolve(
        process.env.LOCALAPPDATA,
        "AutomaticityDeviceAccess/certificates/device-ca.pem",
      ),
    );
    await new Promise((ok, fail) =>
      https
        .get(`https://${host}:${securePort}${health}`, { ca }, (r) => {
          try {
            assert.equal(r.statusCode, 200);
            assert(r.socket.authorized);
            r.resume();
            r.on("end", ok);
          } catch (e) {
            fail(e);
          }
        })
        .on("error", fail),
    );
    report.cases.push(
      `${language}: HTTPS API certificate chain and IP validated with the generated CA`,
    );
  }
  await cdp("Page.navigate", {
    url: `http://${host}:3317/LANGUAGE-AUTOMATICITY-ROADMAP.html`,
  });
  await until(
    "document.readyState==='complete' && document.body.innerText.length>100",
  );
  for (const width of [390, 768, 1117]) {
    await cdp("Emulation.setDeviceMetricsOverride", {
      width,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    assert(
      await evaluate("document.documentElement.scrollWidth<=innerWidth"),
      `Roadmap overflow ${width}`,
    );
  }
  assert.equal((await fetch(`http://${host}:3317/snapshot`)).status, 404);
  assert.equal(
    (await fetch(`http://${host}:3317/certificate.json`)).status,
    404,
  );
  assert.equal(
    (
      await fetch(`http://${host}:3317/LANGUAGE-AUTOMATICITY-ROADMAP.html`, {
        method: "POST",
      })
    ).status,
    405,
  );
  assert.equal(
    (
      await fetch(`http://${host}:3203/api/assessment`, {
        method: "POST",
        headers: { Origin: "https://external.example" },
      })
    ).status,
    403,
  );
  assert.deepEqual(remoteLoopback, []);
  assert.deepEqual(errors, []);
  report.cases.push(
    "Roadmap at phone/tablet widths; private files and cross-site writes rejected; no browser loopback API requests",
  );
  report.status = "PASS";
} catch (error) {
  report.status = "FAIL";
  report.failure = String(error);
  throw error;
} finally {
  await writeFile(
    resolve(output, "verification.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
  socket.close();
  await fetch(`http://127.0.0.1:9337/json/close/${target.id}`);
}
