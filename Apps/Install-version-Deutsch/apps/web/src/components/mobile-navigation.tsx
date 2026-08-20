"use client";

import { useEffect, useState } from "react";
import { BookOpenText, ChevronDown, Clock3, Folder, Menu } from "lucide-react";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState({
    practice: false,
    learning: false,
    evidence: false,
    settings: false,
  });
  const allNavigation = [
    ...coreNavigation,
    ...libraryNavigation,
    ...secondaryNavigation,
  ];
  const groups = [
    {
      id: "practice",
      title: "Tägliche Praxis",
      caption: "Heute üben und sprechen",
      icon: Clock3,
      items: allNavigation.filter((item) =>
        [
          "/heute",
          "/gemischtes-training",
          "/studio",
          "/wiederholungen",
          "/vokabelkarten",
        ].includes(item.href),
      ),
    },
    {
      id: "learning",
      title: "Lernpfade",
      caption: "Grammatik und Deutsch lernen",
      icon: BookOpenText,
      items: allNavigation.filter((item) =>
        [
          "/grammatik",
          "/kasus-trainer",
          "/fertigkeiten",
          "/ressourcen",
          "/notizbuch",
        ].includes(item.href),
      ),
    },
    {
      id: "evidence",
      title: "Lernnachweise",
      caption: "Fehler und Aufnahmen",
      icon: Clock3,
      items: allNavigation.filter((item) =>
        ["/fortschritt", "/analytics", "/fehler", "/audio"].includes(item.href),
      ),
    },
    {
      id: "settings",
      title: "App und Einstellungen",
      caption: "Speicher und persönliche Optionen",
      icon: Folder,
      items: allNavigation.filter((item) =>
        ["/einstellungen", "/lehrkraft"].includes(item.href),
      ),
    },
  ] as const;

  useEffect(() => {
    const activeGroup = groups.find((group) =>
      group.items.some((item) =>
        item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
      ),
    );
    setOpenGroups({
      practice: activeGroup?.id === "practice",
      learning: activeGroup?.id === "learning",
      evidence: activeGroup?.id === "evidence",
      settings: activeGroup?.id === "settings",
    });
  }, [pathname]);

  function toggleGroup(groupId: (typeof groups)[number]["id"]) {
    setOpenGroups((current) => ({
      practice: groupId === "practice" ? !current.practice : false,
      learning: groupId === "learning" ? !current.learning : false,
      evidence: groupId === "evidence" ? !current.evidence : false,
      settings: groupId === "settings" ? !current.settings : false,
    }));
  }

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
          <AppNavigation
            items={coreNavigation.slice(0, 1)}
            label="Startseite Navigation"
            onNavigate={() => setOpen(false)}
          />
          <div className="mobile-dropdown-menu mt-3">
            {groups.map((group) => {
              const GroupIcon = group.icon;
              const expanded = openGroups[group.id];
              const active = group.items.some((item) =>
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href),
              );
              return (
                <section
                  className="mobile-dropdown-section"
                  data-active={active}
                  data-open={expanded}
                  key={group.id}
                >
                  <button
                    aria-controls={`mobile-nav-group-${group.id}`}
                    aria-expanded={expanded}
                    className="mobile-dropdown-trigger"
                    onClick={() => toggleGroup(group.id)}
                    type="button"
                  >
                    <GroupIcon aria-hidden="true" className="size-4.5" />
                    <span>
                      <strong>{group.title}</strong>
                      <small>{group.caption}</small>
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className="mobile-dropdown-chevron size-4"
                    />
                  </button>
                  {expanded ? (
                    <div
                      className="mobile-dropdown-panel"
                      id={`mobile-nav-group-${group.id}`}
                    >
                      <AppNavigation
                        items={group.items}
                        label={`${group.title} Navigation`}
                        onNavigate={() => setOpen(false)}
                      />
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
