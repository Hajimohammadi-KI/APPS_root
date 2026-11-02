import type { AssessmentEvent, AttemptEvent } from "./contracts";
import type { PracticeTask } from "./curriculum";
import {
  LEARNER_FEEDBACK_CATEGORIES,
  LEARNER_FEEDBACK_POLICY,
  parseLearnerFeedback,
  type LearnerFeedback,
  type LearnerFeedbackCategory,
  type LearnerFeedbackState,
} from "./learner-feedback";

const ENDPOINT = "/api/learner-feedback";
const pausedRequests = new Map<string, Promise<ReadonlySet<string>>>();
/** Exercises that several learners reported as wrong (R100), one request per
 * page; without the comment service or a network nothing is paused. */
export function pausedTaskIds(
  language: "en" | "de",
): Promise<ReadonlySet<string>> {
  let request = pausedRequests.get(language);
  if (!request) {
    request = available()
      .then((on) =>
        on
          ? fetch(`${ENDPOINT}?paused=${language}`, {
              signal: AbortSignal.timeout(5000),
            }).then((response) => (response.ok ? response.json() : null))
          : null,
      )
      .then(
        (body: { paused?: unknown } | null) =>
          new Set(
            Array.isArray(body?.paused)
              ? body.paused.filter((id): id is string => typeof id === "string")
              : [],
          ),
      )
      .catch(() => new Set<string>());
    pausedRequests.set(language, request);
  }
  return request;
}
let availability: Promise<boolean> | null = null;
/** One availability request per page; a missing route counts as switched off. */
function available(): Promise<boolean> {
  availability ??= fetch(ENDPOINT, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((body: { available?: unknown } | null) => body?.available === true)
    .catch(() => false);
  return availability;
}

export interface LearnerFeedbackReceipt {
  id: number;
  token: string;
  taskId: string;
  category: LearnerFeedbackCategory;
  at: string;
  state: LearnerFeedbackState | "deleted";
  reply: string;
}
const receiptsKey = (language: "en" | "de") =>
  `automaticity:v2:${language}:learner-feedback:receipts`;
export function readLearnerFeedbackReceipts(
  language: "en" | "de",
): LearnerFeedbackReceipt[] {
  try {
    const rows: unknown = JSON.parse(
      localStorage.getItem(receiptsKey(language)) ?? "[]",
    );
    return Array.isArray(rows)
      ? rows.filter(
          (row): row is LearnerFeedbackReceipt =>
            typeof row?.id === "number" && typeof row?.token === "string",
        )
      : [];
  } catch {
    return [];
  }
}
function writeReceipts(
  language: "en" | "de",
  rows: LearnerFeedbackReceipt[],
): boolean {
  try {
    localStorage.setItem(receiptsKey(language), JSON.stringify(rows));
    return true;
  } catch {
    return false;
  }
}

const copy = {
  en: {
    summary: "Comment on this check",
    intro:
      "Tell the app owner if you think your answer is correct, the feedback is unclear or the exercise is wrong. The owner reviews every comment; a comment never changes your result by itself.",
    categories: {
      answer_correct: "My answer is correct",
      feedback_unclear: "I don't understand the feedback",
      exercise_wrong: "The exercise is wrong",
      other: "Something else",
    },
    comment:
      "Your comment (optional). Do not include names or contact details.",
    preview: "Exactly this will be sent",
    excluded:
      "Not sent: your name, profile, other answers, recordings or practice history.",
    consent:
      " I agree that exactly this preview is sent to the app owner and stored in a private GitHub repository (GitHub, USA) for review and for improving exercises. I can withdraw it later with the receipt.",
    send: "Send comment",
    sending: "Sending…",
    sent: (id: number) =>
      `Sent. Receipt #${id}. Check its status or withdraw it under “My comments” in Saved responses.`,
    unsaved: (id: number) =>
      `Sent as #${id}, but this browser could not save the receipt. Note the number; the owner can delete it on request.`,
    failed:
      "The comment was not sent. Your answer is unchanged; try again later.",
    invalid: "This comment cannot be sent: ",
  },
  de: {
    summary: "Kommentar zu dieser Prüfung",
    intro:
      "Sag den Verantwortlichen der App, wenn du deine Antwort für richtig hältst, die Rückmeldung unklar ist oder die Aufgabe fehlerhaft ist. Jeder Kommentar wird geprüft; ein Kommentar ändert dein Ergebnis nie von selbst.",
    categories: {
      answer_correct: "Meine Antwort ist richtig",
      feedback_unclear: "Ich verstehe die Rückmeldung nicht",
      exercise_wrong: "Die Aufgabe ist fehlerhaft",
      other: "Etwas anderes",
    },
    comment: "Dein Kommentar (optional). Keine Namen oder Kontaktdaten.",
    preview: "Genau das wird gesendet",
    excluded:
      "Nicht gesendet: dein Name, Profil, andere Antworten, Aufnahmen und Übungsverlauf.",
    consent:
      " Ich bin einverstanden, dass genau diese Vorschau an die Verantwortlichen der App gesendet und in einem privaten GitHub-Repository (GitHub, USA) zur Prüfung und zur Verbesserung der Aufgaben gespeichert wird. Ich kann sie später mit der Quittung zurückziehen.",
    send: "Kommentar senden",
    sending: "Wird gesendet…",
    sent: (id: number) =>
      `Gesendet. Quittung #${id}. Status und Rückzug findest du unter „Meine Kommentare“ bei den gespeicherten Antworten.`,
    unsaved: (id: number) =>
      `Als #${id} gesendet, aber dieser Browser konnte die Quittung nicht speichern. Notiere die Nummer; auf Anfrage wird der Kommentar gelöscht.`,
    failed:
      "Der Kommentar wurde nicht gesendet. Deine Antwort bleibt unverändert; versuche es später erneut.",
    invalid: "Dieser Kommentar kann nicht gesendet werden: ",
  },
};
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  return el;
}

