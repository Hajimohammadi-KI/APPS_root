import { calmSections } from "./calm-sections.js";
import { focusRail } from "./focus-rail.js";
import { guidedPath } from "./guided-path.js";
import { prototypeState } from "./prototype-data.js";

const variants = [focusRail, guidedPath, calmSections];

// `variants` is an array of render functions, one per variant, in picker order.
const stage = document.getElementById('stage');
const picker = document.querySelector('.proto-picker');
const highlight = picker.querySelector('.proto-picker-highlight');
const items = [...picker.querySelectorAll('.proto-picker-item:not(.proto-picker-replay)')];
const replay = picker.querySelector('.proto-picker-replay');
let current = 0;

function updatePickerPosition() {
  if (current === 0 && matchMedia("(max-width: 680px)").matches) {
    picker.setAttribute("data-position", "top");
  } else {
    picker.removeAttribute("data-position");
  }
}

function moveHighlight() {
  const el = items[current];
  highlight.style.width = el.offsetWidth + 'px';
  highlight.style.transform = `translateX(${el.offsetLeft}px)`;
}

function mount(i) {
  stage.innerHTML = '';
  // Clear first, render next frame, so entrance animations re-run.
  requestAnimationFrame(() => { stage.innerHTML = variants[i](); });
}

function setActive(i) {
  if (i < 0 || i >= variants.length) return;
  current = i;
  items.forEach((el, j) => {
    el.toggleAttribute('data-active', j === i);
    if (j === i) el.setAttribute('aria-current', 'true');
    else el.removeAttribute('aria-current');
  });
  moveHighlight();
  updatePickerPosition();
  const url = new URL(location);
  url.searchParams.set('v', i + 1);
  history.replaceState(null, '', url);
  mount(i);
}

items.forEach((el, i) => el.addEventListener('click', () => setActive(i)));
replay?.addEventListener('click', () => mount(current));
window.addEventListener('resize', moveHighlight);
window.addEventListener('resize', updatePickerPosition);

document.addEventListener('keydown', (e) => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const num = parseInt(e.key, 10);
  if (num >= 1 && num <= variants.length) setActive(num - 1);
  else if (e.key === 'ArrowRight') setActive((current + 1) % variants.length);
  else if (e.key === 'ArrowLeft') setActive((current - 1 + variants.length) % variants.length);
  else if (e.key === 'r' || e.key === 'R') mount(current);
});

setActive((parseInt(new URLSearchParams(location.search).get('v'), 10) || 1) - 1);
// Enable the slide only after first paint, so load doesn't animate.
requestAnimationFrame(() => requestAnimationFrame(() => picker.setAttribute('data-ready', '')));

function persistState() {
  const url = new URL(location);
  url.searchParams.set("lang", prototypeState.lang);
  url.searchParams.set("page", prototypeState.page);
  history.replaceState(null, "", url);
}

document.addEventListener("click", (event) => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    prototypeState.page = pageButton.dataset.page;
    persistState();
    mount(current);
    return;
  }

  const demoButton = event.target.closest('[data-demo-action="complete"]');
  if (demoButton) {
    const completed = demoButton.dataset.completed === "true";
    demoButton.dataset.completed = String(!completed);
    demoButton.textContent = completed
      ? (prototypeState.lang === "de" ? "Öffnen" : "Open")
      : (prototypeState.lang === "de" ? "Erledigt" : "Completed");
    return;
  }

  const recordButton = event.target.closest("[data-record]");
  if (recordButton) {
    const recording = recordButton.getAttribute("aria-pressed") === "true";
    recordButton.setAttribute("aria-pressed", String(!recording));
    recordButton.textContent = recording
      ? (prototypeState.lang === "de" ? "Aufnahme starten" : "Start recording")
      : (prototypeState.lang === "de" ? "Aufnahme stoppen" : "Stop recording");
    const status = stage.querySelector("[data-record-status]");
    if (status) status.textContent = recording
      ? (prototypeState.lang === "de" ? "Aufnahme gespeichert" : "Recording saved")
      : (prototypeState.lang === "de" ? "Aufnahme läuft …" : "Recording …");
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-language-select]")) {
    prototypeState.lang = event.target.value;
    persistState();
    document.documentElement.lang = prototypeState.lang;
    mount(current);
  } else if (event.target.matches("[data-page-select]")) {
    prototypeState.page = event.target.value;
    persistState();
    mount(current);
  } else if (event.target.matches("[data-unit]")) {
    const summary = stage.querySelector("[data-unit-summary]");
    if (summary) summary.textContent = prototypeState.lang === "de"
      ? `${event.target.value} ist jetzt als heutiges Übungsthema vorgemerkt.`
      : `${event.target.value} is now ready as today's practice topic.`;
  }
});
