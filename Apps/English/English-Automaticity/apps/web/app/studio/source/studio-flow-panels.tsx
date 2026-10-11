import type { StudioLanguage } from "./conversation-data";
import { type EvaluationResponse, formatTime } from "./studio-helpers";

export function ListenPanel({
  language,
  stepLabel,
  task,
  onPlay,
  onReady,
}: Readonly<{
  language: StudioLanguage;
  stepLabel: string;
  task: string;
  onPlay: () => void;
  onReady: () => void;
}>) {
  return (
    <section className="flow-panel listen-panel">
      <div className="flow-title">
        <span>♧</span>
        <div>
          <small>STEP 1 · {stepLabel}</small>
          <h3>
            {language === "de" ? "Höre die Aufgabe" : "Listen to the task"}
          </h3>
        </div>
      </div>
      <blockquote>{task}</blockquote>
      <div className="flow-actions">
        <button onClick={onPlay}>▶ Play</button>
        <button className="primary" onClick={onReady}>
          {language === "de" ? "Ich bin bereit →" : "I’m ready →"}
        </button>
      </div>
    </section>
  );
}

export function ReplayPanel({
  language,
  audioUrl,
  onRecordAgain,
  onReview,
}: Readonly<{
  language: StudioLanguage;
  audioUrl: string | null;
  onRecordAgain: () => void;
  onReview: () => void;
}>) {
  return (
    <section className="flow-panel replay-panel">
      <div className="flow-title">
        <span>▷</span>
        <div>
          <small>STEP 3 · REPLAY</small>
          <h3>
            {language === "de"
              ? "Höre deine echte Aufnahme"
              : "Listen to your real recording"}
          </h3>
        </div>
      </div>
      {audioUrl ? (
        <>
          <audio src={audioUrl} controls className="review-audio" />
          <p className="flow-note">
            {language === "de"
              ? "Höre zuerst ohne Text und prüfe danach das Transkript."
              : "Listen once without reading, then verify the transcript."}
          </p>
          <div className="flow-actions">
            <button onClick={onRecordAgain}>Record again</button>
            <button className="primary" onClick={onReview}>
              Review →
            </button>
          </div>
        </>
      ) : (
        <div className="flow-empty">
          {language === "de"
            ? "Noch keine Aufnahme vorhanden."
            : "No recording yet."}
        </div>
      )}
    </section>
  );
}

export function ReviewPanel({
  language,
  stepLabel,
  evaluation,
  audioUrl,
  wordCount,
  seconds,
  wordsPerMinute,
  matchedChunks,
  totalChunks,
  onTryAgain,
  onCorrections,
}: Readonly<{
  language: StudioLanguage;
  stepLabel: string;
  evaluation: EvaluationResponse | null;
  audioUrl: string | null;
  wordCount: number;
  seconds: number;
  wordsPerMinute: number;
  matchedChunks: number;
  totalChunks: number;
  onTryAgain: () => void;
  onCorrections: () => void;
}>) {
  return (
    <section className="flow-panel review-panel">
      <div className="flow-title">
        <span>▧</span>
        <div>
          <small>STEP 4 · {stepLabel}</small>
          <h3>
            {language === "de" ? "Prüfe deine Antwort" : "Review your answer"}
          </h3>
        </div>
      </div>
      {evaluation ? (
        <>
          <div className="review-grid">
            <article>
              <small>AUDIO</small>
              {audioUrl && <audio src={audioUrl} controls />}
            </article>
            <article>
              <small>TRANSCRIPT</small>
              <p>{evaluation.original}</p>
            </article>
            <article>
              <small>MEASURED</small>
              <p>
                <b>{wordCount}</b> words · <b>{formatTime(seconds)}</b> ·{" "}
                <b>{wordsPerMinute}</b> WPM
              </p>
            </article>
          </div>
          <p className="spoken-chunk-review" role="status">
            <b>
              Natural spoken chunks detected: {matchedChunks}/{totalChunks}.
            </b>{" "}
            {matchedChunks >= 2
              ? "You reached the practice target. This is transcript guidance, not a mastery score."
              : "Try again with at least two chunks. This is transcript guidance, not a mastery score."}
          </p>
          <div className="flow-actions">
            <button onClick={onTryAgain}>Try again</button>
            <button className="primary" onClick={onCorrections}>
              Corrections →
            </button>
          </div>
        </>
      ) : (
        <div className="flow-empty">
          {language === "de"
            ? "Noch keine echte Auswertung vorhanden."
            : "No verified evaluation yet."}
        </div>
      )}
    </section>
  );
}

