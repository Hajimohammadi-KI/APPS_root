import type { Metadata } from "next";

import { SettingsScreen } from "@/features/settings/settings-screen";

export const metadata: Metadata = { title: "Einstellungen" };

export default function SettingsPage() {
  return <SettingsScreen />;
}
