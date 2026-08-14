"use client";

import * as React from "react";
import { AlertTriangle, ArrowLeft, Database, Eye, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

// This page reflects apps/api/database/migrations/002_task_definition_versioning.sql
// as static reference: the monitoring thresholds and views it defines. There is
// no PostgreSQL connectivity anywhere in this project (no client, no ORM, no
// DATABASE_URL) and apps/api's AppModule never imports the evidence-domain
// package, so nothing on this page is live data -- it cannot be, until that
// backend-wiring decision is made. The numbers below are the migration's own
// seed values, not a query result. Do not present this as a working
// dashboard; that was exactly the release-manifest overclaim this page
// exists to avoid repeating.

interface ThresholdRow {
  state: string;
  maxDuration: string;
  severity: "warning" | "critical";
}

const MONITORING_THRESHOLDS: ThresholdRow[] = [
  { state: "draft", maxDuration: "14 days", severity: "warning" },
  { state: "in_review", maxDuration: "48 hours", severity: "warning" },
  { state: "approved", maxDuration: "7 days", severity: "warning" },
  { state: "scheduled", maxDuration: "24 hours", severity: "critical" },
  { state: "blocked", maxDuration: "4 hours", severity: "critical" },
];

interface ViewRow {
  name: string;
  purpose: string;
}

const MONITORING_VIEWS: ViewRow[] = [
  {
    name: "task_state_history_v",
    purpose:
      "Full per-version state history with entered_at/exited_at, actor, and reason for every transition.",
  },
  {
    name: "task_state_duration_metrics_v",
    purpose: "Average and median time spent in each lifecycle state.",
  },
  {
    name: "stuck_task_versions_v",
    purpose:
      "Individual task versions that have exceeded their state's configured max_duration threshold.",
  },
  {
    name: "stuck_task_summary_v",
    purpose: "Count of stuck task versions grouped by state and severity.",
  },
  {
    name: "task_state_monitoring_data_quality_v",
    purpose:
      "Sanity checks on the ledger itself (e.g. missing actor names, sequence gaps).",
  },
];

export default function TaskLifecycleMonitoringPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <a
        className="inline-flex items-center gap-2 text-sm font-bold text-violet-800"
        href="/"
      >
        <ArrowLeft className="size-4" /> Back to app
      </a>

      <div>
        <Badge variant="secondary">Task lifecycle monitoring</Badge>
        <h1 className="mt-2 text-2xl font-extrabold">
          Monitoring foundation status
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What the Task Definition versioning migration defines today, and
          what it does not yet do.
        </p>
      </div>

      <Card className="border-amber-300 bg-amber-50/70">
        <CardContent className="flex items-start gap-3 pt-5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
          <div className="space-y-1 text-sm">
            <p className="font-bold text-amber-950">
              Not a live dashboard. Nothing below is queried from a database.
            </p>
            <p className="text-amber-900">
              This project has no PostgreSQL connectivity anywhere (no
              client, no ORM, no DATABASE_URL) and apps/api's AppModule does
              not import the evidence-domain package. The thresholds and
              views listed here are read directly out of the migration file
              as reference documentation. Building a real dashboard needs a
              backend-wiring decision first -- deliberately not made
              unilaterally here.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" /> Configured stuck-state thresholds
          </CardTitle>
          <CardDescription>
            From task_state_monitoring_thresholds' seed data. A task version
            sitting in one of these states longer than max_duration would be
            flagged by stuck_task_versions_v once something actually runs
            that query.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-bold">Lifecycle state</th>
                  <th className="py-2 pr-4 font-bold">Max duration</th>
                  <th className="py-2 font-bold">Severity</th>
                </tr>
              </thead>
              <tbody>
                {MONITORING_THRESHOLDS.map((row) => (
                  <tr className="border-b last:border-0" key={row.state}>
                    <td className="py-2 pr-4 font-mono text-xs">{row.state}</td>
                    <td className="py-2 pr-4">{row.maxDuration}</td>
                    <td className="py-2">
                      <Badge
                        variant={
                          row.severity === "critical" ? "destructive" : "warning"
                        }
                      >
                        {row.severity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="size-4" /> Views defined by the migration
          </CardTitle>
          <CardDescription>
            Each of these exists as SQL and has never run against a live
            database as part of this project's test suite.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {MONITORING_VIEWS.map((view) => (
            <div className="rounded-xl border p-3" key={view.name}>
              <code className="text-xs font-bold text-violet-800">
                {view.name}
              </code>
              <p className="mt-1 text-sm text-muted-foreground">
                {view.purpose}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Database />
          </EmptyMedia>
          <EmptyTitle>No connected database</EmptyTitle>
          <EmptyDescription>
            An API endpoint, tenant/ownership model, alerting, and pagination
            would all need to be designed once a database and connection
            layer are chosen for apps/api. This app has no multi-tenant
            concept today -- it is a single-user local install -- so any
            future design should confirm whether tenant isolation is even
            applicable before building it.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent />
      </Empty>
    </main>
  );
}
