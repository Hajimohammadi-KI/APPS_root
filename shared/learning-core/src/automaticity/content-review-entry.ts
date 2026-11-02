import type { ConstructionUnit, CurriculumPack } from "./curriculum";
import {
  CONTENT_CHECKS,
  CONTENT_TASK_CHECKS,
  approvedReviewDocuments,
  contentReviewBundle,
  contentReviewFindings,
  reviewCells,
  reviewProblems,
  unitContentDigest,
  type UnitReviewForm,
} from "./content-review";

/** The independent content review page: a reviewer checks each unit of the
 * app's curriculum and downloads files the owner imports. Drafts stay in this
 * browser; nothing is sent anywhere and the app changes only after import. */
type Saved = {
  unitSha256: string;
  state: "draft" | "approved" | "findings";
  form: UnitReviewForm;
};
type Store = {
  reviewer: { reviewerId: string; role: string };
  units: Record<string, Saved>;
};
const COPY = {
  en: {
    title: "Independent content review",
    intro:
      "Check each unit: its rule, examples and every exercise. Approve a unit only when every check holds, or save what is wrong as findings. Download the files and send them to the app owner; the app changes only after the owner imports and releases them. Your draft stays in this browser.",
    reviewer: "Your name",
    role: "Your role and qualification",
    unit: "Unit",
    progress: (a: number, f: number, n: number) =>
      `${a} of ${n} units approved · ${f} with findings`,
    rule: "Rule",
    examples: "Examples",
    error: "Common error",
    unitChecks: "Unit checks",
    note: "Note (at least 20 characters)",
    taskAll: "All checks hold for this exercise",
    accepted: "Accepted answers",
    rejected: "Known wrong answers",
    open: "Open answer (not scored)",
    approve: "Approve this unit",
    findings: "Save as findings",
    missing: "Still missing:",
    stale: "The unit changed since your review; review it again.",
    exportApproved: (n: number) => `Download approved reviews (${n})`,
    exportFindings: (n: number) => `Download findings (${n})`,
    checks: {
      formAccurate: "The form in the rule and examples is correct.",
      meaningAccurate: "The meaning described is correct.",
      useAppropriate: "When to use it is described appropriately for the level.",
      contrastsAccurate: "Contrasts with similar forms are correct.",
      alternativesAccurate: "Accepted alternatives are correct.",
      prerequisitesAppropriate: "The prerequisites are appropriate.",
      sourcesChecked: "I checked the content against a reliable grammar.",
      promptClear: "The instruction is clear.",
      targetElicited: "It makes the learner use the target structure.",
      stageAppropriate: "It fits its stage in the path.",
      modalityAppropriate: "It fits writing or speaking.",
      answerPolicyAppropriate: "Checked or open is the right choice.",
      acceptedAnswersAccurate:
        "Every accepted answer is correct; no answer it clearly asks for is missing.",
      exposureHandled: "The answer is not shown before the learner answers.",
    },
  },
  de: {
    title: "Unabhängige Inhaltsprüfung",
    intro:
      "Prüfe jede Einheit: Regel, Beispiele und jede Übung. Gib eine Einheit nur frei, wenn jede Prüfung zutrifft, oder speichere das Fehlerhafte als Befund. Lade die Dateien herunter und schicke sie an die Person, die die App betreut; die App ändert sich erst nach Import und Veröffentlichung. Dein Entwurf bleibt in diesem Browser.",
    reviewer: "Dein Name",
    role: "Deine Rolle und Qualifikation",
    unit: "Einheit",
    progress: (a: number, f: number, n: number) =>
      `${a} von ${n} Einheiten freigegeben · ${f} mit Befund`,
    rule: "Regel",
    examples: "Beispiele",
    error: "Häufiger Fehler",
    unitChecks: "Prüfungen der Einheit",
    note: "Notiz (mindestens 20 Zeichen)",
    taskAll: "Alle Prüfungen treffen für diese Übung zu",
    accepted: "Zulässige Antworten",
    rejected: "Bekannte falsche Antworten",
    open: "Offene Antwort (ohne Bewertung)",
    approve: "Diese Einheit freigeben",
    findings: "Als Befund speichern",
    missing: "Es fehlt noch:",
    stale: "Die Einheit hat sich seit deiner Prüfung geändert; prüfe sie erneut.",
    exportApproved: (n: number) => `Freigaben herunterladen (${n})`,
    exportFindings: (n: number) => `Befunde herunterladen (${n})`,
    checks: {
      formAccurate: "Die Form in Regel und Beispielen ist korrekt.",
      meaningAccurate: "Die beschriebene Bedeutung ist korrekt.",
      useAppropriate: "Der Gebrauch ist für das Niveau passend beschrieben.",
      contrastsAccurate: "Abgrenzungen zu ähnlichen Formen sind korrekt.",
      alternativesAccurate: "Zulässige Alternativen sind korrekt.",
      prerequisitesAppropriate: "Die Voraussetzungen sind passend.",
      sourcesChecked: "Ich habe den Inhalt mit einer verlässlichen Grammatik abgeglichen.",
      promptClear: "Die Anweisung ist klar.",
      targetElicited: "Die Übung verlangt die Zielstruktur.",
      stageAppropriate: "Sie passt zu ihrer Stufe im Lernweg.",
      modalityAppropriate: "Sie passt zu Schreiben oder Sprechen.",
      answerPolicyAppropriate: "Geprüft oder offen ist die richtige Wahl.",
      acceptedAnswersAccurate:
        "Jede zulässige Antwort ist korrekt; keine klar verlangte Antwort fehlt.",
      exposureHandled: "Die Antwort wird nicht vor dem Antworten gezeigt.",
    },
  },
};

