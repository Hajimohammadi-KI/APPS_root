import {
  type AttemptEvent,
  type Language,
  type Modality,
  type Stage,
  isRecord,
} from "./contracts";
import {
  type ConstructionUnit,
  type CurriculumPack,
  type PracticeTask,
  GRAMMAR_FAMILIES,
  validateCurriculum,
  activePracticeTasks,
} from "./curriculum";
import {
  appendAutomaticityEvent,
  readAutomaticityEvents,
  sessionKey,
} from "./storage";
import { preserveLegacyStateDurable } from "./migration";
import { mountReviewPanel } from "./review-panel";
import { reduceAutomaticityEvents } from "./evidence";
import { assessControlledTask } from "./assessment";
import {
  collectAssessmentFeedback,
  guardAssessmentWithFeedback,
  persistFeedbackAssessment,
} from "./assessment-feedback";
import { createTransformerClient } from "./transformer-client";
import {
  captureCompleteBackup,
  recoverBeforeMount,
  restoreCompleteBackup,
  sha256,
  validateCompleteBackup,
} from "./backup";
import {
  readRecording,
  ResponseTimer,
  storeRecording,
  type StoredRecording,
} from "./media";
import { selectDailyFocus, selectDailyTask } from "./selector";
import {
  loadDailyPlan,
  saveDailyPlan,
  dailyResponseCount,
  RESPONSE_GOALS,
  type DailyPracticePlan,
} from "./daily-plan";
import { syncLegacyPractice } from "./legacy";
import {
  loadSchedulerPilot,
  mountSchedulerPilotPanel,
} from "./scheduler-pilot-panel";
import {
  outsidePilotPack,
  schedulerPilotCards,
  readPilotEnrollment,
} from "./scheduler-pilot";

