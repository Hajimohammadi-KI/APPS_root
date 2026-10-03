"use client";

import * as React from "react";
import {
  ArrowLeft,
  ClipboardCheck,
  Download,
  FileAudio,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  HumanAudioPlayer,
  HumanAudioRecorder,
} from "@/components/human-audio-player";
import {
  createTeacherContentPackage,
  deleteTeacherContent,
  ensureTeacherContextKey,
  listTeacherContent,
  parseTeacherContentPackage,
  saveTeacherContent,
  type TeacherContentItem,
  type TeacherContentKind,
  type TeacherContentStatus,
} from "@/lib/teacher-content";
import { originalGermanStarterContent } from "@/lib/original-starter-content";
import { buildTeacherReviewQueue } from "@/lib/teacher-review-queue";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

const empty = (): TeacherContentItem => ({
  id: crypto.randomUUID(),
  kind: "example",
  level: "A1",
  title: "",
  body: "",
  contextKey: "",
  status: "draft",
  updatedAt: new Date().toISOString(),
});

const publicationLabels: Record<TeacherContentStatus, string> = {
  draft: "Entwurf",
  review: "Zur Prüfung",
  published: "Veröffentlicht",
};

type AssignmentSkill =
  "grammar" | "reading" | "writing" | "speaking" | "integrated";
const assignmentKinds: Record<AssignmentSkill, readonly TeacherContentKind[]> =
  {
    grammar: ["verb", "exercise"],
    reading: ["example"],
    writing: ["exercise"],
    speaking: ["conversation"],
    integrated: ["verb", "example", "exercise", "conversation"],
  };

