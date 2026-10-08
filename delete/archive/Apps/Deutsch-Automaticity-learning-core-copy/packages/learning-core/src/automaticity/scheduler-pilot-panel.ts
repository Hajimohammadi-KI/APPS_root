import type { CurriculumPack, PracticeTask } from "./curriculum";
import type { Language } from "./contracts";
import { readAutomaticityEvents, type LocalStore } from "./storage";
import { readHumanReviewManifest } from "./human-review";
import { sha256 } from "./backup";
import {
  validateSchedulerPilotPlan,
  readPilotEnrollment,
  hasPilotEnrollment,
  enrollSchedulerPilot,
  stopSchedulerPilot,
  schedulerPilotCards,
  recordPilotDelivery,
  pilotActiveKey,
  type SchedulerPilotPlan,
} from "./scheduler-pilot";
export interface LoadedPilot {
  plan: SchedulerPilotPlan;
  sha256: string;
}
export async function loadSchedulerPilot(
  pack: CurriculumPack,
  store: LocalStore,
): Promise<LoadedPilot | null> {
  try {
    const response = await fetch(
      `/learning-core/scheduler-pilot-${pack.language}.json`,
      { cache: "no-store", signal: AbortSignal.timeout(2000) },
    );
    if (!response.ok) return null;
    const text = await response.text();
    if (text.length > 100000) return null;
    const envelope = JSON.parse(text);
    if (envelope.schemaVersion !== 1 || !envelope.plan) return null;
    const plan = await validateSchedulerPilotPlan(
      envelope.plan,
      pack,
      await readHumanReviewManifest(pack.language),
      readAutomaticityEvents(store, pack.language).events,
      new Date().toISOString(),
    );
    return { plan, sha256: await sha256(JSON.stringify(plan)) };
  } catch {
    return null;
  }
}
export function mountSchedulerPilotPanel(
  root: HTMLElement,
  pack: CurriculumPack,
  store: LocalStore,
  loaded: LoadedPilot | null,
  onChanged: () => void,
  openTask: (task: PracticeTask) => void,
  canEdit: () => boolean,
): () => void {
  const language: Language = pack.language,
    t = (a: string, b: string) => (language === "en" ? a : b);
  const node = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    text?: string,
  ) => {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    return element;
  };
  const details = node("details");
  details.id = "scheduler-pilot";
  details.append(
    node(
      "summary",
      t("Review timing comparison", "Vergleich der Wiederholungszeiten"),
    ),
  );
  const body = node("div"),
    status = node("p");
  status.setAttribute("role", "status");
  details.append(body, status);
  root.append(details);
  const now = () => new Date().toISOString(),
    events = () => readAutomaticityEvents(store, language).events;
  let chosenParticipation = false;
  const action = (label: string, run: () => void) => {
    const button = node("button", label);
    button.type = "button";
    button.disabled = !canEdit();
    button.onclick = () => {
      try {
        if (!canEdit())
          throw Error(
            t(
              "Close the other practice tab first.",
              "Schließe zuerst den anderen Übungstab.",
            ),
          );
        run();
        render();
        onChanged();
      } catch (error) {
        status.textContent =
          error instanceof Error ? error.message : String(error);
        render();
        onChanged();
      }
    };
    return button;
  };
  function render() {
    body.replaceChildren();
    if (store.getItem(pilotActiveKey(language)) !== null)
      body.append(
        action(
          t(
            "Stop comparison and restore usual reviews",
            "Vergleich beenden und bisherige Wiederholungen nutzen",
          ),
          () => {
            stopSchedulerPilot(store, language, now());
            status.textContent = t(
              "Comparison stopped. Your usual review plan is active.",
              "Vergleich beendet. Dein bisheriger Wiederholungsplan ist aktiv.",
            );
          },
        ),
      );
    if (!loaded) {
      body.append(
        node(
          "p",
          t(
            "No reviewed comparison is available. Your usual review plan continues.",
            "Es ist kein geprüfter Vergleich verfügbar. Dein bisheriger Wiederholungsplan bleibt bestehen.",
          ),
        ),
      );
      return;
    }
    const { plan } = loaded,
      enrollment = readPilotEnrollment(store, plan, loaded.sha256),
      cards = schedulerPilotCards(plan, enrollment, events(), now());
    body.append(
      node("p", plan.description),
      node(
        "p",
        t(
          "Joining is optional. You can stop at any time; your original schedule and responses are kept.",
          "Die Teilnahme ist freiwillig. Du kannst jederzeit aufhören; dein bisheriger Zeitplan und deine Antworten bleiben erhalten.",
        ),
      ),
    );
    if (enrollment) {
      if (!cards.length)
        body.append(
          node(
            "p",
            t(
              "This comparison has ended. Your usual review plan is active.",
              "Dieser Vergleich ist beendet. Dein bisheriger Wiederholungsplan ist aktiv.",
            ),
          ),
        );
      for (const card of cards) {
        const unit = pack.units.find(
          (unit) => unit.id === card.constructionId,
        )!;
        const row = node("div");
        row.dataset.pilotTask = card.taskId;
        row.dataset.pilotState = card.state;
        row.append(
          node(
            "p",
            `${unit.title} · ${new Date(card.dueAt).toLocaleString(language)} · ${card.state === "completed" ? t("Response recorded; assessment is separate", "Antwort gespeichert; Bewertung erfolgt separat") : card.state === "interrupted" ? t("Extra practice or changed review; usual schedule restored", "Zusätzliche Übung oder geänderte Bewertung; bisheriger Zeitplan gilt") : card.state === "due" ? t("Ready for review", "Bereit zur Wiederholung") : t("Scheduled for later", "Für später geplant")}`,
          ),
        );
        if (card.state === "due")
          row.append(
            action(
              t("Start scheduled review", "Geplante Wiederholung starten"),
              () => {
                const current = readPilotEnrollment(store, plan, loaded.sha256);
                const latest = schedulerPilotCards(
                  plan,
                  current,
                  events(),
                  now(),
                ).find((row) => row.taskId === card.taskId);
                if (!current || latest?.state !== "due")
                  throw Error("Comparison state changed");
                recordPilotDelivery(store, plan, current, latest, now());
                openTask(unit.tasks.find((task) => task.id === card.taskId)!);
              },
            ),
          );
        body.append(row);
      }
    } else if (
      !hasPilotEnrollment(store, plan) &&
      Date.parse(now()) <
        Math.min(
          ...plan.targets.map((target) =>
            Date.parse(
              target.arm === "fsrs"
                ? target.candidateDueAt
                : target.baselineDueAt,
            ),
          ),
        )
    ) {
      const label = node("label"),
        consent = node("input");
      consent.type = "checkbox";
      consent.id = "scheduler-pilot-consent";
      consent.checked = chosenParticipation;
      consent.onchange = () => {
        chosenParticipation = consent.checked;
      };
      label.append(
        consent,
        document.createTextNode(
          t(
            "I choose to join this review timing comparison.",
            "Ich möchte an diesem Vergleich der Wiederholungszeiten teilnehmen.",
          ),
        ),
      );
      body.append(label);
      body.append(
        action(t("Join comparison", "Am Vergleich teilnehmen"), () => {
          if (!consent.checked)
            throw Error(
              t(
                "Choose participation first.",
                "Bitte entscheide dich zuerst für die Teilnahme.",
              ),
            );
          enrollSchedulerPilot(store, plan, loaded.sha256, events(), now());
          status.textContent = t(
            "Comparison started. Your original schedule was saved.",
            "Vergleich gestartet. Dein bisheriger Zeitplan wurde gesichert.",
          );
        }),
      );
    } else
      body.append(
        node(
          "p",
          t(
            "No active participation. Your usual review plan continues.",
            "Keine aktive Teilnahme. Dein bisheriger Wiederholungsplan bleibt bestehen.",
          ),
        ),
      );
  }
  const timer = loaded
    ? setInterval(() => {
        render();
        onChanged();
      }, 30000)
    : null;
  window.addEventListener(
    "pagehide",
    () => {
      if (timer !== null) clearInterval(timer);
    },
    {
      once: true,
    },
  );
  return render;
}
