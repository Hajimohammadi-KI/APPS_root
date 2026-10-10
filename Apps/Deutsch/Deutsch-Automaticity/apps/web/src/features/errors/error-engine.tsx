"use client";

import { useEffect, useState } from "react";
import { matchesReferenceAnswer } from "@automaticity/learning-core/reference-answer";
import {
  Award,
  Bug,
  Check,
  CheckCircle2,
  RotateCcw,
  Volume2,
} from "lucide-react";

import {
  errorClassLabels,
  repairStatusLabels,
  type ErrorRecord,
} from "@grammar/domain";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { MissionRail, MissionTile } from "@/components/ui/mission-tiles";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

function speak(text: string) {
  if (!text || !("speechSynthesis" in window)) {
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.92;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function HighlightedCorrection({
  original,
  corrected,
}: Readonly<{ original: string; corrected: string }>) {
  const before = original.split(/\s+/);
  return (
    <p className="leading-7">
      {corrected.split(/\s+/).map((word, index) => (
        <span
          key={`${word}-${index}`}
          className={
            before[index] === word
              ? ""
              : "rounded bg-amber-200 px-0.5 font-semibold text-amber-950"
          }
        >
          {word}{" "}
        </span>
      ))}
    </p>
  );
}

export function ErrorEngine() {
  const { state } = useLearnerState();
  const rows = [...state.errors].sort(
    (left, right) =>
      Number(left.repairStatus === "fixed") -
        Number(right.repairStatus === "fixed") ||
      right.occurrenceCount - left.occurrenceCount ||
      right.lastSeenAt - left.lastSeenAt,
  );
  const recurring = rows.filter((error) => error.occurrenceCount >= 3).length;
  const fixed = rows.filter((error) => error.repairStatus === "fixed").length;
  const active = rows.length - fixed;
  const achievements = [
    {
      key: "first-fix",
      unlocked: fixed >= 1,
      title: "Erste Reparatur",
      hint: "Mindestens 1 Fehler stabil beheben",
    },
    {
      key: "recurring",
      unlocked:
        rows.filter(
          (error) =>
            error.occurrenceCount >= 3 && error.repairStatus === "fixed",
        ).length >= 1,
      title: "Wiederkehrend gelöst",
      hint: "1 hochprioren Fehler schließen",
    },
    {
      key: "clean-slate",
      unlocked: rows.length > 0 && active === 0,
      title: "Clean Slate",
      hint: "Keine aktive Reparatur offen",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <a
        href="/practice?review=1"
        className={buttonVariants({ className: "w-fit" })}
      >
        Antworten aus eigenständigen Übungen prüfen und korrigieren
      </a>
      <PageHeader
        description="Jede Studiokorrektur wird klassifiziert, zusammengeführt und als Reparaturkette wieder eingeplant. Wiederkehrende Fehler stehen zuerst."
        kicker="Gezielt reparieren"
        title="Persönlicher Fehlermotor"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary value={rows.length} label="Fehlerklassen" />
        <Summary value={recurring} label="Hohe Priorität · 3× oder mehr" />
        <Summary value={fixed} label="Stabil repariert" />
      </div>

      <MissionRail label="Reparaturmissionen">
        <MissionTile title="Mission 1">
          Heute einen aktiven Fehler sauber reparieren.
        </MissionTile>
        <MissionTile title="Mission 2">
          1 wiederkehrenden Fehler (3x+) priorisiert bearbeiten.
        </MissionTile>
        <MissionTile title="Mission 3">
          Aktive Reparaturen: {active}
        </MissionTile>
      </MissionRail>

      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>
            Motivierende Meilensteine für die Reparaturkette.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.key}
              className="flex flex-col items-start gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center"
            >
              <Award
                className={`size-4 ${achievement.unlocked ? "text-amber-600" : "text-muted-foreground"}`}
              />
              <span className="min-w-0 flex-1 font-medium">
                {achievement.title}
              </span>
              <Badge
                className="max-w-full sm:max-w-[12rem]"
                variant={achievement.unlocked ? "secondary" : "outline"}
              >
                {achievement.unlocked ? "Erreicht" : achievement.hint}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {rows.map((error) => (
          <ErrorRepairCard key={error.id} error={error} />
        ))}
      </div>

      {rows.length === 0 && (
        <Card>
          <CardContent>
            <Empty className="min-h-64">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Bug aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>Noch keine Fehler gespeichert</EmptyTitle>
                <EmptyDescription>
                  Fehlerhafte Studioantworten werden nach der Auswertung
                  automatisch hier eingeordnet.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ErrorRepairCard({ error }: Readonly<{ error: ErrorRecord }>) {
  const {
    recordErrorRepair,
    recordErrorRepairHelp,
    recordErrorRepairHelpClosed,
  } = useLearnerState();
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [showCorrection, setShowCorrection] = useState(false);

  useEffect(() => {
    if (error.repairHelpOpen && !showCorrection) {
      recordErrorRepairHelpClosed(error.id);
    }
  }, [
    error.id,
    error.repairHelpOpen,
    showCorrection,
    recordErrorRepairHelpClosed,
  ]);

  function revealCorrection(listen = false) {
    recordErrorRepairHelp(error.id);
    setShowCorrection(true);
    setMessage(
      "Die Hilfe ist geöffnet. Du kannst weiterüben; eine eigenständige Bestätigung zählt frühestens nach einem Tag. Das bleibt auch nach dem Neuladen gespeichert.",
    );
    if (listen) speak(error.corrected);
  }

  function checkRepair() {
    const successful = matchesReferenceAnswer(answer, error.corrected);
    if (showCorrection) recordErrorRepairHelp(error.id);
    recordErrorRepair(error.id, successful);
    if (successful) {
      const reviewNotDue = Date.now() < error.nextRepairAt;
      setMessage(
        showCorrection
          ? "Richtig geschrieben und mit Hilfe geübt. Eine eigenständige Bestätigung zählt frühestens nach einem Tag ohne Vorlage."
          : reviewNotDue
            ? `Richtig geschrieben. Eine eigenständige Bestätigung zählt erst ab ${new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(error.nextRepairAt)}. Hilfe und wiederholtes Prüfen ersetzen keine spätere Erinnerung.`
            : error.successfulRepairs >= 1
              ? "Korrekt. Diese Fassung wurde an zwei Terminen bestätigt. Übe dieselbe Struktur nun in einem neuen Kontext."
              : "Korrekt. Die erste eigenständige Bestätigung ist gespeichert. Wiederhole die Fassung frühestens nach einem Tag ohne Hilfe.",
      );
    } else {
      recordErrorRepairHelp(error.id);
      setShowCorrection(true);
      setMessage(
        "Noch nicht vollständig richtig. Vergleiche mit der Korrektur und übe weiter. Eine eigenständige Bestätigung zählt frühestens nach einem Tag.",
      );
    }
  }

  return (
    <Card
      className={
        error.repairStatus === "fixed" ? "border-sky-300 bg-sky-50/25" : ""
      }
    >
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {error.repairStatus !== "fixed" &&
              error.repairHistory?.some(
                (entry) =>
                  entry.successfulRepairs > 0 ||
                  entry.repairStatus === "fixed" ||
                  entry.repairStatus === "improving",
              ) && (
                <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
                  Bitte erneut prüfen: Frühere Bestätigungen zählen nicht für
                  diese genauere Kontrolle. Dein bisheriger Verlauf bleibt
                  erhalten.
                </p>
              )}
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge>{errorClassLabels[error.errorClass]}</Badge>
              <Badge variant="secondary">
                {repairStatusLabels[error.repairStatus]}
              </Badge>
              <Badge variant="outline">{error.occurrenceCount}× gesehen</Badge>
              {error.occurrenceCount >= 3 && (
                <Badge variant="destructive">Hohe Priorität</Badge>
              )}
            </div>
            <CardTitle>{error.topic || "Ohne Thema"}</CardTitle>
            <CardDescription>
              Zuletzt{" "}
              {new Intl.DateTimeFormat("de-DE", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(error.lastSeenAt)}
            </CardDescription>
          </div>
          {error.repairStatus === "fixed" && (
            <CheckCircle2 className="size-6 text-sky-700" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border bg-red-50/60 p-3 text-sm">
            <span className="mb-1 block text-xs font-semibold text-red-800">
              Ursprünglich
            </span>
            {error.original}
          </div>
          {showCorrection && (
            <div className="rounded-xl border bg-sky-50/60 p-3 text-sm">
              <span className="mb-1 block text-xs font-semibold text-sky-800">
                Korrigiert
              </span>
              <HighlightedCorrection
                original={error.original}
                corrected={error.corrected}
              />
            </div>
          )}
        </div>
        {showCorrection && (
          <p className="rounded-xl border bg-blue-50/60 p-3 text-sm leading-6 text-blue-950">
            <strong>Diagnose:</strong> {error.explanation}
          </p>
        )}

        <ol className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Korrektur lesen",
            "Fehler verstehen",
            "Korrektur laut sagen",
            "Ohne Vorlage neu schreiben",
            "In neuem Kontext verwenden",
            "Später erneut prüfen",
          ].map((step, index) => (
            <li
              key={step}
              className="flex items-center gap-2 rounded-lg border p-2"
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sky-100 text-xs font-semibold text-sky-900">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <label className="grid gap-1.5 text-sm font-medium">
          {showCorrection
            ? "Korrekte Fassung mit Hilfe üben"
            : "Korrekte Fassung ohne Vorlage schreiben"}
          <Input
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Satz vollständig neu schreiben"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={checkRepair} disabled={!answer.trim()}>
            <Check data-icon="inline-start" />
            Reparatur prüfen
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => revealCorrection()}
            aria-expanded={showCorrection}
          >
            Korrektur und Erklärung zeigen · mit Hilfe
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => revealCorrection(true)}
          >
            <Volume2 data-icon="inline-start" />
            Korrektur anhören · mit Hilfe
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (showCorrection) recordErrorRepairHelpClosed(error.id);
              setAnswer("");
              setMessage("");
              setShowCorrection(false);
            }}
          >
            <RotateCcw data-icon="inline-start" />
            Neu versuchen
          </Button>
        </div>
        {message && <Notice role="status">{message}</Notice>}
      </CardContent>
    </Card>
  );
}

function Summary({ value, label }: Readonly<{ value: number; label: string }>) {
  return (
    <Card size="sm">
      <CardContent>
        <strong className="block text-2xl text-primary">{value}</strong>
        <span className="mt-1 block text-xs text-muted-foreground">
          {label}
        </span>
      </CardContent>
    </Card>
  );
}
