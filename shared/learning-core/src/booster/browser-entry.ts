import {
  createBoosterAttemptId,
  createBoosterPlan,
  isBoosterModeEnabled,
  readBoosterFeatureFlags,
  saveBoosterAttempt,
  scoreBoosterAttempt,
} from "./booster";
import { BOOSTER_COPY } from "./copy";
import type {
  BoosterAttemptResultV1,
  BoosterCopy,
  BoosterInputMode,
  BoosterPlanV1,
} from "./types";

const AUDIO_DATABASE = "automaticity-booster-audio-v1";
const AUDIO_STORE = "recordings";

export interface BrowserBoosterContext {
  readonly targetStructureId: string;
  readonly targetStructureLabel: string;
  readonly sessionMinutes: number;
  readonly automatizationMinutes: number;
  readonly targetPatterns: readonly string[];
}

export interface BrowserBoosterConfig extends BrowserBoosterContext {
  readonly root: HTMLElement;
  readonly language: "en" | "de";
  readonly onActiveChange?: (active: boolean) => void;
  readonly onFinish?: () => void;
}

export interface BrowserBoosterController {
  readonly active: boolean;
  readonly plan: BoosterPlanV1 | null;
  refresh(context: BrowserBoosterContext): void;
  destroy(): void;
}

function countWords(value: string): number {
  return value.trim().match(/[\p{L}\p{N}'’-]+/gu)?.length ?? 0;
}

export function countCompleteProductions(value: string): number {
  return value.split(/[.!?\n]+/u).filter((segment) => countWords(segment) >= 3)
    .length;
}

export function countValidatedStructureUses(
  value: string,
  patternSources: readonly string[],
): number {
  if (patternSources.length === 0) return 0;
  return value
    .split(/[.!?\n]+/u)
    .filter((segment) => countWords(segment) >= 4)
    .reduce((total, segment) => {
      const matched = patternSources.some((source) => {
        try {
          return new RegExp(source, "iu").test(segment);
        } catch {
          return false;
        }
      });
      return total + (matched ? 1 : 0);
    }, 0);
}

function saveAudio(attemptId: string, audio: Blob): Promise<boolean> {
  if (!("indexedDB" in globalThis) || audio.size === 0) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const request = indexedDB.open(AUDIO_DATABASE, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(AUDIO_STORE)) {
        database.createObjectStore(AUDIO_STORE, { keyPath: "attemptId" });
      }
    };
    request.onerror = () => resolve(false);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction(AUDIO_STORE, "readwrite");
      transaction.objectStore(AUDIO_STORE).put({
        attemptId,
        audio,
        mimeType: audio.type,
        savedAt: new Date().toISOString(),
      });
      transaction.oncomplete = () => {
        database.close();
        resolve(true);
      };
      transaction.onerror = () => {
        database.close();
        resolve(false);
      };
    };
  });
}

