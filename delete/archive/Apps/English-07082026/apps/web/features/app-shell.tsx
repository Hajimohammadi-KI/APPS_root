"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
	BookOpenText,
	BrainCircuit,
	ChevronDown,
	CircleAlert,
	CloudDownload,
	Flame,
	FileMusic,
	BookMarked,
	Clock3,
	Folder,
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
		label: "Today’s Practice",
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

type NavigationGroupId = "practice" | "curriculum" | "evidence" | "system";

interface NavigationGroup {
	id: NavigationGroupId;
	label: string;
	caption: string;
	icon: React.ComponentType<{ className?: string }>;
	items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
	{
		id: "practice",
		label: "Daily Practice",
		caption: "Practice and speak today",
		icon: Clock3,
		items: navigation.slice(0, 3),
	},
	{
		id: "curriculum",
		label: "Learning Paths",
		caption: "Grammar and English study",
		icon: Settings,
		items: navigation.filter((item) =>
			["grammar", "integrated-skills", "resources"].includes(item.id),
		),
	},
	{
		id: "evidence",
		label: "Learning Evidence",
		caption: "Errors and recordings",
		icon: Clock3,
		items: navigation.filter((item) =>
			["errors", "progress", "library", "notebook", "flashcards"].includes(
				item.id,
			),
		),
	},
	{
		id: "system",
		label: "App and Settings",
		caption: "Storage and personal options",
		icon: Folder,
		items: navigation.filter((item) => ["settings", "teacher"].includes(item.id)),
	},
];

const defaultOpenGroups: Record<NavigationGroupId, boolean> = {
	practice: true,
	curriculum: true,
	evidence: true,
	system: true,
};

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

export function AppShell() {
	const { state, mutate } = useAppStore();
	const [screen, setScreen] = React.useState<ScreenId>("home");
	const [menuOpen, setMenuOpen] = React.useState(false);
	const [openGroups, setOpenGroups] =
		React.useState<Record<NavigationGroupId, boolean>>(defaultOpenGroups);
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
		const group = navigationGroups.find((candidate) =>
			candidate.items.some((item) => item.id === screen),
		);
		if (!group) return;
		setOpenGroups((currentGroups) =>
			currentGroups[group.id]
				? currentGroups
				: { ...currentGroups, [group.id]: true },
		);
	}, [screen]);

	React.useEffect(() => {
		if (!menuOpen) return;
		if (window.matchMedia("(max-width: 860px)").matches) {
			sidebarRef.current
				?.querySelector<HTMLElement>(".nav-button, .nav-group-trigger")
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
					'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
				) ?? []),
			];
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

	return (
		<div className="app-shell" data-screen={screen}>
			<a className="skip-link" href="#main-content">
				Skip to main content
			</a>
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
				<nav aria-label="Product navigation" className="sidebar-nav">
					{navigationGroups.map((group) => {
						const expanded = openGroups[group.id];
						const GroupIcon = group.icon;
						const groupIsActive = group.items.some(
							(item) => item.id === screen,
						);
						return (
							<section
								className="nav-group"
								data-active={groupIsActive}
								key={group.id}
							>
								<p className="nav-section-label">{group.label}</p>
								<button
									aria-controls={`nav-group-${group.id}`}
									aria-expanded={expanded}
									className="nav-group-trigger"
									onClick={() =>
										setOpenGroups((groups) => ({
											...groups,
											[group.id]: !groups[group.id],
										}))
									}
									type="button"
								>
									<GroupIcon aria-hidden className="nav-group-icon size-5" />
									<span className="nav-group-copy">
										<strong>{group.caption}</strong>
									</span>
									<ChevronDown
										aria-hidden
										className="nav-group-chevron size-4"
									/>
								</button>
								{expanded ? (
									<div className="nav-group-panel" id={`nav-group-${group.id}`}>
										{group.items.map((item) => {
											const Icon = item.icon;
											return (
												<a
													className="nav-button"
													data-active={item.id === screen}
												href={replacementRoutes[item.id] ?? (item.id === "home" ? "/" : `/?screen=${item.id}`)}
													key={item.id}
													onClick={(event) => {
														if (
															event.button !== 0 ||
															event.metaKey ||
															event.ctrlKey ||
															event.shiftKey ||
															event.altKey
														) {
															return;
														}
														event.preventDefault();
														navigate(item.id);
													}}
												>
													<Icon aria-hidden className="size-4.5" />
													{item.label}
												</a>
											);
										})}
									</div>
								) : null}
							</section>
						);
					})}
				</nav>
			</aside>
			{menuOpen ? (
				<button
					aria-label="Close navigation"
					className="sidebar-scrim"
					onClick={() => setMenuOpen(false)}
					type="button"
				/>
			) : null}
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
					<div className="flex items-center gap-2">
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
				</header>
				<div className="app-content" data-screen={screen}>
					{screen === "home" ? <DashboardV2Screen navigate={navigate} /> : null}
					{screen === "progress" ? <AutomaticityScreen /> : null}
					{screen === "integrated-skills" ? (
						<IntegratedSkillsScreen navigate={navigate} />
					) : null}
					{screen === "resources" ? <ResourcesScreen /> : null}
					{screen === "errors" ? <ErrorsScreen /> : null}
					{screen === "library" ? <AudioScreen /> : null}
				</div>
				<AppUpdateNotice />
			</main>
		</div>
	);
}
