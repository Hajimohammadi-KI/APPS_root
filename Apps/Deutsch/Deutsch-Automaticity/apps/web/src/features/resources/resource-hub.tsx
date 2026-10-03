"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { BookOpen, ExternalLink, Globe2, Mic2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LEARNING_RESOURCES,
  RESOURCE_AREAS,
  RESOURCE_LEVELS,
  type LearningResource,
} from "@/lib/learning-resource-catalog";

const allOption = "Alle";

function ResourceAction({
  resource,
}: Readonly<{ resource: LearningResource }>) {
  const content = (
    <>
      {resource.area === "Gesprächsstudio" ? (
        <Mic2 data-icon="inline-start" />
      ) : (
        <BookOpen data-icon="inline-start" />
      )}
      {resource.actionLabel}
      {resource.external ? <ExternalLink data-icon="inline-end" /> : null}
    </>
  );

  if (resource.external) {
    return (
      <a
        href={resource.href}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants()}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={resource.href as Route} className={buttonVariants()}>
      {content}
    </Link>
  );
}

export function ResourceHub() {
  const [area, setArea] = useState<string>("Grammatik");
  const [level, setLevel] = useState<string>("A1");
  const [topic, setTopic] = useState<string>(allOption);

  const topics = useMemo(
    () => [
      allOption,
      ...new Set(
        LEARNING_RESOURCES.filter(
          (resource) =>
            (area === allOption || resource.area === area) &&
            (level === allOption || resource.level === level),
        ).map((resource) => resource.topic),
      ),
    ],
    [area, level],
  );

  const rows = useMemo(
    () =>
      LEARNING_RESOURCES.filter(
        (resource) =>
          (area === allOption || resource.area === area) &&
          (level === allOption || resource.level === level) &&
          (topic === allOption || resource.topic === topic),
      ),
    [area, level, topic],
  );

  function changeArea(nextArea: string) {
    setArea(nextArea);
    setTopic(allOption);
    if (nextArea === "Prüfung" && !["DSH", "TestDaF"].includes(level)) {
      setLevel("DSH");
    } else if (
      nextArea !== allOption &&
      nextArea !== "Prüfung" &&
      ["DSH", "TestDaF"].includes(level)
    ) {
      setLevel("A1");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="section-kicker">Vertiefen, üben & prüfen</p>
        <h1 className="section-title">Lernmaterial & direkte Themenlinks</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Jede Karte gehört zu genau einem Niveau und einem konkreten Thema. Sie
          führt ohne erneute Suche direkt zur passenden Erklärung, Übung oder
          Gesprächsaufgabe.
        </p>
      </div>

      <Card className="border-violet-900/10 bg-violet-50/60">
        <CardContent className="flex items-start gap-3">
          <Globe2 className="mt-0.5 size-5 shrink-0 text-violet-700" />
          <p className="text-sm leading-6 text-violet-950">
            Starte mit einem einzelnen Niveau. Wähle danach ein Thema aus der
            Themenliste oder öffne eine der darunterliegenden Lektionen.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium">
            Lernbereich
            <select
              className="h-11 rounded-lg border bg-background px-3"
              value={area}
              onChange={(event) => changeArea(event.target.value)}
            >
              <option>{allOption}</option>
              {RESOURCE_AREAS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Niveau
            <select
              className="h-11 rounded-lg border bg-background px-3"
              value={level}
              onChange={(event) => {
                setLevel(event.target.value);
                setTopic(allOption);
              }}
            >
              <option>{allOption}</option>
              {RESOURCE_LEVELS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Thema
            <select
              className="h-11 rounded-lg border bg-background px-3"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            >
              {topics.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <p
        className="text-sm font-medium text-muted-foreground"
        aria-live="polite"
      >
        {rows.length} {rows.length === 1 ? "genaues Thema" : "genaue Themen"}
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((resource) => (
          <Card
            key={resource.id}
            className="[contain-intrinsic-size:0_260px] [content-visibility:auto] transition-colors hover:border-violet-300"
          >
            <CardHeader>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge>{resource.level}</Badge>
                <Badge variant="secondary">{resource.area}</Badge>
                <Badge variant="outline">{resource.skill}</Badge>
              </div>
              <CardTitle>{resource.topic}</CardTitle>
              <CardDescription className="leading-6">
                {resource.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Quelle: {resource.provider}
              </p>
              <ResourceAction resource={resource} />
            </CardContent>
          </Card>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border bg-muted p-4 text-sm text-muted-foreground">
          Für diese Auswahl ist noch kein einzelnes Thema vorhanden. Wähle ein
          anderes Niveau oder „Alle“.
        </p>
      ) : null}
    </div>
  );
}
