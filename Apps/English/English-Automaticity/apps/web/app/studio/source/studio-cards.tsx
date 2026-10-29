import type { RefObject } from "react";
import { AvaCoachAvatar } from "@/features/components/ava-coach-avatar";
import type {
  ConversationTopic,
  StudioLanguage,
  copy,
} from "./conversation-data";
import {
  formatTime,
  type IntegratedContext,
  type RecordingState,
} from "./studio-helpers";

type StudioCopy = (typeof copy)[StudioLanguage];

export function Icon({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <span className="icon" aria-hidden="true">
      {children}
    </span>
  );
}

export function DailyContextBar({
  activity,
  onPrevious,
  onReturn,
}: Readonly<{ activity: number; onPrevious: () => void; onReturn: () => void }>) {
  return (
    <section className="daily-context-bar" aria-label="Today's practice navigation">
      <button onClick={onPrevious}>← Previous</button>
      <strong>Today’s speaking practice · activity {activity}</strong>
      <button onClick={onReturn}>Return to Today’s Practice</button>
    </section>
  );
}

export function IntegratedContextBar({
  context,
  onReturn,
}: Readonly<{ context: IntegratedContext; onReturn: () => void }>) {
  return (
    <section className="daily-context-bar" aria-label="Integrated Skills navigation">
      <button onClick={onReturn}>← Integrated Skills</button>
      <strong>
        {context.level} · Unit {context.number} · {context.title}
      </strong>
      <button onClick={onReturn}>Return to lesson</button>
    </section>
  );
}

export function StepPicker({
  stepLabels,
  active,
  onSelect,
}: Readonly<{ stepLabels: readonly string[]; active: number; onSelect: (index: number) => void }>) {
  return (
    <details className="studio-step-picker">
      <summary>
        Step {active + 1} / {stepLabels.length} · {stepLabels[active]}
      </summary>
      <div className="steps" aria-label="Practice steps">
        {stepLabels.map((step, index) => (
          <button
            key={step}
            onClick={() => onSelect(index)}
            className={active === index ? "active" : ""}
          >
            <b>{index + 1}</b>
            <Icon>{["♧", "♩", "▷", "▧", "✓", "↗", "▯"][index]}</Icon>
            <span>{step}</span>
          </button>
        ))}
      </div>
    </details>
  );
}

