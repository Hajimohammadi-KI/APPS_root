import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterServiceWorker from "./register-service-worker";
import LocalNavigation from "./local-navigation";
import PersianHoverHelp from "./persian-hover-help";
import ReadingRuler from "../components/reading-ruler";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#eee7f6",
};

export const metadata: Metadata = {
  title: "Lernstudio | Cross Repository Code Intelligence",
  description:
    "Eine installierbare App für Lernplan, PDF Visual, Fokuszeit und zentrale Einstellungen",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CRI Lernstudio",
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" dir="ltr">
      <body>
        <LocalNavigation />
        <ReadingRuler />
        {children}
        <PersianHoverHelp />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
