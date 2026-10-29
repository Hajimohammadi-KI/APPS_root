import { normalizeText } from "./text";
export interface RecognitionAlternative {
  readonly transcript: string;
  readonly confidence?: number;
}
export interface RecognitionResult {
  readonly isFinal: boolean;
  readonly length?: number;
  readonly [index: number]: RecognitionAlternative | undefined;
}
export interface RecognitionEvent {
  readonly resultIndex: number;
  readonly results: ArrayLike<RecognitionResult>;
}
export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { readonly error: string }) => void) | null;
  start(): void;
  stop(): void;
}
export interface RecognitionEvidence {
  readonly finalText: string;
  readonly interimText: string;
  readonly alternatives: readonly (readonly RecognitionAlternative[])[];
  readonly reliable: boolean;
  readonly pronunciationScore: null;
}
/** Browser confidence describes recognition, never the quality of pronunciation. */
export class RecognitionCollector {
  constructor(private readonly initialText = "") {}
  update(event: RecognitionEvent): RecognitionEvidence {
    const final: string[] = [this.initialText], interim: string[] = [];
    const alternatives: RecognitionAlternative[][] = [];
    let reliable = true;
    for (let i = 0; i < Math.min(event.results.length, 500); i++) {
      const result = event.results[i];
      if (!result) continue;
      const choices: RecognitionAlternative[] = [];
      for (let j = 0; j < Math.min(result.length ?? 1, 3); j++) {
        const candidate = result[j];
        if (candidate && typeof candidate.transcript === "string") choices.push({ transcript: candidate.transcript, ...(typeof candidate.confidence === "number" ? { confidence: candidate.confidence } : {}) });
      }
      const text = choices[0]?.transcript ?? "";
      (result.isFinal ? final : interim).push(text);
      if (result.isFinal) alternatives.push(choices);
      if (!result.isFinal || !text.trim() || !choices.length || choices.some(choice => !Number.isFinite(choice.confidence) || (choice.confidence ?? 0) < 0.9 || (choice.confidence ?? 0) > 1 || normalizeText(choice.transcript).toLocaleLowerCase() !== normalizeText(text).toLocaleLowerCase())) reliable = false;
    }
    return { finalText: final.filter(Boolean).join(" ").trim(), interimText: interim.join(" ").trim(), alternatives, reliable: reliable && alternatives.length > 0, pronunciationScore: null };
  }
}
