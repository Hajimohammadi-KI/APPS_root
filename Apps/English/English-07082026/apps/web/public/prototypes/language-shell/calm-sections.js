import { getText, renderLanguageControl, renderNavList, renderPageContent, renderPageSelect } from "./prototype-data.js";

export function calmSections() {
  const t = getText();
  return `<div class="prototype-shell calm-sections proto-page">
    <header class="calm-sections__masthead"><div><span class="calm-sections__mark">${t.shortApp}</span><span><strong>${t.app}</strong><small>${t.strapline}</small></span></div><div class="proto-topbar-controls">${renderLanguageControl(true)}${renderPageSelect(true)}<button>${t.install}</button></div></header>
    <div class="calm-sections__body"><aside><nav aria-label="${t.app}">${renderNavList({ grouped: true })}</nav><div class="calm-sections__profile"><strong>Elahe</strong><span>${t.level}</span></div></aside>${renderPageContent()}</div>
  </div>`;
}