export function CorrectPanel({
  language,
  stepLabel,
  evaluation,
  providerUnavailable,
  onBack,
  onImprove,
}: Readonly<{
  language: StudioLanguage;
  stepLabel: string;
  evaluation: EvaluationResponse | null;
  providerUnavailable: string;
  onBack: () => void;
  onImprove: () => void;
}>) {
  return (
    <section className="flow-panel correct-panel">
      <div className="flow-title">
        <span>✓</span>
        <div>
          <small>STEP 5 · {stepLabel}</small>
          <h3>
            {language === "de"
              ? "Korrekturen verstehen"
              : "Understand the correction"}
          </h3>
        </div>
      </div>
      {evaluation ? (
        <>
          <div className="correction-grid">
            <article>
              <small>{language === "de" ? "DEINE VERSION" : "YOU SAID"}</small>
              <p>{evaluation.original}</p>
            </article>
            <article>
              <small>
                {language === "de" ? "KORRIGIERTE VERSION" : "CORRECTED VERSION"}
              </small>
              <p>{evaluation.corrected}</p>
            </article>
          </div>
          {evaluation.issues.length > 0 ? (
            <ul className="issue-list">
              {evaluation.issues.map((issue, index) => (
                <li key={`${issue.ruleId}-${issue.offset}-${index}`}>
                  <b>{issue.category}</b> — {issue.message}
                  {issue.replacements[0] ? ` → ${issue.replacements[0]}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="flow-note">
              {language === "de"
                ? "LanguageTool hat keine Textfehler erkannt."
                : "LanguageTool detected no text errors."}
            </p>
          )}
          <div className="flow-actions">
            <button onClick={onBack}>Back</button>
            <button className="primary" onClick={onImprove}>
              Improve →
            </button>
          </div>
        </>
      ) : (
        <div className="flow-empty">{providerUnavailable}</div>
      )}
    </section>
  );
}

export function ImprovePanel({
  language,
  stepLabel,
  evaluation,
  baseline,
  pronunciation,
  onHearModel,
  onRecordImproved,
}: Readonly<{
  language: StudioLanguage;
  stepLabel: string;
  evaluation: EvaluationResponse | null;
  baseline: EvaluationResponse | null;
  pronunciation: string;
  onHearModel: () => void;
  onRecordImproved: () => void;
}>) {
  return (
    <section className="improve-panel">
      <div className="improve-heading">
        <span>↗</span>
        <div>
          <p>STEP 6 · {stepLabel}</p>
          <h3>
            {language === "de"
              ? "Die korrigierte Version erneut produzieren"
              : "Produce the corrected version again"}
          </h3>
        </div>
      </div>
      {evaluation ? (
        <>
          <div className="improve-compare">
            <article>
              <small>{baseline ? "FIRST ATTEMPT" : "ORIGINAL"}</small>
              <p>{baseline?.original ?? evaluation.original}</p>
            </article>
            <article className="better">
              <small>
                {baseline ? "NEW VERIFIED ATTEMPT" : "LANGUAGETOOL CORRECTION"}
              </small>
              <p>{evaluation.corrected}</p>
            </article>
          </div>
          <div className="speaking-tip">
            <b>{language === "de" ? "Ehrliche Grenze" : "Honest limit"}</b>
            <p>{pronunciation}</p>
          </div>
          <div className="improve-actions">
            <button onClick={onHearModel}>▶ Hear model</button>
            <button className="primary" onClick={onRecordImproved}>
              ♩{" "}
              {language === "de" ? "Neue Aufnahme" : "Record improved attempt"}
            </button>
          </div>
        </>
      ) : (
        <div className="improve-empty">
          <p>
            {language === "de"
              ? "Nimm zuerst eine Antwort auf und werte sie aus."
              : "Record and evaluate an answer first."}
          </p>
        </div>
      )}
    </section>
  );
}

export function SavePanel({
  language,
  stepLabel,
  savedId,
  savedText,
  wordCount,
  seconds,
  evaluation,
  canSave,
  onBack,
  onSave,
}: Readonly<{
  language: StudioLanguage;
  stepLabel: string;
  savedId: string | null;
  savedText: string;
  wordCount: number;
  seconds: number;
  evaluation: EvaluationResponse | null;
  canSave: boolean;
  onBack: () => void;
  onSave: () => void;
}>) {
  return (
    <section className="flow-panel save-panel">
      <div className="flow-title">
        <span>▯</span>
        <div>
          <small>STEP 7 · {stepLabel}</small>
          <h3>
            {savedId
              ? savedText
              : language === "de"
                ? "Sitzung lokal speichern"
                : "Save the session locally"}
          </h3>
        </div>
      </div>
      <div className="save-summary">
        <span>
          <b>{wordCount}</b> words
        </span>
        <span>
          <b>{formatTime(seconds)}</b> speaking
        </span>
        <span>
          <b>{evaluation ? "LanguageTool" : "Not evaluated"}</b> result
        </span>
      </div>
      <p className="flow-note">
        {language === "de"
          ? "Audio, Transkript und Auswertung werden in IndexedDB dieses Browsers gespeichert."
          : "Audio, transcript, and provider evaluation are stored in this browser’s IndexedDB."}
      </p>
      <div className="flow-actions">
        <button onClick={onBack}>Back</button>
        <button className="primary" disabled={!canSave} onClick={onSave}>
          ✓ {savedId ? "Saved" : "Save session"}
        </button>
      </div>
    </section>
  );
}
