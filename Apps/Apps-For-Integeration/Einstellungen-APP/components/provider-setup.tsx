"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DEFAULT_OPENAI_MODEL } from "../lib/model-config";

export type ProviderState = "not_configured" | "untested" | "connected" | "expired" | "quota_exhausted" | "error";
export type ProviderStatus = { configured: boolean; state: ProviderState; metadata?: Record<string, unknown>; testedAt?: string | null; message?: string; connected?: boolean; account?: string; services?: { calendar?: boolean; gmail?: boolean; drive?: boolean } };
export type ConnectionStatus = { callbackUrl: string; google: ProviderStatus; openai: ProviderStatus; deepl: ProviderStatus };

type Props = {
  connections: ConnectionStatus;
  scopes: string;
  labels: { google: string; calendar: string; gmail: string; drive: string; openai: string; deepl: string };
  onRefresh: () => Promise<void>;
  onToast: (message: string) => void;
};

const stateText: Record<ProviderState, string> = {
  not_configured: "App-Konfiguration fehlt",
  untested: "Noch nicht verbunden",
  connected: "Verbunden und geprüft",
  expired: "Verbindung abgelaufen",
  quota_exhausted: "Kontingent aufgebraucht",
  error: "Prüfung fehlgeschlagen",
};

function badgeClass(state: ProviderState) { return state === "connected" ? "ready" : state === "untested" || state === "not_configured" ? "waiting" : "failed"; }
function dateLabel(value?: string | null) { return value ? new Date(value).toLocaleString("de-DE") : "Noch nicht geprüft"; }

