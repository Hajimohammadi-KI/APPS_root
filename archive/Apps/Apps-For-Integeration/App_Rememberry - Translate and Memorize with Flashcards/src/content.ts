import { projectBridgeStorageKey, type CardLanguage, type FlashcardDeck } from "./core";
import type { ProjectSyncMessage } from "./storage";

let state: FlashcardDeck | null = null;
let selectionHost: HTMLDivElement | null = null;
let lastAutoSaved = "";
let lastAutoSavedAt = 0;

function isLocalProject() {
  return location.hostname === "127.0.0.1" || location.hostname === "localhost";
}

function publishToProject(deck: FlashcardDeck) {
  if (!isLocalProject()) return;
  const payload = JSON.stringify({ key: projectBridgeStorageKey, updatedAt: deck.updatedAt, cards: deck.cards });
  window.localStorage.setItem(projectBridgeStorageKey, payload);
  window.dispatchEvent(new CustomEvent("lingobridge:flashcards-updated", { detail: { count: deck.cards.length, updatedAt: deck.updatedAt } }));
}

function disabledHere(deck: FlashcardDeck) {
  return deck.settings.disabledSites.some((domain) => location.hostname === domain || location.hostname.endsWith(`.${domain}`));
}

function inferLanguages(text: string): { sourceLanguage: CardLanguage; targetLanguage: CardLanguage } {
  if (/\p{Script=Arabic}/u.test(text)) return { sourceLanguage: "fa", targetLanguage: "de" };
  const active = state?.decks.find((deck) => deck.id === state?.settings.activeDeckId);
  return { sourceLanguage: active?.sourceLanguage ?? "de", targetLanguage: active?.targetLanguage ?? "fa" };
}

async function saveSelected(text: string) {
  const languages = inferLanguages(text);
  const response = await chrome.runtime.sendMessage({ type: "LINGOBRIDGE_SAVE_SELECTION", text, ...languages }) as { count?: number };
  if (selectionHost) {
    const message = selectionHost.shadowRoot?.querySelector<HTMLElement>("[data-message]");
    if (message) message.textContent = `✓ gespeichert · ${response.count ?? ""}`;
  }
}

function removeSelectionBubble() {
  selectionHost?.remove();
  selectionHost = null;
}

