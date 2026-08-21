"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
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
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
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
  "Praxis",
  "Lernpfade",
  "Lernnachweise",
  "System",
  "Hilfeseiten",
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
  if (!value) return "Noch kein lokales Ereignis";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function routeTypeLabel(routeType: PageRouteType): string {
  return {
    page: "Seite",
    redirect: "Interne Weiterleitung",
    external: "Externe Übergabe",
    dynamic: "Dynamische Seite",
  }[routeType];
}

function storageStateLabel(
  storageState: PageAnalyticsDataset["quality"]["storageState"],
): string {
  return {
    available: "verfügbar",
    empty: "leer",
    invalid: "ungültig",
    unavailable: "nicht verfügbar",
  }[storageState];
}

export function PageAnalyticsDashboard() {
  const { state } = useLearnerState();
  const [dataset, setDataset] = useState<PageAnalyticsDataset>(EMPTY_DATASET);

  useEffect(() => {
    const refresh = () => setDataset(readPageAnalyticsDataset());
    refresh();
    return subscribeToPageAnalytics(refresh);
  }, []);

  const routeRows = useMemo(
    () => buildPageAnalyticsRows(dataset.events),
    [dataset.events],
  );
  const unknownRoutes = useMemo(
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
  const dataQualityNote = `${dataset.quality.rejectedRows} verworfen · ${dataset.quality.duplicateRows} doppelt · ${dataset.quality.repairedRows} repariert · ${unknownRoutes.requested.length + unknownRoutes.rendered.length} unbekannt · Speicher ${storageStateLabel(dataset.quality.storageState)}`;
  const lastEvent = dataset.events.at(-1);

  return (
    <div className="analytics-dashboard space-y-5">
      <header className="analytics-hero">
        <div>
          <Badge className="bg-violet-100 text-violet-800">
            Lokale, datensparsame Analyse
          </Badge>
          <h1>Seiten- &amp; Lernnachweise</h1>
          <p>
            Angeforderte Einstiegsrouten und tatsächlich gerenderte Seiten
            werden getrennt gemessen. Die Daten stammen nur aus diesem Browser
            und werden an keinen Analysedienst gesendet.
          </p>
        </div>
        <div className="analytics-status" role="status">
          <ShieldCheck aria-hidden />
          <span>
            <strong>Daten bleiben auf diesem Gerät</strong>
            <small>
              Letztes Routenereignis: {formatFreshness(lastEvent?.occurredAt)}
            </small>
          </span>
        </div>
      </header>

      <section aria-label="Analyse-Zusammenfassung" className="analytics-kpis">
        <MetricCard
          icon={Database}
          label="Bekannte Routen"
          value={PAGE_CATALOG.length}
          note="Quellcodegestützte Seiten und Weiterleitungen"
        />
        <MetricCard
          icon={Activity}
          label="Routenversuche"
          value={dataset.events.length}
          note="Geprüfte lokale Ereignisse; maximal 500"
        />
        <MetricCard
          icon={Eye}
          label="Gerenderte Seitenabdeckung"
          value={`${renderedPageCount}/${renderableRows.length}`}
          note="Weiterleitungen und externe Übergaben ausgeschlossen"
        />
        <MetricCard
          icon={BarChart3}
          label="Geprüfte Lernversuche"
          value={verifiedAttempts}
          note="Aus dem vorhandenen Lernnachweis-Speicher"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Lokale Datenqualität"
          value={dataIssueCount === 0 ? "Bereit" : `${dataIssueCount} Probleme`}
          note={dataQualityNote}
        />
      </section>

      <div className="analytics-grid">
        <Card className="analytics-card">
          <CardHeader>
            <h2 className="analytics-card-title">Gerenderte Seitenabdeckung</h2>
            <p>
              Im Nenner stehen nur Routen, die eine interne Seite rendern
              können.
            </p>
          </CardHeader>
          <CardContent>
            <ul
              aria-label="Gerenderte Seiten je Gruppe"
              className="analytics-bars"
            >
              {groupRows.map((row) => (
                <li className="analytics-bar-row" key={row.group}>
                  <div>
                    <strong>{row.group}</strong>
                    <span>
                      {row.rendered} von {row.totalRenderable}
                    </span>
                  </div>
                  <progress
                    aria-label={`${row.group}: ${row.rendered} von ${row.totalRenderable} Seiten gerendert`}
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
            <h2 className="analytics-card-title">Nachweisgrenze</h2>
          </CardHeader>
          <CardContent>
            <dl>
              <div>
                <dt>Routenkatalog</dt>
                <dd>
                  <Badge className="bg-emerald-100 text-emerald-800">
                    Quellcode geprüft
                  </Badge>
                </dd>
              </div>
              <div>
                <dt>Lokale Routenereignisse</dt>
                <dd>
                  <Badge
                    className={
                      dataIssueCount === 0
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-900"
                    }
                  >
                    {dataIssueCount === 0 ? "Validiert" : "Prüfung nötig"}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt>Angefordert vs. gerendert</dt>
                <dd>
                  <Badge className="bg-emerald-100 text-emerald-800">
                    Getrennt
                  </Badge>
                </dd>
              </div>
              <div>
                <dt>Akquise, Bindung, Conversion, Umsatz</dt>
                <dd>
                  <Badge className="bg-amber-100 text-amber-900">
                    N/A · keine Produktionstelemetrie
                  </Badge>
                </dd>
              </div>
            </dl>
            <p>
              Direkte Browseraufrufe können eine Einstiegsroute vor einer
              Weiterleitung nicht erhalten. Aus Seitenzahlen werden keine
              Nutzungs-, Bindungs- oder Lernerfolgswerte abgeleitet.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="analytics-card analytics-routes-card">
        <CardHeader>
          <h2 className="analytics-card-title">Alle Seitenrouten</h2>
          <p>
            Öffne eine Produktgruppe, um Einstiegsversuche, gerenderte Aufrufe
            und Aktualität ohne endlose Tabelle zu prüfen.
          </p>
        </CardHeader>
        <CardContent>
          <Accordion className="analytics-route-accordion" multiple>
            {groupRows.map((group) => (
              <AccordionItem key={group.group} value={group.group}>
                <AccordionTrigger className="analytics-route-trigger">
                  <span>
                    <strong>{group.group}</strong>
                    <small>
                      {group.rendered}/{group.totalRenderable} gerendert ·{" "}
                      {group.entryAttempts} Einstiege
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
                            <dt>Einstiegsversuche</dt>
                            <dd>{row.entryAttempts}</dd>
                          </div>
                          <div>
                            <dt>Gerenderte Aufrufe</dt>
                            <dd>{row.renderedViews}</dd>
                          </div>
                          <div>
                            <dt>Letzte Aktivität</dt>
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
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
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