/** A comment on one checked written answer. Nothing is sent without a fresh
 * consent for the exact preview, and nothing changes the learner's result. */
export function appendLearnerFeedbackPanel(
  root: HTMLElement,
  input: {
    language: "en" | "de";
    contentVersion: string;
    task: PracticeTask;
    attempt: AttemptEvent;
    assessment: AssessmentEvent | null;
  },
): void {
  const { language, task, attempt, assessment } = input;
  const t = copy[language];
  const details = node("details");
  details.className = "learner-feedback";
  details.append(node("summary", t.summary), node("p", t.intro));
  const form = node("div"),
    status = node("p");
  status.setAttribute("role", "status");
  details.append(form, status);
  // Hidden until the service answers that it is switched on.
  details.hidden = true;
  root.append(details);
  void available().then((on) => {
    details.hidden = !on;
  });
  let built = false;
  details.addEventListener("toggle", () => {
    if (!details.open || built) return;
    built = true;
    buildForm();
  });
  function buildForm() {
    const group = node("fieldset");
    group.append(node("legend", t.summary));
    let category: LearnerFeedbackCategory | null = null;
    for (const value of LEARNER_FEEDBACK_CATEGORIES) {
      const radio = node("input"),
        label = node("label");
      radio.type = "radio";
      radio.name = `learner-feedback-${attempt.id}`;
      radio.value = value;
      radio.onchange = () => {
        category = value;
        update();
      };
      label.append(radio, ` ${t.categories[value]}`);
      group.append(label, node("br"));
    }
    const comment = node("textarea"),
      commentLabel = node("label", t.comment),
      preview = node("pre"),
      consent = node("input"),
      consentLabel = node("label"),
      send = node("button", t.send);
    comment.id = `learner-feedback-comment-${attempt.id}`;
    commentLabel.htmlFor = comment.id;
    comment.rows = 3;
    comment.maxLength = 1000;
    comment.style.width = "100%";
    preview.style.whiteSpace = "pre-wrap";
    consent.type = "checkbox";
    consent.id = `learner-feedback-consent-${attempt.id}`;
    consentLabel.htmlFor = consent.id;
    consentLabel.append(consent, t.consent);
    send.type = "button";
    form.append(
      group,
      commentLabel,
      comment,
      node("h4", t.preview),
      preview,
      node("p", t.excluded),
      consentLabel,
      send,
    );
    const draft = (): LearnerFeedback | string => {
      try {
        return parseLearnerFeedback({
          kind: "automaticity.learner-feedback",
          version: 1,
          language,
          contentVersion: input.contentVersion,
          release: null,
          task: {
            id: task.id,
            version: task.version,
            constructionId: task.constructionId,
            prompt: task.prompt,
            acceptedAnswers: task.acceptedAnswers,
          },
          response: attempt.response.text,
          check: {
            verdict: assessment?.verdict ?? "not_assessed",
            evaluator: assessment
              ? `${assessment.evaluator.id} ${assessment.evaluator.version}`
              : "none",
            feedback: assessment?.feedback ?? "",
          },
          category: category ?? "other",
          comment: comment.value,
          consent: {
            policy: LEARNER_FEEDBACK_POLICY,
            at: new Date().toISOString(),
          },
        });
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    };
    const update = () => {
      const value = draft();
      preview.textContent =
        typeof value === "string"
          ? t.invalid + value
          : [
              `${task.id} (${task.version})`,
              value.task.prompt,
              `→ ${value.response}`,
              `${value.check.verdict}: ${value.check.feedback}`,
              category ? t.categories[category] : "—",
              value.comment || "—",
            ].join("\n");
      send.disabled =
        !category || !consent.checked || typeof value === "string";
    };
    comment.oninput = () => {
      consent.checked = false;
      update();
    };
    consent.onchange = update;
    update();
    send.onclick = async () => {
      const value = draft();
      if (send.disabled || typeof value === "string" || !category) return;
      send.disabled = true;
      status.textContent = t.sending;
      const release = await fetch("/web-release.json", { cache: "no-store" })
        .then((response) => response.json())
        .then((body: { release?: unknown }) =>
          typeof body.release === "string" ? body.release : null,
        )
        .catch(() => null);
      try {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          // Sent only from this explicit, consented action.
          body: JSON.stringify({ ...value, release }),
          signal: AbortSignal.timeout(15000),
          cache: "no-store",
        });
        if (response.status !== 201) throw Error("not stored");
        const { receipt } = (await response.json()) as {
          receipt: { id: number; token: string };
        };
        const saved = writeReceipts(language, [
          ...readLearnerFeedbackReceipts(language),
          {
            id: receipt.id,
            token: receipt.token,
            taskId: task.id,
            category,
            at: value.consent.at,
            state: "received",
            reply: "",
          },
        ]);
        status.textContent = saved ? t.sent(receipt.id) : t.unsaved(receipt.id);
        consent.checked = false;
        update();
      } catch {
        status.textContent = t.failed;
        update();
      }
    };
  }
}

