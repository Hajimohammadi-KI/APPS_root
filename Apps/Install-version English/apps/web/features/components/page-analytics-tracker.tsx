"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { recordSettledRoute } from "@/lib/page-analytics";

export function PageAnalyticsTracker() {
	const pathname = usePathname();

	React.useEffect(() => {
		recordSettledRoute(pathname);
	}, [pathname]);

	return null;
}
