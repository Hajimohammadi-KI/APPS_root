import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";
import { DeepLSelectionTranslator } from "@/components/deepl-selection-translator";
import { PageAnalyticsTracker } from "@/components/page-analytics-tracker";

export const metadata: Metadata = {
  title: {
    default: "DeutschFlow",
    template: "%s · DeutschFlow",
  },
  description:
    "Deutsche Grammatik gezielt abrufen, anwenden und automatisieren.",
  applicationName: "DeutschFlow",
  appleWebApp: {
    capable: true,
    title: "DeutschFlow",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f7",
  colorScheme: "light",
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
    <html className={GeistSans.variable} lang="de">
      <body>
        <Providers>
          <PageAnalyticsTracker />
          <AppShell>{children}</AppShell>
          <DeepLSelectionTranslator />
        </Providers>
      </body>
    </html>
  );
}
