import type { Metadata, Viewport } from "next";
import { AppStoreProvider } from "@/features/store/app-store";
import { ContextualHoverHelp } from "@/features/components/contextual-hover-help";
import { GlobalReadingRuler } from "@/features/components/global-reading-ruler";
import { DeepLSelectionTranslator } from "@/features/components/deepl-selection-translator";
import { GuardedNudge } from "@/features/adherence/guarded-nudge";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ??
      "https://english-grammar-automaticity-pwa.vercel.app",
  ),
  applicationName: "English Automaticity",
  description:
    "Offline-capable English training for grammar, speaking, correction, transfer, and spaced review.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "English Automaticity",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  title: "English Automaticity",
  openGraph: {
    description:
      "Build automatic English grammar through guided production, correction, repair, transfer, and spaced review.",
    images: ["/automaticity-journey-hero.png"],
    title: "English Grammar Automaticity",
    type: "website",
  },
  icons: {
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    icon: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#155eef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppStoreProvider>
          {children}
          <GlobalReadingRuler />
          <ContextualHoverHelp />
          <DeepLSelectionTranslator />
          <GuardedNudge />
        </AppStoreProvider>
      </body>
    </html>
  );
}