const node = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string,
) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
const download = (name: string, value: unknown) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2) + "\n"], {
      type: "application/json",
    }),
  );
  const link = node("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

async function mount(root: HTMLElement) {
  const marker = (await (await fetch("/web-release.json")).json()) as {
    language?: string;
  };
  const language = marker.language === "de" ? "de" : "en";
  const t = COPY[language];
  document.documentElement.lang = language;
  document.title = t.title;
  const pack = (await (
    await fetch(`/learning-core/curriculum-${language}.json`)
  ).json()) as CurriculumPack;
  const key = `content-review:${language}:v1`;
  const read = (): Store => {
    try {
      const value = JSON.parse(localStorage.getItem(key) ?? "") as Store;
      if (value?.units && value.reviewer) return value;
    } catch {
      // A missing or unreadable draft starts empty.
    }
    return { reviewer: { reviewerId: "", role: "" }, units: {} };
  };
  const store = read();
  const save = () => localStorage.setItem(key, JSON.stringify(store));
  const digests = new Map<string, string>();
  for (const unit of pack.units)
    digests.set(unit.id, await unitContentDigest(unit));
  const current = (unit: ConstructionUnit) => {
    const saved = store.units[unit.id];
    return saved && saved.unitSha256 === digests.get(unit.id) ? saved : null;
  };
  const formFor = (unit: ConstructionUnit): UnitReviewForm =>
    current(unit)?.form ?? {
      reviewerId: "",
      role: "",
      reviewedAt: "",
      checks: {},
      note: "",
      tasks: {},
    };

  root.replaceChildren();
  root.append(node("h1", t.title), node("p", t.intro));
  const who = node("fieldset");
  const field = (label: string, name: "reviewerId" | "role") => {
    const wrapper = node("label", label);
    const input = node("input");
    input.value = store.reviewer[name];
    input.autocomplete = "off";
    input.addEventListener("input", () => {
      store.reviewer[name] = input.value;
      save();
    });
    wrapper.append(input);
    return wrapper;
  };
  who.append(field(t.reviewer, "reviewerId"), field(t.role, "role"));
  const progress = node("p", undefined, "review-progress");
  const select = node("select");
  select.setAttribute("aria-label", t.unit);
  const panel = node("div");
  const exports = node("div", undefined, "review-exports");
  root.append(who, progress, select, panel, exports);

  const refreshProgress = () => {
    const states = pack.units.map((unit) => current(unit)?.state);
    progress.textContent = t.progress(
      states.filter((s) => s === "approved").length,
      states.filter((s) => s === "findings").length,
      pack.units.length,
    );
    for (const [index, unit] of pack.units.entries()) {
      const state = current(unit)?.state;
      select.options[index]!.textContent = `${state === "approved" ? "✓ " : state === "findings" ? "⚑ " : ""}${unit.level} · ${unit.title}`;
    }
  };
  for (const unit of pack.units) select.append(node("option", unit.title));

  const showUnit = (unit: ConstructionUnit) => {
    const form = formFor(unit);
    const persist = (state: Saved["state"]) => {
      store.units[unit.id] = {
        unitSha256: digests.get(unit.id)!,
        state,
        form,
      };
      save();
      refreshProgress();
    };
    const checkbox = (
      label: string,
      checked: boolean,
      change: (value: boolean) => void,
    ) => {
      const wrapper = node("label", undefined, "review-check");
      const input = node("input");
      input.type = "checkbox";
      input.checked = checked;
      input.addEventListener("change", () => {
        change(input.checked);
        persist("draft");
        update();
      });
      wrapper.append(input, " ", label);
      return { wrapper, input };
    };
    const note = (value: string, change: (text: string) => void) => {
      const wrapper = node("label", t.note);
      const area = node("textarea");
      area.rows = 2;
      area.value = value;
      area.addEventListener("input", () => {
        change(area.value);
        persist("draft");
        update();
      });
      wrapper.append(area);
      return wrapper;
    };
    panel.replaceChildren();
    if (store.units[unit.id] && !current(unit))
      panel.append(node("p", t.stale, "review-stale"));
    const facts = node("section");
    facts.lang = language;
    facts.append(
      node("h2", `${unit.level} · ${unit.title}`),
      node("p", `${t.rule}: ${unit.rule}`),
      node("p", `${t.examples}: ${unit.examples.join(" · ")}`),
      node("p", `${t.error}: ${unit.commonError}`),
    );
    const unitBox = node("fieldset");
    unitBox.append(node("legend", t.unitChecks));
    for (const check of CONTENT_CHECKS)
      unitBox.append(
        checkbox(t.checks[check], form.checks[check] === true, (value) => {
          form.checks[check] = value;
        }).wrapper,
      );
    unitBox.append(note(form.note, (text) => (form.note = text)));
    panel.append(facts, unitBox);
    for (const cell of reviewCells(unit)) {
      panel.append(node("h3", `${cell.stage} · ${cell.modality}`));
      for (const task of cell.tasks) {
        const row = (form.tasks[task.id] ??= { checks: {}, note: "" });
        const card = node("article");
        const prompt = node("p", task.prompt, "review-prompt");
        prompt.lang = language;
        card.append(node("small", task.id), prompt);
        if (task.answerPolicy === "closed") {
          const list = node("p", `${t.accepted}: ${task.acceptedAnswers.join(" | ")}`);
          list.lang = language;
          card.append(list);
          if (task.rejectedAnswers?.length)
            card.append(
              node(
                "p",
                `${t.rejected}: ${task.rejectedAnswers.map((r) => `${r.answer} — ${r.explanation}`).join(" | ")}`,
              ),
            );
        } else card.append(node("p", t.open));
        const boxes = CONTENT_TASK_CHECKS.map((check) =>
          checkbox(t.checks[check], row.checks[check] === true, (value) => {
            row.checks[check] = value;
          }),
        );
        const all = checkbox(
          t.taskAll,
          CONTENT_TASK_CHECKS.every((check) => row.checks[check] === true),
          (value) => {
            for (const [index, check] of CONTENT_TASK_CHECKS.entries()) {
              row.checks[check] = value;
              boxes[index]!.input.checked = value;
            }
          },
        );
        const details = node("details");
        details.append(node("summary", t.taskAll), ...boxes.map((box) => box.wrapper));
        card.append(all.wrapper, details, note(row.note, (text) => (row.note = text)));
        panel.append(card);
      }
    }
    const missing = node("p", undefined, "review-missing");
    const approve = node("button", t.approve);
    const findings = node("button", t.findings);
    approve.type = findings.type = "button";
    const stamp = () => {
      form.reviewerId = store.reviewer.reviewerId;
      form.role = store.reviewer.role;
      form.reviewedAt = new Date().toISOString();
    };
    approve.addEventListener("click", () => {
      stamp();
      if (!reviewProblems(unit, form).length) persist("approved");
      update();
    });
    findings.addEventListener("click", () => {
      stamp();
      persist("findings");
    });
    const update = () => {
      const problems = reviewProblems(unit, {
        ...form,
        reviewerId: store.reviewer.reviewerId,
        role: store.reviewer.role,
        reviewedAt: new Date().toISOString(),
      });
      approve.disabled = problems.length > 0;
      missing.textContent = problems.length
        ? `${t.missing} ${problems.length}`
        : "";
    };
    panel.append(missing, approve, findings);
    update();
  };

  const approvedButton = node("button");
  const findingsButton = node("button");
  approvedButton.type = findingsButton.type = "button";
  const refreshExports = () => {
    const approved = pack.units.filter((u) => current(u)?.state === "approved");
    const found = pack.units.filter((u) => current(u)?.state === "findings");
    approvedButton.textContent = t.exportApproved(approved.length);
    findingsButton.textContent = t.exportFindings(found.length);
    approvedButton.disabled = !approved.length;
    findingsButton.disabled = !found.length;
    return { approved, found };
  };
  approvedButton.addEventListener("click", () => {
    void (async () => {
      const documents = [];
      for (const unit of refreshExports().approved)
        documents.push(
          ...(await approvedReviewDocuments(pack, unit, current(unit)!.form)),
        );
      download(
        `content-review-${language}-${new Date().toISOString().slice(0, 10)}.json`,
        contentReviewBundle(documents),
      );
    })();
  });
  findingsButton.addEventListener("click", () => {
    download(
      `content-findings-${language}-${new Date().toISOString().slice(0, 10)}.json`,
      {
        schemaVersion: 1,
        findings: refreshExports().found.map((unit) =>
          contentReviewFindings(pack, unit, current(unit)!.form),
        ),
      },
    );
  });
  exports.append(approvedButton, findingsButton);
  const original = refreshProgress;
  const refreshAll = () => {
    original();
    refreshExports();
  };
  select.addEventListener("change", () => {
    showUnit(pack.units[select.selectedIndex]!);
    refreshAll();
  });
  window.addEventListener("storage", refreshAll);
  // Saving a unit refreshes progress; keep the export counts in step.
  root.addEventListener("click", () => setTimeout(refreshExports, 0));
  refreshAll();
  showUnit(pack.units[0]!);
}

const root = document.querySelector<HTMLElement>("#content-review");
if (root)
  void mount(root).catch((error) => {
    root.textContent =
      error instanceof Error ? error.message : "The review could not load.";
  });
