export function speak(text: string, options?: { rate?: number }) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) {
    return false;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = options?.rate ?? 0.92;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

export const speakText = speak;
