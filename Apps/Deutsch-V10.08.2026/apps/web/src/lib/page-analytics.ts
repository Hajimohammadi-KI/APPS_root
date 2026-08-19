export type PageGroup =
  "Praxis" | "Lernpfade" | "Lernnachweise" | "System" | "Hilfeseiten";

export type PageRouteType = "page" | "redirect" | "external" | "dynamic";

export interface PageCatalogItem {
  readonly route: string;
  readonly label: string;
  readonly group: PageGroup;
  readonly routeType: PageRouteType;
}

export const PAGE_CATALOG = [
  { route: "/", label: "Start", group: "Praxis", routeType: "page" },
  {
    route: "/heute",
    label: "Heutiges Training",
    group: "Praxis",
    routeType: "page",
  },
  {
    route: "/gemischtes-training",
    label: "Gemischtes Training",
    group: "Praxis",
    routeType: "page",
  },
  {
    route: "/studio",
    label: "Gesprächsstudio",
    group: "Praxis",
    routeType: "page",
  },
  {
    route: "/automatik",
    label: "Automatik-Weiterleitung",
    group: "Praxis",
    routeType: "redirect",
  },
  {
    route: "/themen",
    label: "Themen-Weiterleitung",
    group: "Praxis",
    routeType: "redirect",
  },
  {
    route: "/grammatik",
    label: "Grammatik-Labor",
    group: "Lernpfade",
    routeType: "page",
  },
  {
    route: "/kasus-trainer",
    label: "Kasus-Trainer",
    group: "Lernpfade",
    routeType: "page",
  },
  {
    route: "/fertigkeiten",
    label: "Integrierte Fertigkeiten",
    group: "Lernpfade",
    routeType: "page",
  },
  {
    route: "/ressourcen",
    label: "Ressourcen",
    group: "Lernpfade",
    routeType: "page",
  },
  {
    route: "/deutsch-mit-marija",
    label: "Material-Weiterleitung",
    group: "Lernpfade",
    routeType: "redirect",
  },
  {
    route: "/deutsch-mit-marija/uebung/[materialId]",
    label: "Materialübung",
    group: "Lernpfade",
    routeType: "dynamic",
  },
  {
    route: "/fortschritt",
    label: "Fortschritt & Nachweise",
    group: "Lernnachweise",
    routeType: "page",
  },
  {
    route: "/analytics",
    label: "Seitenanalyse",
    group: "Lernnachweise",
    routeType: "page",
  },
  {
    route: "/wiederholungen",
    label: "Wiederholungen",
    group: "Lernnachweise",
    routeType: "page",
  },
  {
    route: "/vokabelkarten",
    label: "Vokabelkarten",
    group: "Lernnachweise",
    routeType: "page",
  },
  {
    route: "/fehler",
    label: "Fehlermotor",
    group: "Lernnachweise",
    routeType: "page",
  },
  {
    route: "/audio",
    label: "Audio-Bibliothek",
    group: "Lernnachweise",
    routeType: "page",
  },
  {
    route: "/notizbuch",
    label: "Notizbuch",
    group: "Lernnachweise",
    routeType: "external",
  },
  {
    route: "/pdf-reader",
    label: "PDF-Leser",
    group: "Lernnachweise",
    routeType: "external",
  },
  {
    route: "/einstellungen",
    label: "Einstellungen",
    group: "System",
    routeType: "page",
  },
  {
    route: "/lehrkraft",
    label: "Lehrkraft-Studio",
    group: "System",
    routeType: "page",
  },
  {
    route: "/klassik",
    label: "Klassik-Weiterleitung",
    group: "System",
    routeType: "redirect",
  },
  {
    route: "/support",
    label: "Support",
    group: "Hilfeseiten",
    routeType: "page",
  },
  {
    route: "/privacy",
    label: "Datenschutz",
    group: "Hilfeseiten",
    routeType: "page",
  },
  {
    route: "/offline",
    label: "Offline",
    group: "Hilfeseiten",
    routeType: "page",
  },
] as const satisfies readonly PageCatalogItem[];

export type NavigationType = "initial" | "push" | "replace" | "traverse";

export interface PageRouteAttempt {
  readonly id: string;
  readonly sessionId: string;
  readonly requestedRoute: string;
  readonly finalRoute: string;
  readonly routePattern: string;
  readonly navigationType: NavigationType;
  readonly occurredAt: string;
}

