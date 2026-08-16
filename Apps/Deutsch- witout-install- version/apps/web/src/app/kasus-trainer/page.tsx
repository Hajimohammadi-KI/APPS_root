import { CaseAutomaticityTrainer } from "@/features/grammar/case-automaticity-trainer";

export const metadata = { title: "Kasus-Trainer" };

export default function KasusTrainerPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Kasus-Trainer
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Sechs Schritte statt einer Tabelle: Verb finden, Satzrolle
          bestimmen, Kasus ableiten, Artikel und Endung bauen, laut sprechen,
          dasselbe Muster in einem neuen Satz anwenden.
        </p>
      </div>
      <CaseAutomaticityTrainer />
    </div>
  );
}
