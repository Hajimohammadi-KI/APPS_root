import type {
  ConversationTopic,
  StudioLanguage,
  copy,
} from "./conversation-data";
import type { PracticeMode } from "./studio-helpers";

type StudioCopy = (typeof copy)[StudioLanguage];

export type ModeCard = readonly [PracticeMode, string, string, string];

export function TopicOptions({
  text,
  path,
  selected,
  disabled,
  levels,
  skills,
  categories,
  topics,
  level,
  skill,
  category,
  allLabel,
  onLevel,
  onSkill,
  onCategory,
  onTopic,
  modeCards,
  practiceMode,
  onMode,
}: Readonly<{
  text: StudioCopy;
  path: string;
  selected: ConversationTopic;
  disabled: boolean;
  levels: readonly string[];
  skills: readonly string[];
  categories: readonly string[];
  topics: readonly ConversationTopic[];
  level: string;
  skill: string;
  category: string;
  allLabel: string;
  onLevel: (value: string) => void;
  onSkill: (value: string) => void;
  onCategory: (value: string) => void;
  onTopic: (value: string) => void;
  modeCards: readonly ModeCard[];
  practiceMode: PracticeMode;
  onMode: (mode: PracticeMode) => void;
}>) {
  return (
    <details className="studio-options">
      <summary>
        Topic & practice mode{" "}
        <span>
          {selected.level} · {selected.topic}
        </span>
      </summary>
      <section className="conversation-filter" aria-labelledby="filter-heading">
        <h2 id="filter-heading">{text.filterTitle}</h2>
        <div className="conversation-filter-grid">
          <input type="hidden" value={path} readOnly />
          <label>
            <span>{text.labels[1]}</span>
            <select
              disabled={disabled}
              value={levels.includes(level) ? level : allLabel}
              onChange={(event) => onLevel(event.target.value)}
            >
              {levels.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{text.labels[2]}</span>
            <select
              disabled={disabled}
              value={skills.includes(skill) ? skill : allLabel}
              onChange={(event) => onSkill(event.target.value)}
            >
              {skills.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{text.labels[3]}</span>
            <select
              disabled={disabled}
              value={categories.includes(category) ? category : allLabel}
              onChange={(event) => onCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{text.labels[4]}</span>
            <select
              disabled={disabled}
              value={selected.id}
              onChange={(event) => onTopic(event.target.value)}
            >
              {topics.map((topic) => (
                <option value={topic.id} key={topic.id}>
                  {topic.topic}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mode-cards" aria-label="Practice mode">
        {modeCards.map(([mode, icon, title, description], index) => (
          <button
            disabled={disabled}
            key={mode}
            className={`mode ${practiceMode === mode ? "active-mode" : ""}`}
            onClick={() => onMode(mode)}
          >
            <span
              className={index === 1 ? "orange-mode" : index === 2 ? "green-mode" : ""}
            >
              {icon}
            </span>
            <div>
              <b>{title}</b>
              <small>{description}</small>
            </div>
            {practiceMode === mode && <i>✓</i>}
          </button>
        ))}
      </section>
    </details>
  );
}
