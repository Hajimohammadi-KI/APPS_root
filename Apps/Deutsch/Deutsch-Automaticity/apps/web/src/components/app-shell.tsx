"use client";
import { usePathname, useRouter } from "next/navigation";
import { LearningNavigation } from "@/components/learning-navigation";
import { ApiConnectionStatus } from "@/components/api-connection-status";
import { Brand } from "@/components/brand";
import { MobileNavigation } from "@/components/mobile-navigation";
import { InstallAppButton } from "@/features/pwa/install-app-button";
import { primaryNavigation, secondaryNavigation } from "@/lib/navigation";
import { UserGuideButton } from "@/components/user-guide";
import { NeuroReader } from "@/components/neuro-reader";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
import { AutomaticityEvidenceSummary } from "@/features/progress/automaticity-evidence-summary";
import webRelease from "../../public/web-release.json";

export function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, updateSettings } = useLearnerState();
  const current =
    [...primaryNavigation, ...secondaryNavigation].find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    ) ?? primaryNavigation[0];
  return (
    <div className="min-h-screen">
      <a className="skip-link" href="#main-content">
        Zum Hauptinhalt springen
      </a>
      <aside className="german-app-sidebar fixed inset-y-0 left-0 z-30 hidden border-r xl:flex xl:flex-col">
        <Brand />
        <div className="german-sidebar-groups mt-7 flex-1">
          <LearningNavigation language="de" current={pathname} />
        </div>
      </aside>
      <div className="german-shell-body">
        <header className="german-app-topbar sticky top-0 z-20 border-b">
          <div className="flex min-h-20 items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="xl:hidden">
                <MobileNavigation />
              </div>
              <strong className="text-sm">{current.label}</strong>
            </div>
            <details className="app-tools">
              <summary>Hilfe & Werkzeuge</summary>
              <div className="app-tools-panel">
                <p>Lesen, Installation und Verbindung</p>
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
                <a href="/roadmap.html" lang="fa" dir="rtl">
                  رودمپ
                </a>
                <p>Web · {webRelease.release}</p>
              </div>
            </details>
          </div>
        </header>
        <main
          className="german-app-main mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
          id="main-content"
          tabIndex={-1}
        >
          {children}
          {["/studio", "/fehler", "/wiederholungen", "/lehrkraft"].includes(
            pathname,
          ) ? (
            <details className="quiet-disclosure">
              <summary>Antworten & Lernnachweise</summary>
              <div>
                <AutomaticityEvidenceSummary />
              </div>
            </details>
          ) : null}
        </main>
      </div>
    </div>
  );
}
