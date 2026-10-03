import { LearningRecoveryBoundary } from "@/features/settings/learning-recovery-boundary";
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
        url: "/icons/deutschflow.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/icons/deutschflow.svg",
        sizes: "any",
        type: "image/svg+xml",
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
    // Keep the German application LTR at the document boundary; Persian
    // learning aids opt into RTL only on their own scoped containers.
    <html lang="de" dir="ltr">
      <body>
        <LearningRecoveryBoundary>
          <Providers>
            <AppShell>{children}</AppShell>
            <DeepLSelectionTranslator />
            <GuardedNudge />
          </Providers>
        </LearningRecoveryBoundary>
      </body>
    </html>
  );
}
