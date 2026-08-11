import {
  createCard,
  createNamedDeck,
  importDeck,
  isDue,
  languageLabel,
  recordStudy,
  reviewCard,
  translationUrl,
  type CardLanguage,
  type Flashcard,
  type FlashcardDeck,
  type InterfaceLanguage,
  type ReviewGrade,
} from "./core";
import { getDeck, replaceDeck } from "./storage";

const element = <T extends HTMLElement>(id: string): T => {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Missing popup element: ${id}`);
  return value as T;
};

const dueCount = element<HTMLElement>("due-count");
const availableCount = element<HTMLElement>("available-count");
const reviewMessage = element<HTMLElement>("review-message");
const startReview = element<HTMLButtonElement>("start-review");
const reviewPanel = element<HTMLElement>("review-panel");
const reviewProgress = element<HTMLElement>("review-progress");
const closeReview = element<HTMLButtonElement>("close-review");
const flashcardLanguage = element<HTMLElement>("flashcard-language");
const flashcardFront = element<HTMLElement>("flashcard-front");
const flashcardBack = element<HTMLElement>("flashcard-back");
const flashcardNotes = element<HTMLElement>("flashcard-notes");
const flashcardAnswer = element<HTMLElement>("flashcard-answer");
const revealActions = element<HTMLElement>("reveal-actions");
const revealAnswer = element<HTMLButtonElement>("reveal-answer");
const speakCard = element<HTMLButtonElement>("speak-card");
const listenQuestion = element<HTMLButtonElement>("listen-question");
const typingAnswerWrap = element<HTMLElement>("typing-answer-wrap");
const typingAnswer = element<HTMLInputElement>("typing-answer");
const typingResult = element<HTMLElement>("typing-result");
const gradeActions = element<HTMLElement>("grade-actions");
const sourceLanguage = element<HTMLSelectElement>("source-language");
const targetLanguage = element<HTMLSelectElement>("target-language");
const front = element<HTMLTextAreaElement>("front");
const back = element<HTMLTextAreaElement>("back");
const notes = element<HTMLTextAreaElement>("notes");
const saveCard = element<HTMLButtonElement>("save-card");
const captureSelection = element<HTMLButtonElement>("capture-selection");
const openTranslate = element<HTMLButtonElement>("open-translate");
const swapLanguages = element<HTMLButtonElement>("swap-languages");
const studyDeck = element<HTMLSelectElement>("study-deck");
const captureDeck = element<HTMLSelectElement>("capture-deck");
const managerDeck = element<HTMLSelectElement>("manager-deck");
const learningMode = element<HTMLSelectElement>("learning-mode");
const cardsPerSession = element<HTMLSelectElement>("cards-per-session");
const cardSort = element<HTMLSelectElement>("card-sort");
const smartRepeat = element<HTMLInputElement>("smart-repeat");
const reverseMode = element<HTMLInputElement>("reverse-mode");
const pronounceAnswer = element<HTMLInputElement>("pronounce-answer");
const deckCount = element<HTMLElement>("deck-count");
const cardList = element<HTMLElement>("card-list");
const cardSearch = element<HTMLInputElement>("card-search");
const syncProjects = element<HTMLButtonElement>("sync-projects");
const newDeckName = element<HTMLInputElement>("new-deck-name");
const newDeckSource = element<HTMLSelectElement>("new-deck-source");
const newDeckTarget = element<HTMLSelectElement>("new-deck-target");
const createDeckButton = element<HTMLButtonElement>("create-deck");
const interfaceLanguage = element<HTMLSelectElement>("interface-language");
const selectionBubble = element<HTMLInputElement>("selection-bubble");
const autoSaveSelection = element<HTMLInputElement>("auto-save-selection");
const highlightCards = element<HTMLInputElement>("highlight-cards");
const disabledSites = element<HTMLTextAreaElement>("disabled-sites");
const saveSettings = element<HTMLButtonElement>("save-settings");
const exportDeck = element<HTMLButtonElement>("export-deck");
const importDeckInput = element<HTMLInputElement>("import-deck");
const streakCount = element<HTMLElement>("streak-count");
const openSidePanel = element<HTMLButtonElement>("open-side-panel");
const status = element<HTMLElement>("status");
const tourBackdrop = element<HTMLElement>("tour-backdrop");
const tourTitle = element<HTMLElement>("tour-title");
const tourText = element<HTMLElement>("tour-text");
const tourIcon = element<HTMLElement>("tour-icon");
const tourProgress = element<HTMLElement>("tour-progress");
const tourBack = element<HTMLButtonElement>("tour-back");
const tourNext = element<HTMLButtonElement>("tour-next");
const tourLater = element<HTMLButtonElement>("tour-later");

let deck: FlashcardDeck;
let sessionCardIds: string[] = [];
let sessionIndex = 0;
let activeReview: Flashcard | null = null;
let editingCardId: string | null = null;
let tourIndex = 0;

const tours = [
  ["👋", "Willkommen bei LingoBridge", "Ihr privater Lernraum für Deutsch, فارسی und English. Alle Funktionen sind kostenlos und Ihre Daten bleiben lokal."],
  ["📌", "Schnell erreichbar", "Heften Sie LingoBridge im Erweiterungsmenü an. Sie können es zusätzlich als Seitenpanel neben jeder Webseite öffnen."],
  ["🗂️", "Decks organisieren", "Erstellen Sie Decks für Themen oder Niveaus, suchen und bearbeiten Sie Karten und verschieben Sie sie zwischen Decks."],
  ["🧠", "Intelligent oder frei wiederholen", "Die intelligente Wiederholung zeigt fällige Karten. Sie können sie abschalten und jederzeit frei üben."],
  ["🎧", "Drei Lernmodi", "Üben Sie mit Text, hören Sie zuerst nur die Aussprache oder tippen Sie Ihre Antwort und vergleichen Sie sie."],
  ["⇄", "Rückwärtsmodus", "Zeigen Sie zuerst die Übersetzung und rufen Sie den Originalausdruck aktiv aus dem Gedächtnis ab."],
  ["🌐", "Text auf Webseiten", "Nach einer Textauswahl erscheinen Speichern und Übersetzen direkt daneben. Gelernte Wörter können auf Seiten markiert werden."],
  ["💾", "Backup und Ihre Apps", "Exportieren Sie alle Daten als JSON und teilen Sie Karten lokal mit der deutschen App, der englischen App und dem Projekt-Tracker."],
];

const uiText = {
  de: { start: "Starten", save: "Karte speichern", saved: "Karte lokal gespeichert.", due: "Karten fällig", empty: "Ihr Deck ist leer.", edit: "Änderungen speichern" },
  en: { start: "Start review", save: "Save card", saved: "Card saved locally.", due: "cards due", empty: "Your deck is empty.", edit: "Save changes" },
  fa: { start: "شروع مرور", save: "ذخیره کارت", saved: "کارت به‌صورت محلی ذخیره شد.", due: "کارت برای مرور", empty: "دسته شما خالی است.", edit: "ذخیره تغییرات" },
} as const;

function textSet() { return uiText[deck?.settings.interfaceLanguage ?? "de"]; }
function setStatus(message: string) { status.textContent = message; }
function normalize(value: string) { return value.normalize("NFKC").toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, " ").trim(); }

function switchView(route: string) {
  document.querySelectorAll<HTMLElement>("[data-view]").forEach((view) => view.classList.toggle("hidden", view.dataset.view !== route));
  document.querySelectorAll<HTMLButtonElement>("[data-route]").forEach((button) => button.classList.toggle("active", button.dataset.route === route));
}

function syncLanguageSelects(changed: "source" | "target") {
  if (sourceLanguage.value !== targetLanguage.value) return;
  const options: CardLanguage[] = ["de", "fa", "en"];
  if (changed === "source") targetLanguage.value = options.find((value) => value !== sourceLanguage.value) ?? "fa";
  else sourceLanguage.value = options.find((value) => value !== targetLanguage.value) ?? "de";
}

function selectedDeckId() { return studyDeck.value || deck.settings.activeDeckId; }
function cardsInDeck(deckId = selectedDeckId()) { return deck.cards.filter((card) => card.deckId === deckId); }
function availableCards() {
  const cards = cardsInDeck();
  return deck.settings.smartRepeat ? cards.filter((card) => isDue(card)) : cards;
}

function renderDeckSelect(select: HTMLSelectElement, selected: string) {
  select.replaceChildren(...deck.decks.map((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    option.selected = item.id === selected;
    return option;
  }));
}

function renderControls() {
  const activeId = deck.decks.some((item) => item.id === deck.settings.activeDeckId) ? deck.settings.activeDeckId : deck.decks[0]?.id ?? "";
  renderDeckSelect(studyDeck, activeId);
  renderDeckSelect(captureDeck, activeId);
  renderDeckSelect(managerDeck, managerDeck.value || activeId);
  learningMode.value = deck.settings.learningMode;
  cardsPerSession.value = String(deck.settings.cardsPerSession);
  cardSort.value = deck.settings.cardSort;
  smartRepeat.checked = deck.settings.smartRepeat;
  reverseMode.checked = deck.settings.reverseMode;
  pronounceAnswer.checked = deck.settings.pronounceAnswer;
  interfaceLanguage.value = deck.settings.interfaceLanguage;
  selectionBubble.checked = deck.settings.selectionBubble;
  autoSaveSelection.checked = deck.settings.autoSaveSelection;
  highlightCards.checked = deck.settings.highlightCards;
  disabledSites.value = deck.settings.disabledSites.join("\n");
  streakCount.textContent = String(deck.stats.streak);
  applyInterfaceLanguage(deck.settings.interfaceLanguage);
}

function applyInterfaceLanguage(language: InterfaceLanguage) {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
  startReview.textContent = uiText[language].start;
  saveCard.textContent = editingCardId ? uiText[language].edit : uiText[language].save;
}

function renderSummary() {
  const all = cardsInDeck();
  const available = availableCards();
  dueCount.textContent = `${available.length} ${textSet().due}`;
  availableCount.textContent = `${available.length} verfügbar`;
  reviewMessage.textContent = available.length ? "Eine ruhige Karte nach der anderen. Der nächste Termin passt sich Ihrer Antwort an." : all.length ? "Jetzt ist keine Karte fällig. Sie können die intelligente Wiederholung ausschalten und frei üben." : "Markieren Sie Text auf einer Seite oder erstellen Sie Ihre erste Karte.";
  startReview.disabled = available.length === 0;
}

function renderManager() {
  const deckId = managerDeck.value || deck.settings.activeDeckId;
  const query = normalize(cardSearch.value);
  const cards = deck.cards.filter((card) => card.deckId === deckId && (!query || normalize(`${card.front} ${card.back} ${card.notes ?? ""}`).includes(query)));
  deckCount.textContent = `${cards.length} Karte${cards.length === 1 ? "" : "n"}`;
  cardList.replaceChildren(...cards.map(renderDeckCard));
  if (!cards.length) {
    const empty = document.createElement("p");
    empty.className = "privacy-note";
    empty.textContent = query ? "Keine passende Karte gefunden." : textSet().empty;
    cardList.replaceChildren(empty);
  }
}

function renderDeckCard(card: Flashcard): HTMLElement {
  const row = document.createElement("article");
  row.className = "deck-card";
  const text = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = card.front;
  const answer = document.createElement("span");
  answer.textContent = card.back || "Bedeutung noch ergänzen";
  text.append(title, answer);
  const actions = document.createElement("div");
  actions.className = "deck-actions";
  const move = document.createElement("select");
  move.title = "In anderes Deck verschieben";
  move.replaceChildren(...deck.decks.map((item) => new Option(item.name, item.id, false, item.id === card.deckId)));
  move.addEventListener("change", () => void persist({ ...deck, cards: deck.cards.map((item) => item.id === card.id ? { ...item, deckId: move.value, updatedAt: Date.now() } : item) }).then(renderAll));
  const edit = document.createElement("button");
  edit.type = "button"; edit.title = "Bearbeiten"; edit.textContent = "✎";
  edit.addEventListener("click", () => editCard(card));
  const remove = document.createElement("button");
  remove.type = "button"; remove.title = "Löschen"; remove.textContent = "×";
  remove.addEventListener("click", () => void persist({ ...deck, cards: deck.cards.filter((item) => item.id !== card.id) }).then(renderAll));
  actions.append(move, edit, remove);
  row.append(text, actions);
  return row;
}

function editCard(card: Flashcard) {
  editingCardId = card.id;
  sourceLanguage.value = card.sourceLanguage;
  targetLanguage.value = card.targetLanguage;
  captureDeck.value = card.deckId;
  front.value = card.front;
  back.value = card.back;
  notes.value = card.notes ?? "";
  saveCard.textContent = textSet().edit;
  switchView("translate");
  front.focus();
}

async function persist(next: FlashcardDeck) {
  deck = await replaceDeck(next);
}

function renderAll() {
  renderControls();
  renderSummary();
  renderManager();
}

function sessionSettingsChanged() {
  void persist({ ...deck, settings: { ...deck.settings, activeDeckId: studyDeck.value, learningMode: learningMode.value as FlashcardDeck["settings"]["learningMode"], cardsPerSession: cardsPerSession.value === "all" ? "all" : Number(cardsPerSession.value), cardSort: cardSort.value as FlashcardDeck["settings"]["cardSort"], smartRepeat: smartRepeat.checked, reverseMode: reverseMode.checked, pronounceAnswer: pronounceAnswer.checked } }).then(renderAll);
}

function startSession() {
  let cards = [...availableCards()];
  if (deck.settings.cardSort === "random") cards.sort(() => Math.random() - .5);
  else if (deck.settings.cardSort === "new") cards.sort((a, b) => b.createdAt - a.createdAt);
  else cards.sort((a, b) => a.dueAt - b.dueAt);
  if (deck.settings.cardsPerSession !== "all") cards = cards.slice(0, deck.settings.cardsPerSession);
  sessionCardIds = cards.map((card) => card.id);
  sessionIndex = 0;
  renderReview();
}

function renderReview() {
  const id = sessionCardIds[sessionIndex];
  activeReview = deck.cards.find((card) => card.id === id) ?? null;
  if (!activeReview) {
    reviewPanel.classList.add("hidden");
    renderSummary();
    setStatus("Sitzung abgeschlossen. Der nächste Termin wurde gespeichert.");
    return;
  }
  const reverse = deck.settings.reverseMode;
  const question = reverse ? activeReview.back : activeReview.front;
  const answer = reverse ? activeReview.front : activeReview.back;
  reviewPanel.classList.remove("hidden");
  reviewProgress.textContent = `${sessionIndex + 1} / ${sessionCardIds.length}`;
  flashcardLanguage.textContent = `${languageLabel(reverse ? activeReview.targetLanguage : activeReview.sourceLanguage)} → ${languageLabel(reverse ? activeReview.sourceLanguage : activeReview.targetLanguage)}`;
  flashcardFront.textContent = question || "Bedeutung zuerst ergänzen";
  flashcardBack.textContent = answer || "Bedeutung noch ergänzen";
  flashcardNotes.textContent = activeReview.notes ?? "";
  flashcardAnswer.classList.add("hidden");
  revealActions.classList.remove("hidden");
  gradeActions.classList.add("hidden");
  typingResult.classList.add("hidden");
  typingAnswer.value = "";
  const listening = deck.settings.learningMode === "listening";
  const typing = deck.settings.learningMode === "typing";
  flashcardFront.classList.toggle("hidden", listening);
  listenQuestion.classList.toggle("hidden", !listening);
  typingAnswerWrap.classList.toggle("hidden", !typing);
  if (listening) speak(question, reverse ? activeReview.targetLanguage : activeReview.sourceLanguage);
  if (typing) typingAnswer.focus();
}

function revealCurrentAnswer() {
  if (!activeReview) return;
  flashcardFront.classList.remove("hidden");
  flashcardAnswer.classList.remove("hidden");
  revealActions.classList.add("hidden");
  gradeActions.classList.remove("hidden");
  if (deck.settings.learningMode === "typing") {
    const expected = normalize(deck.settings.reverseMode ? activeReview.front : activeReview.back);
    const actual = normalize(typingAnswer.value);
    typingResult.textContent = actual && actual === expected ? "✓ Richtig erinnert" : `Vergleichen: ${typingAnswer.value || "—"}`;
    typingResult.classList.remove("hidden");
  }
  if (deck.settings.pronounceAnswer) speak(deck.settings.reverseMode ? activeReview.front : activeReview.back, deck.settings.reverseMode ? activeReview.sourceLanguage : activeReview.targetLanguage);
}

function speak(text: string, language: CardLanguage) {
  if (!("speechSynthesis" in window) || !text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === "de" ? "de-DE" : language === "fa" ? "fa-IR" : "en-GB";
  utterance.rate = .84;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

async function gradeActiveCard(grade: ReviewGrade) {
  if (!activeReview) return;
  const reviewed = reviewCard(activeReview, grade);
  await persist({ ...deck, cards: deck.cards.map((card) => card.id === reviewed.id ? reviewed : card), stats: recordStudy(deck.stats) });
  sessionIndex += 1;
  renderReview();
}

async function saveNewCard() {
  const now = Date.now();
  if (editingCardId) {
    const original = deck.cards.find((card) => card.id === editingCardId);
    if (!original) return;
    const updated = createCard({ front: front.value, back: back.value, notes: notes.value, deckId: captureDeck.value, sourceLanguage: sourceLanguage.value as CardLanguage, targetLanguage: targetLanguage.value as CardLanguage }, now);
    await persist({ ...deck, cards: deck.cards.map((card) => card.id === editingCardId ? { ...updated, id: original.id, createdAt: original.createdAt, dueAt: original.dueAt, intervalDays: original.intervalDays, repetitions: original.repetitions, lapses: original.lapses, ease: original.ease } : card) });
    editingCardId = null;
  } else {
    const card = createCard({ front: front.value, back: back.value, notes: notes.value, deckId: captureDeck.value, sourceLanguage: sourceLanguage.value as CardLanguage, targetLanguage: targetLanguage.value as CardLanguage }, now);
    await persist({ ...deck, cards: [card, ...deck.cards] });
  }
  front.value = ""; back.value = ""; notes.value = "";
  saveCard.textContent = textSet().save;
  renderAll();
  setStatus(textSet().saved);
}

async function captureSelectedText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("Kein aktiver Tab gefunden.");
  const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.getSelection()?.toString().trim() ?? "" });
  const selected = String(result?.result ?? "").trim();
  if (!selected) throw new Error("Markieren Sie zuerst Text auf einer Webseite.");
  front.value = selected;
  switchView("translate");
  back.focus();
}

async function createNewDeck() {
  const created = createNamedDeck(newDeckName.value, newDeckSource.value as CardLanguage, newDeckTarget.value as CardLanguage);
  await persist({ ...deck, decks: [...deck.decks, created], settings: { ...deck.settings, activeDeckId: created.id } });
  newDeckName.value = "";
  renderAll();
  managerDeck.value = created.id;
  renderManager();
  setStatus("Deck erstellt.");
}

async function storeSettings() {
  const domains = disabledSites.value.split(/\r?\n/u).map((value) => value.trim().replace(/^https?:\/\//u, "").split("/")[0] ?? "").filter(Boolean);
  await persist({ ...deck, settings: { ...deck.settings, interfaceLanguage: interfaceLanguage.value as InterfaceLanguage, selectionBubble: selectionBubble.checked, autoSaveSelection: autoSaveSelection.checked, highlightCards: highlightCards.checked, disabledSites: domains } });
  renderAll();
  await chrome.runtime.sendMessage({ type: "LINGOBRIDGE_REFRESH_PAGES" }).catch(() => undefined);
  setStatus(deck.settings.interfaceLanguage === "fa" ? "تنظیمات ذخیره شد." : "Einstellungen gespeichert.");
}

function exportCurrentDeck() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(deck, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url; link.download = `lingobridge-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click();
  URL.revokeObjectURL(url);
  setStatus("Backup heruntergeladen.");
}

