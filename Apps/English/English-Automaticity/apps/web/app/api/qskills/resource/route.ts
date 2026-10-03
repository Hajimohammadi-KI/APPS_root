import {
  qskillsContentType,
  qskillsResourceStream,
  resolveQSkillsResource,
} from "@/lib/qskills-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const relativePath = new URL(request.url).searchParams.get("path");
  if (!relativePath) return new Response("Missing QSkills resource.", { status: 400 });

  const filePath = await resolveQSkillsResource(relativePath);
  if (!filePath) return new Response("QSkills resource was not found.", { status: 404 });

  return new Response(qskillsResourceStream(filePath), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": qskillsContentType(filePath),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
