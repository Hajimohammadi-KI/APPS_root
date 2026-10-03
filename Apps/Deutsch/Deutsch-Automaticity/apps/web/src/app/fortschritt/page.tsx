import type { Metadata } from "next";

import { ProgressEvidence } from "@/features/progress/progress-evidence";

export const metadata: Metadata = {
  title: "Fortschritt & Nachweise",
  description:
    "Persönlicher Lernstatus, Fehleranalyse und Kompetenznachweise in kompakten Bereichen.",
};

export default function ProgressPage() {
  return <ProgressEvidence />;
}
