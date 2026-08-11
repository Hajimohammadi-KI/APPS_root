import type { Metadata } from "next";
import StudioSource from "./source/studio-source";

export const metadata: Metadata = {
  title: "Konversationsstudio | Deutsch Automaticity",
  description: "Deutsch aufnehmen, prüfen, korrigieren und erneut sprechen.",
};

export default function StudioPage() {
  return <StudioSource />;
}
