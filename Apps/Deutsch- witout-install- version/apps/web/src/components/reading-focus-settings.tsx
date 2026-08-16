"use client";

import { Eye, Settings2, Sparkles, Type } from "lucide-react";

import type { LearnerSettings } from "@grammar/domain";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const TEXT_SCALES = [100, 112, 125] as const;

const READING_PROFILES = [
  {
    value: "standard" as const,
    label: "Standard",
    hint: "Normale Schrift und normaler Zeilenabstand.",
  },
  {
    value: "dyslexia" as const,
    label: "Leichter lesen",
    hint: "Mehr Zeilenabstand, ruhigere Schrift, breiterer Buchstabenabstand.",
  },
];

export function ReadingFocusSettings({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: LearnerSettings;
  onUpdateSettings: (settings: Partial<LearnerSettings>) => void;
}>) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        aria-label="Lese- und Fokuseinstellungen"
        className="w-[min(92vw,26rem)] overflow-y-auto sm:max-w-md"
        side="right"
      >
        <SheetHeader className="border-b px-5 py-5">
          <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
            <Settings2 aria-hidden="true" className="size-5" />
          </span>
          <SheetTitle className="text-xl font-bold">
            Lese- und Fokuseinstellungen
          </SheetTitle>
          <SheetDescription className="leading-6">
            Diese Einstellungen gelten sofort in dieser App und werden
            automatisch auf diesem Gerät gespeichert.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 px-5 py-5">
          <fieldset className="grid gap-3">
            <legend className="flex items-center gap-2 text-sm font-bold">
              <Eye aria-hidden="true" className="size-4" />
              Lesemodus
            </legend>
            <div className="grid gap-2">
              {READING_PROFILES.map((profile) => {
                const checked = settings.readingProfile === profile.value;
                return (
                  <label
                    className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm has-[:checked]:border-violet-400 has-[:checked]:bg-violet-50"
                    key={profile.value}
                  >
                    <input
                      checked={checked}
                      className="mt-1 size-4 accent-violet-700"
                      name="reading-profile"
                      onChange={() =>
                        onUpdateSettings({ readingProfile: profile.value })
                      }
                      type="radio"
                      value={profile.value}
                    />
                    <span className="grid gap-0.5">
                      <strong>{profile.label}</strong>
                      <span className="text-muted-foreground">
                        {profile.hint}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="flex items-center gap-2 text-sm font-bold">
              <Type aria-hidden="true" className="size-4" />
              Textgröße
            </legend>
            <div
              aria-label="Textgröße"
              className="flex flex-wrap gap-2"
              role="radiogroup"
            >
              {TEXT_SCALES.map((scale) => {
                const pressed = settings.textScale === scale;
                return (
                  <Button
                    aria-pressed={pressed}
                    key={scale}
                    onClick={() => onUpdateSettings({ textScale: scale })}
                    type="button"
                    variant={pressed ? "default" : "outline"}
                  >
                    {scale}%
                  </Button>
                );
              })}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm has-[:checked]:border-violet-400 has-[:checked]:bg-violet-50">
            <input
              checked={settings.lowStimulation}
              className="mt-1 size-4 accent-violet-700"
              onChange={(event) =>
                onUpdateSettings({ lowStimulation: event.target.checked })
              }
              type="checkbox"
            />
            <span className="grid gap-0.5">
              <strong className="flex items-center gap-2">
                <Sparkles aria-hidden="true" className="size-4" />
                Bewegung und visuelle Reize reduzieren
              </strong>
              <span className="text-muted-foreground">
                Schaltet Animationen, Übergänge und Schatten weitgehend ab.
              </span>
            </span>
          </label>
        </div>

        <SheetFooter className="border-t p-5">
          <Button onClick={() => onOpenChange(false)} size="lg" type="button">
            Fertig
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
