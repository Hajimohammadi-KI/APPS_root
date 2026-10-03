import { createInstalledTransformerRoute } from "@automaticity/learning-core/transformer-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handle = createInstalledTransformerRoute("en");
export const GET = handle;
export const POST = handle;
