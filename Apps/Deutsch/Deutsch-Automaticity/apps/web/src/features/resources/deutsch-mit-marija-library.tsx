import {
  BookMarked,
  ExternalLink,
  FolderOpen,
  Headphones,
  MessageCircle,
  Quote,
  ShieldCheck,
  SpellCheck2,
} from "lucide-react";

import {
  deutschMitMarijaSourceFolders,
  discussionAudioMaterials,
  discussionGuideMaterials,
  errorRepairMaterials,
  grammarTrainingCatalog,
  idiomDailyMaterials,
} from "@grammar/content";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MaterialDetails } from "@/features/resources/drive-material-library";

const discussionMaterials = [
  ...discussionGuideMaterials,
  ...discussionAudioMaterials,
];

const courseStats = [
  {
    value: "24",
    label: "Idiomatik-Tage",
    icon: Quote,
    className: "bg-violet-100 text-violet-800",
  },
  {
    value: "127 + 4",
    label: "PDFs + Originalarchive",
    icon: BookMarked,
    className: "bg-sky-100 text-sky-800",
  },
  {
    value: "7",
    label: "Hörmodelle",
    icon: Headphones,
    className: "bg-emerald-100 text-emerald-800",
  },
  {
    value: "2",
    label: "Fehlerkurse",
    icon: SpellCheck2,
    className: "bg-amber-100 text-amber-900",
  },
] as const;

export function DeutschMitMarijaLibrary() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-violet-50 p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -top-12 -right-12 size-44 rounded-full bg-sky-200/40"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-sky-700">Geteilte Kursmaterialien</Badge>
              <Badge variant="outline">B2–C2</Badge>
              <Badge variant="outline">Quelle: Geteilte Kursmaterialien</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Deutschkurs-Materialien
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Deine freigegebenen Originaldateien sind vollständig und
              lektionenweise geordnet. Öffne nur den Abschnitt, den du gerade
              brauchst, und arbeite direkt mit der aktuellen Drive-Datei.
            </p>
          </div>
          <div
            aria-label="Quellordner der Kursmaterialien"
            className="grid w-full gap-2 sm:w-auto"
          >
            {deutschMitMarijaSourceFolders.map((folder) => (
              <a
                href={folder.url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "h-auto min-h-11 justify-start bg-white/80 px-3 py-2 text-left whitespace-normal",
                })}
                key={folder.id}
              >
                <FolderOpen data-icon="inline-start" />
                <span className="min-w-0">
                  <span className="block font-medium">{folder.title}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {folder.description}
                  </span>
                </span>
                <ExternalLink
                  aria-hidden="true"
                  className="ml-auto"
                  data-icon="inline-end"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-label="Umfang der Kursmaterialien"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {courseStats.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardContent className="flex items-center gap-3">
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${stat.className}`}
              >
                <stat.icon className="size-5" />
              </span>
              <span>
                <strong className="block text-xl leading-none">
                  {stat.value}
                </strong>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </span>
            </CardContent>
          </Card>
        ))}
      </section>

      <section aria-labelledby="course-learning-paths" className="space-y-3">
        <div>
          <p className="section-kicker">Vier kompakte Lernpfade</p>
          <h2 id="course-learning-paths" className="section-title">
            Material auswählen
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Alle Bereiche sind zunächst geschlossen. So bleibt die Seite ruhig
            und du siehst nur die Dateien der aktuell gewählten Aufgabe.
          </p>
          <p className="mt-3 max-w-3xl rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm leading-6 text-violet-950">
            <strong>Neu: Üben und prüfen.</strong> Jede einzelne Lernquelle hat
            jetzt eine eigene Übungsseite mit drei neu formulierten Aufgaben,
            sofortiger Korrektur und einer verständlichen Begründung. Der
            separate PDF-Knopf öffnet weiterhin genau die gewählte
            Originaldatei.
          </p>
        </div>

        <MaterialDetails
          icon={<Quote />}
          title="24-Tage-Training · Redewendungen, Sprichwörter & Zitate"
          description="24 direkt erreichbare Tageslektionen für Idiomatik, Zitieren, Interpretation und stilistischen Transfer."
          items={idiomDailyMaterials}
        />
        <MaterialDetails
          icon={<MessageCircle />}
          title="Diskussionen meistern · C1"
          description="Vier Handouts, ein Erklärvideo und sieben Hörmodelle für Konversationen und Vorträge."
          items={discussionMaterials}
        />
        <div className="space-y-3 rounded-2xl border border-sky-200 bg-sky-50/40 p-3 sm:p-4">
          <div className="flex items-start gap-3 px-1 py-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-800">
              <BookMarked className="size-5" />
            </span>
            <div>
              <h3 className="font-semibold">
                B2/C1 Grammatiktraining · 100 % der Dateien
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                127 einzelne PDF-Dateien und vier Originalarchive. Jeder Teil
                ist ein eigenes, zunächst geschlossenes Akkordeon.
              </p>
            </div>
          </div>
          {grammarTrainingCatalog.map((part) => (
            <MaterialDetails
              description={part.description}
              icon={<BookMarked />}
              items={part.items}
              key={part.id}
              title={part.title}
            />
          ))}
        </div>
        <MaterialDetails
          icon={<SpellCheck2 />}
          title="Finde die Fehler · B2"
          description="Zwei gezielte Fehlerkurse für Erkennen, Korrigieren und erneuten Transfer."
          items={errorRepairMaterials}
        />
      </section>

      <Card className="border-emerald-300/60 bg-emerald-50/60">
        <CardContent className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />
          <p className="text-sm leading-6 text-emerald-950">
            Die Kursdateien werden nicht in die App kopiert. Jeder Eintrag
            bietet eine urheberrechtlich getrennte, neu formulierte
            Transferübung. Der PDF-Knopf öffnet die freigegebene Originaldatei;
            dafür muss im Browser dasselbe Google-Konto angemeldet sein, für das
            die Datei freigegeben wurde. Die 127 einzelnen Grammatik-PDFs und
            alle vier Originalarchive bleiben separat erreichbar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
