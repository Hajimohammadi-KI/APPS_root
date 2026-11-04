/** Type boundary for the unchanged hama-js 1.7.0 WASM engine. Only ASR is used. */
export const ASR_VOCAB: number;
export class HamaEngine {
  static fromBytes(bytes: Uint8Array): Promise<HamaEngine>;
  loadAsr(bytes: Uint8Array): number;
  asrRun(
    handle: number,
    waveform: Float32Array,
  ): { logProbs: Float32Array; T: number; outLength: number };
}
