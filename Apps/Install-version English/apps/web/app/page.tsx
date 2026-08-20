"use client";

import { MissionHomeScreen } from "@/features/screens/mission-home-screen";
import { useAppNavigate } from "@/lib/app-navigate";

export default function HomePage() {
	const navigate = useAppNavigate();
	return <MissionHomeScreen navigate={navigate} />;
}
