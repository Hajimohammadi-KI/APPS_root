import {
  nlpCourseSessions,
  nlpLabDefinition,
  sources,
} from "../plan-data";

const literatureFolder =
  "https://drive.google.com/drive/folders/1t0Aphbp1CnDNdmZsTNl6genDA7LjzTOA";

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
          <p className="nlp-lab-eyebrow">Eigenständiges, integrierbares Projektmodul</p>
          <h1>NLP Retrieval Lab</h1>
          <p className="nlp-lab-lead">
            Zehn Live-Sitzungen werden in überprüfbare Bausteine für Flat
            Retrieval, Question Contracts, Grounding und RQ2-Evaluation
            überführt. Das Lab bleibt technisch abtrennbar und liefert einen
            versionierten JSON-Vertrag an die Cross App.
          </p>
        </div>
        <aside className="nlp-lab-time" aria-label="Kurszeit">
          <strong>17. Aug. – 7. Sept. 2026</strong>
          <span>Sa · Mo · Mi</span>
          <span>Berlin 17:30–19:10</span>
          <span>Iran 19:00–20:40</span>
          <a href={literatureFolder} rel="noreferrer" target="_blank">
            Kursordner in Google Drive öffnen ↗
          </a>
        </aside>
      </header>

      <section className="nlp-lab-alert" aria-labelledby="recovery-title">
        <strong id="recovery-title">10. September: Operation und Ruhetag</strong>
        <p>
          Keine Aufgabe, kein Nachholen und kein Verlust der Lernkette. Die zehnte
          Sitzung endet am 7. September; spätere Arbeit beginnt nur entsprechend
          der persönlichen Erholung und ärztlichen Empfehlung.
        </p>
      </section>

      <section className="nlp-lab-grid" aria-label="Problem und Projektgrenze">
        <article>
          <span>Problem</span>
          <h2>Was das Lab lösen muss</h2>
          <p>{nlpLabDefinition.problem}</p>
          <p>{nlpLabDefinition.projectFit}</p>
        </article>
        <article>
          <span>Vertrag</span>
          <h2>Wie es später an die Cross App passt</h2>
          <dl>
            <div><dt>Eingabe</dt><dd>{nlpLabDefinition.integrationContract.input}</dd></div>
            <div><dt>Ausgabe</dt><dd>{nlpLabDefinition.integrationContract.output}</dd></div>
            <div><dt>Grenze</dt><dd>{nlpLabDefinition.integrationContract.boundary}</dd></div>
          </dl>
        </article>
      </section>

      <section className="nlp-lab-boundaries">
        <article>
          <h2>Core bis zum Kursende</h2>
          <ul>{nlpLabDefinition.core.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article>
          <h2>Nicht jetzt / Future Work</h2>
          <ul>{nlpLabDefinition.deferred.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </section>

      <section className="nlp-lab-use-cases" aria-labelledby="use-case-title">
        <p className="nlp-lab-eyebrow">Software Engineering</p>
        <h2 id="use-case-title">Use Cases, die das Modul wirklich tragen</h2>
        <ol>{nlpLabDefinition.useCases.map((useCase) => <li key={useCase}>{useCase}</li>)}</ol>
      </section>

      <section className="nlp-lab-sessions" aria-labelledby="session-title">
        <p className="nlp-lab-eyebrow">Live-Kurs → Projektarbeit</p>
        <h2 id="session-title">Zehn Sitzungen mit greifbarem Ergebnis</h2>
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
                  <h4>Use Case</h4><p>{session.useCase}</p>
                </div>
                <div>
                  <h4>Lesen</h4>
                  <ul className="nlp-source-list">
                    {session.sourceIds.map((sourceId) => {
                      const source = sources[sourceId];
                      if (!source) return null;
                      return <li key={sourceId}>{source.href ? <a href={source.href} rel="noreferrer" target="_blank">{source.label} ↗</a> : source.label}</li>;
                    })}
                  </ul>
                </div>
                <div>
                  <h4>Software Engineering</h4>
                  <ul>{session.softwareEngineering.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div>
                  <h4>Tagesergebnisse</h4>
                  <ul>{session.deliverables.map((item) => <li key={item}><code>{item}</code></li>)}</ul>
                </div>
              </div>
              <footer><strong>Definition of Done</strong><p>{session.definitionOfDone}</p></footer>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