export function CoachCard({
  language,
  selected,
  matchedChunkTexts,
  onSpeak,
}: Readonly<{
  language: StudioLanguage;
  selected: ConversationTopic;
  matchedChunkTexts: ReadonlySet<string>;
  onSpeak: (text: string) => void;
}>) {
  return (
    <div className="coach-card">
      <div className="coach-topic">
        <h2>{selected.topic}</h2>
        <span>
          {selected.level} · {selected.category}
        </span>
      </div>
      <div className="coach-stage">
        <div className="coach-glow">
          <AvaCoachAvatar className="coach-avatar" />
        </div>
        <div className="coach-dialogue">
          <strong>
            Ava ·{" "}
            {language === "de" ? "Deine Sprechtrainerin" : "Your speaking coach"}
          </strong>
          <p>{selected.task}</p>
          <button className="prompt-audio" onClick={() => onSpeak(selected.task)}>
            ▶ {language === "de" ? "Aufgabe anhören" : "Hear prompt"}
          </button>
        </div>
      </div>
      <section className="spoken-chunk-bank" aria-labelledby="spoken-chunk-title">
        <div className="spoken-chunk-heading">
          <div>
            <small>NATURAL SPOKEN ENGLISH</small>
            <h3 id="spoken-chunk-title">Build your answer with chunks</h3>
            <p>
              Choose at least two and adapt the ending to this topic. The
              examples are models, not lines to memorize.
            </p>
          </div>
          <strong aria-live="polite">
            {matchedChunkTexts.size}/{selected.spokenChunks.length} used
          </strong>
        </div>
        <ul className="spoken-chunk-list">
          {selected.spokenChunks.map((chunk) => {
            const used = matchedChunkTexts.has(chunk.text);
            return (
              <li key={chunk.text} data-used={used}>
                <div>
                  <b>{chunk.text}</b>
                  <small>{chunk.purpose}</small>
                  <p>
                    <span>Example:</span> {chunk.example}
                  </p>
                </div>
                <div className="spoken-chunk-actions">
                  <button
                    type="button"
                    onClick={() => onSpeak(chunk.example)}
                    aria-label={`Hear ${chunk.text}`}
                  >
                    ▶ Hear
                  </button>
                  {used && <span>✓ Used</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

export function RecordCard({
  text,
  recordingState,
  audioUrl,
  seconds,
  maxSeconds,
  message,
  voiceRecoveryAvailable,
  transcript,
  interimTranscript,
  evaluating,
  audioRef,
  transcriptRef,
  onContinueTyping,
  onReplay,
  onRecord,
  onPauseOrResume,
  onStop,
  onEvaluate,
  consentNeeded,
  onAllowOnline,
  onTranscriptChange,
}: Readonly<{
  text: StudioCopy;
  recordingState: RecordingState;
  audioUrl: string | null;
  seconds: number;
  maxSeconds: number;
  message: string | null;
  voiceRecoveryAvailable: boolean;
  transcript: string;
  interimTranscript: string;
  evaluating: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  transcriptRef: RefObject<HTMLTextAreaElement | null>;
  onContinueTyping: () => void;
  onReplay: () => void;
  onRecord: () => void;
  onPauseOrResume: () => void;
  onStop: () => void;
  onEvaluate: () => void;
  consentNeeded: boolean;
  onAllowOnline: () => void;
  onTranscriptChange: (value: string) => void;
}>) {
  return (
    <div className="record-card">
      <div
        className={`mic ${recordingState === "recording" ? "recording" : ""}`}
        aria-hidden="true"
      >
        ♩
      </div>
      <div className="record-main">
        <h3>
          {recordingState === "recording"
            ? text.recording
            : audioUrl
              ? text.recorded
              : text.record}
        </h3>
        <strong>
          {formatTime(seconds)} / {formatTime(maxSeconds)}
        </strong>
        <span className="ready">
          {recordingState === "paused"
            ? "Paused"
            : recordingState === "recording"
              ? "Listening"
              : text.ready}
        </span>
        <div
          className={`wave ${recordingState === "recording" ? "live" : ""}`}
          aria-hidden="true"
        >
          {Array.from({ length: 58 }, (_, index) => (
            <i key={index} style={{ height: `${8 + ((index * 17) % 30)}px` }} />
          ))}
        </div>
        {message && (
          <p className="mic-error" role="status">
            {message}
          </p>
        )}
        {voiceRecoveryAvailable && (
          <button className="prompt-audio" onClick={onContinueTyping} type="button">
            Continue by typing
          </button>
        )}
        {audioUrl && (
          <audio
            ref={audioRef}
            className="audio-player"
            src={audioUrl}
            controls
            aria-label="Recorded answer"
          />
        )}
        <div className="record-controls">
          <button onClick={onReplay} disabled={!audioUrl}>
            ♧ Replay
          </button>
          <button onClick={onRecord} disabled={recordingState !== "idle"}>
            <em /> Record
          </button>
          <button onClick={onPauseOrResume} disabled={recordingState === "idle"}>
            Ⅱ {recordingState === "paused" ? "Resume" : "Pause"}
          </button>
          <button onClick={onStop} disabled={recordingState === "idle"}>
            ■ Stop
          </button>
          <button
            className="primary"
            disabled={evaluating || (!transcript.trim() && !interimTranscript.trim())}
            onClick={onEvaluate}
          >
            ✣ {evaluating ? text.evaluating : text.evaluate}
          </button>
        </div>
        {consentNeeded && (
          <button className="primary online-consent" onClick={onAllowOnline} type="button">
            {text.allowOnline}
          </button>
        )}
      </div>
      <div className="levels" aria-hidden="true">
        ▂▄▆█
      </div>
      <label className="transcript">
        <b>{text.transcript}</b>
        <textarea
          ref={transcriptRef}
          value={`${transcript}${interimTranscript ? ` ${interimTranscript}` : ""}`}
          placeholder={text.transcriptPlaceholder}
          onChange={(event) => onTranscriptChange(event.target.value)}
        />
      </label>
    </div>
  );
}

export function DailyCompleteDialog({
  onReturn,
  onPractiseAgain,
  onReviewMistakes,
}: Readonly<{ onReturn: () => void; onPractiseAgain: () => void; onReviewMistakes: () => void }>) {
  return (
    <div
      className="daily-complete-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-complete-title"
    >
      <section className="daily-complete-card">
        <h2 id="daily-complete-title">
          Today’s conversation practice is complete.
        </h2>
        <p>Your recording, transcript, corrections, and result were saved.</p>
        <button className="primary" onClick={onReturn}>
          OK · Return to Today’s Practice
        </button>
        <button onClick={onPractiseAgain}>Practise again</button>
        <button onClick={onReviewMistakes}>Review my mistakes</button>
      </section>
    </div>
  );
}
