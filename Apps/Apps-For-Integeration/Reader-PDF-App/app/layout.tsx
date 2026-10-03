import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research PDF Studio",
  description: "Read, highlight, translate and study research PDFs with AI assistance.",
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
    // German reader controls and document chrome always flow left-to-right.
    <html lang="de" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
