"use client";

import { useEffect, useState } from "react";
import { KeyRound, Save, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  configureAIProvider,
  disconnectAIProvider,
  readAIProviderStatus,
  type AIProviderId,
  type AIProviderStatus,
} from "@/lib/desktop-ai";

const DEFAULT_MODELS: Readonly<Record<AIProviderId, string>> = {
  openai: "gpt-5.6-luna",
  anthropic: "claude-opus-4-8",
  gemini: "gemini-3.6-flash",
  "openai-compatible": "local-model",
};

export function AIProviderSettings({
  onConnected,
}: Readonly<{ onConnected: () => void }>) {
  const [provider, setProvider] = useState<AIProviderId>("openai");
  const [model, setModel] = useState(DEFAULT_MODELS.openai);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("http://127.0.0.1:11434");
  const [status, setStatus] = useState<AIProviderStatus | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void readAIProviderStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const next = await configureAIProvider({
        provider,
        apiKey,
        model,
        ...(provider === "openai-compatible" ? { baseUrl } : {}),
      });
      setStatus(next);
      setApiKey("");
      onConnected();
      setMessage(
        `${next.providerLabel} ist für alle drei installierten Apps verbunden.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Die KI-Verbindung ist fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="rounded-xl border p-4">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-bold">
        <KeyRound aria-hidden="true" className="size-4" />
        Verbundene KI für „Mehr erklären“
        <span className="ml-auto text-xs font-medium text-muted-foreground">
          {status?.connected ? status.providerLabel : "Optional"}
        </span>
      </summary>
      <div className="mt-4 grid gap-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Ein ChatGPT-Abo ist keine API-Verbindung. Verwende einen API-Schlüssel
          aus der Konsole des Anbieters und niemals dein ChatGPT-, Claude- oder
          Google-Passwort. Der Schlüssel wird für diesen Windows-Benutzer
          verschlüsselt und nie exportiert oder in das Setup eingebaut.
        </p>
        {status?.storage === "Zentrales Lernstudio" ? (
          <div className="grid gap-3 rounded-xl border bg-muted p-3 text-sm">
            <p>
              OpenAI ist über die zentralen Einstellungen verbunden. Diese App
              verwendet dieselbe verschlüsselte Verbindung; der API-Schlüssel
              wird nicht hierher kopiert.
            </p>
            <Button
              onClick={() =>
                window.open(
                  "http://127.0.0.1:4312/settings",
                  "_blank",
                  "noopener,noreferrer",
                )
              }
              variant="outline"
            >
              Zentrale Einstellungen öffnen
            </Button>
          </div>
        ) : !status?.available ? (
          <p className="rounded-xl border bg-muted p-3 text-sm">
            Öffne die zentralen Einstellungen oder die installierte Windows-App,
            um ein API-Konto sicher zu verbinden. Offline-Erklärungen bleiben
            verfügbar.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Anbieter
                <select
                  className="h-10 rounded-lg border bg-background px-3"
                  onChange={(event) => {
                    const next = event.target.value as AIProviderId;
                    setProvider(next);
                    setModel(DEFAULT_MODELS[next]);
                  }}
                  value={provider}
                >
                  <option value="openai">OpenAI API</option>
                  <option value="anthropic">Claude API</option>
                  <option value="gemini">Gemini API</option>
                  <option value="openai-compatible">
                    OpenAI-kompatibel / lokal
                  </option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Modell
                <Input
                  autoComplete="off"
                  onChange={(event) => setModel(event.target.value)}
                  value={model}
                />
              </label>
            </div>
            {provider === "openai-compatible" ? (
              <label className="grid gap-2 text-sm font-medium">
                Endpunkt
                <Input
                  autoComplete="url"
                  onChange={(event) => setBaseUrl(event.target.value)}
                  placeholder="https://anbieter.example oder http://127.0.0.1:11434"
                  type="url"
                  value={baseUrl}
                />
              </label>
            ) : null}
            <label className="grid gap-2 text-sm font-medium">
              API-Schlüssel des Anbieters
              <Input
                autoComplete="off"
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Verschlüsselt gespeichert; wird nicht erneut angezeigt"
                type="password"
                value={apiKey}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy || apiKey.trim().length < 8}
                onClick={save}
              >
                <Save aria-hidden="true" />
                Verbindung speichern
              </Button>
              {status?.connected ? (
                <Button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      setStatus(await disconnectAIProvider());
                      setMessage(
                        "KI-Verbindung für diesen Windows-Benutzer entfernt.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                  variant="outline"
                >
                  <Unplug aria-hidden="true" />
                  Trennen
                </Button>
              ) : null}
            </div>
          </>
        )}
        {message ? (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}
      </div>
    </details>
  );
}
