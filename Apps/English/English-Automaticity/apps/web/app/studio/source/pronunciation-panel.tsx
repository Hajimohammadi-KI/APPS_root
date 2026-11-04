"use client";

import { useEffect, useRef, useState } from "react";
import {
  parseLocalPronunciationObservation,
  type LocalPronunciationObservation,
} from "@automaticity/learning-core/pronunciation-assessment";
import {
  preparePronunciationSamples,
  recordingDownloadName,
  wordReplayRange,
  matchesLocalRecordingDuration,
} from "./pronunciation-audio";
import {
  LOCAL_MODEL_ANALYSIS_TIMEOUT_MS,
  LOCAL_MODEL_LOAD_TIMEOUT_MS,
  startLocalModelDeadline,
} from "./local-model-deadline";

type ModelState = "unloaded" | "loading" | "ready" | "analysing";

export function PronunciationResult({
  observation,
  onReplay,
}: {
  readonly observation: LocalPronunciationObservation;
  readonly onReplay: (start: number, duration: number) => void;
}) {
  return (
    <section aria-label="Acoustic observations">
      <h4>Sounds estimated from your recording</h4>
      <p role="status">
        Local sound estimates are ready. Listen to the original recording to
        review them.
      </p>
      <p>
        This experimental model estimates sounds directly from audio. It can
        make mistakes and does not verify pronunciation, accent or mastery.
      </p>
      <p style={{ overflowWrap: "anywhere", fontSize: "1.25rem" }}>
        /{observation.phonemes.join(" ")}/
      </p>
      <p>
        The model received only your audio samples. It did not receive the
        intended words or your transcript.
      </p>
      <ul style={{ paddingInlineStart: "1.5rem" }}>
        {observation.spans.map((span, index) => (
          <li key={`${index}:${span.startMs}`} style={{ marginBlock: ".4rem" }}>
            /{span.phoneme}/{" "}
            <button
              type="button"
              onClick={() =>
                onReplay(
                  span.startMs / 1000,
                  (span.endMs - span.startMs) / 1000,
                )
              }
            >
              Replay this sound
            </button>
          </li>
        ))}
      </ul>
      <p>
        Timing is approximate. Review unclear sounds with your teacher using the
        original audio.
      </p>
    </section>
  );
}

