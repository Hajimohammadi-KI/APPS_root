"use client";

import * as React from "react";
import {
  ArrowLeft,
  FileAudio,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import {
  HumanAudioPlayer,
  HumanAudioRecorder,
} from "@/components/human-audio-player";
import {
  deleteTeacherContent,
  listTeacherContent,
  saveTeacherContent,
  type TeacherContentItem,
  type TeacherContentKind,
} from "@/lib/teacher-content";

const empty = (): TeacherContentItem => ({
  id: crypto.randomUUID(),
  kind: "example",
  level: "A1",
  title: "",
  body: "",
  contextKey: "",
  updatedAt: new Date().toISOString(),
});

export default function LehrkraftPage() {
  const [items, setItems] = React.useState<TeacherContentItem[]>([]);
  const [draft, setDraft] = React.useState<TeacherContentItem>(empty);
  const [audio, setAudio] = React.useState<Blob | null>(null);
  const [message, setMessage] = React.useState("");
  const refresh = React.useCallback(
    async () => setItems(await listTeacherContent()),
    [],
  );
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  async function save() {
    if (!draft.title.trim() || !draft.contextKey.trim()) {
      setMessage("Titel und Inhaltsschlüssel sind erforderlich.");
      return;
    }
    const next: TeacherContentItem = {
      ...draft,
      title: draft.title.trim(),
      body: draft.body.trim(),
      contextKey: draft.contextKey.trim(),
      ...(audio
        ? { audioName: "menschliche-aufnahme", audioType: audio.type }
        : {}),
      updatedAt: new Date().toISOString(),
    };
    await saveTeacherContent(next, audio);
    setDraft(empty());
    setAudio(null);
    setMessage("Inhalt und menschliche Aufnahme wurden gespeichert.");
    await refresh();
  }
  return (
    <main className="teacher-page">
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
          </div>
          <label>
            Titel
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label>
            Inhaltsschlüssel
            <input
              value={draft.contextKey}
              onChange={(e) =>
                setDraft({ ...draft, contextKey: e.target.value })
              }
              placeholder="grammatik.perfekt.beispiel.1"
            />
            <small>
              Verbindet Inhalt und Aufnahme mit der richtigen Stelle in der App.
            </small>
          </label>
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
          {items.length ? (
            <div className="teacher-items">
              {items.map((item) => (
                <article key={item.id}>
                  <div className="teacher-item-meta">
                    <span>{item.level}</span>
                    <span>{item.kind}</span>
                    <code>{item.contextKey}</code>
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
