export const prototypeState = {
  lang: new URLSearchParams(location.search).get("lang") === "de" ? "de" : "en",
  page: new URLSearchParams(location.search).get("page") || "grammar",
};

const pages = {
  en: [
    ["home", "Home", "Overview and next step", "Daily practice"],
    ["daily", "Today’s Practice", "Adaptive recall and automaticity", "Daily practice"],
    ["mixed", "Mixed Practice", "Interleaved recall across topics", "Daily practice"],
    ["studio", "Conversation Studio", "Speak, correct, and repeat", "Daily practice"],
    ["automatic", "Automatization Trainer", "Retrieval, shadowing, and formulaic drills", "Daily practice"],
    ["grammar", "Grammar Lab", "112 units from A1 to C2", "Learning paths"],
    ["skills", "Integrated Skills", "72 units across four skills", "Learning paths"],
    ["resources", "Learning Resources", "43 direct source collections", "Learning paths"],
    ["errors", "Error Workshop", "Repair recurring errors", "Evidence"],
    ["progress", "Progress Evidence", "Mastery, transfer, and delayed recall", "Evidence"],
    ["audio", "Audio Library", "Review your spoken progress", "Evidence"],
    ["cards", "Vocabulary & Flashcards", "Spaced-repetition vocabulary review", "Evidence"],
    ["settings", "Settings", "Learning, storage, and platform", "App"],
    ["teacher", "Teacher Studio", "Manage content and human recordings", "App"],
  ],
  de: [
    ["home", "Start", "Fortschritt und nächster Schritt", "Tägliche Praxis"],
    ["daily", "Heutiges Training", "Adaptiver Abruf und Automatik", "Tägliche Praxis"],
    ["mixed", "Gemischtes Training", "Themen gemischt statt blockweise", "Tägliche Praxis"],
    ["studio", "Gesprächsstudio", "Aufnehmen, korrigieren und wiederholen", "Tägliche Praxis"],
    ["automatic", "Automatik-Trainer", "Abruf, Shadowing und Formulierung", "Tägliche Praxis"],
    ["grammar", "Grammatik-Labor", "144 Einheiten von A1 bis C2", "Lernpfade"],
    ["skills", "Integrierte Fertigkeiten", "Hören, Lesen, Sprechen und Schreiben", "Lernpfade"],
    ["resources", "Ressourcen", "Eigene Übungen und direkte Quellen", "Lernpfade"],
    ["errors", "Fehlermotor", "Wiederkehrende Fehler reparieren", "Lernnachweise"],
    ["progress", "Fortschritt & Nachweise", "Beherrschung, Transfer und Abruf", "Lernnachweise"],
    ["audio", "Audio-Bibliothek", "Gesprochenen Fortschritt anhören", "Lernnachweise"],
    ["cards", "Vokabelkarten", "Wortschatz mit Wiederholungen", "Lernnachweise"],
    ["settings", "Einstellungen", "Lernen, Speicher und Plattform", "App"],
    ["teacher", "Lehrkraft-Studio", "Inhalte und menschliche Aufnahmen", "App"],
  ],
};

const text = {
  en: {
    app: "English Automaticity",
    shortApp: "EA",
    strapline: "Measurable daily language practice",
    level: "A1 learner",
    online: "Local service ready",
    install: "Install app",
    language: "Interface language",
    allPages: "Go to page",
    today: "Today",
    continue: "Continue practice",
  },
  de: {
    app: "DeutschFlow",
    shortApp: "DF",
    strapline: "Deutsch abrufen und automatisieren",
    level: "A1 Lernende",
    online: "Lokaler Dienst bereit",
    install: "App installieren",
    language: "Oberflächensprache",
    allPages: "Seite öffnen",
    today: "Heute",
    continue: "Training fortsetzen",
  },
};

export function getPages() {
  return pages[prototypeState.lang];
}

export function getText() {
  return text[prototypeState.lang];
}

export function getCurrentPage() {
  return getPages().find(([id]) => id === prototypeState.page) || getPages()[0];
}