function LocalSoundAnalysis({
  audioBlob,
  recordingBusy,
  onReplay,
}: {
  readonly audioBlob: Blob | null;
  readonly recordingBusy: boolean;
  readonly onReplay: (start: number, duration: number) => void;
}) {
  const [modelState, setModelState] = useState<ModelState>("unloaded");
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [observation, setObservation] =
    useState<LocalPronunciationObservation | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const serialRef = useRef(0);
  const cancelDeadlineRef = useRef<(() => void) | null>(null);
  const activeRef = useRef<{
    id: string;
    phase: "load" | "analyse";
    durationMs?: number;
  } | null>(null);

  useEffect(
    () => () => {
      activeRef.current = null;
      cancelDeadlineRef.current?.();
      workerRef.current?.terminate();
    },
    [],
  );

  function stopModel(reason: string) {
    cancelDeadlineRef.current?.();
    cancelDeadlineRef.current = null;
    activeRef.current = null;
    workerRef.current?.terminate();
    workerRef.current = null;
    setModelState("unloaded");
    setProgress(null);
    setObservation(null);
    setMessage(reason);
  }

  function armDeadline(id: string, phase: "load" | "analyse") {
    cancelDeadlineRef.current?.();
    cancelDeadlineRef.current = startLocalModelDeadline(
      phase === "load"
        ? LOCAL_MODEL_LOAD_TIMEOUT_MS
        : LOCAL_MODEL_ANALYSIS_TIMEOUT_MS,
      () => {
        if (activeRef.current?.id !== id) return;
        stopModel(
          phase === "load"
            ? "Loading the local model took too long. Try loading it again. Your recording and transcript are unchanged."
            : "Local sound analysis took too long and was stopped. Try a shorter recording. Your recording and transcript are unchanged.",
        );
      },
    );
  }

  function loadModel() {
    if (workerRef.current || !audioBlob || recordingBusy) return;
    if (typeof Worker === "undefined") {
      setMessage(
        "This browser cannot run the local sound model. Download the recording for your teacher.",
      );
      return;
    }
    const id = String(++serialRef.current);
    activeRef.current = { id, phase: "load" };
    armDeadline(id, "load");
    setModelState("loading");
    setProgress(null);
    setMessage(null);
    try {
      const worker = new Worker(
        "/learning-core/local-pronunciation-worker.js",
        { type: "module" },
      );
      workerRef.current = worker;
      worker.onmessage = (event: MessageEvent<unknown>) => {
        if (workerRef.current !== worker) return;
        const raw = event.data;
        if (
          !raw ||
          typeof raw !== "object" ||
          !("requestId" in raw) ||
          !("type" in raw) ||
          raw.requestId !== activeRef.current?.id
        )
          return;
        if (raw.type === "progress") {
          if (
            "loadedBytes" in raw &&
            "totalBytes" in raw &&
            typeof raw.loadedBytes === "number" &&
            typeof raw.totalBytes === "number" &&
            Number.isFinite(raw.loadedBytes) &&
            Number.isFinite(raw.totalBytes) &&
            raw.totalBytes > 0
          ) {
            setProgress(
              Math.max(
                0,
                Math.min(
                  100,
                  Math.round((raw.loadedBytes / raw.totalBytes) * 100),
                ),
              ),
            );
          }
        } else if (
          raw.type === "ready" &&
          activeRef.current?.phase === "load"
        ) {
          activeRef.current = null;
          cancelDeadlineRef.current?.();
          cancelDeadlineRef.current = null;
          setModelState("ready");
          setProgress(null);
          setMessage(
            "The local model is ready. Your audio stays on this device.",
          );
        } else if (
          raw.type === "result" &&
          activeRef.current?.phase === "analyse" &&
          "result" in raw
        ) {
          try {
            const result = parseLocalPronunciationObservation(raw.result);
            if (
              typeof activeRef.current.durationMs !== "number" ||
              !matchesLocalRecordingDuration(
                result.durationMs,
                activeRef.current.durationMs * 16,
              )
            )
              throw new Error(
                "The local result does not match this recording.",
              );
            setObservation(result);
            activeRef.current = null;
            cancelDeadlineRef.current?.();
            cancelDeadlineRef.current = null;
            setModelState("ready");
            setProgress(null);
            setMessage(null);
          } catch {
            stopModel(
              "The local model returned unusable sound estimates. No pronunciation result was created.",
            );
          }
        } else if (raw.type === "error") {
          const reason =
            "error" in raw && typeof raw.error === "string"
              ? raw.error.slice(0, 300)
              : "The local model could not analyze this recording.";
          stopModel(reason);
        }
      };
      worker.onerror = () => {
        if (workerRef.current === worker)
          stopModel(
            "The local speech model could not run. Check the download or try another browser; your recording is unchanged.",
          );
      };
      worker.postMessage({ type: "load", requestId: id });
    } catch {
      stopModel("The local speech model could not start in this browser.");
    }
  }

  async function analyse() {
    const worker = workerRef.current;
    if (
      !worker ||
      modelState !== "ready" ||
      !audioBlob ||
      recordingBusy ||
      activeRef.current
    )
      return;
    const id = String(++serialRef.current);
    activeRef.current = { id, phase: "analyse" };
    armDeadline(id, "analyse");
    setModelState("analysing");
    setMessage(null);
    setProgress(null);
    setObservation(null);
    try {
      const samples = await preparePronunciationSamples(audioBlob);
      if (workerRef.current !== worker || activeRef.current?.id !== id) return;
      activeRef.current = {
        id,
        phase: "analyse",
        durationMs: samples.length / 16,
      };
      worker.postMessage(
        { type: "analyse", requestId: id, samples, sampleRate: 16000 },
        [samples.buffer],
      );
    } catch (error) {
      if (workerRef.current !== worker || activeRef.current?.id !== id) return;
      activeRef.current = null;
      cancelDeadlineRef.current?.();
      cancelDeadlineRef.current = null;
      setModelState("ready");
      setMessage(
        error instanceof Error
          ? error.message
          : "The recording could not be prepared for local analysis.",
      );
    }
  }

  const busy = modelState === "loading" || modelState === "analysing";
  return (
    <div>
      <p>
        Record first, then load the model. The first download is about 5 MB;
        model files are cached for offline reuse. Audio is processed on this
        device and is never uploaded.
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: ".5rem",
          marginBlock: ".75rem",
        }}
      >
        <button
          type="button"
          disabled={!audioBlob || recordingBusy || modelState !== "unloaded"}
          onClick={loadModel}
        >
          Load local speech model
        </button>
        <button
          type="button"
          className="primary"
          disabled={!audioBlob || recordingBusy || modelState !== "ready"}
          onClick={() => void analyse()}
        >
          Analyze sounds on this device
        </button>
        {busy && (
          <button
            type="button"
            onClick={() =>
              stopModel(
                "Local analysis was cancelled. Your recording is unchanged.",
              )
            }
          >
            Cancel local analysis
          </button>
        )}
      </div>
      {busy && (
        <p role="status">
          {modelState === "loading"
            ? "Loading local model"
            : "Analyzing audio on this device"}
          {progress === null ? "…" : ` — ${progress}%`}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {observation && (
        <PronunciationResult observation={observation} onReplay={onReplay} />
      )}
    </div>
  );
}