const receiptCopy = {
  en: {
    summary: "My comments",
    check: "Check status",
    withdraw: "Withdraw",
    confirm: "Withdraw this comment? Its text is removed from the review list.",
    states: {
      received: "Received, not reviewed yet",
      answer_accepted: "Your answer was accepted as correct",
      answer_rejected: "Reviewed: this form is not correct here",
      exercise_fix_planned: "Reviewed: the exercise will be fixed",
      no_change: "Reviewed: no change",
      withdrawn: "Withdrawn",
      deleted: "Withdrawn and deleted",
    },
    reply: "Reply: ",
    failed: "The status could not be checked; try again later.",
  },
  de: {
    summary: "Meine Kommentare",
    check: "Status prüfen",
    withdraw: "Zurückziehen",
    confirm:
      "Diesen Kommentar zurückziehen? Sein Text wird aus der Prüfliste entfernt.",
    states: {
      received: "Eingegangen, noch nicht geprüft",
      answer_accepted: "Deine Antwort wurde als richtig angenommen",
      answer_rejected: "Geprüft: Diese Form ist hier nicht richtig",
      exercise_fix_planned: "Geprüft: Die Aufgabe wird korrigiert",
      no_change: "Geprüft: keine Änderung",
      withdrawn: "Zurückgezogen",
      deleted: "Zurückgezogen und gelöscht",
    },
    reply: "Antwort: ",
    failed:
      "Der Status konnte nicht geprüft werden; versuche es später erneut.",
  },
};

/** The learner's own receipts; status is requested only when asked. */
export function mountLearnerFeedbackReceipts(
  root: HTMLElement,
  language: "en" | "de",
): () => void {
  const t = receiptCopy[language];
  const details = node("details"),
    list = node("ul");
  details.id = "learner-feedback-receipts";
  details.append(node("summary", t.summary), list);
  root.append(details);
  const render = () => {
    const rows = readLearnerFeedbackReceipts(language);
    list.replaceChildren();
    details.hidden = !rows.length;
    for (const row of rows) {
      const item = node("li"),
        line = node("p"),
        note = node("p");
      line.textContent = `#${row.id} · ${row.at.slice(0, 10)} · ${row.taskId} · ${t.states[row.state] ?? row.state}`;
      if (row.reply) note.textContent = t.reply + row.reply;
      item.append(line, note);
      const update = (next: Partial<LearnerFeedbackReceipt>) => {
        writeReceipts(
          language,
          readLearnerFeedbackReceipts(language).map((receipt) =>
            receipt.id === row.id ? { ...receipt, ...next } : receipt,
          ),
        );
        render();
      };
      const ask = async (method: "GET" | "DELETE") => {
        try {
          const response = await fetch(
            `${ENDPOINT}?id=${row.id}&token=${encodeURIComponent(row.token)}`,
            { method, cache: "no-store", signal: AbortSignal.timeout(15000) },
          );
          if (!response.ok) throw Error("unavailable");
          const body = (await response.json()) as {
            state: LearnerFeedbackReceipt["state"];
            reply?: string;
          };
          update({ state: body.state, reply: body.reply ?? row.reply });
        } catch {
          note.textContent = t.failed;
        }
      };
      if (row.state !== "withdrawn" && row.state !== "deleted") {
        const check = node("button", t.check),
          withdraw = node("button", t.withdraw);
        check.type = withdraw.type = "button";
        check.onclick = () => void ask("GET");
        withdraw.onclick = () => {
          if (confirm(t.confirm)) void ask("DELETE");
        };
        item.append(check, withdraw);
      }
      list.append(item);
    }
  };
  render();
  return render;
}
