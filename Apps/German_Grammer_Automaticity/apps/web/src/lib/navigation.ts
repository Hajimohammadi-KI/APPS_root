import {
  BookOpen,
  Bug,
  CircleHelp,
  CloudOff,
  GraduationCap,
  Headphones,
  House,
  Library,
  Mic2,
  Repeat2,
  Route,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  readonly href:
    | "/"
    | "/heute"
    | "/studio"
    | "/grammatik"
    | "/wiederholungen"
    | "/fehler"
    | "/audio"
    | "/themen"
    | "/deutsch-mit-marija"
    | "/ressourcen"
    | "/einstellungen"
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
    href: "/heute",
    label: "Tagespfad",
    subtitle: "7 Nachweise für heute",
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
    subtitle: "84 Themen von A1 bis C2",
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
  {
    href: "/themen",
    label: "Sprechthemen",
    subtitle: "79 Themen für den Transfer",
    icon: Library,
  },
] as const satisfies readonly NavigationItem[];

export const secondaryNavigation = [
  {
    href: "/deutsch-mit-marija",
    label: "Deutsch mit Marija",
    subtitle: "Geteilte B2–C2-Kursmaterialien",
    icon: GraduationCap,
  },
  {
    href: "/ressourcen",
    label: "Ressourcen",
    subtitle: "Kursmaterial und Direktlinks",
    icon: Library,
  },
  {
    href: "/einstellungen",
    label: "Einstellungen",
    subtitle: "Speicher, Installation und Daten",
    icon: Settings,
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

export const coreNavigation = primaryNavigation.slice(0, 5);
export const libraryNavigation = primaryNavigation.slice(5);
