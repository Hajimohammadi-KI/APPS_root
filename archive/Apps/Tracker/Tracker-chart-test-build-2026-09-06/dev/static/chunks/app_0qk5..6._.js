(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/projekt-fahrplan/roadmap-client.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProjectRoadmap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plan$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/plan-data.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$study$2d$progress$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/study-progress.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const ROADMAP_STAGES = [
    {
        id: "design",
        title: "Design",
        blurb: "Problem, Architektur und Evaluation werden in vier Projektschritten pro Woche aufgebaut; jeder fünfte Tag integriert und prüft die Ergebnisse.",
        start: 1,
        end: 9
    },
    {
        id: "extraktion",
        title: "Extraktion",
        blurb: "NLP-Lab-Integration, Roslyn-Syntax/Semantik und EF Core READ/WRITE bis zur Table-Ebene.",
        start: 10,
        end: 18
    },
    {
        id: "graph-retrieval",
        title: "Graph & Retrieval",
        blurb: "Evidence Model, Neo4j-Graph, Flat- vs. Graph-Retrieval und Query Contracts.",
        start: 19,
        end: 24
    },
    {
        id: "evaluation",
        title: "Evaluation",
        blurb: "Goldstandard, RQ1/RQ2-Messung, rollenbasierte Antworten und Threats to Validity.",
        start: 25,
        end: 30
    },
    {
        id: "abgabe",
        title: "Abgabe",
        blurb: "Thesis-Kapitel, Replikationspaket, Demo und die beiden Puffer bis zur finalen Übergabe.",
        start: 31,
        end: 37
    }
];
function weekOutputTotal(week) {
    return week.days.reduce((sum, day)=>sum + (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$study$2d$progress$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["outputTotal"])(day), 0);
}
function weekCompletedOutputs(week, completed) {
    return week.days.reduce((sum, day)=>sum + (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$study$2d$progress$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["countCompletedOutputs"])(day, completed), 0);
}
function isDayDone(day, completed) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$study$2d$progress$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["countCompletedOutputs"])(day, completed) === (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$study$2d$progress$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["outputTotal"])(day);
}
function ProjectRoadmap({ completed, loading, planStatus, onOpenDay, onToggleDay }) {
    _s();
    const [pendingDayId, setPendingDayId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [openWeeks, setOpenWeeks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "ProjectRoadmap.useState": ()=>new Set([
                1
            ])
    }["ProjectRoadmap.useState"]);
    const totalOutputs = __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plan$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allDays"].reduce((sum, day)=>sum + (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$study$2d$progress$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["outputTotal"])(day), 0);
    const totalCompleted = __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plan$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allDays"].reduce((sum, day)=>sum + (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$study$2d$progress$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["countCompletedOutputs"])(day, completed), 0);
    const overallPercent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$study$2d$progress$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["percentComplete"])(totalCompleted, totalOutputs);
    function toggleWeek(weekNumber) {
        setOpenWeeks((current)=>{
            const next = new Set(current);
            if (next.has(weekNumber)) next.delete(weekNumber);
            else next.add(weekNumber);
            return next;
        });
    }
    async function toggleDay(day) {
        if (pendingDayId) return;
        setPendingDayId(day.id);
        try {
            await onToggleDay(day, !isDayDone(day, completed));
        } finally{
            setPendingDayId(null);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "project-roadmap",
        "aria-labelledby": "project-roadmap-title",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "roadmap-hero roadmap-hero--embedded",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "roadmap-eyebrow",
                                children: "Im Projekt-Lernplan integriert"
                            }, void 0, false, {
                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                lineNumber: 119,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                id: "project-roadmap-title",
                                children: "Projekt-Fahrplan"
                            }, void 0, false, {
                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                lineNumber: 120,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "roadmap-lead",
                                children: [
                                    __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plan$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["planMeta"].totalWeeks,
                                    " kapazitätsbasierte Wochen als scannbare Roadmap in fünf Etappen. Jede Woche verbindet Forschung, Projektarbeit und einen prüfbaren Wochenbeleg."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                lineNumber: 121,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                        lineNumber: 118,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: "roadmap-progress",
                        "aria-label": "Gesamtfortschritt im Projekt-Fahrplan",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "roadmap-ring",
                                style: {
                                    "--progress": `${overallPercent * 3.6}deg`
                                },
                                role: "img",
                                "aria-label": `Gesamtfortschritt: ${overallPercent} Prozent`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: [
                                                overallPercent,
                                                "%"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                            lineNumber: 134,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                            children: [
                                                __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plan$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["planMeta"].totalDays,
                                                " Tage"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                            lineNumber: 135,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                    lineNumber: 133,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                lineNumber: 127,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: `roadmap-plan-state ${planStatus}`,
                                children: planStatus === "running" ? "Lernplan aktiv" : planStatus === "paused" ? "Pausiert · Fortschritt manuell erfassbar" : "Noch nicht gestartet · Fortschritt manuell erfassbar"
                            }, void 0, false, {
                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                lineNumber: 138,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                        lineNumber: 126,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                lineNumber: 117,
                columnNumber: 7
            }, this),
            loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "roadmap-loading",
                children: "Fortschritt wird geladen…"
            }, void 0, false, {
                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                lineNumber: 148,
                columnNumber: 18
            }, this) : null,
            planStatus !== "running" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "roadmap-guidance",
                role: "note",
                children: "Du kannst Häkchen jederzeit setzen oder entfernen. Der Fortschritt wird im Projekt-Lernplan gespeichert; Startdatum und Kalender bleiben unverändert."
            }, void 0, false, {
                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                lineNumber: 150,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                className: "roadmap-stages",
                children: ROADMAP_STAGES.map((stage, stageIndex)=>{
                    const stageWeeks = __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plan$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["planWeeks"].filter((week)=>week.number >= stage.start && week.number <= stage.end);
                    const stageTotal = stageWeeks.reduce((sum, week)=>sum + weekOutputTotal(week), 0);
                    const stageDone = stageWeeks.reduce((sum, week)=>sum + weekCompletedOutputs(week, completed), 0);
                    const stagePercent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$study$2d$progress$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["percentComplete"])(stageDone, stageTotal);
                    const stageComplete = stageTotal > 0 && stageDone === stageTotal;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: `roadmap-stage ${stageComplete ? "is-done" : ""}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "roadmap-stage-header",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "roadmap-stage-number",
                                        "aria-hidden": "true",
                                        children: stageIndex + 1
                                    }, void 0, false, {
                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                        lineNumber: 175,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "roadmap-stage-titles",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                children: [
                                                    stage.title,
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                        children: [
                                                            "Woche ",
                                                            stage.start,
                                                            "–",
                                                            stage.end
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                        lineNumber: 181,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                lineNumber: 179,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                children: stage.blurb
                                            }, void 0, false, {
                                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                lineNumber: 183,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                        lineNumber: 178,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "roadmap-stage-bar",
                                        "aria-hidden": "true",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                width: `${stagePercent}%`
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                            lineNumber: 186,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                        lineNumber: 185,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "roadmap-stage-percent",
                                        children: [
                                            stagePercent,
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                        lineNumber: 188,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                lineNumber: 174,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                                className: "roadmap-weeks",
                                children: stageWeeks.map((week)=>{
                                    const weekTotal = weekOutputTotal(week);
                                    const weekDone = weekCompletedOutputs(week, completed);
                                    const weekPercent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$study$2d$progress$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["percentComplete"])(weekDone, weekTotal);
                                    const weekComplete = weekTotal > 0 && weekDone === weekTotal;
                                    const weeklyOutputDay = week.days.find((day)=>day.id === week.weeklyOutput.dayId);
                                    const weeklyOutputDone = isDayDone(weeklyOutputDay, completed);
                                    const open = openWeeks.has(week.number);
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        className: `roadmap-week ${weekComplete ? "is-done" : ""}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: "roadmap-week-header",
                                                "aria-expanded": open,
                                                "aria-controls": `roadmap-week-${week.number}`,
                                                onClick: ()=>toggleWeek(week.number),
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "roadmap-week-number",
                                                        children: [
                                                            "W",
                                                            week.number
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                        lineNumber: 210,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "roadmap-week-titles",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                children: week.title
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                                lineNumber: 212,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                children: [
                                                                    week.phase,
                                                                    " · Wochenoutput ",
                                                                    weeklyOutputDone ? "erledigt" : "offen"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                                lineNumber: 213,
                                                                columnNumber: 27
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                        lineNumber: 211,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "roadmap-week-percent",
                                                        children: [
                                                            weekPercent,
                                                            "%"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                        lineNumber: 215,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "roadmap-week-caret",
                                                        "aria-hidden": "true",
                                                        children: open ? "Schließen" : "Öffnen"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                        lineNumber: 216,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                lineNumber: 203,
                                                columnNumber: 23
                                            }, this),
                                            open ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "roadmap-week-body",
                                                id: `roadmap-week-${week.number}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "roadmap-week-goal",
                                                        children: week.goal
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                        lineNumber: 223,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                                                        className: `roadmap-weekly-output ${weeklyOutputDone ? "is-done" : ""}`,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: "Mindestens 1 verbindlicher Wochenoutput"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                                lineNumber: 225,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                children: week.weeklyOutput.deliverable
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                                lineNumber: 226,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                type: "button",
                                                                onClick: ()=>onOpenDay(weeklyOutputDay),
                                                                children: "Zugehörigen Tag öffnen"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                                lineNumber: 227,
                                                                columnNumber: 29
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                        lineNumber: 224,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                        className: "roadmap-day-list",
                                                        children: week.days.map((day)=>{
                                                            const done = isDayDone(day, completed);
                                                            const started = !done && (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$study$2d$progress$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["countCompletedItems"])(day, completed) > 0;
                                                            const checkboxId = `roadmap-day-${day.id}`;
                                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                className: `roadmap-day ${done ? "is-done" : ""} ${started ? "is-started" : ""} ${day.id === week.weeklyOutput.dayId ? "is-weekly-output" : ""}`,
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                        id: checkboxId,
                                                                        type: "checkbox",
                                                                        checked: done,
                                                                        disabled: pendingDayId === day.id,
                                                                        onChange: ()=>void toggleDay(day)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                                        lineNumber: 241,
                                                                        columnNumber: 35
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "roadmap-day-copy",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                htmlFor: checkboxId,
                                                                                children: [
                                                                                    day.id === week.weeklyOutput.dayId ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                                                                        children: "Verbindlicher Wochenoutput"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                                                        lineNumber: 250,
                                                                                        columnNumber: 77
                                                                                    }, this) : null,
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                                        children: day.title
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                                                        lineNumber: 251,
                                                                                        columnNumber: 39
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                                        children: [
                                                                                            day.deliverable,
                                                                                            day.workMode === "paper" ? " · Papiermodus" : ""
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                                                        lineNumber: 252,
                                                                                        columnNumber: 39
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                                                lineNumber: 249,
                                                                                columnNumber: 37
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                type: "button",
                                                                                onClick: ()=>onOpenDay(day),
                                                                                children: "Tagesdetails öffnen"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                                                lineNumber: 254,
                                                                                columnNumber: 37
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                                        lineNumber: 248,
                                                                        columnNumber: 35
                                                                    }, this)
                                                                ]
                                                            }, day.id, true, {
                                                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                                lineNumber: 237,
                                                                columnNumber: 33
                                                            }, this);
                                                        })
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                        lineNumber: 231,
                                                        columnNumber: 27
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                                lineNumber: 222,
                                                columnNumber: 25
                                            }, this) : null
                                        ]
                                    }, week.phaseId, true, {
                                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                        lineNumber: 202,
                                        columnNumber: 21
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                                lineNumber: 191,
                                columnNumber: 15
                            }, this)
                        ]
                    }, stage.id, true, {
                        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                        lineNumber: 173,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
                lineNumber: 156,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/projekt-fahrplan/roadmap-client.tsx",
        lineNumber: 116,
        columnNumber: 5
    }, this);
}
_s(ProjectRoadmap, "x2GwocysNTYTOou1QUw/SPD9aVw=");
_c = ProjectRoadmap;
var _c;
__turbopack_context__.k.register(_c, "ProjectRoadmap");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/career-plan.json.[json].cjs [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = JSON.parse("{\"id\":\"career-six-months-2026\",\"version\":2,\"start\":\"2026-09-06\",\"end\":\"2027-03-06\",\"title\":\"Vom Thesis-Lernplan zu Portfolio und Bewerbung\",\"breaks\":[{\"start\":\"2026-09-10\",\"end\":\"2026-09-24\",\"title\":\"Geplante Ruhephase 1\"},{\"start\":\"2026-09-29\",\"end\":\"2026-10-13\",\"title\":\"Geplante Ruhephase 2\"}],\"assumptions\":{\"country\":\"Deutschland\",\"currency\":\"EUR\",\"annualGrossTarget\":70000,\"role\":\"C#/.NET Backend Developer mit einem Projekt zur Code- und Datenanalyse\",\"status\":\"Vorläufige Planung: Land, Berufserfahrung, Deutschniveau und verfügbare Wochenstunden sind noch nicht bestätigt.\"},\"capacity\":\"Bis Ende Oktober bleiben die aktiven Tage und Ruhephasen der ursprünglichen Roadmap erhalten. An jedem aktiven Tag sind 150 Minuten Facharbeit und 30 Minuten Deutsch vorgesehen, einschließlich Wiederholung und mit Pausen. Ab November sind das bei fünf Tagen insgesamt 15 Stunden pro Woche, davon 2,5 Stunden Deutsch. Die Bachelorarbeit und Bewerbungen zählen in dieses Budget. Bei weniger Zeit wird der Umfang reduziert und der Zeitplan neu geprüft. Keine komprimierten Nachholtage.\",\"salaryNote\":\"70.000 Euro Jahresbrutto bleiben ein ambitioniertes Ziel, besonders bei einem Einstieg ohne Berufserfahrung. Marktdaten sind keine persönliche Gehaltsprognose. Prüfe das Ziel in Woche 13, 20 und 26 anhand eigener Leistungen und tatsächlicher Rückmeldungen.\",\"sources\":[{\"title\":\"BA Entgeltatlas 2025: Softwareentwicklung, Experte\",\"url\":\"https://web.arbeitsagentur.de/entgeltatlas/tabelle?alter=1&branche=1&dkz=15260&geschlecht=1\",\"checked\":\"2026-09-06\",\"note\":\"Beobachteter Monatsmedian: 6.301 Euro brutto für hoch komplexe Softwareentwicklung in Deutschland, über verschiedene Erfahrungsstufen hinweg. Kein Einstiegsgehalt.\"},{\"title\":\"Stepstone: Software-Entwickler/in\",\"url\":\"https://www.stepstone.de/gehalt/Software-Entwickler-in.html\",\"checked\":\"2026-09-06\",\"note\":\"Beim Abruf am 6. September 2026: Jahresmedian 51.200 Euro, Einstieg ungefähr 48.000 Euro. Datenbasis und Methode unterscheiden sich vom Entgeltatlas.\"},{\"title\":\"adesso: Bewerbungs-FAQ\",\"url\":\"https://www.adesso.de/de/jobs-karriere/faqs/index.jsp\",\"checked\":\"2026-09-06\",\"note\":\"Dieser Arbeitgeber verlangt für deutschsprachige Kundenprojekte sehr gute Deutschkenntnisse. Prüfe die Sprachvorgaben jeder konkreten Anzeige.\"}],\"weeks\":[{\"number\":1,\"start\":\"2026-09-06\",\"end\":\"2026-09-12\",\"phase\":\"Grundlagen und Vorbereitung der Verteidigung\",\"title\":\"D01, D02, D03, D04 · ursprüngliche Roadmap\",\"gate\":\"Bearbeite die tatsächlichen Übungen. Gehe erst weiter, wenn die Voraussetzungen verstanden sind.\",\"days\":[{\"id\":\"D01\",\"date\":\"2026-09-06\",\"title\":\"Das Projekt verstehen und das erste Programm starten\",\"core\":true,\"lessonIds\":[\"D01-L1\",\"D01-L2\",\"D01-L3\",\"D01-L4\"],\"action\":\"Erkläre das Problem in 60 Sekunden und zeige eine eigene Änderung am kleinen Programm.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D02\",\"date\":\"2026-09-07\",\"title\":\"Von einfachen Werten zu Klassen und Objekten\",\"core\":true,\"lessonIds\":[\"D02-L1\",\"D02-L2\",\"D02-L3\"],\"action\":\"Eine Klasse Patient, zwei Instanzen und eine selbst erklärte Methode.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D03\",\"date\":\"2026-09-08\",\"title\":\"Datenbanken von Grund auf\",\"core\":true,\"lessonIds\":[\"D03-L1\",\"D03-L2\",\"D03-L3\"],\"action\":\"Zwei kleine Tabellen, ihre Beziehung und vier einfache SQL-Anweisungen.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D04\",\"date\":\"2026-09-09\",\"title\":\"Klasse, Entity und Tabelle im Thesis-Projekt\",\"core\":true,\"lessonIds\":[\"D04-L1\",\"D04-L2\",\"D04-L3\"],\"action\":\"Ein Diagramm Object → Entity/ORM → Table und eine kurze eigene Erklärung.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W01\",\"title\":\"Deutsch: Ausgangspunkt und Selbstvorstellung\",\"date\":\"2026-09-09\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W01\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Ausgangspunkt und Selbstvorstellung. Grammatikfokus: Verb an zweiter Stelle; einfache Fragen. Sprechaufgabe: Stelle dich 60 Sekunden vor und erkläre in drei Sätzen, woran du lernst. Schreibaufgabe: Schreibe 60 bis 80 Wörter über dein Lernziel. Beantworte fünf Rückfragen. Lege danach mit dem Tutor eine passende Schwierigkeit fest.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Verb an zweiter Stelle; einfache Fragen\",\"speaking\":\"Stelle dich 60 Sekunden vor und erkläre in drei Sätzen, woran du lernst.\",\"writing\":\"Schreibe 60 bis 80 Wörter über dein Lernziel. Beantworte fünf Rückfragen. Lege danach mit dem Tutor eine passende Schwierigkeit fest.\"}},{\"number\":2,\"start\":\"2026-09-13\",\"end\":\"2026-09-19\",\"phase\":\"Grundlagen und Vorbereitung der Verteidigung\",\"title\":\"Geplante Ruhephase\",\"gate\":\"Keine neuen Aufgaben. Rückkehr entsprechend deinen tatsächlichen Einschränkungen.\",\"days\":[],\"german\":null},{\"number\":3,\"start\":\"2026-09-20\",\"end\":\"2026-09-26\",\"phase\":\"Grundlagen und Vorbereitung der Verteidigung\",\"title\":\"D05, D06 · ursprüngliche Roadmap\",\"gate\":\"Bearbeite die tatsächlichen Übungen. Gehe erst weiter, wenn die Voraussetzungen verstanden sind.\",\"days\":[{\"id\":\"D05\",\"date\":\"2026-09-25\",\"title\":\"Entity Framework verstehen\",\"core\":true,\"lessonIds\":[\"D05-L1\",\"D05-L2\",\"D05-L3\"],\"action\":\"Ein sehr kleines Beispiel mit erkennbarer Entity, DbContext und DbSet.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D06\",\"date\":\"2026-09-26\",\"title\":\"Mapping und tatsächliche Tabellennamen\",\"core\":true,\"lessonIds\":[\"D06-L1\",\"D06-L2\"],\"action\":\"Ein Mapping Patient → Patients mit genauer Fundstelle.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W03\",\"title\":\"Deutsch: Begriffe verständlich erklären\",\"date\":\"2026-09-26\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W03\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Begriffe verständlich erklären. Grammatikfokus: Artikel, Singular und Plural. Sprechaufgabe: Erkläre Klasse, Objekt und Tabelle ohne auswendig gelernten Text. Schreibaufgabe: Schreibe fünf eigene Definitionen mit einem Beispiel.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Artikel, Singular und Plural\",\"speaking\":\"Erkläre Klasse, Objekt und Tabelle ohne auswendig gelernten Text.\",\"writing\":\"Schreibe fünf eigene Definitionen mit einem Beispiel.\"}},{\"number\":4,\"start\":\"2026-09-27\",\"end\":\"2026-10-03\",\"phase\":\"Grundlagen und Vorbereitung der Verteidigung\",\"title\":\"D07, D08 · ursprüngliche Roadmap\",\"gate\":\"Bearbeite die tatsächlichen Übungen. Gehe erst weiter, wenn die Voraussetzungen verstanden sind.\",\"days\":[{\"id\":\"D07\",\"date\":\"2026-09-27\",\"title\":\"Software Engineering in einfachen Worten\",\"core\":true,\"lessonIds\":[\"D07-L1\",\"D07-L2\",\"D07-L3\"],\"action\":\"Problem → Requirements → Design → Implementation → Test an einem Beispiel.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D08\",\"date\":\"2026-09-28\",\"title\":\"Die tatsächlichen Use Cases\",\"core\":true,\"lessonIds\":[\"D08-L1\",\"D08-L2\",\"D08-L3\"],\"action\":\"Ein erster UC-01 mit Normalfall, unbekanntem Ergebnis und Abnahmekriterium.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W04\",\"title\":\"Deutsch: Über Aufgaben und Ziele sprechen\",\"date\":\"2026-09-28\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W04\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Über Aufgaben und Ziele sprechen. Grammatikfokus: weil und deshalb. Sprechaufgabe: Erkläre einem Kollegen den Zweck eines Use Cases. Schreibaufgabe: Schreibe eine kurze Nachricht mit Ziel, Problem und Bitte.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"weil und deshalb\",\"speaking\":\"Erkläre einem Kollegen den Zweck eines Use Cases.\",\"writing\":\"Schreibe eine kurze Nachricht mit Ziel, Problem und Bitte.\"}},{\"number\":5,\"start\":\"2026-10-04\",\"end\":\"2026-10-10\",\"phase\":\"Grundlagen und Vorbereitung der Verteidigung\",\"title\":\"Geplante Ruhephase\",\"gate\":\"Keine neuen Aufgaben. Rückkehr entsprechend deinen tatsächlichen Einschränkungen.\",\"days\":[],\"german\":null},{\"number\":6,\"start\":\"2026-10-11\",\"end\":\"2026-10-17\",\"phase\":\"Grundlagen und Vorbereitung der Verteidigung\",\"title\":\"D09, D10, D11, D12 · ursprüngliche Roadmap\",\"gate\":\"Bearbeite die tatsächlichen Übungen. Gehe erst weiter, wenn die Voraussetzungen verstanden sind.\",\"days\":[{\"id\":\"D09\",\"date\":\"2026-10-14\",\"title\":\"Wiedereinstieg, Anforderungen und Umfang\",\"core\":true,\"lessonIds\":[\"D09-L1\",\"D09-L2\",\"D09-L3\"],\"action\":\"Drei überprüfbare Anforderungen, Grenzen und offene Fragen für die Betreuung.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D10\",\"date\":\"2026-10-15\",\"title\":\"Domänenmodell und eindeutige Identität\",\"core\":true,\"lessonIds\":[\"D10-L1\",\"D10-L2\",\"D10-L3\"],\"action\":\"Knotentypen, Beziehungen und die Identität von Repository und Snapshot.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D11\",\"date\":\"2026-10-16\",\"title\":\"Architektur und Weg zur Antwort\",\"core\":true,\"lessonIds\":[\"D11-L1\",\"D11-L2\",\"D11-L3\"],\"action\":\"Eine Architekturfolie mit Eingaben, Ausgaben und Zuständigkeiten.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D12\",\"date\":\"2026-10-17\",\"title\":\"READ und die Ausführung einer Query\",\"core\":true,\"lessonIds\":[\"D12-L1\",\"D12-L2\"],\"action\":\"Zwei Beispiele: Query-Kandidat und unterstütztes Ausführungsmuster.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W06\",\"title\":\"Deutsch: Abläufe beschreiben\",\"date\":\"2026-10-17\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W06\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Abläufe beschreiben. Grammatikfokus: zuerst, danach, anschließend; Verbposition. Sprechaufgabe: Beschreibe den Weg vom Code zur Datenbank und beantworte zwei Rückfragen. Schreibaufgabe: Schreibe eine Anleitung in sechs Schritten.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"zuerst, danach, anschließend; Verbposition\",\"speaking\":\"Beschreibe den Weg vom Code zur Datenbank und beantworte zwei Rückfragen.\",\"writing\":\"Schreibe eine Anleitung in sechs Schritten.\"}},{\"number\":7,\"start\":\"2026-10-18\",\"end\":\"2026-10-24\",\"phase\":\"Grundlagen und Vorbereitung der Verteidigung\",\"title\":\"D13, D14, D15, D16, D17, D18, D19 · ursprüngliche Roadmap\",\"gate\":\"Bearbeite die tatsächlichen Übungen. Gehe erst weiter, wenn die Voraussetzungen verstanden sind.\",\"days\":[{\"id\":\"D13\",\"date\":\"2026-10-18\",\"title\":\"WRITE und SaveChanges\",\"core\":true,\"lessonIds\":[\"D13-L1\",\"D13-L2\",\"D13-L3\"],\"action\":\"Speicheränderung und Speicherpfad mit klaren Aussagegrenzen.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D14\",\"date\":\"2026-10-19\",\"title\":\"Statische Analyse von Grund auf\",\"core\":true,\"lessonIds\":[\"D14-L1\",\"D14-L2\",\"D14-L3\"],\"action\":\"Eine kleine manuelle Analyse mit Beobachtung, Ableitung und Grenze.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D15\",\"date\":\"2026-10-20\",\"title\":\"Roslyn: vom Quelltext zum Syntaxbaum\",\"core\":true,\"lessonIds\":[\"D15-L1\",\"D15-L2\"],\"action\":\"Ein einfacher Aufrufbaum und die Rolle der Syntax in der Architektur.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D16\",\"date\":\"2026-10-21\",\"title\":\"Roslyn: Symbol und Semantic Model\",\"core\":true,\"lessonIds\":[\"D16-L1\",\"D16-L2\"],\"action\":\"Ein Beispiel für sichtbaren Namen und tatsächlich aufgelöstes Symbol.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D17\",\"date\":\"2026-10-22\",\"title\":\"Nachweise und belastbare Antworten\",\"core\":true,\"lessonIds\":[\"D17-L1\",\"D17-L2\",\"D17-L3\"],\"action\":\"Ein Evidence Record und drei unterschiedlich gut gestützte Antworten.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D18\",\"date\":\"2026-10-23\",\"title\":\"Graph, Neo4j und Cypher\",\"core\":true,\"lessonIds\":[\"D18-L1\",\"D18-L2\",\"D18-L3\"],\"action\":\"Das gemeinsame Beispiel als Graph und eine einfache konzeptionelle Abfrage.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D19\",\"date\":\"2026-10-24\",\"title\":\"Retrieval und faire Baselines\",\"core\":true,\"lessonIds\":[\"D19-L1\",\"D19-L2\",\"D19-L3\"],\"action\":\"Ein Vergleich von RQ1 und RQ2 unter festen Versuchsbedingungen.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W07\",\"title\":\"Deutsch: Diagramme und Nachweise erklären\",\"date\":\"2026-10-24\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W07\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Diagramme und Nachweise erklären. Grammatikfokus: Relativsätze in einfachen Formen. Sprechaufgabe: Erkläre ein Diagramm und unterscheide Beobachtung von Vermutung. Schreibaufgabe: Schreibe eine kurze Beschreibung mit einer klaren Einschränkung.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Relativsätze in einfachen Formen\",\"speaking\":\"Erkläre ein Diagramm und unterscheide Beobachtung von Vermutung.\",\"writing\":\"Schreibe eine kurze Beschreibung mit einer klaren Einschränkung.\"}},{\"number\":8,\"start\":\"2026-10-25\",\"end\":\"2026-10-31\",\"phase\":\"Grundlagen und Vorbereitung der Verteidigung\",\"title\":\"D20, D21, D22, D23, D24, D25, D26 · ursprüngliche Roadmap\",\"gate\":\"Bearbeite die tatsächlichen Übungen. Gehe erst weiter, wenn die Voraussetzungen verstanden sind.\",\"days\":[{\"id\":\"D20\",\"date\":\"2026-10-25\",\"title\":\"Evaluation an einem Zahlenbeispiel\",\"core\":true,\"lessonIds\":[\"D20-L1\",\"D20-L2\",\"D20-L3\"],\"action\":\"Precision, Recall und F1 berechnen und Fehler kurz analysieren.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D21\",\"date\":\"2026-10-26\",\"title\":\"Design Science und Zwischenprüfung\",\"core\":true,\"lessonIds\":[\"D21-L1\",\"D21-L2\",\"D21-L3\"],\"action\":\"Guidelines konkreten Entscheidungen zuordnen und Fragen selbst beantworten.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D22\",\"date\":\"2026-10-27\",\"title\":\"Die wissenschaftliche Geschichte auf Deutsch\",\"core\":true,\"lessonIds\":[\"D22-L1\",\"D22-L2\",\"D22-L3\"],\"action\":\"Eine selbst formulierte deutsche Gliederung. Heute keine Folien erstellen.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D23\",\"date\":\"2026-10-28\",\"title\":\"Eine kurze Präsentation auf Englisch üben\",\"core\":true,\"lessonIds\":[\"D23-L1\",\"D23-L2\",\"D23-L3\"],\"action\":\"Eine kurze englische Präsentation mit Korrektur nach deinem eigenen Versuch.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D24\",\"date\":\"2026-10-29\",\"title\":\"Eine kurze Präsentation auf Deutsch üben\",\"core\":true,\"lessonIds\":[\"D24-L1\",\"D24-L2\",\"D24-L3\"],\"action\":\"Eine deutsche Probepräsentation mit nachvollziehbaren Korrekturen.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D25\",\"date\":\"2026-10-30\",\"title\":\"Probeverteidigung und gezielte Korrektur\",\"core\":true,\"lessonIds\":[\"D25-L1\",\"D25-L2\",\"D25-L3\"],\"action\":\"Ein zeitlich begrenzter Probelauf mit schwierigen Fragen und verbesserten Antworten.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"D26\",\"date\":\"2026-10-31\",\"title\":\"Abschließende Bereitschaftsprüfung\",\"core\":true,\"lessonIds\":[\"D26-L1\",\"D26-L2\"],\"action\":\"Eine ehrliche Diagnose und eine kurze Wiederholungsliste vor dem Termin.\",\"acceptance\":\"Dokumentiere die eigene Übung jedes Teilthemas in der Roadmap.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W08\",\"title\":\"Deutsch: Die Bachelorarbeit vorstellen\",\"date\":\"2026-10-31\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W08\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Die Bachelorarbeit vorstellen. Grammatikfokus: Nebensätze; klare Satzverknüpfungen. Sprechaufgabe: Halte eine dreiminütige Projektvorstellung und beantworte drei ungeplante Fragen. Schreibaufgabe: Überarbeite eine Zusammenfassung nach Rückmeldung.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Nebensätze; klare Satzverknüpfungen\",\"speaking\":\"Halte eine dreiminütige Projektvorstellung und beantworte drei ungeplante Fragen.\",\"writing\":\"Überarbeite eine Zusammenfassung nach Rückmeldung.\"}},{\"number\":9,\"start\":\"2026-11-01\",\"end\":\"2026-11-07\",\"phase\":\"Eine verlässliche Grundlage\",\"title\":\"C# selbstständig anwenden und Git verstehen\",\"gate\":\"Starte das Programm in einem frischen Ordner und ändere eine kleine Anforderung selbst. Falls das noch nicht gelingt, wiederhole die Grundlage.\",\"days\":[{\"id\":\"C09-L1\",\"date\":\"2026-11-02\",\"title\":\"Einheit 1: C# selbstständig anwenden und Git verstehen\",\"core\":false,\"lessonIds\":[\"C09-L1\"],\"action\":\"Schreibe ohne Kopieren ein Konsolenprogramm zum Erfassen und Suchen von Operationen. Zeige gültige und ungültige Eingaben.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C09-L2\",\"date\":\"2026-11-03\",\"title\":\"Einheit 2: C# selbstständig anwenden und Git verstehen\",\"core\":false,\"lessonIds\":[\"C09-L2\"],\"action\":\"Verwende Klasse, Liste und Methode im selben Programm. Erkläre Wert, Objekt und Referenz an deinem Beispiel.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C09-L3\",\"date\":\"2026-11-04\",\"title\":\"Einheit 3: C# selbstständig anwenden und Git verstehen\",\"core\":false,\"lessonIds\":[\"C09-L3\"],\"action\":\"Untersuche einen echten Fehler mit einem Breakpoint. Dokumentiere Ursache, Korrektur und Ausgabe davor und danach.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C09-L4\",\"date\":\"2026-11-05\",\"title\":\"Einheit 4: C# selbstständig anwenden und Git verstehen\",\"core\":false,\"lessonIds\":[\"C09-L4\"],\"action\":\"Teste Grenzfälle und Fehlerpfade. Zeige, dass ein Test den Fehler vor der Korrektur tatsächlich erkennt.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C09-L5\",\"date\":\"2026-11-06\",\"title\":\"Einheit 5: C# selbstständig anwenden und Git verstehen\",\"core\":false,\"lessonIds\":[\"C09-L5\"],\"action\":\"Ändere eine kleine Funktion in einem eigenen Branch. Erkläre den Diff, lasse ihn prüfen und integriere ihn. Stelle das Ergebnis zwei Minuten auf Deutsch vor.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W09\",\"title\":\"Deutsch: Eigenen Code erklären\",\"date\":\"2026-11-06\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W09\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Eigenen Code erklären. Grammatikfokus: Präsens und Perfekt. Sprechaufgabe: Erkläre eine Methode und eine selbst behobene Schwierigkeit. Schreibaufgabe: Schreibe eine kurze Änderungsbeschreibung.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Präsens und Perfekt\",\"speaking\":\"Erkläre eine Methode und eine selbst behobene Schwierigkeit.\",\"writing\":\"Schreibe eine kurze Änderungsbeschreibung.\"}},{\"number\":10,\"start\":\"2026-11-08\",\"end\":\"2026-11-14\",\"phase\":\"Backend als erstes Portfolio-Projekt\",\"title\":\"HTTP und die erste ASP.NET Core API\",\"gate\":\"Eine andere Person kann mit dem README zwei erfolgreiche und zwei fehlerhafte Anfragen reproduzieren.\",\"days\":[{\"id\":\"C10-L1\",\"date\":\"2026-11-09\",\"title\":\"Einheit 1: HTTP und die erste ASP.NET Core API\",\"core\":false,\"lessonIds\":[\"C10-L1\"],\"action\":\"Beschreibe drei Use Cases für eine Anfrageverwaltung. Definiere Request, Response und HTTP-Statuscodes.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C10-L2\",\"date\":\"2026-11-10\",\"title\":\"Einheit 2: HTTP und die erste ASP.NET Core API\",\"core\":false,\"lessonIds\":[\"C10-L2\"],\"action\":\"Implementiere einen Lese- und einen Schreibendpoint mit erfundenen Daten. Sende echte Testanfragen.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C10-L3\",\"date\":\"2026-11-11\",\"title\":\"Einheit 3: HTTP und die erste ASP.NET Core API\",\"core\":false,\"lessonIds\":[\"C10-L3\"],\"action\":\"Ergänze Eingabeprüfung sowie Antworten mit 400 und 404. Eine ungültige Anfrage darf nicht als erfolgreich gelten.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C10-L4\",\"date\":\"2026-11-12\",\"title\":\"Einheit 4: HTTP und die erste ASP.NET Core API\",\"core\":false,\"lessonIds\":[\"C10-L4\"],\"action\":\"Trenne die Fachlogik vom Endpoint. Erkläre Dependency Injection an einem Test.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C10-L5\",\"date\":\"2026-11-13\",\"title\":\"Einheit 5: HTTP und die erste ASP.NET Core API\",\"core\":false,\"lessonIds\":[\"C10-L5\"],\"action\":\"Starte die API nach dem README und erkläre in drei Minuten den Weg von der Anfrage bis zur Antwort.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W10\",\"title\":\"Deutsch: Eine technische Rückfrage stellen\",\"date\":\"2026-11-13\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W10\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Eine technische Rückfrage stellen. Grammatikfokus: Höfliche Fragen und Modalverben. Sprechaufgabe: Spiele ein Gespräch über eine fehlerhafte API-Anfrage. Frage gezielt nach. Schreibaufgabe: Schreibe einen Bugreport mit erwartetem und tatsächlichem Verhalten.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Höfliche Fragen und Modalverben\",\"speaking\":\"Spiele ein Gespräch über eine fehlerhafte API-Anfrage. Frage gezielt nach.\",\"writing\":\"Schreibe einen Bugreport mit erwartetem und tatsächlichem Verhalten.\"}},{\"number\":11,\"start\":\"2026-11-15\",\"end\":\"2026-11-21\",\"phase\":\"Backend als erstes Portfolio-Projekt\",\"title\":\"SQL und Entity Framework Core\",\"gate\":\"Dauerhafte Daten, wiederholbare Migration und eine eigene Erklärung des Wegs von API bis Tabelle.\",\"days\":[{\"id\":\"C11-L1\",\"date\":\"2026-11-16\",\"title\":\"Einheit 1: SQL und Entity Framework Core\",\"core\":false,\"lessonIds\":[\"C11-L1\"],\"action\":\"Entwirf zwei verbundene Tabellen mit Schlüsseln. Schreibe selbst fünf SELECT- und JOIN-Abfragen.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C11-L2\",\"date\":\"2026-11-17\",\"title\":\"Einheit 2: SQL und Entity Framework Core\",\"core\":false,\"lessonIds\":[\"C11-L2\"],\"action\":\"Erstelle eine lokale Datenbank mit erfundenen Daten und einer Migration. Prüfe den Neuaufbau von null.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C11-L3\",\"date\":\"2026-11-18\",\"title\":\"Einheit 3: SQL und Entity Framework Core\",\"core\":false,\"lessonIds\":[\"C11-L3\"],\"action\":\"Verbinde die API mit EF Core. Angelegte Daten müssen nach einem Neustart noch lesbar sein.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C11-L4\",\"date\":\"2026-11-19\",\"title\":\"Einheit 4: SQL und Entity Framework Core\",\"core\":false,\"lessonIds\":[\"C11-L4\"],\"action\":\"Reproduziere eine Constraint- oder Transaktionsverletzung und teste das erwartete Verhalten.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C11-L5\",\"date\":\"2026-11-20\",\"title\":\"Einheit 5: SQL und Entity Framework Core\",\"core\":false,\"lessonIds\":[\"C11-L5\"],\"action\":\"Erkläre eine Query und das erzeugte SQL. Zeige den Unterschied zwischen IQueryable, Ausführung und SaveChanges.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W11\",\"title\":\"Deutsch: Daten und Beziehungen beschreiben\",\"date\":\"2026-11-20\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W11\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Daten und Beziehungen beschreiben. Grammatikfokus: Präpositionen mit Dativ und Akkusativ. Sprechaufgabe: Erkläre einen JOIN an eigenen Beispieldaten. Schreibaufgabe: Beschreibe eine Tabellenbeziehung und eine mögliche Fehlerursache.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Präpositionen mit Dativ und Akkusativ\",\"speaking\":\"Erkläre einen JOIN an eigenen Beispieldaten.\",\"writing\":\"Beschreibe eine Tabellenbeziehung und eine mögliche Fehlerursache.\"}},{\"number\":12,\"start\":\"2026-11-22\",\"end\":\"2026-11-28\",\"phase\":\"Backend als erstes Portfolio-Projekt\",\"title\":\"Authentifizierung, Berechtigungen und Integrationstests\",\"gate\":\"Backend-Demo, Berechtigungstests und Code-Review. Für Interviews musst du den Code unabhängig erklären können.\",\"days\":[{\"id\":\"C12-L1\",\"date\":\"2026-11-23\",\"title\":\"Einheit 1: Authentifizierung, Berechtigungen und Integrationstests\",\"core\":false,\"lessonIds\":[\"C12-L1\"],\"action\":\"Definiere zwei Rollen und eine Zugriffstabelle für die Endpoints. Nutze nur erfundene Daten.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C12-L2\",\"date\":\"2026-11-24\",\"title\":\"Einheit 2: Authentifizierung, Berechtigungen und Integrationstests\",\"core\":false,\"lessonIds\":[\"C12-L2\"],\"action\":\"Ergänze Authentifizierung mit Standardmitteln von ASP.NET. Bewahre Geheimnisse außerhalb von Git auf.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C12-L3\",\"date\":\"2026-11-25\",\"title\":\"Einheit 3: Authentifizierung, Berechtigungen und Integrationstests\",\"core\":false,\"lessonIds\":[\"C12-L3\"],\"action\":\"Schreibe Integrationstests für 401, 403 und erlaubten Zugriff. Eine eingeschränkte Rolle darf keine geschützten Daten lesen.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C12-L4\",\"date\":\"2026-11-26\",\"title\":\"Einheit 4: Authentifizierung, Berechtigungen und Integrationstests\",\"core\":false,\"lessonIds\":[\"C12-L4\"],\"action\":\"Ergänze Seitennavigation und Abbruch einer Anfrage. Protokolliere einen Fehlerpfad ohne sensible Daten.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C12-L5\",\"date\":\"2026-11-27\",\"title\":\"Einheit 5: Authentifizierung, Berechtigungen und Integrationstests\",\"core\":false,\"lessonIds\":[\"C12-L5\"],\"action\":\"Lass eine andere Person das Projekt nach dem README starten. Korrigiere einen gefundenen Fehler selbst.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W12\",\"title\":\"Deutsch: Entscheidungen begründen\",\"date\":\"2026-11-27\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W12\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Entscheidungen begründen. Grammatikfokus: weil, obwohl und trotzdem. Sprechaufgabe: Begründe eine Zugriffsregel und gehe auf einen Einwand ein. Schreibaufgabe: Schreibe eine begründete technische Entscheidung in etwa 100 Wörtern.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"weil, obwohl und trotzdem\",\"speaking\":\"Begründe eine Zugriffsregel und gehe auf einen Einwand ein.\",\"writing\":\"Schreibe eine begründete technische Entscheidung in etwa 100 Wörtern.\"}},{\"number\":13,\"start\":\"2026-11-29\",\"end\":\"2026-12-05\",\"phase\":\"Ergebnisse präsentieren\",\"title\":\"Erstes Portfolio und Blick auf den Arbeitsmarkt\",\"gate\":\"Vorzeigbares Backend, ehrlicher Lebenslauf und ein Bewerbungsentwurf. Über das tatsächliche Senden entscheidest du selbst.\",\"days\":[{\"id\":\"C13-L1\",\"date\":\"2026-11-30\",\"title\":\"Einheit 1: Erstes Portfolio und Blick auf den Arbeitsmarkt\",\"core\":false,\"lessonIds\":[\"C13-L1\"],\"action\":\"Überarbeite das README mit Problem, Startanleitung, Entscheidungen, Grenzen und einem echten Screenshot.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C13-L2\",\"date\":\"2026-12-01\",\"title\":\"Einheit 2: Erstes Portfolio und Blick auf den Arbeitsmarkt\",\"core\":false,\"lessonIds\":[\"C13-L2\"],\"action\":\"Prüfe zehn aktuelle passende Stellenanzeigen. Notiere Datum, Sprache, Erfahrung und veröffentlichtes Gehalt. Lasse unbekannte Werte offen.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C13-L3\",\"date\":\"2026-12-02\",\"title\":\"Einheit 3: Erstes Portfolio und Blick auf den Arbeitsmarkt\",\"core\":false,\"lessonIds\":[\"C13-L3\"],\"action\":\"Entwirf einen ein- bis zweiseitigen Lebenslauf mit belegbaren Ergebnissen und gezielt teilbaren Projektlinks.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C13-L4\",\"date\":\"2026-12-03\",\"title\":\"Einheit 4: Erstes Portfolio und Blick auf den Arbeitsmarkt\",\"core\":false,\"lessonIds\":[\"C13-L4\"],\"action\":\"Nimm eine deutsche und eine englische Projektvorstellung auf. Verbessere drei Stellen nach Rückmeldung.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C13-L5\",\"date\":\"2026-12-04\",\"title\":\"Einheit 5: Erstes Portfolio und Blick auf den Arbeitsmarkt\",\"core\":false,\"lessonIds\":[\"C13-L5\"],\"action\":\"Wähle aus den zehn Anzeigen drei wiederkehrende Lücken. Prüfe das Ziel von 70.000 Euro anhand deiner tatsächlichen Erfahrung und der Rückmeldungen.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W13\",\"title\":\"Deutsch: Lebenslauf und Motivation\",\"date\":\"2026-12-04\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W13\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Lebenslauf und Motivation. Grammatikfokus: Präzise Verben statt allgemeiner Behauptungen. Sprechaufgabe: Stelle deinen bisherigen Weg vor, ohne Berufserfahrung zu erfinden. Schreibaufgabe: Schreibe einen kurzen, stellenbezogenen Motivationsabsatz.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Präzise Verben statt allgemeiner Behauptungen\",\"speaking\":\"Stelle deinen bisherigen Weg vor, ohne Berufserfahrung zu erfinden.\",\"writing\":\"Schreibe einen kurzen, stellenbezogenen Motivationsabsatz.\"}},{\"number\":14,\"start\":\"2026-12-06\",\"end\":\"2026-12-12\",\"phase\":\"Die Bachelorarbeit als zweites Projekt\",\"title\":\"Roslyn und ein kleiner EvidenceRecord\",\"gate\":\"Ein kleiner tatsächlich funktionierender Weg von C# zu JSONL, im abgestimmten wissenschaftlichen Umfang.\",\"days\":[{\"id\":\"C14-L1\",\"date\":\"2026-12-07\",\"title\":\"Einheit 1: Roslyn und ein kleiner EvidenceRecord\",\"core\":false,\"lessonIds\":[\"C14-L1\"],\"action\":\"Definiere für eine kleine C#-Datei das erwartete Ergebnis mit Methode, Aufruf und Fundstelle von Hand.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C14-L2\",\"date\":\"2026-12-08\",\"title\":\"Einheit 2: Roslyn und ein kleiner EvidenceRecord\",\"core\":false,\"lessonIds\":[\"C14-L2\"],\"action\":\"Lies die Struktur dieser Datei mit Roslyn und extrahiere nur Elemente im festgelegten Umfang.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C14-L3\",\"date\":\"2026-12-09\",\"title\":\"Einheit 3: Roslyn und ein kleiner EvidenceRecord\",\"core\":false,\"lessonIds\":[\"C14-L3\"],\"action\":\"Löse das Symbol eines Aufrufs auf. Ein ungelöster Fall bleibt ausdrücklich unbekannt.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C14-L4\",\"date\":\"2026-12-10\",\"title\":\"Einheit 4: Roslyn und ein kleiner EvidenceRecord\",\"core\":false,\"lessonIds\":[\"C14-L4\"],\"action\":\"Definiere einen EvidenceRecord mit Pfad, Commit und Zeilenbereich. Weise ungültige Eingaben zurück.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C14-L5\",\"date\":\"2026-12-11\",\"title\":\"Einheit 5: Roslyn und ein kleiner EvidenceRecord\",\"core\":false,\"lessonIds\":[\"C14-L5\"],\"action\":\"Führe die CLI auf einem festen Beispiel aus. Prüfe reproduzierbares JSONL gegen deine manuelle Referenz.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W14\",\"title\":\"Deutsch: Vorgehen und Grenzen erklären\",\"date\":\"2026-12-11\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W14\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Vorgehen und Grenzen erklären. Grammatikfokus: Aktiv und verständliches Passiv. Sprechaufgabe: Erkläre, was der Analyzer erkennt und was offenbleibt. Schreibaufgabe: Formuliere drei belegte Aussagen und zwei Grenzen.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Aktiv und verständliches Passiv\",\"speaking\":\"Erkläre, was der Analyzer erkennt und was offenbleibt.\",\"writing\":\"Formuliere drei belegte Aussagen und zwei Grenzen.\"}},{\"number\":15,\"start\":\"2026-12-13\",\"end\":\"2026-12-19\",\"phase\":\"Die Bachelorarbeit als zweites Projekt\",\"title\":\"Mapping und READ/WRITE mit klaren Grenzen\",\"gate\":\"Erklärbares Verhalten auf festen Beispielen mit ausdrücklich benannten nicht unterstützten Fällen.\",\"days\":[{\"id\":\"C15-L1\",\"date\":\"2026-12-14\",\"title\":\"Einheit 1: Mapping und READ/WRITE mit klaren Grenzen\",\"core\":false,\"lessonIds\":[\"C15-L1\"],\"action\":\"Erstelle fünf kleine EF-Core-Beispiele mit explizitem Mapping, Standardnamen und unbekanntem Fall.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C15-L2\",\"date\":\"2026-12-15\",\"title\":\"Einheit 2: Mapping und READ/WRITE mit klaren Grenzen\",\"core\":false,\"lessonIds\":[\"C15-L2\"],\"action\":\"Extrahiere unterstütztes Mapping. Ordne einem unbekannten Fall keine erfundene Tabelle zu.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C15-L3\",\"date\":\"2026-12-16\",\"title\":\"Einheit 3: Mapping und READ/WRITE mit klaren Grenzen\",\"core\":false,\"lessonIds\":[\"C15-L3\"],\"action\":\"Erkenne ein READ-Muster mit Quellnachweis. Verwechsle Erzeugen und Ausführen einer Query nicht.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C15-L4\",\"date\":\"2026-12-17\",\"title\":\"Einheit 4: Mapping und READ/WRITE mit klaren Grenzen\",\"core\":false,\"lessonIds\":[\"C15-L4\"],\"action\":\"Erkenne ein WRITE-Muster mit SaveChanges. Ergänze positive und negative Tests.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C15-L5\",\"date\":\"2026-12-18\",\"title\":\"Einheit 5: Mapping und READ/WRITE mit klaren Grenzen\",\"core\":false,\"lessonIds\":[\"C15-L5\"],\"action\":\"Vergleiche das Ergebnis mit deinen manuellen Labels. Berichte tatsächliche falsch positive und falsch negative Ergebnisse.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W15\",\"title\":\"Deutsch: Im Code-Review sprechen\",\"date\":\"2026-12-18\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W15\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Im Code-Review sprechen. Grammatikfokus: Sachliche Kritik und Vorschläge. Sprechaufgabe: Übe einen respektvollen Einwand und eine Nachfrage im Review. Schreibaufgabe: Schreibe einen kurzen Review-Kommentar mit Verbesserungsvorschlag.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Sachliche Kritik und Vorschläge\",\"speaking\":\"Übe einen respektvollen Einwand und eine Nachfrage im Review.\",\"writing\":\"Schreibe einen kurzen Review-Kommentar mit Verbesserungsvorschlag.\"}},{\"number\":16,\"start\":\"2026-12-20\",\"end\":\"2026-12-26\",\"phase\":\"Die Bachelorarbeit als zweites Projekt\",\"title\":\"Python, Validierung und Neo4j\",\"gate\":\"Reproduzierbare Extraktion, JSONL, Import und Abfrage. Keine ungeprüfte Behauptung über den gesamten Corpus.\",\"days\":[{\"id\":\"C16-L1\",\"date\":\"2026-12-21\",\"title\":\"Einheit 1: Python, Validierung und Neo4j\",\"core\":false,\"lessonIds\":[\"C16-L1\"],\"action\":\"Validiere JSONL mit Python. Weise unvollständige Datensätze und ungültige Pfade zurück.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C16-L2\",\"date\":\"2026-12-22\",\"title\":\"Einheit 2: Python, Validierung und Neo4j\",\"core\":false,\"lessonIds\":[\"C16-L2\"],\"action\":\"Entwirf ein kleines Graphmodell mit Repository- und Commit-Identität. Verhindere falsches Zusammenführen gleichnamiger Elemente.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C16-L3\",\"date\":\"2026-12-23\",\"title\":\"Einheit 3: Python, Validierung und Neo4j\",\"core\":false,\"lessonIds\":[\"C16-L3\"],\"action\":\"Importiere feste Beispieldaten in eine lokale Neo4j-Datenbank. Ein zweiter Import darf keine Duplikate erzeugen.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C16-L4\",\"date\":\"2026-12-24\",\"title\":\"Einheit 4: Python, Validierung und Neo4j\",\"core\":false,\"lessonIds\":[\"C16-L4\"],\"action\":\"Schreibe drei Cypher-Fragen mit erwarteten Antworten. Vergleiche Ergebnisse mit den Quellnachweisen.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C16-L5\",\"date\":\"2026-12-25\",\"title\":\"Einheit 5: Python, Validierung und Neo4j\",\"core\":false,\"lessonIds\":[\"C16-L5\"],\"action\":\"Führe den Weg von C# bis zur Graphantwort neu aus und halte eine fünfminütige Demo.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W16\",\"title\":\"Deutsch: Eine Demo moderieren\",\"date\":\"2026-12-25\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W16\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Eine Demo moderieren. Grammatikfokus: Strukturierende Redemittel. Sprechaufgabe: Führe durch eine fünfminütige Demo und reagiere auf eine Unterbrechung. Schreibaufgabe: Schreibe eine knappe Demo-Agenda und eine Abschlussnotiz.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Strukturierende Redemittel\",\"speaking\":\"Führe durch eine fünfminütige Demo und reagiere auf eine Unterbrechung.\",\"writing\":\"Schreibe eine knappe Demo-Agenda und eine Abschlussnotiz.\"}},{\"number\":17,\"start\":\"2026-12-27\",\"end\":\"2027-01-02\",\"phase\":\"Die Bachelorarbeit als zweites Projekt\",\"title\":\"Evaluation und fachliche Erklärung\",\"gate\":\"Ein zweites Projekt mit reproduzierbaren Ergebnissen und einer fachlich nachvollziehbaren Erklärung.\",\"days\":[{\"id\":\"C17-L1\",\"date\":\"2026-12-28\",\"title\":\"Einheit 1: Evaluation und fachliche Erklärung\",\"core\":false,\"lessonIds\":[\"C17-L1\"],\"action\":\"Lege eine kleine manuell gelabelte Menge, Forschungsfrage und feste Evaluationskriterien fest.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C17-L2\",\"date\":\"2026-12-29\",\"title\":\"Einheit 2: Evaluation und fachliche Erklärung\",\"core\":false,\"lessonIds\":[\"C17-L2\"],\"action\":\"Führe eine einfache Baseline und deinen Ansatz auf identischen Eingaben aus.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C17-L3\",\"date\":\"2026-12-30\",\"title\":\"Einheit 3: Evaluation und fachliche Erklärung\",\"core\":false,\"lessonIds\":[\"C17-L3\"],\"action\":\"Berechne Precision und Recall aus echten Zählwerten. Bewahre ein Fehlerbeispiel auf.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C17-L4\",\"date\":\"2026-12-31\",\"title\":\"Einheit 4: Evaluation und fachliche Erklärung\",\"core\":false,\"lessonIds\":[\"C17-L4\"],\"action\":\"Beschreibe Grenzen und Risiken für die Aussagekraft. Stelle keine Behauptung über ungeprüfte Daten auf.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C17-L5\",\"date\":\"2027-01-01\",\"title\":\"Einheit 5: Evaluation und fachliche Erklärung\",\"core\":false,\"lessonIds\":[\"C17-L5\"],\"action\":\"Zeige eine selbstständige Demo und erkläre Nachweise und Grenzen auf Deutsch. Hole Rückmeldung ein.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W17\",\"title\":\"Deutsch: Zahlen und Ergebnisse erklären\",\"date\":\"2027-01-01\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W17\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Zahlen und Ergebnisse erklären. Grammatikfokus: Vergleiche und Einschränkungen. Sprechaufgabe: Erkläre Precision und Recall an deinen eigenen Zahlen. Schreibaufgabe: Schreibe einen Ergebnisabsatz mit einer Einschränkung.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Vergleiche und Einschränkungen\",\"speaking\":\"Erkläre Precision und Recall an deinen eigenen Zahlen.\",\"writing\":\"Schreibe einen Ergebnisabsatz mit einer Einschränkung.\"}},{\"number\":18,\"start\":\"2027-01-03\",\"end\":\"2027-01-09\",\"phase\":\"Professionelle Arbeitsweise\",\"title\":\"CI und reproduzierbare Übergabe\",\"gate\":\"Eine andere Person kann das Projekt starten und Fehler untersuchen. Öffentliche Bereitstellung verlangt eine eigene Entscheidung.\",\"days\":[{\"id\":\"C18-L1\",\"date\":\"2027-01-04\",\"title\":\"Einheit 1: CI und reproduzierbare Übergabe\",\"core\":false,\"lessonIds\":[\"C18-L1\"],\"action\":\"Richte CI für Build und Tests ein. Prüfe einen erfolgreichen Lauf und einen kontrollierten absichtlichen Fehler.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C18-L2\",\"date\":\"2027-01-05\",\"title\":\"Einheit 2: CI und reproduzierbare Übergabe\",\"core\":false,\"lessonIds\":[\"C18-L2\"],\"action\":\"Mache den lokalen Start mit Container oder genauer Anleitung reproduzierbar. Ergänze nur benötigte Werkzeuge.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C18-L3\",\"date\":\"2027-01-06\",\"title\":\"Einheit 3: CI und reproduzierbare Übergabe\",\"core\":false,\"lessonIds\":[\"C18-L3\"],\"action\":\"Dokumentiere Konfiguration, Logs und Health Check. Entferne Geheimnisse und persönliche Daten aus Ausgaben.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C18-L4\",\"date\":\"2027-01-07\",\"title\":\"Einheit 4: CI und reproduzierbare Übergabe\",\"core\":false,\"lessonIds\":[\"C18-L4\"],\"action\":\"Führe Backup und Wiederherstellung der erfundenen Testdaten praktisch durch.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C18-L5\",\"date\":\"2027-01-08\",\"title\":\"Einheit 5: CI und reproduzierbare Übergabe\",\"core\":false,\"lessonIds\":[\"C18-L5\"],\"action\":\"Starte aus einem frischen Clone. Übe Update und Rückkehr zu einer früheren Version mit Testdaten.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W18\",\"title\":\"Deutsch: Übergaben und Abstimmung\",\"date\":\"2027-01-08\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W18\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Übergaben und Abstimmung. Grammatikfokus: Bedingungssätze mit wenn. Sprechaufgabe: Erkläre Start, Fehlerfall und Wiederherstellung einem neuen Kollegen. Schreibaufgabe: Schreibe eine Übergabenachricht mit nächstem Schritt.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Bedingungssätze mit wenn\",\"speaking\":\"Erkläre Start, Fehlerfall und Wiederherstellung einem neuen Kollegen.\",\"writing\":\"Schreibe eine Übergabenachricht mit nächstem Schritt.\"}},{\"number\":19,\"start\":\"2027-01-10\",\"end\":\"2027-01-16\",\"phase\":\"Technische Interviews\",\"title\":\"SQL, Laufzeit und einfacher Systementwurf\",\"gate\":\"Echte Messungen, begründete Abwägungen und eine kleine unabhängige Änderung ohne vollständige KI-Lösung.\",\"days\":[{\"id\":\"C19-L1\",\"date\":\"2027-01-11\",\"title\":\"Einheit 1: SQL, Laufzeit und einfacher Systementwurf\",\"core\":false,\"lessonIds\":[\"C19-L1\"],\"action\":\"Erzeuge mit erfundenen Daten eine langsame Query und miss die Ausgangslaufzeit.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C19-L2\",\"date\":\"2027-01-12\",\"title\":\"Einheit 2: SQL, Laufzeit und einfacher Systementwurf\",\"core\":false,\"lessonIds\":[\"C19-L2\"],\"action\":\"Wiederhole dieselbe Messung nach einem Index oder einer Query-Änderung. Berichte den tatsächlichen Unterschied.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C19-L3\",\"date\":\"2027-01-13\",\"title\":\"Einheit 3: SQL, Laufzeit und einfacher Systementwurf\",\"core\":false,\"lessonIds\":[\"C19-L3\"],\"action\":\"Finde einen N+1-Fall in EF Core und behebe ihn mit einem Test.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C19-L4\",\"date\":\"2027-01-14\",\"title\":\"Einheit 4: SQL, Laufzeit und einfacher Systementwurf\",\"core\":false,\"lessonIds\":[\"C19-L4\"],\"action\":\"Erkläre die Anfrageverwaltung auf Papier mit Seitennavigation, Fehlern, Berechtigungen und Kapazitätsgrenzen.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C19-L5\",\"date\":\"2027-01-15\",\"title\":\"Einheit 5: SQL, Laufzeit und einfacher Systementwurf\",\"core\":false,\"lessonIds\":[\"C19-L5\"],\"action\":\"Absolviere ein 45-minütiges Probeinterview. Wähle die zwei wichtigsten Schwächen für die nächste Woche.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W19\",\"title\":\"Deutsch: Laut denken im Interview\",\"date\":\"2027-01-15\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W19\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Laut denken im Interview. Grammatikfokus: Kurze Hauptsätze unter Zeitdruck. Sprechaufgabe: Löse eine kleine Aufgabe und erkläre dabei deine Überlegungen. Schreibaufgabe: Fasse Lösungsweg und Alternative knapp zusammen.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Kurze Hauptsätze unter Zeitdruck\",\"speaking\":\"Löse eine kleine Aufgabe und erkläre dabei deine Überlegungen.\",\"writing\":\"Fasse Lösungsweg und Alternative knapp zusammen.\"}},{\"number\":20,\"start\":\"2027-01-17\",\"end\":\"2027-01-23\",\"phase\":\"Den Arbeitsmarkt erproben\",\"title\":\"Gezielte Bewerbungen beginnen\",\"gate\":\"Tatsächliche Bewerbungen brauchen deinen Versandnachweis. Grüne Aufgaben sind keine Einstellungswahrscheinlichkeit.\",\"days\":[{\"id\":\"C20-L1\",\"date\":\"2027-01-18\",\"title\":\"Einheit 1: Gezielte Bewerbungen beginnen\",\"core\":false,\"lessonIds\":[\"C20-L1\"],\"action\":\"Wähle fünf aktuelle Stellen passend zu Fähigkeiten und Sprache. Erfasse Gehaltsangabe und Erfahrungsanforderung getrennt.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C20-L2\",\"date\":\"2027-01-19\",\"title\":\"Einheit 2: Gezielte Bewerbungen beginnen\",\"core\":false,\"lessonIds\":[\"C20-L2\"],\"action\":\"Passe Lebenslauf und ersten Entwurf an die Stelle an. Belege Aussagen mit deinem Projekt und erfinde keine Erfahrung.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C20-L3\",\"date\":\"2027-01-20\",\"title\":\"Einheit 3: Gezielte Bewerbungen beginnen\",\"core\":false,\"lessonIds\":[\"C20-L3\"],\"action\":\"Sende selbst zwei bis drei passende Bewerbungen. Notiere Datum und Phase privat.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C20-L4\",\"date\":\"2027-01-21\",\"title\":\"Einheit 4: Gezielte Bewerbungen beginnen\",\"core\":false,\"lessonIds\":[\"C20-L4\"],\"action\":\"Löse eine Programmieraufgabe unter Zeitbegrenzung. Erkläre Lösung, Tests und Komplexität.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C20-L5\",\"date\":\"2027-01-22\",\"title\":\"Einheit 5: Gezielte Bewerbungen beginnen\",\"core\":false,\"lessonIds\":[\"C20-L5\"],\"action\":\"Prüfe die Rückmeldungen. Bleiben Antworten aus, überarbeite Zielauswahl und Unterlagen statt wahllos mehr zu senden.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W20\",\"title\":\"Deutsch: Ein Vorstellungsgespräch führen\",\"date\":\"2027-01-22\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W20\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Ein Vorstellungsgespräch führen. Grammatikfokus: Rückfragen und höfliche Gesprächsführung. Sprechaufgabe: Übe Selbstvorstellung, Projektbeispiel und zwei eigene Fragen in zehn Minuten. Schreibaufgabe: Passe einen Bewerbungsabsatz an eine echte Anzeige an.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Rückfragen und höfliche Gesprächsführung\",\"speaking\":\"Übe Selbstvorstellung, Projektbeispiel und zwei eigene Fragen in zehn Minuten.\",\"writing\":\"Passe einen Bewerbungsabsatz an eine echte Anzeige an.\"}},{\"number\":21,\"start\":\"2027-01-24\",\"end\":\"2027-01-30\",\"phase\":\"Den Arbeitsmarkt erproben\",\"title\":\"Debugging und verhaltensbezogene Interviewfragen\",\"gate\":\"Bewerte selbstständige Leistung und echte Rückmeldungen. Eine Absage ist kein Beweis für gescheitertes Lernen.\",\"days\":[{\"id\":\"C21-L1\",\"date\":\"2027-01-25\",\"title\":\"Einheit 1: Debugging und verhaltensbezogene Interviewfragen\",\"core\":false,\"lessonIds\":[\"C21-L1\"],\"action\":\"Reproduziere einen unbekannten Fehler und verkleinere das Beispiel. Dokumentiere deinen Gedankengang.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C21-L2\",\"date\":\"2027-01-26\",\"title\":\"Einheit 2: Debugging und verhaltensbezogene Interviewfragen\",\"core\":false,\"lessonIds\":[\"C21-L2\"],\"action\":\"Bereite für drei echte Projekterfahrungen eine kurze Darstellung von Problem, Handlung und Ergebnis vor.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C21-L3\",\"date\":\"2027-01-27\",\"title\":\"Einheit 3: Debugging und verhaltensbezogene Interviewfragen\",\"core\":false,\"lessonIds\":[\"C21-L3\"],\"action\":\"Sende selbst zwei bis drei weitere passende Bewerbungen und fasse bei früheren Anfragen angemessen nach.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C21-L4\",\"date\":\"2027-01-28\",\"title\":\"Einheit 4: Debugging und verhaltensbezogene Interviewfragen\",\"core\":false,\"lessonIds\":[\"C21-L4\"],\"action\":\"Übe auf Deutsch, einen Fehler zu erklären und um Hilfe zu bitten. Hole sprachliche Rückmeldung ein.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C21-L5\",\"date\":\"2027-01-29\",\"title\":\"Einheit 5: Debugging und verhaltensbezogene Interviewfragen\",\"core\":false,\"lessonIds\":[\"C21-L5\"],\"action\":\"Werte Interviews oder Probeübungen aus und verbessere die schwächste Fähigkeit mit einer konkreten Aufgabe.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W21\",\"title\":\"Deutsch: Über schwierige Situationen sprechen\",\"date\":\"2027-01-29\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W21\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Über schwierige Situationen sprechen. Grammatikfokus: Vergangenheit und zeitliche Zusammenhänge. Sprechaufgabe: Erzähle ein echtes Beispiel nach Situation, Aufgabe, Handlung und Ergebnis. Schreibaufgabe: Schreibe eine ehrliche kurze Reflexion über den Fehler.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Vergangenheit und zeitliche Zusammenhänge\",\"speaking\":\"Erzähle ein echtes Beispiel nach Situation, Aufgabe, Handlung und Ergebnis.\",\"writing\":\"Schreibe eine ehrliche kurze Reflexion über den Fehler.\"}},{\"number\":22,\"start\":\"2027-01-31\",\"end\":\"2027-02-06\",\"phase\":\"Eine wiederkehrende Lücke schließen\",\"title\":\"Cloud nur entsprechend dem Bedarf\",\"gate\":\"Schließe eine häufige Anforderung praktisch. Lerne keine zusätzliche Cloud-Plattform ohne erkennbaren Bedarf.\",\"days\":[{\"id\":\"C22-L1\",\"date\":\"2027-02-01\",\"title\":\"Einheit 1: Cloud nur entsprechend dem Bedarf\",\"core\":false,\"lessonIds\":[\"C22-L1\"],\"action\":\"Prüfe in deinen Stellenanzeigen, ob Azure oder ein anderes Cloud-Werkzeug tatsächlich erforderlich ist.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C22-L2\",\"date\":\"2027-02-02\",\"title\":\"Einheit 2: Cloud nur entsprechend dem Bedarf\",\"core\":false,\"lessonIds\":[\"C22-L2\"],\"action\":\"Entwirf Bereitstellung, Kosten und Geheimnisverwaltung für dein Projekt. Erzeuge keine Kosten ohne Entscheidung.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C22-L3\",\"date\":\"2027-02-03\",\"title\":\"Einheit 3: Cloud nur entsprechend dem Bedarf\",\"core\":false,\"lessonIds\":[\"C22-L3\"],\"action\":\"Prüfe die Deployment-Konfiguration lokal oder in einer ausdrücklich erlaubten Testumgebung.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C22-L4\",\"date\":\"2027-02-04\",\"title\":\"Einheit 4: Cloud nur entsprechend dem Bedarf\",\"core\":false,\"lessonIds\":[\"C22-L4\"],\"action\":\"Übe Logs, Fehlerbehandlung und Wiederherstellung dort praktisch. Ein Kursnachweis ersetzt diese Arbeit nicht.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C22-L5\",\"date\":\"2027-02-05\",\"title\":\"Einheit 5: Cloud nur entsprechend dem Bedarf\",\"core\":false,\"lessonIds\":[\"C22-L5\"],\"action\":\"Erkläre den Entwurf und bearbeite passende Bewerbungen. Dokumentiere nur selbst ausgeführte Schritte.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W22\",\"title\":\"Deutsch: Technische Optionen vergleichen\",\"date\":\"2027-02-05\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W22\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Technische Optionen vergleichen. Grammatikfokus: Komparativ und Abwägungen. Sprechaufgabe: Vergleiche zwei Bereitstellungswege und begründe eine Entscheidung. Schreibaufgabe: Schreibe eine Empfehlung mit Aufwand und Einschränkung.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Komparativ und Abwägungen\",\"speaking\":\"Vergleiche zwei Bereitstellungswege und begründe eine Entscheidung.\",\"writing\":\"Schreibe eine Empfehlung mit Aufwand und Einschränkung.\"}},{\"number\":23,\"start\":\"2027-02-07\",\"end\":\"2027-02-13\",\"phase\":\"Den Arbeitsmarkt erproben\",\"title\":\"Zweites Probeinterview und Gehaltsgespräch\",\"gate\":\"Erfinde keine Gehaltsbelege. 70.000 Euro bleiben ein Ziel; über Angebote entscheidest du selbst.\",\"days\":[{\"id\":\"C23-L1\",\"date\":\"2027-02-08\",\"title\":\"Einheit 1: Zweites Probeinterview und Gehaltsgespräch\",\"core\":false,\"lessonIds\":[\"C23-L1\"],\"action\":\"Absolviere 60 Minuten Probeinterview mit C#, SQL und Projektvorstellung ohne Ablesen.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C23-L2\",\"date\":\"2027-02-09\",\"title\":\"Einheit 2: Zweites Probeinterview und Gehaltsgespräch\",\"core\":false,\"lessonIds\":[\"C23-L2\"],\"action\":\"Verbessere zwei schwache Antworten mit eigenem Codebeispiel und eigener Erklärung.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C23-L3\",\"date\":\"2027-02-10\",\"title\":\"Einheit 3: Zweites Probeinterview und Gehaltsgespräch\",\"core\":false,\"lessonIds\":[\"C23-L3\"],\"action\":\"Notiere bei jeder Gelegenheit Grundgehalt, Bonus, Stunden, Ort und Rollenstufe getrennt.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C23-L4\",\"date\":\"2027-02-11\",\"title\":\"Einheit 4: Zweites Probeinterview und Gehaltsgespräch\",\"core\":false,\"lessonIds\":[\"C23-L4\"],\"action\":\"Übe eine ehrliche Antwort zu deiner Gehaltsvorstellung von 70.000 Euro und deinem belegbaren Beitrag.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C23-L5\",\"date\":\"2027-02-12\",\"title\":\"Einheit 5: Zweites Probeinterview und Gehaltsgespräch\",\"core\":false,\"lessonIds\":[\"C23-L5\"],\"action\":\"Setze Bewerbungen anhand echter Rückmeldungen fort und überprüfe den Zielbereich erneut.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W23\",\"title\":\"Deutsch: Gehaltsvorstellung erklären\",\"date\":\"2027-02-12\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W23\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Gehaltsvorstellung erklären. Grammatikfokus: Konjunktiv II und höfliche Verhandlung. Sprechaufgabe: Übe ein Gehaltsgespräch mit Rückfragen zu Grundgehalt und Arbeitszeit. Schreibaufgabe: Schreibe eine sachliche Antwort auf eine Gehaltsfrage.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Konjunktiv II und höfliche Verhandlung\",\"speaking\":\"Übe ein Gehaltsgespräch mit Rückfragen zu Grundgehalt und Arbeitszeit.\",\"writing\":\"Schreibe eine sachliche Antwort auf eine Gehaltsfrage.\"}},{\"number\":24,\"start\":\"2027-02-14\",\"end\":\"2027-02-20\",\"phase\":\"Selbstständigkeit zeigen\",\"title\":\"Portfolio übergeben und zusammenarbeiten\",\"gate\":\"Das Projekt muss ausführbar und erklärbar sein. Ein vorhandenes Repository allein genügt nicht.\",\"days\":[{\"id\":\"C24-L1\",\"date\":\"2027-02-15\",\"title\":\"Einheit 1: Portfolio übergeben und zusammenarbeiten\",\"core\":false,\"lessonIds\":[\"C24-L1\"],\"action\":\"Bitte eine prüfende Person, das Projekt nur nach README zu starten und Probleme zu notieren.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C24-L2\",\"date\":\"2027-02-16\",\"title\":\"Einheit 2: Portfolio übergeben und zusammenarbeiten\",\"core\":false,\"lessonIds\":[\"C24-L2\"],\"action\":\"Bearbeite ein echtes Issue in einem eigenen Branch und ergänze einen passenden Test.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C24-L3\",\"date\":\"2027-02-17\",\"title\":\"Einheit 3: Portfolio übergeben und zusammenarbeiten\",\"core\":false,\"lessonIds\":[\"C24-L3\"],\"action\":\"Erkläre im Code-Review zwei Entscheidungen und eine Abwägung.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C24-L4\",\"date\":\"2027-02-18\",\"title\":\"Einheit 4: Portfolio übergeben und zusammenarbeiten\",\"core\":false,\"lessonIds\":[\"C24-L4\"],\"action\":\"Aktualisiere die vorzeigbare Version, das Änderungsprotokoll und die kurze Demo.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C24-L5\",\"date\":\"2027-02-19\",\"title\":\"Einheit 5: Portfolio übergeben und zusammenarbeiten\",\"core\":false,\"lessonIds\":[\"C24-L5\"],\"action\":\"Setze passende Bewerbungen fort und halte die unabhängige Rückmeldung privat fest.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W24\",\"title\":\"Deutsch: Zusammenarbeit und Feedback\",\"date\":\"2027-02-19\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W24\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Zusammenarbeit und Feedback. Grammatikfokus: Klärende Nachfragen und Zusammenfassungen. Sprechaufgabe: Fasse Feedback zusammen und bestätige die nächste vereinbarte Aufgabe. Schreibaufgabe: Schreibe eine kurze Besprechungsnotiz.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Klärende Nachfragen und Zusammenfassungen\",\"speaking\":\"Fasse Feedback zusammen und bestätige die nächste vereinbarte Aufgabe.\",\"writing\":\"Schreibe eine kurze Besprechungsnotiz.\"}},{\"number\":25,\"start\":\"2027-02-21\",\"end\":\"2027-02-27\",\"phase\":\"Berufliche Entscheidungen\",\"title\":\"Aktive Chancen gezielt vorbereiten\",\"gate\":\"Beurteile Rolle und Gehalt anhand echter Möglichkeiten. Mehr Lektionen ersetzen keine bessere Zielauswahl.\",\"days\":[{\"id\":\"C25-L1\",\"date\":\"2027-02-22\",\"title\":\"Einheit 1: Aktive Chancen gezielt vorbereiten\",\"core\":false,\"lessonIds\":[\"C25-L1\"],\"action\":\"Prüfe den Stand aller Bewerbungen und den nächsten sinnvollen Zeitpunkt zum Nachfassen.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C25-L2\",\"date\":\"2027-02-23\",\"title\":\"Einheit 2: Aktive Chancen gezielt vorbereiten\",\"core\":false,\"lessonIds\":[\"C25-L2\"],\"action\":\"Verbinde für das nächste Interview drei Anforderungen des Unternehmens mit konkreten Projektnachweisen.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C25-L3\",\"date\":\"2027-02-24\",\"title\":\"Einheit 3: Aktive Chancen gezielt vorbereiten\",\"core\":false,\"lessonIds\":[\"C25-L3\"],\"action\":\"Bearbeite eine zeitlich begrenzte Probeaufgabe mit Code, Tests und README.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C25-L4\",\"date\":\"2027-02-25\",\"title\":\"Einheit 4: Aktive Chancen gezielt vorbereiten\",\"core\":false,\"lessonIds\":[\"C25-L4\"],\"action\":\"Übe die mündliche Erklärung in der Sprache der jeweiligen Stelle.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C25-L5\",\"date\":\"2027-02-26\",\"title\":\"Einheit 5: Aktive Chancen gezielt vorbereiten\",\"core\":false,\"lessonIds\":[\"C25-L5\"],\"action\":\"Gibt es wenige aktive Chancen, vergleiche verwandte Rollen und Juniorstellen mit dem Hauptziel. Versende nichts automatisch.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W25\",\"title\":\"Deutsch: Sicher auf Nachfragen reagieren\",\"date\":\"2027-02-26\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W25\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Sicher auf Nachfragen reagieren. Grammatikfokus: Umschreiben statt blockieren. Sprechaufgabe: Lass fünf ungeplante Fragen stellen. Bitte bei Unklarheit um Präzisierung. Schreibaufgabe: Überarbeite zwei schwache Antworten in deinem Fehlerprotokoll.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Umschreiben statt blockieren\",\"speaking\":\"Lass fünf ungeplante Fragen stellen. Bitte bei Unklarheit um Präzisierung.\",\"writing\":\"Überarbeite zwei schwache Antworten in deinem Fehlerprotokoll.\"}},{\"number\":26,\"start\":\"2027-02-28\",\"end\":\"2027-03-06\",\"phase\":\"Bilanz mit tatsächlichen Nachweisen\",\"title\":\"Sechs Monate auswerten und weiterplanen\",\"gate\":\"Ehrlicher Stand der Fähigkeiten und Chancen. Das Kalenderende garantiert weder eine Stelle noch 70.000 Euro.\",\"days\":[{\"id\":\"C26-L1\",\"date\":\"2027-03-01\",\"title\":\"Einheit 1: Sechs Monate auswerten und weiterplanen\",\"core\":false,\"lessonIds\":[\"C26-L1\"],\"action\":\"Starte das Backend aus einem frischen Clone und ändere eine kleine Funktion selbstständig.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C26-L2\",\"date\":\"2027-03-02\",\"title\":\"Einheit 2: Sechs Monate auswerten und weiterplanen\",\"core\":false,\"lessonIds\":[\"C26-L2\"],\"action\":\"Führe den praktischen Teil der Bachelorarbeit aus und erkläre seine Aussagegrenzen.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C26-L3\",\"date\":\"2027-03-03\",\"title\":\"Einheit 3: Sechs Monate auswerten und weiterplanen\",\"core\":false,\"lessonIds\":[\"C26-L3\"],\"action\":\"Prüfe Lebenslauf, zwei Demos und Interviewantworten gemeinsam mit einer anderen Person.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C26-L4\",\"date\":\"2027-03-04\",\"title\":\"Einheit 4: Sechs Monate auswerten und weiterplanen\",\"core\":false,\"lessonIds\":[\"C26-L4\"],\"action\":\"Betrachte echte Angebote, Bewerbungsphasen und Lücken getrennt vom Lernzähler.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30},{\"id\":\"C26-L5\",\"date\":\"2027-03-05\",\"title\":\"Einheit 5: Sechs Monate auswerten und weiterplanen\",\"core\":false,\"lessonIds\":[\"C26-L5\"],\"action\":\"Plane die nächsten vier Wochen: Verhandlungen fortsetzen, Rollenwahl anpassen oder zwei zentrale Lücken schließen. Erfinde kein Einstellungsergebnis.\",\"acceptance\":\"Halte deine eigene Arbeit, das Prüfergebnis und eine selbstständige Erklärung fest. Ohne tatsächlich bearbeitete Übung bleibt der Status offen.\",\"minutes\":180,\"technicalMinutes\":150,\"germanMinutes\":30}],\"german\":{\"id\":\"DE-W26\",\"title\":\"Deutsch: Fortschritt unabhängig prüfen\",\"date\":\"2027-03-05\",\"core\":false,\"language\":true,\"lessonIds\":[\"DE-W26\"],\"minutes\":0,\"action\":\"An jedem aktiven Lerntag 30 Minuten innerhalb des Zeitbudgets: 10 Minuten einen passenden kurzen Hör- oder Lesetext bearbeiten und drei Wendungen abrufen, 10 Minuten frei sprechen, 10 Minuten selbst schreiben und korrigieren. Wochenthema: Fortschritt unabhängig prüfen. Grammatikfokus: Die eigenen häufigsten Fehler. Sprechaufgabe: Wiederhole die erste Selbstvorstellung mit einer neuen Projektfrage. Vergleiche alte und neue Aufnahme. Schreibaufgabe: Schreibe einen neuen Text ohne Vorlage und lasse Verständlichkeit, Satzbau und Wortwahl prüfen. Ein CEFR-Niveau wird daraus nicht automatisch abgeleitet.\",\"acceptance\":\"Sammle pro aktivem Lerntag eine kurze eigene Sprachprobe oder Notiz. Am letzten Lerntag: eigene Aufnahme oder Gesprächsprotokoll, eigener Text und konkrete Korrektur prüfen lassen; die zwei wichtigsten Stellen erneut formulieren. Notiere eine Wiederholung am nächsten aktiven Lerntag und frühestens sieben Tage später an einem erlaubten Lerntag. Erst dieses bearbeitete Wochenpaket gilt als erledigt. Ein technischer Nachweis allein genügt nicht.\",\"grammar\":\"Die eigenen häufigsten Fehler\",\"speaking\":\"Wiederhole die erste Selbstvorstellung mit einer neuen Projektfrage. Vergleiche alte und neue Aufnahme.\",\"writing\":\"Schreibe einen neuen Text ohne Vorlage und lasse Verständlichkeit, Satzbau und Wortwahl prüfen. Ein CEFR-Niveau wird daraus nicht automatisch abgeleitet.\"}}],\"language\":\"de\",\"germanStrategy\":\"Zuerst den tatsächlichen Ausgangspunkt prüfen. Bei Schwierigkeiten mit Alltagssätzen übst du kurze Grundlagen; bei sicherer Basis verlängerst du Erklärung und Rückfragen. Ein Wochenhaken oder sechs Monate Lernzeit sind kein B2- oder C1-Nachweis. Entscheidend sind verständliche eigene Antworten auf neue Fragen.\",\"languageResources\":[{\"title\":\"Goethe-Institut: Kostenlos Deutsch üben\",\"url\":\"https://www.goethe.de/de/spr/ueb.html\",\"note\":\"Wähle einen kurzen Text oder Hörbeitrag passend zu deinem Niveau. Es gibt unter anderem Angebote für Alltag und Beruf.\",\"checked\":\"2026-09-06\"},{\"title\":\"vhs-Lernportal\",\"url\":\"https://www.vhs-lernportal.de/\",\"note\":\"Online-Kurse für Deutsch als Zweitsprache. Nutze passende Grundlagenübungen, wenn Satzbau oder Wortschatz noch unsicher sind.\",\"checked\":\"2026-09-06\"}]}");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/learning-progress-overview.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LearningProgressOverview
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$career$2d$plan$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/career-plan.json.[json].cjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$learning$2d$progress$2d$chart$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/learning-progress-chart.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
const groups = [
    {
        id: "foundation",
        title: "Fachgrundlagen",
        ids: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$career$2d$plan$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].weeks.flatMap((w)=>w.days.filter((d)=>d.core).flatMap((d)=>d.lessonIds)),
        href: "/learning-lab"
    },
    {
        id: "portfolio",
        title: "Portfolio und Beruf",
        ids: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$career$2d$plan$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].weeks.flatMap((w)=>w.days.filter((d)=>!d.core).flatMap((d)=>d.lessonIds)),
        href: "/career#week-9"
    },
    {
        id: "german",
        title: "Deutschtraining",
        ids: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$career$2d$plan$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].weeks.flatMap((w)=>w.german?.lessonIds ?? []),
        href: "/career#deutsch"
    }
];
const allIds = groups.flatMap((group)=>group.ids);
const shortDate = (date)=>new Intl.DateTimeFormat("de-DE", {
        day: "numeric",
        month: "short",
        timeZone: "Europe/Berlin"
    }).format(new Date(date + "T12:00:00Z"));
function LearningProgressOverview() {
    _s();
    const [snapshot, setSnapshot] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [connection, setConnection] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("loading");
    const [now, setNow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const sync = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LearningProgressOverview.useCallback[sync]": async (signal)=>{
            try {
                const response = await fetch("/api/learning-lab/progress", {
                    cache: "no-store",
                    signal
                });
                const data = await response.json();
                if (!response.ok || data.roadmapId !== "thesis-predefense-2026" || data.completionBasis !== "practice" || !data.states || !Array.isArray(data.events) || allIds.some({
                    "LearningProgressOverview.useCallback[sync]": (id)=>typeof data.states?.[id]?.practiced !== "boolean"
                }["LearningProgressOverview.useCallback[sync]"]) || !data.events.every({
                    "LearningProgressOverview.useCallback[sync]": (event)=>event && [
                            event.id,
                            event.lessonId,
                            event.kind,
                            event.at
                        ].every({
                            "LearningProgressOverview.useCallback[sync]": (value)=>typeof value === "string"
                        }["LearningProgressOverview.useCallback[sync]"])
                }["LearningProgressOverview.useCallback[sync]"])) throw new Error("Lernstand nicht verfügbar");
                setSnapshot({
                    states: data.states,
                    events: data.events
                });
                setNow(new Date());
                setConnection("live");
            } catch  {
                if (!signal.aborted || signal.reason?.name === "TimeoutError") setConnection("offline");
            }
        }
    }["LearningProgressOverview.useCallback[sync]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LearningProgressOverview.useEffect": ()=>{
            const controller = new AbortController();
            let timer;
            const poll = {
                "LearningProgressOverview.useEffect.poll": async ()=>{
                    await sync(AbortSignal.any([
                        controller.signal,
                        AbortSignal.timeout(6000)
                    ]));
                    if (!controller.signal.aborted) timer = setTimeout(poll, 3000);
                }
            }["LearningProgressOverview.useEffect.poll"];
            void poll();
            return ({
                "LearningProgressOverview.useEffect": ()=>{
                    controller.abort();
                    clearTimeout(timer);
                }
            })["LearningProgressOverview.useEffect"];
        }
    }["LearningProgressOverview.useEffect"], [
        sync
    ]);
    const chart = snapshot && now ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$learning$2d$progress$2d$chart$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["learningProgressChart"])(snapshot.states, snapshot.events, groups, now) : null;
    const today = now ? new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Berlin"
    }).format(now) : "";
    const rest = __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$career$2d$plan$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].breaks.find((pause)=>today >= pause.start && today <= pause.end);
    const next = snapshot ? __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$career$2d$plan$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].weeks.flatMap((week)=>[
            ...week.days,
            ...week.german ? [
                week.german
            ] : []
        ]).find((day)=>day.lessonIds.some((id)=>!snapshot.states[id]?.practiced)) : null;
    const nextWeek = next ? __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$career$2d$plan$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].weeks.find((week)=>week.days.some((day)=>day.id === next.id) || week.german?.id === next.id)?.number : null;
    const nextHref = next?.core ? `/learning-lab#${next.id}` : `/career#week-${nextWeek ?? 1}`;
    const ceiling = Math.max(4, ...chart?.history.map((point)=>point.completed) ?? []);
    const points = chart?.history.map((point, i)=>`${28 + i * 30},${118 - point.completed / ceiling * 90}`).join(" ") ?? "";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "learning-overview",
        lang: "de",
        dir: "ltr",
        "aria-labelledby": "learning-overview-title",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "learning-overview-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "learning-overview-eyebrow",
                                children: "DEIN LERNWEG"
                            }, void 0, false, {
                                fileName: "[project]/app/learning-progress-overview.tsx",
                                lineNumber: 51,
                                columnNumber: 56
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                id: "learning-overview-title",
                                children: "Jede eigene Übung zählt."
                            }, void 0, false, {
                                fileName: "[project]/app/learning-progress-overview.tsx",
                                lineNumber: 51,
                                columnNumber: 113
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "Hier siehst du, was du schon geschafft hast und welcher kleine Schritt als Nächstes ansteht."
                            }, void 0, false, {
                                fileName: "[project]/app/learning-progress-overview.tsx",
                                lineNumber: 51,
                                columnNumber: 175
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/learning-progress-overview.tsx",
                        lineNumber: 51,
                        columnNumber: 51
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `learning-connection ${connection}`,
                        role: "status",
                        children: connection === "live" ? "● Lernstand live verbunden" : connection === "loading" ? "Lernstand wird geladen …" : snapshot ? "Verbindung unterbrochen · letzter geladener Stand" : "Lernspeicher nicht erreichbar"
                    }, void 0, false, {
                        fileName: "[project]/app/learning-progress-overview.tsx",
                        lineNumber: 51,
                        columnNumber: 280
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/learning-progress-overview.tsx",
                lineNumber: 51,
                columnNumber: 5
            }, this),
            !chart ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "learning-overview-wait",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: connection === "loading" ? "Deine tatsächlichen Übungsnachweise werden geladen." : "Öffne OPEN-STUDY-WORKSPACE.cmd. Ohne Verbindung werden keine Fortschrittswerte angezeigt."
                    }, void 0, false, {
                        fileName: "[project]/app/learning-progress-overview.tsx",
                        lineNumber: 52,
                        columnNumber: 55
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/career",
                        children: "Zum Lernplan →"
                    }, void 0, false, {
                        fileName: "[project]/app/learning-progress-overview.tsx",
                        lineNumber: 52,
                        columnNumber: 238
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/learning-progress-overview.tsx",
                lineNumber: 52,
                columnNumber: 15
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "learning-overview-grid",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                className: "learning-overview-total",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "learning-ring",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                viewBox: "0 0 160 160",
                                                role: "img",
                                                "aria-label": `${chart.completed} von ${chart.total} Aufgaben erledigt, ${chart.percent} Prozent`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                        className: "learning-ring-base",
                                                        cx: "80",
                                                        cy: "80",
                                                        r: "68"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                                        lineNumber: 54,
                                                        columnNumber: 220
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                        className: "learning-ring-fill",
                                                        cx: "80",
                                                        cy: "80",
                                                        r: "68",
                                                        pathLength: "100",
                                                        strokeDasharray: `${chart.completed / chart.total * 100} 100`,
                                                        transform: "rotate(-90 80 80)"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                                        lineNumber: 54,
                                                        columnNumber: 284
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/learning-progress-overview.tsx",
                                                lineNumber: 54,
                                                columnNumber: 85
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                "aria-hidden": "true",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: chart.completed
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                                        lineNumber: 54,
                                                        columnNumber: 488
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: [
                                                            "von ",
                                                            chart.total
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                                        lineNumber: 54,
                                                        columnNumber: 522
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/learning-progress-overview.tsx",
                                                lineNumber: 54,
                                                columnNumber: 464
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                        lineNumber: 54,
                                        columnNumber: 54
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        children: chart.completed === 0 ? "Dein erster Nachweis macht den Anfang." : `${chart.completed} ${chart.completed === 1 ? "Aufgabe" : "Aufgaben"} selbst bearbeitet.`
                                    }, void 0, false, {
                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                        lineNumber: 54,
                                        columnNumber: 564
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: chart.completed === 0 ? "Beginne mit einer kleinen eigenen Antwort. Nach der Prüfung wird dein Fortschritt hier sichtbar." : `Dein letzter Übungsnachweis: ${chart.lastPractice ? shortDate(chart.lastPractice) : "Datum nicht verfügbar"}. Du kannst auf diesen Ergebnissen aufbauen.`
                                    }, void 0, false, {
                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                        lineNumber: 54,
                                        columnNumber: 731
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/learning-progress-overview.tsx",
                                lineNumber: 54,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                className: "learning-overview-tracks",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        children: "Drei Bereiche, dein Fortschritt"
                                    }, void 0, false, {
                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                        lineNumber: 55,
                                        columnNumber: 55
                                    }, this),
                                    chart.tracks.map((track)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `learning-track ${track.id}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                            href: track.href,
                                                            children: track.title
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/learning-progress-overview.tsx",
                                                            lineNumber: 55,
                                                            columnNumber: 188
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            children: [
                                                                track.completed,
                                                                " / ",
                                                                track.total
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/learning-progress-overview.tsx",
                                                            lineNumber: 55,
                                                            columnNumber: 232
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/learning-progress-overview.tsx",
                                                    lineNumber: 55,
                                                    columnNumber: 183
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("progress", {
                                                    max: track.total,
                                                    value: track.completed,
                                                    "aria-label": `${track.title}: ${track.completed} von ${track.total}`
                                                }, void 0, false, {
                                                    fileName: "[project]/app/learning-progress-overview.tsx",
                                                    lineNumber: 55,
                                                    columnNumber: 288
                                                }, this)
                                            ]
                                        }, track.id, true, {
                                            fileName: "[project]/app/learning-progress-overview.tsx",
                                            lineNumber: 55,
                                            columnNumber: 122
                                        }, this)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "learning-overview-note",
                                        children: "Grün zeigt bearbeitete Übungen mit Nachweis. Deutschwochen brauchen eigene Sprachproben und Rückmeldung. Die Zähler messen kein Sprach- oder Fachniveau."
                                    }, void 0, false, {
                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                        lineNumber: 55,
                                        columnNumber: 419
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/learning-progress-overview.tsx",
                                lineNumber: 55,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                className: "learning-overview-history",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        children: "Dein Weg in den letzten 14 Tagen"
                                    }, void 0, false, {
                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                        lineNumber: 56,
                                        columnNumber: 56
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: chart.hasPracticeHistory ? "Erledigte Aufgaben im Zeitverlauf. Eine Korrektur kann den Stand wieder senken." : "Noch keine Übung erfasst. Die erste geprüfte Arbeit ist dein erster Punkt im Verlauf."
                                    }, void 0, false, {
                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                        lineNumber: 56,
                                        columnNumber: 97
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        viewBox: "0 0 440 148",
                                        role: "img",
                                        "aria-label": "Verlauf erledigter Aufgaben über 14 Tage. Die genauen Werte stehen in der Tabelle darunter.",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                x1: "28",
                                                y1: "118",
                                                x2: "418",
                                                y2: "118",
                                                className: "learning-chart-grid"
                                            }, void 0, false, {
                                                fileName: "[project]/app/learning-progress-overview.tsx",
                                                lineNumber: 56,
                                                columnNumber: 447
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                x1: "28",
                                                y1: "28",
                                                x2: "418",
                                                y2: "28",
                                                className: "learning-chart-grid"
                                            }, void 0, false, {
                                                fileName: "[project]/app/learning-progress-overview.tsx",
                                                lineNumber: 56,
                                                columnNumber: 522
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                                x: "8",
                                                y: "122",
                                                children: "0"
                                            }, void 0, false, {
                                                fileName: "[project]/app/learning-progress-overview.tsx",
                                                lineNumber: 56,
                                                columnNumber: 595
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                                x: "8",
                                                y: "32",
                                                children: ceiling
                                            }, void 0, false, {
                                                fileName: "[project]/app/learning-progress-overview.tsx",
                                                lineNumber: 56,
                                                columnNumber: 623
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                points: points,
                                                fill: "none",
                                                className: chart.hasPracticeHistory ? "learning-chart-line" : "learning-chart-empty"
                                            }, void 0, false, {
                                                fileName: "[project]/app/learning-progress-overview.tsx",
                                                lineNumber: 56,
                                                columnNumber: 658
                                            }, this),
                                            chart.history.filter((point)=>point.completed > 0).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                cx: "418",
                                                cy: 118 - chart.history.at(-1).completed / ceiling * 90,
                                                r: "4",
                                                className: "learning-chart-dot"
                                            }, void 0, false, {
                                                fileName: "[project]/app/learning-progress-overview.tsx",
                                                lineNumber: 56,
                                                columnNumber: 850
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                                x: "28",
                                                y: "141",
                                                children: shortDate(chart.history[0].day)
                                            }, void 0, false, {
                                                fileName: "[project]/app/learning-progress-overview.tsx",
                                                lineNumber: 56,
                                                columnNumber: 965
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                                x: "418",
                                                y: "141",
                                                textAnchor: "end",
                                                children: shortDate(chart.history.at(-1).day)
                                            }, void 0, false, {
                                                fileName: "[project]/app/learning-progress-overview.tsx",
                                                lineNumber: 56,
                                                columnNumber: 1026
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                        lineNumber: 56,
                                        columnNumber: 304
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                                children: "Verlauf als Tabelle anzeigen"
                                            }, void 0, false, {
                                                fileName: "[project]/app/learning-progress-overview.tsx",
                                                lineNumber: 56,
                                                columnNumber: 1125
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("caption", {
                                                        children: "Erledigte Aufgaben am jeweiligen Tagesende; heute der aktuelle Stand"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                                        lineNumber: 56,
                                                        columnNumber: 1179
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    scope: "col",
                                                                    children: "Tag"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/learning-progress-overview.tsx",
                                                                    lineNumber: 56,
                                                                    columnNumber: 1277
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    scope: "col",
                                                                    children: "Erledigt"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/learning-progress-overview.tsx",
                                                                    lineNumber: 56,
                                                                    columnNumber: 1301
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/learning-progress-overview.tsx",
                                                            lineNumber: 56,
                                                            columnNumber: 1273
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                                        lineNumber: 56,
                                                        columnNumber: 1266
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                        children: chart.history.map((point)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        children: shortDate(point.day)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                                                        lineNumber: 56,
                                                                        columnNumber: 1398
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        children: point.completed
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                                                        lineNumber: 56,
                                                                        columnNumber: 1429
                                                                    }, this)
                                                                ]
                                                            }, point.day, true, {
                                                                fileName: "[project]/app/learning-progress-overview.tsx",
                                                                lineNumber: 56,
                                                                columnNumber: 1378
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                                        lineNumber: 56,
                                                        columnNumber: 1343
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/learning-progress-overview.tsx",
                                                lineNumber: 56,
                                                columnNumber: 1172
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                        lineNumber: 56,
                                        columnNumber: 1116
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/learning-progress-overview.tsx",
                                lineNumber: 56,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/learning-progress-overview.tsx",
                        lineNumber: 53,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "learning-overview-next",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: rest ? "Erholung gehört zum Plan" : chart.completed === chart.total ? "Zeit, deine Arbeit zu zeigen" : "DEIN NÄCHSTER KLEINER SCHRITT"
                                    }, void 0, false, {
                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                        lineNumber: 58,
                                        columnNumber: 52
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        children: rest ? `Ruhephase bis ${shortDate(rest.end)}` : next?.title ?? "Deine Ergebnisse prüfen und präsentieren"
                                    }, void 0, false, {
                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                        lineNumber: 58,
                                        columnNumber: 201
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: rest ? "Keine Nachholpflicht und keine zusätzlichen Deutschaufgaben. Dein bisheriger Fortschritt bleibt erhalten." : next?.action ?? "Vergleiche deine eigenen Arbeiten und hole Rückmeldung ein. Ein voller Lernplan ist keine Einstellungsgarantie."
                                    }, void 0, false, {
                                        fileName: "[project]/app/learning-progress-overview.tsx",
                                        lineNumber: 58,
                                        columnNumber: 317
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/learning-progress-overview.tsx",
                                lineNumber: 58,
                                columnNumber: 47
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: rest ? "/career" : nextHref,
                                children: [
                                    rest ? "Plan ansehen" : "Nächste Übung öffnen",
                                    " →"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/learning-progress-overview.tsx",
                                lineNumber: 58,
                                columnNumber: 578
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/learning-progress-overview.tsx",
                        lineNumber: 58,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "learning-overview-note",
                        children: [
                            "Automatisch aus dem gemeinsamen Lernspeicher. Pausen brauchen keine Serie und bringen keine Strafpunkte. ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/career",
                                children: "Gesamten Sechsmonatsplan öffnen"
                            }, void 0, false, {
                                fileName: "[project]/app/learning-progress-overview.tsx",
                                lineNumber: 59,
                                columnNumber: 150
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/learning-progress-overview.tsx",
                        lineNumber: 59,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/app/learning-progress-overview.tsx",
        lineNumber: 50,
        columnNumber: 10
    }, this);
}
_s(LearningProgressOverview, "FTJRb/JuNQTcizLe3DiAZCMb/tY=");
_c = LearningProgressOverview;
var _c;
__turbopack_context__.k.register(_c, "LearningProgressOverview");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_0qk5..6._.js.map