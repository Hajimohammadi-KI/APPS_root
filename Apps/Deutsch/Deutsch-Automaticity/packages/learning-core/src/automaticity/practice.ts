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
import { RecordingCapture } from "./recording-capture";
import { requestMicrophone } from "./microphone-request";
import { responseExposure } from "./response-exposure";
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
import {
  selectDailyFocus,
  selectDailyTask,
  selectNextLearningTask,
  shouldResumeSavedPractice,
  repairTaskForAttempt,
} from "./selector";
import {
  hasUnfinishedPractice,
  parseSavedPracticeSession,
  preparePracticeSession,
  type PracticeSession as Session,
} from "./practice-session";
import {
  loadDailyPlan,
  saveDailyPlan,
  dailyResponseCount,
  RESPONSE_GOALS,
  type DailyPracticePlan,
} from "./daily-plan";
import { syncLegacyPractice } from "./legacy";
import { promptTextParts } from "./prompt-text";
import { disablePracticeControls } from "./practice-controls";
import { LEARNING_TARGET, learningTarget } from "./learning-target";
import {
  grammarFeedbackAssessment,
  parseGrammarFeedback,
} from "./grammar-feedback";
import {
  loadSchedulerPilot,
  mountSchedulerPilotPanel,
} from "./scheduler-pilot-panel";
import {
  outsidePilotPack,
  schedulerPilotCards,
  readPilotEnrollment,
} from "./scheduler-pilot";

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
  const requested = new URLSearchParams(location.search);
  let level =
    requested.get("level") ?? localStorage.getItem(settingKey) ?? "A1";
  if (!pack.units.some((row) => row.level === level)) level = "A1";
  const timingKey = `automaticity:v2:${language}:timing`;
  let timingEnabled = localStorage.getItem(timingKey) !== "off";
  const repairRequestId = requested.get("repairOf");
  const requestedUnit = pack.units.find(
    (row) =>
      row.title === requested.get("topic") &&
      (!requested.get("level") || row.level === requested.get("level")),
  );
  const initialState = reduceAutomaticityEvents(
    readAutomaticityEvents(localStorage, language).events,
    language,
    now(),
  );
  const initialChoice = requestedUnit
    ? {
        unit: requestedUnit,
        ...selectDailyTask(requestedUnit, initialState, now()),
      }
    : selectNextLearningTask(recommendationPack(), initialState, now(), level);
  let unit: ConstructionUnit =
    initialChoice?.unit ?? requestedUnit ?? pack.units[0]!;
  let task: PracticeTask =
    initialChoice?.task ??
    selectDailyTask(unit, initialState, now()).task ??
    activePracticeTasks(unit).find(
      (row) =>
        row.stage === "retrieve" &&
        row.modality === "writing" &&
        row.partition === "practice",
    ) ??
    activePracticeTasks(unit).find((row) => row.partition === "practice")!;
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
  let stopRecording: (() => void) | null = null;
  let microphoneRequest: AbortController | null = null;
  let busy = false,
    recordingPending = false;
  let lockRelease: (() => void) | null = null;
  let editing = true;
  const feedback = element("div", "", "feedback");
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  const errorBox = element("p", "", "error");
  errorBox.id = "practice-error";
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
  const readSavedSession = (raw: string | null): Session | null => {
    try {
      return parseSavedPracticeSession(raw);
    } catch (error) {
      throw new Error(
        error instanceof Error && error.message === "unreadable_session"
          ? t(
              "The saved session is unreadable. Its original data has been kept.",
              "Die gespeicherte Sitzung ist nicht lesbar. Die Originaldaten bleiben erhalten.",
            )
          : t(
              "The saved session needs recovery. Its original data has been kept.",
              "Die gespeicherte Sitzung muss wiederhergestellt werden. Die Originaldaten bleiben erhalten.",
            ),
      );
    }
  };
  const archiveSession = (saved: Session) => {
    localStorage.setItem(
      `automaticity:v2:${language}:archived-session:${id()}`,
      JSON.stringify(saved),
    );
  };
  const fresh = async (
    next: PracticeTask,
    prior: string | null = null,
  ): Promise<void> => {
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
    const prepared = preparePracticeSession(
      next,
      readSavedSession(
        localStorage.getItem(
          `${sessionKey(language)}:task:${encodeURIComponent(next.id)}`,
        ),
      ),
      now(),
      prior,
    );
    busy = true;
    try {
      const restoredRecording = prepared.session.audioId
        ? await readRecording(indexedDB, language, prepared.session.audioId)
        : null;
      if (prepared.session.audioId && !restoredRecording)
        throw new Error(
          t(
            "The saved recording is unavailable. Your original draft is kept.",
            "Die gespeicherte Aufnahme ist nicht verfügbar. Dein ursprünglicher Entwurf bleibt erhalten.",
          ),
        );
      if (loadDailyPlan(localStorage, language, now()).plan.paused)
        saveDailyPlan(localStorage, language, {
          ...loadDailyPlan(localStorage, language, now()).plan,
          paused: false,
        });
      if (
        session &&
        hasUnfinishedPractice(session) &&
        (session.taskId !== next.id || !prepared.resumed)
      )
        archiveSession(session);
      if (
        prepared.archive &&
        (!session ||
          JSON.stringify(prepared.archive) !== JSON.stringify(session))
      )
        archiveSession(prepared.archive);
      task = next;
      unit = unitById.get(task.constructionId)!;
      level = unit.level;
      levelSelect.value = level;
      clearAudio();
      recording = restoredRecording;
      session = prepared.session;
      timer = timingEnabled && !prepared.resumed ? new ResponseTimer() : null;
      timer?.visibility(!document.hidden);
      saveSession();
      const url = new URL(location.href);
      url.searchParams.set("task", task.id);
      url.searchParams.set("topic", unit.title);
      url.searchParams.set("level", unit.level);
      if (session.previousAttemptId)
        url.searchParams.set("repairOf", session.previousAttemptId);
      else url.searchParams.delete("repairOf");
      url.searchParams.delete("review");
      url.searchParams.delete("attempt");
      if (url.href !== location.href) {
        history.pushState({ taskId: task.id }, "", url);
      }
      feedback.textContent = "";
      errorBox.textContent = "";
      renderTask();
      renderProgress();
      renderFocus();
      if (prepared.resumed)
        feedback.textContent = t(
          "Your saved answer and help history were restored. Timing is unavailable for this interrupted attempt.",
          "Deine gespeicherte Antwort und bisherige Hilfen wurden wiederhergestellt. Für diesen unterbrochenen Versuch ist keine Zeitmessung verfügbar.",
        );
    } finally {
      busy = false;
    }
  };
  const contextTask = requestedTask ?? (requestedUnit ? task : null);
  const raw = contextTask
    ? localStorage.getItem(
        `${sessionKey(language)}:task:${encodeURIComponent(contextTask.id)}`,
      )
    : localStorage.getItem(sessionKey(language));
  let resume: Session | null = null;
  let advancedFromCompleted = false;
  if (raw) {
    const savedSession = readSavedSession(raw)!;
    const savedTask = taskById.get(savedSession.taskId);
    if (savedTask && savedTask.version === savedSession.taskVersion) {
      if (
        shouldResumeSavedPractice(
          savedSession,
          requestedTask
            ? "explicit_task"
            : requested.has("review")
              ? "review"
              : "general",
          loadDailyPlan(localStorage, language, now()).plan.paused,
        )
      ) {
        session = savedSession;
        task = savedTask;
        unit = unitById.get(task.constructionId)!;
        resume = savedSession;
        if (session.audioId)
          recording = await readRecording(indexedDB, language, session.audioId);
      } else {
        advancedFromCompleted = !!savedSession.submittedId;
        if (!requestedUnit) {
          const savedUnit = unitById.get(savedTask.constructionId)!;
          const preferred =
            requested.has("level") && level !== savedUnit.level
              ? undefined
              : savedUnit.id;
          const next = selectNextLearningTask(
            recommendationPack(),
            ledger(),
            now(),
            requested.has("level") ? level : savedUnit.level,
            preferred,
          );
          if (next?.task) {
            unit = next.unit;
            task = next.task;
          }
        }
      }
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
    url.searchParams.set("topic", unit.title);
    url.searchParams.set("level", unit.level);
    history.replaceState({ taskId: task.id }, "", url);
  }
  level = unit.level;
  const header = element("header", undefined, "practice-header");
  const nav = element("nav");
  nav.setAttribute("aria-label", t("App navigation", "App-Navigation"));
  for (const [label, href] of [
    [t("Home", "Start"), "/"],
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
    void fresh(
      activePracticeTasks(selected).find(
        (row) => row.stage === "retrieve" && row.modality === "writing",
      ) ?? activePracticeTasks(selected)[0]!,
    ).catch(writeError);
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
    "اول بدون دیدن مثال پاسخ بده. اگر لازم شد از راهنما استفاده کن؛ این پاسخ تمرین کمکی است. بعد یک جملهٔ تازه بساز و روز دیگری دوباره تلاش کن. هدف برای هر مبحث و هر یک از نوشتن و گفتن جداست: دست‌کم ۱۸ پاسخ صحیح از ۲۰ پاسخ مستقل با ارزیابی معتبر، مرور موفق در دو روز جدا و کاربرد در دو موقعیت تازه بدون نام‌بردن قاعده در سؤال. خطای حل‌نشده باید اصلاح شود. این معیار تمرینی، تضمین روانی یا خودکارشدن گفتار نیست؛ سرعت تایپ هم روانی گفتار را ثابت نمی‌کند.",
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
  const focusSection = element("details", undefined, "card practice-options");
  focusSection.open = loadDailyPlan(localStorage, language, now()).plan.paused;
  focusSection.append(
    element(
      "summary",
      t("My plan & practice options", "Mein Plan & Übungseinstellungen"),
    ),
    dailyPanel,
    controls,
    focusPanel,
  );
  const aside = element("div", undefined, "side-column");
  const evidenceDisclosure = element(
    "details",
    undefined,
    "card practice-disclosure",
  );
  evidenceDisclosure.append(
    element(
      "summary",
      t("Progress for this topic", "Fortschritt zu diesem Thema"),
    ),
    progressPanel,
  );
  const historyDisclosure = element(
    "details",
    undefined,
    "card practice-disclosure",
  );
  historyDisclosure.append(
    element("summary", t("My recent responses", "Meine letzten Antworten")),
    historyPanel,
  );
  aside.append(
    element(
      "p",
      t(
        "One response at a time. Your work is saved on this device.",
        "Eine Antwort nach der anderen. Deine Arbeit bleibt auf diesem Gerät.",
      ),
      "practice-side-note",
    ),
    evidenceDisclosure,
    historyDisclosure,
  );
  const grid = element("div", undefined, "practice-grid");
  grid.append(taskPanel, aside);
  const tools = element(
    "details",
    undefined,
    "card backup-tools practice-disclosure",
  );
  tools.id = "backup-tools";
  tools.append(
    element(
      "summary",
      t("Backup & transfer my work", "Meine Arbeit sichern & übertragen"),
    ),
    element(
      "p",
      t(
        "Backups include drafts, attempts, reviews, and recordings stored by this language app on this device.",
        "Sicherungen enthalten Entwürfe, Versuche, Bewertungen und Aufnahmen dieser Sprach-App auf diesem Gerät.",
      ),
    ),
  );
  const transferGuide = element("details");
  transferGuide.append(
    element(
      "summary",
      t(
        "Continue on a phone or tablet",
        "Auf dem Handy oder Tablet weiterlernen",
      ),
    ),
  );
  transferGuide.append(
    element(
      "p",
      t(
        "Your work stays in this browser. The same link on another device does not automatically transfer your progress.",
        "Deine Arbeit bleibt in diesem Browser. Derselbe Link auf einem anderen Gerät überträgt deinen Fortschritt nicht automatisch.",
      ),
    ),
  );
  const transferSteps = element("ol");
  for (const [english, german] of [
    [
      "Download a complete backup here and keep the file somewhere you can access on the other device.",
      "Lade hier eine vollständige Sicherung herunter und bewahre die Datei so auf, dass du sie auf dem anderen Gerät öffnen kannst.",
    ],
    [
      "Open this same language app on the other device. Download a backup there too if it already has work you want to keep.",
      "Öffne dieselbe Sprach-App auf dem anderen Gerät. Sichere dort zuerst vorhandene Arbeit, die du behalten möchtest.",
    ],
    [
      "Under Keep your work, choose Restore backup and select the transferred file. Restoration replaces the learning data on the receiving device; it does not merge two histories.",
      "Wähle unter Deine Arbeit sichern die Funktion Sicherung wiederherstellen und die übertragene Datei. Die Wiederherstellung ersetzt die Lerndaten auf dem Zielgerät; zwei Verläufe werden nicht zusammengeführt.",
    ],
    [
      "Check that your responses and recordings are present before continuing.",
      "Prüfe vor dem Weiterlernen, ob deine Antworten und Aufnahmen vorhanden sind.",
    ],
  ] as const)
    transferSteps.append(element("li", t(english, german)));
  transferGuide.append(transferSteps);
  tools.append(transferGuide);
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
    (task) => {
      void fresh(task).catch(writeError);
    },
    () => editing,
  );
  if (!editing) {
    errorBox.textContent = t(
      "Another practice tab is open. You can view progress here; close the other tab and reload to continue.",
      "Ein weiterer Übungstab ist geöffnet. Du kannst hier den Fortschritt ansehen. Schließe den anderen Tab und lade neu, um weiterzuüben.",
    );
  }
  async function continueRecommended(): Promise<void> {
    const next = selectNextLearningTask(
      recommendationPack(),
      ledger(),
      now(),
      level,
      unit.id,
    );
    if (!next?.task)
      throw new Error(
        t(
          "No suitable practice is available yet. Your saved work is kept.",
          "Noch keine passende Übung verfügbar. Deine gespeicherten Antworten bleiben erhalten.",
        ),
      );
    if (next.task.id === task.id && session && hasUnfinishedPractice(session)) {
      taskPanel.scrollIntoView({ block: "start" });
      taskPanel.querySelector<HTMLTextAreaElement>("textarea")?.focus();
      return;
    }
    await fresh(next.task, next.previousAttemptId);
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
    const next = selectNextLearningTask(
      recommendationPack(),
      ledger(),
      now(),
      level,
      unit.id,
    );
    const resumeDraft =
      !!session &&
      shouldResumeSavedPractice(session, "general") &&
      next?.reason !== "repair" &&
      next?.reason !== "due_review";
    focusPanel.replaceChildren(
      element(
        "p",
        next?.reason === "due_review"
          ? t(
              "A previous pattern is due for a fresh attempt.",
              "Ein früheres Muster ist bereit für einen neuen Versuch.",
            )
          : next?.reason === "repair"
            ? t(
                "Return to a pattern that needs repair.",
                "Kehre zu einem Muster zurück, das noch Korrektur braucht.",
              )
            : t(
                "Continue your current pattern. Unchecked responses do not establish mastery.",
                "Übe dein aktuelles Muster weiter. Ungeprüfte Antworten belegen noch keine Beherrschung.",
              ),
      ),
    );
    if (next?.task)
      focusPanel.append(
        button(
          resumeDraft
            ? t("Continue your saved answer", "Gespeicherte Antwort fortsetzen")
            : `${t("Next recommended step", "Empfohlener nächster Schritt")}: ${next.unit.title}`,
          () => {
            if (resumeDraft) {
              taskPanel.scrollIntoView({ block: "start" });
              taskPanel.querySelector<HTMLTextAreaElement>("textarea")?.focus();
            } else return continueRecommended();
          },
          "primary",
        ),
      );
    const alternatives = element("details");
    alternatives.append(
      element(
        "summary",
        t("Other suggested topics", "Weitere Themenvorschläge"),
      ),
    );
    focusPanel.append(alternatives);
    for (const selected of selection.focus) {
      const recommendation = selectDailyTask(selected, ledger(), now());
      alternatives.append(
        button(`${selected.title}`, () => {
          if (!recommendation.task)
            throw new Error(
              t(
                "No practice task is available for this mode yet. Choose another topic.",
                "Für diese Übungsart ist noch keine Aufgabe verfügbar. Wähle ein anderes Thema.",
              ),
            );
          const currentRecommendation = selectDailyTask(
            selected,
            ledger(),
            now(),
          );
          if (currentRecommendation.task)
            return fresh(
              currentRecommendation.task,
              currentRecommendation.previousAttemptId,
            );
        }),
      );
      if (recommendation.task)
        alternatives.append(
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
        alternatives.append(
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
    if (plan.paused) focusSection.open = true;
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
  function observeResponse(attempt: AttemptEvent): void {
    // Append-only evidence also records reading in a second, non-editing tab.
    appendAutomaticityEvent(
      localStorage,
      responseExposure(attempt, now(), id()),
    );
  }
  function renderProgress(): void {
    const reduced = ledger(),
      rows = reduced.progress.filter((row) => row.constructionId === unit.id);
    progressPanel.replaceChildren(
      element(
        "h2",
        t("Evidence for this pattern", "Nachweise für dieses Muster"),
      ),
      element(
        "p",
        t(
          "Goal: at least 90% independent accuracy for this pattern, in writing and speaking separately.",
          "Ziel: mindestens 90 % selbstständige Genauigkeit bei diesem Muster, getrennt für Schreiben und Sprechen.",
        ),
      ),
    );
    for (const modality of ["writing", "speaking"] as const) {
      const row = rows.find((value) => value.modality === modality);
      const group = element("div", undefined, "metric");
      const modeTasks = activePracticeTasks(unit).filter(
        (candidate) => candidate.modality === modality,
      );
      const hasReviewedTasks = modeTasks.some(
        (candidate) => candidate.contentReview === "human_reviewed",
      );
      group.append(
        element(
          "h3",
          modality === "writing"
            ? t("Writing", "Schreiben")
            : t("Speaking", "Sprechen"),
        ),
        element(
          "p",
          `${row?.attempts ?? 0} ${row?.attempts === 1 ? t("attempt", "Versuch") : t("attempts", "Versuche")} · ${row?.assessed ?? 0} ${row?.assessed === 1 ? t("practice check", "Übungsprüfung") : t("practice checks", "Übungsprüfungen")}`,
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
          `${row?.delayedSuccesses ?? 0} ${row?.delayedSuccesses === 1 ? t("delayed check", "verzögerte Prüfung") : t("delayed checks", "verzögerte Prüfungen")} · ${row?.novelSuccesses ?? 0} ${row?.novelSuccesses === 1 ? t("new-context check", "Prüfung in neuem Kontext") : t("new-context checks", "Prüfungen in neuem Kontext")}`,
        ),
      );
      const target = learningTarget(reduced, unit.id, modality);
      if (!modeTasks.length) {
        group.append(
          element(
            "p",
            t(
              "This topic has no exercises in this response mode.",
              "Dieses Thema enthält keine Aufgaben in dieser Antwortform.",
            ),
          ),
        );
        progressPanel.append(group);
        continue;
      }
      if (!hasReviewedTasks)
        group.append(
          element(
            "p",
            t(
              "The current exercises for this topic still need content review before they can provide verified evidence for the 90% target. Keep practising and review saved responses; a practice score does not verify this target.",
              "Die aktuellen Aufgaben zu diesem Thema benötigen noch eine Inhaltsprüfung, bevor sie geprüfte Nachweise für das 90-%-Ziel liefern können. Übe weiter und prüfe gespeicherte Antworten; ein Übungsergebnis bestätigt dieses Ziel noch nicht.",
            ),
          ),
        );
      const criteria = element("details");
      criteria.append(
        element(
          "summary",
          target.met
            ? t(
                "90% accuracy and retention target met",
                "90-%-Ziel für Genauigkeit und Behalten erreicht",
              )
            : t("Progress towards the 90% target", "Fortschritt zum 90-%-Ziel"),
        ),
        element(
          "p",
          `${target.checked}/${LEARNING_TARGET.checks} ${t("reviewed independent responses", "geprüfte selbstständige Antworten")} · ${target.successes} ${t("correct", "richtig")}`,
        ),
        element(
          "p",
          `${Math.min(target.delayedDays, LEARNING_TARGET.delayedDays)}/${LEARNING_TARGET.delayedDays} ${t("separate days with successful delayed recall", "getrennte Tage mit erfolgreichem späterem Abruf")}`,
        ),
        element(
          "p",
          `${Math.min(target.newContexts, LEARNING_TARGET.newContexts)}/${LEARNING_TARGET.newContexts} ${t("new contexts used successfully without naming the rule", "neue Kontexte erfolgreich ohne Nennung der Regel")}`,
        ),
        element(
          "p",
          t(
            "Requires at least 18 correct answers among the latest 20 reviewed independent responses, two delayed-recall days, two new contexts and no unresolved errors. Helped answers and self-checks do not count. These are training criteria; fluency needs separate assessment.",
            "Erfordert mindestens 18 richtige unter den letzten 20 geprüften selbstständigen Antworten, zwei Tage mit späterem Abruf, zwei neue Kontexte und keine offenen Fehler. Antworten mit Hilfe und Selbstprüfungen zählen nicht. Dies sind Übungskriterien; Flüssigkeit muss separat beurteilt werden.",
          ),
          "muted",
        ),
      );
      if (target.repairs)
        criteria.append(
          element(
            "p",
            `${target.repairs} ${t("responses still need repair", "Antworten müssen noch korrigiert werden")}`,
          ),
        );
      group.append(criteria);
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
    const coverageLink = element(
      "a",
      t(
        "See assessment coverage for every topic",
        "Prüfungsabdeckung aller Themen ansehen",
      ),
    );
    coverageLink.href = "/assessment-readiness.html";
    progressPanel.append(coverageLink);
    const benchmarkLink = element(
      "a",
      t(
        "Text and audio evaluator test results",
        "Testergebnisse der Text- und Audioauswertung",
      ),
    );
    benchmarkLink.href = "/assessment-benchmarks.html";
    const microphoneLink = element(
      "a",
      t("Check microphone and playback", "Mikrofon und Wiedergabe prüfen"),
    );
    microphoneLink.href = "/microphone-check.html";
    progressPanel.append(
      element("p"),
      benchmarkLink,
      element("p"),
      microphoneLink,
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
      entry.addEventListener("toggle", () => {
        if (!entry.open) return;
        try {
          observeResponse(row.attempt);
        } catch (error) {
          writeError(error);
        }
      });
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
    const activeTasks = activePracticeTasks(unit).filter(
      (row) => row.partition === "practice",
    );
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
    const currentRepairId =
      session.previousAttemptId ??
      new URLSearchParams(location.search).get("repairOf");
    const requestedRepair = currentRepairId
      ? ledger().attempts.find(
          (row) =>
            row.attempt.id === currentRepairId &&
            row.attempt.task.constructionId === unit.id &&
            row.attempt.task.modality === task.modality,
        )
      : undefined;
    if (requestedRepair) {
      const context = element("details", undefined, "reference");
      context.open = true;
      context.append(
        element(
          "summary",
          t(
            "Your earlier response and feedback",
            "Deine frühere Antwort und Rückmeldung",
          ),
        ),
        element("p", requestedRepair.attempt.response.text, "response-copy"),
        element(
          "p",
          requestedRepair.assessment?.feedback ??
            t(
              "This response still needs review.",
              "Diese Antwort muss noch geprüft werden.",
            ),
        ),
        element(
          "p",
          t(
            "Revise the response below. A correction is practice; it does not count as a new independent success.",
            "Überarbeite die Antwort unten. Eine Korrektur ist Übung; sie zählt nicht als neuer selbstständiger Erfolg.",
          ),
          "muted",
        ),
      );
      taskPanel.append(context);
    }
    if (
      requestedRepair &&
      session.previousAttemptId !== requestedRepair.attempt.id
    ) {
      const sourceTask = repairTaskForAttempt(unit, requestedRepair.attempt);
      if (sourceTask)
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
    const stageOptions = element(
      "details",
      undefined,
      "practice-stage-options",
    );
    stageOptions.append(
      element(
        "summary",
        `${t("Current step", "Aktueller Schritt")}: ${stageNames[stages.indexOf(task.stage)]} · ${t("change", "ändern")}`,
      ),
      stageNav,
    );
    stageOptions.append(
      element(
        "p",
        t(
          "Your path: recall → vary → produce → use in a new situation → return later. Repairs and due reviews come first. Completing a step is practice; independent accuracy, transfer and delayed recall need checked evidence.",
          "Dein Lernweg: abrufen → variieren → selbst formulieren → in neuer Situation anwenden → später wiederholen. Korrekturen und fällige Wiederholungen haben Vorrang. Ein erledigter Schritt ist Übung; selbstständige Genauigkeit, Transfer und späterer Abruf brauchen geprüfte Nachweise.",
        ),
        "muted",
      ),
    );
    taskPanel.append(stageOptions);
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
    const prompt = element("p", undefined, "task-prompt");
    prompt.lang = language;
    prompt.dir = "ltr";
    for (const part of promptTextParts(task.prompt, language)) {
      const segment = element("span", part.text, "prompt-segment");
      segment.lang = part.lang;
      segment.dir = part.dir;
      prompt.append(segment);
    }
    prompt.id = "practice-prompt";
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
      const replacement = taskById.get(retirement.replacementTaskId)!;
      taskPanel.append(
        message,
        element("p", replacement.prompt, "task-prompt"),
        button(
          t(
            "Continue with the updated exercise",
            "Mit der neuen Übung fortfahren",
          ),
          () => fresh(replacement, requestedRepair?.attempt.id ?? null),
          "primary",
        ),
      );
      const archive = element("details");
      archive.append(
        element(
          "summary",
          t(
            "View earlier task and saved response",
            "Frühere Aufgabe und gespeicherte Antwort ansehen",
          ),
        ),
        prompt,
        saved,
      );
      if (recording) {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        audioUrl = URL.createObjectURL(recording.blob);
        const audio = element("audio");
        audio.controls = true;
        audio.src = audioUrl;
        archive.append(audio);
      }
      taskPanel.append(archive);
      return;
    }
    taskPanel.append(prompt);
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
    answer.lang = language;
    answer.dir = "ltr";
    answer.value = session.draft;
    answer.rows = 5;
    answer.maxLength = 100000;
    answer.spellcheck = false;
    answer.autocomplete = "off";
    answer.setAttribute("aria-describedby", "practice-prompt practice-error");
    answer.disabled = !!session.submittedId || !editing;
    answer.addEventListener("input", () => {
      try {
        if (answer.getAttribute("aria-invalid") === "true") {
          answer.removeAttribute("aria-invalid");
          errorBox.textContent = "";
        }
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
            recordingPending = true;
            recordButton.disabled = true;
            stopRecording?.();
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
          cancelRequest.hidden = false;
          const request = new AbortController();
          microphoneRequest = request;
          try {
            try {
              stream = await requestMicrophone(
                () => navigator.mediaDevices.getUserMedia({ audio: true }),
                { signal: request.signal },
              );
              microphoneRequest = null;
              cancelRequest.hidden = true;
            } catch (error) {
              if (error instanceof DOMException && error.name === "AbortError")
                throw new Error(
                  t(
                    "Microphone request cancelled. Your draft and previous recording were kept.",
                    "Mikrofonanfrage abgebrochen. Dein Entwurf und deine vorherige Aufnahme bleiben erhalten.",
                  ),
                );
              if (
                error instanceof DOMException &&
                error.name === "TimeoutError"
              )
                throw new Error(
                  t(
                    "No microphone permission response was received. Check this site's permission and try again, or continue with writing. Your draft was kept.",
                    "Keine Antwort auf die Mikrofonanfrage erhalten. Prüfe die Berechtigung dieser Website und versuche es erneut oder übe schriftlich weiter. Dein Entwurf bleibt erhalten.",
                  ),
                );
              throw new Error(
                t(
                  "The microphone is unavailable or permission was denied. Your draft is kept. Allow microphone access or continue with writing.",
                  "Das Mikrofon ist nicht verfügbar oder der Zugriff wurde abgelehnt. Dein Entwurf bleibt erhalten. Erlaube den Mikrofonzugriff oder übe schriftlich weiter.",
                ),
              );
            }
            const sourceStream = stream;
            const sourceRecorder = new MediaRecorder(sourceStream);
            const sourceSession = session;
            const sourceTaskId = task.id;
            const capture = new RecordingCapture();
            recorder = sourceRecorder;
            stopRecording = () => {
              capture.stop();
              sourceRecorder.stop();
            };
            sourceRecorder.ondataavailable = (event) => capture.add(event.data);
            sourceRecorder.onerror = () => {
              capture.fail();
              recordingPending = true;
              recordButton.disabled = true;
              sourceStream.getTracks().forEach((track) => track.stop());
            };
            sourceRecorder.onstop = () => {
              capture.stop();
              recordingPending = true;
              sourceStream.getTracks().forEach((track) => track.stop());
              stream = null;
              recordButton.textContent = t("Record again", "Erneut aufnehmen");
              recordButton.disabled = true;
              void (async () => {
                const captured = capture.finish(sourceRecorder.mimeType);
                if (!captured)
                  throw new Error(
                    t(
                      "Recording failed or contained no audio. Your previous recording and draft were kept. Please record again.",
                      "Die Aufnahme ist fehlgeschlagen oder enthält kein Audio. Deine vorherige Aufnahme und dein Entwurf bleiben erhalten. Bitte erneut aufnehmen.",
                    ),
                  );
                const savedRecording = await storeRecording(indexedDB, {
                  id: id(),
                  language,
                  taskId: sourceTaskId,
                  createdAt: now(),
                  ...captured,
                });
                if (session !== sourceSession || session.submittedId)
                  throw new Error(
                    t(
                      "The task changed. The new recording was saved separately.",
                      "Die Aufgabe wurde geändert. Die neue Aufnahme wurde separat gespeichert.",
                    ),
                  );
                const previousAudioId = session.audioId;
                session.audioId = savedRecording.id;
                try {
                  saveSession();
                } catch (error) {
                  session.audioId = previousAudioId;
                  throw error;
                }
                recording = savedRecording;
                drawAudio();
                feedback.textContent = t(
                  "Recording saved. Listen and make sure the transcript matches this recording, including any mistakes. Speech quality needs a separate review.",
                  "Aufnahme gespeichert. Höre sie an und gleiche das Transkript mit dieser Aufnahme ab, einschließlich aller Fehler. Die Sprachqualität benötigt eine eigene Prüfung.",
                );
              })()
                .catch(writeError)
                .finally(() => {
                  recordingPending = false;
                  recordButton.disabled = false;
                  stopRecording = null;
                  recorder = null;
                });
            };
            sourceRecorder.start();
            recordButton.textContent = t("Stop recording", "Aufnahme beenden");
          } catch (error) {
            stream?.getTracks().forEach((track) => track.stop());
            stream = null;
            recorder = null;
            stopRecording = null;
            throw error;
          } finally {
            microphoneRequest = null;
            cancelRequest.hidden = true;
            recordingPending = false;
            recordButton.disabled = false;
          }
        },
      );
      const cancelRequest = button(
        t("Cancel microphone request", "Mikrofonanfrage abbrechen"),
        () => microphoneRequest?.abort(),
      );
      cancelRequest.hidden = true;
      recordButton.disabled = !!session.submittedId || !editing;
      media.append(recordButton, cancelRequest);
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
      if (busy || session.submittedId) return;
      let restoreControls: (() => void) | undefined;
      void (async () => {
        assertEditable();
        if (busy || session.submittedId) return;
        if (!answer.value.trim()) {
          answer.setAttribute("aria-invalid", "true");
          answer.focus();
          throw new Error(
            t(
              "Write your own response first.",
              "Schreibe zuerst deine eigene Antwort.",
            ),
          );
        }
        if (recorder?.state === "recording" || recordingPending)
          throw new Error(
            t(
              "Stop your recording and wait for it to save.",
              "Beende die Aufnahme und warte, bis sie gespeichert ist.",
            ),
          );
        busy = true;
        restoreControls = disablePracticeControls(
          root.querySelectorAll<
            | HTMLButtonElement
            | HTMLInputElement
            | HTMLSelectElement
            | HTMLTextAreaElement
          >("button, input, select, textarea"),
        );
        taskPanel.setAttribute("aria-busy", "true");
        errorBox.textContent = "";
        feedback.textContent = t(
          "Saving and checking your response…",
          "Deine Antwort wird gespeichert und geprüft…",
        );
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
      })()
        .catch((error) => {
          if (restoreControls) feedback.textContent = "";
          writeError(error);
        })
        .finally(() => {
          busy = false;
          restoreControls?.();
          taskPanel.removeAttribute("aria-busy");
          try {
            if (restoreControls) {
              renderTask();
              renderProgress();
              renderFocus();
            }
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
      if (saved) observeResponse(saved.attempt);
      feedback.textContent =
        saved?.assessment?.feedback ??
        t(
          "Saved. The check was interrupted; this response has no assessment yet.",
          "Gespeichert. Die Prüfung wurde unterbrochen; diese Antwort hat noch keine Bewertung.",
        );
      if (saved?.assessment?.correction) {
        taskPanel.append(
          element(
            "p",
            t(
              "Suggested edit — check it before using it",
              "Korrekturvorschlag – vor der Verwendung prüfen",
            ),
          ),
          element("blockquote", saved.assessment.correction, "response-copy"),
        );
      }
      if (
        saved &&
        task.modality === "writing" &&
        task.stage !== "notice" &&
        (!saved.assessment ||
          (saved.assessment.verdict === "not_assessed" &&
            saved.assessment.evaluator.kind !== "human"))
      ) {
        taskPanel.append(
          button(
            t("Retry automatic check", "Automatische Prüfung erneut versuchen"),
            async () => {
              if (busy || !editing) return;
              assertEditable();
              busy = true;
              const restore = disablePracticeControls(
                root.querySelectorAll<
                  | HTMLButtonElement
                  | HTMLInputElement
                  | HTMLSelectElement
                  | HTMLTextAreaElement
                >("button,input,select,textarea"),
              );
              taskPanel.setAttribute("aria-busy", "true");
              errorBox.textContent = "";
              let unavailable = false;
              try {
                const baseline =
                  saved.assessment ??
                  assessControlledTask(saved.attempt, task, now(), id());
                const proposal =
                  baseline.verdict === "not_assessed"
                    ? await qualifiedTransformer(saved.attempt, baseline, {
                        refreshCapabilities: true,
                      })
                    : baseline;
                const unchanged = () => {
                  const current = ledger().attempts.find(
                    (row) => row.attempt.id === saved.attempt.id,
                  );
                  if (
                    !current ||
                    current.assessment?.id !== saved.assessment?.id ||
                    current.reasons.includes("conflicting_assessments")
                  )
                    throw new Error(
                      t(
                        "The review changed while checking. Compare the latest feedback.",
                        "Die Bewertung hat sich während der Prüfung geändert. Vergleiche die neueste Rückmeldung.",
                      ),
                    );
                };
                unchanged();
                if (!proposal) {
                  unavailable = true;
                  return;
                }
                const history = await collectAssessmentFeedback(
                  readAutomaticityEvents(localStorage, language).events,
                  pack,
                  now(),
                );
                const guarded = await guardAssessmentWithFeedback(
                  saved.attempt,
                  task,
                  proposal,
                  history,
                  now(),
                  id(),
                );
                unchanged();
                if (!saved.assessment && proposal !== baseline)
                  appendAutomaticityEvent(localStorage, baseline);
                persistFeedbackAssessment(localStorage, proposal, guarded);
              } finally {
                busy = false;
                restore();
                taskPanel.removeAttribute("aria-busy");
                renderTask();
                renderProgress();
                renderFocus();
                refreshReviews();
                if (unavailable)
                  feedback.textContent = t(
                    "No suitable automatic evaluator is available for this answer now. Your answer and earlier feedback were kept. You can request text suggestions below or arrange a review.",
                    "Für diese Antwort ist derzeit keine geeignete automatische Bewertung verfügbar. Deine Antwort und bisherige Rückmeldung bleiben erhalten. Du kannst unten Textvorschläge anfordern oder eine Prüfung veranlassen.",
                  );
              }
            },
          ),
        );
      }
      if (
        saved &&
        task.answerPolicy !== "reflection" &&
        (!saved.assessment ||
          (saved.assessment.verdict === "not_assessed" &&
            saved.assessment.evaluator.kind === "rule"))
      ) {
        const privacy = element(
          "p",
          t(
            task.modality === "speaking"
              ? "Optional: send only this typed transcript to LanguageTool for text suggestions. Your audio stays on this device. This does not assess the recording, pronunciation or fluency. Your original transcript stays unchanged. "
              : "Optional: send this saved text to LanguageTool for proofreading suggestions. This checks text, not target use or speech. Your original answer stays unchanged. ",
            task.modality === "speaking"
              ? "Optional: Nur dieses getippte Transkript für Textvorschläge an LanguageTool senden. Dein Audio bleibt auf diesem Gerät. Aufnahme, Aussprache und Flüssigkeit werden nicht bewertet. Dein Originaltranskript bleibt erhalten. "
              : "Optional: Diesen gespeicherten Text für Korrekturvorschläge an LanguageTool senden. Geprüft wird der Text, nicht die Zielstruktur oder das Sprechen. Deine Originalantwort bleibt erhalten. ",
          ),
          "muted",
        );
        const providerLink = element("a", "LanguageTool");
        providerLink.href = "https://languagetool.org";
        const privacyLink = element("a", t("Privacy", "Datenschutz"));
        privacyLink.href = "https://languagetool.org/legal/privacy";
        privacy.append(providerLink, " · ", privacyLink);
        taskPanel.append(
          privacy,
          button(
            t(
              task.modality === "speaking"
                ? "Send transcript for text suggestions"
                : "Send text for online proofreading",
              task.modality === "speaking"
                ? "Transkript für Textvorschläge senden"
                : "Text zur Online-Prüfung senden",
            ),
            async () => {
              if (busy || !editing) return;
              busy = true;
              const restore = disablePracticeControls(
                root.querySelectorAll<
                  | HTMLButtonElement
                  | HTMLInputElement
                  | HTMLSelectElement
                  | HTMLTextAreaElement
                >("button,input,select,textarea"),
              );
              taskPanel.setAttribute("aria-busy", "true");
              errorBox.textContent = "";
              feedback.textContent = t(
                "Requesting proofreading suggestions…",
                "Korrekturvorschläge werden angefordert…",
              );
              try {
                const response = await fetch("/api/conversation/evaluate", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    text: saved.attempt.response.text,
                    language,
                  }),
                  signal: AbortSignal.timeout(15000),
                  cache: "no-store",
                });
                if (!response.ok)
                  throw new Error(
                    t(
                      "Online proofreading is unavailable. Your saved answer has no new grade; try again later.",
                      "Die Online-Prüfung ist nicht verfügbar. Deine gespeicherte Antwort erhält keine neue Bewertung; versuche es später erneut.",
                    ),
                  );
                const result = parseGrammarFeedback(
                  await response.json(),
                  saved.attempt.response.text,
                );
                const current = ledger().attempts.find(
                  (row) => row.attempt.id === saved.attempt.id,
                );
                if (
                  !current ||
                  current.assessment?.id !== saved.assessment?.id ||
                  current.reasons.includes("conflicting_assessments")
                )
                  throw new Error(
                    t(
                      "The review changed while checking. Compare the latest feedback.",
                      "Die Bewertung hat sich während der Prüfung geändert. Vergleiche die neueste Rückmeldung.",
                    ),
                  );
                const at = new Date(
                  Math.max(
                    Date.now(),
                    Date.parse(saved.assessment?.at ?? saved.attempt.at) + 1,
                  ),
                ).toISOString();
                const proposal = grammarFeedbackAssessment(
                  saved.attempt,
                  result,
                  at,
                  id(),
                  saved.assessment?.id ?? null,
                );
                const history = await collectAssessmentFeedback(
                  readAutomaticityEvents(localStorage, language).events,
                  pack,
                  now(),
                );
                const guarded = await guardAssessmentWithFeedback(
                  saved.attempt,
                  task,
                  proposal,
                  history,
                  now(),
                  id(),
                );
                const latest = ledger().attempts.find(
                  (row) => row.attempt.id === saved.attempt.id,
                );
                if (
                  !latest ||
                  latest.assessment?.id !== saved.assessment?.id ||
                  latest.reasons.includes("conflicting_assessments")
                )
                  throw new Error(
                    t(
                      "The review changed while checking. Compare the latest feedback.",
                      "Die Bewertung hat sich während der Prüfung geändert. Vergleiche die neueste Rückmeldung.",
                    ),
                  );
                persistFeedbackAssessment(localStorage, proposal, guarded);
              } finally {
                busy = false;
                restore();
                taskPanel.removeAttribute("aria-busy");
                renderTask();
                renderProgress();
                renderFocus();
                refreshReviews();
              }
            },
          ),
        );
      }
      taskPanel.append(
        button(
          t("Try again as a repair", "Als Korrektur erneut versuchen"),
          () => fresh(task, session.submittedId),
        ),
      );
    }
    const recommendation = selectNextLearningTask(
      recommendationPack(),
      ledger(),
      now(),
      level,
      unit.id,
    );
    if (session.submittedId && recommendation?.task) {
      taskPanel.append(
        button(
          recommendation.reason === "repair"
            ? t("Repair before continuing", "Vor dem Weitergehen korrigieren")
            : t("Continue learning path", "Lernweg fortsetzen"),
          continueRecommended,
          "primary",
        ),
      );
      taskPanel.append(
        element(
          "p",
          `${t("Next", "Als Nächstes")}: ${recommendation.unit.title} · ${stageNames[stages.indexOf(recommendation.task.stage)]} · ${recommendation.task.modality === "speaking" ? t("Speaking", "Sprechen") : t("Writing", "Schreiben")}`,
          "muted",
        ),
      );
    }
    const current = activeTasks.findIndex((row) => row.id === task.id),
      next =
        activeTasks
          .slice(current + 1)
          .find((row) => row.modality === task.modality) ??
        activeTasks.find((row) => row.modality === task.modality)!;
    if (!session.submittedId && next)
      taskPanel.append(
        button(t("Next task", "Nächste Aufgabe"), () => fresh(next)),
      );
  }
  document.addEventListener("visibilitychange", () => {
    timer?.visibility(!document.hidden);
    if (document.hidden) microphoneRequest?.abort();
  });
  window.addEventListener("storage", (event) => {
    if (busy) return;
    if (
      event.key?.startsWith(`automaticity:v2:${language}:event:`) ||
      event.key?.startsWith(`automaticity:v2:${language}:scheduler-pilot:`)
    ) {
      renderProgress();
      renderFocus();
    }
  });
  window.addEventListener("pagehide", () => {
    microphoneRequest?.abort();
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
  const resumedRetirement = unit.retiredTasks?.find(
    (row) => row.taskId === task.id,
  );
  if (
    resume &&
    editing &&
    resumedRetirement &&
    !requestedTask &&
    !requested.has("review")
  ) {
    await fresh(
      taskById.get(resumedRetirement.replacementTaskId)!,
      resume.previousAttemptId,
    );
    feedback.textContent = t(
      "The updated exercise is ready. Your earlier response remains in saved history.",
      "Die neue Übung ist bereit. Deine frühere Antwort bleibt im gespeicherten Verlauf erhalten.",
    );
  } else if (resume) {
    renderTask();
    renderProgress();
    if (!resume.submittedId)
      feedback.textContent = t(
        "Your draft was restored. Timing is unavailable for this interrupted attempt.",
        "Dein Entwurf wurde wiederhergestellt. Für diesen unterbrochenen Versuch ist keine Zeitmessung verfügbar.",
      );
  } else if (editing) {
    const recommendation = selectDailyTask(unit, ledger(), now());
    const linkedRepair = repairRequestId
      ? ledger().attempts.find(
          (row) =>
            row.attempt.id === repairRequestId &&
            repairTaskForAttempt(unit, row.attempt)?.id === task.id,
        )
      : undefined;
    await fresh(
      task,
      linkedRepair
        ? linkedRepair.attempt.id
        : recommendation.task?.id === task.id
          ? recommendation.previousAttemptId
          : null,
    );
    if (advancedFromCompleted)
      feedback.textContent = t(
        "Your previous response is saved. The next recommended step is ready.",
        "Deine vorherige Antwort ist gespeichert. Der nächste empfohlene Schritt ist bereit.",
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
  const reviewsDisclosure = element(
    "details",
    undefined,
    "card practice-disclosure",
  );
  reviewsDisclosure.open = requested.has("review") || requested.has("attempt");
  reviewsDisclosure.append(
    element(
      "summary",
      t(
        "Saved responses & independent review",
        "Gespeicherte Antworten & unabhängige Prüfung",
      ),
    ),
    reviews,
  );
  root.append(reviewsDisclosure);
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
  if (location.hash === "#backup-tools") {
    tools.open = true;
    transferGuide.open = true;
    tools.scrollIntoView({ block: "start" });
  }
  if ("serviceWorker" in navigator)
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Practice remains usable; offline readiness is checked separately. */
    });
}
