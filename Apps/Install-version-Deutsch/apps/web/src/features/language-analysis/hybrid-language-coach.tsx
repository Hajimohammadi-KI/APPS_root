"use client";

import * as React from "react";
import { Brain, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SelectMenu } from "@/components/ui/select-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  readAIProviderStatus,
  requestAIExplanation,
  type AIExplanationResponse,
  type AIProviderStatus,
} from "@/lib/desktop-ai";
import {
  analyzeLanguageSample,
  buildLanguageAnalysisLlmRequest,
  type HybridAnalysisSkill,
  type HybridLanguageAnalysis,
} from "@/lib/hybrid-language-analysis";

const skillLabels: Readonly<Record<HybridAnalysisSkill, string>> = {
  listening: "Hören",
  speaking: "Sprechen",
  reading: "Lesen",
  writing: "Schreiben",
};

const signalTone = {
  observation: "border-emerald-200 bg-emerald-50 text-emerald-950",
  attention: "border-amber-200 bg-amber-50 text-amber-950",
  "not-available": "border-slate-200 bg-slate-50 text-slate-700",
} as const;

export function HybridLanguageCoach({
  initialSkill = "listening",
}: {
  initialSkill?: HybridAnalysisSkill;
}) {
  const [skill, setSkill] = React.useState(initialSkill);
  const [responseText, setResponseText] = React.useState("");
  const [sourceText, setSourceText] = React.useState("");
  const [durationSeconds, setDurationSeconds] = React.useState("");
  const [analysis, setAnalysis] = React.useState<HybridLanguageAnalysis | null>(
    null,
  );
  const [provider, setProvider] = React.useState<AIProviderStatus | null>(null);
  const [llmResult, setLlmResult] =
    React.useState<AIExplanationResponse | null>(null);
  const [message, setMessage] = React.useState("");
  const [askingLlm, setAskingLlm] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    readAIProviderStatus()
      .then((status) => {
        if (active) setProvider(status);
      })
      .catch(() => {
        if (active) setProvider(null);
      });
    return () => {
      active = false;
    };
  }, []);

  function invalidateResult() {
    setAnalysis(null);
    setLlmResult(null);
    setMessage("");
  }

  function currentInput() {
    const duration = durationSeconds ? Number(durationSeconds) : undefined;
    return {
      skill,
      language: "de" as const,
      responseText,
      sourceText,
      ...(duration === undefined ? {} : { durationSeconds: duration }),
    };
  }

  function runLocalAnalysis() {
    try {
      const next = analyzeLanguageSample(currentInput());
      setAnalysis(next);
      setLlmResult(null);
      setMessage(
        "Die lokalen Regeln sind fertig. Das sind diagnostische Beobachtungen, keine Note.",
      );
    } catch (error) {
      setAnalysis(null);
      setLlmResult(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Die Analyse ist fehlgeschlagen.",
      );
    }
  }

  async function askConnectedLlm() {
    if (!analysis || !provider?.connected) return;
    setAskingLlm(true);
    setLlmResult(null);
    setMessage("Der verbundene Provider wird angefragt …");
    try {
      const response = await requestAIExplanation(
        buildLanguageAnalysisLlmRequest(currentInput(), analysis),
      );
      setLlmResult(response);
      setMessage(
        "Provider-Rückmeldung erhalten. Prüfe jeden Vorschlag, bevor du ihn übernimmst.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Der verbundene KI-Provider hat keine Rückmeldung geliefert.",
      );
    } finally {
      setAskingLlm(false);
    }
  }

  return (
    <section className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm sm:p-6">
      <details className="group overflow-hidden rounded-2xl border border-indigo-200 bg-background">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-5">
          <span className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-800">
              <Brain aria-hidden className="size-5" />
            </span>
            <span>
              <strong className="block text-base text-indigo-950">
                Hybrid-Coach mit NLP und LLM
              </strong>
              <span className="mt-0.5 block text-sm font-medium text-muted-foreground">
                Erst lokale Beobachtungen, dann KI-Rückmeldung nur auf Wunsch
              </span>
            </span>
          </span>
          <span className="text-sm font-bold text-primary group-open:hidden">
            Öffnen
          </span>
          <span className="hidden text-sm font-bold text-primary group-open:inline">
            Schließen
          </span>
        </summary>

        <div className="space-y-5 border-t border-indigo-200 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <SelectMenu
              ariaLabel="Fertigkeit"
              label="Fertigkeit"
              onChange={(nextSkill) => {
                setSkill(nextSkill as HybridAnalysisSkill);
                invalidateResult();
              }}
              options={Object.entries(skillLabels).map(([value, label]) => ({
                value,
                label,
              }))}
              value={skill}
            />
            {skill === "speaking" ? (
              <label className="grid gap-2 text-sm font-bold">
                Dauer der echten Aufnahme in Sekunden
                <input
                  className="h-11 rounded-xl border border-input bg-background px-3 font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  inputMode="numeric"
                  min="10"
                  onChange={(event) => {
                    setDurationSeconds(event.target.value);
                    invalidateResult();
                  }}
                  placeholder="Zum Beispiel: 45"
                  type="number"
                  value={durationSeconds}
                />
              </label>
            ) : null}
          </div>

          {skill === "listening" || skill === "reading" ? (
            <label className="grid gap-2 text-sm font-bold">
              Ausgangstext (optional, für transparente Überlappung nötig)
              <Textarea
                maxLength={8_000}
                onChange={(event) => {
                  setSourceText(event.target.value);
                  invalidateResult();
                }}
                placeholder="Füge den gehörten oder gelesenen Text ein."
                value={sourceText}
              />
            </label>
          ) : null}

          <label className="grid gap-2 text-sm font-bold">
            Antwort oder echtes Transkript
            <Textarea
              maxLength={8_000}
              onChange={(event) => {
                setResponseText(event.target.value);
                invalidateResult();
              }}
              placeholder="Schreibe deine Antwort oder füge ein echtes Transkript ein."
              value={responseText}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={!responseText.trim()} onClick={runLocalAnalysis}>
              <CheckCircle2 aria-hidden /> Lokale NLP-Regeln ausführen
            </Button>
            <Button
              disabled={!analysis || !provider?.connected || askingLlm}
              onClick={askConnectedLlm}
              variant="outline"
            >
              <Sparkles aria-hidden />
              {askingLlm ? "Warten …" : "Verbundenes LLM fragen"}
            </Button>
            <span className="text-sm font-semibold text-muted-foreground">
              {provider === null
                ? "KI-Verbindung wird geprüft …"
                : provider.connected
                  ? `${provider.providerLabel ?? "KI"}${provider.model ? ` · ${provider.model}` : ""}`
                  : "LLM nicht verfügbar · Provider in Einstellungen verbinden"}
            </span>
          </div>

          {analysis ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {analysis.signals.map((signal) => (
                  <article
                    className={`rounded-2xl border p-4 ${signalTone[signal.status]}`}
                    key={signal.id}
                  >
                    <p className="text-xs font-black uppercase tracking-wide">
                      {signal.status === "not-available"
                        ? "N/A"
                        : signal.status === "attention"
                          ? "Hinweis"
                          : "Beobachtung"}
                    </p>
                    <p className="mt-1 text-lg font-black">
                      {signal.label}: {signal.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 opacity-80">
                      {signal.detail}
                    </p>
                  </article>
                ))}
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <p className="flex items-center gap-2 font-black">
                  <ShieldAlert aria-hidden className="size-4" /> Grenzen der
                  Nachweise
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {analysis.limitations.map((limitation) => (
                    <li key={limitation}>{limitation}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {llmResult ? (
            <article className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-sm font-black text-violet-950">
                Provider-Rückmeldung · {llmResult.providerLabel} ·{" "}
                {llmResult.model}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-violet-950">
                {llmResult.text}
              </p>
              <p className="mt-3 text-xs font-bold text-violet-800">
                Unbestätigte Diagnose — niemals ein CEFR- oder
                Beherrschungsergebnis.
              </p>
            </article>
          ) : null}

          {message ? (
            <p aria-live="polite" className="text-sm font-bold">
              {message}
            </p>
          ) : null}
        </div>
      </details>
    </section>
  );
}
