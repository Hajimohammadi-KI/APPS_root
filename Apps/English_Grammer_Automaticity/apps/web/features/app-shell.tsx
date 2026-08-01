"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  BookOpenText,
  BrainCircuit,
  ChevronDown,
  CircleAlert,
  CloudDownload,
  Flame,
  FileMusic,
  House,
  LibraryBig,
  Menu,
  MessagesSquare,
  Settings,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallAppControl } from "@/features/components/install-app-control";
import { NeuroReader } from "@/features/components/neuro-reader";
import { DashboardScreen } from "@/features/screens/dashboard-screen";
import { useAppStore } from "@/features/store/app-store";
import { UserGuideButton } from "@/features/user-guide";

const ConversationScreen = dynamic(() =>
  import("@/features/screens/conversation-screen").then((module) => module.ConversationScreen),
);
const DailyScreen = dynamic(() =>
  import("@/features/screens/daily-screen").then((module) => module.DailyScreen),
);
const GrammarScreen = dynamic(() =>
  import("@/features/screens/grammar-screen").then((module) => module.GrammarScreen),
);
const ResourcesScreen = dynamic(() =>
  import("@/features/screens/resources-screen").then((module) => module.ResourcesScreen),
);
const QSkillsScreen = dynamic(() =>
  import("@/features/screens/qskills-screen").then((module) => module.QSkillsScreen),
);
const ErrorsScreen = dynamic(() =>
  import("@/features/screens/errors-screen").then((module) => module.ErrorsScreen),
);
const AudioScreen = dynamic(() =>
  import("@/features/screens/audio-screen").then((module) => module.AudioScreen),
);
const SettingsScreen = dynamic(() =>
  import("@/features/screens/settings-screen").then((module) => module.SettingsScreen),
);

type ScreenId =
  | "home"
  | "studio"
  | "daily"
  | "grammar"
  | "qskills"
  | "resources"
  | "errors"
  | "library"
  | "settings";

interface NavigationItem {
  id: ScreenId;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const homeNavigation: NavigationItem = {
  id: "home",
  label: "Home",
  subtitle: "Progress and next step",
  icon: House,
};

const navigation: NavigationItem[] = [
  homeNavigation,
  {
    id: "daily",
    label: "Daily Training",
    subtitle: "Your customized practice session",
    icon: Flame,
  },
  {
    id: "studio",
    label: "Conversation Studio",
    subtitle: "Speak, correct, and repeat",
    icon: MessagesSquare,
  },
  {
    id: "grammar",
    label: "Grammar Lab",
    subtitle: "112 units from A1 to C2",
    icon: BookOpenText,
  },
  {
    id: "resources",
    label: "Learning Resources",
    subtitle: "43 direct source collections",
    icon: CloudDownload,
  },
  {
    id: "qskills",
    label: "Q: Skills",
    subtitle: "5 levels · 40 units · 4 skills",
    icon: LibraryBig,
  },
  {
    id: "errors",
    label: "Error Workshop",
    subtitle: "Fix recurring errors with focus",
    icon: CircleAlert,
  },
  {
    id: "library",
    label: "Audio Library",
    subtitle: "Review your spoken progress",
    icon: FileMusic,
  },
  {
    id: "settings",
    label: "Settings",
    subtitle: "Learning, storage, and platform",
    icon: Settings,
  },
];

type NavigationGroupId = "practice" | "curriculum" | "evidence" | "system";

interface NavigationGroup {
  id: NavigationGroupId;
  label: string;
  caption: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    id: "practice",
    label: "Daily Practice",
    caption: "Practice and speak today",
    items: navigation.slice(0, 3),
  },
  {
    id: "curriculum",
    label: "Learning Paths",
    caption: "Grammar and English study",
    items: navigation.filter((item) =>
      ["grammar", "qskills", "resources"].includes(item.id),
    ),
  },
  {
    id: "evidence",
    label: "Learning Evidence",
    caption: "Errors and recordings",
    items: navigation.filter((item) =>
      ["errors", "library"].includes(item.id),
    ),
  },
  {
    id: "system",
    label: "App and Settings",
    caption: "Storage and personal options",
    items: navigation.filter((item) => item.id === "settings"),
  },
];

const defaultOpenGroups: Record<NavigationGroupId, boolean> = {
  practice: true,
  curriculum: false,
  evidence: false,
  system: false,
};

function isScreenId(value: string | null): value is ScreenId {
  return navigation.some((item) => item.id === value);
}