async function importBackup(file: File) {
  deck = await replaceDeck(importDeck(JSON.parse(await file.text()) as unknown));
  renderAll();
  setStatus("Backup wiederhergestellt.");
}

async function syncLocalProjects() {
  const response = await chrome.runtime.sendMessage({ type: "LINGOBRIDGE_SYNC_NOW" }) as { syncedTabs?: number };
  setStatus(`${response.syncedTabs ?? 0} offene App-Registerkarten wurden aktualisiert.`);
}

function showTour(index = 0) { tourIndex = index; tourBackdrop.classList.remove("hidden"); renderTour(); }
function renderTour() {
  const [icon, title, copy] = tours[tourIndex] ?? tours[0]!;
  tourIcon.textContent = icon; tourTitle.textContent = title; tourText.textContent = copy;
  tourBack.disabled = tourIndex === 0;
  tourNext.textContent = tourIndex === tours.length - 1 ? "Fertig" : "Weiter";
  tourProgress.replaceChildren(...tours.map((_, index) => { const dot = document.createElement("span"); dot.classList.toggle("active", index === tourIndex); return dot; }));
}
async function finishTour() { tourBackdrop.classList.add("hidden"); await persist({ ...deck, settings: { ...deck.settings, onboardingComplete: true } }); }

document.querySelectorAll<HTMLButtonElement>("[data-route]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.route ?? "study")));
[studyDeck, learningMode, cardsPerSession, cardSort, smartRepeat, reverseMode, pronounceAnswer].forEach((control) => control.addEventListener("change", sessionSettingsChanged));
managerDeck.addEventListener("change", renderManager);
cardSearch.addEventListener("input", renderManager);
sourceLanguage.addEventListener("change", () => syncLanguageSelects("source"));
targetLanguage.addEventListener("change", () => syncLanguageSelects("target"));
swapLanguages.addEventListener("click", () => { const source = sourceLanguage.value; sourceLanguage.value = targetLanguage.value; targetLanguage.value = source; const original = front.value; front.value = back.value; back.value = original; });
saveCard.addEventListener("click", () => void saveNewCard().catch((error) => setStatus(error instanceof Error ? error.message : "Karte konnte nicht gespeichert werden.")));
captureSelection.addEventListener("click", () => void captureSelectedText().catch((error) => setStatus(error instanceof Error ? error.message : "Auswahl konnte nicht gelesen werden.")));
openTranslate.addEventListener("click", () => { if (!front.value.trim()) return setStatus("Geben Sie zuerst Text ein."); void chrome.tabs.create({ url: translationUrl(front.value, sourceLanguage.value as CardLanguage, targetLanguage.value as CardLanguage) }); });
startReview.addEventListener("click", startSession);
closeReview.addEventListener("click", () => reviewPanel.classList.add("hidden"));
revealAnswer.addEventListener("click", revealCurrentAnswer);
typingAnswer.addEventListener("keydown", (event) => { if (event.key === "Enter") revealCurrentAnswer(); });
speakCard.addEventListener("click", () => { if (activeReview) speak(deck.settings.reverseMode ? activeReview.back : activeReview.front, deck.settings.reverseMode ? activeReview.targetLanguage : activeReview.sourceLanguage); });
listenQuestion.addEventListener("click", () => { if (activeReview) speak(deck.settings.reverseMode ? activeReview.back : activeReview.front, deck.settings.reverseMode ? activeReview.targetLanguage : activeReview.sourceLanguage); });
gradeActions.addEventListener("click", (event) => { const grade = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-grade]")?.dataset.grade; if (["again", "hard", "good", "easy"].includes(String(grade))) void gradeActiveCard(grade as ReviewGrade); });
createDeckButton.addEventListener("click", () => void createNewDeck().catch((error) => setStatus(error instanceof Error ? error.message : "Deck konnte nicht erstellt werden.")));
syncProjects.addEventListener("click", () => void syncLocalProjects());
saveSettings.addEventListener("click", () => void storeSettings());
exportDeck.addEventListener("click", exportCurrentDeck);
importDeckInput.addEventListener("change", () => { const file = importDeckInput.files?.[0]; if (file) void importBackup(file).catch(() => setStatus("Diese Datei ist kein gültiges LingoBridge-Backup.")); importDeckInput.value = ""; });
openSidePanel.addEventListener("click", async () => { try { const current = await chrome.windows.getCurrent(); if (current.id) await chrome.sidePanel.open({ windowId: current.id }); } catch { await chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") }); } });
element("restart-tour").addEventListener("click", () => showTour());
element("tour-close").addEventListener("click", () => void finishTour());
tourLater.addEventListener("click", () => tourBackdrop.classList.add("hidden"));
tourBack.addEventListener("click", () => { tourIndex = Math.max(0, tourIndex - 1); renderTour(); });
tourNext.addEventListener("click", () => { if (tourIndex < tours.length - 1) { tourIndex += 1; renderTour(); } else void finishTour(); });

void getDeck().then((storedDeck) => {
  deck = storedDeck;
  renderAll();
  if (!deck.settings.onboardingComplete) showTour();
});