interface Session {
  version: 2;
  taskId: string;
  taskVersion: string;
  draft: string;
  startedAt: string;
  hintCount: number;
  solutionRevealed: boolean;
  exampleSeen: boolean;
  selfReportedAssistance: boolean;
  previousAttemptId: string | null;
  submittedId: string | null;
  audioId: string | null;
}
const stages: Stage[] = [
  "notice",
  "retrieve",
  "vary",
  "produce",
  "repair",
  "transfer",
  "retain",
];
const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const qualifiedTransformer = createTransformerClient();
function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function button(
  label: string,
  action: () => void | Promise<void>,
  className = "",
): HTMLButtonElement {
  const node = element("button", label, className);
  node.type = "button";
  node.addEventListener("click", () => {
    void Promise.resolve()
      .then(action)
      .catch((error) =>
        window.dispatchEvent(
          new CustomEvent("practice-error", { detail: error }),
        ),
      );
  });
  return node;
}
function download(name: string, data: unknown): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const anchor = element("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** One shared learner route; language content and stored evidence remain separate. */
export async function mountPractice(
  root: HTMLElement,
  language: Language,
): Promise<void> {
  const en = language === "en",
    t = (english: string, german: string) => (en ? english : german);
  const persistence = { storage: localStorage, indexedDB };
  await recoverBeforeMount(persistence, language);
  await preserveLegacyStateDurable(persistence, language, now());
  const response = await fetch(`/learning-core/curriculum-${language}.json`);
  if (!response.ok)
    throw new Error(
      t(
        "The grammar catalog could not be loaded.",
        "Der Grammatikkatalog konnte nicht geladen werden.",
      ),
    );
  const pack = (await response.json()) as CurriculumPack;
  if (
    pack.language !== language ||
    !Array.isArray(pack.units) ||
    validateCurriculum(pack).length
  )
    throw new Error("Invalid curriculum");
  const unitById = new Map(pack.units.map((unit) => [unit.id, unit]));
  const pilot = await loadSchedulerPilot(pack, localStorage);
  const recommendationPack = () =>
    pilot
      ? outsidePilotPack(
          pack,
          schedulerPilotCards(
            pilot.plan,
            readPilotEnrollment(localStorage, pilot.plan, pilot.sha256),
            readAutomaticityEvents(localStorage, language).events,
            now(),
          ),
        )
      : pack;
  let refreshPilot = () => {};
  await syncLegacyPractice(localStorage, language, pack, now());
  const taskById = new Map(
    pack.units.flatMap((unit) =>
      unit.tasks.map((task) => [task.id, task] as const),
    ),
  );
  const settingKey = `automaticity:v2:${language}:level`;
  let level = localStorage.getItem(settingKey) ?? "B1";
  const timingKey = `automaticity:v2:${language}:timing`;
  let timingEnabled = localStorage.getItem(timingKey) !== "off";
  const requested = new URLSearchParams(location.search);
  const repairRequestId = requested.get("repairOf");
  let unit: ConstructionUnit =
    pack.units.find(
      (row) =>
        row.title === requested.get("topic") &&
        (!requested.get("level") || row.level === requested.get("level")),
    ) ??
    selectDailyFocus(
      recommendationPack(),
      reduceAutomaticityEvents(
        readAutomaticityEvents(localStorage, language).events,
        language,
        now(),
      ).progress,
      now(),
      level,
    ).focus[0] ??
    pack.units[0]!;
  let task: PracticeTask =
    selectDailyTask(
      unit,
      reduceAutomaticityEvents(
        readAutomaticityEvents(localStorage, language).events,
        language,
        now(),
      ),
      now(),
    ).task ??
    activePracticeTasks(unit).find(
      (row) => row.stage === "retrieve" && row.modality === "writing",
    ) ??
    activePracticeTasks(unit)[0]!;
  const requestedTask = taskById.get(requested.get("task") ?? "");
  if (requestedTask) {
    task = requestedTask;
    unit = unitById.get(task.constructionId)!;
  }
  let session: Session;
  let timer: ResponseTimer | null = null;
  let recording: StoredRecording | null = null;
  let recorder: MediaRecorder | null = null,
    stream: MediaStream | null = null,
    audioUrl: string | null = null;
  let recordingStart = 0;
  let busy = false,
    recordingPending = false;
  let lockRelease: (() => void) | null = null;
  let editing = true;
  const feedback = element("div", "", "feedback");
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  const errorBox = element("p", "", "error");
  errorBox.setAttribute("role", "alert");
  const taskPanel = element("section", undefined, "card task-panel");
  const progressPanel = element("section", undefined, "card");
  const focusPanel = element("div", undefined, "focus-list");
  const dailyPanel = element("div", undefined, "daily-plan");
  const historyPanel = element("section", undefined, "card");
  const controls = element("div", undefined, "toolbar");
  const writeError = (error: unknown) => {
    errorBox.textContent =
      error instanceof Error && error.name === "QuotaExceededError"
        ? t(
            "Storage is full. Keep this tab open and copy any unsaved response. Export a backup below before freeing space, then try again. Your earlier saved work is kept.",
            "Der Speicher ist voll. Lass diesen Tab geöffnet und kopiere eine noch nicht gespeicherte Antwort. Exportiere unten eine Sicherung, bevor du Speicherplatz freigibst, und versuche es erneut. Deine bisher gespeicherte Arbeit bleibt erhalten.",
          )
        : error instanceof Error
          ? error.message
          : t(
              "The action failed. Your saved records were kept.",
              "Die Aktion ist fehlgeschlagen. Gespeicherte Daten bleiben erhalten.",
            );
  };
  window.addEventListener("practice-error", (event) =>
    writeError((event as CustomEvent<unknown>).detail),
  );
  const ledger = () => {
    const read = readAutomaticityEvents(localStorage, language);
    if (read.unreadable.length)
      errorBox.textContent = t(
        "Some saved records could not be read. Export a backup before attempting repairs.",
        "Einige gespeicherte Einträge sind nicht lesbar. Exportiere vor einer Reparatur eine Sicherung.",
      );
    return reduceAutomaticityEvents(read.events, language, now());
  };
  const assertEditable = () => {
    if (!editing)
      throw new Error(
        t(
          "Practice is already open in another tab. Close it and reload here.",
          "Die Übung ist bereits in einem anderen Tab geöffnet. Schließe ihn und lade diese Seite neu.",
        ),
      );
  };
  // Cooperative ownership prevents competing drafts in two new practice tabs.
  if (navigator.locks) {
    await new Promise<void>((resolve) => {
      void navigator.locks
        .request(
          `automaticity-practice-${language}`,
          { ifAvailable: true },
          async (lock) => {
            editing = !!lock;
            resolve();
            if (lock)
              await new Promise<void>((release) => {
                lockRelease = release;
              });
          },
        )
        .catch((error) => {
          writeError(error);
          editing = false;
          resolve();
        });
    });
  }
  const saveSession = () => {
    assertEditable();
    const value = JSON.stringify(session);
    localStorage.setItem(sessionKey(language), value);
    localStorage.setItem(
      `${sessionKey(language)}:task:${encodeURIComponent(session.taskId)}`,
      value,
    );
    if (localStorage.getItem(sessionKey(language)) !== value)
      throw new Error("Draft was not saved");
  };
  const clearAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = null;
    recording = null;
  };
  const fresh = (next: PracticeTask, prior: string | null = null) => {
    if (busy || recordingPending)
      throw new Error(
        t(
          "Wait until your answer or recording is saved.",
          "Warte, bis deine Antwort oder Aufnahme gespeichert ist.",
        ),
      );
    assertEditable();
    if (recorder?.state === "recording")
      throw new Error(
        t(
          "Stop your recording before changing the task.",
          "Beende die Aufnahme, bevor du die Aufgabe wechselst.",
        ),
      );
    if (loadDailyPlan(localStorage, language, now()).plan.paused)
      saveDailyPlan(localStorage, language, {
        ...loadDailyPlan(localStorage, language, now()).plan,
        paused: false,
      });
    if (session && !session.submittedId && (session.draft || session.audioId))
      localStorage.setItem(
        `automaticity:v2:${language}:archived-session:${id()}`,
        JSON.stringify(session),
      );
    task = next;
    unit = unitById.get(task.constructionId)!;
    clearAudio();
    session = {
      version: 2,
      taskId: task.id,
      taskVersion: task.version,
      draft: "",
      startedAt: now(),
      hintCount: 0,
      solutionRevealed: false,
      exampleSeen: false,
      selfReportedAssistance: false,
      previousAttemptId: prior,
      submittedId: null,
      audioId: null,
    };
    timer = timingEnabled ? new ResponseTimer() : null;
    timer?.visibility(!document.hidden);
    saveSession();
    const url = new URL(location.href);
    if (url.searchParams.get("task") !== task.id) {
      url.searchParams.set("task", task.id);
      history.pushState({ taskId: task.id }, "", url);
    }
    feedback.textContent = "";
    renderTask();
    renderProgress();
    renderFocus();
  };
  const raw = requestedTask
    ? localStorage.getItem(
        `${sessionKey(language)}:task:${encodeURIComponent(requestedTask.id)}`,
      )
    : localStorage.getItem(sessionKey(language));
  let resume = false;
  if (raw) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(
        t(
          "The saved session is unreadable. Its original data has been kept.",
          "Die gespeicherte Sitzung ist nicht lesbar. Die Originaldaten bleiben erhalten.",
        ),
      );
    }
    if (
      !isRecord(parsed) ||
      parsed.version !== 2 ||
      typeof parsed.taskId !== "string" ||
      typeof parsed.taskVersion !== "string" ||
      typeof parsed.draft !== "string" ||
      typeof parsed.startedAt !== "string" ||
      !Number.isFinite(Date.parse(parsed.startedAt)) ||
      !Number.isSafeInteger(parsed.hintCount) ||
      (parsed.hintCount as number) < 0 ||
      ["solutionRevealed", "exampleSeen", "selfReportedAssistance"].some(
        (key) => typeof parsed[key] !== "boolean",
      ) ||
      ["submittedId", "previousAttemptId", "audioId"].some(
        (key) => parsed[key] !== null && typeof parsed[key] !== "string",
      )
    )
      throw new Error(
        t(
          "The saved session needs recovery. Its original data has been kept.",
          "Die gespeicherte Sitzung muss wiederhergestellt werden. Die Originaldaten bleiben erhalten.",
        ),
      );
    const savedTask = taskById.get(parsed.taskId);
    if (savedTask && savedTask.version === parsed.taskVersion) {
      session = parsed as unknown as Session;
      task = savedTask;
      unit = unitById.get(task.constructionId)!;
      resume = true;
      if (session.audioId)
        recording = await readRecording(indexedDB, language, session.audioId);
    } else {
      localStorage.setItem(
        `automaticity:v2:${language}:archived-session:${id()}`,
        raw,
      );
    }
  }
  if (!requestedTask) {
    const url = new URL(location.href);
    url.searchParams.set("task", task.id);
    history.replaceState({ taskId: task.id }, "", url);
  }
  const header = element("header", undefined, "practice-header");
  const nav = element("nav");
  nav.setAttribute("aria-label", t("App navigation", "App-Navigation"));
  for (const [label, href] of [
    [t("Today", "Heute"), en ? "/daily" : "/heute"],
    [
      t("Grammar library", "Grammatikbibliothek"),
      en ? "/grammar" : "/grammatik",
    ],
    [t("Settings", "Einstellungen"), en ? "/settings" : "/einstellungen"],
  ]) {
    const link = element("a", label);
    link.href = href!;
    nav.append(link);
  }
  header.append(
    nav,
    element("p", t("English Automaticity", "DeutschFlow"), "eyebrow"),
    element(
      "h1",
      t("Use grammar in your own words", "Grammatik aktiv anwenden"),
    ),
    element(
      "p",
      t(
        "Recall it. Change it. Use it in your life. Return to it later.",
        "Abrufen. Verändern. Im Alltag verwenden. Später wiederholen.",
      ),
    ),
  );
  const levelSelect = element("select");
  levelSelect.setAttribute("aria-label", t("Practice level", "Übungsniveau"));
  for (const value of [...new Set(pack.units.map((row) => row.level))]) {
    const option = element("option", value);
    option.value = value;
    levelSelect.append(option);
  }
  levelSelect.value = level;
  levelSelect.onchange = () => {
    level = levelSelect.value;
    localStorage.setItem(settingKey, level);
    renderFocus();
  };
  const topicSelect = element("select");
  topicSelect.setAttribute("aria-label", t("Grammar topic", "Grammatikthema"));
  for (const row of pack.units) {
    const option = element("option", `${row.level} · ${row.title}`);
    option.value = row.id;
    topicSelect.append(option);
  }
  topicSelect.value = unit.id;
  topicSelect.onchange = () => {
    const selected = unitById.get(topicSelect.value)!;
    fresh(
      activePracticeTasks(selected).find(
        (row) => row.stage === "retrieve" && row.modality === "writing",
      ) ?? activePracticeTasks(selected)[0]!,
    );
  };
  controls.append(levelSelect, topicSelect);
  const timingLabel = element("label");
  const timingControl = element("input");
  timingControl.type = "checkbox";
  timingControl.checked = timingEnabled;
  timingControl.onchange = () => {
    timingEnabled = timingControl.checked;
    localStorage.setItem(timingKey, timingEnabled ? "on" : "off");
    timer = null;
  };
  timingLabel.append(
    timingControl,
    document.createTextNode(
      t(
        "Record response timing from the next task",
        "Antwortzeit ab der nächsten Aufgabe erfassen",
      ),
    ),
  );
  controls.append(timingLabel);
  const persianHelp = element("details");
  persianHelp.append(element("summary", "راهنمای فارسی"));
  const guide = element(
    "p",
    "اول بدون دیدن مثال پاسخ بده. اگر لازم شد از راهنما استفاده کن؛ این پاسخ تمرین کمکی است. بعد یک جملهٔ تازه بساز و روز دیگری دوباره تلاش کن. زمان‌سنج اختیاری است و سرعت به‌تنهایی نشانهٔ تسلط نیست.",
  );
  guide.dir = "rtl";
  guide.lang = "fa";
  persianHelp.append(guide);
  controls.append(persianHelp);
  const recordChoice = (reason: string) => {
    const selection = selectDailyFocus(
      recommendationPack(),
      ledger().progress,
      now(),
      level,
    );
    const key = `automaticity:v2:${language}:selection:${id()}`;
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        at: now(),
        language,
        policy: "baseline-3",
        reason,
        level,
        selectedTaskId: task.id,
        recommendedConstructionIds: selection.focus.map((unit) => unit.id),
      }),
    );
  };
  topicSelect.addEventListener("change", () =>
    recordChoice("learner_topic_override"),
  );
  levelSelect.addEventListener("change", () =>
    recordChoice("learner_level_preference"),
  );
  if (editing) recordChoice(resume ? "resume" : "daily_selection");
  const focusSection = element("section", undefined, "card");
  focusSection.append(
    element("h2", t("Today's focus", "Dein Fokus heute")),
    dailyPanel,
    controls,
    focusPanel,
  );
  const aside = element("div", undefined, "side-column");
  aside.append(progressPanel, historyPanel);
  const grid = element("div", undefined, "practice-grid");
  grid.append(taskPanel, aside);
  const tools = element("section", undefined, "card backup-tools");
  tools.append(
    element("h2", t("Keep your work", "Deine Arbeit sichern")),
    element(
      "p",
      t(
        "Backups include drafts, attempts, reviews, and recordings stored by this language app on this device.",
        "Sicherungen enthalten Entwürfe, Versuche, Bewertungen und Aufnahmen dieser Sprach-App auf diesem Gerät.",
      ),
    ),
  );
  const exportButton = button(
    t("Download complete backup", "Vollständige Sicherung herunterladen"),
    async () => {
      assertEditable();
      download(
        `automaticity-${language}-${now().slice(0, 10)}.json`,
        await captureCompleteBackup(persistence, language),
      );
      feedback.textContent = t(
        "Complete backup downloaded.",
        "Vollständige Sicherung heruntergeladen.",
      );
    },
  );
  const importInput = element("input");
  importInput.type = "file";
  importInput.accept = "application/json,.json";
  importInput.hidden = true;
  importInput.onchange = () => {
    void (async () => {
      assertEditable();
      const file = importInput.files?.[0];
      if (!file) return;
      const backup = await validateCompleteBackup(
        JSON.parse(await file.text()),
        language,
      );
      if (
        !confirm(
          t(
            "Close other app tabs. Replace this device's learning data with the selected backup?",
            "Schließe andere App-Tabs. Lerndaten auf diesem Gerät durch die gewählte Sicherung ersetzen?",
          ),
        )
      )
        return;
      await restoreCompleteBackup(persistence, backup, language);
      location.reload();
    })()
      .catch(writeError)
      .finally(() => {
        importInput.value = "";
      });
  };
  tools.append(
    exportButton,
    button(t("Restore backup", "Sicherung wiederherstellen"), () =>
      importInput.click(),
    ),
    importInput,
    button(
      t("Export responses for review", "Antworten zur Prüfung exportieren"),
      () => {
        const rows = ledger().attempts.filter((row) => !row.eligibleForMastery);
        download(`automaticity-${language}-review-queue.json`, {
          version: 2,
          language,
          exportedAt: now(),
          notice:
            "Contains your original writing and transcripts. Share only with a reviewer you choose. Recordings remain in the complete backup.",
          attempts: rows.map((row) => ({
            attempt: row.attempt,
            assessment: row.assessment,
            task: taskById.get(row.attempt.task.id),
          })),
        });
      },
    ),
  );
  root.replaceChildren(header, errorBox, focusSection, grid, tools);
  refreshPilot = mountSchedulerPilotPanel(
    tools,
    pack,
    localStorage,
    pilot,
    () => renderFocus(),
    (task) => fresh(task),
    () => editing,
  );
  if (!editing) {
    errorBox.textContent = t(
      "Another practice tab is open. You can view progress here; close the other tab and reload to continue.",
      "Ein weiterer Übungstab ist geöffnet. Du kannst hier den Fortschritt ansehen. Schließe den anderen Tab und lade neu, um weiterzuüben.",
    );
  }
  function renderFocus(): void {
    renderDailyPlan();
    refreshPilot();
    const selection = selectDailyFocus(
      recommendationPack(),
      ledger().progress,
      now(),
      level,
    );
    focusPanel.replaceChildren(
      element(
        "p",
        selection.reason === "due_review"
          ? t(
              "A previous pattern is due for a fresh attempt.",
              "Ein früheres Muster ist bereit für einen neuen Versuch.",
            )
          : selection.reason === "repair"
            ? t(
                "Return to a pattern that needs repair.",
                "Kehre zu einem Muster zurück, das noch Korrektur braucht.",
              )
            : t(
                "Two patterns to explore. Unchecked skills are still unknown.",
                "Zwei Muster zum Üben. Ungeprüfte Fähigkeiten sind noch unbekannt.",
              ),
      ),
    );
    for (const selected of selection.focus) {
      const recommendation = selectDailyTask(selected, ledger(), now());
      focusPanel.append(
        button(`${selected.title}`, () => {
          if (!recommendation.task)
            throw new Error(
              t(
                "No practice task is available for this mode yet. Choose another topic.",
                "Für diese Übungsart ist noch keine Aufgabe verfügbar. Wähle ein anderes Thema.",
              ),
            );
          fresh(recommendation.task, recommendation.previousAttemptId);
        }),
      );
      if (recommendation.task)
        focusPanel.append(
          element(
            "p",
            `${recommendation.task.modality === "speaking" ? t("Speaking", "Sprechen") : t("Writing", "Schreiben")} · ${recommendation.reason === "repair" ? t("Repair your earlier response", "Deine frühere Antwort korrigieren") : recommendation.reason === "due_review" ? t("Return to this pattern", "Dieses Muster wiederholen") : t("Try a fresh response", "Eine neue Antwort versuchen")}`,
            "muted",
          ),
        );
      const preparation = selected.prerequisites
        .map((id) => unitById.get(id)?.title)
        .filter(Boolean);
      if (preparation.length)
        focusPanel.append(
          element(
            "p",
            `${t("Suggested preparation", "Empfohlene Vorbereitung")}: ${preparation.join(", ")}. ${t("You can still choose any topic.", "Du kannst trotzdem jedes Thema wählen.")}`,
            "muted",
          ),
        );
    }
  }
  function renderDailyPlan(): void {
    const focusedControl = document.activeElement?.id;
    const { plan, unreadable } = loadDailyPlan(localStorage, language, now());
    const count = dailyResponseCount(
      ledger().attempts.map((row) => row.attempt),
      language,
      now(),
    );
    const goal = element("select");
    goal.id = "daily-response-goal";
    const label = element(
      "label",
      t("Today's response goal", "Dein Antwortziel heute"),
    );
    label.htmlFor = goal.id;
    for (const value of RESPONSE_GOALS) {
      const option = element("option", String(value));
      option.value = String(value);
      goal.append(option);
    }
    goal.value = String(plan.responseGoal);
    goal.disabled = !editing;
    goal.onchange = () => {
      try {
        assertEditable();
        saveDailyPlan(localStorage, language, {
          ...loadDailyPlan(localStorage, language, now()).plan,
          responseGoal: Number(goal.value) as DailyPracticePlan["responseGoal"],
        });
        renderDailyPlan();
      } catch (error) {
        goal.value = String(plan.responseGoal);
        writeError(error);
      }
    };
    const status = element(
      "p",
      `${count} / ${plan.responseGoal} ${t("responses saved today", "Antworten heute gespeichert")}`,
    );
    status.setAttribute("role", "status");
    status.dataset.dailyResponses = String(count);
    const pause = button(
      plan.paused
        ? t("Resume practice", "Weiterüben")
        : t("Finish for now", "Für heute pausieren"),
      () => {
        assertEditable();
        if (busy || recordingPending || recorder?.state === "recording")
          throw new Error(
            t(
              "Stop your recording and wait for it to save before pausing.",
              "Beende die Aufnahme und warte, bis sie gespeichert ist, bevor du pausierst.",
            ),
          );
        saveSession();
        const current = loadDailyPlan(localStorage, language, now()).plan;
        saveDailyPlan(localStorage, language, {
          ...current,
          paused: !current.paused,
        });
        // An interrupted response has no trustworthy continuous latency.
        timer = null;
        renderTask();
        renderDailyPlan();
      },
    );
    pause.disabled = !editing;
    pause.id = "daily-practice-toggle";
    dailyPanel.replaceChildren(
      label,
      goal,
      status,
      element(
        "p",
        t(
          "This counts practice effort, including help and repairs. It does not measure mastery.",
          "Hier zählt dein Übungsaufwand, auch mit Hilfe und Korrekturen. Das ist kein Nachweis für sichere Beherrschung.",
        ),
      ),
      pause,
    );
    if (count >= plan.responseGoal && !plan.paused)
      dailyPanel.append(
        element(
          "p",
          t(
            "Today's goal is reached. Finish here or keep practising when you feel ready.",
            "Dein Tagesziel ist erreicht. Du kannst hier aufhören oder weiterüben, wenn du möchtest.",
          ),
        ),
      );
    if (unreadable)
      dailyPanel.append(
        element(
          "p",
          t(
            "Your saved daily goal could not be read. Its original data is kept; a goal of 3 is shown for now.",
            "Dein gespeichertes Tagesziel ist nicht lesbar. Die Originaldaten bleiben erhalten; vorläufig wird ein Ziel von 3 angezeigt.",
          ),
        ),
      );
    if (focusedControl === goal.id) goal.focus();
    else if (focusedControl === pause.id) pause.focus();
  }
  function expose(kind: "example" | "hint" | "solution"): void {
    assertEditable();
    appendAutomaticityEvent(localStorage, {
      version: 2,
      type: "exposure",
      id: id(),
      language,
      at: now(),
      constructionId: unit.id,
      taskId: task.id,
      itemFamily: task.itemFamily,
      kind,
    });
    if (kind === "example") session.exampleSeen = true;
    else if (kind === "hint") session.hintCount++;
    else session.solutionRevealed = true;
    saveSession();
  }
  function renderProgress(): void {
    const reduced = ledger(),
      rows = reduced.progress.filter((row) => row.constructionId === unit.id);
    progressPanel.replaceChildren(
      element(
        "h2",
        t("Evidence for this pattern", "Nachweise für dieses Muster"),
      ),
    );
    for (const modality of ["writing", "speaking"] as const) {
      const row = rows.find((value) => value.modality === modality);
      const group = element("div", undefined, "metric");
      group.append(
        element(
          "h3",
          modality === "writing"
            ? t("Writing", "Schreiben")
            : t("Speaking", "Sprechen"),
        ),
        element(
          "p",
          `${row?.attempts ?? 0} ${t("attempts", "Versuche")} · ${row?.assessed ?? 0} ${t("practice checks", "Übungsprüfungen")}`,
        ),
        element(
          "p",
          row?.accuracy !== null && row?.accuracy !== undefined
            ? `${Math.round(row.accuracy * 100)}% ${t("independent accuracy", "unabhängige Genauigkeit")}`
            : t(
                "Independent accuracy: not yet established",
                "Unabhängige Genauigkeit: noch nicht belegt",
              ),
        ),
        element(
          "p",
          `${row?.delayedSuccesses ?? 0} ${t("delayed checks", "verzögerte Prüfungen")} · ${row?.novelSuccesses ?? 0} ${t("new-context checks", "Prüfungen in neuem Kontext")}`,
        ),
      );
      progressPanel.append(group);
    }
    progressPanel.append(
      element(
        "p",
        t(
          "Practice results stay separate from reviewed evidence. A fast answer alone does not establish automaticity.",
          "Übungsergebnisse bleiben von geprüften Nachweisen getrennt. Eine schnelle Antwort allein belegt noch keine Automatisierung.",
        ),
        "muted",
      ),
    );
    const rowsForUnit = reduced.attempts
      .filter((row) => row.attempt.task.constructionId === unit.id)
      .slice(-5)
      .reverse();
    historyPanel.replaceChildren(
      element("h2", t("Recent attempts", "Letzte Versuche")),
    );
    const drafts = element("details");
    drafts.append(
      element(
        "summary",
        t("Earlier unfinished drafts", "Frühere unvollständige Entwürfe"),
      ),
    );
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(`automaticity:v2:${language}:archived-session:`))
        continue;
      try {
        const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
        if (
          isRecord(saved) &&
          typeof saved.draft === "string" &&
          typeof saved.taskId === "string"
        ) {
          const entry = element("details");
          entry.append(
            element(
              "summary",
              unitById.get(taskById.get(saved.taskId)?.constructionId ?? "")
                ?.title ?? saved.taskId,
            ),
            element("p", saved.draft, "response-copy"),
          );
          if (typeof saved.audioId === "string")
            entry.append(
              element(
                "p",
                t(
                  "Recording included in your complete backup.",
                  "Die Aufnahme ist in deiner vollständigen Sicherung enthalten.",
                ),
              ),
            );
          drafts.append(entry);
        }
      } catch {
        /* Preserve unreadable drafts for complete export. */
      }
    }
    historyPanel.append(drafts);
    if (!rowsForUnit.length)
      historyPanel.append(
        element(
          "p",
          t(
            "Your own responses will appear here.",
            "Deine eigenen Antworten erscheinen hier.",
          ),
        ),
      );
    for (const row of rowsForUnit) {
      const entry = element("details");
      const verdictLabel =
        row.assessment?.verdict === "pass"
          ? t("Practice checked", "Übung geprüft")
          : row.assessment?.verdict === "needs_repair"
            ? t("Needs a repair", "Korrektur nötig")
            : row.assessment?.verdict === "target_not_observed"
              ? t("Target not observed", "Zielstruktur nicht beobachtet")
              : t("Awaiting review", "Prüfung ausstehend");
      entry.append(
        element(
          "summary",
          `${new Date(row.attempt.at).toLocaleString(language)} · ${row.attempt.task.modality === "writing" ? t("Writing", "Schreiben") : t("Speaking", "Sprechen")} · ${verdictLabel}`,
        ),
        element("p", row.attempt.response.text, "response-copy"),
        element(
          "p",
          row.assessment?.feedback ??
            t("Awaiting review", "Prüfung ausstehend"),
        ),
      );
      if (row.attempt.audio)
        entry.append(
          button(
            t("Play saved recording", "Gespeicherte Aufnahme abspielen"),
            async () => {
              const saved = await readRecording(
                indexedDB,
                language,
                row.attempt.audio!.id,
              );
              if (
                !saved ||
                (await sha256(await saved.blob.arrayBuffer())) !==
                  row.attempt.audio!.sha256
              )
                throw new Error(
                  t(
                    "The original recording is unavailable.",
                    "Die Originalaufnahme ist nicht verfügbar.",
                  ),
                );
              const player = element("audio");
              player.controls = true;
              const url = URL.createObjectURL(saved.blob);
              player.src = url;
              player.onended = () => URL.revokeObjectURL(url);
              entry.append(player);
              await player.play();
            },
          ),
        );
      historyPanel.append(entry);
    }
  }
  function renderTask(): void {
    const activeTasks = activePracticeTasks(unit);
    const retirement = unit.retiredTasks?.find((row) => row.taskId === task.id);
    topicSelect.value = unit.id;
    taskPanel.replaceChildren(
      element(
        "p",
        `${unit.level} · ${unit.familyIds.map((family) => GRAMMAR_FAMILIES.find((row) => row[0] === family)?.[en ? 1 : 2] ?? family).join(" · ")}`,
        "eyebrow",
      ),
      element("h2", unit.title),
    );
    if (
      !retirement &&
      loadDailyPlan(localStorage, language, now()).plan.paused
    ) {
      taskPanel.append(
        element(
          "p",
          t(
            "Paused for now. Your draft is saved. Choose Resume practice above to continue.",
            "Du machst gerade Pause. Dein Entwurf ist gespeichert. Wähle oben Weiterüben, um fortzufahren.",
          ),
        ),
      );
      return;
    }
    const stageNames = en
      ? [
          "Notice",
          "Recall",
          "Vary",
          "Produce",
          "Repair",
          "Transfer",
          "Return later",
        ]
      : [
          "Erkennen",
          "Abrufen",
          "Variieren",
          "Produzieren",
          "Korrigieren",
          "Übertragen",
          "Später abrufen",
        ];
    const requestedRepair = repairRequestId
      ? ledger().attempts.find(
          (row) =>
            row.attempt.id === repairRequestId &&
            row.attempt.task.constructionId === unit.id,
        )
      : undefined;
    if (
      requestedRepair &&
      session.previousAttemptId !== requestedRepair.attempt.id
    ) {
      const sourceTask = taskById.get(requestedRepair.attempt.task.id);
      if (sourceTask && activeTasks.some((row) => row.id === sourceTask.id))
        taskPanel.append(
          button(
            t(
              "Start a repair of this response",
              "Korrektur dieser Antwort beginnen",
            ),
            () => fresh(sourceTask, requestedRepair.attempt.id),
          ),
        );
    }
    const stageNav = element("div", undefined, "stage-nav");
    stageNav.setAttribute("aria-label", t("Learning cycle", "Lernzyklus"));
    stages.forEach((stage, index) => {
      const available =
        activeTasks.find(
          (row) => row.stage === stage && row.modality === task.modality,
        ) ?? activeTasks.find((row) => row.stage === stage);
      if (!available) return;
      const btn = button(
        stageNames[index]!,
        () => fresh(available),
        task.stage === stage ? "selected" : "",
      );
      btn.setAttribute("aria-pressed", String(task.stage === stage));
      stageNav.append(btn);
    });
    taskPanel.append(stageNav);
    const modalityNav = element("div", undefined, "toolbar");
    for (const mode of ["writing", "speaking"] as Modality[]) {
      const other = activeTasks.find(
        (row) => row.stage === task.stage && row.modality === mode,
      );
      if (other)
        modalityNav.append(
          button(
            mode === "writing"
              ? t("Write", "Schreiben")
              : t("Speak", "Sprechen"),
            () => fresh(other),
            mode === task.modality ? "selected" : "",
          ),
        );
    }
    taskPanel.append(modalityNav);
    const prompt = element("p", task.prompt, "task-prompt");
    prompt.id = "practice-prompt";
    taskPanel.append(prompt);
    if (retirement) {
      const message = element(
        "p",
        t(
          "This exercise has been replaced because its prompt did not reliably test the intended grammar. Your earlier work is kept below.",
          "Diese Übung wurde ersetzt, weil ihre Aufgabenstellung die vorgesehene Grammatik nicht zuverlässig geprüft hat. Deine bisherige Arbeit bleibt unten erhalten.",
        ),
      );
      message.setAttribute("role", "status");
      const saved = element("textarea");
      saved.value = session.draft;
      saved.rows = 5;
      saved.readOnly = true;
      saved.setAttribute(
        "aria-label",
        t("Archived response", "Archivierte Antwort"),
      );
      taskPanel.append(message, saved);
      if (recording) {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        audioUrl = URL.createObjectURL(recording.blob);
        const audio = element("audio");
        audio.controls = true;
        audio.src = audioUrl;
        taskPanel.append(audio);
      }
      const replacement = taskById.get(retirement.replacementTaskId)!;
      taskPanel.append(
        button(t("Open replacement exercise", "Neue Übung öffnen"), () =>
          fresh(replacement),
        ),
      );
      return;
    }
    if (task.stage === "retain")
      taskPanel.append(
        element(
          "p",
          t(
            "Opening this stage does not prove delayed recall. The app checks the time since your last practice or exposure.",
            "Das Öffnen dieser Stufe belegt keinen verzögerten Abruf. Die App prüft den Abstand zur letzten Übung oder Hilfestellung.",
          ),
          "muted",
        ),
      );
    const reference = element("div", undefined, "reference");
    const showExamples = () => {
      reference.replaceChildren(element("p", unit.rule));
      for (const example of unit.examples)
        reference.append(element("p", example));
    };
    const showHint = () => {
      reference.replaceChildren(
        element(
          "p",
          task.hints[
            Math.min(Math.max(session.hintCount - 1, 0), task.hints.length - 1)
          ] ?? unit.rule,
        ),
      );
    };
    const help = element("div", undefined, "toolbar");
    help.append(
      button(
        t("Read explanation and examples", "Erklärung und Beispiele lesen"),
        () => {
          expose("example");
          showExamples();
        },
      ),
      button(t("Show a hint", "Hinweis anzeigen"), () => {
        expose("hint");
        showHint();
      }),
    );
    if (task.solution)
      help.append(
        button(t("Reveal a model", "Musterlösung zeigen"), () => {
          expose("solution");
          reference.replaceChildren(element("p", task.solution!));
        }),
      );
    taskPanel.append(help, reference);
    if (session.solutionRevealed && task.solution)
      reference.append(element("p", task.solution));
    else if (session.exampleSeen) showExamples();
    else if (session.hintCount) showHint();
    const form = element("form");
    const label = element(
      "label",
      task.modality === "writing"
        ? t("Your response", "Deine Antwort")
        : t("Transcript of your recording", "Transkript deiner Aufnahme"),
    );
    label.htmlFor = "practice-response";
    const answer = element("textarea");
    answer.id = "practice-response";
    answer.value = session.draft;
    answer.rows = 5;
    answer.maxLength = 100000;
    answer.spellcheck = false;
    answer.autocomplete = "off";
    answer.setAttribute("aria-describedby", "practice-prompt");
    answer.disabled = !!session.submittedId || !editing;
    answer.addEventListener("input", () => {
      try {
        timer?.input();
        session.draft = answer.value;
        saveSession();
      } catch (error) {
        writeError(error);
      }
    });
    if (task.modality === "speaking") {
      const media = element("div", undefined, "recording");
      const audio = element("audio");
      audio.controls = true;
      const drawAudio = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        if (recording) {
          audioUrl = URL.createObjectURL(recording.blob);
          audio.src = audioUrl;
          media.append(audio);
        }
      };
      const recordButton = button(
        t("Start recording", "Aufnahme starten"),
        async () => {
          assertEditable();
          if (session.submittedId || busy || recordingPending) return;
          if (recorder?.state === "recording") {
            recorder.stop();
            return;
          }
          if (
            !navigator.mediaDevices?.getUserMedia ||
            typeof MediaRecorder === "undefined"
          )
            throw new Error(
              t(
                "Recording is unavailable in this browser. Writing practice is still available.",
                "Aufnahmen sind in diesem Browser nicht verfügbar. Du kannst weiterhin schriftlich üben.",
              ),
            );
          recordingPending = true;
          recordButton.disabled = true;
          try {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
              });
            } catch {
              throw new Error(
                t(
                  "The microphone is unavailable or permission was denied. Your draft is kept. Allow microphone access or continue with writing.",
                  "Das Mikrofon ist nicht verfügbar oder der Zugriff wurde abgelehnt. Dein Entwurf bleibt erhalten. Erlaube den Mikrofonzugriff oder übe schriftlich weiter.",
                ),
              );
            }
            const parts: Blob[] = [];
            recorder = new MediaRecorder(stream);
            recordingStart = performance.now();
            recorder.ondataavailable = (event) => {
              if (event.data.size) parts.push(event.data);
            };
            recorder.onerror = () => {
              stream?.getTracks().forEach((track) => track.stop());
              recordButton.textContent = t(
                "Start recording",
                "Aufnahme starten",
              );
              writeError(
                t(
                  "Recording failed. Please try again.",
                  "Die Aufnahme ist fehlgeschlagen. Bitte versuche es erneut.",
                ),
              );
            };
            recorder.onstop = () => {
              recordingPending = true;
              const mime = recorder?.mimeType ?? "audio/webm";
              stream?.getTracks().forEach((track) => track.stop());
              stream = null;
              recordButton.textContent = t("Record again", "Erneut aufnehmen");
              recordButton.disabled = true;
              void (async () => {
                recording = await storeRecording(indexedDB, {
                  id: id(),
                  language,
                  taskId: task.id,
                  createdAt: now(),
                  durationMs: Math.round(performance.now() - recordingStart),
                  blob: new Blob(parts, { type: mime }),
                });
                session.audioId = recording.id;
                saveSession();
                drawAudio();
                feedback.textContent = t(
                  "Recording saved. Listen and add a transcript. Speech quality needs a separate review.",
                  "Aufnahme gespeichert. Höre sie an und ergänze ein Transkript. Die Sprachqualität benötigt eine eigene Prüfung.",
                );
              })()
                .catch(writeError)
                .finally(() => {
                  recordingPending = false;
                  recordButton.disabled = false;
                });
            };
            recorder.start();
            recordButton.textContent = t("Stop recording", "Aufnahme beenden");
          } catch (error) {
            stream?.getTracks().forEach((track) => track.stop());
            stream = null;
            recorder = null;
            throw error;
          } finally {
            recordingPending = false;
            recordButton.disabled = false;
          }
        },
      );
      recordButton.disabled = !!session.submittedId || !editing;
      media.append(recordButton);
      drawAudio();
      form.append(
        media,
        element(
          "p",
          t(
            "Your voice stays on this device. A typed transcript does not verify pronunciation or fluent speech.",
            "Deine Stimme bleibt auf diesem Gerät. Ein getipptes Transkript bestätigt weder Aussprache noch flüssiges Sprechen.",
          ),
          "muted",
        ),
      );
    }
    form.append(label, answer);
    const assistance = element("label", undefined, "check-label"),
      checkbox = element("input");
    checkbox.type = "checkbox";
    checkbox.checked = session.selfReportedAssistance;
    checkbox.disabled = !!session.submittedId || !editing;
    checkbox.onchange = () => {
      session.selfReportedAssistance = checkbox.checked;
      try {
        saveSession();
      } catch (error) {
        writeError(error);
      }
    };
    assistance.append(
      checkbox,
      document.createTextNode(
        t(
          "I used another source, translator, or suggested wording",
          "Ich habe eine andere Quelle, Übersetzung oder Formulierungshilfe verwendet",
        ),
      ),
    );
    form.append(assistance);
    const submit = element(
      "button",
      t("Save and check", "Speichern und prüfen"),
      "primary",
    );
    submit.type = "submit";
    submit.disabled = !!session.submittedId || !editing;
    form.append(submit);
    form.onsubmit = (event) => {
      event.preventDefault();
      void (async () => {
        assertEditable();
        if (busy || session.submittedId) return;
        if (!answer.value.trim())
          throw new Error(
            t(
              "Write your own response first.",
              "Schreibe zuerst deine eigene Antwort.",
            ),
          );
        if (recorder?.state === "recording" || recordingPending)
          throw new Error(
            t(
              "Stop your recording and wait for it to save.",
              "Beende die Aufnahme und warte, bis sie gespeichert ist.",
            ),
          );
        busy = true;
        submit.disabled = true;
        const value = answer.value;
        const hash = await sha256(value);
        const capturedAt = now();
        const attempt: AttemptEvent = {
          version: 2,
          type: "attempt",
          id: id(),
          language,
          at: capturedAt,
          task: {
            definitionSha256: await sha256(JSON.stringify(task)),
            id: task.id,
            version: task.version,
            constructionId: task.constructionId,
            familyId: task.familyId,
            itemFamily: task.itemFamily,
            contextId: task.contextId,
            rubricVersion: task.rubricVersion,
            stage: task.stage,
            modality: task.modality,
            partition: task.partition,
            transferCondition: task.transferCondition,
            contentReview: task.contentReview,
          },
          response: {
            text: value,
            sha256: hash,
            originalTranscriptSha256: null,
            transcriptEdited: false,
          },
          timing: {
            startedAt: session.startedAt,
            ...(timer
              ? { ...timer.read(), source: "monotonic_visible" as const }
              : {
                  activeMs: null,
                  firstInputMs: null,
                  source: "unavailable" as const,
                }),
          },
          assistance: {
            hintCount: session.hintCount,
            solutionRevealed: session.solutionRevealed,
            exampleSeen: session.exampleSeen,
            selfReportedAssistance: session.selfReportedAssistance,
          },
          audio: recording
            ? {
                id: recording.id,
                sha256: recording.sha256,
                bytes: recording.blob.size,
                durationMs: recording.durationMs,
                mime: recording.blob.type,
                persisted: true,
              }
            : null,
          previousAttemptId: session.previousAttemptId,
        };
        appendAutomaticityEvent(localStorage, attempt);
        session.submittedId = attempt.id;
        saveSession();
        const assessment = assessControlledTask(attempt, task, now(), id());
        const applyFeedback = async (proposal: typeof assessment) => {
          const history = await collectAssessmentFeedback(
            readAutomaticityEvents(localStorage, language).events,
            pack,
            now(),
          );
          const guarded = await guardAssessmentWithFeedback(
            attempt,
            task,
            proposal,
            history,
            now(),
            id(),
          );
          persistFeedbackAssessment(localStorage, proposal, guarded);
          return guarded;
        };
        const guarded = await applyFeedback(assessment);
        feedback.textContent = (guarded ?? assessment).feedback;
        if (
          !guarded &&
          (typeof navigator === "undefined" || navigator.onLine !== false)
        ) {
          const modelAssessment = await qualifiedTransformer(
            attempt,
            assessment,
          );
          if (modelAssessment) {
            const modelGuard = await applyFeedback(modelAssessment);
            feedback.textContent = (modelGuard ?? modelAssessment).feedback;
          }
        }
        renderTask();
        renderProgress();
        renderFocus();
      })()
        .catch(writeError)
        .finally(() => {
          busy = false;
          submit.disabled = !!session.submittedId || !editing;
          try {
            refreshReviews();
          } catch (error) {
            writeError(error);
          }
        });
    };
    taskPanel.append(form, feedback);
    if (session.submittedId) {
      const saved = ledger().attempts.find(
        (row) => row.attempt.id === session.submittedId,
      );
      feedback.textContent =
        saved?.assessment?.feedback ??
        t(
          "Saved. The check was interrupted; this response has no assessment yet.",
          "Gespeichert. Die Prüfung wurde unterbrochen; diese Antwort hat noch keine Bewertung.",
        );
      taskPanel.append(
        button(
          t("Try again as a repair", "Als Korrektur erneut versuchen"),
          () => fresh(task, session.submittedId),
        ),
      );
    }
    const current = activeTasks.findIndex((row) => row.id === task.id),
      next =
        activeTasks
          .slice(current + 1)
          .find((row) => row.modality === task.modality) ??
        activeTasks.find((row) => row.modality === task.modality)!;
    taskPanel.append(
      button(t("Next task", "Nächste Aufgabe"), () => fresh(next)),
    );
  }
  document.addEventListener("visibilitychange", () =>
    timer?.visibility(!document.hidden),
  );
  window.addEventListener("storage", (event) => {
    if (
      event.key?.startsWith(`automaticity:v2:${language}:event:`) ||
      event.key?.startsWith(`automaticity:v2:${language}:scheduler-pilot:`)
    ) {
      renderProgress();
      renderFocus();
    }
  });
  window.addEventListener("pagehide", () => {
    stream?.getTracks().forEach((track) => track.stop());
    lockRelease?.();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  });
  window.addEventListener("popstate", () => {
    if (editing) saveSession();
    location.reload();
  });
  window.addEventListener("beforeunload", (event) => {
    if (recorder?.state === "recording" || recordingPending || busy) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  if (resume) {
    renderTask();
    renderProgress();
    feedback.textContent = t(
      "Your draft was restored. Timing is unavailable for this interrupted attempt.",
      "Dein Entwurf wurde wiederhergestellt. Für diesen unterbrochenen Versuch ist keine Zeitmessung verfügbar.",
    );
  } else if (editing) {
    const recommendation = selectDailyTask(unit, ledger(), now());
    fresh(
      task,
      recommendation.task?.id === task.id
        ? recommendation.previousAttemptId
        : null,
    );
  } else {
    session = {
      version: 2,
      taskId: task.id,
      taskVersion: task.version,
      draft: "",
      startedAt: now(),
      hintCount: 0,
      solutionRevealed: false,
      exampleSeen: false,
      selfReportedAssistance: false,
      previousAttemptId: null,
      submittedId: null,
      audioId: null,
    };
    renderTask();
    renderProgress();
  }
  renderFocus();
  const reviews = element("section", undefined, "card");
  root.append(reviews);
  const refreshReviews = mountReviewPanel(
    reviews,
    language,
    pack,
    () => {
      renderTask();
      renderProgress();
      renderFocus();
    },
    editing,
  );
  if ("serviceWorker" in navigator)
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Practice remains usable; offline readiness is checked separately. */
    });
}
