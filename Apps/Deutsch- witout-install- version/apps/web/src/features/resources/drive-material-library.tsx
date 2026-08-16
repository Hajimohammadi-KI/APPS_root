import {
  BookOpen,
  Dumbbell,
  ExternalLink,
  FolderOpen,
  Headphones,
  Library,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";

import {
  discussionAudioMaterials,
  driveMaterialCollections,
  driveMaterialFolderUrl,
  idiomDailyMaterials,
  type DriveMaterialItem,
} from "@grammar/content";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pdfReaderHrefForMaterial } from "@/lib/pdf-reader-link";

const kindLabels = {
  course: "Kurs",
  practice: "Training",
  audio: "Audio",
  reference: "Nachschlagen",
} as const;

function ReaderAwareMaterialLink({
  url,
  name,
  focus,
  context,
  isPdf,
  materialId,
  className,
  children,
}: Readonly<{
  url: string;
  name: string;
  focus: string;
  context: string;
  isPdf: boolean;
  materialId?: string;
  className: string;
  children: React.ReactNode;
}>) {
  const readerHref = pdfReaderHrefForMaterial({
    sourceUrl: url,
    name,
    focus,
    context,
    isPdf,
    ...(materialId ? { materialId } : {}),
  });

  return (
    <a
      href={readerHref || url}
      target={readerHref ? undefined : "_blank"}
      rel={readerHref ? undefined : "noopener noreferrer"}
      className={className}
      title={
        readerHref
          ? "Normal klicken: hier öffnen. Rechtsklick: in neuem Tab oder Fenster öffnen."
          : undefined
      }
    >
      {children}
    </a>
  );
}

export function DriveMaterialLibrary() {
  return (
    <section aria-labelledby="drive-material-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Deine Materialsammlung</p>
          <h2 id="drive-material-heading" className="section-title">
            Lernbibliothek aus Google Drive
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Die Bücher bleiben in deinem Drive. In der App sind sie als
            übersichtliche Lernpfade, Tagestraining und Audio-Transfer
            eingeordnet, damit keine doppelten oder komprimierten Kopien den
            Lernweg überladen.
          </p>
          <p className="mt-3 max-w-3xl rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm leading-6 text-violet-950">
            <strong>PDF öffnen:</strong> Ein normaler Klick öffnet genau die
            gewählte Datei hier im PDF Reader. Mit Rechtsklick kannst du
            stattdessen einen neuen Tab oder ein neues Fenster wählen.
          </p>
        </div>
        <a
          href={driveMaterialFolderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          <FolderOpen data-icon="inline-start" />
          Gesamtordner öffnen
          <ExternalLink data-icon="inline-end" />
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {driveMaterialCollections.map((collection) => (
          <Card key={collection.id} size="sm">
            <CardHeader>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge>{collection.level}</Badge>
                <Badge variant="secondary">{kindLabels[collection.kind]}</Badge>
              </div>
              <CardTitle>{collection.title}</CardTitle>
              <CardDescription>{collection.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs leading-5 text-muted-foreground">
                {collection.assetSummary}
              </span>
              <span className="flex flex-wrap gap-2">
                <Link
                  className={buttonVariants({ size: "sm" })}
                  href={`/deutsch-mit-marija/uebung/${collection.id}` as Route}
                >
                  <Dumbbell data-icon="inline-start" />
                  Üben und prüfen
                </Link>
                <ReaderAwareMaterialLink
                  url={collection.url}
                  name={collection.title}
                  focus={collection.description}
                  context={`Deutsch ${collection.level} · ${kindLabels[collection.kind]}`}
                  isPdf={collection.assetSummary.includes("PDF")}
                  materialId={collection.id}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <BookOpen data-icon="inline-start" />
                  {collection.url.includes("/file/d/") &&
                  collection.assetSummary.includes("PDF")
                    ? "PDF genau hier öffnen"
                    : "Material öffnen"}
                  <ExternalLink data-icon="inline-end" />
                </ReaderAwareMaterialLink>
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MaterialDetails
          icon={<Library />}
          title="24-Tage-Training · Redewendungen"
          description="Jeder Tag ist direkt erreichbar; Tag 10 und Tag 24 dienen als gemischte Wiederholung und Abschlusstest."
          items={idiomDailyMaterials}
        />
        <MaterialDetails
          icon={<Headphones />}
          title="C1-Diskussionsaudio"
          description="Sieben Hörmodelle für Perspektivwechsel, Redemittel und die Audio-Transkript-Vergleichsphase."
          items={discussionAudioMaterials}
        />
      </div>
    </section>
  );
}

export function MaterialDetails({
  icon,
  title,
  description,
  items,
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  description: string;
  items: readonly DriveMaterialItem[];
}>) {
  return (
    <details className="overflow-hidden rounded-xl border bg-card">
      <summary className="cursor-pointer list-none p-4 marker:hidden">
        <span className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-700 [&>svg]:size-4">
            {icon}
          </span>
          <span>
            <strong className="block">{title}</strong>
            <span className="mt-1 block text-sm leading-6 text-muted-foreground">
              {description}
            </span>
            <span className="mt-2 block text-xs font-semibold text-sky-800">
              {items.length} Einträge anzeigen
            </span>
          </span>
        </span>
      </summary>
      <ul className="max-h-96 divide-y overflow-y-auto border-t">
        {items.map((item) => (
          <li className="px-3 py-2.5 sm:px-4" key={item.id}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">{item.format}</Badge>
              <span className="min-w-0 flex-1">{item.title}</span>
              {item.format !== "Archiv" && item.format !== "Ordner" ? (
                <Link
                  className={buttonVariants({ size: "sm" })}
                  href={`/deutsch-mit-marija/uebung/${item.id}` as Route}
                >
                  <Dumbbell data-icon="inline-start" />
                  Üben
                </Link>
              ) : null}
              <ReaderAwareMaterialLink
                url={item.url}
                name={item.title}
                focus={`Bearbeite gezielt: ${item.title}`}
                context={`Deutsch ${item.level} · ${item.format}`}
                isPdf={item.format === "PDF"}
                materialId={item.id}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <BookOpen data-icon="inline-start" />
                {item.format === "PDF" ? "PDF" : "Quelle"}
                <ExternalLink data-icon="inline-end" />
              </ReaderAwareMaterialLink>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}
