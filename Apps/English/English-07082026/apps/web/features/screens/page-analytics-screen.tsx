"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { Activity, BarChart3, Database, Eye, ShieldCheck } from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAppStore } from "@/features/store/app-store";
import {
	PAGE_CATALOG,
	buildPageAnalyticsRows,
	findUnknownPageRoutes,
	readPageAnalyticsDataset,
	subscribeToPageAnalytics,
	type PageAnalyticsDataset,
	type PageGroup,
	type PageRouteType,
} from "@/lib/page-analytics";

const GROUPS: readonly PageGroup[] = [
	"Practice",
	"Curriculum",
	"Learning evidence",
	"System",
	"Utility",
];

const EMPTY_DATASET: PageAnalyticsDataset = {
	events: [],
	quality: {
		storageState: "unavailable",
		storedRows: 0,
		acceptedRows: 0,
		rejectedRows: 0,
		duplicateRows: 0,
		repairedRows: 0,
	},
};

function formatFreshness(value: string | undefined): string {
	if (!value) return "No local route event yet";
	return new Intl.DateTimeFormat("en", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

function routeTypeLabel(routeType: PageRouteType): string {
	return {
		page: "Page",
		redirect: "Internal handoff",
		external: "External handoff",
		dynamic: "Dynamic page",
	}[routeType];
}

export function PageAnalyticsScreen() {
	const { state } = useAppStore();
	const [dataset, setDataset] =
		React.useState<PageAnalyticsDataset>(EMPTY_DATASET);

	React.useEffect(() => {
		const refresh = () => setDataset(readPageAnalyticsDataset());
		refresh();
		return subscribeToPageAnalytics(refresh);
	}, []);

	const routeRows = React.useMemo(
		() => buildPageAnalyticsRows(dataset.events),
		[dataset.events],
	);
	const unknownRoutes = React.useMemo(
		() => findUnknownPageRoutes(dataset.events),
		[dataset.events],
	);
	const renderableRows = routeRows.filter(
		(row) => row.routeType === "page" || row.routeType === "dynamic",
	);
	const renderedPageCount = renderableRows.filter(
		(row) => row.renderedViews > 0,
	).length;
	const verifiedAttempts = state.attempts.filter(
		(attempt) => attempt.verified === true,
	).length;
	const groupRows = GROUPS.map((group) => {
		const pages = routeRows.filter((row) => row.group === group);
		const renderable = pages.filter(
			(page) => page.routeType === "page" || page.routeType === "dynamic",
		);
		return {
			group,
			pages,
			totalRenderable: renderable.length,
			rendered: renderable.filter((page) => page.renderedViews > 0).length,
			entryAttempts: pages.reduce((sum, page) => sum + page.entryAttempts, 0),
		};
	});
	const dataIssueCount =
		dataset.quality.rejectedRows +
		dataset.quality.duplicateRows +
		unknownRoutes.requested.length +
		unknownRoutes.rendered.length +
		(dataset.quality.storageState === "invalid" ||
		dataset.quality.storageState === "unavailable"
			? 1
			: 0);
	const dataQualityNote = `${dataset.quality.rejectedRows} rejected · ${dataset.quality.duplicateRows} duplicate · ${dataset.quality.repairedRows} repaired · ${unknownRoutes.requested.length + unknownRoutes.rendered.length} unknown · storage ${dataset.quality.storageState}`;
	const lastEvent = dataset.events.at(-1);

	return (
		<div className="analytics-dashboard page-stack">
			<header className="analytics-hero">
				<div>
					<Badge>Local, privacy-first analytics</Badge>
					<h1>Page &amp; learning evidence</h1>
					<p>
						Requested entry routes and pages that actually rendered are measured
						separately. Data comes from this browser only and is never sent to a
						remote analytics service.
					</p>
				</div>
				<div className="analytics-status" role="status">
					<ShieldCheck aria-hidden />
					<span>
						<strong>Data stays on this device</strong>
						<small>
							Latest route event: {formatFreshness(lastEvent?.occurredAt)}
						</small>
					</span>
				</div>
			</header>

			<section aria-label="Analytics summary" className="analytics-kpis">
				<MetricCard
					icon={Database}
					label="Known routes"
					value={PAGE_CATALOG.length}
					note="Source-backed pages, redirects, and handoffs"
				/>
				<MetricCard
					icon={Activity}
					label="Route attempts"
					value={dataset.events.length}
					note="Accepted local events; latest 500 retained"
				/>
				<MetricCard
					icon={Eye}
					label="Rendered page coverage"
					value={`${renderedPageCount}/${renderableRows.length}`}
					note="Redirects and external handoffs are excluded"
				/>
				<MetricCard
					icon={BarChart3}
					label="Verified learning attempts"
					value={verifiedAttempts}
					note="From the existing learner evidence store"
				/>
				<MetricCard
					icon={ShieldCheck}
					label="Local data quality"
					value={dataIssueCount === 0 ? "Ready" : `${dataIssueCount} issues`}
					note={dataQualityNote}
				/>
			</section>

			<div className="analytics-grid">
				<Card className="analytics-card">
					<CardHeader>
						<h2 className="analytics-card-title">Rendered page coverage</h2>
						<p>
							Only routes that can render an in-app page are used as the
							denominator.
						</p>
					</CardHeader>
					<CardContent>
						<ul aria-label="Rendered pages by group" className="analytics-bars">
							{groupRows.map((row) => (
								<li className="analytics-bar-row" key={row.group}>
									<div>
										<strong>{row.group}</strong>
										<span>
											{row.rendered} of {row.totalRenderable}
										</span>
									</div>
									<progress
										aria-label={`${row.group}: ${row.rendered} of ${row.totalRenderable} pages rendered`}
										max={Math.max(row.totalRenderable, 1)}
										value={row.rendered}
									/>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>

				<Card className="analytics-card analytics-limits">
					<CardHeader>
						<h2 className="analytics-card-title">Evidence boundary</h2>
					</CardHeader>
					<CardContent>
						<dl>
							<div>
								<dt>Route catalogue</dt>
								<dd>
									<Badge variant="success">Source verified</Badge>
								</dd>
							</div>
							<div>
								<dt>Local route events</dt>
								<dd>
									<Badge variant={dataIssueCount === 0 ? "success" : "warning"}>
										{dataIssueCount === 0 ? "Validated" : "Review needed"}
									</Badge>
								</dd>
							</div>
							<div>
								<dt>Requested vs. rendered</dt>
								<dd>
									<Badge variant="success">Separated</Badge>
								</dd>
							</div>
							<div>
								<dt>Acquisition, retention, conversion, revenue</dt>
								<dd>
									<Badge variant="warning">N/A · no production telemetry</Badge>
								</dd>
							</div>
						</dl>
						<p>
							Direct browser loads cannot preserve a pre-redirect entry route.
							No traffic, outcome, or retention value is inferred from
							source-code page counts.
						</p>
					</CardContent>
				</Card>
			</div>

			<Card className="analytics-card analytics-routes-card">
				<CardHeader>
					<h2 className="analytics-card-title">All page routes</h2>
					<p>
						Open a product group to inspect entry attempts, rendered views, and
						freshness without scrolling through one long table.
					</p>
				</CardHeader>
				<CardContent>
					<Accordion
						className="analytics-route-accordion"
						multiple
					>
						{groupRows.map((group) => (
							<AccordionItem key={group.group} value={group.group}>
								<AccordionTrigger className="analytics-route-trigger">
									<span>
										<strong>{group.group}</strong>
										<small>
											{group.rendered}/{group.totalRenderable} rendered ·{" "}
											{group.entryAttempts} entries
										</small>
									</span>
								</AccordionTrigger>
								<AccordionContent className="analytics-route-content">
									<ul className="analytics-route-list">
										{group.pages.map((row) => (
											<li className="analytics-route-card" key={row.route}>
												<div className="analytics-route-heading">
													{row.routeType === "dynamic" ? (
														<span>
															<strong>{row.label}</strong>
															<code>{row.route}</code>
														</span>
													) : (
														<Link href={row.route as Route}>
															<strong>{row.label}</strong>
															<code>{row.route}</code>
														</Link>
													)}
													<span
														className="analytics-route-type"
														data-kind={row.routeType}
													>
														{routeTypeLabel(row.routeType)}
													</span>
												</div>
												<dl className="analytics-route-metrics">
													<div>
														<dt>Entry attempts</dt>
														<dd>{row.entryAttempts}</dd>
													</div>
													<div>
														<dt>Rendered views</dt>
														<dd>{row.renderedViews}</dd>
													</div>
													<div>
														<dt>Last activity</dt>
														<dd>{formatFreshness(row.lastActivityAt)}</dd>
													</div>
												</dl>
											</li>
										))}
									</ul>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</CardContent>
			</Card>
		</div>
	);
}

function MetricCard({
	icon: Icon,
	label,
	value,
	note,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value: React.ReactNode;
	note: string;
}) {
	return (
		<Card className="analytics-card analytics-kpi">
			<CardContent>
				<Icon aria-hidden className="analytics-kpi-icon" />
				<span>{label}</span>
				<strong>{value}</strong>
				<small>{note}</small>
			</CardContent>
		</Card>
	);
}
