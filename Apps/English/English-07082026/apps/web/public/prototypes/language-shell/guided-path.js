import { getCurrentPage, getText, prototypeState, renderLanguageControl, renderPageContent, renderPageSelect } from "./prototype-data.js";

export function guidedPath() {
  const t = getText();
  const page = getCurrentPage();
  return `<div class="prototype-shell guided-path proto-page">
    <header class="guided-path__topbar"><div class="guided-path__brand"><strong>${t.shortApp}</strong><span><b>${t.app}</b><small>${t.strapline}</small></span></div><div class="proto-topbar-controls">${renderLanguageControl(true)}<button>${t.install}</button></div></header>
    <nav class="guided-path__journey" aria-label="Learning journey">
      <button data-page="daily" data-active="${page[0] === "daily" || page[0] === "home"}"><span>1</span><b>${prototypeState.lang === "de" ? "Abrufen" : "Recall"}</b><small>${prototypeState.lang === "de" ? "Heute" : "Today"}</small></button>
      <button data-page="grammar" data-active="${page[0] === "grammar"}"><span>2</span><b>${prototypeState.lang === "de" ? "Automatisieren" : "Automate"}</b><small>${prototypeState.lang === "de" ? "Grammatik" : "Grammar"}</small></button>
      <button data-page="studio" data-active="${page[0] === "studio"}"><span>3</span><b>${prototypeState.lang === "de" ? "Übertragen" : "Transfer"}</b><small>${prototypeState.lang === "de" ? "Sprechen" : "Speaking"}</small></button>
      <div class="guided-path__all-pages">${renderPageSelect(true)}</div>
    </nav>
    <div class="guided-path__workspace">${renderPageContent()}</div>
  </div>`;
}