function showSelectionBubble(text: string, rect: DOMRect) {
  removeSelectionBubble();
  const host = document.createElement("div");
  host.id = "lingobridge-selection-tools";
  host.style.position = "fixed";
  host.style.zIndex = "2147483647";
  host.style.left = `${Math.max(8, Math.min(innerWidth - 230, rect.left))}px`;
  host.style.top = `${Math.max(8, rect.top - 52)}px`;
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      .tools{display:flex;align-items:center;gap:5px;padding:6px;border:1px solid #cfc4e5;border-radius:13px;background:#fff;color:#171124;box-shadow:0 10px 30px rgb(30 18 54/.22);font:600 13px/1.2 "Segoe UI",sans-serif;direction:ltr}
      button{min-height:34px;padding:7px 10px;border:0;border-radius:9px;background:#eee8ff;color:#3f2787;font:inherit;cursor:pointer}
      button:first-of-type{background:#6746c3;color:#fff} button:active{transform:scale(.97)}
      [data-message]{max-width:90px;overflow:hidden;color:#524a61;font-size:11px;white-space:nowrap;text-overflow:ellipsis}
    </style>
    <div class="tools" role="toolbar" aria-label="LingoBridge"><button data-save type="button">＋ Speichern</button><button data-translate type="button">文 Übersetzen</button><span data-message></span></div>`;
  shadow.querySelector("[data-save]")?.addEventListener("click", () => void saveSelected(text));
  shadow.querySelector("[data-translate]")?.addEventListener("click", () => {
    const languages = inferLanguages(text);
    void chrome.runtime.sendMessage({ type: "LINGOBRIDGE_OPEN_TRANSLATION", text, ...languages });
    removeSelectionBubble();
  });
  document.documentElement.append(host);
  selectionHost = host;
}

function handleSelection() {
  if (!state || disabledHere(state)) return;
  const selection = window.getSelection();
  const text = selection?.toString().replace(/\s+/gu, " ").trim() ?? "";
  if (!text || text.length > 2_000 || !selection?.rangeCount) return removeSelectionBubble();
  if (state.settings.autoSaveSelection) {
    const now = Date.now();
    if (text !== lastAutoSaved || now - lastAutoSavedAt > 5_000) {
      lastAutoSaved = text;
      lastAutoSavedAt = now;
      void saveSelected(text);
    }
  }
  if (state.settings.selectionBubble) showSelectionBubble(text, selection.getRangeAt(0).getBoundingClientRect());
}

function ensureHighlightStyle() {
  if (document.getElementById("lingobridge-highlight-style")) return;
  const style = document.createElement("style");
  style.id = "lingobridge-highlight-style";
  style.textContent = "::highlight(lingobridge-known){background:rgb(255 214 75 / 42%);color:inherit;text-decoration:underline 2px rgb(103 70 195 / 48%);text-underline-offset:2px}";
  document.documentElement.append(style);
}

function refreshHighlights() {
  const highlightRegistry = (CSS as unknown as { highlights?: { delete(name: string): void; set(name: string, value: unknown): void } }).highlights;
  highlightRegistry?.delete("lingobridge-known");
  if (!state?.settings.highlightCards || disabledHere(state) || !highlightRegistry || !("Highlight" in window)) return;
  const activeCards = state.cards.filter((card) => card.deckId === state?.settings.activeDeckId);
  const terms = [...new Set(activeCards.map((card) => card.front.trim()).filter((term) => term.length >= 3 && term.length <= 80))].sort((a, b) => b.length - a.length).slice(0, 150);
  if (!terms.length) return;
  const ranges: Range[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script,style,textarea,input,select,[contenteditable=true],#lingobridge-selection-tools")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node: Node | null;
  let visited = 0;
  while ((node = walker.nextNode()) && visited < 700 && ranges.length < 500) {
    visited += 1;
    const content = node.nodeValue ?? "";
    const lower = content.toLocaleLowerCase();
    for (const term of terms) {
      let offset = lower.indexOf(term.toLocaleLowerCase());
      while (offset >= 0 && ranges.length < 500) {
        const range = new Range();
        range.setStart(node, offset);
        range.setEnd(node, offset + term.length);
        ranges.push(range);
        offset = lower.indexOf(term.toLocaleLowerCase(), offset + term.length);
      }
    }
  }
  const HighlightConstructor = (window as unknown as { Highlight: new (...ranges: Range[]) => unknown }).Highlight;
  highlightRegistry.set("lingobridge-known", new HighlightConstructor(...ranges));
}

function applyState(next: FlashcardDeck) {
  state = next;
  publishToProject(next);
  ensureHighlightStyle();
  refreshHighlights();
}

document.addEventListener("mouseup", () => setTimeout(handleSelection, 0));
document.addEventListener("keyup", (event) => { if (event.key === "Shift" || event.key.startsWith("Arrow")) setTimeout(handleSelection, 0); });
document.addEventListener("pointerdown", (event) => {
  if (selectionHost && !event.composedPath().includes(selectionHost)) removeSelectionBubble();
}, true);

chrome.runtime.onMessage.addListener((message: ProjectSyncMessage | { type?: string; state?: FlashcardDeck }, _sender, sendResponse) => {
  if (message?.type === "LINGOBRIDGE_SYNC_CARDS" && "deck" in message) {
    applyState(message.deck);
    sendResponse({ ok: true });
    return false;
  }
  if (message?.type === "LINGOBRIDGE_REFRESH_PAGE_FEATURES" && "state" in message && message.state) {
    applyState(message.state);
    sendResponse({ ok: true });
  }
  return false;
});

void chrome.runtime.sendMessage({ type: "LINGOBRIDGE_GET_STATE" }).then((response: { state?: FlashcardDeck }) => {
  if (response?.state) applyState(response.state);
}).catch(() => undefined);
