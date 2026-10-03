import type { Language } from "./contracts";
import type { CurriculumPack } from "./curriculum";
import {
  reduceAutomaticityEvents,
  unresolvedRepairs,
  type EvidenceReduction,
} from "./evidence";
import { repairTaskForAttempt } from "./selector";
import { readAutomaticityEvents } from "./storage";

/** Every surface derives actions from current judgments, never completion flags. */
export function evidenceOverview(
  reduction: EvidenceReduction,
  pack: CurriculumPack,
) {
  const modes = (["writing", "speaking"] as const).map((modality) => {
    const attempts = reduction.attempts.filter(
      (row) => row.attempt.task.modality === modality,
    );
    const progress = reduction.progress.filter(
      (row) => row.modality === modality,
    );
    const assessed = progress.reduce(
      (sum, row) => sum + row.independentAssessed,
      0,
    );
    const successes = progress.reduce(
      (sum, row) => sum + row.independentSuccesses,
      0,
    );
    return {
      modality,
      attempts: attempts.length,
      assisted: attempts.filter((row) =>
        row.reasons.includes("assisted_or_exposed"),
      ).length,
      assessed,
      accuracy: assessed ? successes / assessed : null,
      delayed: progress.reduce((sum, row) => sum + row.delayedSuccesses, 0),
      transfer: progress.reduce((sum, row) => sum + row.novelSuccesses, 0),
      timing: progress.flatMap((row) =>
        row.medianFirstInputMs === null ? [] : [row.medianFirstInputMs],
      ),
    };
  });
  const repairs = unresolvedRepairs(reduction.attempts)
    .flatMap((original) => {
      const unit = pack.units.find(
        (row) => row.id === original.attempt.task.constructionId,
      );
      const task = unit ? repairTaskForAttempt(unit, original.attempt) : null;
      const query = new URLSearchParams({
        review: "1",
        attempt: original.attempt.id,
      });
      if (task) {
        query.set("task", task.id);
        query.set("repairOf", original.attempt.id);
      }
      return [
        {
          attemptId: original.attempt.id,
          title: unit?.title ?? null,
          modality: original.attempt.task.modality,
          href: `/practice?${query}`,
          at: original.attempt.at,
        },
      ];
    })
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(0, 3);
  return { modes, repairs };
}
/** Small shared DOM view used by static pages and React wrappers. */
export function mountEvidenceOverview(
  root: HTMLElement,
  language: Language,
): () => void {
  const en = language === "en",
    t = (a: string, b: string) => (en ? a : b);
  let active = true,
    pack: CurriculumPack | null = null;
  const node = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    text?: string,
  ) => {
    const value = document.createElement(tag);
    if (text !== undefined) value.textContent = text;
    return value;
  };
  root.className = "automaticity-overview";
  root.setAttribute(
    "aria-label",
    t("Independent learning evidence", "Unabhängige Lernnachweise"),
  );
  root.style.cssText =
    "border-radius:14px;padding:20px;margin:16px 0;line-height:1.55;overflow-wrap:anywhere";
  const refresh = () => {
    if (!active || !pack) return;
    const read = readAutomaticityEvents(localStorage, language);
    const reduced = reduceAutomaticityEvents(
      read.events,
      language,
      new Date().toISOString(),
    );
    const view = evidenceOverview(reduced, pack);
    // The daily sidebar must reflect the same ledger as independent practice.
    // Empty evidence is unknown, never a fabricated 0% mastery score.
    const dailySummary = document.querySelector<HTMLElement>(
      "[data-learning-summary]",
    );
    if (dailySummary) {
      const due = reduced.progress.filter(
        (row) => row.nextReviewAt && Date.parse(row.nextReviewAt) <= Date.now(),
      ).length;
      const checked = view.modes.reduce((sum, mode) => sum + mode.assessed, 0);
      const delayed = view.modes.reduce((sum, mode) => sum + mode.delayed, 0);
      const transfer = view.modes.reduce((sum, mode) => sum + mode.transfer, 0);
      const link = node(
        "a",
        t("Open your learning path", "Deinen Lernweg öffnen"),
      );
      link.href = "/practice";
      dailySummary.replaceChildren(
        node("h3", t("Your learning evidence", "Deine Lernnachweise")),
        node(
          "p",
          `${reduced.attempts.length} ${t("saved responses", "gespeicherte Antworten")}`,
        ),
        node("p", `${due} ${t("due reviews", "fällige Wiederholungen")}`),
        node(
          "p",
          checked
            ? `${checked} ${t("independent checks", "unabhängige Prüfungen")}`
            : t(
                "Independent accuracy is not yet established.",
                "Selbstständige Genauigkeit ist noch nicht belegt.",
              ),
        ),
        node(
          "p",
          `${delayed} ${t("delayed successes", "erfolgreiche spätere Abrufe")} · ${transfer} ${t("new-context successes", "Erfolge in neuem Kontext")}`,
        ),
        link,
      );
    }
    root.replaceChildren(
      node(
        "h2",
        t(
          "Independent practice and saved responses",
          "Eigenständige Übungen und gespeicherte Antworten",
        ),
      ),
    );
    const context = new URLSearchParams(location.search);
    const topic = context.get("topic");
    const query = new URLSearchParams();
    if (topic) query.set("topic", topic);
    if (context.get("level")) query.set("level", context.get("level")!);
    const start = node(
      "a",
      topic
        ? t(
            "Practise this topic independently",
            "Dieses Thema eigenständig üben",
          )
        : t("Resume independent practice", "Eigenständige Übung fortsetzen"),
    );
    start.href = query.size ? `/practice?${query}` : "/practice";
    start.className = "automaticity-primary-action";
    start.style.cssText =
      "display:inline-block;padding:10px 14px;margin:8px 8px 12px 0";
    root.append(start);
    const review = node(
      "a",
      t("Review saved responses", "Gespeicherte Antworten prüfen"),
    );
    review.href = "/practice?review=1";
    review.className = "automaticity-secondary-action";
    review.style.cssText =
      "display:inline-block;padding:10px 12px;margin:8px 8px 12px 0";
    root.append(review);
    const transfer = node(
      "a",
      t("Transfer to another device", "Auf ein anderes Gerät übertragen"),
    );
    transfer.href = "/practice#backup-tools";
    transfer.style.cssText =
      "display:inline-block;padding:10px 12px;margin:8px 0 12px";
    root.append(transfer);
    if (view.repairs.length) {
      root.append(node("h3", t("Next repairs", "Nächste Korrekturen")));
      const list = node("ul");
      list.dataset.repairQueue = "true";
      for (const repair of view.repairs) {
        const item = node("li"),
          link = node(
            "a",
            `${repair.title ?? t("Saved response", "Gespeicherte Antwort")} · ${repair.modality === "writing" ? t("Writing", "Schreiben") : t("Speaking", "Sprechen")}`,
          );
        link.href = repair.href;
        link.dataset.attempt = repair.attemptId;
        item.append(link);
        list.append(item);
      }
      root.append(list);
    }
    const details = node("details"),
      summary = node(
        "summary",
        t(
          "Practice, accuracy, transfer and timing",
          "Übung, Genauigkeit, Transfer und Zeit",
        ),
      );
    summary.style.cssText = "cursor:pointer;padding:8px 0;font-weight:600";
    details.append(summary);
    const grid = node("div");
    grid.style.cssText =
      "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:16px";
    for (const mode of view.modes) {
      const card = node("section");
      card.dataset.evidenceMode = mode.modality;
      card.append(
        node(
          "h3",
          mode.modality === "writing"
            ? t("Writing", "Schreiben")
            : t("Speaking", "Sprechen"),
        ),
        node(
          "p",
          mode.accuracy === null
            ? t("Accuracy not yet established", "Genauigkeit noch nicht belegt")
            : `${Math.round(mode.accuracy * 100)}% · ${mode.assessed} ${mode.assessed === 1 ? t("independent check", "unabhängige Prüfung") : t("independent checks", "unabhängige Prüfungen")}`,
        ),
        node(
          "p",
          `${mode.attempts} ${mode.attempts === 1 ? t("saved attempt", "gespeicherter Versuch") : t("saved attempts", "gespeicherte Versuche")} · ${mode.assisted} ${t("with recorded support", "mit erfasster Hilfe")}`,
        ),
        node(
          "p",
          `${mode.delayed} ${mode.delayed === 1 ? t("delayed success", "erfolgreicher verzögerter Abruf") : t("delayed successes", "erfolgreiche verzögerte Abrufe")} · ${mode.transfer} ${mode.transfer === 1 ? t("new-context success", "Erfolg in neuem Kontext") : t("new-context successes", "Erfolge in neuem Kontext")}`,
        ),
        node(
          "p",
          mode.timing.length
            ? t(
                "Response timing is available by topic in practice; it is not a speech-fluency score.",
                "Antwortzeiten sind je Thema in der Übung verfügbar; sie sind kein Sprechflüssigkeitswert.",
              )
            : t(
                "Response timing unavailable; untimed work remains usable.",
                "Antwortzeit nicht verfügbar; Übungen ohne Zeitmessung bleiben nutzbar.",
              ),
        ),
      );
      grid.append(card);
    }
    details.append(
      grid,
      node(
        "p",
        t(
          "Practice completion does not certify a CEFR level. Original answers and earlier records remain in your history.",
          "Abgeschlossene Übungen bestätigen kein GER-Niveau. Originalantworten und frühere Einträge bleiben in deinem Verlauf.",
        ),
      ),
    );
    root.append(details);
    if (read.unreadable.length || reduced.rejected.length) {
      const warning = node(
        "p",
        t(
          "Some records need recovery. Their original data remains in your complete backup.",
          "Einige Einträge benötigen Wiederherstellung. Ihre Originaldaten bleiben in der vollständigen Sicherung.",
        ),
      );
      warning.setAttribute("role", "status");
      root.append(warning);
    }
  };
  const fail = () => {
    if (active) {
      const dailySummary = document.querySelector<HTMLElement>(
        "[data-learning-summary]",
      );
      if (dailySummary)
        dailySummary.replaceChildren(
          node(
            "p",
            t(
              "Learning evidence is temporarily unavailable. Open practice to check your saved history.",
              "Lernnachweise sind vorübergehend nicht verfügbar. Öffne die Übung, um deinen gespeicherten Verlauf zu prüfen.",
            ),
          ),
        );
      root.replaceChildren(
        node(
          "p",
          t(
            "Saved evidence is temporarily unavailable. Your history has been kept.",
            "Gespeicherte Nachweise sind vorübergehend nicht verfügbar. Dein Verlauf bleibt erhalten.",
          ),
        ),
      );
      const link = node("a", t("Open practice", "Übung öffnen"));
      link.href = "/practice";
      root.append(link);
    }
  };
  root.append(
    node(
      "p",
      t("Loading saved practice…", "Gespeicherte Übungen werden geladen…"),
    ),
  );
  void fetch(`/learning-core/curriculum-${language}.json`)
    .then(async (response) => {
      if (!response.ok) throw new Error("Catalog unavailable");
      const value = (await response.json()) as CurriculumPack;
      if (value.language !== language || !Array.isArray(value.units))
        throw new Error("Invalid catalog");
      pack = value;
      refresh();
    })
    .catch(fail);
  const changed = () => {
    try {
      refresh();
    } catch {
      fail();
    }
  };
  window.addEventListener("storage", changed);
  window.addEventListener("automaticity-history-updated", changed);
  window.addEventListener("language-topic-changed", changed);
  window.addEventListener("focus", changed);
  return () => {
    active = false;
    window.removeEventListener("storage", changed);
    window.removeEventListener("automaticity-history-updated", changed);
    window.removeEventListener("language-topic-changed", changed);
    window.removeEventListener("focus", changed);
    root.replaceChildren();
  };
}