function styles(): string {
  return `
    :host{display:block;margin:0 0 22px;color:#15112d;font-family:Inter,"Segoe UI",sans-serif}
    *{box-sizing:border-box}.card{border:1px solid #ddd4f0;border-radius:20px;background:linear-gradient(145deg,#fff 0%,#fbf9ff 100%);padding:clamp(18px,3vw,30px);box-shadow:0 16px 42px rgba(62,35,119,.09)}
    .eyebrow{margin:0 0 6px;color:#6134c7;font-size:.78rem;font-weight:850;letter-spacing:.05em;text-transform:uppercase}.head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.head h2{margin:0;font-size:clamp(1.3rem,3vw,2rem);line-height:1.2}.purpose{max-width:70ch;margin:10px 0 0;color:#5d5672;line-height:1.6}
    .badge{flex:0 0 auto;border-radius:999px;background:#eee7ff;padding:8px 12px;color:#5530b3;font-weight:800;white-space:nowrap}.progress{height:8px;margin:22px 0;border-radius:999px;background:#ece8f4;overflow:hidden}.progress span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#6f3fd4,#8f65e5);transition:width .25s ease}
    .prompt{border:1px solid #e4dcf3;border-radius:16px;background:#fff;padding:18px}.prompt small{color:#655b78;font-weight:750}.prompt h3{margin:8px 0 0;font-size:1.1rem;line-height:1.55}.mode{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0}.mode button,.actions button{min-height:44px;border:1px solid #d8cfeb;border-radius:12px;background:#fff;padding:10px 15px;color:#2f2450;font:inherit;font-weight:800;cursor:pointer}.mode button[aria-pressed=true],.actions .primary{border-color:#6436c7;background:#6436c7;color:#fff}.mode button:focus-visible,.actions button:focus-visible,textarea:focus-visible{outline:3px solid #b99aff;outline-offset:2px}
    .recorder{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;border:1px solid #e2dbef;border-radius:15px;background:#f8f5ff;padding:14px}.record-button{width:54px;height:54px;border:0;border-radius:50%;background:#6436c7;color:#fff;font-size:1.25rem;cursor:pointer}.record-button[data-recording=true]{background:#c43c55}.record-meta{display:grid;gap:3px}.record-meta b{font-variant-numeric:tabular-nums}.record-meta span{color:#655d73;font-size:.9rem}.audio{width:100%;margin-top:12px}
    label{display:grid;gap:7px;margin-top:16px;font-weight:800}textarea{width:100%;min-height:112px;resize:vertical;border:1px solid #d8cfeb;border-radius:13px;background:#fff;padding:13px;color:#171128;font:inherit;line-height:1.55}.hint{margin:8px 0 0;color:#6b637a;font-size:.84rem}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.actions button[disabled]{opacity:.45;cursor:not-allowed}
    .result{margin-top:18px;border:1px solid #d7ebdf;border-radius:15px;background:#f5fbf7;padding:15px}.result[hidden]{display:none}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:12px}.metric{border-radius:11px;background:#fff;padding:10px}.metric b{display:block;font-size:1.05rem}.metric span{display:block;color:#645e70;font-size:.75rem;line-height:1.35}.boundary{margin:12px 0 0;color:#6a3150;font-size:.85rem;font-weight:750}.status{min-height:1.5em;margin:12px 0 0;color:#4f4760}.finish{margin-top:18px;padding-top:14px;border-top:1px solid #e5deef}
    @media(max-width:650px){.card{border-radius:16px;padding:16px}.head{display:grid}.badge{justify-self:start}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.actions button{flex:1 1 100%}.recorder{grid-template-columns:auto minmax(0,1fr)}}
    @media(prefers-reduced-motion:reduce){.progress span{transition:none}}
  `;
}

function formatMilliseconds(value: number): string {
  return `${(value / 1_000).toFixed(1)}s`;
}

function renderMetrics(
  container: HTMLElement,
  result: BoosterAttemptResultV1,
  copy: BoosterCopy,
): void {
  container.hidden = false;
  if (!result.metrics) {
    container.replaceChildren(
      Object.assign(document.createElement("p"), {
        textContent: copy.noEvidence,
      }),
    );
    return;
  }
  const rows: readonly [string, string][] = [
    [`${result.metrics.validatedStructureUses}`, copy.metrics.structure],
    [`${result.metrics.productionCount}`, copy.metrics.productions],
    [
      formatMilliseconds(result.metrics.firstProductionLatencyMs),
      copy.metrics.latency,
    ],
    [`${result.metrics.wordsPerMinute} WPM`, copy.metrics.wordsPerMinute],
  ];
  const grid = document.createElement("div");
  grid.className = "metrics";
  for (const [value, label] of rows) {
    const metric = document.createElement("div");
    metric.className = "metric";
    const strong = document.createElement("b");
    strong.textContent = value;
    const span = document.createElement("span");
    span.textContent = label;
    metric.append(strong, span);
    grid.append(metric);
  }
  const summary = document.createElement("p");
  summary.textContent = `${copy.saved} Composite ${result.metrics.composite.toFixed(2)} / 1.00.`;
  const boundary = document.createElement("p");
  boundary.className = "boundary";
  boundary.textContent = copy.practiceOnly;
  container.replaceChildren(summary, grid, boundary);
}

