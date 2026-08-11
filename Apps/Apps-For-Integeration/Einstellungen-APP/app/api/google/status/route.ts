import { testGoogleConnection } from "../../../../lib/google-provider";

export async function GET(request: Request) {
  const status = await testGoogleConnection(request);
  return Response.json(status, { headers: { "Cache-Control": "no-store" } });
}
