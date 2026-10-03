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
} from "@/features/components/human-audio-player";
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
import { originalEnglishStarterContent } from "@/lib/original-starter-content";
import { buildTeacherReviewQueue } from "@/lib/teacher-review-queue";
import { useAppStore } from "@/features/store/app-store";

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
  draft: "Draft",
  review: "Ready for review",
  published: "Published",
};

type AssignmentSkill = "grammar" | "reading" | "writing" | "speaking" | "integrated";
const assignmentKinds: Record<AssignmentSkill, readonly TeacherContentKind[]> = {
  grammar: ["verb", "exercise"],
  reading: ["example"],
  writing: ["exercise"],
  speaking: ["conversation"],
  integrated: ["verb", "example", "exercise", "conversation"],
};

export default function TeacherPage() {
  const { state, hydrated } = useAppStore();
  const [queueNow] = React.useState(() => Date.now());
  const [items, setItems] = React.useState<TeacherContentItem[]>([]);
  const [draft, setDraft] = React.useState<TeacherContentItem>(empty);
  const [audio, setAudio] = React.useState<Blob | null>(null);
  const [message, setMessage] = React.useState("");
  const [assignmentLevel, setAssignmentLevel] = React.useState<TeacherContentItem["level"]>("A1");
  const [assignmentSkill, setAssignmentSkill] = React.useState<AssignmentSkill>("grammar");
  const [assignmentSourceId, setAssignmentSourceId] = React.useState("");
  const [assignmentInstructions, setAssignmentInstructions] = React.useState("");
  const [assignmentReviewed, setAssignmentReviewed] = React.useState(false);
  const [assignmentMessage, setAssignmentMessage] = React.useState("");
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const reviewQueue = React.useMemo(
    () => (hydrated ? buildTeacherReviewQueue(state, queueNow) : []),
    [hydrated, queueNow, state],
  );
  const assignmentSources = React.useMemo(
    () => originalEnglishStarterContent.filter(
      (item) => item.level === assignmentLevel && assignmentKinds[assignmentSkill].includes(item.kind),
    ),
    [assignmentLevel, assignmentSkill],
  );
  const assignmentSource = assignmentSources.find((item) => item.id === assignmentSourceId) ?? assignmentSources[0];

  const refresh = React.useCallback(
    async () => setItems(await listTeacherContent()),
    [],
  );
  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  async function save() {
    if (!draft.title.trim()) {
      setMessage("Enter a title before saving.");
      return;
    }
    const next: TeacherContentItem = {
      ...draft,
      title: draft.title.trim(),
      body: draft.body.trim(),
      // Existing content keeps its link; new lessons receive a stable internal
      // key so teachers never need to create or remember technical IDs.
      contextKey: ensureTeacherContextKey(draft),
      ...(audio ? { audioName: "human-recording", audioType: audio.type } : {}),
      updatedAt: new Date().toISOString(),
    };
    await saveTeacherContent(next, audio);
    setDraft(empty());
    setAudio(null);
    setMessage(`${publicationLabels[next.status ?? "draft"]} saved.`);
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
    link.download = "english-automaticity-teacher-content.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage(
      "Text content and publication states exported. Audio stays private on this device.",
    );
  }

  async function importContent(file: File) {
    try {
      const imported = parseTeacherContentPackage(
        JSON.parse(await file.text()),
      );
      // Importing keeps the curriculum links and publication state, while human
      // audio is deliberately re-attached on the receiving device.
      await Promise.all(imported.map((item) => saveTeacherContent(item)));
      setMessage(
        `${imported.length} text item${imported.length === 1 ? "" : "s"} imported. Re-attach human audio where needed.`,
      );
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not import that file.",
      );
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  async function addOriginalStarterContent() {
    // Stable IDs make this safe to use more than once: saving again updates
    // the same original examples instead of duplicating a teacher's library.
    await Promise.all(
      originalEnglishStarterContent.map((item) => saveTeacherContent(item)),
    );
    setMessage(
      `${originalEnglishStarterContent.length} original, published starter items added. No QSkills text or media was copied.`,
    );
    await refresh();
  }

  async function saveAssignment() {
    if (!assignmentSource || !assignmentInstructions.trim() || !assignmentReviewed) return;
    // Assignments reuse only original in-app starter content and save locally;
    // licensed companion material is never copied into the teacher library.
    const assignment: TeacherContentItem = {
      id: crypto.randomUUID(),
      kind: "exercise",
      level: assignmentSource.level,
      title: `Assignment · ${assignmentSource.title}`,
      body: `Learner instructions:\n${assignmentInstructions.trim()}\n\nReviewed original in-app source:\n${assignmentSource.body}`,
      contextKey: "",
      status: "review",
      updatedAt: new Date().toISOString(),
    };
    await saveTeacherContent({ ...assignment, contextKey: ensureTeacherContextKey(assignment) });
    setAssignmentMessage("Assignment saved locally as Ready for review.");
    setAssignmentInstructions("");
    setAssignmentReviewed(false);
    await refresh();
  }

  return (
    <main className="teacher-page">
      <header className="teacher-hero">
        <a href="/" className="teacher-back">
          <ArrowLeft aria-hidden /> Back to app
        </a>
        <div>
          <span className="teacher-kicker">TEACHER AUTHORING</span>
          <h1>Manage lessons and human audio</h1>
          <p>
            Add or edit verbs, examples, exercises, and conversations. Uploaded
            or recorded human voices are used as the lesson audio; synthetic
            voices are not substituted.
          </p>
        </div>
      </header>
      <section className="teacher-review-queue" aria-labelledby="teacher-review-title">
        <div className="teacher-review-heading">
          <div>
            <span className="teacher-kicker">REVIEW QUEUE</span>
            <h2 id="teacher-review-title">Act on learner evidence</h2>
            <p>
              Automated confidence signals help order the queue. They are not
              teacher-verified mastery.
            </p>
          </div>
          <strong>{reviewQueue.length} to review</strong>
        </div>
        {reviewQueue.length ? (
          <ul className="teacher-review-items">
            {reviewQueue.map((item) => (
              <li key={item.id}>
                <header>
                  <div>
                    <span className={`teacher-review-priority teacher-review-priority-${item.priority}`}>
                      {item.priority === "now" ? "Review now" : "Planned"}
                    </span>
                    <h3>{item.task}</h3>
                  </div>
                  <ClipboardCheck aria-hidden />
                </header>
                <dl>
                  <div><dt>Learner</dt><dd>{item.learner}</dd></div>
                  <div><dt>Evidence type</dt><dd>{item.evidenceType}</dd></div>
                  <div><dt>Confidence</dt><dd>{item.confidence}</dd></div>
                  <div><dt>Correction need</dt><dd>{item.correctionNeed}</dd></div>
                  <div><dt>Recommended next step</dt><dd>{item.recommendedNextStep}</dd></div>
                </dl>
                <a className="teacher-review-action" href={item.href}>Open evidence and act</a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="teacher-review-empty" role="status">
            {hydrated
              ? "No active corrections or recall reviews need teacher attention."
              : "Loading saved learner evidence…"}
          </div>
        )}
      </section>
      <section className="teacher-assignment" aria-labelledby="assignment-title">
        <div className="teacher-assignment-heading">
          <div><span className="teacher-kicker">ASSIGNMENT COMPOSER</span><h2 id="assignment-title">Prepare one focused learner task</h2></div>
          <span>Local and free</span>
        </div>
        <div className="teacher-assignment-grid">
          <label>CEFR level<select value={assignmentLevel} onChange={(event) => { setAssignmentLevel(event.target.value as TeacherContentItem["level"]); setAssignmentSourceId(""); setAssignmentReviewed(false); }}>{["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => <option key={level}>{level}</option>)}</select></label>
          <label>Skill<select value={assignmentSkill} onChange={(event) => { setAssignmentSkill(event.target.value as AssignmentSkill); setAssignmentSourceId(""); setAssignmentReviewed(false); }}><option value="grammar">Grammar</option><option value="reading">Reading</option><option value="writing">Writing</option><option value="speaking">Speaking</option><option value="integrated">Integrated skills</option></select></label>
          <label>Topic<select value={assignmentSource?.id ?? ""} onChange={(event) => { setAssignmentSourceId(event.target.value); setAssignmentReviewed(false); }}>{assignmentSources.map((source) => <option key={source.id} value={source.id}>{source.title}</option>)}</select></label>
        </div>
        {assignmentSource ? <article className="teacher-assignment-source"><span>Original in-app content to review</span><h3>{assignmentSource.title}</h3><p>{assignmentSource.body}</p></article> : null}
        <label className="teacher-assignment-instructions">Plain-language learner instructions<textarea rows={4} value={assignmentInstructions} onChange={(event) => setAssignmentInstructions(event.target.value)} placeholder="Tell the learner what to produce, how much is enough, and what to check before saving." /></label>
        <label className="teacher-assignment-check"><input type="checkbox" checked={assignmentReviewed} onChange={(event) => setAssignmentReviewed(event.target.checked)} /> I reviewed this original app content and the learner instructions.</label>
        {assignmentMessage ? <p className="teacher-message" role="status">{assignmentMessage}</p> : null}
        <button className="teacher-primary-button" disabled={!assignmentSource || !assignmentInstructions.trim() || !assignmentReviewed} onClick={() => void saveAssignment()} type="button"><Save aria-hidden /> Save assignment for review</button>
      </section>
      <div className="teacher-layout">
        <section className="teacher-editor" aria-label="Content editor">
          <h2>
            {items.some((item) => item.id === draft.id)
              ? "Edit content"
              : "Add content"}
          </h2>
          <div className="teacher-grid">
            <label>
              Content type
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
                <option value="example">Example</option>
                <option value="exercise">Exercise</option>
                <option value="conversation">Conversation</option>
              </select>
            </label>
            <label>
              CEFR level
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
              Publication status
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
            Title
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Present perfect – life experience"
            />
          </label>
          <p className="teacher-helper" role="note">
            The app creates the internal audio and content link automatically.
            No technical content key is required.
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
            <legend>Human-recorded audio</legend>
            <label className="teacher-upload">
              <Upload aria-hidden /> Choose audio file
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
            <Save aria-hidden /> Save content
          </button>
        </section>
        <section className="teacher-library">
          <div className="teacher-library-heading">
            <div>
              <span className="teacher-kicker">LIBRARY</span>
              <h2>Managed content</h2>
            </div>
            <div className="teacher-library-actions">
              <button
                className="teacher-secondary-button"
                onClick={() => void addOriginalStarterContent()}
                type="button"
              >
                <Sparkles aria-hidden /> Add original starter set
              </button>
              <button
                className="teacher-secondary-button"
                disabled={!items.length}
                onClick={exportContent}
                type="button"
              >
                <Download aria-hidden /> Export text
              </button>
              <label className="teacher-secondary-button teacher-import-button">
                <Upload aria-hidden /> Import text
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
                <Plus aria-hidden /> New
              </button>
            </div>
          </div>
          <p className="teacher-helper" role="note">
            Export and import are a free text backup and sharing method. Human
            audio is kept on the teacher&apos;s device and must be attached
            again after importing.
          </p>
          <p className="teacher-helper" role="note">
            The starter set contains new in-app teaching text for A1–C2. It is
            separate from the locally licensed QSkills companion material.
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
                      Linked automatically
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
                      <Pencil aria-hidden /> Edit
                    </button>
                    <button
                      className="danger"
                      onClick={async () => {
                        await deleteTeacherContent(item.id);
                        if (draft.id === item.id) setDraft(empty());
                        await refresh();
                      }}
                      type="button"
                    >
                      <Trash2 aria-hidden /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="teacher-empty">
              <FileAudio aria-hidden />
              <h3>No teacher content yet</h3>
              <p>Add the first item and attach a real human recording.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
