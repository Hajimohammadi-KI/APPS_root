import type { Route } from "next";
import { redirect } from "next/navigation";

export const metadata = { title: "Einstellungen" };

export default function SettingsPage() {
  const target =
    process.env.NEXT_PUBLIC_SETTINGS_URL ??
    "http://127.0.0.1:4312/settings?lang=de";
  redirect(target as Route);
}
