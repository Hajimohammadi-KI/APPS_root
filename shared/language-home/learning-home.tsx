import type { ReactNode } from "react";
import type { DailyDashboard } from "@automaticity/learning-core/automaticity";
import { ArrowRight, BookOpen, CalendarDays, Check, ChevronRight, Headphones, RotateCcw, Settings2, Wrench } from "lucide-react";

const copy = {
  en: {
    language: "English", eyebrow: "Your daily learning space", welcome: "Welcome back,", fallback: "Learner",
    intro: "A little practice. A clearer voice. One step at a time.", settings: "Learning settings", level: "Practice level",
    next: "Your next step", start: "Make room for a little English.", repair: "Turn a mistake into progress.", review: "Bring what you learned back to mind.", paused: "Your plan is paused.",
    description: "Your plan starts with corrections and due reviews, then guides you into fresh practice.", repairDescription: "Revisit a saved response, make the correction, then try again independently.", reviewDescription: "Recall earlier learning before moving on to something new.", pausedDescription: "Open your plan and resume whenever you are ready.",
    cta: "Continue my plan", resume: "Open paused plan", backup: "My saved responses", local: "Your progress stays on this device.",
    today: "Today, at a glance", activityNote: "These numbers show practice activity, not language mastery.", daily: "Daily response goal", responses: "responses saved", due: "Reviews due", dueNote: "Recall earlier learning", repairs: "Responses to repair", repairsNote: "Correct, then try independently", unavailable: "Unavailable", unavailableNote: "Some saved data could not be read. Open your plan to check it.", loading: "Reading your saved practice…",
    method: "How your learning develops", steps: ["Recall what you know", "Practise in different ways", "Respond without help", "Use it in a new situation"], methodNote: "Your next exercise follows your practice history.",
    week: "Your last 7 days", weekNote: "Saved responses each day", empty: "Your first response starts the story.", emptyNote: "After a saved practice, your activity will appear here.", days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    explore: "Make it your own", exploreNote: "Choose a focus when you want extra practice.", grammar: "Grammar lab", grammarNote: "Explore patterns, then put them to use.", speaking: "Conversation studio", speakingNote: "Practise speaking in everyday situations.", vocabulary: "Words & reading", vocabularyNote: "Build a vocabulary you can use.",
    evidence: "Saved responses & learning evidence", evidenceNote: "Review your work, check assessment limits or transfer your progress.", roadmap: "What’s being improved",
  },
  de: {
    language: "Deutsch", eyebrow: "Dein täglicher Lernraum", welcome: "Willkommen zurück,", fallback: "Lernende",
    intro: "Ein wenig Übung. Mehr Ausdruck. Schritt für Schritt.", settings: "Lerneinstellungen", level: "Übungsniveau",
    next: "Dein nächster Schritt", start: "Ein kleiner Schritt für dein Deutsch.", repair: "Aus einem Fehler wird Fortschritt.", review: "Rufe Gelerntes wieder ab.", paused: "Dein Lernplan ist pausiert.",
    description: "Dein Plan beginnt mit Korrekturen und fälligen Wiederholungen. Danach folgen neue Übungen.", repairDescription: "Überarbeite eine gespeicherte Antwort und versuche es danach selbstständig erneut.", reviewDescription: "Erinnere dich an Gelerntes, bevor du mit etwas Neuem weitermachst.", pausedDescription: "Öffne deinen Plan und setze ihn fort, sobald du bereit bist.",
    cta: "Meinen Plan fortsetzen", resume: "Pausierten Plan öffnen", backup: "Meine gespeicherten Antworten", local: "Dein Fortschritt bleibt auf diesem Gerät.",
    today: "Heute auf einen Blick", activityNote: "Diese Zahlen zeigen Übungsaktivität, keine Sprachbeherrschung.", daily: "Tägliches Antwortziel", responses: "Antworten gespeichert", due: "Fällige Wiederholungen", dueNote: "Gelerntes wieder abrufen", repairs: "Antworten zur Korrektur", repairsNote: "Verbessern und selbstständig üben", unavailable: "Nicht verfügbar", unavailableNote: "Ein Teil der gespeicherten Daten konnte nicht gelesen werden. Prüfe deinen Lernplan.", loading: "Gespeicherte Übungen werden geladen…",
    method: "So entwickelt sich dein Lernen", steps: ["Bekanntes abrufen", "Abwechslungsreich üben", "Ohne Hilfe antworten", "In neuen Situationen anwenden"], methodNote: "Die nächste Übung richtet sich nach deinem bisherigen Lernen.",
    week: "Deine letzten 7 Tage", weekNote: "Gespeicherte Antworten pro Tag", empty: "Mit deiner ersten Antwort geht es los.", emptyNote: "Nach einer gespeicherten Übung siehst du hier deine Aktivität.", days: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    explore: "Setze deinen eigenen Schwerpunkt", exploreNote: "Wähle einen Bereich, wenn du zusätzlich üben möchtest.", grammar: "Grammatiklabor", grammarNote: "Muster entdecken und direkt anwenden.", speaking: "Gesprächsstudio", speakingNote: "Sprechen in Alltagssituationen üben.", vocabulary: "Wörter & Lesen", vocabularyNote: "Wortschatz für deinen Alltag aufbauen.",
    evidence: "Gespeicherte Antworten & Lernnachweise", evidenceNote: "Arbeit ansehen, Grenzen der Bewertung prüfen oder Fortschritt übertragen.", roadmap: "Was gerade verbessert wird",
  },
} as const;

