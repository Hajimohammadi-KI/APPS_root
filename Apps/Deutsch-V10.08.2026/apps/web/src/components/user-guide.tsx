"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CircleHelp,
  Mic2,
  Repeat2,
  Route,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const guideSteps = [
  {
    description:
      "Das heutige Training verbindet Wiederholung, Übung und Automatik in einer sinnvollen Reihenfolge.",
    href: "/heute",
    icon: Route,
    label: "Heutiges Training starten",
  },
  {
    description:
      "Im Gesprächsstudio sprichst oder schreibst du und erhältst direkt eine Korrektur.",
    href: "/studio",
    icon: Mic2,
    label: "Sprechen und reparieren",
  },
  {
    description:
      "Fällige Themen erscheinen automatisch. Erledige nur, was heute angezeigt wird.",
    href: "/wiederholungen",
    icon: Repeat2,
    label: "Wiederholungen erledigen",
  },
] as const;

export function UserGuideButton() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            aria-label="Hilfe zur Benutzung öffnen"
          />
        }
      >
        <CircleHelp aria-hidden="true" />
        Hilfe
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[min(92vw,28rem)] overflow-y-auto sm:max-w-md"
      >
        <SheetHeader className="border-b px-5 py-5">
          <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-sky-100 text-blue-700">
            <CircleHelp className="size-5" aria-hidden="true" />
          </span>
          <SheetTitle className="text-xl font-bold">
            So benutzt du DeutschFlow
          </SheetTitle>
          <SheetDescription className="leading-6">
            Wenn du unsicher bist, beginne immer mit Schritt 1. Dein Fortschritt
            wird automatisch auf diesem Gerät gespeichert.
          </SheetDescription>
        </SheetHeader>
        <GuideSteps className="p-5" />
        <div className="mx-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="flex items-center gap-2 font-bold">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Du kannst nichts kaputtmachen
          </p>
          <p className="mt-1 leading-6 text-emerald-900/75">
            Eingaben bleiben lokal gespeichert. In den Einstellungen kannst du
            jederzeit eine Sicherung exportieren.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              className="inline-flex h-8 items-center rounded-md border border-emerald-300 bg-white px-3 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
              href="/support"
              onClick={() => setOpen(false)}
            >
              Support öffnen
            </Link>
            <Link
              className="inline-flex h-8 items-center rounded-md border border-emerald-300 bg-white px-3 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
              href="/privacy"
              onClick={() => setOpen(false)}
            >
              Datenschutz lesen
            </Link>
          </div>
        </div>
        <SheetFooter className="border-t p-5">
          <Button
            nativeButton={false}
            size="lg"
            render={<a href="/heute" onClick={() => setOpen(false)} />}
          >
            Jetzt mit Schritt 1 beginnen
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            render={
              <Link href="/einstellungen" onClick={() => setOpen(false)} />
            }
          >
            Einstellungen und Sicherung
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function QuickStartGuide() {
  return (
    <section className="quick-start-guide" aria-labelledby="quick-start-title">
      <div className="quick-start-heading">
        <span className="quick-start-icon">
          <CircleHelp aria-hidden="true" />
        </span>
        <div>
          <p>Neu hier?</p>
          <h2 id="quick-start-title">In drei Schritten sicher starten</h2>
          <span>
            Folge einfach der Reihenfolge. Alles wird automatisch gespeichert.
          </span>
        </div>
      </div>
      <GuideSteps />
      <Button
        nativeButton={false}
        className="quick-start-action"
        render={<a href="/heute" />}
      >
        Schritt 1 starten
        <ArrowRight data-icon="inline-end" aria-hidden="true" />
      </Button>
      <div className="flex flex-wrap gap-2">
        <Button
          nativeButton={false}
          size="sm"
          variant="outline"
          render={<Link href="/support" />}
        >
          Support
        </Button>
        <Button
          nativeButton={false}
          size="sm"
          variant="outline"
          render={<Link href="/privacy" />}
        >
          Datenschutz
        </Button>
      </div>
    </section>
  );
}

function GuideSteps({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <ol className={`guide-step-list ${className}`}>
      {guideSteps.map((step, index) => {
        const Icon = step.icon;
        return (
          <li key={step.href}>
            <span className="guide-step-number">{index + 1}</span>
            <span className="guide-step-icon">
              <Icon aria-hidden="true" />
            </span>
            <span className="guide-step-copy">
              <strong>{step.label}</strong>
              <span>{step.description}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
