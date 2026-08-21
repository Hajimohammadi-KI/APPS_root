import { redirect } from "next/navigation";

export const metadata = { title: "Übungen" };

export default function DeutschMitMarijaPage() {
  redirect("/ressourcen");
}