export function AppShell() {
  const { state } = useAppStore();
  const [screen, setScreen] = React.useState<ScreenId>("home");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [openGroups, setOpenGroups] =
    React.useState<Record<NavigationGroupId, boolean>>(defaultOpenGroups);
  const sidebarRef = React.useRef<HTMLElement>(null);
  const current =
    navigation.find((item) => item.id === screen) ?? homeNavigation;
  const CurrentIcon = current.icon;

  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const restoreScreen = () => {
      const url = new URL(window.location.href);
      const target = url.searchParams.get("screen");
      if (isScreenId(target)) {
        setScreen(target);
      } else {
        if (target) {
          url.searchParams.delete("screen");
          window.history.replaceState({ screen: "home" }, "", url);
        }
        setScreen("home");
      }
      setMenuOpen(false);
    };
    restoreScreen();
    window.addEventListener("popstate", restoreScreen);
    return () => {
      window.removeEventListener("popstate", restoreScreen);
    };
  }, []);

  React.useEffect(() => {
    const group = navigationGroups.find((candidate) =>
      candidate.items.some((item) => item.id === screen),
    );
    if (!group) return;
    setOpenGroups((currentGroups) =>
      currentGroups[group.id]
        ? currentGroups
        : { ...currentGroups, [group.id]: true },
    );
  }, [screen]);

  React.useEffect(() => {
    if (!menuOpen) return;
    if (window.matchMedia("(max-width: 860px)").matches) {
      sidebarRef.current
        ?.querySelector<HTMLElement>(".nav-button, .nav-group-trigger")
        ?.focus();
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        window.setTimeout(
          () => document.getElementById("mobile-menu-trigger")?.focus(),
          0,
        );
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const trapMobileMenuFocus = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (
        event.key !== "Tab" ||
        !menuOpen ||
        !window.matchMedia("(max-width: 860px)").matches
      ) {
        return;
      }
      const focusable = [
        ...(sidebarRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? []),
      ];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    },
    [menuOpen],
  );

  const navigate = React.useCallback((target: string) => {
    if (!isScreenId(target)) return;
    const url = new URL(window.location.href);
    if (target === "home") url.searchParams.delete("screen");
    else url.searchParams.set("screen", target);
    window.history.pushState({ screen: target }, "", url);
    setScreen(target);
    setMenuOpen(false);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, []);

  return (
    <div className="app-shell" data-screen={screen}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside
        aria-label={menuOpen ? "English learning navigation" : undefined}
        aria-modal={menuOpen || undefined}
        className="app-sidebar"
        data-open={menuOpen}
        onKeyDown={trapMobileMenuFocus}
        ref={sidebarRef}
        role={menuOpen ? "dialog" : undefined}
      >
        <div className="brand-mark">
          <span className="brand-icon">
            <BrainCircuit aria-hidden className="size-5" />
          </span>
          <span className="brand-copy">
            <strong>English Automaticity</strong>
            <span>Measurable daily language practice</span>
          </span>
        </div>
        <nav aria-label="Product navigation" className="sidebar-nav">
          {navigationGroups.map((group) => {
            const expanded = openGroups[group.id];
            const groupIsActive = group.items.some((item) => item.id === screen);
            return (
              <section
                className="nav-group"
                data-active={groupIsActive}
                key={group.id}
              >
                <button
                  aria-controls={`nav-group-${group.id}`}
                  aria-expanded={expanded}
                  className="nav-group-trigger"
                  onClick={() =>
                    setOpenGroups((groups) => ({
                      ...groups,
                      [group.id]: !groups[group.id],
                    }))
                  }
                  type="button"
                >
                  <span className="nav-group-copy">
                    <strong>{group.label}</strong>
                    <small>{group.caption}</small>
                  </span>
                  <ChevronDown aria-hidden className="nav-group-chevron size-4" />
                </button>
                {expanded ? (
                  <div className="nav-group-panel" id={`nav-group-${group.id}`}>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <a
                          className="nav-button"
                          data-active={item.id === screen}
                          href={
                            item.id === "home" ? "/" : `/?screen=${item.id}`
                          }
                          key={item.id}
                          onClick={(event) => {
                            if (
                              event.button !== 0 ||
                              event.metaKey ||
                              event.ctrlKey ||
                              event.shiftKey ||
                              event.altKey
                            ) {
                              return;
                            }
                            event.preventDefault();
                            navigate(item.id);
                          }}
                        >
                          <Icon aria-hidden className="size-4.5" />
                          {item.label}
                        </a>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </nav>
      </aside>
      {menuOpen ? (
        <button
          aria-label="Close navigation"
          className="sidebar-scrim"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      ) : null}
      <main className="app-main" id="main-content">
        <header className="app-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              aria-expanded={menuOpen}
              aria-label={
                menuOpen ? "Close navigation" : "Open navigation"
              }
              className="mobile-menu"
              id="mobile-menu-trigger"
              onClick={() => setMenuOpen((value) => !value)}
              size="icon"
              variant="outline"
            >
              {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
            </Button>
            <span className="topbar-screen-icon">
              <CurrentIcon aria-hidden className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{current.label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {current.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NeuroReader
              onOpenSettings={() => navigate("settings")}
              settings={state.settings}
            />
            <UserGuideButton navigate={navigate} />
            <InstallAppControl />
          </div>
        </header>
        <div className="app-content" data-screen={screen}>
          {screen === "home" ? <DashboardScreen navigate={navigate} /> : null}
          {screen === "studio" ? <ConversationScreen navigate={navigate} /> : null}
          {screen === "daily" ? <DailyScreen navigate={navigate} /> : null}
          {screen === "grammar" ? <GrammarScreen navigate={navigate} /> : null}
          {screen === "qskills" ? <QSkillsScreen /> : null}
          {screen === "resources" ? <ResourcesScreen /> : null}
          {screen === "errors" ? <ErrorsScreen /> : null}
          {screen === "library" ? <AudioScreen /> : null}
          {screen === "settings" ? <SettingsScreen /> : null}
        </div>
      </main>
    </div>
  );
}
