module.exports = [
"[project]/lib/study-progress.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "countCompletedItems",
    ()=>countCompletedItems,
    "countCompletedOutputs",
    ()=>countCompletedOutputs,
    "countRequiredCompletedItems",
    ()=>countRequiredCompletedItems,
    "countRequiredCompletedOutputs",
    ()=>countRequiredCompletedOutputs,
    "estimatedLearningHours",
    ()=>estimatedLearningHours,
    "getDayOutputStatus",
    ()=>getDayOutputStatus,
    "getDayStatus",
    ()=>getDayStatus,
    "outputTotal",
    ()=>outputTotal,
    "percentComplete",
    ()=>percentComplete,
    "requiredItemTotal",
    ()=>requiredItemTotal,
    "requiredOutputTotal",
    ()=>requiredOutputTotal
]);
function countCompletedItems(day, completed) {
    return day.tasks.reduce((count, task)=>count + task.items.filter((item)=>completed.has(item.id)).length, 0);
}
function countCompletedOutputs(day, completed) {
    return day.tasks.filter((task)=>task.items.every((item)=>completed.has(item.id))).length;
}
function outputTotal(day) {
    return day.tasks.length;
}
function requiredOutputTotal(day) {
    return day.optionalDuringCourse ? 0 : outputTotal(day);
}
function countRequiredCompletedOutputs(day, completed) {
    return day.optionalDuringCourse ? 0 : countCompletedOutputs(day, completed);
}
function getDayOutputStatus(day, completed) {
    const done = countCompletedOutputs(day, completed);
    const total = outputTotal(day);
    if (day.optionalDuringCourse && done < total) return "optional";
    if (done === 0) return "open";
    if (done === total) return "done";
    return "started";
}
function getDayStatus(day, completed, itemsPerDay = 9) {
    const count = countCompletedItems(day, completed);
    if (day.optionalDuringCourse && count < itemsPerDay) return "optional";
    if (count === 0) return "open";
    if (count === itemsPerDay) return "done";
    return "started";
}
function requiredItemTotal(day) {
    return day.optionalDuringCourse ? 0 : day.tasks.reduce((total, task)=>total + task.items.length, 0);
}
function countRequiredCompletedItems(day, completed) {
    return day.optionalDuringCourse ? 0 : countCompletedItems(day, completed);
}
function percentComplete(completed, total) {
    if (total <= 0) return 0;
    return Math.round(Math.max(0, completed) / total * 100);
}
function estimatedLearningHours(completedItems, itemsPerDay = 9, hoursPerDay = 4) {
    if (itemsPerDay <= 0 || hoursPerDay < 0) return 0;
    return Math.round(Math.max(0, completedItems) / itemsPerDay * hoursPerDay * 10) / 10;
}
}),
"[project]/lib/recall/storage.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/recall/storage.ts
//
// Persistenz über localStorage — konsistent mit dem "local-first" Ansatz
// des PDF-Readers. Kein Server, keine neue Datenbank nötig.
//
// Der Zwischenspeicher und die Abonnentenliste machen daraus einen echten
// externen Store: `useSyncExternalStore` kann ihn ohne setState-im-Effekt
// lesen, und mehrere gleichzeitig eingehängte Karten teilen sich denselben
// Stand, statt sich gegenseitig zu überschreiben.
__turbopack_context__.s([
    "getRecallServerSnapshot",
    ()=>getRecallServerSnapshot,
    "getRecallSnapshot",
    ()=>getRecallSnapshot,
    "loadRecallEntries",
    ()=>loadRecallEntries,
    "resetRecallStoreForTests",
    ()=>resetRecallStoreForTests,
    "saveRecallEntries",
    ()=>saveRecallEntries,
    "subscribeToRecallEntries",
    ()=>subscribeToRecallEntries
]);
const STORAGE_KEY = 'cri_recall_entries_v1';
/** Stabile Referenz: Snapshots dürfen sich nicht bei jedem Aufruf ändern. */ const EMPTY = Object.freeze([]);
let cache = null;
const listeners = new Set();
function read() {
    if ("TURBOPACK compile-time truthy", 1) return EMPTY;
    //TURBOPACK unreachable
    ;
    const raw = undefined;
}
function loadRecallEntries() {
    if (cache === null) cache = read();
    return cache;
}
function saveRecallEntries(entries) {
    cache = entries;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    for (const listener of listeners)listener();
}
function subscribeToRecallEntries(listener) {
    listeners.add(listener);
    return ()=>{
        listeners.delete(listener);
    };
}
const getRecallSnapshot = loadRecallEntries;
function getRecallServerSnapshot() {
    return EMPTY;
}
function resetRecallStoreForTests() {
    cache = null;
    listeners.clear();
}
}),
"[project]/lib/recall/scheduler.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/recall/scheduler.ts
//
// Einfache, feste Intervall-Logik (kein SM-2 nötig für den Start).
// 1 -> 3 -> 7 -> 14 -> 30 Tage; bei "weak" wird auf 1 Tag zurückgesetzt.
__turbopack_context__.s([
    "INTERVALS",
    ()=>INTERVALS,
    "addDays",
    ()=>addDays,
    "computeNextInterval",
    ()=>computeNextInterval,
    "isDueToday",
    ()=>isDueToday
]);
const INTERVALS = [
    1,
    3,
    7,
    14,
    30
];
function computeNextInterval(currentIntervalDay, confidence) {
    if (confidence === 'weak') return INTERVALS[0];
    const idx = INTERVALS.indexOf(currentIntervalDay);
    if (idx === -1) return INTERVALS[0];
    return INTERVALS[Math.min(idx + 1, INTERVALS.length - 1)];
}
function addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}
function isDueToday(nextReviewDate, now = new Date()) {
    const due = new Date(nextReviewDate);
    if (Number.isNaN(due.getTime())) return false;
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    return due <= endOfToday;
}
}),
"[project]/lib/recall/useRecallEntries.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useRecallEntries",
    ()=>useRecallEntries
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/recall/storage.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$scheduler$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/recall/scheduler.ts [app-ssr] (ecmascript)");
// lib/recall/useRecallEntries.ts
//
// Zentraler Hook für das Recall-Check-Feature.
// Rufe `addEntry(...)` am Ende eines "Finden und verstehen"-Blocks auf,
// um ein neues Konzept in die Wiederholungs-Pipeline aufzunehmen.
'use client';
;
;
;
function useRecallEntries() {
    // Der externe Store wird direkt gelesen; kein setState im Effekt und damit
    // auch kein Auseinanderlaufen, wenn die Karte mehrfach eingehängt ist.
    const entries = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSyncExternalStore"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["subscribeToRecallEntries"], __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRecallSnapshot"], __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRecallServerSnapshot"]);
    // Auf dem Server false, im Browser true — so lässt sich das kurze
    // Aufblitzen von "keine Wiederholung fällig" vermeiden.
    const hydrated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSyncExternalStore"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["subscribeToRecallEntries"], ()=>true, ()=>false);
    const dueToday = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>entries.filter((e)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$scheduler$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isDueToday"])(e.nextReviewDate)), [
        entries
    ]);
    /** Neues Konzept nach dem Lernen (Tag 0) registrieren. Fällig ab morgen. */ const addEntry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((params)=>{
        const now = new Date().toISOString();
        const entry = {
            id: crypto.randomUUID(),
            concept: params.concept,
            sourceId: params.sourceId,
            sourceTitle: params.sourceTitle,
            originalNoteFA: params.originalNoteFA,
            originalNoteDE: params.originalNoteDE,
            createdAt: now,
            reviews: [],
            nextReviewDate: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$scheduler$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDays"])(now, 1)
        };
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveRecallEntries"])([
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadRecallEntries"])(),
            entry
        ]);
        return entry;
    }, []);
    /** Eine Wiederholung abschließen und das nächste Intervall berechnen. */ const submitReview = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((entryId, recallFA, recallDE, confidence)=>{
        const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadRecallEntries"])().map((e)=>{
            if (e.id !== entryId) return e;
            const lastInterval = e.reviews.length > 0 ? e.reviews[e.reviews.length - 1].intervalDay : 0;
            const nextInterval = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$scheduler$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeNextInterval"])(lastInterval, confidence);
            const nowIso = new Date().toISOString();
            return {
                ...e,
                reviews: [
                    ...e.reviews,
                    {
                        date: nowIso,
                        intervalDay: nextInterval,
                        recallFA,
                        recallDE,
                        confidence
                    }
                ],
                nextReviewDate: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$scheduler$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDays"])(nowIso, nextInterval)
            };
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$storage$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveRecallEntries"])(next);
    }, []);
    return {
        entries,
        dueToday,
        hydrated,
        addEntry,
        submitReview
    };
}
}),
"[project]/lib/device-session-store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "currentSessionSeconds",
    ()=>currentSessionSeconds,
    "isTimedSessionState",
    ()=>isTimedSessionState,
    "readDeviceSessions",
    ()=>readDeviceSessions,
    "transitionTimedSession",
    ()=>transitionTimedSession,
    "writeDeviceSessions",
    ()=>writeDeviceSessions
]);
function availableStorage(storage) {
    if (storage) return storage;
    return typeof localStorage === "undefined" ? null : localStorage;
}
function isTimedSessionState(value) {
    if (!value || typeof value !== "object") return false;
    const session = value;
    return [
        "running",
        "paused",
        "completed"
    ].includes(String(session.status)) && (typeof session.lastStartedAt === "string" || session.lastStartedAt === null) && (typeof session.endedAt === "string" || session.endedAt === null);
}
function readDeviceSessions(key, isSession, storage) {
    try {
        const target = availableStorage(storage);
        if (!target) return [];
        const value = JSON.parse(target.getItem(key) || "[]");
        return Array.isArray(value) ? value.filter(isSession).slice(0, 30) : [];
    } catch  {
        return [];
    }
}
function writeDeviceSessions(key, sessions, storage) {
    try {
        const target = availableStorage(storage);
        if (!target) return false;
        target.setItem(key, JSON.stringify(sessions.slice(0, 30)));
        return true;
    } catch  {
        return false;
    }
}
function currentSessionSeconds(session, storedSeconds, now = Date.now()) {
    if (session.status !== "running" || !session.lastStartedAt) return storedSeconds;
    const startedAt = new Date(session.lastStartedAt).getTime();
    if (!Number.isFinite(startedAt)) return storedSeconds;
    return storedSeconds + Math.max(0, Math.floor((now - startedAt) / 1_000));
}
function transitionTimedSession(session, action, storedSeconds, now = new Date()) {
    const timestamp = now.toISOString();
    return {
        status: action === "finish" ? "completed" : action === "pause" ? "paused" : "running",
        storedSeconds: currentSessionSeconds(session, storedSeconds, now.getTime()),
        lastStartedAt: action === "resume" ? timestamp : null,
        endedAt: action === "finish" ? timestamp : null
    };
}
}),
"[project]/lib/storage-mode.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEVICE_ONLY_STORAGE",
    ()=>DEVICE_ONLY_STORAGE
]);
const DEVICE_ONLY_STORAGE = ("TURBOPACK compile-time value", "device") === "device";
}),
"[project]/lib/project-schedule.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addDaysToProjectDate",
    ()=>addDaysToProjectDate,
    "projectDaysBetween",
    ()=>projectDaysBetween,
    "rescheduleAfterPause",
    ()=>rescheduleAfterPause
]);
const ISO_DAY_MS = 86_400_000;
function addDaysToProjectDate(date, days) {
    const parsed = new Date(`${date}T12:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return "";
    parsed.setUTCDate(parsed.getUTCDate() + days);
    return parsed.toISOString().slice(0, 10);
}
function projectDaysBetween(from, to) {
    const fromDate = new Date(`${from}T12:00:00Z`);
    const toDate = new Date(`${to}T12:00:00Z`);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return 0;
    return Math.round((toDate.getTime() - fromDate.getTime()) / ISO_DAY_MS);
}
function rescheduleAfterPause(input) {
    const pauseDays = Math.max(0, projectDaysBetween(input.pausedAt, input.resumeDate));
    const planStartDate = addDaysToProjectDate(input.planStartDate, pauseDays);
    return {
        pauseDays,
        planStartDate,
        planEndDate: input.calculateEnd(planStartDate)
    };
}
}),
"[project]/lib/daily-work-mode.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DAILY_WORK_MODES",
    ()=>DAILY_WORK_MODES,
    "effectivePlanHours",
    ()=>effectivePlanHours,
    "isTaskRequiredForMode",
    ()=>isTaskRequiredForMode,
    "normalizeDailyWorkMode",
    ()=>normalizeDailyWorkMode,
    "workModeRequiredTaskIndexes",
    ()=>workModeRequiredTaskIndexes,
    "workModeTaskMinutes",
    ()=>workModeTaskMinutes
]);
const DAILY_WORK_MODES = {
    rescue: {
        label: "12-Minuten-Rettung",
        shortLabel: "Rettung",
        totalMinutes: 12,
        taskMinutes: [
            0,
            0,
            12
        ],
        requiredTaskIndexes: [
            2
        ],
        description: "Ein kleines Tagesergebnis sichern. Die zwei übrigen Ergebnisse sind heute ausdrücklich optional und erzeugen keinen Rückstand."
    },
    light: {
        label: "70 Minuten leicht",
        shortLabel: "Leicht",
        totalMinutes: 70,
        taskMinutes: [
            25,
            0,
            45
        ],
        requiredTaskIndexes: [
            0,
            2
        ],
        description: "Ein Verständnis- und ein Tagesergebnis. Die formale Vertiefung bleibt optional und wird nicht als Rückstand gewertet."
    },
    full: {
        label: "8 Stunden Vollzeit",
        shortLabel: "8 Stunden",
        totalMinutes: 480,
        taskMinutes: [
            80,
            100,
            60
        ],
        requiredTaskIndexes: [
            0,
            1,
            2
        ],
        description: "Vier Stunden Forschung oder Projektlernen und vier Stunden Umsetzung, Test und Dokumentation. Pausen teilen den Tag in kleine Einheiten; sie sind keine Lese-Deadline."
    }
};
function normalizeDailyWorkMode(value) {
    return value === "rescue" || value === "light" || value === "full" ? value : "full";
}
function workModeTaskMinutes(mode, taskIndex) {
    return DAILY_WORK_MODES[mode].taskMinutes[taskIndex] ?? DAILY_WORK_MODES[mode].taskMinutes.at(-1);
}
function workModeRequiredTaskIndexes(mode) {
    return DAILY_WORK_MODES[mode].requiredTaskIndexes;
}
function isTaskRequiredForMode(mode, taskIndex) {
    return workModeRequiredTaskIndexes(mode).includes(taskIndex);
}
function effectivePlanHours(mode, plannedDays) {
    return Math.round(Math.max(0, plannedDays) * DAILY_WORK_MODES[mode].totalMinutes / 60 * 10) / 10;
}
}),
"[project]/lib/daily-session-prompt.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DAILY_SESSION_COMMANDS",
    ()=>DAILY_SESSION_COMMANDS,
    "buildDailySessionPrompt",
    ()=>buildDailySessionPrompt
]);
const DAILY_SESSION_COMMANDS = [
    {
        id: "start",
        label: "Start today",
        shortInstruction: "Inspect the real state first and give me only the first Mode A unit."
    },
    {
        id: "continue",
        label: "Continue",
        shortInstruction: "Recover the verified article, block, unit, and pipeline step; give only the next step."
    },
    {
        id: "stuck",
        label: "I am stuck",
        shortInstruction: "Use Builder Mode for this unit only; do not assume edit, commit, push, or deploy permission."
    },
    {
        id: "close",
        label: "Close the day",
        shortInstruction: "Verify artefact, test, evidence, thesis decision, Git state, and tomorrow's one next unit."
    },
    {
        id: "paper",
        label: "Paper-only day",
        shortInstruction: "Give one medically appropriate screen-free task for the current week."
    }
];
function commandText(command) {
    switch(command){
        case "continue":
            return "Continue from the verified article, block, unit, and pipeline step. Give me only the next step.";
        case "stuck":
            return "I am stuck. Enter Builder Mode for this unit only. Explain it in simple Persian, connect it to the thesis, and finish one authorized software output with real files, an exact test, and actual evidence.";
        case "close":
            return "Close the day. Confirm the artefact, test, evidence, thesis decision, Git state, the maximum-three-line Tracker note, and tomorrow's single next unit. Do not create catch-up work.";
        case "paper":
            return "Today is paper-only. Give me one medically appropriate screen-free software-engineering or thesis-design task for the current week. Do not require code execution or digital reading.";
        default:
            return "Start my daily thesis session. Inspect the real state first, then give me only today's first study unit in Mode A.";
    }
}
function buildDailySessionPrompt({ command, day, effectiveDate, sourceLabel }) {
    const permissionRule = command === "stuck" ? "Editing, committing, pushing, and deployment are NOT authorized by this message. Ask for each missing permission only when it becomes necessary." : "Work read-only first. Editing, committing, pushing, and deployment remain independently unauthorized unless I explicitly allow them.";
    return `${commandText(command)}

Use the master project instructions in AGENTS.md. Recover real state from the thesis repository, Git, the Study Tracker, the authoritative reading order, and the latest daily note. Do not ask me to fill in a daily form.

TODAY'S TRACKER CONTEXT
- Date: ${effectiveDate}
- Week: ${day.week}
- Day: ${day.title}
- Article or learning source: ${sourceLabel}
- Research block: ${day.researchTrack.block}/5
- Read only: ${day.researchTrack.readOnly}
- Do not read today: ${day.researchTrack.doNotRead}
- Guiding question: ${day.researchTrack.question}
- Research evidence: ${day.researchTrack.expectedOutput}
- Project module: ${day.module}
- Project artefact: ${day.deliverable}
- Screen mode: ${day.workMode === "paper" ? "paper-only; medical limits override the plan" : "screen work allowed only within current medical guidance"}

SESSION CONTRACT
1. Verify the real repository, source file, reading-order position, current implementation module, Git state, and last test before claiming progress.
2. Give exactly one smallest meaningful source unit. Let me try before you summarize, translate, or define vocabulary.
3. Ask at most three questions. If I struggle, give one hint at a time for at most two rounds.
4. Use at most two essential vocabulary terms. After understanding, ask for a short Persian teach-back; add a short English explanation only after it is correct. German is optional.
5. Connect the source claim to one thesis decision and then to one small visible software output.
6. A completed output needs Artefact + Test + Evidence. Save only a maximum-three-line conclusion in the Tracker; keep source-bound notes and citations in Zotero.
7. Never compress missed work, double a week, or turn the eight-hour capacity ceiling into a deadline.
8. ${permissionRule}

Stop after the single next interaction required by the selected command.`;
}
}),
"[project]/lib/pdf-reader-link.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildPdfReaderHref",
    ()=>buildPdfReaderHref,
    "googleDriveFileId",
    ()=>googleDriveFileId,
    "isDirectPdfUrl",
    ()=>isDirectPdfUrl
]);
const DRIVE_FILE_ID = /^[a-zA-Z0-9_-]{10,200}$/;
const MAX_QUERY_TEXT_LENGTH = 600;
function cleanQueryText(value) {
    return value?.trim().slice(0, MAX_QUERY_TEXT_LENGTH) || "";
}
function googleDriveFileId(value) {
    if (!value) return null;
    try {
        const url = new URL(value);
        if (!url.hostname.endsWith("google.com")) return null;
        const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
        const id = pathMatch?.[1] || url.searchParams.get("id");
        return id && DRIVE_FILE_ID.test(id) ? id : null;
    } catch  {
        return DRIVE_FILE_ID.test(value.trim()) ? value.trim() : null;
    }
}
function isDirectPdfUrl(value) {
    if (!value) return false;
    try {
        const url = new URL(value, "https://pdf-source.local");
        return /\.pdf$/i.test(url.pathname);
    } catch  {
        return false;
    }
}
function buildPdfReaderHref({ readerUrl, sourceUrl, driveId, document, name, focus, context, page }) {
    const relative = readerUrl.startsWith("/");
    const url = new URL(readerUrl, "https://integrated-reader.local");
    const resolvedDriveId = driveId || googleDriveFileId(sourceUrl) || "";
    if (document) url.searchParams.set("document", document);
    if (resolvedDriveId) url.searchParams.set("driveId", resolvedDriveId);
    else if (sourceUrl && isDirectPdfUrl(sourceUrl)) {
        url.searchParams.set("sourceUrl", sourceUrl);
    }
    const cleanName = cleanQueryText(name);
    const cleanFocus = cleanQueryText(focus);
    const cleanContext = cleanQueryText(context);
    if (cleanName) url.searchParams.set("name", cleanName);
    if (cleanFocus) url.searchParams.set("focus", cleanFocus);
    if (cleanContext) url.searchParams.set("context", cleanContext);
    if (page && Number.isInteger(page) && page > 0) {
        url.searchParams.set("page", String(page));
    }
    return relative ? `${url.pathname}${url.search}${url.hash}` : url.toString();
}
}),
"[project]/lib/nlp-course-calendar.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildCourseReadingPlanDescription",
    ()=>buildCourseReadingPlanDescription
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plan$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/plan-data.ts [app-ssr] (ecmascript)");
;
function buildCourseReadingPlanDescription(session, formatReading) {
    return [
        "Teilnahmemodus: Live beobachten; keine Vorablektüre und kein Pflichtartefakt.",
        `Nach Teilnahme: maximal ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plan$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["trackerRestartPlan"].liveSessionPolicy.noteLineLimit} Zeilen — verstanden; Thesis-Bezug; offene Frage.`,
        `Wenn verpasst: nicht vor ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plan$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["trackerRestartPlan"].catchUpPolicy.earliestDate} nachholen.`,
        `Referenzmaterial erst nach dem Neustart und nur bei direktem Wochenblocker: ${session.readingIds.map(formatReading).join("; ")}`
    ].join("\n");
}
}),
"[project]/lib/learning-progress-chart.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "learningProgressChart",
    ()=>learningProgressChart
]);
const berlinDay = (value)=>new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Berlin",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(value);
function learningProgressChart(states, events, groups, now = new Date()) {
    const ids = new Set(groups.flatMap((group)=>group.ids));
    const tracks = groups.map((group)=>({
            ...group,
            total: group.ids.length,
            completed: group.ids.filter((id)=>states[id]?.practiced === true).length
        }));
    const completed = [
        ...ids
    ].filter((id)=>states[id]?.practiced === true).length;
    const today = berlinDay(now);
    const todayUtc = Date.parse(today + "T12:00:00Z");
    const dayKeys = Array.from({
        length: 14
    }, (_, i)=>new Date(todayUtc - (13 - i) * 86400000).toISOString().slice(0, 10));
    const seen = new Set();
    const ordered = events.filter((event)=>{
        if (seen.has(event.id) || !ids.has(event.lessonId) || !Number.isFinite(Date.parse(event.at)) || Date.parse(event.at) > now.getTime()) return false;
        seen.add(event.id);
        return true;
    }).sort((a, b)=>a.at.localeCompare(b.at) || a.id.localeCompare(b.id)).map((event)=>({
            ...event,
            day: berlinDay(new Date(event.at))
        }));
    const practiced = new Set();
    let cursor = 0;
    const history = dayKeys.map((day)=>{
        while(cursor < ordered.length && ordered[cursor].day <= day){
            const event = ordered[cursor++];
            if (event.kind === "practice" || event.kind === "mastery") practiced.add(event.lessonId);
            if (event.kind === "reopen") practiced.delete(event.lessonId);
        }
        return {
            day,
            completed: practiced.size
        };
    });
    const achievedIds = new Set(ordered.filter((event)=>event.kind === "practice" || event.kind === "mastery").map((event)=>event.lessonId));
    const last = ordered.filter((event)=>event.kind === "practice" || event.kind === "mastery").at(-1);
    return {
        tracks,
        completed,
        total: ids.size,
        percent: ids.size ? Math.round(completed / ids.size * 100) : 0,
        history,
        lastPractice: last?.day ?? null,
        hasPracticeHistory: achievedIds.size > 0
    };
}
}),
"[project]/components/RecallCheck.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RecallCheck",
    ()=>RecallCheck
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$useRecallEntries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/recall/useRecallEntries.ts [app-ssr] (ecmascript)");
// components/RecallCheck.tsx
//
// UI-Karte "Was solltest du heute wiederholen?" — im Stil der
// bestehenden Tages-Karten (Design 1, Woche 1, ...).
//
// Einbindung z. B. im Dashboard, direkt unter der Fokus-Karte:
//   import { RecallCheck } from '@/components/RecallCheck';
//   <RecallCheck />
'use client';
;
;
;
function RecallCheck() {
    const { dueToday, hydrated, submitReview } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$recall$2f$useRecallEntries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRecallEntries"])();
    const [activeId, setActiveId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [recallFA, setRecallFA] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [recallDE, setRecallDE] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [showOriginal, setShowOriginal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const activeEntry = dueToday.find((e)=>e.id === activeId) ?? null;
    function handleSubmit(confidence) {
        if (!activeEntry) return;
        submitReview(activeEntry.id, recallFA, recallDE, confidence);
        setShowOriginal(true);
    }
    function resetAndClose() {
        setActiveId(null);
        setRecallFA('');
        setRecallDE('');
        setShowOriginal(false);
    }
    // Die Einträge liegen im localStorage und stehen erst nach dem ersten
    // Client-Render bereit. Ohne diese Prüfung blitzt "keine Wiederholung"
    // kurz auf, obwohl Konzepte fällig sind.
    if (!hydrated) return null;
    if (dueToday.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500",
            children: "Heute keine Wiederholung fällig."
        }, void 0, false, {
            fileName: "[project]/components/RecallCheck.tsx",
            lineNumber: 45,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-xl border border-purple-200 bg-white shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border-b border-purple-100 px-4 py-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "font-semibold text-purple-900",
                        children: "Was solltest du heute wiederholen?"
                    }, void 0, false, {
                        fileName: "[project]/components/RecallCheck.tsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-slate-500",
                        children: [
                            dueToday.length,
                            " Konzept(e) fällig"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/RecallCheck.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/RecallCheck.tsx",
                lineNumber: 53,
                columnNumber: 7
            }, this),
            !activeEntry ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "divide-y divide-slate-100",
                children: dueToday.map((entry)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: "flex items-center justify-between px-4 py-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm font-medium text-slate-800",
                                        children: entry.concept
                                    }, void 0, false, {
                                        fileName: "[project]/components/RecallCheck.tsx",
                                        lineNumber: 70,
                                        columnNumber: 17
                                    }, this),
                                    entry.sourceId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-slate-400",
                                        children: entry.sourceId
                                    }, void 0, false, {
                                        fileName: "[project]/components/RecallCheck.tsx",
                                        lineNumber: 74,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/RecallCheck.tsx",
                                lineNumber: 69,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>setActiveId(entry.id),
                                className: "rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700",
                                children: "Wiederholung starten"
                            }, void 0, false, {
                                fileName: "[project]/components/RecallCheck.tsx",
                                lineNumber: 77,
                                columnNumber: 15
                            }, this)
                        ]
                    }, entry.id, true, {
                        fileName: "[project]/components/RecallCheck.tsx",
                        lineNumber: 65,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/components/RecallCheck.tsx",
                lineNumber: 63,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-4 p-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm font-semibold text-slate-800",
                                children: activeEntry.concept
                            }, void 0, false, {
                                fileName: "[project]/components/RecallCheck.tsx",
                                lineNumber: 90,
                                columnNumber: 13
                            }, this),
                            activeEntry.sourceId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-slate-400",
                                children: activeEntry.sourceId
                            }, void 0, false, {
                                fileName: "[project]/components/RecallCheck.tsx",
                                lineNumber: 94,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/RecallCheck.tsx",
                        lineNumber: 89,
                        columnNumber: 11
                    }, this),
                    !showOriginal ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "recall-fa",
                                        className: "mb-1 block text-xs font-medium text-slate-600",
                                        children: "فارسی"
                                    }, void 0, false, {
                                        fileName: "[project]/components/RecallCheck.tsx",
                                        lineNumber: 101,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        id: "recall-fa",
                                        value: recallFA,
                                        onChange: (e)=>setRecallFA(e.target.value),
                                        dir: "rtl",
                                        rows: 3,
                                        className: "w-full rounded-lg border border-slate-200 p-2 text-sm",
                                        placeholder: "بدون نگاه به متن، از حافظه بنویس..."
                                    }, void 0, false, {
                                        fileName: "[project]/components/RecallCheck.tsx",
                                        lineNumber: 104,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/RecallCheck.tsx",
                                lineNumber: 100,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "recall-de",
                                        className: "mb-1 block text-xs font-medium text-slate-600",
                                        children: "Deutsch"
                                    }, void 0, false, {
                                        fileName: "[project]/components/RecallCheck.tsx",
                                        lineNumber: 116,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        id: "recall-de",
                                        value: recallDE,
                                        onChange: (e)=>setRecallDE(e.target.value),
                                        rows: 3,
                                        className: "w-full rounded-lg border border-slate-200 p-2 text-sm",
                                        placeholder: "Schreibe es auf Deutsch, ohne nachzuschauen..."
                                    }, void 0, false, {
                                        fileName: "[project]/components/RecallCheck.tsx",
                                        lineNumber: 119,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/RecallCheck.tsx",
                                lineNumber: 115,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mb-2 text-xs font-medium text-slate-600",
                                        children: "Wie sicher warst du?"
                                    }, void 0, false, {
                                        fileName: "[project]/components/RecallCheck.tsx",
                                        lineNumber: 130,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>handleSubmit('weak'),
                                                className: "flex-1 rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-medium text-red-700 hover:bg-red-100",
                                                children: "Schwach"
                                            }, void 0, false, {
                                                fileName: "[project]/components/RecallCheck.tsx",
                                                lineNumber: 134,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>handleSubmit('medium'),
                                                className: "flex-1 rounded-lg border border-amber-200 bg-amber-50 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100",
                                                children: "Mittel"
                                            }, void 0, false, {
                                                fileName: "[project]/components/RecallCheck.tsx",
                                                lineNumber: 141,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>handleSubmit('good'),
                                                className: "flex-1 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100",
                                                children: "Gut"
                                            }, void 0, false, {
                                                fileName: "[project]/components/RecallCheck.tsx",
                                                lineNumber: 148,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/RecallCheck.tsx",
                                        lineNumber: 133,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/RecallCheck.tsx",
                                lineNumber: 129,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-lg bg-slate-50 p-3 text-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mb-1 text-xs font-semibold text-slate-500",
                                        children: "Deine Antwort"
                                    }, void 0, false, {
                                        fileName: "[project]/components/RecallCheck.tsx",
                                        lineNumber: 161,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        dir: "rtl",
                                        className: "text-slate-700",
                                        children: recallFA || '—'
                                    }, void 0, false, {
                                        fileName: "[project]/components/RecallCheck.tsx",
                                        lineNumber: 164,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 text-slate-700",
                                        children: recallDE || '—'
                                    }, void 0, false, {
                                        fileName: "[project]/components/RecallCheck.tsx",
                                        lineNumber: 167,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/RecallCheck.tsx",
                                lineNumber: 160,
                                columnNumber: 15
                            }, this),
                            (activeEntry.originalNoteFA || activeEntry.originalNoteDE) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-lg border border-purple-100 bg-purple-50 p-3 text-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mb-1 text-xs font-semibold text-purple-600",
                                        children: "Originalnotiz (Tag 0)"
                                    }, void 0, false, {
                                        fileName: "[project]/components/RecallCheck.tsx",
                                        lineNumber: 172,
                                        columnNumber: 19
                                    }, this),
                                    activeEntry.originalNoteFA && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        dir: "rtl",
                                        className: "text-slate-700",
                                        children: activeEntry.originalNoteFA
                                    }, void 0, false, {
                                        fileName: "[project]/components/RecallCheck.tsx",
                                        lineNumber: 176,
                                        columnNumber: 21
                                    }, this),
                                    activeEntry.originalNoteDE && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 text-slate-700",
                                        children: activeEntry.originalNoteDE
                                    }, void 0, false, {
                                        fileName: "[project]/components/RecallCheck.tsx",
                                        lineNumber: 181,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/RecallCheck.tsx",
                                lineNumber: 171,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: resetAndClose,
                                className: "w-full rounded-lg bg-purple-600 py-2 text-sm font-medium text-white hover:bg-purple-700",
                                children: "Weiter"
                            }, void 0, false, {
                                fileName: "[project]/components/RecallCheck.tsx",
                                lineNumber: 188,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/RecallCheck.tsx",
                        lineNumber: 159,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/RecallCheck.tsx",
                lineNumber: 88,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/RecallCheck.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=_0951jyy._.js.map