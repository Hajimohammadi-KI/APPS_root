import {
  ChartNoAxesCombined,
  ChevronDown,
  House,
  Library,
  Play,
  Settings,
} from "lucide-react";

import { navigationConfig } from "./navigation-config";

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