export interface PageAnalyticsDataQuality {
  readonly storageState: "available" | "empty" | "invalid" | "unavailable";
  readonly storedRows: number;
  readonly acceptedRows: number;
  readonly rejectedRows: number;
  readonly duplicateRows: number;
  readonly repairedRows: number;
}

export interface PageAnalyticsDataset {
  readonly events: PageRouteAttempt[];
  readonly quality: PageAnalyticsDataQuality;
}

export interface PageAnalyticsRouteRow extends PageCatalogItem {
  readonly entryAttempts: number;
  readonly renderedViews: number;
  readonly lastRequestedAt: string | undefined;
  readonly lastRenderedAt: string | undefined;
  readonly lastActivityAt: string | undefined;
}

const STORAGE_KEY = "deutschflow:page-route-attempts:v1";
const SESSION_KEY = "deutschflow:analytics-session:v1";
const PENDING_KEY = "deutschflow:pending-route:v1";
const UPDATED_EVENT = "deutschflow:page-analytics-updated";
const MAX_EVENTS = 500;
const PENDING_ROUTE_MAX_AGE_MS = 30_000;

interface PendingRoute {
  readonly requestedRoute: string;
  readonly navigationType: Exclude<NavigationType, "initial">;
  readonly startedAt: number;
}

function normalizePathname(value: string): string {
  try {
    const pathname = new URL(value, "https://local.invalid").pathname;
    return pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  } catch {
    return "/";
  }
}

export function matchRoutePattern(pathname: string): string {
  const normalized = normalizePathname(pathname);
  return /^\/deutsch-mit-marija\/uebung\/[^/]+$/.test(normalized)
    ? "/deutsch-mit-marija/uebung/[materialId]"
    : normalized;
}

function toPageRouteAttempt(value: unknown): PageRouteAttempt | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<PageRouteAttempt>;
  if (
    typeof row.id !== "string" ||
    row.id.length === 0 ||
    typeof row.sessionId !== "string" ||
    row.sessionId.length === 0 ||
    typeof row.requestedRoute !== "string" ||
    typeof row.finalRoute !== "string" ||
    typeof row.occurredAt !== "string" ||
    !Number.isFinite(Date.parse(row.occurredAt)) ||
    !["initial", "push", "replace", "traverse"].includes(
      row.navigationType ?? "",
    )
  )
    return null;

  const requestedRoute = normalizePathname(row.requestedRoute);
  const finalRoute = normalizePathname(row.finalRoute);
  return {
    id: row.id,
    sessionId: row.sessionId,
    requestedRoute,
    finalRoute,
    routePattern: matchRoutePattern(finalRoute),
    navigationType: row.navigationType as NavigationType,
    occurredAt: new Date(row.occurredAt).toISOString(),
  };
}

function emptyQuality(
  storageState: PageAnalyticsDataQuality["storageState"],
): PageAnalyticsDataQuality {
  return {
    storageState,
    storedRows: 0,
    acceptedRows: 0,
    rejectedRows: 0,
    duplicateRows: 0,
    repairedRows: 0,
  };
}

export function parsePageRouteAttempts(value: unknown): PageAnalyticsDataset {
  if (!Array.isArray(value))
    return { events: [], quality: emptyQuality("invalid") };
  const events: PageRouteAttempt[] = [];
  const ids = new Set<string>();
  let rejectedRows = 0;
  let duplicateRows = 0;
  let repairedRows = 0;
  for (const candidate of value) {
    const event = toPageRouteAttempt(candidate);
    if (!event) {
      rejectedRows += 1;
      continue;
    }
    if (ids.has(event.id)) {
      duplicateRows += 1;
      continue;
    }
    ids.add(event.id);
    const original = candidate as Partial<PageRouteAttempt>;
    if (
      original.requestedRoute !== event.requestedRoute ||
      original.finalRoute !== event.finalRoute ||
      original.routePattern !== event.routePattern ||
      original.occurredAt !== event.occurredAt
    )
      repairedRows += 1;
    events.push(event);
  }
  return {
    events,
    quality: {
      storageState: value.length === 0 ? "empty" : "available",
      storedRows: value.length,
      acceptedRows: events.length,
      rejectedRows,
      duplicateRows,
      repairedRows,
    },
  };
}

export function readPageAnalyticsDataset(): PageAnalyticsDataset {
  if (typeof window === "undefined")
    return { events: [], quality: emptyQuality("unavailable") };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { events: [], quality: emptyQuality("empty") };
    return parsePageRouteAttempts(JSON.parse(raw) as unknown);
  } catch {
    return { events: [], quality: emptyQuality("invalid") };
  }
}

