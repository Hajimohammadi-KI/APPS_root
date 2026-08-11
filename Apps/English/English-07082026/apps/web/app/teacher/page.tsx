"use client";

import * as React from "react";
import { ArrowLeft, FileAudio, Pencil, Plus, Save, Trash2, Upload } from "lucide-react";
import { HumanAudioPlayer, HumanAudioRecorder } from "@/features/components/human-audio-player";
import { deleteTeacherContent, listTeacherContent, saveTeacherContent, type TeacherContentItem, type TeacherContentKind } from "@/lib/teacher-content";

const empty = (): TeacherContentItem => ({ id: crypto.randomUUID(), kind: "example", level: "A1", title: "", body: "", contextKey: "", updatedAt: new Date().toISOString() });

export default function TeacherPage() {
  const [items, setItems] = React.useState<TeacherContentItem[]>([]);
  const [draft, setDraft] = React.useState<TeacherContentItem>(empty);
  const [audio, setAudio] = React.useState<Blob | null>(null);
  const [message, setMessage] = React.useState("");

  const refresh = React.useCallback(async () => setItems(await listTeacherContent()), []);
  React.useEffect(() => { void refresh(); }, [refresh]);

  async function save() {
    if (!draft.title.trim() || !draft.contextKey.trim()) { setMessage("Title and content key are required."); return; }
    const next: TeacherContentItem = {
      ...draft,
      title: draft.title.trim(),
      body: draft.body.trim(),
      contextKey: draft.contextKey.trim(),
      ...(audio ? { audioName: "human-recording", audioType: audio.type } : {}),
      updatedAt: new Date().toISOString(),
    };
    await saveTeacherContent(next, audio);
    setDraft(empty()); setAudio(null); setMessage("Content and human audio saved."); await refresh();
  }

  return <main className="teacher-page">
    <header className="teacher-hero"><a href="/" className="teacher-back"><ArrowLeft aria-hidden /> Back to app</a><div><span className="teacher-kicker">TEACHER AUTHORING</span><h1>Manage lessons and human audio</h1><p>Add or edit verbs, examples, exercises, and conversations. Uploaded or recorded human voices are used as the lesson audio; synthetic voices are not substituted.</p></div></header>
    <div className="teacher-layout">
      <section className="teacher-editor" aria-label="Content editor">
        <h2>{items.some((item) => item.id === draft.id) ? "Edit content" : "Add content"}</h2>
        <div className="teacher-grid">
          <label>Content type<select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as TeacherContentKind })}><option value="verb">Verb</option><option value="example">Example</option><option value="exercise">Exercise</option><option value="conversation">Conversation</option></select></label>
          <label>CEFR level<select value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value as TeacherContentItem["level"] })}>{["A1","A2","B1","B2","C1","C2"].map((level) => <option key={level}>{level}</option>)}</select></label>
        </div>
        <label>Title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Present perfect – life experience" /></label>
        <label>Content key<input value={draft.contextKey} onChange={(e) => setDraft({ ...draft, contextKey: e.target.value })} placeholder="e.g. grammar.present-perfect.example.1" /><small>Use this stable key wherever the audio and edited content should appear.</small></label>
        <label>Text<textarea rows={6} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></label>
        <fieldset><legend>Human-recorded audio</legend><label className="teacher-upload"><Upload aria-hidden /> Choose audio file<input accept="audio/*" onChange={(e) => setAudio(e.target.files?.[0] ?? null)} type="file" /></label><HumanAudioRecorder onRecorded={setAudio} />{draft.audioName && !audio ? <HumanAudioPlayer contentId={draft.id} /> : null}</fieldset>
        {message ? <p className="teacher-message" role="status">{message}</p> : null}
        <button className="teacher-primary-button" onClick={() => void save()} type="button"><Save aria-hidden /> Save content</button>
      </section>
      <section className="teacher-library"><div className="teacher-library-heading"><div><span className="teacher-kicker">LIBRARY</span><h2>Managed content</h2></div><button className="teacher-secondary-button" onClick={() => { setDraft(empty()); setAudio(null); }} type="button"><Plus aria-hidden /> New</button></div>
        {items.length ? <div className="teacher-items">{items.map((item) => <article key={item.id}><div className="teacher-item-meta"><span>{item.level}</span><span>{item.kind}</span><code>{item.contextKey}</code></div><h3>{item.title}</h3><p>{item.body}</p><HumanAudioPlayer compact contentId={item.id} /><div className="teacher-item-actions"><button onClick={() => { setDraft(item); setAudio(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} type="button"><Pencil aria-hidden /> Edit</button><button className="danger" onClick={async () => { await deleteTeacherContent(item.id); if (draft.id === item.id) setDraft(empty()); await refresh(); }} type="button"><Trash2 aria-hidden /> Delete</button></div></article>)}</div> : <div className="teacher-empty"><FileAudio aria-hidden /><h3>No teacher content yet</h3><p>Add the first item and attach a real human recording.</p></div>}
      </section>
    </div>
  </main>;
}