export function LearningHome({ language, name, level, daily, ready, children }: {
  language: "en" | "de"; name: string; level: string; daily: DailyDashboard | null; ready: boolean; children: ReactNode;
}) {
  const t = copy[language];
  const usable = daily !== null && daily.percentage !== null;
  const priority = daily?.paused ? "paused" : usable && daily.repairs > 0 ? "repair" : usable && daily.dueReviews > 0 ? "review" : "start";
  const reason = priority === "paused" ? t.pausedDescription : priority === "repair" ? t.repairDescription : priority === "review" ? t.reviewDescription : t.description;
  const maximum = Math.max(1, ...((usable && daily?.week.map((day) => day.count)) || []));
  const courses = [
    { title: t.grammar, description: t.grammarNote, href: language === "en" ? "/grammar" : "/grammatik", icon: BookOpen },
    { title: t.speaking, description: t.speakingNote, href: "/studio", icon: Headphones },
    { title: t.vocabulary, description: t.vocabularyNote, href: language === "en" ? "/flashcards" : "/ressourcen", icon: RotateCcw },
  ];
  return (
    <div className="learning-home" lang={language} dir="ltr">
      <header className="lh-heading">
        <div><p className="lh-eyebrow">{t.language} / {t.eyebrow}</p><h1>{t.welcome} <bdi>{name.trim() || t.fallback}</bdi></h1><p>{t.intro}</p></div>
        <a className="lh-settings" href={language === "en" ? "/settings" : "/einstellungen"}><Settings2 aria-hidden="true" /><span>{t.level} <strong>{level}</strong></span><span className="lh-sr-only"> · {t.settings}</span></a>
      </header>

      <section className="lh-hero" aria-labelledby="lh-next-title">
        <div className="lh-hero-copy"><p className="lh-eyebrow"><span className="lh-status-mark" aria-hidden="true" />{t.next}</p><h2 id="lh-next-title">{t[priority]}</h2><p>{reason}</p><a className="lh-primary" href="/practice">{daily?.paused ? t.resume : t.cta}<ArrowRight aria-hidden="true" /></a><p className="lh-local"><Check aria-hidden="true" />{t.local}</p></div>
        <div className="lh-method"><h3>{t.method}</h3><ol>{t.steps.map((step, index) => <li key={step}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{step}</li>)}</ol><p>{t.methodNote}</p></div>
      </section>

      <section className="lh-today" aria-labelledby="lh-today-title">
        <div className="lh-section-heading"><h2 id="lh-today-title">{t.today}</h2><p>{t.activityNote}</p></div>
        {!usable ? <p className="lh-data-notice" role="status">{ready ? t.unavailableNote : t.loading}</p> : null}
        <div className="lh-metrics">
          <a className="lh-metric lh-goal" href="/practice"><span className="lh-metric-label">{t.daily}<ArrowRight aria-hidden="true" /></span><strong>{usable ? <>{daily.responses}<span> / {daily.goal}</span></> : "—"}</strong><span className="lh-metric-description">{usable ? t.responses : ready ? t.unavailable : t.loading}</span>{usable ? <progress aria-label={t.daily} value={Math.min(daily.responses, daily.goal)} max={daily.goal} /> : null}</a>
          <a className="lh-metric" href="/practice"><span className="lh-metric-label">{t.due}<CalendarDays aria-hidden="true" /></span><strong>{usable ? daily.dueReviews : "—"}</strong><span className="lh-metric-description">{t.dueNote}<ChevronRight aria-hidden="true" /></span></a>
          <a className="lh-metric" href="/practice"><span className="lh-metric-label">{t.repairs}<Wrench aria-hidden="true" /></span><strong>{usable ? daily.repairs : "—"}</strong><span className="lh-metric-description">{t.repairsNote}<ChevronRight aria-hidden="true" /></span></a>
        </div>
      </section>

      <div className="lh-bottom-grid">
        <section className="lh-week" aria-labelledby="lh-week-title"><div className="lh-section-heading"><h2 id="lh-week-title">{t.week}</h2><p>{t.weekNote}</p></div>
          {usable && daily.week.some((day) => day.count > 0) ? <ol className="lh-days">{daily.week.map((day) => <li key={day.date}><span className="lh-day-count">{day.count}</span><span className="lh-bar" aria-hidden="true"><span style={{ height: `${(day.count / maximum) * 100}%` }} /></span><time dateTime={day.date}><span>{t.days[day.weekday]}</span><span className="lh-date">{day.date.slice(8)}.{day.date.slice(5, 7)}</span></time></li>)}</ol> : <div className="lh-empty"><CalendarDays aria-hidden="true" /><strong>{usable ? t.empty : ready ? t.unavailable : t.loading}</strong><p>{usable ? t.emptyNote : t.unavailableNote}</p></div>}
        </section>
        <section className="lh-explore" aria-labelledby="lh-explore-title"><div className="lh-section-heading"><h2 id="lh-explore-title">{t.explore}</h2><p>{t.exploreNote}</p></div><div className="lh-course-list">{courses.map(({ title, description, href, icon: Icon }) => <a key={title} href={href}><span className="lh-course-icon"><Icon aria-hidden="true" /></span><span><strong>{title}</strong><span>{description}</span></span><ArrowRight aria-hidden="true" /></a>)}</div></section>
      </div>

      <details className="lh-evidence"><summary><span><strong>{t.evidence}</strong><span>{t.evidenceNote}</span></span><ChevronRight aria-hidden="true" /></summary><div>{children}</div></details>
      <footer className="lh-footer"><a href="/practice?review=1">{t.backup}<ArrowRight aria-hidden="true" /></a><a href="/roadmap.html">{t.roadmap}<ArrowRight aria-hidden="true" /></a></footer>
    </div>
  );
}
