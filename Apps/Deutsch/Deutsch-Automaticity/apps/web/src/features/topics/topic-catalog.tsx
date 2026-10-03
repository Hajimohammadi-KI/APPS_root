"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Award, Search } from "lucide-react";

import { catalogSummary, speakingTopics } from "@grammar/content";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  LearningAccordion,
  type LearningAccordionTone,
} from "@/components/learning-accordion";

const levels = ["Alle", ...new Set(speakingTopics.map((topic) => topic.level))];
const tracks = ["Alle", ...new Set(speakingTopics.map((topic) => topic.track))];
const categories = [
  "Alle",
  ...new Set(speakingTopics.map((topic) => topic.category)),
];

export function TopicCatalog() {
  const [level, setLevel] = useState("Alle");
  const [track, setTrack] = useState("Alle");
  const [category, setCategory] = useState("Alle");
  const [search, setSearch] = useState("");
  const rows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("de");
    return speakingTopics.filter(
      (topic) =>
        (level === "Alle" || topic.level === level) &&
        (track === "Alle" || topic.track === track) &&
        (category === "Alle" || topic.category === category) &&
        (!query ||
          `${topic.topic} ${topic.task} ${topic.skill} ${topic.category}`
            .toLocaleLowerCase("de")
            .includes(query)),
    );
  }, [category, level, search, track]);
  const groupedRows = useMemo(
    () =>
      levels
        .filter((item) => item !== "Alle")
        .map((cefrLevel) => ({
          level: cefrLevel,
          topics: rows.filter((topic) => topic.level === cefrLevel),
        }))
        .filter((group) => group.topics.length > 0),
    [rows],
  );
  const achievements = [
    {
      key: "breadth",
      unlocked: rows.length >= 20,
      title: "Themen-Breite",
      hint: "20 Themen im Fokus",
    },
    {
      key: "path-focus",
      unlocked: track !== "Alle",
      title: "Pfad-Fokus",
      hint: "Einen Lernpfad gezielt wählen",
    },
    {
      key: "level-focus",
      unlocked: level !== "Alle",
      title: "Niveau-Fokus",
      hint: "Auf ein Niveau eingrenzen",
    },
  ] as const;
  const levelTones: readonly LearningAccordionTone[] = [
    "blue",
    "emerald",
    "amber",
    "violet",
    "rose",
    "blue",
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="section-kicker">Transfer</p>
        <h1 className="section-title">
          {catalogSummary.topicCount} Themen für die freie Produktion
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Der vollständige Gesprächskatalog aus v20.8: allgemeines,
          akademisches, DSH- und digitales TestDaF-Training.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CatalogSelect
            label="Lernpfad"
            value={track}
            values={tracks}
            onChange={setTrack}
          />
          <CatalogSelect
            label="Niveau"
            value={level}
            values={levels}
            onChange={setLevel}
          />
          <CatalogSelect
            label="Themenbereich"
            value={category}
            values={categories}
            onChange={setCategory}
          />
          <label className="grid gap-1.5 text-sm font-medium">
            Suche
            <span className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                type="search"
                className="pl-9"
                placeholder="Thema oder Aufgabe"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </span>
          </label>
        </CardContent>
      </Card>

      <section aria-label="Katalogmissionen" className="space-y-2">
        <h2 className="text-sm font-semibold text-sky-900">Schnellmissionen</h2>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          <article className="min-w-56 rounded-xl border bg-card p-3 text-sm shadow-sm">
            <strong className="block">Mission 1</strong>
            <span className="text-muted-foreground">
              1 neues Thema aus dem aktiven Filter im Studio starten.
            </span>
          </article>
          <article className="min-w-56 rounded-xl border bg-card p-3 text-sm shadow-sm">
            <strong className="block">Mission 2</strong>
            <span className="text-muted-foreground">
              Auf ein Niveau und eine Kategorie eingrenzen.
            </span>
          </article>
          <article className="min-w-56 rounded-xl border bg-card p-3 text-sm shadow-sm">
            <strong className="block">Mission 3</strong>
            <span className="text-muted-foreground">
              Aktuelle Treffer: {rows.length}
            </span>
          </article>
        </div>
      </section>

      <p className="text-sm text-muted-foreground">
        {rows.length} von {speakingTopics.length} Themen
      </p>

      <Card>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.key}
              className="flex items-center gap-2 rounded-lg border p-3 text-sm"
            >
              <Award
                className={`size-4 ${achievement.unlocked ? "text-amber-600" : "text-muted-foreground"}`}
              />
              <span className="min-w-0 flex-1 font-medium">
                {achievement.title}
              </span>
              <Badge variant={achievement.unlocked ? "secondary" : "outline"}>
                {achievement.unlocked ? "Erreicht" : achievement.hint}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {groupedRows.map((group, groupIndex) => (
          <LearningAccordion
            defaultOpen={groupIndex === 0}
            eyebrow={`${group.level} · freie Produktion`}
            group="deutsche-sprechthemen-niveaus"
            key={group.level}
            summary={`${group.topics.length} ${
              group.topics.length === 1 ? "Thema" : "Themen"
            }`}
            title={`Sprechthemen ${group.level}`}
            tone={levelTones[groupIndex] ?? "blue"}
          >
            <div className="grid gap-2">
              {group.topics.map((topic, topicIndex) => {
                const globalIndex = speakingTopics.indexOf(topic);
                return (
                  <LearningAccordion
                    defaultOpen={topicIndex === 0}
                    eyebrow={`${topic.category} · ${topic.skill}`}
                    group={`deutsche-sprechthemen-${group.level}`}
                    key={`${topic.level}-${topic.topic}`}
                    summary={`${topic.track} · Ziel: ${topic.targetGrammar}`}
                    title={topic.topic}
                    tone={
                      levelTones[
                        (groupIndex + topicIndex) % levelTones.length
                      ] ?? "blue"
                    }
                  >
                    <p className="mb-4 text-sm leading-7 text-muted-foreground">
                      {topic.task}
                    </p>
                    <Link
                      href={{
                        pathname: "/studio",
                        query: { topic: globalIndex },
                      }}
                      className={buttonVariants({ variant: "outline" })}
                    >
                      Im Studio öffnen
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </LearningAccordion>
                );
              })}
            </div>
          </LearningAccordion>
        ))}
      </div>

      {rows.length === 0 && (
        <p className="rounded-xl border bg-muted p-4 text-sm text-muted-foreground">
          Keine passenden Themen gefunden. Ändere die Filter.
        </p>
      )}
    </div>
  );
}

function CatalogSelect({
  label,
  value,
  values,
  onChange,
}: Readonly<{
  label: string;
  value: string;
  values: readonly string[];
  onChange: (value: string) => void;
}>) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium">
      {label}
      <select
        className="h-9 min-w-0 rounded-lg border bg-background px-3"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {values.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}
