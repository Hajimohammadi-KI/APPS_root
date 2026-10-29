import { normalizeText, tokenizeText } from "./text";
import { alignAnswers } from "./automaticity/answer-alignment";
export { describeAnswerEdits } from "./automaticity/answer-alignment";
const contrasts = {
  en: [
    { words: ["thin", "tin"], phonemes: ["θɪn", "tɪn"] },
    { words: ["think", "sink"], phonemes: ["θɪŋk", "sɪŋk"] },
    { words: ["wet", "vet"], phonemes: ["wɛt", "vɛt"] },
    { words: ["west", "vest"], phonemes: ["wɛst", "vɛst"] },
    { words: ["ship", "sheep"], phonemes: ["ʃɪp", "ʃiːp"] },
  ],
  de: [
    { words: ["schön", "schon"], phonemes: ["ʃøːn", "ʃoːn"] },
    { words: ["fühlen", "fielen"], phonemes: ["ˈfyːlən", "ˈfiːlən"] },
    { words: ["drücken", "drucken"], phonemes: ["ˈdʁʏkən", "ˈdʁʊkən"] },
    { words: ["ich", "ach"], phonemes: ["ɪç", "ax"] },
  ],
} as const;
/** A small reviewed pronunciation lexicon; no G2P guess for unknown words. */
export function phoneticPractice(text: string, language: "en" | "de") {
  const words = new Set(tokenizeText(text).filter(t => t.kind === "word").map(t => t.normalized.toLocaleLowerCase(language)));
  return contrasts[language].filter(pair => pair.words.some(word => words.has(word))).map(pair => ({ ...pair, diagnosis: null }));
}

export function compareSpeechTarget(transcript: string, target: string) {
  const words = (s: string) => tokenizeText(s.slice(0, 10000)).filter(t => t.kind === "word").map(t => t.normalized.toLocaleLowerCase()).join(" ");
  return { edits: alignAnswers(words(transcript), words(target)), pronunciationScore: null } as const;
}
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
