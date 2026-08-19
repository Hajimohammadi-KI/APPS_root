"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordSettledRoute } from "@/lib/page-analytics";

export function PageAnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    recordSettledRoute(pathname);
  }, [pathname]);
  return null;
}
