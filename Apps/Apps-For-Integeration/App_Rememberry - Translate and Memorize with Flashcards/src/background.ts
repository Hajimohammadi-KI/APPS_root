import { createCard, translationUrl, type CardLanguage } from "./core";
import { getDeck, replaceDeck, syncDeckToLocalProjects } from "./storage";

const menuRootId = "lingobridge-root";
const directions: Array<{ id: string; source: CardLanguage; target: CardLanguage; title: string }> = [
  { id: "lingobridge-de-fa", source: "de", target: "fa", title: "Deutsch → فارسی speichern" },
  { id: "lingobridge-fa-de", source: "fa", target: "de", title: "فارسی → Deutsch ذخیره" },
  { id: "lingobridge-en-fa", source: "en", target: "fa", title: "English → فارسی speichern" },
  { id: "lingobridge-de-en", source: "de", target: "en", title: "Deutsch → English speichern" },
];
const translateMenuId = "lingobridge-translate";

function installContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: menuRootId, title: "LingoBridge", contexts: ["selection"] });
    for (const direction of directions) {
      chrome.contextMenus.create({ id: direction.id, parentId: menuRootId, title: direction.title, contexts: ["selection"] });
    }
    chrome.contextMenus.create({ id: translateMenuId, parentId: menuRootId, title: "Auswahl übersetzen / ترجمه", contexts: ["selection"] });
  });
}

async function updateBadge() {
  const state = await getDeck();
  const due = state.cards.filter((card) => card.dueAt <= Date.now()).length;
  await chrome.action.setBadgeText({ text: due ? String(Math.min(due, 99)) : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#6746C3" });
}

async function saveSelection(
  text: string,
  sourceLanguage: CardLanguage,
  targetLanguage: CardLanguage,
  sourceUrl?: string,
  sourceTitle?: string,
) {
  const state = await getDeck();
  const activeDeck = state.decks.find((item) => item.id === state.settings.activeDeckId) ?? state.decks[0];
  const card = createCard({
    front: text,
    deckId: activeDeck?.id,
    sourceLanguage,
    targetLanguage,
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(sourceTitle ? { sourceTitle } : {}),
  });
  const updated = await replaceDeck({ ...state, cards: [card, ...state.cards] });
  await syncDeckToLocalProjects(updated);
  await updateBadge();
  return updated;
}

async function sendToWebTabs(message: unknown) {
  const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
  await Promise.all(tabs.filter((tab) => Number.isInteger(tab.id)).map(async (tab) => {
    try { await chrome.tabs.sendMessage(tab.id!, message); } catch { /* Restricted pages are skipped. */ }
  }));
}

chrome.runtime.onInstalled.addListener(() => {
  installContextMenus();
  void updateBadge();
});
chrome.runtime.onStartup.addListener(() => {
  installContextMenus();
  void updateBadge();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const selected = info.selectionText?.trim();
  if (!selected) return;
  if (info.menuItemId === translateMenuId) {
    await chrome.tabs.create({ url: translationUrl(selected, "de", "fa") });
    return;
  }
  const direction = directions.find((item) => item.id === String(info.menuItemId));
  if (!direction) return;
  await saveSelection(selected, direction.source, direction.target, tab?.url, tab?.title);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "LINGOBRIDGE_GET_DECK" || message?.type === "LINGOBRIDGE_GET_STATE") {
    void getDeck().then((state) => sendResponse({ deck: state, state }));
    return true;
  }
  if (message?.type === "LINGOBRIDGE_SAVE_SELECTION" && typeof message.text === "string") {
    const source = (["de", "fa", "en"].includes(message.sourceLanguage) ? message.sourceLanguage : "de") as CardLanguage;
    const target = (["de", "fa", "en"].includes(message.targetLanguage) ? message.targetLanguage : source === "fa" ? "de" : "fa") as CardLanguage;
    void saveSelection(message.text, source, target, sender.tab?.url, sender.tab?.title).then((state) => sendResponse({ ok: true, count: state.cards.length }));
    return true;
  }
  if (message?.type === "LINGOBRIDGE_OPEN_TRANSLATION" && typeof message.text === "string") {
    void chrome.tabs.create({ url: translationUrl(message.text, (message.sourceLanguage ?? "de") as CardLanguage, (message.targetLanguage ?? "fa") as CardLanguage) }).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message?.type === "LINGOBRIDGE_SYNC_NOW") {
    void getDeck().then(async (state) => ({ syncedTabs: await syncDeckToLocalProjects(state) })).then(sendResponse);
    return true;
  }
  if (message?.type === "LINGOBRIDGE_REFRESH_PAGES") {
    void getDeck().then(async (state) => { await sendToWebTabs({ type: "LINGOBRIDGE_REFRESH_PAGE_FEATURES", state }); return { ok: true }; }).then(sendResponse);
    return true;
  }
  return false;
});
