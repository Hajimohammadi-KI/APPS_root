import {
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  House,
  Library,
  MessagesSquare,
  Play,
  Settings,
} from "lucide-react";

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
  const en = language === "en";
  const main = [
    ["/", en ? "Home" : "Start", House],
    ["/practice", en ? "My practice" : "Meine Übungen", Play],
    [en ? "/grammar" : "/grammatik", en ? "Grammar" : "Grammatik", BookOpen],
    ["/studio", en ? "Conversation" : "Gespräche", MessagesSquare],
    [
      en ? "/?screen=progress" : "/fortschritt",
      en ? "My progress" : "Mein Fortschritt",
      ChartNoAxesCombined,
    ],
  ] as const;
  const more = en
    ? [
        ["/daily", "Daily activities"],
        ["/flashcards", "Vocabulary & flashcards"],
        ["/notebook", "Notebook & PDF reader"],
        ["/?screen=integrated-skills", "Integrated skills"],
        ["/?screen=resources", "Learning resources"],
        ["/?screen=errors", "Error workshop"],
        ["/?screen=library", "Audio library"],
        ["/teacher", "Teacher studio"],
      ]
    : [
        ["/heute", "Tagesaktivitäten"],
        ["/ressourcen", "Wörter & Materialien"],
        ["/fertigkeiten", "Integrierte Fertigkeiten"],
        ["/wiederholungen", "Wiederholungen"],
        ["/fehler", "Fehlerwerkstatt"],
        ["/audio", "Audio-Bibliothek"],
        ["/lehrkraft", "Lehrkraft-Studio"],
        ["/support", "Hilfe"],
        ["/privacy", "Datenschutz"],
      ];
  return (
    <nav
      className="learning-navigation"
      aria-label={en ? "Learning navigation" : "Lernnavigation"}
    >
      <p className="ln-label">{en ? "Your learning" : "Dein Lernen"}</p>
      <ul>
        {main.map(([href, label, Icon]) => (
          <li key={href}>
            <a
              href={href}
              aria-current={current === href ? "page" : undefined}
              onClick={onNavigate}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </a>
          </li>
        ))}
      </ul>
      <details
        className="ln-more"
        open={more.some(([href]) => current === href) || undefined}
      >
        <summary>
          <Library aria-hidden="true" />
          <span>{en ? "All learning tools" : "Alle Lernwerkzeuge"}</span>
          <ChevronDown aria-hidden="true" />
        </summary>
        <ul>
          {more.map(([href, label]) => (
            <li key={href}>
              <a
                href={href}
                aria-current={current === href ? "page" : undefined}
                onClick={onNavigate}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </details>
      <a
        className="ln-settings"
        href={en ? "/settings" : "/einstellungen"}
        aria-current={
          current === (en ? "/settings" : "/einstellungen") ? "page" : undefined
        }
        onClick={onNavigate}
      >
        <Settings aria-hidden="true" />
        <span>{en ? "Settings" : "Einstellungen"}</span>
      </a>
      <a className="ln-roadmap" href="/roadmap.html" lang="fa" dir="rtl">
        رودمپ و وضعیت اصلاحات
      </a>
    </nav>
  );
}
