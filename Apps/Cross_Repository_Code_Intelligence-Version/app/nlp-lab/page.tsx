import {
  articleReadings,
  courseTransferForSession,
  extractionSections,
  nlpCourseMeta,
  nlpCourseSessions,
  nlpLabDefinition,
  sources,
} from "../plan-data";

const readingFolder =
  "D:\\Bachelor-Thesis\\All Artikels\\Recovered_Articles_2026-08-07";
const readingsById = new Map<string, (typeof articleReadings)[number]>(
  articleReadings.map((reading) => [reading.id, reading]),
);

function formatDate(date: string) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

type ReadingTier = "required" | "reuse" | "optional" | "standard";

function ReadingGroup({
  title,
  tier,
  readingIds,
}: {
  title: string;
  tier: ReadingTier;
  readingIds: readonly string[];
}) {
  if (readingIds.length === 0) return null;
  return (
    <section className={`nlp-reading-group ${tier}`}>
      <header>
        <h4>{title}</h4>
        <span>{readingIds.length} Quelle{readingIds.length === 1 ? "" : "n"}</span>
      </header>
      <div className="nlp-reading-list">
        {readingIds.map((readingId) => {
          const reading = readingsById.get(readingId);
          if (!reading) return null;
          const source = sources[reading.sourceId];
          return (
            <article key={reading.id}>
              <header>
                <strong>
                  Reihenfolge C{String(reading.courseOrder).padStart(2, "0")} · Original O{String(reading.order).padStart(2, "0")}
                </strong>
                <span className={`reading-mode ${reading.mode.toLowerCase()}`}>{reading.mode}</span>
                {tier === "reuse" && <span className="reading-reuse">Nicht erneut lesen</span>}
                {reading.status === "in_progress" && <span className="reading-status">In Arbeit</span>}
              </header>
              <h4>{source?.label ?? reading.sourceId}</h4>
              <code>{reading.fileName}</code>
              <p>{reading.projectConnection}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function NlpLabPage() {
  return (
    <main className="nlp-lab-shell">
      <header className="nlp-lab-hero">
        <div>
          <p className="nlp-lab-eyebrow">Advanced Deep Learning · Lese- und Extraktionsplan</p>
          <h1>NLP Literature Lab</h1>
          <p className="nlp-lab-lead">
            In zehn Sitzungen liest du gezielt die Artikel 06 bis 23 und
            extrahierst nur das, was für RQ1, RQ2 und die Projektarchitektur
            verwendbar ist. Technische Übungen bleiben sichtbar, sind aber bis
            7. September optional und erzeugen keinen Rückstand.
          </p>
        </div>
        <aside className="nlp-lab-time" aria-label="Kurszeit">
          <strong>17. Aug. – 7. Sept. 2026</strong>
          <span>Sa · Mo · Mi</span>
          <span>Berlin {nlpCourseMeta.berlinTime}</span>
          <span>Iran {nlpCourseMeta.iranTime}</span>
          <span>{nlpCourseMeta.instructor} · {nlpCourseMeta.platform}</span>
          <code>{readingFolder}</code>
        </aside>
      </header>

      <section className="nlp-lab-alert" aria-labelledby="course-scope-title">
        <strong id="course-scope-title">Kursregel bis 7. September</strong>
          <p>
          Pro Sitzung gibt es höchstens eine kurze Transfernotiz oder ein
          Mikroartefakt. Es ersetzt ein normales Tagesergebnis; zusätzliche
          technische Übungen senken weder Fortschritt noch Lernkette und gelten
          nicht als Rückstand.
        </p>
      </section>

      <section className="nlp-lab-grid" aria-label="Problem und Projektgrenze">
        <article>
          <span>Ziel</span>
          <h2>Was du aus dem Kurs mitnimmst</h2>
          <p>{nlpLabDefinition.problem}</p>
          <p>{nlpLabDefinition.projectFit}</p>
        </article>
        <article>
          <span>Vertrag</span>
          <h2>Wie die Notizen in die Thesis passen</h2>
          <dl>
            <div><dt>Eingabe</dt><dd>{nlpLabDefinition.integrationContract.input}</dd></div>
            <div><dt>Ausgabe</dt><dd>{nlpLabDefinition.integrationContract.output}</dd></div>
            <div><dt>Grenze</dt><dd>{nlpLabDefinition.integrationContract.boundary}</dd></div>
          </dl>
        </article>
      </section>

      <section className="nlp-lab-boundaries">
        <article>
          <h2>Verbindlich</h2>
          <ul>{nlpLabDefinition.core.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article>
          <h2>Optional / später</h2>
          <ul>{nlpLabDefinition.deferred.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </section>

      <section className="nlp-lab-use-cases" aria-labelledby="extraction-title">
        <p className="nlp-lab-eyebrow">Ein einheitlicher Bogen pro Artikel</p>
        <h2 id="extraction-title">Sechs Extraktionsfelder</h2>
        <ol>{extractionSections.map((section) => <li key={section}>{section}</li>)}</ol>
      </section>

      <section className="nlp-lab-sessions" aria-labelledby="session-title">
        <p className="nlp-lab-eyebrow">Live-Kurs → Thesis-Evidence</p>
        <h2 id="session-title">Zehn Sitzungen mit klarer Lektüre</h2>
        <div className="nlp-session-list">
          {nlpCourseSessions.map((session) => (
            <article className="nlp-session-card" key={session.number}>
              <header>
                <span className="nlp-session-number">{session.number}</span>
                <div>
                  <time dateTime={session.date}>{formatDate(session.date)}</time>
                  <h3>{session.title}</h3>
                  <p>{session.berlinTime} Berlin · {session.iranTime} Iran</p>
                </div>
              </header>
              <div className="nlp-session-body">
                <div>
                  <h4>Projektfrage</h4><p>{session.projectQuestion}</p>
                  <h4>Anwendung</h4><p>{session.useCase}</p>
                  <h4>Projektbezug</h4><p>{session.projectConnection}</p>
                </div>
                <div>
                  <h4>Fokus beim Lesen</h4>
                  <ul>{session.readingFocus.map((item) => <li key={item}>{item}</li>)}</ul>
                  <h4>Extraktionsziel</h4><p>{session.extractionGoal}</p>
                </div>
              </div>
              <section className="nlp-session-guidance" lang="fa" dir="rtl">
                <div>
                  <h4>سؤال‌هایی که از مدرس می‌پرسم</h4>
                  <ol>{session.classQuestionsFa.map((question) => <li key={question}>{question}</li>)}</ol>
                </div>
                <div>
                  <h4>چرا این موضوع برای پروژه مهم است؟</h4>
                  <p>{session.whyThisMattersFa}</p>
                  <h4>بعد از کلاس چه کاری انجام می‌دهم؟</h4>
                  <p>{session.plannedActionFa}</p>
                </div>
              </section>
              {(() => {
                const transfer = courseTransferForSession(session.number);
                if (!transfer) return null;
                return (
                  <section className={`nlp-transfer-plan ${transfer.relevance}`}>
                    <header>
                      <div>
                        <p className="nlp-lab-eyebrow">Kurs → Thesis ohne Zusatz-Backlog</p>
                        <h4>Sofortiger Transfer</h4>
                      </div>
                      <span>max. {transfer.maxMinutes} Min.</span>
                    </header>
                    <div>
                      <p><b>≤ 24 Stunden:</b> Notiz bis <time dateTime={transfer.noteDue}>{formatDate(transfer.noteDue)}</time></p>
                      <p><b>≤ 7 Tage:</b> <code>{transfer.artifact}</code> bis <time dateTime={transfer.artifactDue}>{formatDate(transfer.artifactDue)}</time></p>
                      <p>{transfer.acceptance}</p>
                    </div>
                    <small>Ersetzt ein Tagesergebnis; erzeugt keine vierte Aufgabe.</small>
                  </section>
                );
              })()}
              {session.readingPlan ? (
                <div className="nlp-priority-plan">
                  <section className="nlp-required-outputs">
                    <header>
                      <div>
                        <p className="nlp-lab-eyebrow">Genau drei reale Ergebnisse</p>
                        <h4>Verpflichtende Ergebnisse</h4>
                      </div>
                      <span>{session.readingPlan.deliverables.length} Pflicht-Ergebnisse</span>
                    </header>
                    <div>
                      {session.readingPlan.deliverables.map((deliverable, index) => (
                        <article key={deliverable.id}>
                          <span>{index + 1} · {deliverable.mode}</span>
                          <h5>{deliverable.title}</h5>
                          <p>{deliverable.acceptance}</p>
                          <small>
                            Quellen: {deliverable.readingIds.map((readingId) => {
                              const reading = readingsById.get(readingId);
                              return reading ? `C${String(reading.courseOrder).padStart(2, "0")}/O${String(reading.order).padStart(2, "0")}` : readingId;
                            }).join(" + ")}
                          </small>
                        </article>
                      ))}
                    </div>
                  </section>
                  <div className="nlp-reading-priority-grid">
                    <ReadingGroup title="Verpflichtend" tier="required" readingIds={session.readingPlan.required} />
                    <ReadingGroup title="Notizen wiederverwenden · nicht erneut lesen" tier="reuse" readingIds={session.readingPlan.reuse} />
                    <ReadingGroup title="Optional / Related Work" tier="optional" readingIds={session.readingPlan.optional} />
                  </div>
                </div>
              ) : (
                <ReadingGroup title="Zugeordnete Artikel" tier="standard" readingIds={session.readingIds} />
              )}
              <footer><strong>Nach der Sitzung festhalten</strong><p>{extractionSections.join(" · ")}</p></footer>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
