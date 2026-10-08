(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/register-service-worker.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RegisterServiceWorker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
function RegisterServiceWorker() {
    _s();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RegisterServiceWorker.useEffect": ()=>{
            if ("serviceWorker" in navigator) {
                void navigator.serviceWorker.register("/sw.js", {
                    scope: "/"
                });
            }
        }
    }["RegisterServiceWorker.useEffect"], []);
    return null;
}
_s(RegisterServiceWorker, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = RegisterServiceWorker;
var _c;
__turbopack_context__.k.register(_c, "RegisterServiceWorker");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/local-navigation.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LocalNavigation
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function LocalNavigation() {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    // The PDF reader has its own document navigation. A second floating
    // back/start/forward bar obscures notes and annotation controls.
    if (pathname.startsWith("/pdf-reader")) return null;
    const goBack = ()=>{
        if (window.history.length > 1) window.history.back();
        else window.location.assign("/");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
        className: "local-route-nav",
        "aria-label": "Seitennavigation",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: goBack,
                "aria-label": "Zur vorherigen Seite",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": "true",
                        children: "←"
                    }, void 0, false, {
                        fileName: "[project]/app/local-navigation.tsx",
                        lineNumber: 20,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                        children: "Zurück"
                    }, void 0, false, {
                        fileName: "[project]/app/local-navigation.tsx",
                        lineNumber: 20,
                        columnNumber: 42
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/local-navigation.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>window.location.assign("/"),
                "aria-label": "Zur Startseite",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": "true",
                        children: "⌂"
                    }, void 0, false, {
                        fileName: "[project]/app/local-navigation.tsx",
                        lineNumber: 23,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                        children: "Start"
                    }, void 0, false, {
                        fileName: "[project]/app/local-navigation.tsx",
                        lineNumber: 23,
                        columnNumber: 42
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/local-navigation.tsx",
                lineNumber: 22,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>window.location.assign("/learning-lab"),
                "aria-label": "Lernlabor und gemeinsamer Übungsfortschritt",
                "aria-current": pathname === "/learning-lab" ? "page" : undefined,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": "true",
                        children: "✓"
                    }, void 0, false, {
                        fileName: "[project]/app/local-navigation.tsx",
                        lineNumber: 26,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                        children: "Lernlabor"
                    }, void 0, false, {
                        fileName: "[project]/app/local-navigation.tsx",
                        lineNumber: 26,
                        columnNumber: 42
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/local-navigation.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>window.location.assign("/career"),
                "aria-label": "Sechsmonatsplan für Portfolio und Berufseinstieg",
                "aria-current": pathname === "/career" ? "page" : undefined,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": "true",
                        children: "↗"
                    }, void 0, false, {
                        fileName: "[project]/app/local-navigation.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                        children: "6 Monate"
                    }, void 0, false, {
                        fileName: "[project]/app/local-navigation.tsx",
                        lineNumber: 29,
                        columnNumber: 42
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/local-navigation.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>window.history.forward(),
                "aria-label": "Zur nächsten Seite",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                        children: "Weiter"
                    }, void 0, false, {
                        fileName: "[project]/app/local-navigation.tsx",
                        lineNumber: 32,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": "true",
                        children: "→"
                    }, void 0, false, {
                        fileName: "[project]/app/local-navigation.tsx",
                        lineNumber: 32,
                        columnNumber: 22
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/local-navigation.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/local-navigation.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
_s(LocalNavigation, "xbyQPtUVMO7MNj7WjJlpdWqRcTo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = LocalNavigation;
var _c;
__turbopack_context__.k.register(_c, "LocalNavigation");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/persian-hover-help.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PersianHoverHelp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
const exactHelp = {
    Heute: "داشبورد و مأموریت امروز را باز می‌کند.",
    Lernplan: "برنامهٔ کامل یادگیری و همهٔ هفته‌ها را نشان می‌دهد.",
    Kalender: "روزها و موعدهای برنامهٔ یادگیری را نمایش می‌دهد.",
    Bibliothek: "کتابخانه و ابزار مطالعهٔ PDF را باز می‌کند.",
    Fortschritt: "پیشرفت، ریتم مطالعه و شواهد انجام کار را نشان می‌دهد.",
    Einstellungen: "تنظیمات، اتصال‌ها، پشتیبان‌گیری و گزینه‌های دسترسی را باز می‌کند.",
    "PDF Visual": "PDF را برای انتخاب متن، یادداشت و علامت‌گذاری باز می‌کند.",
    Exposé: "نسخهٔ Exposé پروژه را در PDF Reader باز می‌کند.",
    "Fokus-Timer": "تایمر تمرکز برای کار فعلی را شروع می‌کند."
};
function labelOf(element) {
    return element.getAttribute("aria-label")?.trim() || element.textContent?.replace(/\s+/g, " ").trim() || "";
}
function helpFor(element) {
    const label = labelOf(element);
    const exact = exactHelp[label];
    if (exact) return exact;
    if (element.matches("a")) return `این پیوند بخش «${label || "بعدی"}» را باز می‌کند.`;
    if (element.matches("button, [role='button']")) {
        return `این دکمه عمل «${label || "انتخاب"}» را اجرا می‌کند.`;
    }
    return "این بخش عنوان و هدف محتوای زیر را توضیح می‌دهد.";
}
function interactiveElements(root) {
    return Array.from(root.querySelectorAll("a, button, [role='button'], h1, h2, h3"));
}
function PersianHoverHelp() {
    _s();
    const [tooltip, setTooltip] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PersianHoverHelp.useEffect": ()=>{
            const decorate = {
                "PersianHoverHelp.useEffect.decorate": (root = document)=>{
                    for (const element of interactiveElements(root)){
                        element.dataset.persianTooltip = helpFor(element);
                    }
                }
            }["PersianHoverHelp.useEffect.decorate"];
            const show = {
                "PersianHoverHelp.useEffect.show": (element)=>{
                    const rect = element.getBoundingClientRect();
                    const text = element.dataset.persianTooltip || helpFor(element);
                    const tooltipWidth = Math.min(320, Math.max(180, window.innerWidth - 24));
                    const halfWidth = tooltipWidth / 2;
                    const left = Math.min(Math.max(12 + halfWidth, rect.left + rect.width / 2), window.innerWidth - 12 - halfWidth);
                    const placement = rect.bottom + 110 > window.innerHeight ? "above" : "below";
                    const top = placement === "above" ? Math.max(12, rect.top - 10) : rect.bottom + 10;
                    setTooltip({
                        text,
                        top,
                        left,
                        placement
                    });
                }
            }["PersianHoverHelp.useEffect.show"];
            const targetFrom = {
                "PersianHoverHelp.useEffect.targetFrom": (event)=>event.target instanceof Element ? event.target.closest("[data-persian-tooltip]") : null
            }["PersianHoverHelp.useEffect.targetFrom"];
            const onPointerOver = {
                "PersianHoverHelp.useEffect.onPointerOver": (event)=>{
                    const target = targetFrom(event);
                    if (target) show(target);
                }
            }["PersianHoverHelp.useEffect.onPointerOver"];
            const onPointerOut = {
                "PersianHoverHelp.useEffect.onPointerOut": (event)=>{
                    const target = targetFrom(event);
                    if (target && event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) {
                        return;
                    }
                    setTooltip(null);
                }
            }["PersianHoverHelp.useEffect.onPointerOut"];
            const onFocusIn = {
                "PersianHoverHelp.useEffect.onFocusIn": (event)=>{
                    const target = targetFrom(event);
                    if (target) show(target);
                }
            }["PersianHoverHelp.useEffect.onFocusIn"];
            const onFocusOut = {
                "PersianHoverHelp.useEffect.onFocusOut": ()=>setTooltip(null)
            }["PersianHoverHelp.useEffect.onFocusOut"];
            decorate();
            const observer = new MutationObserver({
                "PersianHoverHelp.useEffect": (records)=>{
                    for (const record of records){
                        for (const node of record.addedNodes){
                            if (node instanceof HTMLElement) {
                                if (node.matches("a, button, [role='button'], h1, h2, h3")) {
                                    node.dataset.persianTooltip = helpFor(node);
                                }
                                decorate(node);
                            }
                        }
                    }
                }
            }["PersianHoverHelp.useEffect"]);
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            document.addEventListener("pointerover", onPointerOver);
            document.addEventListener("pointerout", onPointerOut);
            document.addEventListener("focusin", onFocusIn);
            document.addEventListener("focusout", onFocusOut);
            return ({
                "PersianHoverHelp.useEffect": ()=>{
                    observer.disconnect();
                    document.removeEventListener("pointerover", onPointerOver);
                    document.removeEventListener("pointerout", onPointerOut);
                    document.removeEventListener("focusin", onFocusIn);
                    document.removeEventListener("focusout", onFocusOut);
                }
            })["PersianHoverHelp.useEffect"];
        }
    }["PersianHoverHelp.useEffect"], []);
    if (!tooltip) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "persian-hover-tooltip",
        lang: "fa",
        role: "tooltip",
        "data-placement": tooltip.placement,
        style: {
            left: tooltip.left,
            top: tooltip.top
        },
        children: tooltip.text
    }, void 0, false, {
        fileName: "[project]/app/persian-hover-help.tsx",
        lineNumber: 126,
        columnNumber: 5
    }, this);
}
_s(PersianHoverHelp, "n5CByNRaE9Yv1TpL2fiUEE+QEC4=");
_c = PersianHoverHelp;
var _c;
__turbopack_context__.k.register(_c, "PersianHoverHelp");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/werkzeug-settings.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_WERKZEUG_SETTINGS",
    ()=>DEFAULT_WERKZEUG_SETTINGS,
    "WERKZEUG_SETTINGS_VERSION",
    ()=>WERKZEUG_SETTINGS_VERSION,
    "isTrustedOrigin",
    ()=>isTrustedOrigin,
    "normalizeWerkzeugSettings",
    ()=>normalizeWerkzeugSettings,
    "settingsForClient",
    ()=>settingsForClient
]);
const WERKZEUG_SETTINGS_VERSION = 1;
const CURRENT_SITE_ORIGIN = "http://127.0.0.1:4312";
const LEGACY_CHATGPT_SITE_ORIGIN = /^https:\/\/[^/]+\.chatgpt\.site(?=\/|$)/i;
const DEFAULT_WERKZEUG_SETTINGS = {
    version: WERKZEUG_SETTINGS_VERSION,
    labels: {
        appName: "Einstellungen",
        appSubtitle: "Zentrale Einstellungen für alle Apps",
        groups: {
            personal: "Profil & Darstellung",
            work: "Arbeit, Planung & Fokus",
            services: "Dienste & Berechtigungen",
            organization: "Projekte, Ordner & Apps",
            data: "Daten & Sicherung"
        },
        sections: {
            profile: "Profilbild und menschlicher Avatar",
            planning: "Persönliche Planparameter",
            accessibility: "ADHS- und Dyslexie-Einstellungen",
            permissions: "Berechtigungen und verbundene Dienste",
            organization: "Projekte und verschachtelte Ordner",
            sharing: "Von anderen Programmen aufrufen",
            backup: "Datensicherung"
        },
        services: {
            google: "Google Workspace",
            calendar: "Google Calendar",
            gmail: "Gmail",
            drive: "Google Drive",
            openai: "OpenAI",
            deepl: "DeepL"
        },
        folderLevels: {
            project: "Projekt",
            subproject: "Teilprojekt",
            topic: "Thema",
            material: "Material"
        },
        navigation: {
            workspace: "Arbeitsbereich",
            calendar: "Kalender & Kapazität",
            calendarSubtitle: "Programm und Termine",
            programEntries: "Programmeinträge",
            mail: "E-Mails & Dokumente",
            mailSubtitle: "Selektiver Import",
            notes: "Notizen",
            notesSubtitle: "Automatisch gespeichert",
            connections: "Verbindungen",
            connectionsSubtitle: "Google & Einbettung",
            centralSettings: "Zentrale Einstellungen",
            centralSettingsSubtitle: "Für alle verbundenen Apps",
            standaloneApp: "Eigenständige App"
        },
        cards: {
            centralSettings: "Zentrale Einstellungen",
            jsonImport: "JSON-Plan importieren",
            embed: "In andere Apps einbetten",
            integrationApi: "Sichere Integrations-API"
        }
    },
    profile: {
        displayName: "Benutzerin",
        language: "de",
        timezone: "Europe/Berlin",
        humanAvatar: true
    },
    planning: {
        projectName: "Cross_Repository_Code_Intelligence",
        planName: "Cross Repository Code Intelligence – 37-Wochen-Vollzeitplan",
        planStartDate: "",
        planEndDate: "",
        planStatus: "not_started",
        planPausedAt: "",
        dailyWorkMode: "full",
        totalPlanWeeks: 37,
        dailyCapacityMinutes: 480,
        weeklyGoalMinutes: 2400,
        workdayStart: "09:00",
        restDays: [
            0,
            6
        ]
    },
    accessibility: {
        focusMode: false,
        largerText: false,
        generousLineHeight: true,
        readingRuler: false,
        reducedMotion: false
    },
    permissions: {
        googleCalendarRead: true,
        gmailRead: false,
        googleDriveRead: true
    },
    ai: {
        explanationProvider: "openai",
        translationProvider: "deepl",
        targetLanguage: "fa"
    },
    organization: {
        nestedFolders: true,
        defaultProjectFolder: "Projekte",
        sources: [
            {
                id: "source-github-thesis",
                name: "Thesis Repository",
                kind: "github",
                location: "https://github.com/Hajimohammadi-KI/Cross-Repository-Code-Intelligence",
                enabled: true
            },
            {
                id: "source-drive-research-pdfs",
                name: "Cross Repository · Forschungs-PDFs",
                kind: "google_drive",
                location: "https://drive.google.com/drive/folders/1rJmYt-fJrv06HjRntIGJtczYB7yy1GAW",
                enabled: true
            },
            {
                id: "source-local-project",
                name: "Lokale Installation",
                kind: "local",
                location: "%LOCALAPPDATA%\\CrossRepositoryCodeIntelligence",
                enabled: true
            }
        ]
    },
    integration: {
        trustedOrigins: [],
        clients: [],
        notifyOnChange: true,
        links: {
            homeUrl: CURRENT_SITE_ORIGIN,
            settingsUrl: `${CURRENT_SITE_ORIGIN}/settings`,
            embedUrl: `${CURRENT_SITE_ORIGIN}/settings?embed=1`,
            sdkUrl: `${CURRENT_SITE_ORIGIN}/einstellungen.js`,
            apiBaseUrl: `${CURRENT_SITE_ORIGIN}/api`,
            helpUrl: `${CURRENT_SITE_ORIGIN}/settings`,
            googleCallbackUrl: `${CURRENT_SITE_ORIGIN}/api/google/callback`,
            googleJavaScriptOrigin: CURRENT_SITE_ORIGIN,
            googleProjectNumber: "996682910931",
            googleTestUserEmail: "fatemeh.hajimohammadi.DE@gmail.com",
            googleAudienceUrl: "https://console.cloud.google.com/auth/audience?project=quiet-groove-504813-f0",
            googleCredentialsUrl: "https://console.cloud.google.com/auth/clients?project=quiet-groove-504813-f0",
            googleDriveApiUrl: "https://console.cloud.google.com/apis/api/drive.googleapis.com/overview?project=quiet-groove-504813-f0",
            googleCalendarApiUrl: "https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/overview?project=quiet-groove-504813-f0",
            googleGmailApiUrl: "https://console.cloud.google.com/apis/api/gmail.googleapis.com/overview?project=quiet-groove-504813-f0"
        }
    },
    updatedAt: ""
};
const asObject = (value)=>value && typeof value === "object" ? value : {};
const asString = (value, fallback)=>typeof value === "string" ? value.slice(0, 500) : fallback;
const asLink = (value, fallback)=>{
    const link = asString(value, fallback).trim();
    return LEGACY_CHATGPT_SITE_ORIGIN.test(link) ? link.replace(LEGACY_CHATGPT_SITE_ORIGIN, CURRENT_SITE_ORIGIN) : link;
};
const asBoolean = (value, fallback)=>typeof value === "boolean" ? value : fallback;
const asNumber = (value, fallback, min, max)=>typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
function normalizeWerkzeugSettings(value) {
    const root = asObject(value);
    const labels = asObject(root.labels);
    const labelGroups = asObject(labels.groups);
    const labelSections = asObject(labels.sections);
    const labelServices = asObject(labels.services);
    const folderLevels = asObject(labels.folderLevels);
    const labelNavigation = asObject(labels.navigation);
    const labelCards = asObject(labels.cards);
    const profile = asObject(root.profile);
    const planning = asObject(root.planning);
    const accessibility = asObject(root.accessibility);
    const permissions = asObject(root.permissions);
    const ai = asObject(root.ai);
    const organization = asObject(root.organization);
    const integration = asObject(root.integration);
    const links = asObject(integration.links);
    const language = [
        "de",
        "en",
        "fa"
    ].includes(String(profile.language)) ? profile.language : DEFAULT_WERKZEUG_SETTINGS.profile.language;
    const explanationProvider = [
        "openai",
        "none"
    ].includes(String(ai.explanationProvider)) ? ai.explanationProvider : DEFAULT_WERKZEUG_SETTINGS.ai.explanationProvider;
    const translationProvider = [
        "deepl",
        "openai",
        "none"
    ].includes(String(ai.translationProvider)) ? ai.translationProvider : DEFAULT_WERKZEUG_SETTINGS.ai.translationProvider;
    const targetLanguage = [
        "fa",
        "de",
        "en"
    ].includes(String(ai.targetLanguage)) ? ai.targetLanguage : DEFAULT_WERKZEUG_SETTINGS.ai.targetLanguage;
    const restDays = Array.isArray(planning.restDays) ? planning.restDays.filter((day)=>Number.isInteger(day) && Number(day) >= 0 && Number(day) <= 6) : DEFAULT_WERKZEUG_SETTINGS.planning.restDays;
    const trustedOrigins = Array.isArray(integration.trustedOrigins) ? integration.trustedOrigins.map((origin)=>String(origin).trim()).filter((origin)=>/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(origin)).slice(0, 25) : DEFAULT_WERKZEUG_SETTINGS.integration.trustedOrigins;
    const allowedGrants = [
        "profile",
        "planning",
        "accessibility",
        "permissions",
        "ai",
        "organization"
    ];
    const clientList = Array.isArray(integration.clients) ? integration.clients : null;
    const hasClientList = clientList !== null;
    const clients = clientList ? clientList.slice(0, 25).map((raw, index)=>{
        const client = asObject(raw);
        const grants = Array.isArray(client.grants) ? client.grants.map(String).filter((grant)=>allowedGrants.includes(grant)) : allowedGrants;
        return {
            id: asString(client.id, `app-${index + 1}`),
            displayName: asString(client.displayName, `App ${index + 1}`),
            origin: asString(client.origin, ""),
            enabled: asBoolean(client.enabled, true),
            grants: [
                ...new Set(grants)
            ]
        };
    }) : trustedOrigins.map((origin, index)=>({
            id: `legacy-${index + 1}`,
            displayName: new URL(origin).hostname,
            origin,
            enabled: true,
            grants: allowedGrants
        }));
    const clientOrigins = clients.filter((client)=>client.enabled && /^https?:\/\//i.test(client.origin)).map((client)=>client.origin.replace(/\/$/, ""));
    const allowedSourceKinds = [
        "github",
        "google_drive",
        "local"
    ];
    const seenSourceIds = new Set();
    const sources = Array.isArray(organization.sources) ? organization.sources.slice(0, 100).map((raw, index)=>{
        const source = asObject(raw);
        const kind = allowedSourceKinds.includes(source.kind) ? source.kind : "github";
        const requestedId = asString(source.id, `source-${index + 1}`).replace(/[^a-zA-Z0-9_-]/g, "-") || `source-${index + 1}`;
        let id = requestedId;
        let duplicate = 2;
        while(seenSourceIds.has(id))id = `${requestedId}-${duplicate++}`;
        seenSourceIds.add(id);
        const fallbackName = kind === "github" ? "GitHub-Repository" : kind === "google_drive" ? "Google-Drive-Ordner" : "Lokaler Ordner";
        return {
            id,
            name: asString(source.name, fallbackName),
            kind,
            location: asString(source.location, ""),
            enabled: asBoolean(source.enabled, true)
        };
    }) : DEFAULT_WERKZEUG_SETTINGS.organization.sources;
    const migratedSources = sources.map((source)=>source.id === "source-drive-research-pdfs" || source.location.includes("1WDq_TqkacdaQPHSw6kVandumb65_q90D") ? {
            ...source,
            id: "source-drive-research-pdfs",
            name: "Cross Repository · Forschungs-PDFs",
            kind: "google_drive",
            location: "https://drive.google.com/drive/folders/1rJmYt-fJrv06HjRntIGJtczYB7yy1GAW",
            enabled: true
        } : source);
    return {
        version: WERKZEUG_SETTINGS_VERSION,
        labels: {
            appName: asString(labels.appName, DEFAULT_WERKZEUG_SETTINGS.labels.appName),
            appSubtitle: asString(labels.appSubtitle, DEFAULT_WERKZEUG_SETTINGS.labels.appSubtitle),
            groups: {
                personal: asString(labelGroups.personal, DEFAULT_WERKZEUG_SETTINGS.labels.groups.personal),
                work: asString(labelGroups.work, DEFAULT_WERKZEUG_SETTINGS.labels.groups.work),
                services: asString(labelGroups.services, DEFAULT_WERKZEUG_SETTINGS.labels.groups.services),
                organization: asString(labelGroups.organization, DEFAULT_WERKZEUG_SETTINGS.labels.groups.organization),
                data: asString(labelGroups.data, DEFAULT_WERKZEUG_SETTINGS.labels.groups.data)
            },
            sections: {
                profile: asString(labelSections.profile, DEFAULT_WERKZEUG_SETTINGS.labels.sections.profile),
                planning: asString(labelSections.planning, DEFAULT_WERKZEUG_SETTINGS.labels.sections.planning),
                accessibility: asString(labelSections.accessibility, DEFAULT_WERKZEUG_SETTINGS.labels.sections.accessibility),
                permissions: asString(labelSections.permissions, DEFAULT_WERKZEUG_SETTINGS.labels.sections.permissions),
                organization: asString(labelSections.organization, DEFAULT_WERKZEUG_SETTINGS.labels.sections.organization),
                sharing: asString(labelSections.sharing, DEFAULT_WERKZEUG_SETTINGS.labels.sections.sharing),
                backup: asString(labelSections.backup, DEFAULT_WERKZEUG_SETTINGS.labels.sections.backup)
            },
            services: {
                google: asString(labelServices.google, DEFAULT_WERKZEUG_SETTINGS.labels.services.google),
                calendar: asString(labelServices.calendar, DEFAULT_WERKZEUG_SETTINGS.labels.services.calendar),
                gmail: asString(labelServices.gmail, DEFAULT_WERKZEUG_SETTINGS.labels.services.gmail),
                drive: asString(labelServices.drive, DEFAULT_WERKZEUG_SETTINGS.labels.services.drive),
                openai: asString(labelServices.openai, DEFAULT_WERKZEUG_SETTINGS.labels.services.openai),
                deepl: asString(labelServices.deepl, DEFAULT_WERKZEUG_SETTINGS.labels.services.deepl)
            },
            folderLevels: {
                project: asString(folderLevels.project, DEFAULT_WERKZEUG_SETTINGS.labels.folderLevels.project),
                subproject: asString(folderLevels.subproject, DEFAULT_WERKZEUG_SETTINGS.labels.folderLevels.subproject),
                topic: asString(folderLevels.topic, DEFAULT_WERKZEUG_SETTINGS.labels.folderLevels.topic),
                material: asString(folderLevels.material, DEFAULT_WERKZEUG_SETTINGS.labels.folderLevels.material)
            },
            navigation: {
                workspace: asString(labelNavigation.workspace, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.workspace),
                calendar: asString(labelNavigation.calendar, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.calendar),
                calendarSubtitle: asString(labelNavigation.calendarSubtitle, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.calendarSubtitle),
                programEntries: asString(labelNavigation.programEntries, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.programEntries),
                mail: asString(labelNavigation.mail, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.mail),
                mailSubtitle: asString(labelNavigation.mailSubtitle, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.mailSubtitle),
                notes: asString(labelNavigation.notes, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.notes),
                notesSubtitle: asString(labelNavigation.notesSubtitle, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.notesSubtitle),
                connections: asString(labelNavigation.connections, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.connections),
                connectionsSubtitle: asString(labelNavigation.connectionsSubtitle, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.connectionsSubtitle),
                centralSettings: asString(labelNavigation.centralSettings, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.centralSettings),
                centralSettingsSubtitle: asString(labelNavigation.centralSettingsSubtitle, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.centralSettingsSubtitle),
                standaloneApp: asString(labelNavigation.standaloneApp, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.standaloneApp)
            },
            cards: {
                centralSettings: asString(labelCards.centralSettings, DEFAULT_WERKZEUG_SETTINGS.labels.cards.centralSettings),
                jsonImport: asString(labelCards.jsonImport, DEFAULT_WERKZEUG_SETTINGS.labels.cards.jsonImport),
                embed: asString(labelCards.embed, DEFAULT_WERKZEUG_SETTINGS.labels.cards.embed),
                integrationApi: asString(labelCards.integrationApi, DEFAULT_WERKZEUG_SETTINGS.labels.cards.integrationApi)
            }
        },
        profile: {
            displayName: asString(profile.displayName, DEFAULT_WERKZEUG_SETTINGS.profile.displayName),
            language,
            timezone: asString(profile.timezone, DEFAULT_WERKZEUG_SETTINGS.profile.timezone),
            humanAvatar: asBoolean(profile.humanAvatar, DEFAULT_WERKZEUG_SETTINGS.profile.humanAvatar)
        },
        planning: {
            projectName: asString(planning.projectName, DEFAULT_WERKZEUG_SETTINGS.planning.projectName),
            planName: asString(planning.planName, DEFAULT_WERKZEUG_SETTINGS.planning.planName),
            planStartDate: planning.planStatus !== "running" && planning.planStatus !== "paused" && String(planning.planStartDate) === "2026-08-07" ? "" : /^\d{4}-\d{2}-\d{2}$/.test(String(planning.planStartDate)) ? String(planning.planStartDate) : "",
            planEndDate: planning.planStatus !== "running" && planning.planStatus !== "paused" && String(planning.planEndDate) === "2027-02-13" ? "" : /^\d{4}-\d{2}-\d{2}$/.test(String(planning.planEndDate)) ? String(planning.planEndDate) : "",
            planStatus: planning.planStatus === "paused" || planning.planStatus === "running" ? planning.planStatus : "not_started",
            planPausedAt: /^\d{4}-\d{2}-\d{2}$/.test(String(planning.planPausedAt)) ? String(planning.planPausedAt) : "",
            dailyWorkMode: planning.dailyWorkMode === "rescue" || planning.dailyWorkMode === "full" ? planning.dailyWorkMode : "light",
            totalPlanWeeks: asNumber(planning.totalPlanWeeks, DEFAULT_WERKZEUG_SETTINGS.planning.totalPlanWeeks, 1, 104),
            dailyCapacityMinutes: asNumber(planning.dailyCapacityMinutes, DEFAULT_WERKZEUG_SETTINGS.planning.dailyCapacityMinutes, 30, 960),
            weeklyGoalMinutes: asNumber(planning.weeklyGoalMinutes, DEFAULT_WERKZEUG_SETTINGS.planning.weeklyGoalMinutes, 30, 6000),
            workdayStart: /^\d{2}:\d{2}$/.test(String(planning.workdayStart)) ? String(planning.workdayStart) : DEFAULT_WERKZEUG_SETTINGS.planning.workdayStart,
            restDays: [
                ...new Set(restDays)
            ]
        },
        accessibility: {
            focusMode: asBoolean(accessibility.focusMode, DEFAULT_WERKZEUG_SETTINGS.accessibility.focusMode),
            largerText: asBoolean(accessibility.largerText, DEFAULT_WERKZEUG_SETTINGS.accessibility.largerText),
            generousLineHeight: asBoolean(accessibility.generousLineHeight, DEFAULT_WERKZEUG_SETTINGS.accessibility.generousLineHeight),
            readingRuler: asBoolean(accessibility.readingRuler, DEFAULT_WERKZEUG_SETTINGS.accessibility.readingRuler),
            reducedMotion: asBoolean(accessibility.reducedMotion, DEFAULT_WERKZEUG_SETTINGS.accessibility.reducedMotion)
        },
        permissions: {
            googleCalendarRead: asBoolean(permissions.googleCalendarRead, DEFAULT_WERKZEUG_SETTINGS.permissions.googleCalendarRead),
            gmailRead: asBoolean(permissions.gmailRead, DEFAULT_WERKZEUG_SETTINGS.permissions.gmailRead),
            googleDriveRead: asBoolean(permissions.googleDriveRead, DEFAULT_WERKZEUG_SETTINGS.permissions.googleDriveRead)
        },
        ai: {
            explanationProvider,
            translationProvider,
            targetLanguage
        },
        organization: {
            nestedFolders: asBoolean(organization.nestedFolders, DEFAULT_WERKZEUG_SETTINGS.organization.nestedFolders),
            defaultProjectFolder: asString(organization.defaultProjectFolder, DEFAULT_WERKZEUG_SETTINGS.organization.defaultProjectFolder),
            sources: migratedSources
        },
        integration: {
            trustedOrigins: [
                ...new Set(hasClientList ? clientOrigins : [
                    ...trustedOrigins,
                    ...clientOrigins
                ])
            ],
            clients,
            notifyOnChange: asBoolean(integration.notifyOnChange, DEFAULT_WERKZEUG_SETTINGS.integration.notifyOnChange),
            links: {
                homeUrl: asLink(links.homeUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.homeUrl),
                settingsUrl: asLink(links.settingsUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.settingsUrl),
                embedUrl: asLink(links.embedUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.embedUrl),
                sdkUrl: asLink(links.sdkUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.sdkUrl),
                apiBaseUrl: asLink(links.apiBaseUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.apiBaseUrl),
                helpUrl: asLink(links.helpUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.helpUrl),
                googleCallbackUrl: asLink(links.googleCallbackUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleCallbackUrl),
                googleJavaScriptOrigin: asLink(links.googleJavaScriptOrigin, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleJavaScriptOrigin),
                googleProjectNumber: asString(links.googleProjectNumber, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleProjectNumber),
                googleTestUserEmail: asString(links.googleTestUserEmail, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleTestUserEmail),
                googleAudienceUrl: asLink(links.googleAudienceUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleAudienceUrl),
                googleCredentialsUrl: asLink(links.googleCredentialsUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleCredentialsUrl),
                googleDriveApiUrl: asLink(links.googleDriveApiUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleDriveApiUrl),
                googleCalendarApiUrl: asLink(links.googleCalendarApiUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleCalendarApiUrl),
                googleGmailApiUrl: asLink(links.googleGmailApiUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleGmailApiUrl)
            }
        },
        updatedAt: asString(root.updatedAt, "")
    };
}
function isTrustedOrigin(settings, origin, ownOrigin) {
    return origin === ownOrigin || settings.integration.clients.some((client)=>client.enabled && client.origin.replace(/\/$/, "") === origin) || settings.integration.trustedOrigins.includes(origin);
}
function settingsForClient(settings, origin, requested) {
    if (typeof location !== "undefined" && origin === location.origin) return settings;
    const client = settings.integration.clients.find((entry)=>entry.enabled && entry.origin.replace(/\/$/, "") === origin);
    const grants = client?.grants ?? [];
    const allowed = requested?.length ? grants.filter((grant)=>requested.includes(grant)) : grants;
    const result = {
        version: settings.version,
        labels: settings.labels,
        links: settings.integration.links,
        updatedAt: settings.updatedAt
    };
    allowed.forEach((grant)=>{
        result[grant] = settings[grant];
    });
    return result;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/reading-ruler.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "READING_RULER_EVENT",
    ()=>READING_RULER_EVENT,
    "default",
    ()=>ReadingRuler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$werkzeug$2d$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/werkzeug-settings.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const SETTINGS_KEYS = [
    "einstellungen-settings-v1",
    "werkzeug-settings-v1"
];
const READING_RULER_EVENT = "werkzeug:reading-ruler-changed";
function storedSettings() {
    for (const key of SETTINGS_KEYS){
        const value = localStorage.getItem(key);
        if (!value) continue;
        try {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$werkzeug$2d$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalizeWerkzeugSettings"])(JSON.parse(value));
        } catch  {
        // Try the next compatible storage key.
        }
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$werkzeug$2d$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_WERKZEUG_SETTINGS"];
}
function ReadingRuler() {
    _s();
    const [settings, setSettings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$werkzeug$2d$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_WERKZEUG_SETTINGS"]);
    const [rulerTop, setRulerTop] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(160);
    const [rulerHeight, setRulerHeight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(32);
    const enabled = settings.accessibility.readingRuler;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ReadingRuler.useEffect": ()=>{
            queueMicrotask({
                "ReadingRuler.useEffect": ()=>setSettings(storedSettings())
            }["ReadingRuler.useEffect"]);
            const receiveSettings = {
                "ReadingRuler.useEffect.receiveSettings": (event)=>{
                    const detail = event.detail;
                    if (detail) setSettings((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$werkzeug$2d$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalizeWerkzeugSettings"])(detail));
                }
            }["ReadingRuler.useEffect.receiveSettings"];
            const receiveStorage = {
                "ReadingRuler.useEffect.receiveStorage": (event)=>{
                    if (event.key && SETTINGS_KEYS.includes(event.key)) {
                        setSettings(storedSettings());
                    }
                }
            }["ReadingRuler.useEffect.receiveStorage"];
            window.addEventListener(READING_RULER_EVENT, receiveSettings);
            window.addEventListener("storage", receiveStorage);
            return ({
                "ReadingRuler.useEffect": ()=>{
                    window.removeEventListener(READING_RULER_EVENT, receiveSettings);
                    window.removeEventListener("storage", receiveStorage);
                }
            })["ReadingRuler.useEffect"];
        }
    }["ReadingRuler.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ReadingRuler.useEffect": ()=>{
            if (!enabled) return;
            const followPointer = {
                "ReadingRuler.useEffect.followPointer": (event)=>{
                    const target = event.target instanceof Element ? event.target : document.body;
                    const style = getComputedStyle(target);
                    const fontSize = Number.parseFloat(style.fontSize) || 16;
                    const measuredLineHeight = Number.parseFloat(style.lineHeight);
                    const lineHeight = Number.isFinite(measuredLineHeight) ? measuredLineHeight : fontSize * 1.65;
                    // Keep the guide around a line of text. It must never tint the text itself.
                    const nextHeight = Math.min(78, Math.max(34, lineHeight + Math.max(12, fontSize * 0.55)));
                    setRulerHeight(nextHeight);
                    setRulerTop(Math.min(window.innerHeight - nextHeight / 2, Math.max(nextHeight / 2, event.clientY)));
                }
            }["ReadingRuler.useEffect.followPointer"];
            window.addEventListener("pointermove", followPointer, {
                passive: true
            });
            return ({
                "ReadingRuler.useEffect": ()=>window.removeEventListener("pointermove", followPointer)
            })["ReadingRuler.useEffect"];
        }
    }["ReadingRuler.useEffect"], [
        enabled
    ]);
    const toggle = (readingRuler)=>{
        const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$werkzeug$2d$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalizeWerkzeugSettings"])({
            ...settings,
            accessibility: {
                ...settings.accessibility,
                readingRuler
            },
            updatedAt: new Date().toISOString()
        });
        setSettings(next);
        localStorage.setItem(SETTINGS_KEYS[0], JSON.stringify(next));
        window.dispatchEvent(new CustomEvent(READING_RULER_EVENT, {
            detail: next
        }));
        void fetch("/api/settings", {
            method: "PUT",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                settings: next
            })
        }).catch(()=>undefined);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            enabled ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "aria-hidden": "true",
                className: "global-reading-ruler",
                style: {
                    height: rulerHeight,
                    top: rulerTop
                }
            }, void 0, false, {
                fileName: "[project]/components/reading-ruler.tsx",
                lineNumber: 91,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "global-reading-ruler-toggle",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        "aria-label": "Leselineal auf dieser Seite",
                        id: "global-reading-ruler-toggle",
                        name: "global-reading-ruler",
                        checked: enabled,
                        onChange: (event)=>toggle(event.target.checked),
                        type: "checkbox"
                    }, void 0, false, {
                        fileName: "[project]/components/reading-ruler.tsx",
                        lineNumber: 98,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Leselineal"
                    }, void 0, false, {
                        fileName: "[project]/components/reading-ruler.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/reading-ruler.tsx",
                lineNumber: 97,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s(ReadingRuler, "oWgkfUylG4DtIqIP40j4NY7aEnE=");
_c = ReadingRuler;
var _c;
__turbopack_context__.k.register(_c, "ReadingRuler");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_0w7vwha._.js.map