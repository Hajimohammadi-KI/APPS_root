"use client";

import {
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Flame,
  MessageCircle,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { grammarUnits } from "@grammar/content";
import { currentDailyPlan, useAppStore } from "@/features/store/app-store";

const dayNames = ["M", "T", "W", "T", "F", "S", "S"];

function dateKey(daysAgo: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function DashboardV2Screen({ navigate }: { navigate: (screen: string) => void }) {
  const { state } = useAppStore();
  const plan = currentDailyPlan(state);
  const name = state.learner.displayName.trim() || "Learner";
  const level = state.learner.selfDeclaredLevel ?? "A1";
  const levelUnits = grammarUnits.filter((unit) => unit.level === level);
  const practiced = levelUnits.filter((unit) => state.mastery[unit.title]?.status !== "new").length;
  const finished = levelUnits.filter((unit) => ["stable", "automatic"].includes(state.mastery[unit.title]?.status ?? "new")).length;
  const progress = levelUnits.length ? Math.round((finished / levelUnits.length) * 100) : 0;
  const todayProgress = Math.round((plan.completed.length / 3) * 100);
  const week = Array.from({ length: 7 }, (_, index) => state.activity[dateKey(6 - index)] ?? 0);
  const chartPoints = week.map((value, index) => {
    const x = 8 + index * 15.3;
    const y = 82 - Math.min(68, value * 12 + index * 2);
    return `${x},${y}`;
  }).join(" ");
  const streak = (() => {
    let count = 0;
    for (let index = 0; index < 60; index += 1) {
      if ((state.activity[dateKey(index)] ?? 0) > 0) count += 1;
      else break;
    }
    return count;
  })();
  const dueReviews = state.reviews.filter((review) => review.status === "pending" && review.dueAt <= Date.now()).length;
  const automatic = Object.values(state.mastery).filter((item) => item.status === "automatic").length;
  const speakingAverage = state.sessions.length
    ? Math.min(100, Math.round(state.sessions.reduce((total, session) => total + Math.min(100, session.seconds), 0) / state.sessions.length))
    : 0;

  const courses = [
    { title: "Expand Your English Vocabulary", detail: `${level} · ${dueReviews} reviews due`, tone: "rose", screen: "flashcards", icon: BookOpen },
    { title: "Build Strong Grammar Skills", detail: `${practiced} of ${levelUnits.length} units explored`, tone: "lavender", screen: "grammar", icon: Target },
    { title: "Master Everyday Conversations", detail: `${state.sessions.length} speaking sessions saved`, tone: "peach", screen: "studio", icon: MessageCircle },
  ] as const;

  return (
    <div className="home-v2">
      <header className="home-v2-heading">
        <div>
          <p className="home-v2-eyebrow"><Sparkles aria-hidden /> Personal learning dashboard</p>
          <h1>Good morning, {name}</h1>
          <p>Small, measurable practice that turns English into a usable skill.</p>
        </div>
        <div className="home-v2-tools" aria-label="Dashboard tools">
          <button aria-label="Search lessons" type="button" onClick={() => navigate("resources")}><Search /></button>
          <button aria-label="Open reviews" type="button" onClick={() => navigate("progress")}><Bell /><span className="home-v2-dot" /></button>
          <button className="home-v2-profile" type="button" onClick={() => navigate("settings")}>
            <span>{name.slice(0, 1).toUpperCase()}</span><strong>{name}</strong>
          </button>
        </div>
      </header>

      <div className="home-v2-grid">
        <main className="home-v2-main">
          <section className="home-v2-chart-card" aria-labelledby="performance-title">
            <div className="home-v2-card-head">
              <div><p>Learning activity</p><h2 id="performance-title">Performance chart</h2></div>
              <button type="button" onClick={() => navigate("progress")}>View details <ArrowUpRight /></button>
            </div>
            <div className="home-v2-chart-summary">
              <div><strong>+{todayProgress}%</strong><span>today’s mission</span></div>
              <div><strong>{automatic}</strong><span>automatic topics</span></div>
              <div><strong>{speakingAverage}%</strong><span>speaking rhythm</span></div>
            </div>
            <div className="home-v2-chart-wrap" aria-label="Seven-day learning activity chart">
              <svg viewBox="0 0 100 90" preserveAspectRatio="none" role="img">
                <title>Learning activity over the last seven days</title>
                {[20, 40, 60, 80].map((line) => <line key={line} x1="0" x2="100" y1={line} y2={line} />)}
                <polyline className="home-v2-chart-shadow" points={chartPoints} />
                <polyline className="home-v2-chart-line" points={chartPoints} />
                {chartPoints.split(" ").map((point) => {
                  const [cx, cy] = point.split(",");
                  return <circle key={point} cx={cx} cy={cy} r="1.4" />;
                })}
              </svg>
              <div className="home-v2-chart-days">{dayNames.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
            </div>
          </section>

          <section className="home-v2-lower-grid">
            <article className="home-v2-progress-card">
              <div className="home-v2-card-head"><div><p>Current level · {level}</p><h2>Student progress</h2></div><TrendingUp /></div>
              <ProgressRow label="Finished lessons" value={progress} />
              <ProgressRow label="Today’s practice" value={todayProgress} />
              <ProgressRow label="Speaking evidence" value={Math.min(100, state.sessions.length * 10)} />
              <button className="home-v2-primary" type="button" onClick={() => navigate("daily")}>Continue today’s practice <ChevronRight /></button>
            </article>

            <article className="home-v2-focus-card">
              <div className="home-v2-card-head"><div><p>Learning evidence</p><h2>Your focus score</h2></div><Flame /></div>
              <div className="home-v2-score"><strong>{Math.round((todayProgress + speakingAverage + progress) / 3)}%</strong><span>balanced progress</span></div>
              <dl>
                <div><dt>Practice</dt><dd>{todayProgress}%</dd></div>
                <div><dt>Mastery</dt><dd>{progress}%</dd></div>
                <div><dt>Speaking</dt><dd>{speakingAverage}%</dd></div>
              </dl>
            </article>
          </section>
        </main>

        <aside className="home-v2-aside">
          <section className="home-v2-courses" aria-labelledby="courses-title">
            <div className="home-v2-card-head"><div><p>Start learning today</p><h2 id="courses-title">Select a course</h2></div><button aria-label="Open learning resources" type="button" onClick={() => navigate("resources")}><ArrowUpRight /></button></div>
            <div className="home-v2-course-list">
              {courses.map(({ title, detail, tone, screen, icon: Icon }) => (
                <button className={`home-v2-course home-v2-course-${tone}`} key={title} type="button" onClick={() => navigate(screen)}>
                  <span className="home-v2-course-icon"><Icon /></span>
                  <span><strong>{title}</strong><small>{detail}</small></span>
                  <ChevronRight />
                </button>
              ))}
            </div>
          </section>

          <section className="home-v2-rhythm">
            <div className="home-v2-card-head"><div><p>Consistency</p><h2>{streak}-day rhythm</h2></div><CalendarDays /></div>
            <div className="home-v2-week">{week.map((value, index) => <span className={value > 0 ? "is-active" : ""} key={index}>{dayNames[index]}</span>)}</div>
            <p>{dueReviews ? `${dueReviews} review${dueReviews === 1 ? "" : "s"} ready today.` : "No urgent review is waiting. Keep your rhythm."}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return <div className="home-v2-progress-row"><div><span>{label}</span><strong>{value}%</strong></div><div className="home-v2-progress-track"><span style={{ width: `${value}%` }} /></div></div>;
}
