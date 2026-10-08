import type { CaptureState, Language } from "./model";
interface RecognitionResult {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        readonly resultIndex: number;
        readonly results: ArrayLike<RecognitionResult>;
      }) => void)
    | null;
  onerror: ((event: { readonly error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
interface RecognitionConstructor {
  new (): Recognition;
}
export interface RecordingSnapshot {
  readonly audio: Blob;
  readonly durationMs: number;
  readonly rawTranscript: string;
  readonly transcriptSource: "browser-asr" | "unavailable";
  readonly captureState: CaptureState;
}
export interface RecorderEvents {
  tick(milliseconds: number, level: number): void;
  checkpoint(snapshot: RecordingSnapshot): void;
  stopped(snapshot: RecordingSnapshot): void;
  recognitionUnavailable(): void;
  interrupted(): void;
}

/** Owns a single capture. Retry always creates another instance and another audio file. */
export class StudioRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private recognition: Recognition | null = null;
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private chunks: Blob[] = [];
  private raw = "";
  private recognitionGeneration = 0;
  private source: RecordingSnapshot["transcriptSource"] = "unavailable";
  private elapsed = 0;
  private started = 0;
  private disposed = false;
  private state: CaptureState = "stopped";
  constructor(
    private readonly language: Language,
    private readonly events: RecorderEvents,
  ) {}

  private milliseconds(): number {
    return (
      this.elapsed +
      (this.state === "recording" ? performance.now() - this.started : 0)
    );
  }
  private snapshot(): RecordingSnapshot {
    return {
      audio: new Blob(this.chunks, {
        type: this.recorder?.mimeType || "audio/webm",
      }),
      durationMs: Math.round(this.milliseconds()),
      rawTranscript: this.raw,
      transcriptSource: this.source,
      captureState: this.state,
    };
  }
  async start(): Promise<void> {
    if (
      !window.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia ||
      !window.MediaRecorder
    )
      throw new Error("unsupported");
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    if (this.disposed) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    this.stream = stream;
    try {
      const recorder = new MediaRecorder(stream);
      this.recorder = recorder;
      recorder.ondataavailable = ({ data }) => {
        if (data.size) this.chunks.push(data);
        // Persist periodic chunks, so a tab interruption does not discard the entire answer.
        if (
          this.chunks.length &&
          this.state !== "stopped" &&
          this.state !== "interrupted"
        )
          this.events.checkpoint(this.snapshot());
      };
      recorder.onstop = () => {
        this.stopRecognition();
        // Final recognition events may arrive just after stop; freeze only after this short drain.
        setTimeout(() => {
          this.events.stopped(this.snapshot());
          this.cleanup();
        }, 180);
      };
      recorder.onerror = () => this.interrupt();
      stream
        .getAudioTracks()
        .forEach((track) =>
          track.addEventListener("ended", () => this.interrupt()),
        );
      try {
        this.context = new AudioContext();
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 256;
        this.context.createMediaStreamSource(stream).connect(this.analyser);
        await this.context.resume();
      } catch {
        this.analyser = null;
      }
      this.state = "recording";
      this.started = performance.now();
      recorder.start(1000);
      this.startRecognition();
      const samples = new Uint8Array(256);
      this.timer = setInterval(() => {
        let level = 0;
        if (this.analyser && this.state === "recording") {
          this.analyser.getByteTimeDomainData(samples);
          level = Math.sqrt(
            samples.reduce(
              (sum, sample) => sum + ((sample - 128) / 128) ** 2,
              0,
            ) / samples.length,
          );
        }
        this.events.tick(this.milliseconds(), level);
      }, 100);
      document.addEventListener("visibilitychange", this.onVisibility);
      window.addEventListener("pagehide", this.onPageHide);
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }
  private startRecognition(): void {
    const browser = window as typeof window & {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };
    const Constructor =
      browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor) {
      this.events.recognitionUnavailable();
      return;
    }
    const recognition = new Constructor();
    this.recognition = recognition;
    const prefix = this.raw;
    const generation = ++this.recognitionGeneration;
    recognition.lang = this.language === "de" ? "de-DE" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      if (this.disposed || generation !== this.recognitionGeneration) return;
      // Rebuild the current recognition segment to avoid duplicates from repeated result events.
      const final: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal) final.push(result[0].transcript);
      }
      this.raw = [prefix, ...final].filter(Boolean).join(" ").trim();
      this.source = "browser-asr";
    };
    recognition.onerror = ({ error }) => {
      if (error !== "no-speech" && error !== "aborted")
        this.events.recognitionUnavailable();
    };
    recognition.onend = () => {
      if (this.recognition === recognition) this.recognition = null;
    };
    try {
      recognition.start();
    } catch {
      this.events.recognitionUnavailable();
    }
  }
  private stopRecognition(): void {
    try {
      this.recognition?.stop();
    } catch {
      /* Recognition may have ended itself. */
    }
    this.recognition = null;
  }
  pause(): void {
    if (this.state !== "recording" || this.recorder?.state !== "recording")
      return;
    this.elapsed = this.milliseconds();
    this.state = "paused";
    this.recorder.requestData();
    this.recorder.pause();
    this.stopRecognition();
  }
  resume(): void {
    if (this.state !== "paused" || this.recorder?.state !== "paused") return;
    this.state = "recording";
    this.started = performance.now();
    this.recorder.resume();
    this.startRecognition();
  }
  stop(): void {
    if (this.state !== "recording" && this.state !== "paused") return;
    this.elapsed = this.milliseconds();
    this.state = "stopped";
    this.stopRecognition();
    if (this.recorder?.state !== "inactive") this.recorder?.stop();
  }
  private interrupt(): void {
    if (this.state === "stopped" || this.state === "interrupted") return;
    this.stop();
    this.state = "interrupted";
    this.events.interrupted();
  }
  private onVisibility = () => {
    if (document.hidden && this.state === "recording") {
      this.pause();
      this.events.interrupted();
    }
  };
  private onPageHide = () => this.interrupt();
  dispose(): void {
    this.disposed = true;
    this.interrupt();
    this.cleanup();
  }
  private cleanup(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.stopRecognition();
    void this.context?.close().catch(() => undefined);
    this.context = null;
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("pagehide", this.onPageHide);
  }
}
