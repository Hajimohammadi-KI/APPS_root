/* Worksheet drafts are private practice notes, never evidence of assessed mastery. */
(() => {
  const config = window.GrammarWorksheetConfig || {
    language: "de",
    assetBase: "/replacements/de",
    brand: "DeutschFlow",
    storage: "deutsch-automaticity",
  };
  const english = config.language === "en";
  const say = (de, en) => (english ? en : de);
  let disposeInk;
  const escapeHtml = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const icon = (name) =>
    `<img class="ws-icon" src="${config.assetBase}/worksheet-icons/${name}.svg" alt="" width="32" height="32">`;

  const translations = {
    "Lösungen & Fehlerursachen · Seite": "Answers & causes · page",
    "Bearbeite die Aufgaben zuerst. Vergleiche danach Antwort und Begründung.":
      "Complete the tasks first. Then compare your answer and reason.",
    "Aufgabe / richtige Antwort": "Task / correct answer",
    Fehlerkategorie: "Error category",
    Kontrastbeispiel: "Contrast example",
    Signalwort: "Trigger word",
    "Ursache / Signal": "Cause / cue",
    Ursache: "Root cause",
    "Individuelle Antwort.": "Individual answer.",
    "Freie Texte bitte selbst mit den Kriterien vergleichen oder von einer Lehrperson prüfen lassen. Sie werden hier nicht automatisch bewertet.":
      "Compare your own text with the criteria, or ask a teacher to review it. Free writing is not automatically graded.",
    "Deine Antwort": "Your answer",
    "Warum diese Form?": "Why this form?",
    "Warum?": "Why?",
    "Seite 1: Lernen": "Page 1: Learn",
    "Seite 2: Üben": "Page 2: Practise",
    "Seite 3: Prüfen": "Page 3: Assess",
    "Lernen · Das Muster erkennen": "Learn · Notice the pattern",
    "Eine Entscheidung": "One decision",
    Kontrastbeispiele: "Contrast pairs",
    "Deine Entscheidungskette": "Your decision chain",
    "Vergleichen & entscheiden": "Compare & decide",
    "Form im Satz": "Form in the sentence",
    Bezug: "Reference",
    Signal: "Cue",
    "Erst das Signal nennen. Dann die Form wählen.":
      "Name the cue. Then choose the form.",
    "Übung Schritt für Schritt": "Practice, step by step",
    "Üben · Entscheiden, verändern, abrufen":
      "Practise · Decide, transform, recall",
    "Ergänzen und begründen": "Complete and explain",
    "Eine Vorgabe verändern": "Change one cue",
    "Aus dem Gedächtnis": "Reconstruct from memory",
    "Modell wieder zeigen": "Show model again",
    "Modell abdecken": "Cover model",
    "Dein Satz": "Your sentence",
    "Satz aus dem Gedächtnis": "Sentence from memory",
    "Begründung des erinnerten Satzes": "Reason for the recalled sentence",
    "Laut in 3–5 Sekunden": "Speak in 3–5 seconds",
    "Sage pro Impuls einen vollständigen Satz. Notiere den Grund danach, ohne Zeitdruck.":
      "Say one complete sentence per cue. Record your reason afterwards, without time pressure.",
    "Dein gesprochener Satz": "Your spoken sentence",
    "Gesprochener Satz": "Spoken sentence",
    "Grund der gesprochenen Antwort": "Reason for the spoken answer",
    "Sekunden pro Impuls": "Seconds per cue",
    "5 Sekunden": "5 seconds",
    "3 Sekunden": "3 seconds",
    "Drill starten": "Start drill",
    Stopp: "Stop",
    "3 Impulse · laut antworten": "3 cues · answer aloud",
    Zeit: "Time",
    "Genauigkeit zuerst. Geschwindigkeit kommt durch Wiederholung.":
      "Accuracy first. Speed comes with repetition.",
    "Fehler finden & wiederholen": "Repair & review",
    "Prüfen · Ohne Hilfe produzieren": "Assess · Produce without help",
    "Fehler korrigieren": "Correct the errors",
    "Über dein Leben schreiben": "Write about your life",
    "Deine Sätze": "Your sentences",
    "Eigener Text": "Personal writing",
    Begründung: "Reason",
    "Dein Fehlerprotokoll": "Your error log",
    "Mein Fehler": "My error",
    "Meine Korrektur": "My correction",
    Korrektur: "Correction",
    Fehler: "Error",
    Zeile: "row",
    "Mit Abstand wiederholen": "Spaced review",
    "Rufe an jedem Tag drei neue Sätze ab. Begründe die Form. Kreuze erst nach dem Üben an.":
      "Recall three new sentences on each day. Explain the form. Tick only after practising.",
    "Tag 1": "Day 1",
    "Tag 3": "Day 3",
    "Tag 7": "Day 7",
    "Tag 14": "Day 14",
    geübt: "practised",
    "Die Kreuze dokumentieren deine Wiederholung. Sie bestätigen keine geprüfte Beherrschung.":
      "Ticks record your review. They do not certify assessed mastery.",
    "Eine neue Situation. Dieselbe Entscheidung.":
      "A new situation. The same decision.",
    "Arbeitsblatt auswählen": "Choose a worksheet",
    Lernen: "Learn",
    Üben: "Practise",
    Prüfen: "Assess",
    "Alle 3": "All 3",
    Anleitung: "Instructions",
    "Deutsch + فارسی": "English + فارسی",
    Deutsch: "English",
    "3 leere A4-Seiten drucken": "Print 3 blank A4 pages",
    "Antworten drucken": "Print my answers",
    "Lösungen drucken": "Print answer keys",
    "Deine Einträge werden auf diesem Gerät gespeichert.":
      "Your entries are saved on this device.",
    "Speichern nicht möglich. Sichere deine Einträge durch Drucken.":
      "Saving is unavailable. Print your answers to keep them.",
    Arbeitsblätter: "Worksheets",
    "Weitere Übungen": "More exercises",
    "Drill beendet. Vergleiche jetzt selbst mit den Lösungen.":
      "Drill finished. Compare with the answer key.",
    "Drill angehalten.": "Drill stopped.",
    "Drill pausiert. Starte erneut, wenn du bereit bist.":
      "Drill paused. Restart when you are ready.",
  };
  function translated(value) {
    if (!english) return value;
    let result = value;
    for (const [de, en] of Object.entries(translations).sort(
      (a, b) => b[0].length - a[0].length,
    ))
      result = result.split(de).join(en);
    return result;
  }
  function translateUI() {
    if (!english) return;
    for (const container of [
      root,
      document.querySelector("#grammarViewMode"),
    ].filter(Boolean)) {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode())
        if (!node.parentElement.closest("textarea, [lang=fa]"))
          node.textContent = translated(node.textContent);
      container
        .querySelectorAll("[aria-label]")
        .forEach((element) =>
          element.setAttribute(
            "aria-label",
            translated(element.getAttribute("aria-label")),
          ),
        );
    }
  }

  let active;
  let root;
  let page = 1;
  let bilingual = false;
  let drafts = {};
  let timer;
  let oralIndex = 0;
  let storageAvailable = true;
  const dailyParams = new URLSearchParams(location.search);
  const requestedActivity =
    dailyParams.get("from") === "daily"
      ? Number(dailyParams.get("activity"))
      : 0;
  const dailyActivity = [1, 4, 5, 7].includes(requestedActivity)
    ? requestedActivity
    : 0;
  const key = () =>
    `${config.storage}:worksheet:v1:${active.id}${dailyActivity ? `:daily:${dailyActivity}` : ""}`;
  const fa = (text) =>
    bilingual
      ? `<span class="ws-fa" lang="fa" dir="rtl">${escapeHtml(text)}</span>`
      : "";
  const heading = (number, title, translation, symbol) =>
    `<div class="ws-section-title">${icon(symbol)}<div><h3><span class="ws-number">${number}</span>${escapeHtml(title)}</h3>${fa(translation)}</div></div>`;
  const input = (id, label, lines = 1) =>
    `<div class="ws-field" data-ink-field="${escapeHtml(id)}"><textarea data-ws-field="${escapeHtml(id)}" rows="${lines}" aria-label="${escapeHtml(label)}" spellcheck="false" lang="${config.language}" dir="ltr">${escapeHtml(drafts[id] || "")}</textarea><div class="ws-typed-print" aria-hidden="true"></div><canvas class="ws-ink-preview" width="1000" height="400" hidden aria-label="${say("Handschrift", "Handwriting")}"></canvas><button class="ws-ink-open ws-screen-only" type="button" data-ink-open>${icon("pencil")}${say("Mit Stift schreiben", "Write with pen")}</button></div>`;
  const row = (item, options = {}) =>
    `<div class="ws-exercise${options.error ? " ws-error-exercise" : ""}"><div class="ws-prompt"><span class="ws-item-id">${escapeHtml(item.id)}</span><span>${options.error ? `<strong class="ws-error-label">${escapeHtml(active.correctionLabel || say("Fehlersatz", "Error sentence"))}: </strong>` : ""}${escapeHtml(item.prompt)}</span></div><div class="ws-answer-grid"><div class="ws-field-label"><span>${options.error ? say("Korrektur", "Correction") : "Deine Antwort"}</span>${input(item.id, `${item.id}: Deine Antwort`)}</div><div class="ws-field-label"><span>Warum? ${fa("چرا؟")}</span>${input(`${item.id}-why`, `${item.id}: Warum?`)}</div></div></div>`;
  const header = (number, title, subtitle, symbol) =>
    `<header class="ws-page-header">${icon(symbol)}<div><div class="ws-eyebrow">${escapeHtml(active.level)} · ${escapeHtml(active.topic)} · ${number} / 3</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div></header>`;
  const footer = (number, text) =>
    `<footer class="ws-page-footer"><span>${escapeHtml(text)}</span><span>${escapeHtml(config.brand)} · ${number} / 3</span></footer>`;

  // Each key entry includes a causal explanation, not just a string to copy.
  const answerKey = (number, items, personal = false) =>
    `<details class="ws-key" data-key-page="${number}"><summary>${icon("clipboard")}Lösungen & Fehlerursachen · Seite ${number}</summary><p>Bearbeite die Aufgaben zuerst. Vergleiche danach Antwort und Begründung.</p><div class="ws-key-scroll"><table><thead><tr><th>Aufgabe / richtige Antwort</th><th>Ursache</th><th>Signalwort</th><th>Fehlerkategorie</th><th>Kontrastbeispiel</th></tr></thead><tbody>${items.map((item) => `<tr><td><strong>${escapeHtml(item.id)}</strong> ${escapeHtml(item.answer)}</td><td>${escapeHtml(item.cause)}</td><td>${escapeHtml(item.trigger)}</td><td>${escapeHtml(item.category)}</td><td>${escapeHtml(item.contrast)}</td></tr>`).join("")}${personal ? active.personal.map((_, i) => `<tr><td><strong>E${i + 1}</strong> Individuelle Antwort.</td><td>${escapeHtml(active.personalReason || active.focus)}</td><td>${escapeHtml(active.decision[0])}</td><td>${escapeHtml(active.category || active.topic)}</td><td>${escapeHtml(active.models[0].sentence)}</td></tr>`).join("") : ""}</tbody></table></div>${personal ? "<p>Freie Texte bitte selbst mit den Kriterien vergleichen oder von einer Lehrperson prüfen lassen. Sie werden hier nicht automatisch bewertet.</p>" : ""}</details>`;

  function learn() {
    return `<article class="ws-paper" data-ws-page="1" aria-label="Seite 1: Lernen">${header(1, active.title, "Lernen · Das Muster erkennen", "book")}
      <div class="ws-focus"><strong>Eine Entscheidung</strong><span>${escapeHtml(active.focus)}</span>${fa(active.focusFa)}</div>
      <section class="ws-model-grid" aria-label="Kontrastbeispiele">${active.models.map((model) => `<article class="ws-model">${icon("book")}<h3>${escapeHtml(model.label)}</h3><strong class="ws-cue">${escapeHtml(model.cue)}</strong><p>${escapeHtml(model.sentence)}</p></article>`).join("")}</section>
      <section class="ws-rule">${heading(1, "Deine Entscheidungskette", "زنجیرهٔ تصمیم", "search")}<ol class="ws-chain">${active.decision.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol><p>${escapeHtml(active.prerequisite)}</p></section>
      <section class="ws-card">${heading(2, "Vergleichen & entscheiden", "مقایسه کن و تصمیم بگیر", "clipboard")}<table class="ws-reference"><thead><tr><th>Bezug</th><th>Signal</th><th>Form im Satz</th></tr></thead><tbody>${active.reference.map((cells) => `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table><p class="ws-note">${escapeHtml(active.notice)}</p>${active.learn.map((item) => row(item)).join("")}</section>
      ${footer(1, "Erst das Signal nennen. Dann die Form wählen.")}</article>${answerKey(1, active.learn)}`;
  }

  function practice() {
    return `<article class="ws-paper" data-ws-page="2" aria-label="Seite 2: Üben">${header(2, "Übung Schritt für Schritt", "Üben · Entscheiden, verändern, abrufen", "pencil")}
      <section class="ws-card">${heading(1, "Ergänzen und begründen", "کامل کن و دلیل بنویس", "clipboard")}<p class="ws-instruction">${escapeHtml(active.guidedInstruction || "Schreibe den vollständigen zweiten Satz. Nenne bei „Warum?“ den Bezug.")}</p>${active.guided.map((item) => row(item)).join("")}</section>
      <section class="ws-card">${heading(2, "Eine Vorgabe verändern", "یک نشانه را تغییر بده", "repeat")}${active.transform.map((item) => row(item)).join("")}</section>
      <section class="ws-rule ws-recall">${heading(3, "Aus dem Gedächtnis", "از حافظه بازسازی کن", "book")}<p class="ws-instruction">${escapeHtml(active.reconstructionInstruction || "Lies das Modell. Decke es ab und schreibe den zweiten Satz aus dem Gedächtnis.")}</p><div class="ws-memory-model" data-memory-model>${escapeHtml(active.recall.prompt)}</div><button class="ws-button ws-screen-only" type="button" data-memory-toggle aria-pressed="false">Modell abdecken</button><div class="ws-answer-grid"><div class="ws-field-label"><span>${escapeHtml(active.recall.id)} · Dein Satz</span>${input(active.recall.id, "Satz aus dem Gedächtnis")}</div><div class="ws-field-label"><span>Warum?</span>${input(`${active.recall.id}-why`, "Begründung des erinnerten Satzes")}</div></div>
      <div class="ws-speed"><h4 class="ws-speed-title">${icon("timer")}Laut in 3–5 Sekunden</h4>${fa("در ۳ تا ۵ ثانیه با صدای بلند بگو")}<p class="ws-instruction">Sage pro Impuls einen vollständigen Satz. Notiere den Grund danach, ohne Zeitdruck.</p><div class="ws-oral-grid">${active.oral.map((item, i) => `<div class="ws-oral-prompt" data-oral-index="${i}"><strong>${escapeHtml(item.id)} · ${escapeHtml(item.prompt)}</strong><div class="ws-answer-grid"><div class="ws-field-label"><span>Dein gesprochener Satz</span>${input(item.id, `${item.id}: Gesprochener Satz`)}</div><div class="ws-field-label"><span>Warum?</span>${input(`${item.id}-why`, `${item.id}: Grund der gesprochenen Antwort`)}</div></div></div>`).join("")}</div><div class="ws-timer-controls ws-screen-only"><label>Zeit <select data-timer-seconds aria-label="Sekunden pro Impuls"><option value="5">5 Sekunden</option><option value="3">3 Sekunden</option></select></label><button type="button" class="ws-button" data-timer-start>Drill starten</button><button type="button" class="ws-button" data-timer-stop disabled>Stopp</button><output class="ws-timer-status" aria-live="polite" data-timer-status>3 Impulse · laut antworten</output></div></div></section>
      ${footer(2, "Genauigkeit zuerst. Geschwindigkeit kommt durch Wiederholung.")}</article>${answerKey(2, [...active.guided, ...active.transform, active.recall, ...active.oral])}`;
  }

  function assess() {
    return `<article class="ws-paper" data-ws-page="3" aria-label="Seite 3: Prüfen">${header(3, "Fehler finden & wiederholen", "Prüfen · Ohne Hilfe produzieren", "search")}
      <section class="ws-card">${heading(1, "Fehler korrigieren", "خطا را اصلاح کن و دلیل بنویس", "pencil")}<p class="ws-instruction">${escapeHtml(active.correctionInstruction || "Nur in diesem Abschnitt sind die markierten Sätze absichtlich falsch.")}</p>${active.correction.map((item) => row(item, { error: true })).join("")}</section>
      <section class="ws-card">${heading(2, "Über dein Leben schreiben", "دربارهٔ زندگی خودت بنویس", "book")}${active.personal.map((prompt, i) => `<div class="ws-personal"><p><strong>E${i + 1}</strong> ${escapeHtml(prompt)}</p><div class="ws-answer-grid"><div class="ws-field-label"><span>Deine Sätze</span>${input(`E${i + 1}`, `Eigener Text ${i + 1}`, 2)}</div><div class="ws-field-label"><span>Warum diese Form?</span>${input(`E${i + 1}-why`, `Begründung ${i + 1}`, 2)}</div></div></div>`).join("")}</section>
      <section class="ws-card">${heading(3, "Dein Fehlerprotokoll", "خطاهای خودت را ثبت کن", "clipboard")}<table class="ws-log"><thead><tr><th>Mein Fehler</th><th>Meine Korrektur</th><th>Ursache / Signal</th></tr></thead><tbody>${[1, 2].map((n) => `<tr>${["Fehler", "Korrektur", "Ursache"].map((field) => `<td>${input(`log-${n}-${field}`, `${field}, Zeile ${n}`)}</td>`).join("")}</tr>`).join("")}</tbody></table></section>
      <section class="ws-rule ws-review">${heading(4, "Mit Abstand wiederholen", "با فاصله مرور کن", "calendar")}<p class="ws-instruction">Rufe an jedem Tag drei neue Sätze ab. Begründe die Form. Kreuze erst nach dem Üben an.</p><div class="ws-review-days">${[1, 3, 7, 14].map((day) => `<label>Tag ${day}<input type="checkbox" data-ws-field="review-${day}" ${drafts[`review-${day}`] ? "checked" : ""}><span>geübt</span></label>`).join("")}</div><p class="ws-note">Die Kreuze dokumentieren deine Wiederholung. Sie bestätigen keine geprüfte Beherrschung.</p></section>
      ${footer(3, "Eine neue Situation. Dieselbe Entscheidung.")}</article>${answerKey(3, active.correction, true)}`;
  }

  function stopTimer(message) {
    clearInterval(timer);
    timer = undefined;
    root
      ?.querySelectorAll(".ws-oral-prompt")
      .forEach((el) => el.classList.remove("is-active"));
    if (!root) return;
    const start = root.querySelector("[data-timer-start]");
    const stop = root.querySelector("[data-timer-stop]");
    if (start) start.disabled = false;
    if (stop) stop.disabled = true;
    if (message && root.querySelector("[data-timer-status]"))
      root.querySelector("[data-timer-status]").textContent =
        translated(message);
  }

  function startTimer() {
    stopTimer();
    const seconds = Number(root.querySelector("[data-timer-seconds]").value);
    const status = root.querySelector("[data-timer-status]");
    oralIndex = 0;
    let deadline = performance.now() + seconds * 1000;
    root.querySelector("[data-timer-start]").disabled = true;
    root.querySelector("[data-timer-stop]").disabled = false;
    const tick = () => {
      if (performance.now() >= deadline) {
        oralIndex += 1;
        deadline = performance.now() + seconds * 1000;
      }
      if (oralIndex >= active.oral.length) {
        stopTimer("Drill beendet. Vergleiche jetzt selbst mit den Lösungen.");
        return;
      }
      root
        .querySelectorAll(".ws-oral-prompt")
        .forEach((el, index) =>
          el.classList.toggle("is-active", index === oralIndex),
        );
      const text = `${active.oral[oralIndex].id}: ${Math.max(1, Math.ceil((deadline - performance.now()) / 1000))} s`;
      if (status.textContent !== text) status.textContent = text;
    };
    tick();
    timer = setInterval(tick, 150);
  }

  function showPage(next) {
    stopTimer("Drill angehalten.");
    page = next;
    root.dataset.currentPage = String(page);
    root
      .querySelectorAll("[data-page-select]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(Number(button.dataset.pageSelect) === page),
        ),
      );
    root
      .querySelectorAll("[data-ws-page]")
      .forEach(
        (paper) =>
          (paper.hidden = page !== 0 && Number(paper.dataset.wsPage) !== page),
      );
    root
      .querySelectorAll("[data-key-page]")
      .forEach(
        (keyPanel) =>
          (keyPanel.hidden =
            page !== 0 && Number(keyPanel.dataset.keyPage) !== page),
      );
  }

  function saveField(event) {
    const field = event.target.closest("[data-ws-field]");
    if (!field) return;
    drafts[field.dataset.wsField] =
      field.type === "checkbox" ? field.checked : field.value;
    persist();
  }

  function persist() {
    try {
      localStorage.setItem(key(), JSON.stringify(drafts));
      storageAvailable = true;
    } catch {
      storageAvailable = false;
    }
    root.querySelector("[data-save-status]").textContent = storageAvailable
      ? say(
          "Deine Einträge sind auf diesem Gerät gespeichert.",
          "Your entries are saved on this device.",
        )
      : say(
          "Speichern nicht möglich. Drucke deine Antworten vor dem Schließen.",
          "Saving is unavailable. Print your answers before closing.",
        );
  }

  function paint() {
    disposeInk?.();
    root.innerHTML = `<div class="ws-toolbar"><div class="ws-stage-nav" role="group" aria-label="Arbeitsblatt auswählen">${[
      [1, "Lernen"],
      [2, "Üben"],
      [3, "Prüfen"],
    ]
      .map(
        ([n, label]) =>
          `<button class="ws-stage" type="button" data-page-select="${n}" aria-pressed="false"><span>${n}</span>${label}</button>`,
      )
      .join(
        "",
      )}<button class="ws-button" type="button" data-page-select="0" aria-pressed="false">Alle 3</button></div><div class="ws-tools"><label class="ws-language">Anleitung <select data-ws-language><option value="${config.language}" ${!bilingual ? "selected" : ""}>Deutsch</option><option value="${config.language}-fa" ${bilingual ? "selected" : ""}>Deutsch + فارسی</option></select></label><button class="ws-button" type="button" data-ws-print>${icon("printer")}3 leere A4-Seiten drucken</button><button class="ws-button" type="button" data-ws-print-answers>Antworten drucken</button><button class="ws-button" type="button" data-ws-print-key>Lösungen drucken</button></div></div><p class="ws-save-status" data-save-status role="status">${storageAvailable ? "Deine Einträge werden auf diesem Gerät gespeichert." : "Speichern nicht möglich. Sichere deine Einträge durch Drucken."}</p><div class="ws-pages">${learn()}${practice()}${assess()}</div>`;
    translateUI();
    disposeInk = window.GrammarWorksheetInk?.mount(root, {
      language: config.language,
      get: (id) => drafts[id],
      set: (id, value) => {
        drafts[id] = value;
        persist();
      },
    });
    root
      .querySelectorAll("[data-page-select]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          showPage(Number(button.dataset.pageSelect)),
        ),
      );
    root
      .querySelector("[data-ws-language]")
      .addEventListener("change", (event) => {
        stopTimer();
        bilingual = event.target.value === `${config.language}-fa`;
        try {
          localStorage.setItem(
            `${config.storage}:worksheet-language`,
            event.target.value,
          );
        } catch {
          /* Draft fallback remains available in memory. */
        }
        paint();
      });
    root
      .querySelector("[data-memory-toggle]")
      .addEventListener("click", (event) => {
        const covered = event.target.getAttribute("aria-pressed") !== "true";
        root
          .querySelector("[data-memory-model]")
          .classList.toggle("is-covered", covered);
        root
          .querySelector("[data-memory-model]")
          .setAttribute("aria-hidden", String(covered));
        event.target.setAttribute("aria-pressed", String(covered));
        event.target.textContent = translated(
          covered ? "Modell wieder zeigen" : "Modell abdecken",
        );
      });
    root
      .querySelector("[data-timer-start]")
      .addEventListener("click", startTimer);
    root
      .querySelector("[data-timer-stop]")
      .addEventListener("click", () => stopTimer("Drill angehalten."));
    root
      .querySelector("[data-ws-print]")
      .addEventListener("click", () => print(false));
    root
      .querySelector("[data-ws-print-answers]")
      .addEventListener("click", () => print(false, true));
    root
      .querySelector("[data-ws-print-key]")
      .addEventListener("click", () => print(true));
    showPage(page);
    if (dailyActivity) focusDailyExercise();
  }

  function focusDailyExercise() {
    // Keep the existing cards and pen controls, but expose only this activity's tasks.
    const paper = root.querySelector(`[data-ws-page="${page}"]`);
    if (dailyActivity === 4) {
      const recall = root.querySelector(".ws-recall");
      recall.querySelector(".ws-speed")?.remove();
      paper.insertBefore(recall, paper.querySelector(".ws-page-footer"));
    }
    root.querySelectorAll("[data-ws-page]").forEach((item) => {
      if (item !== paper) item.remove();
    });
    root.querySelector(".ws-stage-nav").remove();
    root.querySelectorAll("[data-key-page]").forEach((item) => item.remove());
    let items = active.learn;
    const titles = {
      1: say("Aktiv anwenden", "Activate and use accurately"),
      4: say("Lektion und gezielte Übungen", "Lesson and controlled practice"),
      5: say("Täglich selbst schreiben", "Daily writing"),
      7: say("Wiederholen und Antworten sichern", "Review and save evidence"),
    };
    if (dailyActivity === 1) {
      paper.querySelector(".ws-recall")?.remove();
      items = [...active.guided, ...active.transform];
    } else if (dailyActivity === 4) items = [...active.learn, active.recall];
    else {
      paper.querySelectorAll(".ws-card").forEach((card) => {
        const personal = !!card.querySelector(".ws-personal");
        if (dailyActivity === 5 ? !personal : personal) card.remove();
      });
      if (dailyActivity === 5) paper.querySelector(".ws-review")?.remove();
      items = dailyActivity === 7 ? active.correction : [];
    }
    paper.querySelector(".ws-page-header h2").textContent =
      titles[dailyActivity];
    paper.querySelector(".ws-page-header p").textContent = active.focus;
    paper.querySelector(".ws-eyebrow").textContent =
      `${active.level} · ${active.topic} · ${say("Übung", "Activity")} ${dailyActivity}`;
    paper.dataset.dailyActivity = String(dailyActivity);
    paper.querySelector(".ws-page-footer span:last-child").textContent =
      `${config.brand} · ${say("Übung", "Activity")} ${dailyActivity}`;
    paper.after(
      document
        .createRange()
        .createContextualFragment(answerKey(page, items, dailyActivity === 5)),
    );
    root.querySelector(".ws-key summary").innerHTML =
      `${icon("clipboard")}${say("Lösungen und Ursachen", "Answers and causes")} · ${say("Übung", "Activity")} ${dailyActivity}`;
    const bar = document.createElement("section");
    bar.className = "ws-card";
    bar.innerHTML = `<p>${escapeHtml(say("Übung", "Activity"))} ${dailyActivity} · ${escapeHtml(active.topic)}</p><button type="button" class="ws-button" data-daily-save>${escapeHtml(say("Diese Übung speichern und zurück", "Save this activity and return"))}</button><p data-daily-status role="status"></p>`;
    root.prepend(bar);
    root.querySelector("[data-daily-save]").addEventListener("click", () => {
      const fields = [
        ...paper.querySelectorAll("textarea[data-ws-field]"),
      ].filter((field) => !field.dataset.wsField.startsWith("log-"));
      const answered = (field) =>
        field.value.trim() ||
        drafts[`${field.dataset.wsField}:ink`]?.some((stroke) => stroke.length);
      if (!fields.length || !fields.every(answered)) {
        root.querySelector("[data-daily-status]").textContent = say(
          "Beantworte zuerst die Aufgaben und die Warum-Felder. Stifteingaben sind möglich.",
          "Complete the answers and WHY fields first. Pen answers are accepted.",
        );
        return;
      }
      persist();
      if (!storageAvailable) return;
      try {
        const sessionKey = english
          ? "english-automaticity:daily-session:v1"
          : "deutsch-automaticity:daily-session:v1";
        const saved = JSON.parse(localStorage.getItem(sessionKey) || "{}");
        if (
          saved.topic &&
          (saved.topic !== active.topic || saved.level !== active.level)
        ) {
          root.querySelector("[data-daily-status]").textContent = say(
            "Antworten gespeichert. Der Tagesplan wurde inzwischen geändert; öffne ihn erneut.",
            "Answers saved. The daily plan has changed; reopen it before marking this activity complete.",
          );
          return;
        }
        // This checks the practice task only; it does not award assessed mastery.
        localStorage.setItem(
          sessionKey,
          JSON.stringify({
            ...saved,
            completedActivities: [
              ...new Set([...(saved.completedActivities || []), dailyActivity]),
            ],
            updatedAt: new Date().toISOString(),
          }),
        );
        location.href = english ? "/daily" : "/heute";
      } catch {
        root.querySelector("[data-daily-status]").textContent = say(
          "Speichern nicht möglich. Deine Eingaben bleiben sichtbar.",
          "Saving failed. Your answers remain visible.",
        );
      }
    });
    root.querySelector("[data-ws-print]").textContent = say(
      "Diese Übung drucken",
      "Print this activity",
    );
    translateUI();
  }

  function print(solutions, answers = false) {
    disposeInk?.();
    document.body.classList.toggle("ws-print-answers", answers);
    stopTimer("Drill angehalten.");
    document.body.classList.add("ws-printing");
    document.body.classList.toggle("ws-print-solutions", solutions);
    const panels = [...root.querySelectorAll(".ws-key")];
    const previous = panels.map((panel) => panel.open);
    if (solutions) panels.forEach((panel) => (panel.open = true));
    const restore = () => {
      document.body.classList.remove(
        "ws-printing",
        "ws-print-solutions",
        "ws-print-answers",
      );
      panels.forEach((panel, i) => (panel.open = previous[i]));
      paint();
    };
    window.addEventListener("afterprint", restore, { once: true });
    // Blank handouts and saved answers are separate jobs so long notes are never clipped.
    window.print();
  }

  window.GermanWorksheetUI = window.GrammarWorksheetUI = {
    render(unit) {
      stopTimer();
      disposeInk?.();
      const worksheet = (
        window.GrammarWorksheets || window.GermanWorksheets
      )?.worksheets?.find(
        (entry) => entry.topic === unit.title && entry.level === unit.level,
      );
      root = document.querySelector("#grammarWorksheets");
      if (!root) return;
      root.hidden = !worksheet;
      document.body.classList.toggle("has-worksheet", Boolean(worksheet));
      const legacy = document.querySelector(".lesson-stack");
      legacy.hidden = Boolean(worksheet);
      let mode = document.querySelector("#grammarViewMode");
      if (!mode) {
        mode = document.createElement("div");
        mode.id = "grammarViewMode";
        mode.className = "ws-view-mode";
        root.before(mode);
      }
      mode.hidden = !worksheet;
      if (!worksheet) return;
      active = worksheet;
      page = dailyActivity === 1 ? 2 : [5, 7].includes(dailyActivity) ? 3 : 1;
      try {
        const saved = JSON.parse(localStorage.getItem(key()) || "{}");
        drafts =
          saved && typeof saved === "object" && !Array.isArray(saved)
            ? saved
            : {};
        bilingual =
          localStorage.getItem(`${config.storage}:worksheet-language`) ===
          `${config.language}-fa`;
        storageAvailable = true;
      } catch {
        drafts = {};
        storageAvailable = false;
      }
      mode.innerHTML =
        '<button type="button" class="ws-button" aria-pressed="true" data-view="worksheets">Arbeitsblätter</button><button type="button" class="ws-button" aria-pressed="false" data-view="practice">Weitere Übungen</button>';
      mode.querySelectorAll("[data-view]").forEach((button) =>
        button.addEventListener("click", () => {
          stopTimer("Drill angehalten.");
          const sheets = button.dataset.view === "worksheets";
          root.hidden = !sheets;
          legacy.hidden = sheets;
          mode
            .querySelectorAll("button")
            .forEach((item) =>
              item.setAttribute("aria-pressed", String(item === button)),
            );
        }),
      );
      root.oninput = saveField;
      root.onchange = saveField;
      paint();
      translateUI();
    },
  };
  // A background tab must not silently consume the learner's timed prompts.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden)
      stopTimer("Drill pausiert. Starte erneut, wenn du bereit bist.");
  });
  // Browser-menu printing uses the same three-sheet layout as the explicit print button.
  window.addEventListener("beforeprint", () => {
    if (root && !root.hidden) {
      document.body.classList.add("ws-printing");
      root
        .querySelectorAll(".ws-field")
        .forEach(
          (field) =>
            (field.querySelector(".ws-typed-print").textContent =
              field.querySelector("textarea").value),
        );
    }
  });
  window.addEventListener("afterprint", () =>
    document.body.classList.remove(
      "ws-printing",
      "ws-print-solutions",
      "ws-print-answers",
    ),
  );
})();
