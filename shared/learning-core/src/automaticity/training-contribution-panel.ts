import type { AssessmentFeedback } from "./assessment-feedback";
import type { CurriculumPack } from "./curriculum";
import {
  prepareTrainingCandidate,
  TRAINING_CONTRIBUTION_POLICY,
} from "./training-contribution";

/** No network or persistent consent: each download requires a fresh selection
 * and consent for the exact preview. Existing privacy choices are untouched. */
export function mountTrainingContributionPanel(
  root: HTMLElement,
  pack: CurriculumPack,
) {
  const en = pack.language === "en",
    t = (a: string, b: string) => (en ? a : b);
  const node = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    text?: string,
  ) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const details = node("details");
  details.id = "training-contribution";
  details.append(
    node(
      "summary",
      t("Help improve assessment", "Die Bewertung verbessern helfen"),
    ),
    node(
      "p",
      t(
        "Choose one reviewed written response and edit the preview to remove names, contact details and private information. You can download this text and your edited feedback for human review and possible later model training. The text is not guaranteed anonymous. Your profile, recordings and other answers are excluded. Downloading does not send data or train a model.",
        "Wähle eine geprüfte schriftliche Antwort und entferne Namen, Kontaktdaten und private Angaben aus der Vorschau. Du kannst diesen Text und deine bearbeitete Rückmeldung für eine menschliche Prüfung und ein mögliches späteres Modelltraining herunterladen. Anonymität ist nicht garantiert. Profil, Aufnahmen und andere Antworten sind ausgeschlossen. Der Download sendet keine Daten und trainiert kein Modell.",
      ),
    ),
  );
  const select = node("select"),
    response = node("textarea"),
    review = node("textarea"),
    consent = node("input"),
    download = node("button"),
    status = node("p");
  select.id = "training-case";
  response.id = "training-text";
  review.id = "training-feedback";
  consent.id = "training-consent";
  response.rows = 4;
  response.maxLength = 8000;
  review.rows = 3;
  review.maxLength = 4000;
  response.style.width = review.style.width = "100%";
  consent.type = "checkbox";
  consent.checked = false;
  download.id = "training-download";
  download.type = "button";
  download.disabled = true;
  download.textContent = t(
    "Download selected example",
    "Ausgewähltes Beispiel herunterladen",
  );
  status.id = "training-status";
  status.setAttribute("role", "status");
  const label = (text: string, control: HTMLElement) => {
    const el = node("label", text);
    el.htmlFor = control.id;
    details.append(el, control);
  };
  label(
    t("Reviewed response to contribute", "Antwort für den Beitrag"),
    select,
  );
  label(
    t(
      "Text preview — remove private information",
      "Textvorschau — private Angaben entfernen",
    ),
    response,
  );
  label(
    t(
      "Feedback preview — remove private information",
      "Rückmeldungsvorschau — private Angaben entfernen",
    ),
    review,
  );
  const consentLabel = node("label");
  consentLabel.htmlFor = consent.id;
  consentLabel.append(
    consent,
    document.createTextNode(
      t(
        " I reviewed both previews and agree to prepare only this selected text for human review and possible assessment-model training. This permission applies only to this download.",
        " Ich habe beide Vorschauen geprüft und bin einverstanden, nur diesen ausgewählten Text für eine menschliche Prüfung und ein mögliches Training des Bewertungsmodells vorzubereiten. Diese Zustimmung gilt nur für diesen Download.",
      ),
    ),
  );
  details.append(consentLabel, download, status);
  root.append(details);
  let report: AssessmentFeedback | null = null,
    revision = 0;
  const available = () => {
    download.disabled =
      !report ||
      !select.value ||
      !consent.checked ||
      !response.value.trim() ||
      response.value.length > 8000 ||
      review.value.length > 4000;
  };
  const edit = () => {
    revision++;
    consent.checked = false;
    available();
  };
  response.oninput = review.oninput = edit;
  consent.onchange = () => {
    revision++;
    available();
  };
  select.onchange = () => {
    const chosen = report?.cases.find((row) => row.id === select.value);
    response.value = chosen?.attempt.response.text ?? "";
    review.value = chosen?.review.feedback ?? "";
    status.textContent = "";
    edit();
  };
  download.onclick = () => {
    if (download.disabled || !report) return;
    const snapshot = ++revision;
    download.disabled = true;
    void prepareTrainingCandidate(report, pack, {
      caseId: select.value,
      responseText: response.value,
      reviewText: review.value,
      contributionId: crypto.randomUUID(),
      at: new Date().toISOString(),
      consent: {
        granted: consent.checked,
        purpose: "assessment-model-development",
        policyVersion: TRAINING_CONTRIBUTION_POLICY,
      },
    })
      .then((candidate) => {
        if (snapshot !== revision || !consent.checked) return;
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(candidate, null, 2)], {
            type: "application/json",
          }),
        );
        const link = node("a");
        link.href = url;
        link.download = `automaticity-${pack.language}-training-candidate-${candidate.contributionId}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        consent.checked = false;
        status.textContent = t(
          "Selected example downloaded. It still needs independent review. Nothing was uploaded or trained.",
          "Ausgewähltes Beispiel heruntergeladen. Eine unabhängige Prüfung steht noch aus. Nichts wurde hochgeladen oder trainiert.",
        );
      })
      .catch(() => {
        if (snapshot === revision)
          status.textContent = t(
            "The example could not be prepared. Check the selection and previews; your saved work is kept.",
            "Das Beispiel konnte nicht vorbereitet werden. Prüfe Auswahl und Vorschauen; deine gespeicherte Arbeit bleibt erhalten.",
          );
      })
      .finally(available);
  };
  return (next: AssessmentFeedback | null) => {
    report = next;
    const prior = select.value;
    const ids = next?.cases.map((row) => row.id) ?? [];
    const existing = Array.from(select.options)
      .slice(1)
      .map((option) => option.value);
    if (
      JSON.stringify(ids) !== JSON.stringify(existing) ||
      !select.options.length
    ) {
      const empty = node(
        "option",
        t("Choose a written response", "Eine schriftliche Antwort wählen"),
      );
      empty.value = "";
      select.replaceChildren(empty);
      for (const row of next?.cases ?? []) {
        const unit = pack.units.find(
          (unit) => unit.id === row.task.constructionId,
        );
        const option = node(
          "option",
          `${unit?.level ?? ""} · ${unit?.title ?? row.task.constructionId} · ${row.attempt.response.text.slice(0, 60)}`,
        );
        option.value = row.id;
        select.append(option);
      }
      select.value = ids.includes(prior) ? prior : "";
      if (!select.value) {
        response.value = "";
        review.value = "";
        edit();
      }
    }
    if (!ids.length)
      status.textContent = t(
        "Save feedback from another reviewer on a written response before choosing a contribution.",
        "Speichere zuerst die Rückmeldung einer anderen prüfenden Person zu einer schriftlichen Antwort.",
      );
    available();
  };
}
