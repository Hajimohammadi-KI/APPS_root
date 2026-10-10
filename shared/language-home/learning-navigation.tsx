import {
  ChartNoAxesCombined,
  ChevronDown,
  House,
  Library,
  Play,
  Settings,
} from "lucide-react";

const navigationConfig = {
  en: {
    main: [
      { href: "/", label: "Home", icon: "⌂" },
      { href: "/practice", label: "My practice", icon: "▶" },
      { href: "/grammar", label: "Grammar", icon: "▣" },
      { href: "/studio", label: "Conversation", icon: "▢" },
      { href: "/progress", label: "My progress", icon: "◷" },
    ],
    more: [
      { href: "/daily", label: "Daily activities" },
      { href: "/flashcards", label: "Vocabulary & flashcards" },
      { href: "/notebook", label: "Notebook & PDF reader" },
      { href: "/integrated-skills", label: "Integrated skills" },
      { href: "/resources", label: "Learning resources" },
      { href: "/errors", label: "Error workshop" },
      { href: "/library", label: "Audio library" },
      { href: "/teacher", label: "Teacher studio" },
    ],
    settings: "/settings",
  },
  de: {
    main: [
      { href: "/", label: "Start", icon: "⌂" },
      { href: "/practice", label: "Meine Übungen", icon: "▶" },
      { href: "/grammatik", label: "Grammatik", icon: "▣" },
      { href: "/studio", label: "Gespräche", icon: "▢" },
      { href: "/fortschritt", label: "Mein Fortschritt", icon: "◷" },
    ],
    more: [
      { href: "/heute", label: "Tagesaktivitäten" },
      { href: "/ressourcen", label: "Wörter & Materialien" },
      { href: "/fertigkeiten", label: "Integrierte Fertigkeiten" },
      { href: "/wiederholungen", label: "Wiederholungen" },
      { href: "/fehler", label: "Fehlerwerkstatt" },
      { href: "/audio", label: "Audio-Bibliothek" },
      { href: "/lehrkraft", label: "Lehrkraft-Studio" },
      { href: "/support", label: "Hilfe" },
      { href: "/privacy", label: "Datenschutz" },
    ],
    settings: "/einstellungen",
  },
};

/** Shared route presentation only; existing exercise and storage logic stays in its app. */
export function LearningNavigation({
  language,
  current,
  onNavigate,
}: {
  language: "en" | "de";
  current: string;
  onNavigate?: () => void;
}) {
  const config = navigationConfig[language];
  const main = config.main;
  const more = config.more;
  const en = language === "en";
  return (
    <nav
      className="learning-navigation"
      aria-label={en ? "Learning navigation" : "Lernnavigation"}
    >
      <p className="ln-label">{en ? "Your learning" : "Dein Lernen"}</p>
      <ul>
        {main.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              aria-current={current === item.href ? "page" : undefined}
              onClick={onNavigate}
            >
              {item.icon === "⌂" && <House aria-hidden="true" />}
              {item.icon === "▶" && <Play aria-hidden="true" />}
              {item.icon === "▣" && <span aria-hidden="true">▣</span>}
              {item.icon === "▢" && <span aria-hidden="true">▢</span>}
              {item.icon === "◷" && <ChartNoAxesCombined aria-hidden="true" />}
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
      <details
        className="ln-more"
        open={more.some((item) => current === item.href) || undefined}
      >
        <summary>
          <Library aria-hidden="true" />
          <span>{en ? "All learning tools" : "Alle Lernwerkzeuge"}</span>
          <ChevronDown aria-hidden="true" />
        </summary>
        <ul>
          {more.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={current === item.href ? "page" : undefined}
                onClick={onNavigate}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </details>
      <a
        className="ln-settings"
        href={config.settings}
        aria-current={current === config.settings ? "page" : undefined}
        onClick={onNavigate}
      >
        <Settings aria-hidden="true" />
        <span>{en ? "Settings" : "Einstellungen"}</span>
      </a>
      <a className="ln-roadmap" href="/roadmap.html" hrefLang="fa">
        {en ? "Roadmap & improvements" : "Roadmap & Verbesserungen"}
      </a>
    </nav>
  );
}