export function renderLanguageControl(compact = false) {
  const t = getText();
  return `<label class="proto-field ${compact ? "proto-field--compact" : ""}">
    <span>${t.language}</span>
    <select data-language-select aria-label="${t.language}">
      <option value="en" ${prototypeState.lang === "en" ? "selected" : ""}>English</option>
      <option value="de" ${prototypeState.lang === "de" ? "selected" : ""}>Deutsch</option>
    </select>
  </label>`;
}

export function renderPageSelect(compact = false) {
  const t = getText();
  return `<label class="proto-field ${compact ? "proto-field--compact" : ""}">
    <span>${t.allPages}</span>
    <select data-page-select aria-label="${t.allPages}">
      ${getPages().map(([id, label]) => `<option value="${id}" ${prototypeState.page === id ? "selected" : ""}>${label}</option>`).join("")}
    </select>
  </label>`;
}

export function renderNavList({ grouped = true, compact = false } = {}) {
  const list = getPages();
  if (!grouped) {
    return `<div class="proto-nav-list">${list.map(([id, label]) => navButton(id, label, compact)).join("")}</div>`;
  }
  const groups = [...new Set(list.map((page) => page[3]))];
  return groups.map((group) => `<section class="proto-nav-group">
    <h2>${group}</h2>
    <div class="proto-nav-list">${list.filter((page) => page[3] === group).map(([id, label]) => navButton(id, label, compact)).join("")}</div>
  </section>`).join("");
}

function navButton(id, label, compact) {
  const active = prototypeState.page === id;
  const short = label.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  return `<button class="proto-nav-button" data-page="${id}" data-active="${active}" ${active ? 'aria-current="page"' : ""} title="${label}">
    ${compact ? `<span class="proto-nav-short" aria-hidden="true">${short}</span><span>${label}</span>` : `<span>${label}</span>`}
  </button>`;
}

function metric(value, label, detail) {
  return `<article class="proto-metric"><strong>${value}</strong><span>${label}</span><small>${detail}</small></article>`;
}

function actionCard(title, body, action, tone = "violet") {
  const kicker = prototypeState.lang === "de"
    ? (tone === "green" ? "Bereit" : "Als Nächstes")
    : (tone === "green" ? "Ready" : "Next");
  return `<article class="proto-action-card" data-tone="${tone}"><div><span class="proto-kicker">${kicker}</span><h3>${title}</h3><p>${body}</p></div><button data-demo-action="complete">${action}</button></article>`;
}

function grammarContent(isDe) {
  return `<section class="proto-panel proto-selector-panel">
    <div class="proto-panel-heading"><div><span class="proto-kicker">${isDe ? "Einheit wählen" : "Choose a unit"}</span><h2>${isDe ? "Was möchtest du automatisieren?" : "What do you want to automate?"}</h2></div><span class="proto-count">${isDe ? "144 Einheiten" : "112 units"}</span></div>
    <div class="proto-select-grid">
      <label class="proto-field"><span>${isDe ? "Niveau" : "CEFR level"}</span><select data-level><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></label>
      <label class="proto-field"><span>${isDe ? "Einheit" : "Unit"}</span><select data-unit><option>${isDe ? "Personalpronomen und sein" : "Verb be: am/is/are"}</option><option>${isDe ? "haben" : "Subject pronouns"}</option><option>${isDe ? "W-Fragen" : "Articles a/an/the"}</option><option>${isDe ? "Akkusativ" : "Plural nouns"}</option></select></label>
      <label class="proto-field"><span>${isDe ? "Übungsmodus" : "Practice mode"}</span><select><option>${isDe ? "Vollständige Automatik-Mission" : "Full Automaticity Mission"}</option><option>${isDe ? "Kontrollierte Übung" : "Controlled practice"}</option><option>${isDe ? "Tägliches Schreiben" : "Daily writing"}</option></select></label>
    </div>
    <div class="proto-selector-summary"><p data-unit-summary>${isDe ? "Identifiziere und beschreibe Personen mit sein." : "Use be to identify, describe, locate, and state age or condition."}</p><button class="proto-primary" data-demo-action="complete">${isDe ? "Einheit starten" : "Start this unit"}</button></div>
  </section>
  <section class="proto-step-grid">
    ${actionCard(isDe ? "Aktivieren & korrekt anwenden" : "Activate & use accurately", isDe ? "Drei kontrollierte Umformungen" : "Three controlled transformations", isDe ? "Beginnen" : "Start", "violet")}
    ${actionCard(isDe ? "Automatisieren & schreiben" : "Automate & write", isDe ? "Sechs Sätze mit vier Zielformen" : "Six sentences with four target forms", isDe ? "Öffnen" : "Open", "blue")}
    ${actionCard(isDe ? "Frei sprechen & übertragen" : "Speak freely & transfer", isDe ? "Aufnahme und Shadowing im Studio" : "Recording and shadowing in Studio", isDe ? "Zum Studio" : "Open Studio", "green")}
  </section>`;
}

