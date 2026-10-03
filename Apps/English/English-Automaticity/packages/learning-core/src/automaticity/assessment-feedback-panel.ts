import type { CurriculumPack } from "./curriculum";
import { collectAssessmentFeedback } from "./assessment-feedback";
import { readAutomaticityEvents } from "./storage";

/** The report is downloaded only on request; no feedback or learner text is uploaded. */
export function mountAssessmentFeedbackPanel(
  root: HTMLElement,
  pack: CurriculumPack,
): () => void {
  const en = pack.language === "en",
    section = document.createElement("section"),
    description = document.createElement("p"),
    status = document.createElement("p"),
    download = document.createElement("button");
  section.id = "assessment-feedback-memory";
  status.id = "assessment-feedback-summary";
  status.setAttribute("role", "status");
  description.textContent = en
    ? "Reviewer disagreements help the app avoid repeating a disputed judgment on the same answer and task. These local reviews do not certify grammar or mastery. The download includes the saved answers and reviewer feedback."
    : "Abweichende Rückmeldungen helfen der App, eine strittige Bewertung derselben Antwort und Aufgabe nicht zu wiederholen. Diese lokalen Prüfungen bestätigen weder Grammatik noch Beherrschung. Der Download enthält die gespeicherten Antworten und Rückmeldungen.";
  download.id = "assessment-feedback-export";
  download.type = "button";
  download.textContent = en
    ? "Download checker feedback"
    : "Rückmeldungen zum Prüfer herunterladen";
  section.append(description, status, download);
  root.append(section);
  let generation = 0;
  const read = () =>
    collectAssessmentFeedback(
      readAutomaticityEvents(localStorage, pack.language).events,
      pack,
      new Date().toISOString(),
    );
  const refresh = () => {
    const request = ++generation;
    void read()
      .then((report) => {
        if (request !== generation) return;
        const count = report.cases.filter((row) => row.disagreement).length;
        status.textContent = en
          ? `${count} reviewer disagreements saved. ${report.excluded.length} reviews cannot be reused in the current writing checker.`
          : `${count} abweichende Rückmeldungen gespeichert. ${report.excluded.length} Prüfungen können im aktuellen Schreibprüfer nicht wiederverwendet werden.`;
        download.disabled = report.cases.length === 0;
      })
      .catch(() => {
        if (request === generation) {
          download.disabled = true;
          status.textContent = en
            ? "Feedback could not be read. Original records were kept."
            : "Rückmeldungen konnten nicht gelesen werden. Originaldaten bleiben erhalten.";
        }
      });
  };
  download.onclick = () => {
    void read()
      .then((report) => {
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(report, null, 2)], {
            type: "application/json",
          }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = `automaticity-${pack.language}-checker-feedback.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      })
      .catch(() => {
        status.textContent = en
          ? "Feedback could not be exported. Original records were kept."
          : "Rückmeldungen konnten nicht exportiert werden. Originaldaten bleiben erhalten.";
      });
  };
  return refresh;
}
