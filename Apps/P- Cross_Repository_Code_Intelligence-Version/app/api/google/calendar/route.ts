import { googleAccessToken } from "../../../../lib/google-provider";
import { isSameOriginMutation } from "../../../../lib/server-user";

const CALENDAR_READ_SCOPES = new Set([
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.events.readonly",
]);
const CALENDAR_WRITE_SCOPE = "https://www.googleapis.com/auth/calendar.events";

function grantedScopes(access: Awaited<ReturnType<typeof googleAccessToken>>) {
  return new Set(String(access.tokens?.scope || "").split(/\s+/).filter(Boolean));
}

export async function GET(request: Request) {
  const access = await googleAccessToken(request);
  const headers = { "Cache-Control": "no-store" };
  if (!access.token) return Response.json({ message: access.message || "Google Calendar ist nicht verbunden." }, { status: 401, headers });
  if (![...grantedScopes(access)].some((scope) => CALENDAR_READ_SCOPES.has(scope))) return Response.json({ message: "Google Calendar wurde für diese Verbindung nicht freigegeben." }, { status: 403, headers });
  const start = new Date(); start.setMonth(start.getMonth() - 2);
  const end = new Date(); end.setMonth(end.getMonth() + 12);
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", start.toISOString()); url.searchParams.set("timeMax", end.toISOString()); url.searchParams.set("singleEvents", "true"); url.searchParams.set("orderBy", "startTime"); url.searchParams.set("maxResults", "1000");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${access.token}` } });
  const data = await response.json() as { items?: Array<{ id: string; summary?: string; start?: { date?: string; dateTime?: string }; end?: { date?: string; dateTime?: string } }>; error?: { message?: string } };
  if (!response.ok) return Response.json({ message: data.error?.message || "Google Calendar konnte nicht gelesen werden. Bitte Verbindung testen." }, { status: response.status, headers });
  const items = (data.items || []).map((event) => {
    const startValue = event.start?.dateTime || event.start?.date || "";
    const endValue = event.end?.dateTime || event.end?.date || startValue;
    const milliseconds = new Date(endValue).getTime() - new Date(startValue).getTime();
    const duration = Number.isFinite(milliseconds) ? Math.max(0, Math.round(milliseconds / 60000)) : 0;
    return { id: `google-${event.id}`, date: startValue.slice(0, 10), title: event.summary || "Google-Kalendertermin", type: "Kalender", duration, status: "busy", source: "calendar" };
  });
  return Response.json({ items }, { headers });
}

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!isSameOriginMutation(request)) return Response.json({ message: "Der Termin kann nur direkt aus dieser App erstellt werden." }, { status: 403, headers });
  const access = await googleAccessToken(request);
  if (!access.token) return Response.json({ message: access.message || "Google Calendar ist nicht verbunden." }, { status: 401, headers });
  if (!grantedScopes(access).has(CALENDAR_WRITE_SCOPE)) return Response.json({ message: "Google Calendar benötigt einmalig die Freigabe zum Erstellen von Terminen." }, { status: 403, headers });

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return Response.json({ message: "Die Termindaten sind ungültig." }, { status: 400, headers }); }
  const summary = String(body.summary || "Lernsitzung").trim().slice(0, 200);
  const description = String(body.description || "").trim().slice(0, 4000);
  const start = new Date(String(body.start || ""));
  const end = new Date(String(body.end || ""));
  const duration = end.getTime() - start.getTime();
  if (!summary || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || duration <= 0 || duration > 12 * 60 * 60 * 1000) {
    return Response.json({ message: "Start, Ende oder Titel des Termins sind ungültig." }, { status: 400, headers });
  }

  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${access.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ summary, description, start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() } }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json() as { id?: string; htmlLink?: string; summary?: string; error?: { message?: string } };
  if (!response.ok) return Response.json({ message: data.error?.message || "Der Google-Kalendertermin konnte nicht erstellt werden." }, { status: response.status, headers });
  return Response.json({ ok: true, id: data.id, htmlLink: data.htmlLink, summary: data.summary || summary }, { headers });
}
