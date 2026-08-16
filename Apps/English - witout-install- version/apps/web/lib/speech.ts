interface SpeakOptions {
  rate?: number;
  onBoundary?: () => void;
  onEnd?: () => void;
  onError?: () => void;
  onStart?: () => void;
}

export function speak(text: string, options?: SpeakOptions) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) {
    return false;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = options?.rate ?? 0.92;
  utterance.onboundary = () => options?.onBoundary?.();
  utterance.onend = () => options?.onEnd?.();
  utterance.onerror = () => options?.onError?.();
  utterance.onstart = () => options?.onStart?.();
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

export const speakText = speak;
