import type {
  ConstructionUnit,
  CurriculumPack,
  PracticeTask,
} from "./curriculum";
import {
  CONTENT_CHECKS,
  CONTENT_TASK_CHECKS,
  approvedReviewDocuments,
  contentReviewBundle,
  contentReviewFindings,
  contentReviewSelection,
  reviewTaskGroups,
  safeReviewSource,
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
      "Check each unit: its rule, examples and every exercise. Approve a unit only when every check holds, or save findings and questions without approval. Download the files and send them to the app owner; the app changes only after the owner imports and releases them. Your draft stays in this browser.",
    reviewer: "Your name",
    role: "Your role and qualification",
    unit: "Unit",
    progress: (a: number, f: number, n: number) =>
      `${a} of ${n} units marked approved in this browser · ${f} with findings`,
    guide: [
      "Enter your name, role and qualification. Check the content against a reliable grammar and write specific notes.",
      "You can save findings after reviewing the selected cycle. Approving a whole unit requires checking all its active writing and speaking exercises, including the expandable section.",
      "Download the JSON file and send it to the app owner. Downloading sends nothing; importing and publishing are separate owner steps. Drafts stay in this browser.",
      "One teacher's content review is useful feedback. It does not replace the two independent benchmark reviewers needed to validate evaluator accuracy.",
    ],
    guideTitle: "How to return your review",
    cyclesOnly: "Selected learning cycles",
    allUnits: "Show all units",
    share: "Copy link for this unit",
    shareLink: "Review link for this unit",
    copied: "Link copied.",
    copyFallback:
      "Copy the visible review link using your browser's link menu.",
    cycle: "Selected practice cycle",
    formGoal: "Form goal",
    meaningGoal: "Meaning goal",
    useGoal: "Use goal",
    otherTasks: (n: number) =>
      `Other active exercises in this unit (${n}) — required for whole-unit approval`,
    findingsScope:
      "Unconfirmed checks may be wrong or simply not reviewed. Findings are not approvals.",
    sources: "Source references",
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
      formAccurate:
        "The form in the rule, examples and stated goal is correct.",
      meaningAccurate: "The meaning described and its stated goal are correct.",
      useAppropriate:
        "The described use and use goal are appropriate for the level.",
      contrastsAccurate: "Contrasts with similar forms are correct.",
      alternativesAccurate: "Accepted alternatives are correct.",
      prerequisitesAppropriate: "The prerequisites are appropriate.",
      sourcesChecked: "I checked the content against a reliable grammar.",
      promptClear: "The instruction is clear.",
      targetElicited: "It makes the learner use the target structure.",
      stageAppropriate: "The task and its purpose fit its stage in the path.",
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
      "Prüfe jede Einheit: Regel, Beispiele und jede Übung. Gib eine Einheit nur frei, wenn jede Prüfung zutrifft, oder speichere Befunde und Fragen ohne Freigabe. Lade die Dateien herunter und schicke sie an die Person, die die App betreut; die App ändert sich erst nach Import und Veröffentlichung. Dein Entwurf bleibt in diesem Browser.",
    reviewer: "Dein Name",
    role: "Deine Rolle und Qualifikation",
    unit: "Einheit",
    progress: (a: number, f: number, n: number) =>
      `${a} von ${n} Einheiten in diesem Browser als freigegeben markiert · ${f} mit Befund`,
    guide: [
      "Trage Namen, Rolle und Qualifikation ein. Gleiche den Inhalt mit einer verlässlichen Grammatik ab und schreibe konkrete Notizen.",
      "Nach der Prüfung des ausgewählten Zyklus kannst du Befunde speichern. Die Freigabe der ganzen Einheit verlangt alle aktiven Schreib- und Sprechübungen, auch im aufklappbaren Abschnitt.",
      "Lade die JSON-Datei herunter und schicke sie an die Person, die die App betreut. Der Download sendet nichts; Import und Veröffentlichung sind getrennte Schritte. Entwürfe bleiben in diesem Browser.",
      "Die Inhaltsprüfung einer Lehrkraft ist hilfreiches Feedback. Sie ersetzt nicht die zwei unabhängigen Benchmark-Prüfenden zur Validierung der Bewertungsgenauigkeit.",
    ],
    guideTitle: "So gibst du deine Prüfung zurück",
    cyclesOnly: "Ausgewählte Lernzyklen",
    allUnits: "Alle Einheiten anzeigen",
    share: "Link für diese Einheit kopieren",
    shareLink: "Prüflink für diese Einheit",
    copied: "Link kopiert.",
    copyFallback:
      "Kopiere den sichtbaren Prüflink über das Linkmenü deines Browsers.",
    cycle: "Ausgewählter Übungszyklus",
    formGoal: "Formziel",
    meaningGoal: "Bedeutungsziel",
    useGoal: "Gebrauchsziel",
    otherTasks: (n: number) =>
      `Weitere aktive Übungen dieser Einheit (${n}) — für die Freigabe der ganzen Einheit erforderlich`,
    findingsScope:
      "Nicht bestätigte Prüfungen können falsch oder noch ungeprüft sein. Befunde sind keine Freigaben.",
    sources: "Quellen",
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
    stale:
      "Die Einheit hat sich seit deiner Prüfung geändert; prüfe sie erneut.",
    exportApproved: (n: number) => `Freigaben herunterladen (${n})`,
    exportFindings: (n: number) => `Befunde herunterladen (${n})`,
    checks: {
      formAccurate:
        "Die Form in Regel, Beispielen und angegebenem Ziel ist korrekt.",
      meaningAccurate: "Die beschriebene Bedeutung und ihr Ziel sind korrekt.",
      useAppropriate:
        "Der Gebrauch und sein Ziel sind für das Niveau passend beschrieben.",
      contrastsAccurate: "Abgrenzungen zu ähnlichen Formen sind korrekt.",
      alternativesAccurate: "Zulässige Alternativen sind korrekt.",
      prerequisitesAppropriate: "Die Voraussetzungen sind passend.",
      sourcesChecked:
        "Ich habe den Inhalt mit einer verlässlichen Grammatik abgeglichen.",
      promptClear: "Die Anweisung ist klar.",
      targetElicited: "Die Übung verlangt die Zielstruktur.",
      stageAppropriate:
        "Die Übung und ihr Zweck passen zu ihrer Stufe im Lernweg.",
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
  const guide = node("section", undefined, "review-guide");
  guide.append(node("h2", t.guideTitle));
  const instructions = node("ol");
  for (const step of t.guide) instructions.append(node("li", step));
  guide.append(instructions, node("p", t.findingsScope));
  root.append(guide);
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
  select.id = "review-unit";
  const initial = contentReviewSelection(pack, location.search);
  let selected = initial.unit;
  if (!selected) throw Error("No installed units are available for review.");
  const filter = node("input");
  filter.type = "checkbox";
  filter.id = "review-cycles-only";
  filter.checked = initial.cycleOnly;
  const filterLabel = node("label");
  filterLabel.append(
    filter,
    ` ${t.cyclesOnly} (${pack.units.filter((unit) => unit.learningCycle).length})`,
  );
  const showAll = node("button", t.allUnits);
  showAll.type = "button";
  const share = node("button", t.share);
  share.type = "button";
  const shareLink = node("a", t.shareLink, "review-share-link");
  const shareStatus = node("p");
  shareStatus.setAttribute("role", "status");
  const panel = node("div");
  const exports = node("div", undefined, "review-exports");
  root.append(
    who,
    progress,
    filterLabel,
    showAll,
    select,
    share,
    shareLink,
    shareStatus,
    panel,
    exports,
  );

  const synchronizeLink = (unit: ConstructionUnit) => {
    const url = new URL(location.href);
    url.searchParams.set("unit", unit.id);
    if (filter.checked && unit.learningCycle)
      url.searchParams.set("focus", "cycle");
    else url.searchParams.delete("focus");
    history.replaceState(null, "", url);
    shareLink.href = url.href;
    shareStatus.textContent = "";
  };
  share.addEventListener("click", () => {
    void (async () => {
      try {
        if (!navigator.clipboard?.writeText)
          throw Error("Clipboard unavailable");
        await navigator.clipboard.writeText(shareLink.href);
        shareStatus.textContent = t.copied;
      } catch {
        shareStatus.textContent = t.copyFallback;
      }
    })();
  });

  const refreshProgress = () => {
    const states = pack.units.map((unit) => current(unit)?.state);
    progress.textContent = t.progress(
      states.filter((s) => s === "approved").length,
      states.filter((s) => s === "findings").length,
      pack.units.length,
    );
    select.replaceChildren();
    for (const unit of pack.units.filter(
      (unit) => !filter.checked || unit.learningCycle,
    )) {
      const state = current(unit)?.state;
      const option = node(
        "option",
        `${state === "approved" ? "✓ " : state === "findings" ? "⚑ " : ""}${unit.level} · ${unit.title}`,
      );
      option.value = unit.id;
      select.append(option);
    }
    select.value = selected!.id;
  };

  const showUnit = (unit: ConstructionUnit) => {
    selected = unit;
    select.value = unit.id;
    synchronizeLink(unit);
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
    const sources = node("ul");
    for (const source of unit.sources) {
      const href = safeReviewSource(source.url);
      if (!href) continue;
      const link = node("a", source.title);
      link.href = href;
      link.rel = "noopener noreferrer";
      const item = node("li");
      item.append(link);
      sources.append(item);
    }
    if (sources.childElementCount) facts.append(node("h3", t.sources), sources);
    if (unit.learningCycle) {
      const cycle = node("section", undefined, "review-cycle-goals");
      cycle.append(
        node("h3", `${t.cycle} · ${unit.learningCycle.version}`),
        node("p", `${t.formGoal}: ${unit.learningCycle.goals.form}`),
        node("p", `${t.meaningGoal}: ${unit.learningCycle.goals.meaning}`),
        node("p", `${t.useGoal}: ${unit.learningCycle.goals.use}`),
        node("p", t.guide[1]),
      );
      facts.append(cycle);
    }
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
    const renderTask = (
      parent: HTMLElement,
      task: PracticeTask,
      cycleTask = false,
    ) => {
      const row = (form.tasks[task.id] ??= { checks: {}, note: "" });
      const card = node("article");
      card.dataset.reviewTask = task.id;
      if (cycleTask) card.dataset.reviewCycleTask = task.stage;
      const prompt = node("p", task.prompt, "review-prompt");
      prompt.lang = language;
      card.append(
        node("h3", `${task.stage} · ${task.modality}`),
        node("small", task.id),
        prompt,
      );
      const purpose = unit.learningCycle?.steps.find(
        (step) => step.taskId === task.id,
      )?.purpose;
      if (purpose) card.append(node("p", purpose, "review-cycle-purpose"));
      if (task.answerPolicy === "closed") {
        const list = node(
          "p",
          `${t.accepted}: ${task.acceptedAnswers.join(" | ")}`,
        );
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
      details.append(
        node("summary", t.taskAll),
        ...boxes.map((box) => box.wrapper),
      );
      card.append(
        all.wrapper,
        details,
        note(row.note, (text) => (row.note = text)),
      );
      parent.append(card);
    };
    const groups = reviewTaskGroups(unit);
    for (const task of groups.cycle) renderTask(panel, task, true);
    if (groups.cycle.length) {
      const other = node("details", undefined, "review-other-tasks");
      other.append(node("summary", t.otherTasks(groups.other.length)));
      for (const task of groups.other) renderTask(other, task);
      panel.append(other);
    } else {
      for (const task of groups.other) renderTask(panel, task);
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
    const unit = pack.units.find((unit) => unit.id === select.value);
    if (unit) showUnit(unit);
    refreshAll();
  });
  const changeFilter = () => {
    if (filter.checked && !selected?.learningCycle)
      selected = pack.units.find((unit) => unit.learningCycle);
    if (!selected) {
      filter.checked = false;
      selected = pack.units[0];
    }
    refreshAll();
    if (selected) showUnit(selected);
  };
  filter.addEventListener("change", changeFilter);
  showAll.addEventListener("click", () => {
    filter.checked = false;
    changeFilter();
  });
  window.addEventListener("storage", refreshAll);
  // Saving a unit refreshes progress; keep the export counts in step.
  root.addEventListener("click", () => setTimeout(refreshExports, 0));
  refreshAll();
  showUnit(selected);
}

const root = document.querySelector<HTMLElement>("#content-review");
if (root)
  void mount(root).catch((error) => {
    root.textContent =
      error instanceof Error ? error.message : "The review could not load.";
  });
