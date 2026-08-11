import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Gesprächsstudio",
  robots: { index: false, follow: false },
};

export default function TopicsPage() {
  redirect("/studio");
}
