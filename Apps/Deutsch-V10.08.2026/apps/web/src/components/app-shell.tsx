"use client";

import { ChevronDown, Clock3, Folder, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { AppNavigation } from "@/components/app-navigation";
import { ApiConnectionStatus } from "@/components/api-connection-status";
import { Brand } from "@/components/brand";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Badge } from "@/components/ui/badge";
import { InstallAppButton } from "@/features/pwa/install-app-button";
import {
  coreNavigation,
  libraryNavigation,
  secondaryNavigation,
} from "@/lib/navigation";
import { UserGuideButton } from "@/components/user-guide";
import { NeuroReader } from "@/components/neuro-reader";
import { ProfileProgressBadge } from "@/components/profile-progress-badge";
import { ReadingFocusSettings } from "@/components/reading-focus-settings";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

export function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { state, updateSettings } = useLearnerState();
  const [readingSettingsOpen, setReadingSettingsOpen] = useState(false);
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
  const navigationPathname = pathname.startsWith("/deutsch-mit-marija/uebung/")
    ? "/ressourcen"
    : pathname;
  const current =
    allNavigation.find((item) =>
      item.href === "/"
        ? navigationPathname === "/"
        : navigationPathname.startsWith(item.href),
    ) ?? coreNavigation[0]!;
  const CurrentIcon = current.icon;

  // The conversation studio ships its own complete product chrome. Wrapping
  // it in the shared shell creates two sidebars and two top bars, squeezing
  // the recording workspace and breaking parity with the English app.
  if (pathname.startsWith("/studio")) {
    return <>{children}</>;
  }
  // Filtered by href rather than positional index -- a prior version
  // indexed into primaryNavigation/secondaryNavigation by array position,
  // which silently left "/fortschritt" and "/wiederholungen" out of every
  // group (unreachable from the sidebar, only linkable by typing the URL
  // directly) and would have broken again the moment an item was inserted
  // or reordered, as happened when Mixed Practice was added.
  const practiceNavigation = allNavigation.filter((item) =>
    [
      "/",
      "/heute",
      "/gemischtes-training",
      "/studio",
      "/wiederholungen",
      "/vokabelkarten",
    ].includes(item.href),
  );
  const learningNavigation = allNavigation.filter((item) =>
    ["/grammatik", "/kasus-trainer", "/fertigkeiten", "/ressourcen"].includes(
      item.href,
    ),
  );
  const evidenceNavigation = allNavigation.filter((item) =>
    ["/fortschritt", "/analytics", "/fehler", "/audio"].includes(item.href),
  );
  const settingsNavigation = allNavigation.filter((item) =>
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
      <a className="skip-link" href="#main-content">
        Zum Hauptinhalt
      </a>
      <aside className="german-app-sidebar fixed inset-y-0 left-0 z-30 hidden border-r bg-sidebar/95 backdrop-blur xl:flex xl:flex-col">
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
                  aria-controls={`sidebar-group-${group.id}`}
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
                  <div id={`sidebar-group-${group.id}`}>
                    <AppNavigation
                      items={group.items}
                      label={`${group.title} Navigation`}
                    />
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
        <ProfileProgressBadge />
      </aside>

      <div className="german-app-frame min-w-0 xl:pl-[310px]">
        <header className="german-app-topbar sticky top-0 z-20 border-b bg-background/88 backdrop-blur-xl">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
            <div className="german-mobile-nav flex items-center gap-3 xl:hidden">
              <MobileNavigation />
              <Brand compact />
            </div>
            <div className="german-current-route hidden items-center gap-3 xl:flex">
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
              <div
                aria-label="Aktuelle Lernsprache: Deutsch"
                className="language-status"
              >
                <span>EN</span>
                <small>English</small>
                <i aria-hidden />
                <span data-current="true">DE</span>
                <strong>Deutsch</strong>
              </div>
              <ApiConnectionStatus />
              <NeuroReader
                onOpenSettings={() => setReadingSettingsOpen(true)}
                onToggleReadingRuler={(readingRuler) =>
                  updateSettings({ readingRuler })
                }
                settings={state.settings}
              />
              <ReadingFocusSettings
                onOpenChange={setReadingSettingsOpen}
                onUpdateSettings={updateSettings}
                open={readingSettingsOpen}
                settings={state.settings}
              />
              <UserGuideButton />
              <InstallAppButton surface="header" />
              <Badge
                variant="secondary"
                className="german-version-badge hidden md:inline-flex xl:inline-flex"
              >
                v20.8 · aktuelle Version
              </Badge>
            </div>
          </div>
        </header>
        <main
          className="german-app-main mx-auto w-full max-w-7xl overflow-x-clip px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
          id="main-content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
