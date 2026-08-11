import { googleAccessToken } from "../../../../lib/google-provider";

export async function GET(request: Request) {
  const access = await googleAccessToken(request);
  const headers = { "Cache-Control": "no-store" };
  if (!access.token) return Response.json({ message: access.message || "Gmail ist nicht verbunden." }, { status: 401, headers });
  if (!String(access.tokens?.scope || "").split(/\s+/).includes("https://www.googleapis.com/auth/gmail.readonly")) return Response.json({ message: "Gmail wurde für diese Verbindung nicht freigegeben." }, { status: 403, headers });
  const query = new URL(request.url).searchParams.get("q") || "newer_than:1y";
  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("q", query); listUrl.searchParams.set("maxResults", "30");
  const listResponse = await fetch(listUrl, { headers: { Authorization: `Bearer ${access.token}` } });
  const list = await listResponse.json() as { messages?: Array<{ id: string }>; error?: { message?: string } };
  if (!listResponse.ok) return Response.json({ message: list.error?.message || "Gmail konnte nicht gelesen werden." }, { status: listResponse.status, headers });
  const messages = await Promise.all((list.messages || []).map(async ({ id }) => {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${access.token}` } });
    if (!response.ok) return null;
    return response.json() as Promise<{ id: string; internalDate?: string; labelIds?: string[]; snippet?: string; payload?: { headers?: Array<{ name: string; value: string }> } }>;
  }));
  const items = messages.filter((message): message is NonNullable<typeof message> => Boolean(message)).map((message) => {
    const header = (name: string) => message.payload?.headers?.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value || "Unbekannt";
    const sent = message.labelIds?.includes("SENT") ?? false;
    const headerTime = Date.parse(header("Date"));
    const internalTime = Number(message.internalDate || 0);
    const timestamp = Number.isFinite(headerTime) ? headerTime : Number.isFinite(internalTime) && internalTime > 0 ? internalTime : 0;
    return { id: message.id, subject: header("Subject"), from: header("From"), to: header("To"), date: timestamp ? new Date(timestamp).toISOString() : "", direction: sent ? "sent" : "received", body: message.snippet || "", attachments: [], imported: false };
  });
  return Response.json({ items }, { headers });
}
