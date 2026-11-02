import { normalizeText, tokenizeText, detectTextLanguage } from "./text";
import {
  checkClosedAnswer,
  closedResponseKind,
} from "./automaticity/closed-answer";
import { markedAnswer } from "./automaticity/answer-alignment";
Object.defineProperty(globalThis, "AutomaticityText", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: Object.freeze({
    normalizeText,
    tokenizeText,
    detectTextLanguage,
    // The Grammar Labs grade closed answers exactly as the learning path does.
    checkClosedAnswer,
    closedResponseKind,
    markedAnswer,
  }),
});
export {
  normalizeText,
  tokenizeText,
  detectTextLanguage,
  checkClosedAnswer,
  closedResponseKind,
  markedAnswer,
};
