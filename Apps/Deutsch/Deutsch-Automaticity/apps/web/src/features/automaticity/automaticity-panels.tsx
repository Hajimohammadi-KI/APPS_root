import {
  BookOpenCheck,
  Check,
  CircleAlert,
  Headphones,
  Mic,
  PenLine,
  Play,
  RotateCcw,
  Square,
  Volume2,
} from "lucide-react";
import type { GrammarUnit } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { AutomatikAnalysis } from "@/features/automaticity/automaticity-analysis";
import { shadowingStages } from "./lesson-content";

export function Axis({
  label,
  value,
}: Readonly<{ label: string; value: number }>) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm font-bold">
        <span>{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-worksheet-cyan!">
        <div
          aria-hidden="true"
          className="h-full rounded-full bg-worksheet-teal! border-worksheet-teal! text-white! transition-[width]"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

export function Feedback({
  analysis,
}: Readonly<{ analysis: AutomatikAnalysis }>) {
  return (
    <div className="space-y-3 rounded-2xl border border-worksheet-line! bg-worksheet-cyan! p-4">
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <strong className="block text-lg">{analysis.sentenceCount}</strong>
          Sätze
        </div>
        <div>
          <strong className="block text-lg">{analysis.targetUses}</strong>
          Zielstrukturen
        </div>
        <div>
          <strong className="block text-lg">{analysis.score}%</strong>Übungswert
        </div>
      </div>
      {analysis.issues.length ? (
        <ul className="space-y-2 text-sm">
          {analysis.issues.map((issue) => (
            <li
              className="rounded-xl bg-white p-3"
              key={`${issue.code}-${issue.original}`}
            >
              <strong className="text-red-800">{issue.message}</strong>
              <span className="mt-1 block text-muted-foreground">
                {issue.original} → {issue.corrected}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-sm font-bold text-worksheet-teal!">
          <Check className="size-4" /> Die Offline-Musterprüfung findet keinen
          Zielfehler.
        </p>
      )}
    </div>
  );
}

export function MissionHero({
  embedded,
  missionMinutes,
}: Readonly<{ embedded: boolean; missionMinutes: number }>) {
  return (
    <section className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-worksheet-line! bg-worksheet-cyan! p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <Badge className="mb-3 bg-worksheet-teal! border-worksheet-teal! text-white!">
          Heute · {missionMinutes} Minuten
        </Badge>
        {embedded ? (
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Vertiefender Nachweis
          </h2>
        ) : (
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Automatik-Mission
          </h1>
        )}
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Aktivieren, korrekt anwenden, laut automatisieren und frei übertragen.
          Die Mission endet mit einem gespeicherten Nachweis, nicht mit bloßem
          Durchklicken.
        </p>
      </div>
      <Button
        className="bg-worksheet-teal! border-worksheet-teal! text-white! hover:bg-worksheet-teal"
        size="lg"
        onClick={() =>
          document
            .getElementById("mission")
            ?.scrollIntoView({ behavior: "smooth" })
        }
      >
        <Play /> Nachweis starten
      </Button>
    </section>
  );
}

export function MissionProgressCard({
  topic,
  level,
  grammar,
  progress,
  message,
}: Readonly<{
  topic: string;
  level: string;
  grammar: GrammarUnit;
  progress: number;
  message: string;
}>) {
  return (
    <Card className="border-worksheet-line! bg-worksheet-cyan/70" id="mission">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <strong>
              {topic} · {level}
            </strong>
            <p className="text-sm text-muted-foreground">{grammar.rule}</p>
          </div>
          <Badge>{progress}% erledigt</Badge>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-worksheet-line">
          <div
            className="h-full rounded-full bg-worksheet-teal! border-worksheet-teal! text-white! transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p
          aria-live="polite"
          className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-worksheet-teal!"
        >
          {message}
        </p>
      </CardContent>
    </Card>
  );
}

const stepCards = [
  {
    icon: BookOpenCheck,
    title: "1. Aktivieren & korrekt anwenden",
    detail: "3 Min. · drei kontrollierte Umformungen",
  },
  {
    icon: PenLine,
    title: "2. Automatisieren & schreiben",
    detail: "4 Min. · sechs Sätze mit vier Zielstrukturen",
  },
  {
    icon: Mic,
    title: "3. Frei sprechen & übertragen",
    detail: "5 Min. · Shadowing und 60 Sekunden ohne Vorlage",
  },
] as const;

export function StepCards({
  completion,
  activeStep,
  onSelect,
}: Readonly<{
  completion: readonly boolean[];
  activeStep: number;
  onSelect: (step: number) => void;
}>) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {stepCards.map((step, index) => (
        <button
          aria-pressed={activeStep === index}
          className="text-left"
          key={step.title}
          onClick={() => onSelect(index)}
          type="button"
        >
          <Card className={completion[index] ? "border-worksheet-teal" : ""}>
            <CardContent className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-worksheet-cyan! text-worksheet-teal">
                {completion[index] ? <Check /> : <step.icon />}
              </span>
              <div>
                <strong>{step.title}</strong>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.detail}
                </p>
              </div>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}

export function QualityGateCard() {
  return (
    <Card className="border-worksheet-line!">
      <CardHeader>
        <CardTitle>Qualitätsgrenze der Mission</CardTitle>
        <CardDescription>
          „Erledigt“ bedeutet nicht automatisch „beherrscht“. Automatik wird
          erst durch drei getrennte Nachweise sichtbar.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-worksheet-cyan! p-4 text-sm">
          <strong>Genau</strong>
          <p className="mt-1 text-muted-foreground">
            Zielstruktur korrekt in eigenen Sätzen.
          </p>
        </div>
        <div className="rounded-2xl bg-worksheet-cyan! p-4 text-sm">
          <strong>Spontan</strong>
          <p className="mt-1 text-muted-foreground">
            Mindestens 60 Sekunden ohne Ablesen sprechen.
          </p>
        </div>
        <div className="rounded-2xl bg-worksheet-cyan! p-4 text-sm">
          <strong>Behalten</strong>
          <p className="mt-1 text-muted-foreground">
            Die Struktur bei der nächsten Wiederholung erneut abrufen.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PracticeStepCard({
  grammar,
  exercises,
  answers,
  checkedAnswers,
  onAnswer,
  onCheck,
}: Readonly<{
  grammar: GrammarUnit;
  exercises: readonly { readonly prompt: string; readonly expected: string }[];
  answers: readonly string[];
  checkedAnswers: readonly boolean[];
  onAnswer: (index: number, value: string) => void;
  onCheck: () => void;
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lektion und kontrollierte Übung</CardTitle>
        <CardDescription>{grammar.rule}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-worksheet-cyan! p-4">
            <strong>Regel und Form</strong>
            <p className="mt-2">{grammar.examples[0]}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4">
            <strong>Typischer Fehler</strong>
            <p className="mt-2">{grammar.commonError}</p>
          </div>
        </div>
        {exercises.map((item, index) => (
          <label className="block space-y-2" key={item.prompt}>
            <span className="text-sm font-bold">{item.prompt}</span>
            <input
              className="min-h-11 w-full rounded-xl border bg-background px-3"
              onChange={(event) => onAnswer(index, event.target.value)}
              value={answers[index]}
            />
            {checkedAnswers.length ? (
              <span
                className={
                  checkedAnswers[index]
                    ? "text-sm font-bold text-worksheet-teal!"
                    : "text-sm font-bold text-red-800"
                }
              >
                {checkedAnswers[index] ? "Richtig" : `Modell: ${item.expected}`}
              </span>
            ) : null}
          </label>
        ))}
        <Button onClick={onCheck}>Alle drei prüfen</Button>
      </CardContent>
    </Card>
  );
}

export function WritingStepCard({
  topic,
  grammar,
  value,
  analysis,
  onChange,
  onSave,
}: Readonly<{
  topic: string;
  grammar: GrammarUnit;
  value: string;
  analysis: AutomatikAnalysis | null;
  onChange: (value: string) => void;
  onSave: () => void;
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grammatik-Tagebuch</CardTitle>
        <CardDescription>
          Schreibe mindestens vier zusammenhängende Sätze aus deinem Alltag und
          verwende dabei die heutige Struktur „{topic}“.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          aria-label={`${topic}-Tagebuch`}
          onChange={(event) => onChange(event.target.value)}
          placeholder={grammar.examples[0] ?? grammar.testAnswer}
          value={value}
        />
        <Button onClick={onSave}>
          <PenLine /> Schreiben analysieren und speichern
        </Button>
        {analysis ? <Feedback analysis={analysis} /> : null}
      </CardContent>
    </Card>
  );
}

export function SpeakingStepCard({
  modelText,
  shadowing,
  recording,
  seconds,
  requiredSeconds,
  audioUrl,
  canSave,
  transcript,
  analysis,
  onPlayModel,
  onToggleStage,
  onRecord,
  onStop,
  onTranscript,
  onSave,
}: Readonly<{
  modelText: string;
  shadowing: readonly boolean[];
  recording: boolean;
  seconds: number;
  requiredSeconds: number;
  audioUrl: string | null;
  canSave: boolean;
  transcript: string;
  analysis: AutomatikAnalysis | null;
  onPlayModel: () => void;
  onToggleStage: (index: number) => void;
  onRecord: () => void;
  onStop: () => void;
  onTranscript: (value: string) => void;
  onSave: () => void;
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fünfstufiges Shadowing und freies Sprechen</CardTitle>
        <CardDescription>
          Höre den Rhythmus, sprich mit und übertrage die Struktur danach ohne
          Ablesen in deine eigene Situation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl bg-worksheet-ink! text-white! p-5">
          <p className="leading-7">{modelText}</p>
          <Button
            className="mt-4 bg-white text-worksheet-teal! hover:bg-worksheet-cyan"
            onClick={onPlayModel}
          >
            <Volume2 /> Modell abspielen
          </Button>
        </div>
        <div className="grid gap-2 md:grid-cols-5">
          {shadowingStages.map((stage, index) => (
            <button
              className={`min-h-24 rounded-2xl border p-3 text-left text-sm font-bold ${shadowing[index] ? "border-worksheet-teal bg-worksheet-cyan! text-worksheet-teal" : "bg-background"}`}
              key={stage}
              onClick={() => onToggleStage(index)}
              type="button"
            >
              <span className="mb-2 block text-xs text-muted-foreground">
                Stufe {index + 1}
              </span>
              {shadowing[index] ? (
                <Check className="mb-1 size-4" />
              ) : (
                <Headphones className="mb-1 size-4" />
              )}
              {stage}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={recording} onClick={onRecord}>
            <Mic /> Aufnehmen
          </Button>
          <Button disabled={!recording} onClick={onStop} variant="outline">
            <Square /> Stoppen
          </Button>
          <Badge>{seconds} Sek.</Badge>
        </div>
        {audioUrl ? (
          <audio
            aria-label="Eigene Aufnahme anhören"
            className="w-full"
            controls
            src={audioUrl}
          />
        ) : null}
        <Textarea
          aria-label="Sprechtranskript"
          onChange={(event) => onTranscript(event.target.value)}
          placeholder="Live- oder manuell eingegebenes Transkript …"
          value={transcript}
        />
        <p className="text-sm leading-6 text-muted-foreground">
          Für einen gültigen Nachweis brauchst du alle fünf Stufen, eine echte
          Aufnahme und mindestens {requiredSeconds} Sekunden freie Sprache.
        </p>
        <Button disabled={!canSave} onClick={onSave}>
          Sprechen analysieren und speichern
        </Button>
        {analysis ? <Feedback analysis={analysis} /> : null}
      </CardContent>
    </Card>
  );
}

export function MasteryCard({
  recognition,
  writing,
  speaking,
  previousThreshold,
}: Readonly<{
  recognition: number;
  writing: number;
  speaking: number;
  previousThreshold: number;
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transparente Beherrschung</CardTitle>
        <CardDescription>
          Übungsnachweise sind sofort sichtbar. Nur online oder fachlich
          geprüfte Versuche erhöhen den bestätigten Beherrschungswert.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Axis label="Erkennen und Umformen" value={recognition} />
        <Axis label="Eigenes Schreiben" value={writing} />
        <Axis label="Freies Sprechen" value={speaking} />
        <div className="flex flex-wrap gap-2">
          <Badge>Offline-Übung</Badge>
          <Badge variant="outline">
            Frühere Übungsschwelle: {previousThreshold}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function PatternPlanCard({
  topic,
  issueCount,
  onReset,
}: Readonly<{ topic: string; issueCount: number; onReset: () => void }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mein Grammatik-Musterplan</CardTitle>
        <CardDescription>
          Aus den heutigen Schreib- und Sprechfehlern erzeugt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3 text-sm">
          <li className="rounded-xl bg-worksheet-cyan! p-3">
            <b>1. Reparieren:</b> fünf ähnliche Sätze korrigieren.
          </li>
          <li className="rounded-xl bg-worksheet-cyan! p-3">
            <b>2. Übertragen:</b> fünf neue eigene Sätze mit „{topic}“ bilden.
          </li>
          <li className="rounded-xl bg-worksheet-cyan! p-3">
            <b>3. Automatisieren:</b> einmal shadowen und frei nacherzählen.
          </li>
        </ol>
        <Button className="mt-4" onClick={onReset} variant="outline">
          <RotateCcw /> Neue Wiederholung
        </Button>
        {issueCount > 0 ? (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /> Erkannte Fehler
            wurden zusätzlich im Fehlermotor für die verteilte Reparatur
            gespeichert.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
