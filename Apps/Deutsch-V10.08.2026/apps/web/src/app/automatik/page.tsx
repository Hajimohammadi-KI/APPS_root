import type { Metadata } from "next";

import { AutomaticityLab } from "@/features/automaticity/automaticity-lab";

export const metadata: Metadata = { title: "Automatik-Mission" };

export default function AutomaticityPage() {
  return <AutomaticityLab />;
}