export default function ProviderSetup({ connections, scopes, labels, onRefresh, onToast }: Props) {
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState(String(connections.openai.metadata?.model || DEFAULT_OPENAI_MODEL));
  const [deeplKey, setDeeplKey] = useState("");
  const [deeplTier, setDeeplTier] = useState<"free" | "pro">((connections.deepl.metadata?.tier as "free" | "pro") || "free");
  const [busy, setBusy] = useState("");
  const [messages, setMessages] = useState<Record<string, string>>({});
  const googleServices = useMemo(() => {
    const requested = scopes.split(",").filter((service) => ["calendar", "gmail", "drive"].includes(service));
    return requested.length ? requested.join(",") : "calendar,drive";
  }, [scopes]);

  useEffect(() => {
    const model = connections.openai.metadata?.model;
    if (model) queueMicrotask(() => setOpenaiModel(String(model)));
  }, [connections.openai.metadata?.model]);

  useEffect(() => {
    const tier = connections.deepl.metadata?.tier;
    if (tier === "free" || tier === "pro") queueMicrotask(() => setDeeplTier(tier));
  }, [connections.deepl.metadata?.tier]);

  const submit = async (provider: "openai" | "deepl", payload: Record<string, unknown>) => {
    setBusy(provider);
    setMessages((current) => ({ ...current, [provider]: "" }));
    try {
      const response = await fetch("/api/providers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, ...payload }) });
      const data = await response.json() as { message?: string };
      setMessages((current) => ({ ...current, [provider]: data.message || (response.ok ? "Gespeichert." : "Verbindung fehlgeschlagen.") }));
      if (!response.ok) { await onRefresh(); return; }
      if (provider === "openai") setOpenaiKey("");
      if (provider === "deepl") setDeeplKey("");
      onToast(data.message || "Verbindung gespeichert");
      await onRefresh();
    } catch {
      setMessages((current) => ({ ...current, [provider]: "Der Dienst konnte nicht erreicht werden." }));
    } finally {
      setBusy("");
    }
  };

  const remove = async (provider: "openai" | "deepl") => {
    if (!window.confirm(`${provider === "openai" ? labels.openai : labels.deepl} wirklich entfernen?`)) return;
    setBusy(provider);
    try {
      const response = await fetch("/api/providers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider }) });
      const data = await response.json() as { message?: string };
      onToast(data.message || "Verbindung entfernt");
      await onRefresh();
    } finally {
      setBusy("");
    }
  };

  const disconnectGoogle = async () => {
    setBusy("google");
    try {
      const response = await fetch("/api/google/disconnect", { method: "POST" });
      const data = await response.json() as { message?: string };
      onToast(data.message || "Google wurde getrennt.");
      await onRefresh();
    } finally {
      setBusy("");
    }
  };

  const connectGoogle = () => {
    const params = new URLSearchParams({ services: googleServices, returnTo: "/settings" });
    window.location.assign(`/api/google/auth?${params}`);
  };

  const saveOpenAI = (event: FormEvent) => { event.preventDefault(); void submit("openai", { apiKey: openaiKey, model: openaiModel }); };
  const saveDeepL = (event: FormEvent) => { event.preventDefault(); void submit("deepl", { apiKey: deeplKey, tier: deeplTier }); };

  return <div className="provider-setup">
    <article className="permission-card featured provider-card google-one-click-card">
      <div className="permission-title"><span className="integration-icon">G</span><div><h3>Google Calendar &amp; Drive</h3><p>Ein Klick öffnet die offizielle Google-Anmeldung. E-Mail und Passwort werden ausschließlich bei Google eingegeben und niemals von dieser App gelesen.</p></div><em className={badgeClass(connections.google.state)}>{stateText[connections.google.state]}</em></div>
      <div className="provider-actions google-one-click-actions">
        <button type="button" className="primary action" disabled={!connections.google.configured || busy === "google"} onClick={connectGoogle}>{busy === "google" ? "Bitte warten …" : connections.google.connected ? "Google-Konto erneut verbinden" : "Mit Google verbinden"}</button>
        <button type="button" className="action secondary" disabled={busy === "google"} onClick={() => void onRefresh()}>Verbindung prüfen</button>
        {connections.google.connected ? <button type="button" className="danger-button compact" disabled={busy === "google"} onClick={() => void disconnectGoogle()}>Verbindung trennen</button> : null}
      </div>
      {connections.google.configured ? <p className="provider-message google-safety-note">Nach dem Klick wählst du dein Google-Konto aus und bestätigst Calendar und Drive. Die App speichert nur die verschlüsselte Freigabe, niemals dein Google-Passwort.</p> : <p className="provider-message" role="alert">Die Google-Konfiguration der Installation fehlt. Bitte die App über „Reparieren“ aktualisieren; Benutzer müssen keine technischen Schlüssel eingeben.</p>}
      <div className="provider-foot"><span>Konto: {connections.google.account || "Noch kein Konto ausgewählt"}</span><span>Letzter Test: {dateLabel(connections.google.testedAt)}</span></div>
      <div className="service-tests" aria-label="Google-Dienststatus">
        <span className={connections.google.services?.calendar ? "ok" : "off"}>{labels.calendar}</span>
        <span className={connections.google.services?.drive ? "ok" : "off"}>{labels.drive}</span>
        {googleServices.includes("gmail") ? <span className={connections.google.services?.gmail ? "ok" : "off"}>{labels.gmail}</span> : null}
      </div>
      {(messages.google || connections.google.message) ? <p className="provider-message" role="status">{messages.google || connections.google.message}</p> : null}
    </article>

    <div className="provider-grid provider-config-grid">
      <article className="provider-card"><div className="permission-title"><span className="integration-icon">AI</span><div><h3>{labels.openai}</h3><p>OpenAI verwendet keinen Google-Login. Dafür wird einmalig ein eigener API-Schlüssel benötigt.</p></div><em className={badgeClass(connections.openai.state)}>{stateText[connections.openai.state]}</em></div>
        <form className="provider-form stacked" onSubmit={saveOpenAI}><label><span>API-Schlüssel</span><input type="password" value={openaiKey} onChange={(event) => setOpenaiKey(event.target.value)} placeholder={connections.openai.configured ? `Gespeichert ${String(connections.openai.metadata?.keyHint || "")}` : "sk-…"} autoComplete="new-password"/></label><label><span>Modell</span><input value={openaiModel} onChange={(event) => setOpenaiModel(event.target.value)} placeholder={DEFAULT_OPENAI_MODEL}/></label><p className="provider-model-hint">Empfohlen für wissenschaftliche Erklärungen und mehrsprachige Übersetzungen: <code>{DEFAULT_OPENAI_MODEL}</code>. Der Modellname bleibt editierbar.</p><div className="provider-actions"><button className="primary action" disabled={busy === "openai"}>{busy === "openai" ? "Verbindung wird geprüft …" : "Speichern & Verbindung testen"}</button>{connections.openai.configured ? <button type="button" className="danger-button compact" onClick={() => void remove("openai")}>Entfernen</button> : null}</div></form>
        <div className="provider-foot"><a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">OpenAI API-Schlüssel öffnen ↗</a><span>Letzter Test: {dateLabel(connections.openai.testedAt)}</span></div>{(messages.openai || String(connections.openai.metadata?.message || "")) ? <p className="provider-message">{messages.openai || String(connections.openai.metadata?.message || "")}</p> : null}
      </article>
      <article className="provider-card"><div className="permission-title"><span className="integration-icon">文</span><div><h3>{labels.deepl}</h3><p>DeepL verwendet keinen Google-Login. Free oder Pro auswählen und den eigenen API-Schlüssel einmalig speichern.</p></div><em className={badgeClass(connections.deepl.state)}>{stateText[connections.deepl.state]}</em></div>
        <form className="provider-form stacked" onSubmit={saveDeepL}><label><span>API-Schlüssel</span><input type="password" value={deeplKey} onChange={(event) => setDeeplKey(event.target.value)} placeholder={connections.deepl.configured ? `Gespeichert ${String(connections.deepl.metadata?.keyHint || "")}` : "DeepL Auth Key"} autoComplete="new-password"/></label><label><span>API-Version</span><select value={deeplTier} onChange={(event) => setDeeplTier(event.target.value as "free" | "pro")}><option value="free">DeepL API Free</option><option value="pro">DeepL API Pro</option></select></label><div className="provider-actions"><button className="primary action" disabled={busy === "deepl"}>{busy === "deepl" ? "Verbindung wird geprüft …" : "Speichern & Verbindung testen"}</button>{connections.deepl.configured ? <button type="button" className="danger-button compact" onClick={() => void remove("deepl")}>Entfernen</button> : null}</div></form>
        <div className="provider-foot"><a href="https://www.deepl.com/account/summary" target="_blank" rel="noreferrer">DeepL-Konto öffnen ↗</a><span>Letzter Test: {dateLabel(connections.deepl.testedAt)}</span></div>{(messages.deepl || String(connections.deepl.metadata?.message || "")) ? <p className="provider-message">{messages.deepl || String(connections.deepl.metadata?.message || "")}</p> : null}
      </article>
    </div>
  </div>;
}

