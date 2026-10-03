import type { Metadata } from "next";
import "./globals.css";
import ReadingRuler from "../components/reading-ruler";

export const metadata: Metadata = {
  title: "Einstellungen",
  description: "Zentrale, editierbare Einstellungen und Berechtigungen für verbundene Apps.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // German settings labels always inherit a stable left-to-right direction.
    <html lang="de" dir="ltr">
      <body>
        <ReadingRuler />
        {children}
      </body>
    </html>
  );
}
