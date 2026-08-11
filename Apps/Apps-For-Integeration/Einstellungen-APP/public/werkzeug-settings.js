(function (global) {
  "use strict";

  var script = document.currentScript;
  var baseUrl = script && script.src ? new URL(script.src).origin : "https://werkzeug-study-tools.education-hajimohamm.chatgpt.site";
  var frame = null;
  var listeners = new Set();
  var pending = new Map();

  function id() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2); }
  function send(type, payload) {
    if (!frame || !frame.contentWindow) return Promise.reject(new Error("Einstellungen wurde noch nicht eingebettet."));
    var requestId = id();
    frame.contentWindow.postMessage({ type: type, protocol: "1.0", requestId: requestId, payload: payload }, baseUrl);
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { pending.delete(requestId); reject(new Error("Einstellungen antwortet nicht.")); }, 5000);
      pending.set(requestId, { resolve: resolve, reject: reject, timer: timer });
    });
  }

  global.addEventListener("message", function (event) {
    if (event.origin !== baseUrl || !event.data || typeof event.data !== "object") return;
    var request = pending.get(event.data.requestId);
    if (request) {
      clearTimeout(request.timer);
      pending.delete(event.data.requestId);
      if (event.data.type === "werkzeug:settings:error") request.reject(new Error(event.data.error || "Settings request failed"));
      else request.resolve(event.data.payload);
    }
    if (event.data.type === "werkzeug:settings:changed") listeners.forEach(function (listener) { listener(event.data.payload); });
  });

  global.WerkzeugSettings = {
    mount: function (options) {
      options = options || {};
      var container = typeof options.container === "string" ? document.querySelector(options.container) : options.container;
      if (!container) throw new Error("Der Container für Einstellungen wurde nicht gefunden.");
      frame = document.createElement("iframe");
      frame.src = baseUrl + "/settings?embed=1";
      frame.title = "Einstellungen";
      frame.style.width = "100%";
      frame.style.minHeight = options.minHeight || "820px";
      frame.style.border = "0";
      frame.style.borderRadius = "18px";
      frame.setAttribute("allow", "clipboard-write");
      container.replaceChildren(frame);
      return frame;
    },
    get: function () { return send("werkzeug:settings:get"); },
    subscribe: function (listener) { listeners.add(listener); return function () { listeners.delete(listener); }; },
    open: function () { return global.open(baseUrl + "/settings", "werkzeug-settings", "width=1180,height=860,resizable=yes,scrollbars=yes"); },
    url: baseUrl + "/settings"
  };
})(window);