export function mountForcedOutputBooster(
  config: BrowserBoosterConfig,
): BrowserBoosterController {
  const requested =
    new URLSearchParams(location.search).get("mode") === "booster";
  const enabled = isBoosterModeEnabled(readBoosterFeatureFlags(localStorage));
  const active = requested && enabled;
  if (!active) {
    config.root.hidden = true;
    config.onActiveChange?.(false);
    return {
      active: false,
      plan: null,
      refresh() {},
      destroy() {},
    };
  }

  const copy = BOOSTER_COPY[config.language];
  const shadow =
    config.root.shadowRoot ?? config.root.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles();
  const card = document.createElement("section");
  card.className = "card";
  card.setAttribute("aria-labelledby", "booster-title");
  card.innerHTML = `
    <div class="head"><div><p class="eyebrow"></p><h2 id="booster-title"></h2><p class="purpose"></p></div><span class="badge"></span></div>
    <div class="progress" aria-hidden="true"><span></span></div>
    <article class="prompt"><small></small><h3></h3></article>
    <div class="mode" role="group"><button type="button" data-mode="speaking"></button><button type="button" data-mode="typing"></button></div>
    <div class="recorder"><button class="record-button" type="button" aria-label=""></button><div class="record-meta"><b>0:00</b><span></span></div></div>
    <audio class="audio" controls hidden></audio>
    <label><span></span><textarea dir="ltr"></textarea></label>
    <p class="hint"></p>
    <div class="actions"><button class="primary" type="button" data-action="submit"></button><button type="button" data-action="next" hidden></button></div>
    <div class="result" aria-live="polite" role="status" hidden></div>
    <p class="status" aria-live="polite" role="status"></p>
    <div class="finish"><button type="button" data-action="finish"></button></div>`;
  shadow.replaceChildren(style, card);
  config.root.hidden = false;
  config.root.setAttribute("dir", copy.direction);
  config.root.dataset.boosterActive = "true";

  const query = <T extends Element>(selector: string): T => {
    const element = shadow.querySelector<T>(selector);
    if (!element) throw new Error(`Missing booster element: ${selector}`);
    return element;
  };
  query<HTMLElement>(".eyebrow").textContent = copy.eyebrow;
  query<HTMLElement>("#booster-title").textContent = copy.title;
  query<HTMLElement>(".purpose").textContent = copy.purpose;
  query<HTMLButtonElement>("[data-mode=speaking]").textContent = copy.speak;
  query<HTMLButtonElement>("[data-mode=typing]").textContent = copy.typeInstead;
  query<HTMLTextAreaElement>("textarea").placeholder = copy.responsePlaceholder;
  query<HTMLElement>("label span").textContent = copy.responseLabel;
  query<HTMLButtonElement>("[data-action=submit]").textContent = copy.submit;
  query<HTMLButtonElement>("[data-action=next]").textContent = copy.next;
  query<HTMLButtonElement>("[data-action=finish]").textContent = copy.finish;
  query<HTMLElement>(".hint").textContent = copy.practiceOnly;

  let context: BrowserBoosterContext = config;
  let plan = createBoosterPlan({
    language: config.language,
    ...context,
    prompts: copy.prompts,
  });
  let roundIndex = 0;
  let inputMode: BoosterInputMode = "speaking";
  let startedAt = new Date();
  let firstProductionAt: Date | null = null;
  let completedAt: Date | null = null;
  let audioBytes = 0;
  let audioBlob: Blob | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let mediaStream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let animationFrame = 0;
  let countdownTimer = 0;
  let automaticStopTimer = 0;
  let elapsedSeconds = 0;
  let audioUrl = "";
  let destroyed = false;

  const status = query<HTMLElement>(".status");
  const resultBox = query<HTMLElement>(".result");
  const textarea = query<HTMLTextAreaElement>("textarea");
  const recorderBox = query<HTMLElement>(".recorder");
  const recordButton = query<HTMLButtonElement>(".record-button");
  const audio = query<HTMLAudioElement>("audio");
  const nextButton = query<HTMLButtonElement>("[data-action=next]");
  const submitButton = query<HTMLButtonElement>("[data-action=submit]");

  function cleanRecording(): void {
    window.clearInterval(countdownTimer);
    window.clearTimeout(automaticStopTimer);
    cancelAnimationFrame(animationFrame);
    mediaStream?.getTracks().forEach((track) => track.stop());
    mediaStream = null;
    void audioContext?.close();
    audioContext = null;
    mediaRecorder = null;
  }

  function resetAttempt(): void {
    cleanRecording();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = "";
    audio.hidden = true;
    audio.removeAttribute("src");
    textarea.value = "";
    inputMode = "speaking";
    startedAt = new Date();
    firstProductionAt = null;
    completedAt = null;
    audioBytes = 0;
    audioBlob = null;
    elapsedSeconds = 0;
    resultBox.hidden = true;
    resultBox.replaceChildren();
    nextButton.hidden = true;
    submitButton.disabled = false;
    status.textContent = "";
    recordButton.dataset.recording = "false";
    recordButton.textContent = "●";
    recordButton.setAttribute("aria-label", copy.startRecording);
    query<HTMLElement>(".record-meta b").textContent = "0:00";
    query<HTMLElement>(".record-meta span").textContent = copy.startRecording;
    setMode("speaking");
  }

  function renderRound(): void {
    resetAttempt();
    const round = plan.rounds[roundIndex]!;
    query<HTMLElement>(".badge").textContent =
      `${copy.round} ${roundIndex + 1} ${copy.of} ${plan.rounds.length}`;
    query<HTMLElement>(".prompt small").textContent =
      `${plan.targetStructureLabel} · ${round.durationSeconds} ${copy.seconds}`;
    query<HTMLElement>(".prompt h3").textContent = round.prompt;
    query<HTMLElement>(".progress span").style.width =
      `${((roundIndex + 1) / plan.rounds.length) * 100}%`;
    nextButton.textContent =
      roundIndex === plan.rounds.length - 1 ? copy.finish : copy.next;
  }

  function setMode(mode: BoosterInputMode): void {
    inputMode = mode;
    startedAt = new Date();
    firstProductionAt = null;
    completedAt = null;
    for (const button of shadow.querySelectorAll<HTMLButtonElement>(
      "[data-mode]",
    )) {
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
    }
    recorderBox.hidden = mode !== "speaking";
    audio.hidden = mode !== "speaking" || !audioUrl;
    if (mode === "typing") {
      cleanRecording();
      status.textContent = copy.typeInstead;
      textarea.focus();
    }
  }

  function updateTimer(): void {
    const round = plan.rounds[roundIndex]!;
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = String(elapsedSeconds % 60).padStart(2, "0");
    query<HTMLElement>(".record-meta b").textContent =
      `${minutes}:${seconds} / ${round.durationSeconds}s`;
  }

  async function stopRecording(): Promise<void> {
    if (!mediaRecorder || mediaRecorder.state === "inactive") return;
    const recorder = mediaRecorder;
    const stopped = new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
    });
    recorder.stop();
    completedAt = new Date();
    recordButton.dataset.recording = "false";
    recordButton.textContent = "●";
    recordButton.setAttribute("aria-label", copy.startRecording);
    query<HTMLElement>(".record-meta span").textContent = copy.recordingReady;
    window.clearInterval(countdownTimer);
    window.clearTimeout(automaticStopTimer);
    await stopped;
  }

  async function startRecording(): Promise<void> {
    if (mediaRecorder?.state === "recording") {
      await stopRecording();
      return;
    }
    if (
      !navigator.mediaDevices?.getUserMedia ||
      !("MediaRecorder" in globalThis)
    ) {
      status.textContent = copy.microphoneUnavailable;
      setMode("typing");
      return;
    }
    try {
      const chunks: BlobPart[] = [];
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(mediaStream);
      startedAt = new Date();
      firstProductionAt = null;
      completedAt = null;
      elapsedSeconds = 0;
      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      });
      mediaRecorder.addEventListener("stop", () => {
        audioBlob = new Blob(chunks, {
          type: mediaRecorder?.mimeType || "audio/webm",
        });
        audioBytes = audioBlob.size;
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        audioUrl = URL.createObjectURL(audioBlob);
        audio.src = audioUrl;
        audio.hidden = false;
        cleanRecording();
      });
      const Context = globalThis.AudioContext;
      audioContext = new Context();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1_024;
      audioContext.createMediaStreamSource(mediaStream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      const detectVoice = () => {
        analyser.getByteTimeDomainData(samples);
        let energy = 0;
        for (const sample of samples) {
          const normalized = (sample - 128) / 128;
          energy += normalized * normalized;
        }
        if (!firstProductionAt && Math.sqrt(energy / samples.length) > 0.03) {
          firstProductionAt = new Date();
        }
        if (mediaRecorder?.state === "recording") {
          animationFrame = requestAnimationFrame(detectVoice);
        }
      };
      mediaRecorder.start(250);
      detectVoice();
      recordButton.dataset.recording = "true";
      recordButton.textContent = "■";
      recordButton.setAttribute("aria-label", copy.stopRecording);
      query<HTMLElement>(".record-meta span").textContent = copy.stopRecording;
      countdownTimer = window.setInterval(() => {
        elapsedSeconds += 1;
        updateTimer();
      }, 1_000);
      automaticStopTimer = window.setTimeout(
        () => void stopRecording(),
        plan.rounds[roundIndex]!.durationSeconds * 1_000,
      );
    } catch {
      cleanRecording();
      status.textContent = copy.microphoneUnavailable;
      setMode("typing");
    }
  }

  async function submit(): Promise<void> {
    if (mediaRecorder?.state === "recording") await stopRecording();
    const responseText = textarea.value.trim();
    completedAt ??= new Date();
    const round = plan.rounds[roundIndex]!;
    const attemptId = createBoosterAttemptId({
      planId: plan.id,
      roundId: round.id,
      startedAt,
    });
    const result = scoreBoosterAttempt({
      attemptId,
      planId: plan.id,
      round,
      targetStructureId: plan.targetStructureId,
      inputMode,
      status: "completed",
      startedAt,
      firstProductionAt,
      completedAt,
      responseText,
      audioBytes,
      validatedStructureUses: countValidatedStructureUses(
        responseText,
        context.targetPatterns,
      ),
      productionCount: countCompleteProductions(responseText),
    });
    let saved = false;
    try {
      saveBoosterAttempt(localStorage, result);
      saved = true;
    } catch {
      saved = false;
    }
    if (result.speakingEvidence && audioBlob) {
      saved = (await saveAudio(attemptId, audioBlob)) && saved;
    }
    renderMetrics(resultBox, result, copy);
    status.textContent =
      result.status === "no-evidence"
        ? copy.noEvidence
        : saved
          ? copy.saved
          : copy.notSaved;
    submitButton.disabled = true;
    nextButton.hidden = false;
  }

  for (const button of shadow.querySelectorAll<HTMLButtonElement>(
    "[data-mode]",
  )) {
    button.addEventListener("click", () =>
      setMode(button.dataset.mode === "typing" ? "typing" : "speaking"),
    );
  }
  recordButton.addEventListener("click", () => void startRecording());
  textarea.addEventListener("input", () => {
    if (!firstProductionAt && textarea.value.trim()) {
      firstProductionAt = new Date();
    }
  });
  submitButton.addEventListener("click", () => void submit());
  nextButton.addEventListener("click", () => {
    if (roundIndex < plan.rounds.length - 1) {
      roundIndex += 1;
      renderRound();
      return;
    }
    config.onFinish?.();
  });
  query<HTMLButtonElement>("[data-action=finish]").addEventListener(
    "click",
    () => config.onFinish?.(),
  );

  renderRound();
  config.onActiveChange?.(true);
  return {
    active: true,
    get plan() {
      return plan;
    },
    refresh(nextContext) {
      if (destroyed) return;
      context = nextContext;
      plan = createBoosterPlan({
        language: config.language,
        ...nextContext,
        prompts: copy.prompts,
      });
      roundIndex = 0;
      renderRound();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cleanRecording();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      shadow.replaceChildren();
      config.root.hidden = true;
      config.root.removeAttribute("data-booster-active");
      config.onActiveChange?.(false);
    },
  };
}

const browserAdapter = Object.freeze({
  countCompleteProductions,
  countValidatedStructureUses,
  createBoosterPlan,
  isBoosterModeEnabled,
  mountForcedOutputBooster,
  readBoosterFeatureFlags,
  scoreBoosterAttempt,
});

Object.defineProperty(globalThis, "AutomaticityForcedOutputBooster", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: browserAdapter,
});

export {
  createBoosterPlan,
  isBoosterModeEnabled,
  readBoosterFeatureFlags,
  scoreBoosterAttempt,
};