export default function LehrkraftPage() {
  const { state, hydrated } = useLearnerState();
  const [queueNow] = React.useState(() => Date.now());
  const [items, setItems] = React.useState<TeacherContentItem[]>([]);
  const [draft, setDraft] = React.useState<TeacherContentItem>(empty);
  const [audio, setAudio] = React.useState<Blob | null>(null);
  const [message, setMessage] = React.useState("");
  const [assignmentLevel, setAssignmentLevel] =
    React.useState<TeacherContentItem["level"]>("A1");
  const [assignmentSkill, setAssignmentSkill] =
    React.useState<AssignmentSkill>("grammar");
  const [assignmentSourceId, setAssignmentSourceId] = React.useState("");
  const [assignmentInstructions, setAssignmentInstructions] =
    React.useState("");
  const [assignmentReviewed, setAssignmentReviewed] = React.useState(false);
  const [assignmentMessage, setAssignmentMessage] = React.useState("");
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const reviewQueue = React.useMemo(
    () => (hydrated ? buildTeacherReviewQueue(state, queueNow) : []),
    [hydrated, queueNow, state],
  );
  const assignmentSources = React.useMemo(
    () =>
      originalGermanStarterContent.filter(
        (item) =>
          item.level === assignmentLevel &&
          assignmentKinds[assignmentSkill].includes(item.kind),
      ),
    [assignmentLevel, assignmentSkill],
  );
  const assignmentSource =
    assignmentSources.find((item) => item.id === assignmentSourceId) ??
    assignmentSources[0];
  const refresh = React.useCallback(
    async () => setItems(await listTeacherContent()),
    [],
  );
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  async function save() {
    if (!draft.title.trim()) {
      setMessage("Bitte gib einen Titel ein.");
      return;
    }
    const next: TeacherContentItem = {
      ...draft,
      title: draft.title.trim(),
      body: draft.body.trim(),
      // Keep existing links when editing, but create a safe internal key for
      // new content so teachers never have to invent a technical identifier.
      contextKey: ensureTeacherContextKey(draft),
      ...(audio
        ? { audioName: "menschliche-aufnahme", audioType: audio.type }
        : {}),
      updatedAt: new Date().toISOString(),
    };
    await saveTeacherContent(next, audio);
    setDraft(empty());
    setAudio(null);
    setMessage(`${publicationLabels[next.status ?? "draft"]} gespeichert.`);
    await refresh();
  }

  function exportContent() {
    const file = new Blob(
      [JSON.stringify(createTeacherContentPackage(items), null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "deutsch-automaticity-lehrkraft-inhalte.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage(
      "Text-Inhalte und Arbeitsstände exportiert. Audio bleibt privat auf diesem Gerät.",
    );
  }

  async function importContent(file: File) {
    try {
      const imported = parseTeacherContentPackage(
        JSON.parse(await file.text()),
      );
      // Beim Import bleiben Lern-Verknüpfung und Arbeitsstand erhalten. Echte
      // Audioaufnahmen werden bewusst erst auf dem Zielgerät ergänzt.
      await Promise.all(imported.map((item) => saveTeacherContent(item)));
      setMessage(
        `${imported.length} Text-Inhalt${imported.length === 1 ? "" : "e"} importiert. Bitte menschliche Aufnahmen bei Bedarf erneut anhängen.`,
      );
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Diese Datei konnte nicht importiert werden.",
      );
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  async function addOriginalStarterContent() {
    // Stabile IDs machen den Vorgang wiederholbar: Ein erneuter Klick
    // aktualisiert diese Startinhalte, statt die Bibliothek zu duplizieren.
    await Promise.all(
      originalGermanStarterContent.map((item) => saveTeacherContent(item)),
    );
    setMessage(
      `${originalGermanStarterContent.length} eigene, veröffentlichte Startinhalte hinzugefügt. Es wurden keine QSkills-Texte oder -Medien kopiert.`,
    );
    await refresh();
  }
  async function saveAssignment() {
    if (
      !assignmentSource ||
      !assignmentInstructions.trim() ||
      !assignmentReviewed
    )
      return;
    // Aufgaben verwenden nur eigene App-Startinhalte und bleiben lokal;
    // lizenziertes Begleitmaterial wird nicht in die Bibliothek kopiert.
    const assignment: TeacherContentItem = {
      id: crypto.randomUUID(),
      kind: "exercise",
      level: assignmentSource.level,
      title: `Aufgabe · ${assignmentSource.title}`,
      body: `Anweisung für Lernende:\n${assignmentInstructions.trim()}\n\nGeprüfter eigener App-Ausgangstext:\n${assignmentSource.body}`,
      contextKey: "",
      status: "review",
      updatedAt: new Date().toISOString(),
    };
    await saveTeacherContent({
      ...assignment,
      contextKey: ensureTeacherContextKey(assignment),
    });
    setAssignmentMessage(
      "Aufgabe lokal mit dem Arbeitsstand Zur Prüfung gespeichert.",
    );
    setAssignmentInstructions("");
    setAssignmentReviewed(false);
    await refresh();
  }
  return (
    <main className="teacher-page">
      <a
        href="/practice?review=1"
        className="inline-block rounded-xl bg-blue-700 px-4 py-3 text-white"
      >
        Originalantworten und Aufnahmen aus Übungen prüfen
      </a>
      <header className="teacher-hero">
        <a href="/" className="teacher-back">
          <ArrowLeft /> Zurück zur App
        </a>
        <span className="teacher-kicker">LEHRKRAFT-AUTORING</span>
        <h1>Inhalte und menschliche Aufnahmen verwalten</h1>
        <p>
          Verben, Beispiele, Übungen und Gespräche hinzufügen oder bearbeiten.
          Als Lektionsaudio wird ausschließlich eine menschliche Aufnahme
          verwendet.
        </p>
      </header>
      <section
        className="teacher-review-queue"
        aria-labelledby="teacher-review-title"
      >
        <div className="teacher-review-heading">
          <div>
            <span className="teacher-kicker">PRÜFWARTESCHLANGE</span>
            <h2 id="teacher-review-title">Auf Lernnachweise reagieren</h2>
            <p>
              Automatische Vertrauenssignale ordnen die Liste. Sie sind keine
              durch eine Lehrkraft bestätigte Beherrschung.
            </p>
          </div>
          <strong>{reviewQueue.length} zu prüfen</strong>
        </div>
        {reviewQueue.length ? (
          <ul className="teacher-review-items">
            {reviewQueue.map((item) => (
              <li key={item.id}>
                <header>
                  <div>
                    <span
                      className={`teacher-review-priority teacher-review-priority-${item.priority}`}
                    >
                      {item.priority === "now" ? "Jetzt prüfen" : "Geplant"}
                    </span>
                    <h3>{item.task}</h3>
                  </div>
                  <ClipboardCheck aria-hidden />
                </header>
                <dl>
                  <div>
                    <dt>Lernende Person</dt>
                    <dd>{item.learner}</dd>
                  </div>
                  <div>
                    <dt>Nachweisart</dt>
                    <dd>{item.evidenceType}</dd>
                  </div>
                  <div>
                    <dt>Vertrauen</dt>
                    <dd>{item.confidence}</dd>
                  </div>
                  <div>
                    <dt>Korrekturbedarf</dt>
                    <dd>{item.correctionNeed}</dd>
                  </div>
                  <div>
                    <dt>Empfohlener nächster Schritt</dt>
                    <dd>{item.recommendedNextStep}</dd>
                  </div>
                </dl>
                <a className="teacher-review-action" href={item.href}>
                  Nachweis öffnen und handeln
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="teacher-review-empty" role="status">
            {hydrated
              ? "Keine aktive Korrektur oder Wiederholung braucht Lehrkraft-Aufmerksamkeit."
              : "Gespeicherte Lernnachweise werden geladen…"}
          </div>
        )}
      </section>
      <section
        className="teacher-assignment"
        aria-labelledby="assignment-title"
      >
        <div className="teacher-assignment-heading">
          <div>
            <span className="teacher-kicker">AUFGABENPLANER</span>
            <h2 id="assignment-title">
              Eine fokussierte Lernaufgabe vorbereiten
            </h2>
          </div>
          <span>Lokal und kostenlos</span>
        </div>
        <div className="teacher-assignment-grid">
          <label>
            GER-Niveau
            <select
              value={assignmentLevel}
              onChange={(event) => {
                setAssignmentLevel(
                  event.target.value as TeacherContentItem["level"],
                );
                setAssignmentSourceId("");
                setAssignmentReviewed(false);
              }}
            >
              {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </label>
          <label>
            Fertigkeit
            <select
              value={assignmentSkill}
              onChange={(event) => {
                setAssignmentSkill(event.target.value as AssignmentSkill);
                setAssignmentSourceId("");
                setAssignmentReviewed(false);
              }}
            >
              <option value="grammar">Grammatik</option>
              <option value="reading">Lesen</option>
              <option value="writing">Schreiben</option>
              <option value="speaking">Sprechen</option>
              <option value="integrated">Integrierte Fertigkeiten</option>
            </select>
          </label>
          <label>
            Thema
            <select
              value={assignmentSource?.id ?? ""}
              onChange={(event) => {
                setAssignmentSourceId(event.target.value);
                setAssignmentReviewed(false);
              }}
            >
              {assignmentSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        {assignmentSource ? (
          <article className="teacher-assignment-source">
            <span>Eigener App-Ausgangstext zur Prüfung</span>
            <h3>{assignmentSource.title}</h3>
            <p>{assignmentSource.body}</p>
          </article>
        ) : null}
        <label className="teacher-assignment-instructions">
          Klare Anweisung für Lernende
          <textarea
            rows={4}
            value={assignmentInstructions}
            onChange={(event) => setAssignmentInstructions(event.target.value)}
            placeholder="Sage, was produziert werden soll, wie viel genügt und was vor dem Speichern geprüft wird."
          />
        </label>
        <label className="teacher-assignment-check">
          <input
            type="checkbox"
            checked={assignmentReviewed}
            onChange={(event) => setAssignmentReviewed(event.target.checked)}
          />{" "}
          Ich habe den eigenen App-Inhalt und die Lernanweisung geprüft.
        </label>
        {assignmentMessage ? (
          <p className="teacher-message" role="status">
            {assignmentMessage}
          </p>
        ) : null}
        <button
          className="teacher-primary-button"
          disabled={
            !assignmentSource ||
            !assignmentInstructions.trim() ||
            !assignmentReviewed
          }
          onClick={() => void saveAssignment()}
          type="button"
        >
          <Save aria-hidden /> Aufgabe zur Prüfung speichern
        </button>
      </section>
      <div className="teacher-layout">
        <section className="teacher-editor">
          <h2>
            {items.some((item) => item.id === draft.id)
              ? "Inhalt bearbeiten"
              : "Inhalt hinzufügen"}
          </h2>
          <div className="teacher-grid">
            <label>
              Inhaltstyp
              <select
                value={draft.kind}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    kind: e.target.value as TeacherContentKind,
                  })
                }
              >
                <option value="verb">Verb</option>
                <option value="example">Beispiel</option>
                <option value="exercise">Übung</option>
                <option value="conversation">Gespräch</option>
              </select>
            </label>
            <label>
              GER-Niveau
              <select
                value={draft.level}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    level: e.target.value as TeacherContentItem["level"],
                  })
                }
              >
                {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </label>
            <label>
              Arbeitsstand
              <select
                value={draft.status ?? "published"}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    status: e.target.value as TeacherContentStatus,
                  })
                }
              >
                {(Object.keys(publicationLabels) as TeacherContentStatus[]).map(
                  (status) => (
                    <option key={status} value={status}>
                      {publicationLabels[status]}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
          <label>
            Titel
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <p className="teacher-helper" role="note">
            Die App erstellt die interne Verknüpfung für Inhalt und Aufnahme
            automatisch. Du brauchst keinen technischen Schlüssel einzugeben.
          </p>
          <label>
            Text
            <textarea
              rows={6}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
          </label>
          <fieldset>
            <legend>Menschlich aufgenommenes Audio</legend>
            <label className="teacher-upload">
              <Upload /> Audiodatei auswählen
              <input
                accept="audio/*"
                onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
                type="file"
              />
            </label>
            <HumanAudioRecorder onRecorded={setAudio} />
            {draft.audioName && !audio ? (
              <HumanAudioPlayer contentId={draft.id} />
            ) : null}
          </fieldset>
          {message ? (
            <p className="teacher-message" role="status">
              {message}
            </p>
          ) : null}
          <button
            className="teacher-primary-button"
            onClick={() => void save()}
            type="button"
          >
            <Save /> Inhalt speichern
          </button>
        </section>
        <section className="teacher-library">
          <div className="teacher-library-heading">
            <div>
              <span className="teacher-kicker">BIBLIOTHEK</span>
              <h2>Verwaltete Inhalte</h2>
            </div>
            <div className="teacher-library-actions">
              <button
                className="teacher-secondary-button"
                onClick={() => void addOriginalStarterContent()}
                type="button"
              >
                <Sparkles aria-hidden /> Eigene Startinhalte hinzufügen
              </button>
              <button
                className="teacher-secondary-button"
                disabled={!items.length}
                onClick={exportContent}
                type="button"
              >
                <Download /> Text exportieren
              </button>
              <label className="teacher-secondary-button teacher-import-button">
                <Upload /> Text importieren
                <input
                  accept="application/json,.json"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void importContent(file);
                  }}
                  ref={importInputRef}
                  type="file"
                />
              </label>
              <button
                className="teacher-secondary-button"
                onClick={() => {
                  setDraft(empty());
                  setAudio(null);
                }}
                type="button"
              >
                <Plus /> Neu
              </button>
            </div>
          </div>
          <p className="teacher-helper" role="note">
            Export und Import sind ein kostenloses Text-Backup zum Teilen.
            Menschliche Audioaufnahmen bleiben auf dem Gerät der Lehrkraft und
            werden nach dem Import erneut angehängt.
          </p>
          <p className="teacher-helper" role="note">
            Die Startinhalte sind neue A1–C2-Texte für diese App und vom lokal
            lizenzierten QSkills-Begleitmaterial getrennt.
          </p>
          {items.length ? (
            <div className="teacher-items">
              {items.map((item) => (
                <article key={item.id}>
                  <div className="teacher-item-meta">
                    <span>{item.level}</span>
                    <span>{item.kind}</span>
                    <span
                      className={`teacher-status teacher-status-${item.status ?? "published"}`}
                    >
                      {publicationLabels[item.status ?? "published"]}
                    </span>
                    <span className="teacher-auto-link">
                      Automatisch verknüpft
                    </span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <HumanAudioPlayer compact contentId={item.id} />
                  <div className="teacher-item-actions">
                    <button
                      onClick={() => {
                        setDraft(item);
                        setAudio(null);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      type="button"
                    >
                      <Pencil /> Bearbeiten
                    </button>
                    <button
                      className="danger"
                      onClick={async () => {
                        await deleteTeacherContent(item.id);
                        await refresh();
                      }}
                      type="button"
                    >
                      <Trash2 /> Löschen
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="teacher-empty">
              <FileAudio />
              <h3>Noch keine Lehrkraft-Inhalte</h3>
              <p>Füge den ersten Inhalt mit einer echten Aufnahme hinzu.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
