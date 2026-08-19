import {
  articleReadings,
  extractionSections,
  nlpCourseSessions,
  nlpLabDefinition,
  sources,
} from "../plan-data";

const readingFolder =
  "D:\\Bachelor-Thesis\\02_Literature\\09_NLP_Course_2026_Reading_Order";
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
          <span>Berlin 18:00–19:40</span>
          <span>Iran 19:30–21:10</span>
          <code>{readingFolder}</code>
        </aside>
      </header>

      <section className="nlp-lab-alert" aria-labelledby="course-scope-title">
        <strong id="course-scope-title">Kursregel bis 7. September</strong>
        <p>
          Pflicht ist nur Lesen und Extrahieren. Nicht erledigte technische
          Aufgaben senken weder Fortschritt noch Lernkette und gelten nicht als
          Rückstand.
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
              <div className="nlp-reading-list">
                {session.readingIds.map((readingId) => {
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
                        {reading.status === "in_progress" && <span className="reading-status">In Arbeit</span>}
                      </header>
                      <h4>{source?.label ?? reading.sourceId}</h4>
                      <code>{reading.fileName}</code>
                      <p>{reading.projectConnection}</p>
                    </article>
                  );
                })}
              </div>
              <footer><strong>Nach der Sitzung festhalten</strong><p>{extractionSections.join(" · ")}</p></footer>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
