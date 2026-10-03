"use client";

import { useState } from "react";
import { ChevronDown, LibraryBig, Menu } from "lucide-react";

import { AppNavigation } from "@/components/app-navigation";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  coreNavigation,
  libraryNavigation,
  secondaryNavigation,
} from "@/lib/navigation";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Navigation öffnen" />
        }
      >
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="w-[19rem] max-w-[85vw]">
        <SheetHeader className="border-b">
          <Brand />
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Bereiche der Lernanwendung
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <a
            href="/practice"
            className="mb-3 block rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white"
          >
            Eigenständig Grammatik üben
          </a>
          <AppNavigation
            ariaLabel="Tägliche Praxis"
            items={coreNavigation}
            onNavigate={() => setOpen(false)}
          />
          <details className="group mt-3">
            <summary className="flex min-h-10 cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50">
              <LibraryBig className="size-4.5" aria-hidden="true" />
              Mehr lernen
              <ChevronDown
                className="ms-auto size-4 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="mt-1 ps-2">
              <AppNavigation
                ariaLabel="Weitere Lernbereiche"
                items={libraryNavigation}
                onNavigate={() => setOpen(false)}
              />
            </div>
          </details>
          <div className="my-4 border-t" />
          <AppNavigation
            ariaLabel="App und Einstellungen"
            items={secondaryNavigation}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
