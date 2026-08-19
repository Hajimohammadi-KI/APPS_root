import { notFound } from "next/navigation";

import { MaterialPracticeSession } from "@/features/resources/material-practice-session";
import { getMaterialPracticePlan } from "@/lib/material-practice";

export const metadata = { title: "Quellenübung" };

export default async function MaterialPracticePage({
  params,
}: Readonly<{ params: Promise<{ materialId: string }> }>) {
  const { materialId } = await params;
  const plan = getMaterialPracticePlan(decodeURIComponent(materialId));
  if (!plan) notFound();
  return <MaterialPracticeSession plan={plan} />;
}
