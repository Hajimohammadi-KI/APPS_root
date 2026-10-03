"use client";
import { AutomaticityEvidenceSummary } from "@/features/progress/automaticity-evidence-summary";

import { ChevronDown, Clock3, Folder, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import webRelease from "../../public/web-release.json";

import { AppNavigation } from "@/components/app-navigation";
import { ApiConnectionStatus } from "@/components/api-connection-status";
import { Brand } from "@/components/brand";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Badge } from "@/components/ui/badge";
import { InstallAppButton } from "@/features/pwa/install-app-button";
import {
  coreNavigation,
  libraryNavigation,
  primaryNavigation,
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
  const { state, updateSettings } = useLearnerState();
  const [openGroups, setOpenGroups] = useState({
    practice: true,
    learning: true,
    evidence: true,
    settings: true,
  });
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
  const practiceNavigation = [
    primaryNavigation[0]!,
    primaryNavigation[2]!,
    primaryNavigation[3]!,
  ];
  const learningNavigation = [
    primaryNavigation[4]!,
    secondaryNavigation[0]!,
    secondaryNavigation[1]!,
  ];
  const evidenceNavigation = [primaryNavigation[6]!, primaryNavigation[7]!];
  const settingsNavigation = secondaryNavigation.filter((item) =>
    ["/einstellungen", "/lehrkraft"].includes(item.href),
  );
  const groups = [
    {
      id: "practice",
      title: "Tägliche Praxis",
      caption: "Heute üben und sprechen",
      icon: Clock3,
      items: practiceNavigation,
    },
    {
      id: "learning",
      title: "Lernpfade",
      caption: "Grammatik und Deutsch lernen",
      icon: Settings,
      items: learningNavigation,
    },
    {
      id: "evidence",
      title: "Lernnachweise",
      caption: "Fehler und Aufnahmen",
      icon: Clock3,
      items: evidenceNavigation,
    },
    {
      id: "settings",
      title: "App und Einstellungen",
      caption: "Speicher und persönliche Optionen",
      icon: Folder,
      items: settingsNavigation,
    },
  ] as const;

  return (
    <div className="min-h-screen">
      {/* Keyboard users can bypass repeated navigation and land on the single main region. */}
      <a className="skip-link" href="#main-content">
        Zum Hauptinhalt springen
      </a>
      <aside className="german-app-sidebar fixed inset-y-0 left-0 z-30 hidden border-r bg-sidebar/95 backdrop-blur xl:flex xl:flex-col">
        <a
          href="/practice"
          className="m-3 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white"
        >
          Eigenständig Grammatik üben
        </a>
        <div className="px-2">
          <Brand />
        </div>
        <div className="german-sidebar-groups mt-7 flex-1">
          {groups.map((group) => {
            const GroupIcon = group.icon;
            const expanded = openGroups[group.id];
            return (
              <section className="german-sidebar-section" key={group.id}>
                <p className="german-sidebar-label">{group.title}</p>
                <button
                  aria-expanded={expanded}
                  className="german-sidebar-trigger"
                  onClick={() =>
                    setOpenGroups((current) => ({
                      ...current,
                      [group.id]: !current[group.id],
                    }))
                  }
                  type="button"
                >
                  <GroupIcon className="size-5" aria-hidden="true" />
                  <span>{group.caption}</span>
                  <ChevronDown className="ms-auto size-4" aria-hidden="true" />
                </button>
                {expanded ? (
                  <AppNavigation ariaLabel={group.title} items={group.items} />
                ) : null}
              </section>
            );
          })}
        </div>
      </aside>

      <div className="min-w-0 xl:pl-[310px]">
        <header className="german-app-topbar sticky top-0 z-20 border-b bg-background/88 backdrop-blur-xl">
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
            <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 justify-self-end">
              <a
                href="/roadmap.html"
                className="inline-flex min-h-11 shrink-0 items-center rounded-lg border px-3 text-sm font-semibold"
                lang="fa"
                dir="rtl"
              >
                رودمپ
              </a>
              <ApiConnectionStatus />
              <NeuroReader
                onOpenSettings={() => router.push("/einstellungen")}
                onToggleReadingRuler={(readingRuler) =>
                  updateSettings({ readingRuler })
                }
                settings={state.settings}
              />
              <UserGuideButton />
              <InstallAppButton surface="header" />
              <Badge variant="secondary" className="hidden xl:inline-flex">
                Web · {webRelease.release}
              </Badge>
            </div>
          </div>
        </header>
        <main
          className="german-app-main mx-auto w-full max-w-7xl overflow-x-clip px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
          id="main-content"
          tabIndex={-1}
        >
          {children}
          {["/studio", "/fehler", "/wiederholungen", "/lehrkraft"].includes(
            pathname,
          ) ? (
            <AutomaticityEvidenceSummary />
          ) : null}
        </main>
      </div>
    </div>
  );
}
