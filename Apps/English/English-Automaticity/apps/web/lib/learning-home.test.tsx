import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { DailyDashboard } from "@automaticity/learning-core/automaticity";
import { LearningHome } from "../components/learning-home";

const daily: DailyDashboard = {
  responses: 0, goal: 5, paused: false, streak: 0, dueReviews: 0, repairs: 0, percentage: 0,
  week: [{date: "2026-10-03", weekday: 6, count: 0}],
};
function render(language: "en" | "de", data: DailyDashboard | null, ready = true, name = "Test learner") {
  return renderToStaticMarkup(<LearningHome language={language} name={name} level="A1" daily={data} ready={ready}><p>Saved evidence</p></LearningHome>);
}
describe("home evidence and navigation", () => {
  test("unreadable history cannot become zero progress or an empty success chart", () => {
    for (const language of ["en", "de"] as const) {
      const html = render(language, {...daily, percentage: null, responses: 8, repairs: 4});
      expect(html).not.toContain("<progress");
      expect(html).not.toContain('class="lh-days"');
      expect(html.match(/<strong>—<\/strong>/g)?.length).toBe(3);
      expect(html).toContain(language === "en" ? "could not be read" : "konnte nicht gelesen");
    }
  });
  test("loading is distinct from unavailable data", () => {
    const loading = render("en", null, false);
    expect(loading).toContain("Reading your saved practice");
    expect(loading).not.toContain("could not be read");
    expect(render("en", null)).toContain("could not be read");
  });
  test("paused plan takes precedence over repair and review prompts", () => {
    const html = render("en", {...daily, paused: true, repairs: 3, dueReviews: 2});
    expect(html).toContain("Your plan is paused.");
    expect(html).toContain("Open paused plan");
    expect(html).not.toContain("Turn a mistake into progress.");
  });
  test("repair is prioritized before due recall in both languages", () => {
    expect(render("en", {...daily, repairs: 1, dueReviews: 2})).toContain("Turn a mistake into progress.");
    expect(render("de", {...daily, repairs: 1, dueReviews: 2})).toContain("Aus einem Fehler wird Fortschritt.");
    expect(render("de", {...daily, dueReviews: 2})).toContain("Rufe Gelerntes wieder ab.");
  });
  test("count remains exact when goal is exceeded and graph does not clip large counts", () => {
    const html = render("en", {...daily, responses: 18, percentage: 100, week:[{date:"2026-10-03",weekday:6,count:18}]});
    expect(html).toContain('value="5" max="5"');
    expect(html).toContain('class="lh-day-count">18');
    expect(html).toContain('height:100%');
    expect(html).toContain("not language mastery");
  });
  test("learner names remain text with bidi isolation, and navigation uses existing paths", () => {
    const html = render("en", daily, true, "فاطمه <script>alert(1)</script>");
    expect(html).toContain("<bdi>فاطمه &lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain('href="/flashcards"');
    expect(html).toContain('href="/grammar"');
    expect(render("de", daily)).toContain('href="/grammatik"');
    expect(html).toContain('href="/roadmap.html"');
  });
});
