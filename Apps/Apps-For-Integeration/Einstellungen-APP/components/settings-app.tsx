"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import SettingsHub from "./settings-hub";
import { ConnectionStatus } from "./provider-setup";
import { READING_RULER_EVENT } from "./reading-ruler";
import { DEFAULT_WERKZEUG_SETTINGS, isTrustedOrigin, normalizeWerkzeugSettings, settingsForClient, WerkzeugSettings } from "../lib/werkzeug-settings";
import { DEVICE_ONLY_STORAGE } from "../lib/storage-mode";
import type { PlatformStatusResponse } from "../lib/platform-status";

const EMPTY_CONNECTIONS: ConnectionStatus = {
  callbackUrl: "",
  google: { configured: false, connected: false, state: "not_configured", services: {} },
  openai: { configured: false, state: "not_configured", metadata: {} },
  deepl: { configured: false, state: "not_configured", metadata: {} },
};

export default function SettingsApp() {
  const [settings, setSettings] = useState<WerkzeugSettings>(DEFAULT_WERKZEUG_SETTINGS);
  const [saveState, setSaveState] = useState("Wird geladen …");
  const [toast, setToast] = useState("");
  const [embed, setEmbed] = useState(false);
  const [connections, setConnections] = useState<ConnectionStatus>(EMPTY_CONNECTIONS);
  const [platform, setPlatform] = useState<PlatformStatusResponse | null>(null);
  const settingsRef = useRef(settings);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => { setToast(message); setTimeout(() => setToast(""), 3000); };
  const refreshConnections = useCallback(async () => {
    if (DEVICE_ONLY_STORAGE) return;
    try {
      const response = await fetch("/api/providers", { cache: "no-store" });
      if (!response.ok) throw new Error("provider_status_failed");
      const data = await response.json() as ConnectionStatus;
      setConnections({ ...EMPTY_CONNECTIONS, ...data });
    } catch { setConnections((current) => current); }
  }, []);
  const refreshPlatform = useCallback(async () => {
    try {
      const response = await fetch("/api/platform/status", { cache: "no-store" });
      if (!response.ok) throw new Error("platform_status_failed");
      setPlatform(await response.json() as PlatformStatusResponse);
    } catch {
      setPlatform(null);
    }
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    queueMicrotask(() => setEmbed(params.get("embed") === "1" || params.get("embed") === "settings"));
    const googleResult = params.get("google");
    if (googleResult === "connected") setTimeout(() => showToast("Google-Freigabe wurde übernommen und wird jetzt live geprüft."), 150);
    if (googleResult === "cancelled") setTimeout(() => showToast("Die Google-Anmeldung wurde abgebrochen; es wurde nichts geändert."), 150);
    if (googleResult === "disconnected") setTimeout(() => showToast("Die Google-Verbindung wurde getrennt."), 150);
    if (googleResult === "config") setTimeout(() => showToast("Die sichere Google-Serverkonfiguration muss zuerst abgeschlossen werden."), 150);
    if (googleResult === "failed" || googleResult === "invalid") setTimeout(() => showToast("Die Google-Freigabe konnte nicht bestätigt werden."), 150);
    const cached = localStorage.getItem("einstellungen-settings-v1") || localStorage.getItem("werkzeug-settings-v1");
    if (cached) {
      try { const localSettings = normalizeWerkzeugSettings(JSON.parse(cached)); queueMicrotask(() => setSettings(localSettings)); } catch { /* use defaults */ }
    }
    if (DEVICE_ONLY_STORAGE) {
      hydrated.current = true;
      queueMicrotask(() => setSaveState("Auf diesem Gerät gespeichert"));
    } else {
      fetch("/api/settings").then((response) => response.ok ? response.json() as Promise<{ settings?: unknown; persistent?: boolean }> : Promise.reject()).then((settingsData) => {
        if (settingsData?.settings) setSettings(normalizeWerkzeugSettings(settingsData.settings));
        setSaveState(settingsData?.persistent ? "Sicher gespeichert" : "Auf diesem Gerät gespeichert");
      }).catch(() => setSaveState("Auf diesem Gerät gespeichert")).finally(() => { hydrated.current = true; });
    }
    queueMicrotask(() => void refreshConnections());
    queueMicrotask(() => void refreshPlatform());
  }, [refreshConnections, refreshPlatform]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object" || !event.source) return;
      const type = String(event.data.type || "");
      const namespace = type.startsWith("einstellungen:settings:") ? "einstellungen" : type.startsWith("werkzeug:settings:") ? "werkzeug" : null;
      if (!namespace) return;
      const allowed = isTrustedOrigin(settingsRef.current, event.origin, location.origin);
      const source = event.source as Window;
      const reply = (message: Record<string, unknown>) => source.postMessage({ protocol: "1.0", requestId: event.data.requestId, ...message }, { targetOrigin: event.origin });
      if (!allowed) return reply({ type: `${namespace}:settings:error`, error: "origin_not_trusted" });
      if ([`${namespace}:settings:init`, `${namespace}:settings:get`, `${namespace}:settings:subscribe`].includes(type)) {
        const requested = Array.isArray(event.data.payload?.sections) ? event.data.payload.sections.map(String) : undefined;
        reply({ type: `${namespace}:settings:state`, payload: settingsForClient(settingsRef.current, event.origin, requested) });
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  useEffect(() => {
    const receiveReadingRuler = (event: Event) => {
      const detail = (event as CustomEvent<WerkzeugSettings>).detail;
      if (typeof detail?.accessibility?.readingRuler !== "boolean") return;
      setSettings((current) => current.accessibility.readingRuler === detail.accessibility.readingRuler
        ? current
        : normalizeWerkzeugSettings({
          ...current,
          accessibility: {
            ...current.accessibility,
            readingRuler: detail.accessibility.readingRuler,
          },
        }));
    };
    window.addEventListener(READING_RULER_EVENT, receiveReadingRuler);
    return () => window.removeEventListener(READING_RULER_EVENT, receiveReadingRuler);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    settingsRef.current = settings;
    localStorage.setItem("einstellungen-settings-v1", JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(READING_RULER_EVENT, { detail: settings }));
    setSaveState("Wird gespeichert …");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (DEVICE_ONLY_STORAGE) {
        setSaveState("Auf diesem Gerät gespeichert");
      } else {
        try {
          const response = await fetch("/api/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ settings }) });
          const data = await response.json() as { persistent?: boolean };
          setSaveState(data.persistent ? "Sicher gespeichert" : "Auf diesem Gerät gespeichert");
        } catch { setSaveState("Auf diesem Gerät gespeichert"); }
      }
      if (window.parent !== window && document.referrer) {
        try {
          const parentOrigin = new URL(document.referrer).origin;
          if (isTrustedOrigin(settings, parentOrigin, location.origin)) window.parent.postMessage({ type: "einstellungen:settings:changed", protocol: "1.0", payload: settingsForClient(settings, parentOrigin) }, parentOrigin);
        } catch { /* invalid referrer */ }
      }
    }, 650);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [settings]);

  const classNames = [
    "werkzeug",
    "settings-app",
    embed ? "embed" : "",
    settings.accessibility.largerText ? "larger-text" : "",
    settings.accessibility.generousLineHeight ? "generous-lines" : "",
    settings.accessibility.reducedMotion ? "reduced-motion" : "",
    settings.accessibility.focusMode ? "focus-mode" : "",
  ].filter(Boolean).join(" ");

  return <>
    {/* The same skip-link contract is used by every active desktop web app. */}
    <a className="skip-link" href="#main-content">Zum Hauptinhalt springen</a>
    <main className={classNames} id="main-content" tabIndex={-1}>
    <header className="topbar settings-topbar">
      <Link className="brand" href={settings.integration.links.settingsUrl}><span>E</span><div><b>{settings.labels.appName}</b><small>{settings.labels.appSubtitle}</small></div></Link>
      <nav className="header-status" aria-label="App-Navigation"><span className="secure" role="status" aria-live="polite">● {saveState}</span><Link className="header-link" href={settings.integration.links.homeUrl}>← Zurück zur App</Link></nav>
    </header>
    <section className="settings-content">
      <section className="settings-platform-card" aria-label="Systemstatus" aria-live="polite">
        <div className="settings-platform-heading">
          <span className="settings-platform-icon">API</span>
          <div><b>Gemeinsame Systemverbindung</b><small>PDF Reader, Einstellungen und verbundene Lern-Apps verwenden dieselben freigegebenen Dienste.</small></div>
        </div>
        <div className="settings-platform-items">
          <span className={`settings-platform-pill ${platform?.api.connected ? "ok" : "compat"}`}><b>Backend</b>{platform?.api.connected ? "NestJS + Bun aktiv" : "Next.js-Kompatibilitätsmodus"}</span>
          <span className={`settings-platform-pill ${platform?.database.reachable ? "ok" : "failed"}`}><b>Daten</b>{platform?.database.provider === "neon" ? "Neon" : "Lokal"}</span>
          <span className={`settings-platform-pill ${connections.openai.state === "connected" ? "ok" : "waiting"}`}><b>OpenAI</b>{connections.openai.state === "connected" ? "Verbunden" : "Nicht verbunden"}</span>
          <span className={`settings-platform-pill ${connections.deepl.state === "connected" ? "ok" : "waiting"}`}><b>DeepL</b>{connections.deepl.state === "connected" ? "Verbunden" : "Nicht verbunden"}</span>
        </div>
        <div className="settings-platform-foot"><span>{platform?.api.message || "Systemstatus wird geprüft …"}</span><button type="button" onClick={() => void Promise.all([refreshPlatform(), refreshConnections()])}>Erneut prüfen</button></div>
      </section>
      <SettingsHub settings={settings} onChange={setSettings} onToast={showToast} saveState={saveState} connections={connections} onConnectionsRefresh={refreshConnections}/>
    </section>
    {toast && <div className="toast" role="status" aria-live="polite">✓ {toast}</div>}
    </main>
  </>;
}
