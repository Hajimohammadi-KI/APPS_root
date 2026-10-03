import { LearningRecoveryBoundary } from "@/features/components/learning-recovery-boundary";
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
    title: "English Grammar Automaticity",
    type: "website",
  },
  icons: {
    apple: [
      { url: "/icons/automaticity.svg", sizes: "any", type: "image/svg+xml" },
    ],
    icon: "/icons/automaticity.svg",
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
    // Keep the English application LTR at the document boundary; Persian
    // learning aids opt into RTL only on their own scoped containers.
    <html lang="en" dir="ltr">
      <body>
        <LearningRecoveryBoundary><AppStoreProvider>
          {children}
          <GlobalReadingRuler />
          <ContextualHoverHelp />
          <DeepLSelectionTranslator />
          <GuardedNudge />
        </AppStoreProvider></LearningRecoveryBoundary>
      </body>
    </html>
  );
}
