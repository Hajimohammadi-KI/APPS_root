"use client";

import { DashboardV2Screen } from "@/features/screens/dashboard-v2-screen";
import { useAppNavigate } from "@/lib/app-navigate";

export default function HomePage() {
	const navigate = useAppNavigate();
	return <DashboardV2Screen navigate={navigate} />;
}
