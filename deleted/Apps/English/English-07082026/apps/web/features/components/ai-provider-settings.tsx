"use client";

import * as React from "react";
import { KeyRound, Save, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
}: {
  onConnected: () => void;
}) {
  const [provider, setProvider] = React.useState<AIProviderId>("openai");
  const [model, setModel] = React.useState(DEFAULT_MODELS.openai);
  const [apiKey, setApiKey] = React.useState("");
  const [baseUrl, setBaseUrl] = React.useState("http://127.0.0.1:11434");
  const [status, setStatus] = React.useState<AIProviderStatus | null>(null);
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    readAIProviderStatus()
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
        baseUrl: provider === "openai-compatible" ? baseUrl : undefined,
      });
      setStatus(next);
      setApiKey("");
      onConnected();
      setMessage(
        `${next.providerLabel} is connected for all three installed apps.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "AI connection failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="rounded-xl border p-4">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-bold">
        <KeyRound aria-hidden className="size-4" />
        Connected AI for "Explain More"
        <span className="ml-auto text-xs font-medium text-muted-foreground">
          {status?.connected ? status.providerLabel : "Optional"}
        </span>
      </summary>
      <div className="mt-4 grid gap-4">
        <p className="text-sm leading-6 text-muted-foreground">
          A ChatGPT subscription is not an API connection. Use an API key from
          the provider console. Never enter your ChatGPT, Claude, or Google
          password. The key is encrypted for this Windows user and never
          included in exports or installer packages.
        </p>
        {status?.storage === "Central Study Tracker" ? (
          <div className="grid gap-3 rounded-xl border bg-secondary p-3 text-sm">
            <p>
              OpenAI is connected through Central Settings. This app uses the
              same encrypted connection; the API key is never copied here.
            </p>
            <Button
              onClick={() =>
                window.open("http://127.0.0.1:4312/settings", "_blank", "noopener,noreferrer")
              }
              variant="outline"
            >
              Open Central Settings
            </Button>
          </div>
        ) : !status?.available ? (
          <p className="rounded-xl border bg-secondary p-3 text-sm">
            Open Central Settings or the installed Windows app to connect an
            API account securely. Offline explanations still work.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Label className="grid gap-2">
                Provider
                <Select
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
                    OpenAI-compatible / local
                  </option>
                </Select>
              </Label>
              <Label className="grid gap-2">
                Model
                <Input
                  autoComplete="off"
                  onChange={(event) => setModel(event.target.value)}
                  value={model}
                />
              </Label>
            </div>
            {provider === "openai-compatible" ? (
              <Label className="grid gap-2">
                Endpoint
                <Input
                  autoComplete="url"
                  onChange={(event) => setBaseUrl(event.target.value)}
                  placeholder="https://provider.example or http://127.0.0.1:11434"
                  type="url"
                  value={baseUrl}
                />
              </Label>
            ) : null}
            <Label className="grid gap-2">
              Provider API key
              <Input
                autoComplete="off"
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Stored encrypted; not visible later"
                type="password"
                value={apiKey}
              />
            </Label>
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy || apiKey.trim().length < 8} onClick={save}>
                <Save aria-hidden className="size-4" />
                Save connection
              </Button>
              {status?.connected ? (
                <Button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      setStatus(await disconnectAIProvider());
                      setMessage(
                        "AI connection removed for this Windows user.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                  variant="outline"
                >
                  <Unplug aria-hidden className="size-4" />
                  Disconnect
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