function dailyContent(isDe) {
  return `<section class="proto-panel proto-daily-panel"><div class="proto-panel-heading"><div><span class="proto-kicker">${isDe ? "15-Minuten-Mission" : "15-minute mission"}</span><h2>${isDe ? "Perfekt sicher abrufen" : "Recall the present perfect confidently"}</h2></div><span class="proto-progress-ring">2/6</span></div><div class="proto-progress-track"><span style="width:33%"></span></div><div class="proto-task-list">
    <button data-demo-action="complete"><span>01</span><strong>${isDe ? "Abrufen" : "Recall"}</strong><small>${isDe ? "3 genaue Antworten" : "3 accurate answers"}</small></button>
    <button data-demo-action="complete"><span>02</span><strong>${isDe ? "Laut automatisieren" : "Automate aloud"}</strong><small>${isDe ? "Aufnehmen und anhören" : "Record and replay"}</small></button>
    <button data-demo-action="complete"><span>03</span><strong>${isDe ? "Übertragen" : "Transfer"}</strong><small>${isDe ? "Neuer Kontext" : "New context"}</small></button>
  </div></section>`;
}

function studioContent(isDe) {
  return `<section class="proto-panel proto-studio-panel"><div class="proto-panel-heading"><div><span class="proto-kicker">${isDe ? "Gesprächsstudio" : "Conversation Studio"}</span><h2>${isDe ? "Eine echte Antwort aufnehmen" : "Record a real response"}</h2></div><span class="proto-count">A1 · ${isDe ? "Alltag" : "Daily life"}</span></div><div class="proto-prompt"><strong>${isDe ? "Erzähle, was du heute Morgen gemacht hast." : "Describe what you did this morning."}</strong><p>${isDe ? "Sprich 30–45 Sekunden. Höre danach deine Aufnahme an." : "Speak for 30–45 seconds, then replay your recording."}</p></div><div class="proto-record-row"><button class="proto-record" data-record aria-pressed="false">${isDe ? "Aufnahme starten" : "Start recording"}</button><span data-record-status>${isDe ? "Mikrofon bereit" : "Microphone ready"}</span></div><textarea aria-label="${isDe ? "Transkript" : "Transcript"}" placeholder="${isDe ? "Dein Transkript erscheint hier …" : "Your transcript appears here …"}"></textarea></section>`;
}

