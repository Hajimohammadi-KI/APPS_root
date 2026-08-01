"use client";

import { ChevronDown, CloudOff, LibraryBig } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { AppNavigation } from "@/components/app-navigation";
import { Brand } from "@/components/brand";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InstallAppButton } from "@/features/pwa/install-app-button";
import {
  coreNavigation,
  libraryNavigation,
  secondaryNavigation,
} from "@/lib/navigation";
import { UserGuideButton } from "@/components/user-guide";
import { NeuroReader } from "@/components/neuro-reader";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

export function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useLearnerState();
  const moreIsActive = libraryNavigation.some((item) =>
    pathname.startsWith(item.href),
  );
  const [moreOpen, setMoreOpen] = useState(moreIsActive);
  const allNavigation = [
    ...coreNavigation,
    ...libraryNavigation,
    ...secondaryNavigation,
  ];
  const current =
    allNavigation.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    ) ?? coreNavigation[0]!;
  const CurrentIcon = current.icon;

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 border-r bg-sidebar/95 px-4 py-5 backdrop-blur xl:flex xl:flex-col">
        <div className="px-2">
          <Brand />
        </div>
        <div className="mt-8 flex-1">
          <p className="mb-2 px-3 text-[0.65rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Lernen
          </p>
          <AppNavigation items={coreNavigation} />
          <details
            className="group mt-3"
            open={moreOpen}
            onToggle={(event) => setMoreOpen(event.currentTarget.open)}
          >
            <summary className="flex min-h-10 cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
              <LibraryBig className="size-4.5" aria-hidden="true" />
              Mehr lernen
              <ChevronDown
                className="ms-auto size-4 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="mt-1 ps-2">
              <AppNavigation items={libraryNavigation} />
            </div>
          </details>
        </div>
        <Separator className="my-4" />
        <AppNavigation items={secondaryNavigation} />
        <div className="mt-4 rounded-xl border bg-secondary/75 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-secondary-foreground">
            <CloudOff className="size-3.5" aria-hidden="true" />
            Lokal + gemeinsames Profil
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Antworten und Audio bleiben lokal; kompakte Evidenz kann zwischen
            den drei Apps geteilt werden.
          </p>
        </div>
      </aside>

      <div className="min-w-0 xl:pl-68">
        <header className="sticky top-0 z-20 border-b bg-background/88 backdrop-blur-xl">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 xl:hidden">
              <MobileNavigation />
              <Brand compact />
            </div>
            <div className="hidden items-center gap-3 xl:flex">
              <span className="grid size-9 place-items-center rounded-xl border border-primary/20 bg-secondary text-primary">
                <CurrentIcon className="size-4.5" aria-hidden="true" />
              </span>
              <span>
                <strong className="block text-sm">{current.label}</strong>
                <span className="block text-xs text-muted-foreground">
                  {current.subtitle}
                </span>
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-2 justify-self-end">
              <NeuroReader
                onOpenSettings={() => router.push("/einstellungen")}
                settings={state.settings}
              />
              <UserGuideButton />
              <InstallAppButton surface="header" />
              <Badge
                variant="secondary"
                className="hidden md:inline-flex xl:inline-flex"
              >
                v20.8 · volle Parität
              </Badge>
            </div>
          </div>
        </header>
        <main
          className="mx-auto w-full max-w-7xl overflow-x-clip px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
          id="main-content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
