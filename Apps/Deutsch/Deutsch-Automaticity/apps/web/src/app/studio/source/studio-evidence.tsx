import type { ConversationTopic } from "./conversation-data";
import { type EvaluationResponse, formatTime } from "./studio-helpers";

export function SessionEvidence({
  seconds,
  wordsPerMinute,
  wordCount,
  transcript,
  evaluation,
  pronunciation,
  attempts,
  selected,
  showCorrections,
  onToggleCorrections,
}: Readonly<{
  seconds: number;
  wordsPerMinute: number;
  wordCount: number;
  transcript: string;
  evaluation: EvaluationResponse | null;
  pronunciation: string;
  attempts: number;
  selected: ConversationTopic;
  showCorrections: boolean;
  onToggleCorrections: (checked: boolean) => void;
}>) {
  return (
    <details className="studio-results">
      <summary>Sitzungsdetails & Rückmeldung</summary>
      <aside className="evidence">
        <section className="panel feedback">
          <h3>Echte Sprechdaten</h3>
          <div className="feedback-row f0">
            <span>◫</span>
            <div>
              <b>Fluency</b>
              <small>
                {seconds
                  ? `${wordsPerMinute} WPM from ${formatTime(seconds)} audio`
                  : "Waiting for recorded timing"}
              </small>
            </div>
            <strong>{seconds ? `${wordsPerMinute}` : "—"}</strong>
          </div>
          <div className="feedback-row f1">
            <span>◉</span>
            <div>
              <b>Pronunciation</b>
              <small>{pronunciation}</small>
            </div>
            <strong>—</strong>
          </div>
          <div className="feedback-row f2">
            <span>G</span>
            <div>
              <b>Grammar</b>
              <small>
                {evaluation
                  ? `${evaluation.issues.length} LanguageTool issue(s)`
                  : "Not checked"}
              </small>
            </div>
            <strong>{evaluation ? evaluation.issues.length : "—"}</strong>
          </div>
          <div className="feedback-row f3">
            <span>Aa</span>
            <div>
              <b>Transcript</b>
              <small>
                {transcript
                  ? "Browser transcript reviewed by learner"
                  : "Waiting for speech"}
              </small>
            </div>
            <strong>{wordCount || "—"}</strong>
          </div>
          <div className="coach-tip">
            <b>☼ Evidence rule</b>
            <p>
              Keine Bewertung wird angezeigt, wenn der echte Anbieter nicht
              geantwortet hat.
            </p>
          </div>
        </section>
        <section className="panel">
          <h3>Session evidence</h3>
          <div className="metrics">
            <div>
              <b>{attempts}</b>
              <span>Turns</span>
            </div>
            <div>
              <b>{formatTime(seconds)}</b>
              <span>Speaking</span>
            </div>
            <div>
              <b>{wordCount}</b>
              <span>Words</span>
            </div>
            <div>
              <b>{wordsPerMinute}</b>
              <span>WPM</span>
            </div>
          </div>
          <p className="encourage">♙ {selected.goal}</p>
        </section>
        <section className="panel correction">
          <div className="panel-title">
            <h3>Grammar correction</h3>
            <label>
              Show{" "}
              <input
                type="checkbox"
                checked={showCorrections}
                onChange={(event) => onToggleCorrections(event.target.checked)}
              />
            </label>
          </div>
          {showCorrections && (
            <>
              <div className="original">
                <b>Original</b>
                <p>{evaluation?.original ?? "—"}</p>
              </div>
              <div className="corrected">
                <b>
                  {evaluation?.issues.length ? "Corrected" : "Provider result"}
                </b>
                <p>{evaluation?.corrected ?? "—"}</p>
              </div>
            </>
          )}
        </section>
        <section className="panel goal">
          <span>{selected.level}</span>
          <h3>Heutiges Ziel</h3>
          <b>{selected.topic}</b>
          <p>{selected.goal}</p>
        </section>
      </aside>
    </details>
  );
}

export function StudioFooter({
  attempts,
  evaluation,
  audioUrl,
  savedId,
  goal,
  active,
  onSave,
  onContinue,
}: Readonly<{
  attempts: number;
  evaluation: EvaluationResponse | null;
  audioUrl: string | null;
  savedId: string | null;
  goal: string;
  active: number;
  onSave: () => void;
  onContinue: () => void;
}>) {
  return (
    <footer>
      <div className="turns">
        <b>
          {attempts} {attempts === 1 ? "attempt" : "attempts"}
        </b>
        <span>
          {evaluation ? "●" : "○"} {audioUrl ? "●" : "○"} {savedId ? "●" : "○"}
        </span>
      </div>
      <div className="footer-coach">
        <span>👩🏻</span>
        <p>
          <b>Ava</b>
          <br />
          {goal}
        </p>
      </div>
      <button className="save-lite" onClick={onSave}>
        ▯ Übung speichern
      </button>
      <button className="continue" onClick={onContinue}>
        {active === 6
          ? savedId
            ? "Session saved ✓"
            : "Save session"
          : "Weiter →"}
      </button>
    </footer>
  );
}
