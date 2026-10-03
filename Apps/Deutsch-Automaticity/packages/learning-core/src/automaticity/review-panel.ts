import type { AssessmentEvent, Language, Verdict } from "./contracts";
import type { CurriculumPack } from "./curriculum";
import { readAutomaticityEvents, appendAutomaticityEvent } from "./storage";
import { reduceAutomaticityEvents } from "./evidence";
import { readRecording } from "./media";
import { sha256 } from "./backup";
import { mountAssessmentFeedbackPanel } from "./assessment-feedback-panel";
import { qualifyHumanReview, readHumanReviewManifest } from "./human-review";
import {
  parseReviewDraft,
  reviewDraftKey,
  reviewSelectionKey,
  saveReviewDraft,
  type ReviewDraft,
} from "./review-draft";
const node = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  return element;
};
/** Locally recorded review is useful feedback, never automatic scope approval. */
export function mountReviewPanel(
  root: HTMLElement,
  language: Language,
  pack: CurriculumPack,
  onSaved: () => void,
  canEdit = true,
): () => void {
  const en = language === "en",
    t = (a: string, b: string) => (en ? a : b);
  const details = node("details");
  details.id = "response-review";
  details.open = new URLSearchParams(location.search).get("review") === "1";
  details.append(
    node(
      "summary",
      t("Review saved responses", "Gespeicherte Antworten prüfen"),
    ),
    node(
      "p",
      t(
        "Keep the original answer and add a separate review. Self-checks and locally recorded feedback do not certify mastery.",
        "Behalte die Originalantwort und ergänze eine separate Bewertung. Selbstprüfungen und lokal erfasste Rückmeldungen bestätigen keine Beherrschung.",
      ),
    ),
  );
  const form = node("form");
  form.className = "review-form";
  const select = node("select");
  select.id = "review-attempt";
  const addLabel = (label: string, id: string, control: HTMLElement) => {
    const element = node("label", label);
    element.htmlFor = id;
    form.append(element, control);
  };
  addLabel(t("Saved response", "Gespeicherte Antwort"), select.id, select);
  const original = node("blockquote"),
    prompt = node("p"),
    media = node("div");
  original.className = "response-copy";
  form.append(prompt, original, media);
  const reviewer = node("select");
  reviewer.id = "review-kind";
  for (const [value, label] of [
    ["self", t("My self-check", "Meine Selbstprüfung")],
    [
      "human",
      t(
        "Feedback from another reviewer",
        "Rückmeldung einer anderen prüfenden Person",
      ),
    ],
  ]) {
    const option = node("option", label);
    option.value = value!;
    reviewer.append(option);
  }
  addLabel(t("Review source", "Quelle der Rückmeldung"), reviewer.id, reviewer);
  const reviewerName = node("input");
  reviewerName.id = "reviewer-name";
  reviewerName.maxLength = 150;
  addLabel(
    t(
      "Reviewer's name or reference",
      "Name oder Referenz der prüfenden Person",
    ),
    reviewerName.id,
    reviewerName,
  );
  const verdict = node("select");
  verdict.id = "review-verdict";
  for (const [value, label] of [
    ["not_assessed", t("Not assessed", "Nicht beurteilt")],
    [
      "pass",
      t(
        "Grammar, target use and meaning are correct",
        "Grammatik, Zielstruktur und Bedeutung sind korrekt",
      ),
    ],
    [
      "needs_repair",
      t(
        "A grammatical repair is needed",
        "Eine grammatische Korrektur ist nötig",
      ),
    ],
    [
      "target_not_observed",
      t(
        "The target construction was not observed",
        "Die Zielstruktur wurde nicht beobachtet",
      ),
    ],
  ]) {
    const option = node("option", label);
    option.value = value!;
    verdict.append(option);
  }
  addLabel(t("Review result", "Prüfergebnis"), verdict.id, verdict);
  const opportunities = node("input");
  opportunities.id = "review-opportunities";
  opportunities.type = "number";
  opportunities.min = "1";
  opportunities.max = "1000";
  opportunities.value = "1";
  addLabel(
    t(
      "Target opportunities actually checked",
      "Tatsächlich geprüfte Stellen für die Zielstruktur",
    ),
    opportunities.id,
    opportunities,
  );
  const feedback = node("textarea");
  feedback.id = "review-feedback";
  feedback.required = true;
  feedback.maxLength = 10000;
  addLabel(
    t("Feedback and reason", "Rückmeldung und Begründung"),
    feedback.id,
    feedback,
  );
  const correction = node("textarea");
  correction.id = "review-correction";
  correction.maxLength = 100000;
  addLabel(
    t("Suggested correction, if needed", "Korrekturvorschlag, falls nötig"),
    correction.id,
    correction,
  );
  const save = node(
    "button",
    t("Save separate review", "Separate Bewertung speichern"),
  );
  save.type = "submit";
  form.append(save);
  const status = node("p");
  status.id = "review-save-status";
  status.setAttribute("role", "status");
  form.append(status);
  const draftStatus = node("p");
  draftStatus.id = "review-draft-status";
  draftStatus.setAttribute("role", "status");
  const currentReview = node("p");
  currentReview.id = "review-current-feedback";
  const compare = node(
    "button",
    t("Compare latest feedback", "Neueste Rückmeldung vergleichen"),
  );
  compare.id = "review-compare";
  compare.type = "button";
  const exportDraft = node(
    "button",
    t("Download review draft", "Bewertungsentwurf herunterladen"),
  );
  exportDraft.id = "review-export-draft";
  exportDraft.type = "button";
  form.append(currentReview, compare, draftStatus, exportDraft);
  details.append(form);
  const refreshFeedbackMemory = mountAssessmentFeedbackPanel(details, pack);
  root.append(details);
  let selectedId = "",
    audioReview: { sha256: string; confirmed: boolean } | null = null,
    audioUrl: string | null = null,
    displayGeneration = 0,
    saving = false;
  const drafts = new Map<
    string,
    { draft: ReviewDraft; raw: string | null; persisted: boolean }
  >();
  try {
    selectedId =
      new URLSearchParams(location.search).get("attempt") ??
      localStorage.getItem(reviewSelectionKey(language)) ??
      "";
  } catch {
    /* Response selection is optional. */
  }
  const rows = () =>
    reduceAutomaticityEvents(
      readAutomaticityEvents(localStorage, language).events,
      language,
      new Date().toISOString(),
    ).attempts;
  const collect = (): ReviewDraft | null => {
    const value = drafts.get(selectedId);
    if (!value) return null;
    return {
      ...value.draft,
      reviewerKind: reviewer.value === "human" ? "human" : "self",
      reviewerName: reviewerName.value,
      verdict: verdict.value as Verdict,
      opportunities: opportunities.value,
      feedback: feedback.value,
      correction: correction.value,
      updatedAt: new Date().toISOString(),
    };
  };
  const persist = () => {
    if (!canEdit) return;
    const draft = collect(),
      entry = drafts.get(selectedId),
      row = rows().find((row) => row.attempt.id === selectedId);
    if (!draft || !entry || !row) return;
    entry.draft = draft;
    entry.persisted = false;
    try {
      entry.raw = saveReviewDraft(
        localStorage,
        language,
        row.attempt,
        draft,
        entry.raw,
      );
      entry.persisted = true;
      draftStatus.textContent = t(
        "Review draft saved on this device.",
        "Bewertungsentwurf auf diesem Gerät gespeichert.",
      );
    } catch {
      draftStatus.textContent = t(
        "Your changes are still in this tab, but the review draft could not be saved. Download it before leaving. Any earlier saved draft was kept.",
        "Deine Änderungen sind noch in diesem Tab, konnten aber nicht gespeichert werden. Lade den Entwurf vor dem Verlassen herunter. Ein zuvor gespeicherter Entwurf bleibt erhalten.",
      );
    }
  };
  const showCurrentReview = () => {
    const row = rows().find((row) => row.attempt.id === selectedId);
    currentReview.textContent = row?.assessment
      ? t("Current feedback: ", "Aktuelle Rückmeldung: ") +
        row.assessment.feedback
      : t(
          "There is no single current assessment for this response.",
          "Für diese Antwort liegt keine eindeutige aktuelle Bewertung vor.",
        );
  };
  compare.onclick = () => {
    const row = rows().find((row) => row.attempt.id === selectedId),
      entry = drafts.get(selectedId);
    showCurrentReview();
    if (canEdit && row && entry) {
      entry.draft.baseAssessmentId = row.assessment?.id ?? null;
      persist();
    }
  };
  exportDraft.onclick = () => {
    const draft = collect();
    if (!draft) return;
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { kind: "automaticity.review-draft", language, draft },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const link = node("a");
    link.href = url;
    link.download = `automaticity-${language}-review-draft.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const display = () => {
    selectedId = select.value;
    const generation = ++displayGeneration;
    const row = rows().find((row) => row.attempt.id === selectedId);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = null;
    audioReview = null;
    media.replaceChildren();
    status.textContent = "";
    if (!row) {
      original.textContent = t(
        "No saved responses yet.",
        "Noch keine gespeicherten Antworten.",
      );
      prompt.textContent = "";
      save.disabled = true;
      return;
    }
    save.disabled = !canEdit;
    let entry = drafts.get(selectedId);
    if (!entry) {
      const draft: ReviewDraft = {
        version: 1,
        attemptId: row.attempt.id,
        responseSha256: row.attempt.response.sha256,
        baseAssessmentId: row.assessment?.id ?? null,
        reviewerKind: "self",
        reviewerName: "",
        verdict: "not_assessed",
        opportunities: "1",
        feedback: "",
        correction: "",
        updatedAt: new Date().toISOString(),
      };
      entry = { draft, raw: null, persisted: true };
      try {
        entry.raw = localStorage.getItem(reviewDraftKey(language, selectedId));
        if (entry.raw !== null)
          entry.draft = parseReviewDraft(entry.raw, row.attempt);
      } catch {
        entry.persisted = false;
      }
      drafts.set(selectedId, entry);
    }
    reviewer.value = entry.draft.reviewerKind;
    reviewerName.value = entry.draft.reviewerName;
    verdict.value = entry.draft.verdict;
    opportunities.value = entry.draft.opportunities;
    feedback.value = entry.draft.feedback;
    correction.value = entry.draft.correction;
    for (const control of [
      reviewer,
      reviewerName,
      verdict,
      opportunities,
      feedback,
      correction,
    ])
      control.disabled = !canEdit;
    draftStatus.textContent = !canEdit
      ? t(
          "Review editing is open in another tab. Close that tab and reload here to continue.",
          "Die Bearbeitung ist in einem anderen Tab geöffnet. Schließe ihn und lade diese Seite neu, um fortzufahren.",
        )
      : entry.persisted
        ? entry.raw
          ? t(
              "Saved review draft restored.",
              "Gespeicherter Bewertungsentwurf wiederhergestellt.",
            )
          : ""
        : t(
            "The saved draft could not be read or updated. It was kept. Download your current draft before leaving.",
            "Der gespeicherte Entwurf konnte nicht gelesen oder aktualisiert werden. Er bleibt erhalten. Lade deinen aktuellen Entwurf vor dem Verlassen herunter.",
          );
    if (canEdit)
      try {
        localStorage.setItem(reviewSelectionKey(language), selectedId);
      } catch {
        /* Per-response drafts remain usable without saved selection. */
      }
    showCurrentReview();
    original.textContent = row.attempt.response.text;
    prompt.textContent =
      pack.units
        .flatMap((unit) => unit.tasks)
        .find((task) => task.id === row.attempt.task.id)?.prompt ??
      t(
        "Earlier practice: the original prompt and assistance are not established. Recordings remain available in the audio library.",
        "Frühere Übung: Originalaufgabe und Hilfen sind nicht belegt. Aufnahmen bleiben in der Audiobibliothek verfügbar.",
      );
    if (row.attempt.audio) {
      const play = node(
        "button",
        t("Load original recording", "Originalaufnahme laden"),
      );
      play.type = "button";
      play.onclick = () => {
        void (async () => {
          const audio = await readRecording(
            indexedDB,
            language,
            row.attempt.audio!.id,
          );
          if (generation !== displayGeneration || selectedId !== row.attempt.id)
            return;
          if (
            !audio ||
            audio.blob.size !== row.attempt.audio!.bytes ||
            (await sha256(await audio.blob.arrayBuffer())) !==
              row.attempt.audio!.sha256
          )
            throw new Error(
              t(
                "The original recording is unavailable.",
                "Die Originalaufnahme ist nicht verfügbar.",
              ),
            );
          if (generation !== displayGeneration || selectedId !== row.attempt.id)
            return;
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          audioUrl = URL.createObjectURL(audio.blob);
          const player = node("audio");
          player.controls = true;
          player.src = audioUrl;
          media.replaceChildren(player);
          const confirmed = node("input");
          confirmed.type = "checkbox";
          confirmed.disabled = true;
          const label = node(
            "label",
            t(
              "I listened to and reviewed the original recording",
              "Ich habe die Originalaufnahme angehört und geprüft",
            ),
          );
          label.prepend(confirmed);
          media.append(label);
          player.onended = () => {
            if (generation === displayGeneration) confirmed.disabled = false;
          };
          confirmed.onchange = () => {
            if (generation === displayGeneration)
              audioReview = {
                sha256: row.attempt.audio!.sha256,
                confirmed: confirmed.checked,
              };
          };
        })().catch((error) => {
          if (generation === displayGeneration)
            status.textContent = String(error);
        });
      };
      media.append(play);
    }
  };
  const refresh = () => {
    refreshFeedbackMemory();
    const available = rows().reverse();
    select.replaceChildren();
    for (const row of available) {
      const unit = pack.units.find(
        (unit) => unit.id === row.attempt.task.constructionId,
      );
      const option = node(
        "option",
        `${new Date(row.attempt.at).toLocaleString(language)} · ${unit?.title ?? t("Practice response", "Übungsantwort")}`,
      );
      option.value = row.attempt.id;
      select.append(option);
    }
    if (available.some((row) => row.attempt.id === selectedId))
      select.value = selectedId;
    display();
  };
  select.onchange = () => {
    persist();
    display();
  };
  form.addEventListener("input", (event) => {
    if (event.target !== select) persist();
  });
  form.addEventListener("change", (event) => {
    if (event.target !== select) persist();
  });
  details.addEventListener("toggle", () => {
    if (details.open) refresh();
  });
  form.onsubmit = (event) => {
    event.preventDefault();
    if (saving || !canEdit) return;
    saving = true;
    void (async () => {
      const row = rows().find((row) => row.attempt.id === selectedId);
      if (!row)
        throw new Error(
          t("Select a saved response.", "Wähle eine gespeicherte Antwort."),
        );
      const entry = drafts.get(selectedId);
      if (
        !entry ||
        entry.draft.baseAssessmentId !== (row.assessment?.id ?? null) ||
        row.reasons.includes("conflicting_assessments")
      )
        throw new Error(
          t(
            "Feedback changed while you were editing. Compare the latest feedback before saving. Your draft has been kept.",
            "Die Rückmeldung hat sich während der Bearbeitung geändert. Vergleiche vor dem Speichern die neueste Rückmeldung. Dein Entwurf bleibt erhalten.",
          ),
        );
      if (!feedback.value.trim())
        throw new Error(
          t(
            "Add the reason for this review.",
            "Ergänze eine Begründung für die Bewertung.",
          ),
        );
      if (reviewer.value === "human" && !reviewerName.value.trim())
        throw new Error(
          t(
            "Identify the person whose feedback you are recording.",
            "Gib an, von wem die Rückmeldung stammt.",
          ),
        );
      const result = verdict.value as Verdict;
      const count = Number(opportunities.value);
      if (
        result !== "not_assessed" &&
        (!Number.isSafeInteger(count) || count < 1 || count > 1000)
      )
        throw new Error(
          t(
            "Enter the number of target opportunities checked.",
            "Gib die Anzahl der geprüften Stellen an.",
          ),
        );
      const at = new Date(
        Math.max(
          Date.now(),
          Date.parse(row.assessment?.at ?? row.attempt.at) + 1,
        ),
      ).toISOString();
      const reviewState = JSON.stringify([
        selectedId,
        reviewer.value,
        reviewerName.value,
        verdict.value,
        opportunities.value,
        feedback.value,
        correction.value,
      ]);
      const approved =
        reviewer.value === "human"
          ? await qualifyHumanReview(
              row.attempt,
              pack,
              await readHumanReviewManifest(language),
              reviewerName.value,
              at,
              audioReview,
            )
          : null;
      const current = rows().find(
        (current) => current.attempt.id === row.attempt.id,
      );
      if (
        reviewState !==
          JSON.stringify([
            selectedId,
            reviewer.value,
            reviewerName.value,
            verdict.value,
            opportunities.value,
            feedback.value,
            correction.value,
          ]) ||
        current?.assessment?.id !== row.assessment?.id ||
        current?.reasons.includes("conflicting_assessments")
      )
        throw new Error(
          t(
            "The response or review changed while saving. Your draft was kept; compare the latest review and save again.",
            "Antwort oder Bewertung hat sich beim Speichern geändert. Dein Entwurf bleibt erhalten; vergleiche die aktuelle Bewertung und speichere erneut.",
          ),
        );
      const assessment: AssessmentEvent = {
        version: 2,
        type: "assessment",
        id: crypto.randomUUID(),
        language,
        at,
        attemptId: row.attempt.id,
        responseSha256: row.attempt.response.sha256,
        taskVersion: row.attempt.task.version,
        rubricVersion: row.attempt.task.rubricVersion,
        verdict: result,
        dimensions: {
          grammar:
            result === "pass"
              ? "pass"
              : result === "needs_repair"
                ? "fail"
                : "unknown",
          target:
            result === "target_not_observed"
              ? "not_observed"
              : result === "not_assessed"
                ? "unknown"
                : "observed",
          relevance: result === "pass" ? "pass" : "unknown",
          opportunities: result === "not_assessed" ? null : count,
        },
        evaluator: approved ?? {
          id:
            reviewer.value === "human"
              ? `local-review:${reviewerName.value.trim()}`
              : "learner-self-check",
          version: "1",
          kind: reviewer.value === "human" ? "human" : "self",
          scopeApproved: false,
          reviewId: crypto.randomUUID(),
        },
        uncertainty: result === "not_assessed",
        confidence: null,
        feedback: feedback.value.trim(),
        correction: correction.value.trim() || null,
        spans: [],
        supersedes:
          reviewer.value === "human" ? (row.assessment?.id ?? null) : null,
      };
      appendAutomaticityEvent(localStorage, assessment);
      // Clear only the draft this editor loaded, after the review is durably saved.
      if (
        entry.raw !== null &&
        entry.persisted &&
        localStorage.getItem(reviewDraftKey(language, selectedId)) === entry.raw
      )
        localStorage.removeItem(reviewDraftKey(language, selectedId));
      drafts.delete(selectedId);
      onSaved();
      refresh();
      status.textContent = approved
        ? t(
            "Review saved under the approved assessment procedure. Independent learning evidence still depends on the original response, assistance and timing.",
            "Bewertung nach dem freigegebenen Bewertungsverfahren gespeichert. Unabhängige Lernnachweise hängen weiterhin von Originalantwort, Hilfen und Zeitabstand ab.",
          )
        : t(
            "Review saved separately. The original answer was kept. This feedback does not approve a mastery or model-assessment scope.",
            "Bewertung separat gespeichert. Die Originalantwort bleibt erhalten. Diese Rückmeldung bestätigt keine Beherrschung und gibt keine automatische Bewertungsfunktion frei.",
          );
    })()
      .catch((error) => {
        status.textContent =
          error instanceof Error ? error.message : String(error);
      })
      .finally(() => {
        saving = false;
      });
  };
  refresh();
  window.addEventListener("pagehide", () => {
    displayGeneration++;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  });
  window.addEventListener("beforeunload", (event) => {
    if ([...drafts.values()].some((entry) => !entry.persisted)) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  return refresh;
}
