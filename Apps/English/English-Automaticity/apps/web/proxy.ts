import { type NextRequest, NextResponse } from "next/server";
import {
	legacyScreenRedirect,
	type SearchParamsRecord,
} from "@/features/navigation/screen-routes";

// Shell screens used to be addressed as `/?screen=<id>`. Redirecting here,
// before rendering, keeps old bookmarks working even though the root layout
// only mounts page content after client-side recovery of saved learning data.
export function proxy(request: NextRequest) {
	const params: SearchParamsRecord = {};
	for (const key of new Set(request.nextUrl.searchParams.keys())) {
		params[key] = request.nextUrl.searchParams.getAll(key);
	}
	const target = legacyScreenRedirect(params);
	if (!target) return NextResponse.next();
	return NextResponse.redirect(new URL(target, request.nextUrl), 308);
}

export const config = { matcher: "/" };
