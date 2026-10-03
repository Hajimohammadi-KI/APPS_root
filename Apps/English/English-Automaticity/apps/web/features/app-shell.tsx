"use client";
import { AutomaticityEvidenceSummary } from "./components/automaticity-evidence-summary";

import * as React from "react";
import { LearningNavigation } from "@/components/learning-navigation";
import dynamic from "next/dynamic";
import {
	BookOpenText,
	BrainCircuit,
	CircleAlert,
	CloudDownload,
	Flame,
	FileMusic,
	BookMarked,
	House,
	LibraryBig,
	Menu,
	MessagesSquare,
	Settings,
	Languages,
	GraduationCap,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppUpdateNotice } from "@/features/components/app-update-notice";
import { ApiConnectionStatus } from "@/features/components/api-connection-status";
import { InstallAppControl } from "@/features/components/install-app-control";
import { NeuroReader } from "@/features/components/neuro-reader";
import { DashboardV2Screen } from "@/features/screens/dashboard-v2-screen";
import { useAppStore } from "@/features/store/app-store";
import { UserGuideButton } from "@/features/user-guide";

const AutomaticityScreen = dynamic(() =>
	import("@/features/screens/automaticity-screen").then(
		(module) => module.AutomaticityScreen,
	),
);
const ResourcesScreen = dynamic(() =>
	import("@/features/screens/resources-screen").then(
		(module) => module.ResourcesScreen,
	),
);
const IntegratedSkillsScreen = dynamic(() =>
	import("@/features/screens/integrated-skills-screen").then(
		(module) => module.IntegratedSkillsScreen,
	),
);
const ErrorsScreen = dynamic(() =>
	import("@/features/screens/errors-screen").then(
		(module) => module.ErrorsScreen,
	),
);
const AudioScreen = dynamic(() =>
	import("@/features/screens/audio-screen").then(
		(module) => module.AudioScreen,
	),
);

type ScreenId =
	| "home"
	| "studio"
	| "daily"
	| "progress"
	| "grammar"
	| "integrated-skills"
	| "resources"
	| "errors"
	| "library"
	| "notebook"
	| "flashcards"
	| "settings"
	| "teacher";

interface NavigationItem {
	id: ScreenId;
	label: string;
	subtitle: string;
	icon: React.ComponentType<{ className?: string }>;
}

const homeNavigation: NavigationItem = {
	id: "home",
	label: "Home",
	subtitle: "Progress and next step",
	icon: House,
};

const navigation: NavigationItem[] = [
	homeNavigation,
	{
		id: "daily",
		label: "Today's Practice",
		subtitle: "Adaptive recall and automaticity",
		icon: Flame,
	},
	{
		id: "studio",
		label: "Conversation Studio",
		subtitle: "Speak, correct, and repeat",
		icon: MessagesSquare,
	},
	{
		id: "grammar",
		label: "Grammar Lab",
		subtitle: "112 units from A1 to C2",
		icon: BookOpenText,
	},
	{
		id: "resources",
		label: "Learning Resources",
		subtitle: "43 direct source collections",
		icon: CloudDownload,
	},
	{
		id: "integrated-skills",
		label: "Integrated Skills",
		subtitle: "A1-C2 · 72 units · 4 skills",
		icon: LibraryBig,
	},
	{
		id: "errors",
		label: "Error Workshop",
		subtitle: "Fix recurring errors with focus",
		icon: CircleAlert,
	},
	{
		id: "progress",
		label: "Progress Evidence",
		subtitle: "Mastery, transfer, and delayed recall",
		icon: BrainCircuit,
	},
	{
		id: "library",
		label: "Audio Library",
		subtitle: "Review your spoken progress",
		icon: FileMusic,
	},
	{
		id: "notebook",
		label: "Notebook & PDF Reader",
		subtitle: "Read, highlight, comment, and save",
		icon: BookMarked,
	},
	{
		id: "flashcards",
		label: "Vocabulary & Flashcards",
		subtitle: "LexiBridge recall and spaced review",
		icon: Languages,
	},
	{
		id: "settings",
		label: "Settings",
		subtitle: "Learning, storage, and platform",
		icon: Settings,
	},
	{
		id: "teacher",
		label: "Teacher Studio",
		subtitle: "Manage content and human recordings",
		icon: GraduationCap,
	},
];

function isScreenId(value: string | null): value is ScreenId {
	return navigation.some((item) => item.id === value);
}