export function readPageRouteAttempts(): PageRouteAttempt[] {
  return readPageAnalyticsDataset().events;
}

function latestTimestamp(
  values: readonly (string | undefined)[],
): string | undefined {
  return values.reduce<string | undefined>((latest, value) => {
    if (!value) return latest;
    if (!latest || Date.parse(value) > Date.parse(latest)) return value;
    return latest;
  }, undefined);
}

export function buildPageAnalyticsRows(
  events: readonly PageRouteAttempt[],
): PageAnalyticsRouteRow[] {
  return PAGE_CATALOG.map((page) => {
    const requested = events.filter(
      (event) => matchRoutePattern(event.requestedRoute) === page.route,
    );
    const rendered = events.filter(
      (event) => event.routePattern === page.route,
    );
    const lastRequestedAt = latestTimestamp(
      requested.map((event) => event.occurredAt),
    );
    const lastRenderedAt = latestTimestamp(
      rendered.map((event) => event.occurredAt),
    );
    return {
      ...page,
      entryAttempts: requested.length,
      renderedViews: rendered.length,
      lastRequestedAt,
      lastRenderedAt,
      lastActivityAt: latestTimestamp([lastRequestedAt, lastRenderedAt]),
    };
  });
}

export function findUnknownPageRoutes(events: readonly PageRouteAttempt[]): {
  readonly requested: string[];
  readonly rendered: string[];
} {
  const known = new Set<string>(PAGE_CATALOG.map((page) => page.route));
  const requested = new Set<string>();
  const rendered = new Set<string>();
  for (const event of events) {
    const requestedPattern = matchRoutePattern(event.requestedRoute);
    if (!known.has(requestedPattern)) requested.add(requestedPattern);
    if (!known.has(event.routePattern)) rendered.add(event.routePattern);
  }
  return { requested: [...requested].sort(), rendered: [...rendered].sort() };
}

function getSessionId(): string {
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, created);
  return created;
}

export function recordNavigationStart(
  url: string,
  navigationType: Exclude<NavigationType, "initial">,
): void {
  if (typeof window === "undefined") return;
  try {
    const pending: PendingRoute = {
      requestedRoute: normalizePathname(url),
      navigationType,
      startedAt: Date.now(),
    };
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // Analytics must never block navigation.
  }
}

function readPendingRoute(): PendingRoute | null {
  try {
    const value = window.sessionStorage.getItem(PENDING_KEY);
    window.sessionStorage.removeItem(PENDING_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<PendingRoute>;
    if (
      typeof parsed.requestedRoute !== "string" ||
      !["push", "replace", "traverse"].includes(parsed.navigationType ?? "") ||
      typeof parsed.startedAt !== "number" ||
      !Number.isFinite(parsed.startedAt) ||
      Date.now() - parsed.startedAt > PENDING_ROUTE_MAX_AGE_MS
    )
      return null;
    return {
      requestedRoute: normalizePathname(parsed.requestedRoute),
      navigationType: parsed.navigationType as Exclude<
        NavigationType,
        "initial"
      >,
      startedAt: parsed.startedAt,
    };
  } catch {
    return null;
  }
}

export function recordSettledRoute(pathname: string): PageRouteAttempt | null {
  if (typeof window === "undefined") return null;
  try {
    const finalRoute = normalizePathname(pathname);
    const pending = readPendingRoute();
    const requestedRoute = pending?.requestedRoute ?? finalRoute;
    const existing = readPageRouteAttempts();
    const previous = existing.at(-1);
    if (
      previous?.requestedRoute === requestedRoute &&
      previous.finalRoute === finalRoute &&
      Date.now() - Date.parse(previous.occurredAt) < 1_200
    )
      return previous;
    const row: PageRouteAttempt = {
      id: crypto.randomUUID(),
      sessionId: getSessionId(),
      requestedRoute,
      finalRoute,
      routePattern: matchRoutePattern(finalRoute),
      navigationType: pending?.navigationType ?? "initial",
      occurredAt: new Date().toISOString(),
    };
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...existing, row].slice(-MAX_EVENTS)),
    );
    window.dispatchEvent(new CustomEvent(UPDATED_EVENT));
    return row;
  } catch {
    return null;
  }
}

export function subscribeToPageAnalytics(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(UPDATED_EVENT, listener);
  return () => window.removeEventListener(UPDATED_EVENT, listener);
}
