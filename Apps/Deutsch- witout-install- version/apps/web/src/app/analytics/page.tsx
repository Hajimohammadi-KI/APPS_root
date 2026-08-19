import type { Metadata } from "next";
import { PageAnalyticsDashboard } from "@/features/analytics/page-analytics-dashboard";

export const metadata: Metadata = { title: "Seitenanalyse" };

export default function AnalyticsPage() {
  return <PageAnalyticsDashboard />;
}
