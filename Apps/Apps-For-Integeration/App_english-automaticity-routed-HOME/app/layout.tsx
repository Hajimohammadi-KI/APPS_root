import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Automaticity",
  description: "Measurable daily language practice dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // English routed-home content always inherits left-to-right direction.
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
