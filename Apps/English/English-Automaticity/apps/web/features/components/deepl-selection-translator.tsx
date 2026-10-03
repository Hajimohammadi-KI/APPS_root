"use client";

import * as React from "react";
import { Languages, X } from "lucide-react";
import { translateWithGoogle } from "@/lib/desktop-deepl";

const targets = { DE: "German", EN: "English", FA: "Persian" } as const;

export function DeepLSelectionTranslator() {
  const [selection, setSelection] = React.useState("");
  const [position, setPosition] = React.useState<{ left: number; top: number } | null>(null);
  const [open, setOpen] = React.useState(false);
  const [target, setTarget] = React.useState<keyof typeof targets>("DE");
  const [translation, setTranslation] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const capture = () => {
      const selected = window.getSelection();
      const text = selected?.toString().trim() || "";
      const node = selected?.anchorNode?.parentElement;
      if (!text || text.length > 4_000 || node?.closest("input, textarea, select, [data-deepl-tool]")) {
        if (!open) setPosition(null);
        return;
      }
      const range = selected?.rangeCount ? selected.getRangeAt(0) : null;
      const rect = range?.getBoundingClientRect();
      if (!rect || (!rect.width && !rect.height)) return;
      setSelection(text);
      setTranslation("");
      setMessage("");
      setPosition({ left: Math.min(window.innerWidth - 152, Math.max(12, rect.left + rect.width / 2 - 70)), top: Math.max(12, rect.top - 48) });
    };
    document.addEventListener("mouseup", capture);
    document.addEventListener("keyup", capture);
    return () => { document.removeEventListener("mouseup", capture); document.removeEventListener("keyup", capture); };
  }, [open]);

  async function translate() {
    setBusy(true);
    setMessage("");
    try {
      const result = await translateWithGoogle({ text: selection, target });
      setTranslation(result.translation);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google Translation failed.");
    } finally { setBusy(false); }
  }

  if (!position && !open) return null;
  return (
    <div data-deepl-tool>
      {!open && position ? <button type="button" className="fixed z-[90] inline-flex min-h-10 items-center gap-2 rounded-xl border border-violet-300 bg-white px-3 text-sm font-bold text-violet-950 shadow-xl" style={position} onClick={() => setOpen(true)}><Languages className="size-4" />Translate</button> : null}
      {open ? <section aria-label="Google translation" className="fixed bottom-5 right-5 z-[95] w-[min(390px,calc(100vw-2rem))] rounded-2xl border-2 border-violet-600 bg-white p-4 text-slate-950 shadow-2xl">
        <div className="flex items-center gap-2"><Languages className="size-5 text-violet-700" /><strong>Translate with Google</strong><button type="button" className="ml-auto rounded-lg p-2 hover:bg-violet-50" aria-label="Close translation" onClick={() => { setOpen(false); setPosition(null); }}><X className="size-4" /></button></div>
        <p className="mt-3 max-h-24 overflow-auto rounded-xl bg-violet-50 p-3 text-sm leading-6">{selection}</p>
        <label className="mt-3 grid gap-1 text-sm font-semibold">Target language<select className="h-10 rounded-lg border border-violet-300 bg-white px-3" value={target} onChange={(event) => setTarget(event.target.value as keyof typeof targets)}>{Object.entries(targets).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
        <button type="button" className="mt-3 min-h-11 w-full rounded-xl bg-violet-700 px-4 font-bold text-white disabled:opacity-60" disabled={busy} onClick={() => void translate()}>{busy ? "Translating…" : "Translate"}</button>
        {translation ? <div className="mt-3 rounded-xl border border-violet-300 p-3"><strong className="text-sm">Translation</strong><p className="mt-1 whitespace-pre-wrap leading-6">{translation}</p></div> : null}
        {message ? <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm leading-6" role="alert">{message}</p> : null}
      </section> : null}
    </div>
  );
}
