"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
	Shuffle,
	Languages,
	GraduationCap,
	Timer,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppUpdateNotice } from "@/features/components/app-update-notice";
import { ApiConnectionStatus } from "@/features/components/api-connection-status";
import { InstallAppControl } from "@/features/components/install-app-control";
import { NeuroReader } from "@/features/components/neuro-reader";
import { ProfileProgressBadge } from "@/features/components/profile-progress-badge";
import { useAppStore } from "@/features/store/app-store";
import { UserGuideButton } from "@/features/user-guide";
import { SCREEN_PATHS, useAppNavigate, type ScreenId } from "@/lib/app-navigate";

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
		id: "practice",
		label: "Mixed Practice",
		subtitle: "Interleaved recall across topics",
		icon: Shuffle,
	},
	{
		id: "studio",
		label: "Conversation Studio",
		subtitle: "Speak, correct, and repeat",
		icon: MessagesSquare,
	},
	{
		id: "automatization",
		label: "Automatization Trainer",
		subtitle: "Retrieval, shadowing, and formulaic drills",
		icon: Timer,
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
		subtitle: "Spaced-repetition vocabulary review",
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
		items: navigation.filter((item) =>
			["home", "daily", "practice", "studio", "automatization"].includes(
				item.id,
			),
		),
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
			["progress", "errors", "library", "notebook", "flashcards"].includes(
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

function currentNavItem(pathname: string): NavigationItem {
	return (
		navigation.find((item) =>
			item.id === "home"
				? pathname === "/"
				: pathname.startsWith(SCREEN_PATHS[item.id]),
		) ?? homeNavigation
	);
}

export function AppShell({ children }: { children: React.ReactNode }) {
	const { state, mutate } = useAppStore();
	const navigate = useAppNavigate();
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = React.useState(false);
	const [openGroups, setOpenGroups] =
		React.useState<Record<NavigationGroupId, boolean>>(defaultOpenGroups);
	const sidebarRef = React.useRef<HTMLElement>(null);
	const current = currentNavItem(pathname);
	const CurrentIcon = current.icon;

	React.useEffect(() => {
		const group = navigationGroups.find((candidate) =>
			candidate.items.some((item) => item.id === current.id),
		);
		if (!group) return;
		setOpenGroups((currentGroups) =>
			currentGroups[group.id]
				? currentGroups
				: { ...currentGroups, [group.id]: true },
		);
	}, [current.id]);

	React.useEffect(() => {
		setMenuOpen(false);
	}, [pathname]);

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

	return (
		<div className="app-shell" data-screen={current.id}>
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
							(item) => item.id === current.id,
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
												<Link
													className="nav-button"
													data-active={item.id === current.id}
													href={SCREEN_PATHS[item.id]}
													key={item.id}
												>
													<Icon aria-hidden className="size-4.5" />
													{item.label}
												</Link>
											);
										})}
									</div>
								) : null}
							</section>
						);
					})}
				</nav>
				<ProfileProgressBadge />
			</aside>
			{menuOpen ? (
				<button
					aria-label="Close navigation"
					className="sidebar-scrim"
					onClick={() => setMenuOpen(false)}
					type="button"
				/>
			) : null}
			<main className="app-main" id="main-content">
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
				<div className="app-content" data-screen={current.id}>
					{children}
				</div>
				<AppUpdateNotice />
			</main>
		</div>
	);
}
