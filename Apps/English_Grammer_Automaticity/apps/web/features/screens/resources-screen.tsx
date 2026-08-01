"use client";

import * as React from "react";
import { ExternalLink, Search } from "lucide-react";
import { onlineResources } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

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
      <div className="resource-grid">
        {rows.map((resource, index) => (
          <article
            className="resource-card"
            key={`${resource.provider}-${resource.level}-${resource.skill}-${resource.title}-${index}`}
          >
            <div>
              <h2 className="font-extrabold leading-6">{resource.title}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge
                  variant={
                    resource.provider === "Test-English" ? "default" : "warning"
                  }
                >
                  {resource.provider}
                </Badge>
                <Badge variant="secondary">{resource.level}</Badge>
                <Badge variant="success">{resource.skill}</Badge>
              </div>
            </div>
            <Button asChild className="mt-5">
              <a href={resource.url} rel="noreferrer" target="_blank">
                Open exact resource
                <ExternalLink aria-hidden className="size-4" />
              </a>
            </Button>
          </article>
        ))}
      </div>
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
