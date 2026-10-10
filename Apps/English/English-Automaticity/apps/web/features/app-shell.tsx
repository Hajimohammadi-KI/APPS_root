"use client";
import { AutomaticityEvidenceSummary } from "./components/automaticity-evidence-summary";

import * as React from "react";
import { LearningNavigation } from "@/components/learning-navigation";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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
import { Disclosure } from "@/components/ui/disclosure";
import { AppUpdateNotice } from "@/features/components/app-update-notice";
import { ApiConnectionStatus } from "@/features/components/api-connection-status";
import { InstallAppControl } from "@/features/components/install-app-control";
import { NeuroReader } from "@/features/components/neuro-reader";
import { DashboardV2Screen } from "@/features/screens/dashboard-v2-screen";
import {
	canonicalScreenId,
	type ScreenId,
	type ScreenParams,
	screenHref,
	screenPaths,
} from "@/features/navigation/screen-routes";
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
			<Disclosure summary="Additional practice & earlier learning tools">
				<AutomaticityScreen />
			</Disclosure>
		</div>
	);
}

// ── AppShell ───────────────────────────────────────────────────────────────────
export function AppShell({ screen = "home" }: { screen?: ScreenId }) {
	const { state, mutate } = useAppStore();
	const router = useRouter();
	const [menuOpen, setMenuOpen] = React.useState(false);
	const sidebarRef = React.useRef<HTMLElement>(null);
	const current =
		navigation.find((item) => item.id === screen) ?? homeNavigation;
	const CurrentIcon = current.icon;

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
		(target: string, params: ScreenParams = {}) => {
			const canonicalTarget = canonicalScreenId(target);
			if (!canonicalTarget) return;
			setMenuOpen(false);
			router.push(screenHref(canonicalTarget, params));
		},
		[router],
	);

	const currentPath = screenPaths[screen];

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
								hrefLang="fa"
							>
								Roadmap
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
						<Disclosure summary="Saved responses & learning evidence">
							<AutomaticityEvidenceSummary />
						</Disclosure>
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
