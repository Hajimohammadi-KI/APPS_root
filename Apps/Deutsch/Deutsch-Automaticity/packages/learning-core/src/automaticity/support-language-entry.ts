import type { Language } from "./contracts";
import { getSupportGuide, mountSupportLanguageGuide, readSupportLanguage, saveSupportLanguage } from "./support-language";

function setup() {
  // Practice embeds its own task-aware guide in the bundled renderer.
  if (document.querySelector("[data-support-language-guide]")) return;
  const target: Language = document.documentElement.lang === "de" ? "de" : "en";
  const declaredHost = document.getElementById("native-language-guide-host");
  const host = declaredHost ?? document.createElement("div");
  host.classList.add("native-language-guide-host");
  if (!declaredHost) {
    const main = document.querySelector(".main, main, .main-content, .content");
    (main ?? document.body).prepend(host);
  }
  const controller = mountSupportLanguageGuide(host, target);
  const existingButton = (language: string) => {
    const value = target === "de" ? ({ fa: "فارسی", en: "English", de: "Deutsch" }[language] ?? language) : language;
    return Array.from(document.querySelectorAll<HTMLButtonElement>("#languageChoices [data-language], #language-choices [data-language]"))
      .find(button => button.dataset.language === value);
  };
  const syncOriginal = () => {
    const language = readSupportLanguage(target);
    const button = existingButton(language);
    if (button && !button.classList.contains("active")) button.click();
  };
  const sourceRule = document.getElementById("ruleBody");
  const reference = document.getElementById("ruleReference");
  const fallback = sourceRule ? document.createElement("p") : null;
  if (sourceRule && fallback) {
    sourceRule.lang = target; sourceRule.dir = "ltr";
    fallback.className = "support-language-fallback";
    // Keep the disclosure hidden with the source rule; no answer text is copied.
    sourceRule.prepend(fallback);
  }
  const updateFallback = () => {
    if (!fallback || !sourceRule) return;
    // Static grammar replaces ruleBody when selecting a topic.
    if (!fallback.isConnected) sourceRule.prepend(fallback);
    const language = readSupportLanguage(target);
    const guide = getSupportGuide(language, target, { sourceRule: "source", allowSourceRule: true });
    fallback.textContent = guide.fallbackNote; fallback.lang = language; fallback.dir = guide.dir;
    fallback.hidden = !guide.fallbackNote;
  };
  window.addEventListener("automaticity:support-language", () => { syncOriginal(); updateFallback(); });
  window.addEventListener("storage", () => { syncOriginal(); updateFallback(); });
  document.addEventListener("click", event => {
    const element = event.target instanceof Element ? event.target.closest("#languageChoices [data-language], #language-choices [data-language]") : null;
    if (!element) return;
    queueMicrotask(() => {
      const language = readSupportLanguage(target);
      window.dispatchEvent(new CustomEvent("automaticity:support-language", { detail: { target, language } }));
    });
  });
  reference?.addEventListener("toggle", updateFallback);
  // Persist nothing during first render. Legacy controls own their matching key.
  controller.update({}); syncOriginal(); updateFallback();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
else setup();
