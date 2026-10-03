/** Capture metadata describes recording time, not time spent flushing or saving it.
 * MediaRecorder may emit nonempty final data and stop after an error; reject it. */
export class RecordingCapture {
  private readonly startedAt: number;
  private stoppedAt: number | null = null;
  private failed = false;
  private parts: Blob[] = [];
  constructor(private readonly clock: () => number = () => performance.now()) {
    this.startedAt = clock();
  }
  add(blob: Blob): void {
    if (blob.size) this.parts.push(blob);
  }
  stop(): void {
    this.stoppedAt ??= this.clock();
  }
  fail(): void {
    this.failed = true;
    this.stop();
  }
  finish(mime: string): { blob: Blob; durationMs: number } | null {
    this.stop();
    const durationMs = Math.round(this.stoppedAt! - this.startedAt);
    const blob = new Blob(this.parts, { type: mime });
    this.parts = [];
    if (
      this.failed ||
      !blob.size ||
      !Number.isFinite(durationMs) ||
      durationMs <= 0
    )
      return null;
    return { blob, durationMs };
  }
}
