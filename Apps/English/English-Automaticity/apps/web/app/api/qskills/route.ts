import { getQSkillsCatalog } from "@/lib/qskills-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getQSkillsCatalog(), {
    headers: { "Cache-Control": "no-store" },
  });
}
