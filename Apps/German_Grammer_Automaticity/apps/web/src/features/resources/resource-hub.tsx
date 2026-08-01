"use client";

import { useState } from "react";
import { BookOpen, Dumbbell, ExternalLink, Globe2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DriveMaterialLibrary } from "@/features/resources/drive-material-library";

const RESOURCES = [
  {
    skill: "Grammatik",
    level: "A1–A2",
    provider: "Lingolia",
    title: "Grammatik A1–A2",
    description:
      "Grundregeln, Satzbau und häufige Formen mit verständlichen Beispielen.",
    explanation: "https://deutsch.lingolia.com/de/grammatik",
    exercise: "https://deutsch.lingolia.com/de/grammatik/uebungen",
  },
  {
    skill: "Grammatik",
    level: "B1–B2",
    provider: "Lingolia",
    title: "Grammatik B1–B2",
    description:
      "Vertiefung von Zeitformen, Nebensätzen, Passiv und Konjunktiv.",
    explanation: "https://deutsch.lingolia.com/de/grammatik",
    exercise: "https://deutsch.lingolia.com/de/grammatik/uebungen",
  },
  {
    skill: "Grammatik",
    level: "C1–C2",
    provider: "Lingolia",
    title: "Grammatik C1–C2",
    description:
      "Komplexer Satzbau, Register, Kohärenz und stilistische Verdichtung.",
    explanation: "https://deutsch.lingolia.com/de/grammatik",
    exercise: "https://deutsch.lingolia.com/de/grammatik/uebungen",
  },
  {
    skill: "Wortschatz",
    level: "A1–A2",
    provider: "Goethe-Institut",
    title: "Wortschatz A1–A2",
    description: "Alltagswortschatz in kurzen interaktiven Lernangeboten.",
    explanation: "https://www.goethe.de/de/spr/ueb.html",
    exercise: "https://learngerman.dw.com/de/nicos-weg/c-36519687",
  },
  {
    skill: "Wortschatz",
    level: "B1–B2",
    provider: "Goethe-Institut · DW",
    title: "Wortschatz B1–B2",
    description: "Wortschatz für Alltag, Studium, Arbeit und Diskussion.",
    explanation: "https://www.goethe.de/de/spr/ueb.html",
    exercise: "https://learngerman.dw.com/de/nicos-weg/c-36519718",
  },
  {
    skill: "Lesen",
    level: "A1–A2",
    provider: "Goethe-Institut",
    title: "Lesen A1–A2",
    description: "Kurze Texte verstehen und gezielt Informationen finden.",
    explanation: "https://www.goethe.de/de/spr/ueb.html",
    exercise: "https://www.goethe.de/de/spr/prf/ueb.html",
  },
  {
    skill: "Lesen",
    level: "B1–B2",
    provider: "Goethe-Institut",
    title: "Lesen B1–B2",
    description:
      "Längere Sachtexte, Meinungen und Argumentationsstrukturen erschließen.",
    explanation: "https://www.goethe.de/de/spr/ueb.html",
    exercise: "https://www.goethe.de/de/spr/prf/ueb.html",
  },
  {
    skill: "Schreiben",
    level: "A1–A2",
    provider: "Goethe-Institut",
    title: "Schreiben A1–A2",
    description:
      "Nachrichten, E-Mails und kurze persönliche Texte planen und schreiben.",
    explanation: "https://www.goethe.de/de/spr/ueb.html",
    exercise: "https://www.goethe.de/de/spr/prf/ueb.html",
  },
  {
    skill: "Schreiben",
    level: "B1–B2",
    provider: "Goethe-Institut",
    title: "Schreiben B1–B2",
    description: "Texte klar gliedern, begründen und sprachlich überarbeiten.",
    explanation: "https://www.goethe.de/de/spr/ueb.html",
    exercise: "https://www.goethe.de/de/spr/prf/ueb.html",
  },
  {
    skill: "Hören",
    level: "A1–A2",
    provider: "Deutsche Welle",
    title: "Hören A1–A2",
    description: "Alltagsgespräche und kurze Hörtexte schrittweise verstehen.",
    explanation: "https://learngerman.dw.com/de/nicos-weg/c-36519687",
    exercise: "https://learngerman.dw.com/de/nicos-weg/c-36519687",
  },
  {
    skill: "Hören",
    level: "B1–B2",
    provider: "Deutsche Welle",
    title: "Hören B1–B2",
    description: "Hauptaussagen, Details und Sprecherabsichten erfassen.",
    explanation: "https://learngerman.dw.com/de/nicos-weg/c-36519718",
    exercise: "https://www.goethe.de/de/spr/prf/ueb.html",
  },
  {
    skill: "Sprechen",
    level: "A1–A2",
    provider: "Goethe-Institut",
    title: "Sprechen A1–A2",
    description:
      "Kurze Antworten, Fragen und Alltagssituationen mündlich bewältigen.",
    explanation: "https://www.goethe.de/de/spr/ueb.html",
    exercise: "https://www.goethe.de/de/spr/prf/ueb.html",
  },
  {
    skill: "Sprechen",
    level: "B1–B2",
    provider: "Goethe-Institut",
    title: "Sprechen B1–B2",
    description:
      "Zusammenhängend sprechen, begründen und angemessen reagieren.",
    explanation: "https://www.goethe.de/de/spr/ueb.html",
    exercise: "https://www.goethe.de/de/spr/prf/ueb.html",
  },
  {
    skill: "DSH",
    level: "DSH",
    provider: "Universität Münster · Universität Bonn",
    title: "DSH-Prüfung",
    description:
      "Prüfungsaufbau und vollständige Beispielaufgaben für den Hochschulzugang.",
    explanation:
      "https://www.uni-bonn.de/de/studium/internationale-studierende/deutsch-lernen/deutsche-sprachpruefung-fuer-den-hochschulzugang-dsh",
    exercise:
      "https://www.uni-muenster.de/Sprachenzentrum/ldaf/dsh/dshbeispielpruefung.html",
  },
  {
    skill: "TestDaF",
    level: "TestDaF",
    provider: "TestDaF-Institut",
    title: "Digitaler TestDaF",
    description:
      "Alle vier Prüfungsteile, Aufgabentypen, Tutorials und offizielle Beispiele.",
    explanation:
      "https://www.testdaf.de/de/teilnehmende/der-digitale-testdaf/aufbau-des-digitalen-testdaf/",
    exercise:
      "https://www.testdaf.de/de/teilnehmende/der-digitale-testdaf/vorbereitung-auf-den-digitalen-testdaf/",
  },
] as const;