function progressContent(isDe) {
  return `<section class="proto-metric-grid">${metric("68%", isDe ? "Bestätigte Automatik" : "Confirmed automaticity", isDe ? "+7% in 30 Tagen" : "+7% in 30 days")}${metric("24", isDe ? "Übertragene Einheiten" : "Transferred units", isDe ? "8 davon verzögert" : "8 delayed")}${metric("11", isDe ? "Offene Wiederholungen" : "Reviews due", isDe ? "6 heute" : "6 today")}${metric("9", isDe ? "Reparierte Fehler" : "Errors repaired", isDe ? "3 noch aktiv" : "3 still active")}</section><section class="proto-panel"><div class="proto-panel-heading"><div><span class="proto-kicker">${isDe ? "Nachweise" : "Evidence"}</span><h2>${isDe ? "Abruf → Automatik → Transfer" : "Recall → Automate → Transfer"}</h2></div></div><div class="proto-evidence-bars"><label>${isDe ? "Genauigkeit" : "Accuracy"}<span><i style="width:84%"></i></span><b>84%</b></label><label>${isDe ? "Eigenes Schreiben" : "Independent writing"}<span><i style="width:62%"></i></span><b>62%</b></label><label>${isDe ? "Freies Sprechen" : "Free speaking"}<span><i style="width:48%"></i></span><b>48%</b></label></div></section>`;
}

function settingsContent(isDe) {
  return `<section class="proto-panel"><div class="proto-panel-heading"><div><span class="proto-kicker">${isDe ? "Persönlich" : "Personal"}</span><h2>${isDe ? "Lern- und Anzeigeoptionen" : "Learning and display options"}</h2></div></div><div class="proto-setting-list"><label><span><strong>${isDe ? "Leselineal" : "Reading ruler"}</strong><small>${isDe ? "Hilft beim Zeilenfokus" : "Keeps the current line in focus"}</small></span><input type="checkbox"></label><label><span><strong>${isDe ? "Sanfte Bewegung reduzieren" : "Reduce interface motion"}</strong><small>${isDe ? "Bewegungen durch Überblendungen ersetzen" : "Replace movement with subtle fades"}</small></span><input type="checkbox"></label><label><span><strong>${isDe ? "Tägliche Erinnerung" : "Daily reminder"}</strong><small>${isDe ? "Um 18:30 Uhr erinnern" : "Remind me at 18:30"}</small></span><input type="checkbox" checked></label></div></section>`;
}

function genericContent(isDe, page) {
  return `<section class="proto-metric-grid">${metric("6", isDe ? "Heute fällig" : "Due today", isDe ? "Etwa 12 Minuten" : "About 12 minutes")}${metric("82%", isDe ? "Letzte Genauigkeit" : "Recent accuracy", isDe ? "Online geprüft" : "Online verified")}${metric("4", isDe ? "Aktive Themen" : "Active topics", isDe ? "A1–A2" : "A1–A2")}</section><section class="proto-panel"><div class="proto-panel-heading"><div><span class="proto-kicker">${page[1]}</span><h2>${page[2]}</h2></div></div><div class="proto-card-grid">${actionCard(isDe ? "Nächste sinnvolle Aufgabe" : "Best next activity", isDe ? "Beginne mit einem kurzen Abruf und übertrage danach in einen neuen Satz." : "Start with a short recall, then transfer it into a new sentence.", isDe ? "Jetzt öffnen" : "Open now", "violet")}${actionCard(isDe ? "Aus deinem Verlauf" : "From your history", isDe ? "Diese Aktivität baut auf deinem letzten sicheren Ergebnis auf." : "This activity builds on your latest confirmed result.", isDe ? "Ansehen" : "Review", "green")}</div></section>`;
}

export function renderPageContent() {
  const isDe = prototypeState.lang === "de";
  const page = getCurrentPage();
  let body;
  if (page[0] === "grammar") body = grammarContent(isDe);
  else if (page[0] === "daily" || page[0] === "home") body = dailyContent(isDe);
  else if (page[0] === "studio") body = studioContent(isDe);
  else if (page[0] === "progress" || page[0] === "errors") body = progressContent(isDe);
  else if (page[0] === "settings") body = settingsContent(isDe);
  else body = genericContent(isDe, page);
  return `<main class="proto-content"><header class="proto-page-header"><div><span class="proto-kicker">${page[3]}</span><h1>${page[1]}</h1><p>${page[2]}</p></div><div class="proto-header-meta"><span>${getText().online}</span><strong>${getText().level}</strong></div></header>${body}</main>`;
}
