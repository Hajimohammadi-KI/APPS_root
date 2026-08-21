import type { Metadata, Viewport } from "next";
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

// Without this, mobile browsers render at a virtual desktop-width viewport
// and scale the whole page down instead of letting it reflow.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
