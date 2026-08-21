const { contextBridge, ipcRenderer } = require("electron");
const { registerCalendarPreload } = require("./google-calendar-preload.cjs");

contextBridge.exposeInMainWorld(
  "studyCalendar",
  Object.freeze({
    status: () => ipcRenderer.invoke("desktop:calendar:status"),
    connect: () => ipcRenderer.invoke("desktop:calendar:connect"),
    sync: (events) => ipcRenderer.invoke("desktop:calendar:sync", events),
    disconnect: () => ipcRenderer.invoke("desktop:calendar:disconnect"),
  }),
);

contextBridge.exposeInMainWorld(
  "learnerProfile",
  Object.freeze({
    read: () => ipcRenderer.invoke("desktop:learner-profile:read"),
    merge: (update) =>
      ipcRenderer.invoke("desktop:learner-profile:merge", update),
    replace: (profile) =>
      ipcRenderer.invoke("desktop:learner-profile:replace", profile),
    export: () => ipcRenderer.invoke("desktop:learner-profile:export"),
  }),
);

contextBridge.exposeInMainWorld(
  "studyAI",
  Object.freeze({
    status: () => ipcRenderer.invoke("desktop:ai:status"),
    configure: (configuration) =>
      ipcRenderer.invoke("desktop:ai:configure", configuration),
    disconnect: () => ipcRenderer.invoke("desktop:ai:disconnect"),
    explain: (request) => ipcRenderer.invoke("desktop:ai:explain", request),
  }),
);

contextBridge.exposeInMainWorld(
  "studyDeepL",
  Object.freeze({
    status: () => ipcRenderer.invoke("desktop:deepl:status"),
    configure: (configuration) =>
      ipcRenderer.invoke("desktop:deepl:configure", configuration),
    disconnect: () => ipcRenderer.invoke("desktop:deepl:disconnect"),
    translate: (request) =>
      ipcRenderer.invoke("desktop:deepl:translate", request),
  }),
);

registerCalendarPreload({
  ipcRenderer,
  productId: "deutschflow-grammar",
  productName: "DeutschFlow",
  storageKey: "GrammarAutomaticityV11_de",
  locale: "de",
});

function readArgument(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : fallback;
}

const locale = readArgument("desktop-locale", "de");
const darkColor = readArgument("desktop-dark", "#071B46");
const highlightColor = readArgument("desktop-highlight", "#36D790");

const copy =
  locale === "de"
    ? {
        action: "PDF öffnen",
        choosing: "PDF wählen …",
        opened: "Geöffnet",
        failed: "PDF konnte nicht geöffnet werden.",
        title: "Lokale PDF-Datei auswählen und in Microsoft Edge öffnen",
      }
    : {
        action: "Open PDF",
        choosing: "Choose PDF …",
        opened: "Opened",
        failed: "The PDF could not be opened.",
        title: "Choose a local PDF file and open it in Microsoft Edge",
      };

function mountPdfLauncher() {
  if (!document.body || document.getElementById("desktop-pdf-launcher")) {
    return;
  }

  const host = document.createElement("div");
  host.id = "desktop-pdf-launcher";
  host.setAttribute("data-desktop-control", "pdf");
  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      position: fixed;
      right: 20px;
      bottom: 18px;
      z-index: 2147483647;
      pointer-events: none;
      font-family: "Segoe UI", system-ui, sans-serif;
    }

    .pdf-control {
      display: grid;
      justify-items: end;
      gap: 9px;
    }

    .pdf-status {
      max-width: min(360px, calc(100vw - 40px));
      padding: 9px 12px;
      border: 1px solid rgba(7, 27, 70, 0.12);
      border-radius: 11px;
      background: rgba(255, 255, 255, 0.97);
      box-shadow: 0 12px 34px rgba(7, 27, 70, 0.16);
      color: #526078;
      font-size: 12px;
      line-height: 1.35;
      opacity: 0;
      transform: translateY(4px);
      transition:
        opacity 160ms ease-out,
        transform 160ms ease-out;
      pointer-events: none;
    }

    .pdf-status.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .pdf-button {
      pointer-events: auto;
      display: inline-flex;
      min-height: 44px;
      align-items: center;
      gap: 10px;
      padding: 0 16px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 13px;
      background: ${darkColor};
      box-shadow: 0 12px 28px rgba(7, 27, 70, 0.24);
      color: #fff;
      cursor: pointer;
      font: 600 13px/1 "Segoe UI", system-ui, sans-serif;
    }

    .pdf-button .pdf-label {
      color: #fff;
      transition: color 140ms ease-out;
    }

    .pdf-button:hover .pdf-label,
    .pdf-button:focus-visible .pdf-label {
      color: ${highlightColor};
    }

    .pdf-button:focus-visible {
      outline: 3px solid ${highlightColor};
      outline-offset: 3px;
    }

    .pdf-button:disabled {
      cursor: wait;
      opacity: 0.72;
    }

    .pdf-icon {
      width: 18px;
      height: 18px;
      flex: 0 0 auto;
      color: #fff;
    }

    @media (prefers-reduced-motion: reduce) {
      .pdf-status,
      .pdf-button .pdf-label {
        transition-duration: 0.01ms;
      }
    }
  `;

  const control = document.createElement("div");
  control.className = "pdf-control";

  const status = document.createElement("div");
  status.className = "pdf-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const button = document.createElement("button");
  button.type = "button";
  button.className = "pdf-button";
  button.title = copy.title;
  button.setAttribute("aria-label", copy.title);

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "pdf-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML =
    "<path d='M7 3.75h7l4 4V20.25H7z' stroke='white' stroke-width='1.7' stroke-linejoin='round'/>" +
    "<path d='M14 3.75v4h4M9.5 12.25h6M9.5 15.5h4.5' stroke='white' stroke-width='1.7' stroke-linecap='round'/>";

  const label = document.createElement("span");
  label.className = "pdf-label";
  label.textContent = copy.action;

  let statusTimer;
  function showStatus(message, isError = false) {
    clearTimeout(statusTimer);
    status.textContent = message;
    status.style.color = isError ? "#a33a3a" : "#526078";
    status.classList.add("visible");
    statusTimer = setTimeout(() => status.classList.remove("visible"), 4500);
  }

  button.addEventListener("click", async () => {
    button.disabled = true;
    label.textContent = copy.choosing;
    try {
      const result = await ipcRenderer.invoke("desktop:choose-pdf");
      if (result?.status === "opened") {
        showStatus(`${copy.opened}: ${result.fileName}`);
      } else if (result?.status === "error") {
        showStatus(result.message || copy.failed, true);
      }
    } catch {
      showStatus(copy.failed, true);
    } finally {
      button.disabled = false;
      label.textContent = copy.action;
    }
  });

  button.append(icon, label);
  control.append(status, button);
  shadow.append(style, control);
  document.body.append(host);
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", mountPdfLauncher, { once: true });
} else {
  mountPdfLauncher();
}
