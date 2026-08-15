import { disconnectGoogle } from "../../../../lib/google-provider";
import { isSameOriginMutation } from "../../../../lib/server-user";

function clearHeaders(location?: string) {
  const headers = new Headers(location ? { Location: location } : undefined);
  for (const name of ["werkzeug_google_access", "werkzeug_google_refresh", "werkzeug_google_state"]) headers.append("Set-Cookie", `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return headers;
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({ message: "Diese Änderung ist nur direkt in Einstellungen erlaubt." }, { status: 403 });
  await disconnectGoogle(request);
  return Response.json({ ok: true, message: "Google wurde getrennt." }, { headers: clearHeaders() });
}

export async function GET() {
  return Response.json({ message: "Zum Trennen ist eine bestätigte POST-Anfrage erforderlich." }, { status: 405, headers: { Allow: "POST" } });
}
