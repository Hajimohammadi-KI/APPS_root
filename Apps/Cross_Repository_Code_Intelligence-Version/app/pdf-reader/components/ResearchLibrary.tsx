"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PDF_LIBRARY_STORE,
  createCitationKey,
  createPdfLibraryItem,
  formatApaCitation,
  formatBibTeX,
  sanitizePdfLibraryStore,
  upsertPdfLibraryItem,
  type PdfLibraryItem,
  type PdfLibrarySource,
  type PdfLibraryStatus,
} from "../../../lib/pdf-library";

type Props = {
  documentId: string;
  documentName: string;
  documentSource: PdfLibrarySource;
  pageCount: number;
  markCount: number;
  collectionIntent: string;
  onOpen: (item: PdfLibraryItem) => void;
  onToast: (message: string) => void;
};

const statusLabels: Record<PdfLibraryStatus, string> = {
  unread: "Ungelesen",
  reading: "In Arbeit",
  done: "Gelesen",
};

function editableList(value: string, separator: RegExp) {
  return value.split(separator).map((part) => part.trimStart());
}

function saveFile(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export default function ResearchLibrary({
  documentId,
  documentName,
  documentSource,
  pageCount,
  markCount,
  collectionIntent,
  onOpen,
  onToast,
}: Props) {
  const [items, setItems] = useState<PdfLibraryItem[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("all");
  const [status, setStatus] = useState<PdfLibraryStatus | "all">("all");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => createPdfLibraryItem({
    id: documentId,
    title: documentName,
    fileName: `${documentName}.pdf`,
    source: documentSource,
    pageCount,
    markCount,
  }));
  const importInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      // Hydrate the browser-owned research library after SSR; localStorage is unavailable during server rendering.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(sanitizePdfLibraryStore(JSON.parse(localStorage.getItem(PDF_LIBRARY_STORE) || "[]")));
    } catch {
      setItems([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(PDF_LIBRARY_STORE, JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    const existing = items.find((item) => item.id === documentId);
    const now = new Date().toISOString();
    // Keep the editor bound to the newly opened document and its persisted metadata.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(existing ? {
      ...existing,
      title: existing.title || documentName,
      fileName: existing.fileName || `${documentName}.pdf`,
      source: documentSource.kind === "sample" ? existing.source : documentSource,
      pageCount: Math.max(existing.pageCount, pageCount),
      markCount,
      lastOpenedAt: now,
    } : createPdfLibraryItem({
      id: documentId,
      title: documentName,
      fileName: `${documentName}.pdf`,
      source: documentSource,
      pageCount,
      markCount,
    }, now));
    setEditing(false);
  }, [documentId, documentName, documentSource, items, markCount, pageCount]);

  useEffect(() => {
    // Sidebar collection shortcuts intentionally drive this controlled filter.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (collectionIntent) setCollection(collectionIntent);
  }, [collectionIntent]);

  const currentSaved = items.some((item) => item.id === documentId);
  const collections = useMemo(
    () => [...new Set(items.flatMap((item) => item.collections))].sort((a, b) => a.localeCompare(b, "de")),
    [items],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const matchesQuery = !needle || [item.title, item.authors.join(" "), item.tags.join(" "), item.publication, item.doi, item.abstract]
        .join(" ").toLocaleLowerCase().includes(needle);
      const matchesCollection = collection === "all" || item.collections.includes(collection);
      const matchesStatus = status === "all" || item.status === status;
      return matchesQuery && matchesCollection && matchesStatus;
    });
  }, [collection, items, query, status]);

  const saveDraft = () => {
    const now = new Date().toISOString();
    const next = {
      ...draft,
      title: draft.title.trim() || documentName,
      fileName: draft.fileName.trim() || `${documentName}.pdf`,
      citationKey: draft.citationKey.trim() || createCitationKey(draft.title, draft.authors, draft.year),
      pageCount,
      markCount,
      source: documentSource.kind === "sample" && currentSaved ? draft.source : documentSource,
      updatedAt: now,
      lastOpenedAt: now,
    };
    setItems((current) => upsertPdfLibraryItem(current, next));
    setDraft(next);
    setEditing(false);
    onToast(currentSaved ? "Literaturangaben aktualisiert" : "PDF zur Bibliothek hinzugefügt");
  };

  const update = <K extends keyof PdfLibraryItem>(key: K, value: PdfLibraryItem[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const copyText = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      onToast(message);
    } catch {
      onToast("Kopieren war nicht möglich. Bitte den Export verwenden.");
    }
  };

  const exportJson = () => {
    saveFile(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), items }, null, 2), "research-library.json", "application/json");
    onToast("Bibliotheks-Backup exportiert");
  };

  const exportBib = () => {
    saveFile(items.map(formatBibTeX).join("\n\n"), "research-library.bib", "application/x-bibtex");
    onToast("BibTeX-Bibliothek exportiert");
  };

  const importJson = async (file?: File) => {
    if (!file) return;
    try {
      const imported = sanitizePdfLibraryStore(JSON.parse(await file.text()));
      if (!imported.length) throw new Error();
      setItems((current) => imported.reduce((result, item) => upsertPdfLibraryItem(result, item), current));
      onToast(`${imported.length} Bibliothekseinträge importiert`);
    } catch {
      onToast("Das Bibliotheks-Backup ist ungültig.");
    } finally {
      if (importInput.current) importInput.current.value = "";
    }
  };

  const remove = (item: PdfLibraryItem) => {
    if (!window.confirm(`„${item.title}“ aus der Bibliothek entfernen? PDF und Markierungen bleiben erhalten.`)) return;
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    onToast("Eintrag aus der Bibliothek entfernt");
  };

  return <div className="panel-content library-content">
    <section className="library-summary" aria-label="Bibliotheksübersicht">
      <div><small>FORSCHUNGSBIBLIOTHEK</small><strong>{items.length}</strong><span>Quellen</span></div>
      <div><small>IN ARBEIT</small><strong>{items.filter((item) => item.status === "reading").length}</strong><span>PDFs</span></div>
      <div><small>MARKIERUNGEN</small><strong>{items.reduce((sum, item) => sum + item.markCount, 0)}</strong><span>gesamt</span></div>
    </section>

    <section className="current-library-item">
      <div className="library-section-head"><div><small>AKTUELLES DOKUMENT</small><h3>{currentSaved ? "In deiner Bibliothek" : "Noch nicht gespeichert"}</h3></div><button type="button" className={draft.favorite ? "favorite active" : "favorite"} onClick={() => update("favorite", !draft.favorite)} aria-label={draft.favorite ? "Favorit entfernen" : "Als Favorit markieren"}>★</button></div>
      {!editing ? <>
        <strong>{draft.title}</strong>
        <p>{draft.authors.length ? draft.authors.join(", ") : "Autorinnen/Autoren noch ergänzen"}{draft.year ? ` · ${draft.year}` : ""}</p>
        <div className="library-meta-row"><span>{statusLabels[draft.status]}</span><span>{pageCount || "?"} Seiten</span><span>{markCount} Markierungen</span></div>
        <div className="library-actions"><button type="button" className="primary" onClick={saveDraft}>{currentSaved ? "Angaben aktualisieren" : "In Bibliothek speichern"}</button><button type="button" onClick={() => setEditing(true)}>Metadaten bearbeiten</button></div>
      </> : <form className="library-editor" onSubmit={(event) => { event.preventDefault(); saveDraft(); }}>
        <label>Titel<input value={draft.title} onChange={(event) => update("title", event.target.value)} /></label>
        <label>Autorinnen/Autoren<input value={draft.authors.join("; ")} onChange={(event) => update("authors", editableList(event.target.value, /[;\n]/))} placeholder="Patrick Lewis; Ethan Perez" /></label>
        <div className="library-editor-grid"><label>Jahr<input inputMode="numeric" value={draft.year ?? ""} onChange={(event) => update("year", event.target.value ? Number(event.target.value) : undefined)} /></label><label>Status<select value={draft.status} onChange={(event) => update("status", event.target.value as PdfLibraryStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
        <label>Zeitschrift / Konferenz<input value={draft.publication ?? ""} onChange={(event) => update("publication", event.target.value || undefined)} /></label>
        <div className="library-editor-grid"><label>DOI<input value={draft.doi ?? ""} onChange={(event) => update("doi", event.target.value || undefined)} /></label><label>Citation Key<input value={draft.citationKey} onChange={(event) => update("citationKey", event.target.value)} /></label></div>
        <label>Weblink<input type="url" value={draft.url ?? ""} onChange={(event) => update("url", event.target.value || undefined)} /></label>
        <label>Sammlungen<input value={draft.collections.join(", ")} onChange={(event) => update("collections", editableList(event.target.value, /[,;\n]/))} placeholder="Dissertation, Methoden" /></label>
        <label>Tags<input value={draft.tags.join(", ")} onChange={(event) => update("tags", editableList(event.target.value, /[,;\n]/))} placeholder="RAG, Evaluation, Related Work" /></label>
        <label>Abstract<textarea value={draft.abstract ?? ""} onChange={(event) => update("abstract", event.target.value || undefined)} /></label>
        <div className="library-actions"><button type="button" onClick={() => setEditing(false)}>Abbrechen</button><button type="submit" className="primary">Speichern</button></div>
      </form>}
      {currentSaved && !editing && <div className="citation-actions"><button type="button" onClick={() => void copyText(formatApaCitation(draft), "APA-Zitat kopiert")}>APA kopieren</button><button type="button" onClick={() => void copyText(formatBibTeX(draft), "BibTeX kopiert")}>BibTeX kopieren</button></div>}
    </section>

    <div className="library-tools">
      <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titel, Autor, DOI oder Tag suchen" aria-label="Bibliothek durchsuchen" />
      <div><select value={collection} onChange={(event) => setCollection(event.target.value)} aria-label="Sammlung filtern"><option value="all">Alle Sammlungen</option>{collections.map((value) => <option key={value} value={value}>{value}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value as PdfLibraryStatus | "all")} aria-label="Lesestatus filtern"><option value="all">Alle Status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="library-backup-actions"><button type="button" onClick={exportJson} disabled={!items.length}>Backup JSON</button><button type="button" onClick={exportBib} disabled={!items.length}>BibTeX</button><label>Backup importieren<input ref={importInput} type="file" accept="application/json,.json" onChange={(event) => void importJson(event.target.files?.[0])} /></label></div>
    </div>

    <section className="library-list" aria-live="polite">
      {filtered.length ? filtered.map((item) => <article className={`library-card ${item.id === documentId ? "current" : ""}`} key={item.id}>
        <button type="button" className="library-card-main" onClick={() => onOpen(item)}>
          <span className="library-card-icon" aria-hidden="true">▧</span>
          <span><strong>{item.favorite ? "★ " : ""}{item.title}</strong><small>{item.authors.length ? item.authors.join(", ") : "Autor unbekannt"}{item.year ? ` · ${item.year}` : ""}</small><small>{statusLabels[item.status]} · {item.markCount} Markierungen</small></span>
        </button>
        <div className="library-card-tags">{item.collections.slice(0, 2).map((value) => <span key={value}>{value}</span>)}{item.tags.slice(0, 3).map((value) => <span key={value}>#{value}</span>)}</div>
        <div className="library-card-actions"><button type="button" onClick={() => void copyText(formatApaCitation(item), "APA-Zitat kopiert")}>APA</button><button type="button" onClick={() => void copyText(formatBibTeX(item), "BibTeX kopiert")}>BibTeX</button><button type="button" className="danger-link" onClick={() => remove(item)}>Entfernen</button></div>
      </article>) : <div className="empty-notes">Keine passende Quelle gefunden.</div>}
    </section>
    <p className="library-device-note">Die Bibliothek wird auf diesem Gerät gespeichert. Mit JSON-Backup kannst du sie sicher auf Windows, Tablet oder Android übertragen. PDF-Dateien selbst werden nicht dupliziert.</p>
  </div>;
}
