"use client";

import { IntegratedSkillsScreen } from "@/features/screens/integrated-skills-screen";
import { useAppNavigate } from "@/lib/app-navigate";

export default function IntegratedSkillsPage() {
	const navigate = useAppNavigate();
	return <IntegratedSkillsScreen navigate={navigate} />;
}
