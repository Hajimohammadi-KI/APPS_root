import {
  BookOpen,
  Bug,
  ChartNoAxesCombined,
  CircleHelp,
  CloudOff,
  Headphones,
  House,
  Library,
  Mic2,
  Repeat2,
  Route,
  Shapes,
  Settings,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  readonly href:
    | "/"
    | "/fortschritt"
    | "/heute"
    | "/studio"
    | "/grammatik"
    | "/wiederholungen"
    | "/fehler"
    | "/audio"
    | "/ressourcen"
    | "/fertigkeiten"
    | "/einstellungen"
    | "/lehrkraft"
    | "/support"
    | "/privacy"
    | "/offline";
  readonly label: string;
  readonly subtitle: string;
  readonly icon: LucideIcon;
}

export const primaryNavigation = [
  {
    href: "/",
    label: "Start",
    subtitle: "Dein Fortschritt auf einen Blick",
    icon: House,
  },
  {
    href: "/fortschritt",
    label: "Fortschritt & Nachweise",
    subtitle: "Status, Fehler und Lernnachweise",
    icon: ChartNoAxesCombined,
  },
  {
    href: "/heute",
    label: "Heutiges Training",
    subtitle: "Adaptiver Abruf und Automatik",
    icon: Route,
  },
  {
    href: "/studio",
    label: "Gesprächsstudio",
    subtitle: "Aufnehmen, korrigieren, antworten",
    icon: Mic2,
  },
  {
    href: "/grammatik",
    label: "Grammatik-Labor",
    subtitle: "144 Themen von A1 bis C2",
    icon: BookOpen,
  },
  {
    href: "/wiederholungen",
    label: "Wiederholungen",
    subtitle: "1 · 3 · 7 · 14 · 30 Tage",
    icon: Repeat2,
  },
  {
    href: "/fehler",
    label: "Fehlermotor",
    subtitle: "Fehler in Können verwandeln",
    icon: Bug,
  },
  {
    href: "/audio",
    label: "Audio-Bibliothek",
    subtitle: "Fortschritt hörbar machen",
    icon: Headphones,
  },
] as const satisfies readonly NavigationItem[];

export const secondaryNavigation = [
  {
    href: "/fertigkeiten",
    label: "Integrierte Fertigkeiten",
    subtitle: "A1–C2: Hören, Lesen, Sprechen und Schreiben",
    icon: Shapes,
  },
  {
    href: "/ressourcen",
    label: "Ressourcen",
    subtitle: "Eigene Übungen und öffentliche Direktlinks",
    icon: Library,
  },
  {
    href: "/einstellungen",
    label: "Einstellungen",
    subtitle: "Speicher, Installation und Daten",
    icon: Settings,
  },
  {
    href: "/lehrkraft",
    label: "Lehrkraft-Studio",
    subtitle: "Inhalte und menschliche Aufnahmen verwalten",
    icon: GraduationCap,
  },
  {
    href: "/support",
    label: "Support",
    subtitle: "Installation und Hilfe",
    icon: CircleHelp,
  },
  {
    href: "/privacy",
    label: "Datenschutz",
    subtitle: "Lokale Daten und Einwilligungen",
    icon: CloudOff,
  },
] as const satisfies readonly NavigationItem[];

export const coreNavigation = primaryNavigation.slice(0, 6);
export const libraryNavigation = primaryNavigation.slice(6);
