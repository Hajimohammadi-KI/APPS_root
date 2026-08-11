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
    <html lang="de">
      <body>
        <ReadingRuler />
        {children}
      </body>
    </html>
  );
}
