"use client";

import { useEffect, useRef, useState } from "react";
import {
  parsePronunciationObservation,
  type PronunciationObservation,
} from "@automaticity/learning-core/pronunciation-assessment";
import {
  matchesPronunciationRequest,
  preparePronunciationAudio,
  pronunciationFitsRecording,
  recordingDownloadName,
  wordReplayRange,
} from "./pronunciation-audio";

type Availability = "checking" | "available" | "unavailable";

export function PronunciationResult({
  observation,
  onReplay,
}: {
  readonly observation: PronunciationObservation;
  readonly onReplay: (start: number, duration: number) => void;
}) {
  return (
    <section aria-label="Acoustic observations">
      <h4>Sounds in your recording</h4>
      <p role="status">
        Audio observations are ready. Review the sounds below.
      </p>
      <p>
        These are model observations from Microsoft Azure Speech, not a verified
        pronunciation grade. Listen to the original with your teacher; a
        different sound is not automatically an error.
      </p>
      <p>Recognized spelling: {observation.recognizedText}</p>
      <p>Spelling can stay the same even when the sounds differ.</p>
      {!observation.spokenPhonemesAvailable && (
        <p>
          This service does not provide named likely spoken sounds for the
          selected English variant. No phoneme diagnosis is available. Your
          variant has not been changed.
        </p>
      )}
      {observation.words.map((word, index) => (
        <div
          key={`${index}:${word.offsetSeconds}`}
          style={{ marginBlock: "1rem" }}
        >
          <b>{word.word}</b>{" "}
          <button
            type="button"
            onClick={() => onReplay(word.offsetSeconds, word.durationSeconds)}
          >
            Replay this word
          </button>
          {word.phonemes.length > 0 && (
            <table
              style={{
                width: "100%",
                tableLayout: "fixed",
                overflowWrap: "anywhere",
              }}
            >
              <thead>
                <tr>
                  <th scope="col">Reference sound</th>
                  <th scope="col">Likely heard (model)</th>
                </tr>
              </thead>
              <tbody>
                {word.phonemes.map((phoneme, phoneIndex) => (
                  <tr key={`${phoneIndex}:${phoneme.offsetSeconds}`}>
                    <td>/{phoneme.expected}/</td>
                    <td>
                      {phoneme.heard ? `/${phoneme.heard}/` : "Not provided"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </section>
  );
}

function PronunciationRequest({
  audioBlob,
  target,
  variant,
  availability,
  recordingBusy,
  onReplay,
}: {
  readonly audioBlob: Blob | null;
  readonly target: string;
  readonly variant: string;
  readonly availability: Availability;
  readonly recordingBusy: boolean;
  readonly onReplay: (start: number, duration: number) => void;
}) {
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [observation, setObservation] =
    useState<PronunciationObservation | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      requestRef.current?.abort();
    },
    [],
  );

  async function checkRecording() {
    if (
      requestRef.current ||
      !consent ||
      !audioBlob ||
      !target.trim() ||
      recordingBusy ||
      availability !== "available"
    )
      return;
    const controller = new AbortController();
    requestRef.current = controller;
    setPending(true);
    setConsent(false);
    setObservation(null);
    setMessage(null);
    const request = { referenceText: target.trim(), variant };
    try {
      const wav = await preparePronunciationAudio(audioBlob);
      if (controller.signal.aborted) return;
      const form = new FormData();
      form.set("audio", wav, "pronunciation.wav");
      form.set("referenceText", request.referenceText);
      form.set("variant", variant);
      form.set("consent", "true");
      const response = await fetch("/api/conversation/pronunciation", {
        method: "POST",
        body: form,
        signal: controller.signal,
        cache: "no-store",
      });
      const raw: unknown = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) {
        const reason =
          typeof raw === "object" &&
          raw !== null &&
          "error" in raw &&
          typeof raw.error === "string"
            ? raw.error
            : "Pronunciation checking is unavailable. No pronunciation result was created.";
        throw new Error(reason);
      }
      const result = parsePronunciationObservation(raw);
      if (
        !matchesPronunciationRequest(result, request) ||
        !pronunciationFitsRecording(result.words, (wav.size - 44) / 32000)
      )
        throw new Error(
          "The response does not match this recording, target or English variant. It was not used.",
        );
      setObservation(result);
    } catch (error) {
      if (!controller.signal.aborted)
        setMessage(
          error instanceof Error
            ? error.message
            : "Pronunciation checking failed. Your recording and transcript are unchanged.",
        );
    } finally {
      if (!controller.signal.aborted) {
        requestRef.current = null;
        setPending(false);
      }
    }
  }

  return (
    <div>
      <label
        style={{
          display: "flex",
          alignItems: "start",
          gap: ".5rem",
          marginBlock: "1rem",
        }}
      >
        <input
          type="checkbox"
          aria-label="Send this recording to Microsoft Azure Speech"
          checked={consent}
          disabled={
            pending ||
            recordingBusy ||
            !audioBlob ||
            availability !== "available"
          }
          onChange={(event) => setConsent(event.target.checked)}
        />
        <span>
          I allow this recording and these target words to be sent to Microsoft
          Azure Speech for this check. This is separate from text checking and
          saving recordings.
        </span>
      </label>
      <button
        type="button"
        className="primary"
        disabled={
          pending ||
          recordingBusy ||
          !audioBlob ||
          !target.trim() ||
          !consent ||
          availability !== "available"
        }
        onClick={() => void checkRecording()}
      >
        {pending
          ? "Checking the recording…"
          : "Check pronunciation from recording"}
      </button>
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
  target,
  variant,
  availability,
}: {
  readonly audioBlob: Blob | null;
  readonly audioUrl: string | null;
  readonly recordingBusy: boolean;
  readonly target: string;
  readonly variant: string;
  readonly availability: Availability;
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
      setPlaybackMessage("Use the recording player to listen to this word.");
      return;
    }
    setPlaybackMessage(null);
    stopAtRef.current = range.end;
    seekTargetRef.current = range.start;
    audio.currentTime = seekTargetRef.current;
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
              ) {
                seekTargetRef.current = null;
              } else {
                clearWordBoundary();
              }
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
      <PronunciationRequest
        audioBlob={audioBlob}
        target={target}
        variant={variant}
        availability={availability}
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
  const [availability, setAvailability] = useState<Availability>("checking");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/conversation/pronunciation", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const raw: unknown = await response.json();
        if (controller.signal.aborted) return;
        const available =
          response.ok &&
          typeof raw === "object" &&
          raw !== null &&
          "available" in raw &&
          raw.available === true &&
          "provider" in raw &&
          raw.provider === "Microsoft Azure Speech" &&
          "supportedVariants" in raw &&
          Array.isArray(raw.supportedVariants) &&
          raw.supportedVariants.includes(variant);
        setAvailability(available ? "available" : "unavailable");
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailability("unavailable");
      });
    return () => controller.abort();
  }, [variant]);

  return (
    <section
      className="record-card speech-practice"
      aria-label="Pronunciation from recording"
    >
      <div className="record-main" style={{ minWidth: 0 }}>
        <h3>Pronunciation from recording</h3>
        <p>
          Speech recognition guesses words and can hide sound differences. This
          check uses the recording itself. Record a short phrase of up to 30
          seconds.
        </p>
        <p role="status">
          {availability === "checking"
            ? "Checking audio-service availability…"
            : availability === "available"
              ? "Audio checking is available. Nothing is sent until you give permission and press the button."
              : "Audio pronunciation checking is not switched on yet. No pronunciation result is available. You can download the original recording for your teacher."}
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
          Enter the intended words yourself, including repetitions. This field
          is never filled from the recognized transcript. Selected variant:{" "}
          {variant}.
        </p>
        {variant === "en-GB" && (
          <p>
            Named likely spoken sounds are unavailable for British English with
            this service. Your selected variant is preserved.
          </p>
        )}
        <PronunciationRecording
          key={`${recordingVersion}:${audioUrl ?? ""}:${variant}:${target}`}
          audioBlob={audioBlob}
          audioUrl={audioUrl}
          target={target}
          variant={variant}
          availability={availability}
          recordingBusy={recordingBusy}
        />
      </div>
    </section>
  );
}