const replacementRoutes: Partial<Record<ScreenId, string>> = {
	daily: "/daily",
	studio: "/studio",
	grammar: "/grammar",
	notebook: "/notebook",
	flashcards: "/flashcards",
	settings: "/settings",
	teacher: "/teacher",
};

function replacementUrl(
	target: ScreenId,
	params: Iterable<readonly [string, string]>,
) {
	const route = replacementRoutes[target];
	if (!route) return null;
	const url = new URL(route, window.location.origin);
	for (const [key, value] of params) {
		if (key !== "screen") url.searchParams.set(key, value);
	}
	return `${url.pathname}${url.search}${url.hash}`;
}

// ── Progress screen ────────────────────────────────────────────────────────────
function ProgressScreen() {
	return (
		<div className="learning-progress-page">
			<header>
				<p>YOUR LEARNING RECORD</p>
				<h1>Progress you can see.</h1>
				<p>
					Review saved work, find what needs attention and check the evidence
					behind each result.
				</p>
			</header>
			<AutomaticityEvidenceSummary />
			<details className="quiet-disclosure">
				<summary>Additional practice &amp; earlier learning tools</summary>
				<div>
					<AutomaticityScreen />
				</div>
			</details>
		</div>
	);
}

// ── AppShell ───────────────────────────────────────────────────────────────────
export function AppShell() {
	const { state, mutate } = useAppStore();
	const [screen, setScreen] = React.useState<ScreenId>("home");
	const [menuOpen, setMenuOpen] = React.useState(false);
	const sidebarRef = React.useRef<HTMLElement>(null);
	const current =
		navigation.find((item) => item.id === screen) ?? homeNavigation;
	const CurrentIcon = current.icon;

	React.useEffect(() => {
		const restoreScreen = () => {
			const url = new URL(window.location.href);
			const requestedTarget = url.searchParams.get("screen");
			const target =
				requestedTarget === "automaticity" ? "daily" : requestedTarget;
			if (isScreenId(target) && replacementRoutes[target]) {
				const targetUrl = replacementUrl(target, url.searchParams.entries());
				window.location.replace(targetUrl ?? replacementRoutes[target]);
				return;
			}
			if (isScreenId(target)) {
				if (requestedTarget !== target) {
					url.searchParams.set("screen", target);
					window.history.replaceState({ screen: target }, "", url);
				}
				setScreen(target);
			} else {
				if (target) {
					url.searchParams.delete("screen");
					window.history.replaceState({ screen: "home" }, "", url);
				}
				setScreen("home");
			}
			setMenuOpen(false);
		};
		restoreScreen();
		window.addEventListener("popstate", restoreScreen);
		return () => {
			window.removeEventListener("popstate", restoreScreen);
		};
	}, []);

	React.useEffect(() => {
		if (!menuOpen) return;
		if (window.matchMedia("(max-width: 860px)").matches) {
			sidebarRef.current
				?.querySelector<HTMLElement>(".learning-navigation a")
				?.focus();
		}
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setMenuOpen(false);
				window.setTimeout(
					() => document.getElementById("mobile-menu-trigger")?.focus(),
					0,
				);
			}
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [menuOpen]);

	const trapMobileMenuFocus = React.useCallback(
		(event: React.KeyboardEvent<HTMLElement>) => {
			if (
				event.key !== "Tab" ||
				!menuOpen ||
				!window.matchMedia("(max-width: 860px)").matches
			) {
				return;
			}
			const focusable = [
				...(sidebarRef.current?.querySelectorAll<HTMLElement>(
					'a[href], summary, button:not([disabled]), [tabindex]:not([tabindex="-1"])',
				) ?? []),
			].filter((node) => node.getClientRects().length > 0);
			if (!focusable.length) return;
			const first = focusable[0];
			const last = focusable.at(-1);
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last?.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first?.focus();
			}
		},
		[menuOpen],
	);

	const navigate = React.useCallback(
		(target: string, params: Record<string, string | null> = {}) => {
			const canonicalTarget = target === "automaticity" ? "daily" : target;
			if (!isScreenId(canonicalTarget)) return;
			const replacementRoute = replacementUrl(
				canonicalTarget,
				Object.entries(params).filter(
					(entry): entry is [string, string] => entry[1] !== null,
				),
			);
			if (replacementRoute) {
				window.location.assign(replacementRoute);
				return;
			}
			const url = new URL(window.location.href);
			if (canonicalTarget === "home") url.searchParams.delete("screen");
			else url.searchParams.set("screen", canonicalTarget);
			Object.entries(params).forEach(([key, value]) => {
				if (value === null) url.searchParams.delete(key);
				else url.searchParams.set(key, value);
			});
			window.history.pushState({ screen: canonicalTarget }, "", url);
			setScreen(canonicalTarget);
			setMenuOpen(false);
			const reduceMotion = window.matchMedia(
				"(prefers-reduced-motion: reduce)",
			).matches;
			window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
		},
		[],
	);

	const currentPath =
		replacementRoutes[screen] ??
		(screen === "home" ? "/" : `/?screen=${screen}`);

	return (
		<div className="app-shell" data-screen={screen}>
			<a className="skip-link" href="#main-content">
				Skip to main content
			</a>

			{/* ── Sidebar ─────────────────────────────────────────────────────── */}
			<aside
				aria-label={menuOpen ? "English learning navigation" : undefined}
				aria-modal={menuOpen || undefined}
				className="app-sidebar"
				data-open={menuOpen}
				onKeyDown={trapMobileMenuFocus}
				ref={sidebarRef}
				role={menuOpen ? "dialog" : undefined}
			>
				<div
					className="brand-mark"
					data-context-help="Automaticity means using English accurately and quickly without rebuilding every rule in your head."
				>
					<span className="brand-icon">
						<BrainCircuit aria-hidden className="size-5" />
					</span>
					<span className="brand-copy">
						<strong>English Automaticity</strong>
						<span>Measurable daily language practice</span>
					</span>
				</div>
				<LearningNavigation
					language="en"
					current={currentPath}
					onNavigate={() => setMenuOpen(false)}
				/>
			</aside>

			{menuOpen ? (
				<button
					aria-label="Close navigation"
					className="sidebar-scrim"
					onClick={() => setMenuOpen(false)}
					type="button"
				/>
			) : null}

			{/* ── Main ────────────────────────────────────────────────────────── */}
			<main className="app-main" id="main-content" tabIndex={-1}>
				<header className="app-topbar">
					<div className="flex min-w-0 items-center gap-3">
						<Button
							aria-expanded={menuOpen}
							aria-label={menuOpen ? "Close navigation" : "Open navigation"}
							className="mobile-menu"
							id="mobile-menu-trigger"
							onClick={() => setMenuOpen((value) => !value)}
							size="icon"
							variant="outline"
						>
							{menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
						</Button>
						<span className="topbar-screen-icon">
							<CurrentIcon aria-hidden className="size-4" />
						</span>
						<div className="min-w-0">
							<p className="truncate text-sm font-extrabold">{current.label}</p>
							<p className="truncate text-xs text-muted-foreground">
								{current.subtitle}
							</p>
						</div>
					</div>

					<details className="app-tools">
						<summary>Tools &amp; help</summary>
						<div className="app-tools-panel">
							<a
								href="/roadmap.html"
								className="inline-flex min-h-11 shrink-0 items-center rounded-lg border px-3 text-sm font-semibold"
								lang="fa"
								dir="rtl"
							>
								رودمپ
							</a>
							<ApiConnectionStatus baseUrl={state.settings.apiBaseUrl} />
							<NeuroReader
								onOpenSettings={() => navigate("settings")}
								onToggleReadingRuler={(enabled) =>
									mutate((draft) => {
										draft.settings.readingRuler = enabled;
									})
								}
								settings={state.settings}
							/>
							<UserGuideButton navigate={navigate} />
							<InstallAppControl />
						</div>
					</details>
				</header>

				{/* ── Content ─────────────────────────────────────────────────── */}
				<div className="app-content" data-screen={screen}>
					{screen === "errors" && (
						<details className="quiet-disclosure">
							<summary>Saved responses &amp; learning evidence</summary>
							<div>
								<AutomaticityEvidenceSummary />
							</div>
						</details>
					)}

					{screen === "home" && <DashboardV2Screen />}
					{screen === "progress" && <ProgressScreen />}
					{screen === "integrated-skills" && (
						<IntegratedSkillsScreen navigate={navigate} />
					)}
					{screen === "resources" && <ResourcesScreen />}
					{screen === "errors" && <ErrorsScreen />}
					{screen === "library" && <AudioScreen />}
				</div>

				<AppUpdateNotice />
			</main>
		</div>
	);
}
