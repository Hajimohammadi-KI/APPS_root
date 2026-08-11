"use client";

import * as React from "react";
import { ExternalLink, Search } from "lucide-react";
import { onlineResources } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { pdfReaderHrefForResource } from "@/lib/pdf-reader-link";

export function ResourcesScreen() {
	const [skill, setSkill] = React.useState("All");
	const [level, setLevel] = React.useState("All");
	const [search, setSearch] = React.useState("");
	const skills = ["All", ...new Set(onlineResources.map((item) => item.skill))];
	const levels = ["All", ...new Set(onlineResources.map((item) => item.level))];
	const rows = onlineResources.filter(
		(item) =>
			(skill === "All" || item.skill === skill) &&
			(level === "All" || item.level === level) &&
			(!search.trim() ||
				[item.title, item.provider, item.skill, item.level]
					.join(" ")
					.toLowerCase()
					.includes(search.trim().toLowerCase())),
	);

	return (
		<div className="page-stack">
			<div className="page-heading">
				<div>
					<h1>Online Learning Resources</h1>
					<p>
						All 43 verified legacy collections and tests. Every link goes
						directly to the exact skill or level page, not a generic homepage.
					</p>
				</div>
				<Badge>{rows.length} direct resources</Badge>
			</div>
			<Card>
				<CardContent className="pt-5">
					<div className="grid gap-3 md:grid-cols-3">
						<div className="field-stack">
							<Label htmlFor="resource-search">Search resources</Label>
							<span className="relative">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									autoComplete="off"
									className="pl-9"
									id="resource-search"
									name="resource-search"
									onChange={(event) => setSearch(event.target.value)}
									placeholder="writing, IELTS, B2…"
									type="search"
									value={search}
								/>
							</span>
						</div>
						<div className="field-stack">
							<Label htmlFor="resource-skill">Skill</Label>
							<Select
								id="resource-skill"
								name="resource-skill"
								onChange={(event) => setSkill(event.target.value)}
								value={skill}
							>
								{skills.map((item) => (
									<option key={item}>{item}</option>
								))}
							</Select>
						</div>
						<div className="field-stack">
							<Label htmlFor="resource-level">Level</Label>
							<Select
								id="resource-level"
								name="resource-level"
								onChange={(event) => setLevel(event.target.value)}
								value={level}
							>
								{levels.map((item) => (
									<option key={item}>{item}</option>
								))}
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>
			<Accordion className="grid gap-3" type="multiple">
				{rows.map((resource, index) => {
					const readerHref = pdfReaderHrefForResource({
						sourceUrl: resource.url,
						name: resource.title,
						focus: `${resource.skill}: ${resource.title}`,
						context: `English ${resource.level} · ${resource.provider}`,
					});
					const openHref = readerHref || resource.url;
					return (
						<AccordionItem
						className="resource-card overflow-hidden rounded-2xl border bg-card shadow-sm transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] data-[state=open]:border-primary/35 data-[state=open]:shadow-md"
						key={`${resource.provider}-${resource.level}-${resource.skill}-${resource.title}-${index}`}
						value={`resource-${resource.provider}-${resource.level}-${resource.skill}-${index}`}
					>
						<AccordionTrigger className="min-h-20 gap-4 px-4 py-4 text-left hover:no-underline sm:px-5">
							<span className="min-w-0 flex-1">
								<span className="block text-base font-extrabold leading-6 text-foreground sm:text-lg">
									{resource.title}
								</span>
								<span className="mt-2 flex flex-wrap gap-2">
									<Badge
										className="pointer-events-none"
										variant={
											resource.provider === "Test-English"
												? "default"
												: "warning"
										}
									>
										{resource.provider}
									</Badge>
									<Badge className="pointer-events-none" variant="secondary">
										{resource.level}
									</Badge>
									<Badge className="pointer-events-none" variant="success">
										{resource.skill}
									</Badge>
								</span>
							</span>
						</AccordionTrigger>
						<AccordionContent className="border-t bg-muted/25 px-4 py-4 sm:px-5">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
								<p className="max-w-2xl text-sm leading-6 text-muted-foreground">
									{readerHref
										? "This exact PDF opens in the shared reader. A normal click uses this page; right-click can open a new tab or window."
										: "Open the verified page for this exact level and skill in a new browser tab."}
								</p>
								<Badge className="w-fit shrink-0" variant="secondary">
									Verified direct link
								</Badge>
							</div>
							<Button asChild className="mt-4 w-full sm:w-auto">
								<a
									href={openHref}
									rel={readerHref ? undefined : "noreferrer"}
									target={readerHref ? undefined : "_blank"}
									title={readerHref ? "Normal click: open here. Right-click: open in a new tab or window." : undefined}
								>
									{readerHref ? "Open exact PDF" : "Open exact resource"}
									<ExternalLink aria-hidden className="size-4" />
								</a>
							</Button>
						</AccordionContent>
						</AccordionItem>
					);
				})}
			</Accordion>
			{rows.length === 0 ? (
				<Card>
					<CardContent className="pt-5 text-sm text-muted-foreground">
						No resources match the current filters.
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}
