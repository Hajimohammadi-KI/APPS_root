window.GERMAN_GRAMMAR_RUNTIME = true;

(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const units = Array.isArray(window.GERMAN_GRAMMAR_UNITS)
    ? window.GERMAN_GRAMMAR_UNITS
    : [];
  const params = new URLSearchParams(window.location.search);
  const progressKey = "deutsch-automaticity:grammar-progress:v3";
  const dailySessionKey = "deutsch-automaticity:daily-session:v1";
  const dailyContext =
    params.get("from") === "daily"
      ? {
          activity: Number(params.get("activity") || 1),
          topic: params.get("topic") || "",
          level: params.get("level") || "A1",
          returnTo: params.get("return") || "/heute",
        }
      : null;

  let selectedIndex = 0;
  let exerciseIndex = 0;
  let toastTimer;
  let deferredInstallPrompt = null;

  const escapeHtml = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );

  const normalize = (value) =>
    String(value ?? "")
      .trim()
      .toLocaleLowerCase("de-DE")
      .replace(/[.!?,;:]+$/g, "")
      .replace(/\s+/g, " ");

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "") || fallback;
    } catch {
      return fallback;
    }
  };

  const progress = readJson(progressKey, {});
  const unitKey = (unit) => `${unit.level}:${unit.title}`;
  const completedFor = (unit) => progress[unitKey(unit)] || [];
  const saveProgress = () => localStorage.setItem(progressKey, JSON.stringify(progress));

  const notify = (message) => {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  };

  const setDrawer = (open) => {
    const sidebar = $("#sidebar");
    const scrim = $("#scrim");
    const menuButton = $("#menuBtn");
    if (!sidebar || !scrim || !menuButton) return;
    sidebar.classList.toggle("open", open);
    scrim.classList.toggle("show", open);
    menuButton.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };

  const deriveGoal = (unit) =>
    `Ich kann ${unit.title} in verständlichen, eigenen Sätzen passend verwenden.`;

  const renderRule = (unit) => {
    const explanation = unit.explanation || {};
    const cards = [
      ["Bedeutung", explanation.overview || unit.rule],
      ["Form bilden", (explanation.formation || []).join(" ")],
      ["Verwendung", (explanation.usage || []).join(" ")],
      ["Satzstellung", (explanation.wordOrder || []).join(" ")],
      ["Transfer", explanation.memoryTip || unit.transferTest],
    ];
    $("#ruleBody").innerHTML = `
      <p class="rule-intro">${escapeHtml(unit.rule)}</p>
      <div class="pattern-grid">
        ${cards
          .map(
            ([title, text], index) => `
              <article class="pattern-card">
                <div class="pattern-title"><span class="mini-icon">${index + 1}</span>${escapeHtml(title)}</div>
                <p>${escapeHtml(text || unit.rule)}</p>
              </article>`,
          )
          .join("")}
      </div>`;
  };

  const currentUnit = () => units[selectedIndex];

  const renderExercise = () => {
    const unit = currentUnit();
    if (!unit) return;
    const exercises = Array.isArray(unit.exercises) && unit.exercises.length
      ? unit.exercises
      : [[unit.recallTest || `Bilde einen Satz mit ${unit.title}.`, unit.testAnswer || unit.examples?.[0] || ""]];
    exerciseIndex = Math.max(0, Math.min(exerciseIndex, exercises.length - 1));
    const exercise = exercises[exerciseIndex];
    $("#exercisePrompt").textContent = exercise[0];
    $("#answerInput").value = "";
    const feedback = $("#feedback");
    feedback.textContent = "";
    feedback.className = "feedback";
    $("#previousBtn").disabled = exerciseIndex === 0;
    $("#nextBtn").disabled = exerciseIndex === exercises.length - 1;
  };

  const renderLesson = () => {
    const unit = currentUnit();
    if (!unit) return;
    const completed = completedFor(unit).length;
    const total = Math.max(1, unit.exercises?.length || 1);
    $("#lessonTitle").textContent = unit.title;
    $(".crumbs .badge").textContent = unit.level;
    $(".crumbs .foundations").textContent = `${completed}/${total} Übungen`;
    $("#canDoGoal").textContent = deriveGoal(unit);
    $("#examplesContent").innerHTML = `
      <p><strong>Vergleiche die Modelle:</strong></p>
      <ul>${(unit.examples || []).map((example) => `<li>${escapeHtml(example)}</li>`).join("")}</ul>
      <p><strong>Abruf:</strong> ${escapeHtml(unit.recallTest || "Erkläre die Regel ohne nachzusehen.")}</p>`;
    $("#mistakeContent").innerHTML = `
      <p>${escapeHtml(unit.commonError || "Prüfe Form, Bedeutung und Satzstellung.")}</p>
      <p><strong>Reparatur:</strong> ${escapeHtml(unit.repairTest || "Korrigiere den Fehler und erkläre die Änderung.")}</p>`;
    renderRule(unit);
    exerciseIndex = 0;
    renderExercise();
    renderCatalog();
    history.replaceState(
      null,
      "",
      `${location.pathname}?topic=${encodeURIComponent(unit.title)}${dailyContext ? `&from=daily&activity=${dailyContext.activity}&level=${encodeURIComponent(dailyContext.level)}&return=${encodeURIComponent(dailyContext.returnTo)}` : ""}`,
    );
  };

  const renderCatalog = (query = $("#topicSearch")?.value || "") => {
    const list = $("#levelList");
    if (!list) return;
    const needle = normalize(query);
    list.innerHTML = levels
      .map((level) => {
        const levelUnits = units
          .map((unit, index) => ({ unit, index }))
          .filter(({ unit }) => unit.level === level)
          .filter(({ unit }) => !needle || normalize(`${unit.title} ${unit.rule}`).includes(needle));
        if (!levelUnits.length) return "";
        const done = levelUnits.reduce((sum, { unit }) => sum + completedFor(unit).length, 0);
        const total = levelUnits.reduce((sum, { unit }) => sum + Math.max(1, unit.exercises?.length || 1), 0);
        const selectedInLevel = levelUnits.some(({ index }) => index === selectedIndex);
        return `
          <details class="level" ${selectedInLevel || needle ? "open" : ""}>
            <summary>
              <span class="level-tag ${level.toLowerCase()}">${level} · GER</span>
              <span>${levelUnits.length} Themen <small class="catalog-progress">${done}/${total} Übungen erledigt</small></span>
            </summary>
            <div class="topic-list">
              ${levelUnits
                .map(({ unit, index }) => {
                  const unitDone = completedFor(unit).length;
                  const unitTotal = Math.max(1, unit.exercises?.length || 1);
                  return `
                    <button class="topic ${index === selectedIndex ? "active" : ""}" type="button" data-index="${index}">
                      <span class="topic-dot"></span>
                      <span>${escapeHtml(unit.title)}</span>
                      <span class="topic-count">${unitDone}/${unitTotal}</span>
                    </button>`;
                })
                .join("")}
            </div>
          </details>`;
      })
      .join("");
    $$(".topic", list).forEach((button) => {
      button.addEventListener("click", () => {
        selectedIndex = Number(button.dataset.index);
        renderLesson();
        if (window.innerWidth <= 620) $(".content")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const markDailyComplete = () => {
    if (!dailyContext) return;
    const session = readJson(dailySessionKey, {});
    const completedActivities = [
      ...new Set([...(session.completedActivities || []), dailyContext.activity]),
    ];
    localStorage.setItem(
      dailySessionKey,
      JSON.stringify({
        ...session,
        currentActivity: dailyContext.activity,
        completedActivities,
        updatedAt: new Date().toISOString(),
      }),
    );
    $("#dailyCompleteDialog")?.showModal();
  };

  const checkAnswer = () => {
    const unit = currentUnit();
    if (!unit) return;
    const exercise = unit.exercises?.[exerciseIndex] || [unit.recallTest, unit.testAnswer];
    const answer = $("#answerInput").value;
    const expected = exercise[1] || unit.testAnswer || unit.examples?.[0] || "";
    const feedback = $("#feedback");
    const correct = normalize(answer) === normalize(expected);
    feedback.className = `feedback show ${correct ? "good" : "bad"}`;
    if (!correct) {
      feedback.innerHTML = `Noch nicht richtig. <strong>Eine passende Antwort ist:</strong> ${escapeHtml(expected)}<br><span>Vergleiche Bedeutung, Form und Wortstellung und versuche es erneut.</span>`;
      return;
    }
    const key = unitKey(unit);
    progress[key] = [...new Set([...(progress[key] || []), exerciseIndex])];
    saveProgress();
    feedback.textContent = `Richtig. Übung ${progress[key].length} von ${unit.exercises.length} ist erledigt.`;
    renderCatalog();
    if (progress[key].length === unit.exercises.length) markDailyComplete();
  };

  const speak = (text) => {
    if (!("speechSynthesis" in window)) {
      notify("Vorlesen wird in diesem Browser nicht unterstützt.");
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    speechSynthesis.speak(utterance);
  };

  const languageGuides = {
    Deutsch: {
      dir: "ltr",
      html: "<strong>So arbeitest du:</strong> 1. Lies die Aufgabe. 2. Antworte ohne Abschreiben. 3. Vergleiche Form und Wortstellung. 4. Sprich den korrigierten Satz laut.",
    },
    English: {
      dir: "ltr",
      html: "<strong>How to work:</strong> 1. Read the task. 2. Answer without copying. 3. Compare form and word order. 4. Say the corrected German sentence aloud.",
    },
    "فارسی": {
      dir: "rtl",
      html: "<strong>روش انجام تمرین:</strong> ۱. دستور تمرین را بخوان. ۲. بدون کپی‌کردن پاسخ بده. ۳. شکل کلمه و جای فعل را مقایسه کن. ۴. جملهٔ اصلاح‌شدهٔ آلمانی را بلند بگو.",
    },
  };

  const setupLearningControls = () => {
    const selectedTime = localStorage.getItem("deutsch-automaticity:study-time") || "15";
    const selectedLanguage = localStorage.getItem("deutsch-automaticity:explanation-language") || "Deutsch";
    const renderTime = (value) => {
      $("#timeSummary").textContent = `${value} Minuten`;
      $("#timeChoices").innerHTML = [10, 15, 20, 25, 30, 40, 50, 60]
        .map((time) => `<button type="button" class="learning-choice ${String(time) === String(value) ? "active" : ""}" data-time="${time}">${time} Min.</button>`)
        .join("");
      $$("[data-time]").forEach((button) => button.addEventListener("click", () => {
        localStorage.setItem("deutsch-automaticity:study-time", button.dataset.time);
        renderTime(button.dataset.time);
      }));
    };
    const renderLanguage = (value) => {
      const guide = languageGuides[value] || languageGuides.Deutsch;
      $("#languageSummary").textContent = value;
      $("#honovrGuide").dir = guide.dir;
      $("#honovrGuide").innerHTML = guide.html;
      $("#languageChoices").innerHTML = Object.keys(languageGuides)
        .map((language) => `<button type="button" class="learning-choice ${language === value ? "active" : ""}" data-language="${language}">${language}</button>`)
        .join("");
      $$("[data-language]").forEach((button) => button.addEventListener("click", () => {
        localStorage.setItem("deutsch-automaticity:explanation-language", button.dataset.language);
        renderLanguage(button.dataset.language);
      }));
    };
    renderTime(selectedTime);
    renderLanguage(selectedLanguage);
  };

  const setup = () => {
    if (!units.length) {
      $("#levelList").innerHTML = '<p role="alert">Der vollständige Grammatikkatalog konnte nicht geladen werden.</p>';
      $("#unitCount").textContent = "0";
      return;
    }

    $("#unitCount").textContent = String(units.length);
    const requestedTopic = dailyContext?.topic || params.get("topic") || "";
    const requestedIndex = units.findIndex((unit) => normalize(unit.title) === normalize(requestedTopic));
    const requestedLevelIndex = units.findIndex((unit) => unit.level === (dailyContext?.level || params.get("level")));
    selectedIndex = requestedIndex >= 0 ? requestedIndex : requestedLevelIndex >= 0 ? requestedLevelIndex : 0;

    $("#menuBtn")?.addEventListener("click", () => setDrawer(!$("#sidebar").classList.contains("open")));
    $("#scrim")?.addEventListener("click", () => setDrawer(false));
    document.addEventListener("keydown", (event) => event.key === "Escape" && setDrawer(false));
    $("#topicSearch")?.addEventListener("input", (event) => renderCatalog(event.target.value));
    $("#checkBtn")?.addEventListener("click", checkAnswer);
    $("#answerInput")?.addEventListener("keydown", (event) => event.key === "Enter" && checkAnswer());
    $("#previousBtn")?.addEventListener("click", () => { exerciseIndex -= 1; renderExercise(); });
    $("#nextBtn")?.addEventListener("click", () => { exerciseIndex += 1; renderExercise(); });
    $("#hintBtn")?.addEventListener("click", () => {
      const unit = currentUnit();
      notify(unit?.explanation?.memoryTip || unit?.rule || "Prüfe Bedeutung und Satzstellung.");
    });
    $("#audioBtn")?.addEventListener("click", () => speak($("#exercisePrompt").textContent));
    $("[data-action='use-today']")?.addEventListener("click", () => {
      const unit = currentUnit();
      localStorage.setItem("deutsch-automaticity:today-grammar", JSON.stringify({ level: unit.level, topic: unit.title, updatedAt: new Date().toISOString() }));
      location.href = `/heute?from=grammar&level=${encodeURIComponent(unit.level)}&topic=${encodeURIComponent(unit.title)}`;
    });
    $("[data-action='help']")?.addEventListener("click", () => notify("Wähle links ein Niveau und ein Thema. Bearbeite danach die Aufgaben der Reihe nach."));
    $("[data-action='install']")?.addEventListener("click", async () => {
      if (!deferredInstallPrompt) {
        notify("Nutze im Browser-Menü „App installieren“, wenn die Schaltfläche angeboten wird.");
        return;
      }
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
    });
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
    });

    const rulerButton = $("#rulerBtn");
    const ruler = $("#readingRuler");
    rulerButton?.addEventListener("click", () => {
      const active = !document.body.classList.contains("ruler-active");
      document.body.classList.toggle("ruler-active", active);
      rulerButton.setAttribute("aria-pressed", String(active));
      ruler?.setAttribute("aria-hidden", String(!active));
    });
    document.addEventListener("pointermove", (event) => {
      if (document.body.classList.contains("ruler-active") && ruler) ruler.style.top = `${event.clientY - 18}px`;
    });

    $("#dailyReturnBtn")?.addEventListener("click", () => { location.href = dailyContext?.returnTo || "/heute"; });
    $("#dailyRepeatBtn")?.addEventListener("click", () => { $("#dailyCompleteDialog")?.close(); exerciseIndex = 0; renderExercise(); });
    $("#dailyMistakesBtn")?.addEventListener("click", () => { location.href = "/fehler"; });

    setupLearningControls();
    renderLesson();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
