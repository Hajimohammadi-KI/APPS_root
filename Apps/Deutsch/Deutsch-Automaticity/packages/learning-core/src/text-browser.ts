import { normalizeText, tokenizeText, detectTextLanguage } from "./text";
Object.defineProperty(globalThis, "AutomaticityText", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: Object.freeze({ normalizeText, tokenizeText, detectTextLanguage }),
});
export { normalizeText, tokenizeText, detectTextLanguage };
