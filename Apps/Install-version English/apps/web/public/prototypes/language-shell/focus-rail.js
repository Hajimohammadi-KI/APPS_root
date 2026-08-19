import { getText, renderLanguageControl, renderNavList, renderPageContent } from "./prototype-data.js";

export function focusRail() {
  const t = getText();
  return `<div class="prototype-shell focus-rail proto-page">
    <aside class="focus-rail__nav">
      <div class="focus-rail__brand"><strong>${t.shortApp}</strong><span>${t.app}</span></div>
      <nav aria-label="${t.app}">${renderNavList({ grouped: false, compact: true })}</nav>
      <div class="focus-rail__profile"><strong>EL</strong><span>${t.level}</span></div>
    </aside>
    <section class="focus-rail__workspace">
      <header class="focus-rail__topbar"><div><strong>${t.app}</strong><span>${t.strapline}</span></div><div class="proto-topbar-controls">${renderLanguageControl(true)}<button>${t.install}</button></div></header>
      ${renderPageContent()}
    </section>
  </div>`;
}
