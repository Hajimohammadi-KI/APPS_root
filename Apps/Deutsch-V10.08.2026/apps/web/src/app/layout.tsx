import type { Metadata, Viewport } from "next";

import "./globals.css";

import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";
import { DeepLSelectionTranslator } from "@/components/deepl-selection-translator";
import { GuardedNudge } from "@/features/adherence/guarded-nudge";

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
  themeColor: "#38bdf8",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
          <DeepLSelectionTranslator />
          <GuardedNudge />
        </Providers>
      </body>
    </html>
  );
}
