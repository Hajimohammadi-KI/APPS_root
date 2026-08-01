import {
  BookOpen,
  ExternalLink,
  FolderOpen,
  Headphones,
  Library,
} from "lucide-react";

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

const kindLabels = {
  course: "Kurs",
  practice: "Training",
  audio: "Audio",
  reference: "Nachschlagen",
} as const;

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
              <a
                href={collection.url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <BookOpen data-icon="inline-start" />
                Material öffnen
                <ExternalLink data-icon="inline-end" />
              </a>
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
          <li key={item.id}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
            >
              <Badge variant="outline">{item.format}</Badge>
              <span className="min-w-0 flex-1">{item.title}</span>
              <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
