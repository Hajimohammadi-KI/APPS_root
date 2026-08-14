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

// OpenAI and DeepL are both a plain API-key form (key + one extra field + save/test/remove);
// only Google is a distinct OAuth flow, so it stays its own markup below.
type ApiKeyProviderCardProps = {
  icon: string;
  title: string;
  description: string;
  state: ProviderState;
  configured: boolean;
  keyValue: string;
  onKeyChange: (value: string) => void;
  keyPlaceholder: string;
  extraField: React.ReactNode;
  hint?: React.ReactNode;
  busy: boolean;
  onSubmit: (event: FormEvent) => void;
  onRemove?: () => void;
  footLink: { href: string; label: string };
  footExtra?: React.ReactNode;
  message?: string;
};

function ApiKeyProviderCard(props: ApiKeyProviderCardProps) {
  return (
    <article className="provider-card">
      <div className="permission-title">
        <span className="integration-icon">{props.icon}</span>
        <div><h3>{props.title}</h3><p>{props.description}</p></div>
        <em className={badgeClass(props.state)}>{stateText[props.state]}</em>
      </div>
      <form className="provider-form stacked" onSubmit={props.onSubmit}>
        <label><span>API-Schlüssel</span><input type="password" value={props.keyValue} onChange={(event) => props.onKeyChange(event.target.value)} placeholder={props.keyPlaceholder} autoComplete="new-password"/></label>
        {props.extraField}
        {props.hint}
        <div className="provider-actions"><button className="primary action" disabled={props.busy}>{props.busy ? "Verbindung wird geprüft …" : "Speichern & Verbindung testen"}</button>{props.configured && props.onRemove ? <button type="button" className="danger-button compact" onClick={props.onRemove}>Entfernen</button> : null}</div>
      </form>
      <div className="provider-foot"><a href={props.footLink.href} target="_blank" rel="noreferrer">{props.footLink.label} ↗</a>{props.footExtra}</div>
      {props.message ? <p className="provider-message">{props.message}</p> : null}
    </article>
  );
}

export default function ProviderSetup({ connections, scopes, labels, onRefresh, onToast }: Props) {
  const [openaiKey, setOpenaiKey] = useState("");
  const [deeplKey, setDeeplKey] = useState("");
  const [deeplTier, setDeeplTier] = useState<"free" | "pro">("free");
  const [openaiModel, setOpenaiModel] = useState(String(connections.openai.metadata?.model || DEFAULT_OPENAI_MODEL));
  const [busy, setBusy] = useState("");
  const [messages, setMessages] = useState<Record<string, string>>({});
  const googleServices = useMemo(() => {
    const requested = scopes.split(",").filter((service) => ["calendar", "gmail", "drive", "translate"].includes(service));
    if (!requested.includes("translate")) requested.push("translate");
    return requested.length ? requested.join(",") : "calendar,drive,translate";
  }, [scopes]);

  useEffect(() => {
    const model = connections.openai.metadata?.model;
    if (model) queueMicrotask(() => setOpenaiModel(String(model)));
  }, [connections.openai.metadata?.model]);

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
    if (!window.confirm(`${provider === "deepl" ? labels.deepl : labels.openai} wirklich entfernen?`)) return;
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
      <ApiKeyProviderCard
        icon="AI"
        title={labels.openai}
        description="OpenAI verwendet keinen Google-Login. Dafür wird einmalig ein eigener API-Schlüssel benötigt."
        state={connections.openai.state}
        configured={connections.openai.configured}
        keyValue={openaiKey}
        onKeyChange={setOpenaiKey}
        keyPlaceholder={connections.openai.configured ? `Gespeichert ${String(connections.openai.metadata?.keyHint || "")}` : "sk-…"}
        extraField={<label><span>Modell</span><input value={openaiModel} onChange={(event) => setOpenaiModel(event.target.value)} placeholder={DEFAULT_OPENAI_MODEL}/></label>}
        hint={<p className="provider-model-hint">Empfohlen für wissenschaftliche Erklärungen und mehrsprachige Übersetzungen: <code>{DEFAULT_OPENAI_MODEL}</code>. Der Modellname bleibt editierbar.</p>}
        busy={busy === "openai"}
        onSubmit={saveOpenAI}
        onRemove={() => void remove("openai")}
        footLink={{ href: "https://platform.openai.com/api-keys", label: "OpenAI API-Schlüssel öffnen" }}
        footExtra={<span>Letzter Test: {dateLabel(connections.openai.testedAt)}</span>}
        message={messages.openai || String(connections.openai.metadata?.message || "") || undefined}
      />
      <ApiKeyProviderCard
        icon="文"
        title={`${labels.deepl} API`}
        description="DeepL API Free übersetzt ausgewählten PDF-Text zwischen Deutsch und Englisch. Der Schlüssel wird verschlüsselt auf dem lokalen Server gespeichert und nie an den Browser zurückgegeben."
        state={connections.deepl.state}
        configured={connections.deepl.configured}
        keyValue={deeplKey}
        onKeyChange={setDeeplKey}
        keyPlaceholder={connections.deepl.configured ? `Gespeichert ${String(connections.deepl.metadata?.keyHint || "")}` : "DeepL Auth Key"}
        extraField={<label><span>Tarif</span><select value={deeplTier} onChange={(event) => setDeeplTier(event.target.value as "free" | "pro")}><option value="free">DeepL API Free</option><option value="pro">DeepL API Pro</option></select></label>}
        busy={busy === "deepl"}
        onSubmit={saveDeepL}
        onRemove={() => void remove("deepl")}
        footLink={{ href: "https://www.deepl.com/account/summary", label: "DeepL API-Konto öffnen" }}
        footExtra={<span>Deutsch · Englisch · kein Persisch</span>}
        message={messages.deepl || String(connections.deepl.metadata?.message || "") || undefined}
      />
    </div>
  </div>;
}