const skills = ["Alle", ...new Set(RESOURCES.map((row) => row.skill))];
const levels = ["Alle", "A1–A2", "B1–B2", "C1–C2", "DSH", "TestDaF"];

export function ResourceHub() {
  const [skill, setSkill] = useState("Alle");
  const [level, setLevel] = useState("Alle");
  const rows = RESOURCES.filter(
    (row) =>
      (skill === "Alle" || row.skill === skill) &&
      (level === "Alle" || row.level === level),
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="section-kicker">Vertiefen, üben & prüfen</p>
        <h1 className="section-title">Lernmaterial & Online-Ressourcen</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Deine Kursmaterialien sind nach Lernziel geordnet; ergänzend bleiben
          alle direkten Lernseiten für Deutsch, DSH und TestDaF verfügbar.
        </p>
      </div>

      <DriveMaterialLibrary />

      <section aria-labelledby="online-resources-heading">
        <p className="section-kicker">Ergänzende Angebote</p>
        <h2 id="online-resources-heading" className="section-title">
          Direkte Online-Lernressourcen
        </h2>
      </section>

      <Card className="border-blue-900/10 bg-blue-50/60">
        <CardContent className="flex items-start gap-3">
          <Globe2 className="mt-0.5 size-5 shrink-0 text-blue-700" />
          <p className="text-sm leading-6 text-blue-950">
            Wähle Fertigkeit und Niveau. Jede Schaltfläche öffnet direkt die
            ausgewählte Lern- oder Übungsseite in einem neuen Tab.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">
            Fertigkeit
            <select
              className="h-9 rounded-lg border bg-background px-3"
              value={skill}
              onChange={(event) => {
                const next = event.target.value;
                setSkill(next);
                if (next === "DSH" || next === "TestDaF") {
                  setLevel(next);
                }
              }}
            >
              {skills.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Niveau
            <select
              className="h-9 rounded-lg border bg-background px-3"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            >
              {levels.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <p className="text-sm font-medium text-muted-foreground">
        {rows.length} passende direkte Lernressource
        {rows.length === 1 ? "" : "n"}
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((resource) => (
          <Card
            key={`${resource.skill}-${resource.level}`}
            className={
              resource.skill === "DSH" || resource.skill === "TestDaF"
                ? "border-amber-400/50 bg-amber-50/40"
                : ""
            }
          >
            <CardHeader>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant="outline">{resource.provider}</Badge>
                <Badge>{resource.level}</Badge>
                <Badge variant="secondary">{resource.skill}</Badge>
              </div>
              <CardTitle>{resource.title}</CardTitle>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <a
                href={resource.explanation}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline" })}
              >
                <BookOpen data-icon="inline-start" />
                Erklärung
                <ExternalLink data-icon="inline-end" />
              </a>
              <a
                href={resource.exercise}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants()}
              >
                <Dumbbell data-icon="inline-start" />
                Übungen
                <ExternalLink data-icon="inline-end" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {rows.length === 0 && (
        <p className="rounded-xl border bg-muted p-4 text-sm text-muted-foreground">
          Für diese Kombination ist noch keine direkte Ressource gespeichert.
          Wähle ein anderes Niveau oder „Alle“.
        </p>
      )}
    </div>
  );
}