function PronunciationRecording({
  audioBlob,
  audioUrl,
  recordingBusy,
}: {
  readonly audioBlob: Blob | null;
  readonly audioUrl: string | null;
  readonly recordingBusy: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopAtRef = useRef<number | null>(null);
  const seekTargetRef = useRef<number | null>(null);
  const [playbackMessage, setPlaybackMessage] = useState<string | null>(null);
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);
  function clearWordBoundary() {
    stopAtRef.current = null;
    seekTargetRef.current = null;
  }
  function replayWord(start: number, duration: number) {
    const audio = audioRef.current;
    const range = audio
      ? wordReplayRange(start, duration, audio.duration, audio.readyState)
      : null;
    if (!audio || !range) {
      setPlaybackMessage("Use the recording player to listen to this sound.");
      return;
    }
    setPlaybackMessage(null);
    stopAtRef.current = range.end;
    seekTargetRef.current = range.start;
    audio.currentTime = range.start;
    void audio.play().catch(() => {
      clearWordBoundary();
      setPlaybackMessage("Playback could not start. Use the recording player.");
    });
  }
  return (
    <>
      {audioUrl && audioBlob && !recordingBusy && (
        <>
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            aria-label="Original recording for pronunciation"
            style={{ width: "100%" }}
            onPointerDown={clearWordBoundary}
            onKeyDown={clearWordBoundary}
            onSeeking={() => {
              const audio = audioRef.current;
              if (
                audio &&
                seekTargetRef.current !== null &&
                Math.abs(audio.currentTime - seekTargetRef.current) < 0.02
              )
                seekTargetRef.current = null;
              else clearWordBoundary();
            }}
            onTimeUpdate={() => {
              const audio = audioRef.current;
              if (
                audio &&
                stopAtRef.current !== null &&
                audio.currentTime >= stopAtRef.current
              ) {
                audio.pause();
                clearWordBoundary();
              }
            }}
            onEnded={clearWordBoundary}
          />
          <a href={audioUrl} download={recordingDownloadName(audioBlob.type)}>
            Download original recording
          </a>
          <p>
            The download stays on your device. Send it to your teacher yourself
            if you want a human review.
          </p>
        </>
      )}
      {playbackMessage && <p role="status">{playbackMessage}</p>}
      <LocalSoundAnalysis
        audioBlob={audioBlob}
        recordingBusy={recordingBusy}
        onReplay={replayWord}
      />
    </>
  );
}

export function PronunciationPanel({
  audioBlob,
  audioUrl,
  recordingVersion,
  recordingBusy,
  variant,
}: {
  readonly audioBlob: Blob | null;
  readonly audioUrl: string | null;
  readonly recordingVersion: number;
  readonly recordingBusy: boolean;
  readonly variant: string;
}) {
  const [target, setTarget] = useState("");
  return (
    <section
      className="record-card speech-practice"
      aria-label="Pronunciation from recording"
    >
      <div className="record-main" style={{ minWidth: 0 }}>
        <h3>Pronunciation from recording</h3>
        <p>
          The local model estimates sounds from your recording instead of
          replacing them with a guessed word. Record a short phrase of up to 30
          seconds.
        </p>
        <label style={{ display: "block" }}>
          Words you intended to say
          <input
            value={target}
            maxLength={500}
            onChange={(event) => setTarget(event.target.value)}
            style={{
              display: "block",
              width: "100%",
              boxSizing: "border-box",
              padding: ".7rem",
              marginBlock: ".5rem",
            }}
          />
        </label>
        <p>
          Optional notes for your own comparison. These words are never sent to
          the sound model. Selected practice variant: {variant}; the model does
          not grade your accent.
        </p>
        <PronunciationRecording
          key={`${recordingVersion}:${audioUrl ?? ""}`}
          audioBlob={audioBlob}
          audioUrl={audioUrl}
          recordingBusy={recordingBusy}
        />
      </div>
    </section>
  );
}
