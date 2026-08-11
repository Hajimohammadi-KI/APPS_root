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
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
