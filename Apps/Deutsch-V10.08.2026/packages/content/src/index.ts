import grammarData from "./data/grammar.json";
import topicsData from "./data/topics.json";
import {
  completeControlledExercises,
  type GrammarExercise,
} from "./exercise-completion";
import {
  GRAMMAR_CATEGORIES,
  grammarCategoriesFor,
  type GrammarCategory,
} from "./grammar-taxonomy";
import {
  deutschMitMarijaSharedWithMeUrl,
  deutschMitMarijaSourceFolders,
  discussionGuideMaterials,
  discussionAudioMaterials,
  driveMaterialCollections,
  driveMaterialFolderUrl,
  errorRepairMaterials,
  grammarTrainingCatalog,
  grammarTrainingMaterials,
  grammarTrainingParts,
  idiomDailyMaterials,
  type DriveMaterialCollection,
  type DriveMaterialItem,
  type GrammarTrainingPart,
} from "./materials";
import {
  grammarExplanations,
  grammarMaterialFolderUrl,
  grammarMaterialSources,
  type GrammarExplanation,
  type GrammarMaterialSource,
} from "./explanations";
import { repairGermanGrammarLinks } from "./resource-links";
import { supplementalGrammarUnits } from "./grammar-supplement";
import { A1_AUTHORED, type AuthoredUnit } from "./authored/a1";
import { A2_AUTHORED } from "./authored/a2";
import { B1_AUTHORED } from "./authored/b1";
import { B2_AUTHORED } from "./authored/b2";
import { C1_AUTHORED } from "./authored/c1";
import { C2_AUTHORED } from "./authored/c2";
export {
  FERTIGKEITEN,
  cefrCurriculum,
  type CefrCurriculumLevel,
  type CefrStufe,
} from "./cefr-curriculum";

export {
  deutschMitMarijaSharedWithMeUrl,
  deutschMitMarijaSourceFolders,
  discussionGuideMaterials,
  discussionAudioMaterials,
  driveMaterialCollections,
  driveMaterialFolderUrl,
  errorRepairMaterials,
  grammarTrainingCatalog,
  grammarTrainingMaterials,
  grammarTrainingParts,
  grammarMaterialFolderUrl,
  grammarMaterialSources,
  GRAMMAR_CATEGORIES,
  grammarCategoriesFor,
  idiomDailyMaterials,
  type DriveMaterialCollection,
  type DriveMaterialItem,
  type GrammarTrainingPart,
  type GrammarCategory,
  type GrammarExercise,
  type GrammarExplanation,
  type GrammarMaterialSource,
};

export interface SpeakingTopic {
  readonly track: string;
  readonly level: string;
  readonly skill: string;
  readonly category: string;
  readonly topic: string;
  readonly task: string;
  readonly modelAnswer: string;
  readonly targetGrammar: string;
}

export interface GrammarLink {
  readonly 0: string;
  readonly 1: string;
  readonly 2: string;
  readonly 3: string;
  readonly 4: string;
}

export interface GrammarUnit {
  readonly level: string;
  readonly title: string;
  readonly rule: string;
  readonly explanation: GrammarExplanation;
  readonly examples: readonly string[];
  readonly commonError: string;
  readonly exercises: readonly (readonly string[])[];
  readonly links: readonly GrammarLink[];
  readonly testAnswer: string;
  readonly recallTest: string;
  readonly repairTest: string;
  readonly transferTest: string;
}

function normalizeSpeakingTopic(
  topic: SpeakingTopic,
  index: number,
): SpeakingTopic {
  const subject = `„${topic.topic}“`;
  const variant = index % 3;

  if (topic.level === "A1") {
    return {
      ...topic,
      task: `Sprich über das Thema ${subject}. Nenne drei persönliche Informationen und stelle am Ende eine einfache Frage.`,
      modelAnswer:
        variant === 0
          ? `Das Thema ${subject} ist für mich im Alltag wichtig. Ich kenne dazu ein gutes Beispiel. Darüber spreche ich gern. Wie ist das bei dir?`
          : variant === 1
            ? `Bei ${subject} denke ich zuerst an meinen Alltag. Ich mache dabei etwas Bestimmtes gern. Ein kleines Beispiel kann ich erklären. Was machst du?`
            : `Ich möchte kurz über ${subject} sprechen. Für mich gehört das zum normalen Leben. Ich nenne dazu ein Beispiel. Kennst du das auch?`,
    };
  }

  if (topic.level === "A2") {
    return {
      ...topic,
      task: `Berichte über eine persönliche Erfahrung zum Thema ${subject}. Beschreibe, was passiert ist, wie du reagiert hast und was du daraus gelernt hast.`,
      modelAnswer: `Zum Thema ${subject} habe ich vor Kurzem etwas erlebt. Zuerst war die Situation ungewohnt, aber dann habe ich eine passende Lösung gefunden. Dadurch habe ich etwas Wichtiges gelernt.`,
    };
  }

  if (topic.level === "B1") {
    return {
      ...topic,
      task: `Nimm zum Thema ${subject} Stellung. Formuliere eine klare Meinung, begründe sie und ergänze ein persönliches Beispiel.`,
      modelAnswer: `Beim Thema ${subject} halte ich eine ausgewogene Lösung für sinnvoll. Dafür spricht vor allem meine eigene Erfahrung. Ein konkretes Beispiel zeigt, dass kleine Veränderungen oft mehr bewirken als starre Regeln.`,
    };
  }

  if (topic.level === "B2" || topic.level === "B2-C1") {
    return {
      ...topic,
      task: `Diskutiere das Thema ${subject} differenziert. Stelle zwei Perspektiven gegenüber, bewerte ihre Folgen und begründe deine eigene Position.`,
      modelAnswer: `Das Thema ${subject} lässt sich aus unterschiedlichen Perspektiven betrachten. Einerseits gibt es überzeugende praktische Vorteile, andererseits entstehen mögliche Nachteile. Entscheidend ist für mich, welche Lösung langfristig tragfähig und fair bleibt.`,
    };
  }

  if (topic.level === "C1") {
    return {
      ...topic,
      task: `Analysiere das Thema ${subject}. Ordne zentrale Argumente ein, benenne eine Einschränkung und formuliere ein begründetes Urteil mit präzisen Verknüpfungen.`,
      modelAnswer: `Bei einer Analyse des Themas ${subject} reicht eine einfache Zustimmung oder Ablehnung nicht aus. Die Bewertung hängt von Voraussetzungen, Betroffenen und langfristigen Folgen ab. Daher überzeugt mich eine Position nur, wenn sie auch mögliche Gegenargumente berücksichtigt.`,
    };
  }

  return {
    ...topic,
    task: `Erörtere das Thema ${subject} präzise und nuanciert. Differenziere Begriffe, prüfe mindestens ein Gegenargument und formuliere ein stilistisch angemessenes Fazit.`,
    modelAnswer: `Das Thema ${subject} verlangt zunächst eine begriffliche Klärung. Erst danach lassen sich konkurrierende Positionen hinsichtlich ihrer Annahmen und Konsequenzen vergleichen. Mein Fazit fällt deshalb bewusst differenziert aus und berücksichtigt auch die Grenzen der eigenen Bewertung.`,
  };
}

const legacySpeakingTopics = topicsData as unknown as readonly SpeakingTopic[];

export const speakingTopics: readonly SpeakingTopic[] =
  legacySpeakingTopics.map(normalizeSpeakingTopic);
type LegacyGrammarUnit = Omit<GrammarUnit, "explanation">;

const legacyGrammarUnits =
  grammarData as unknown as readonly LegacyGrammarUnit[];

// Autorierte Vertiefung pro Niveau. Ein Eintrag hier ist eine Datei plus
// diese eine Zeile -- nichts sonst in der Pipeline ändert sich. Spiegelt
// English's AUTHORED_BY_LEVEL (packages/content/src/curriculum.ts dort).
// Exportiert (nicht nur intern verwendet), damit content.test.ts die
// tatsächlich autorierten Niveaus direkt daraus ableiten kann, statt sie in
// einer zweiten, von Hand gepflegten Liste zu wiederholen. Genau eine
// hartkodierte Liste war die Ursache, warum English's Gate B2/C1/C2 nach der
// Autorierung eine ganze Weile stillschweigend ungeprüft ließ -- die Liste
// dort wurde beim Hinzufügen neuer Niveaus schlicht vergessen zu aktualisieren.
export const AUTHORED_BY_LEVEL: Readonly<
  Record<string, Readonly<Record<string, AuthoredUnit>>>
> = {
  A1: A1_AUTHORED,
  A2: A2_AUTHORED,
  B1: B1_AUTHORED,
  B2: B2_AUTHORED,
  C1: C1_AUTHORED,
  C2: C2_AUTHORED,
};

/**
 * Baut aus einem autorierten Satz eine Lückenaufgabe: "Ergänze: Ich ___ Deutsch."
 * Nur ganze Wörter/Wortgruppen werden maskiert -- ein einfacher String-Replace
 * hätte "is" auch mitten in "Sister" ersetzt (derselbe Fehler wurde in der
 * englischen App gefunden und dort mit denselben Lookarounds behoben, siehe
 * clozeFromAuthored in English-07082026/packages/content/src/curriculum.ts).
 * Das Präfix "Ergänze: " ist bewusst: es ist der Marker, an dem German's
 * evaluatePracticeAnswer offene Produktion statt exaktem Vergleich zulässt
 * (Ergänze/Korrigiere den Satz vollständig), also wird eine korrekte
 * Umformulierung nicht durch einen reinen Zeichenkettenvergleich abgelehnt.
 */
function clozeFromAuthored(sentence: string, target: string): [string, string] | null {
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?<![\\wäöüßÄÖÜ])${escaped}(?![\\wäöüßÄÖÜ])`, "u");
  if (!pattern.test(sentence)) {
    // Zielwort kommt nicht als ganzes Wort im Satz vor -- überspringen statt
    // zu raten, sonst entsteht eine Lücke, die nichts maskiert.
    return null;
  }
  const blanked = sentence.replace(pattern, "___");
  return [`Ergänze: ${blanked}`, sentence];
}

/**
 * Mischt autorierte Beispielsätze und einen echten Transfersatz in eine
 * Einheit ein, BEVOR completeControlledExercises() läuft -- diese Funktion
 * liest examples/testAnswer/repairTest/recallTest/commonError, also muss die
 * Vertiefung vorher da sein. Ohne Eintrag bleibt die Einheit unverändert
 * (kein Fehler -- anders als beim explanation-Lookup oben, das absichtlich
 * wirft: eine fehlende Erklärung ist ein Content-Fehler, ein fehlender
 * Autorierungs-Eintrag ist nur "noch nicht vertieft").
 *
 * Die generierten Lückensätze werden VORN an unit.exercises gestellt, nicht
 * nur als examples mitgegeben -- completeControlledExercises() liest examples
 * nur für einen einzigen Rekonstruktions-Kandidaten (reorderedParts), nicht
 * für eigene Lückenaufgaben pro Satz. Vorn eingefügt gewinnen sie außerdem die
 * spätere Deduplizierung nach Antwort (zuerst gesehen bleibt), falls ein
 * migrierter Alt-Satz zufällig dieselbe Antwort erwartet.
 */
function withAuthoredContent<
  T extends {
    level: string;
    title: string;
    examples: readonly string[];
    exercises: readonly (readonly string[])[];
    transferTest: string;
  },
>(unit: T): T {
  const authored = AUTHORED_BY_LEVEL[unit.level]?.[unit.title];
  if (!authored) return unit;
  const clozes = authored.examples
    .map((example) => clozeFromAuthored(example.sentence, example.target))
    .filter((exercise): exercise is [string, string] => exercise !== null);
  return {
    ...unit,
    examples: authored.examples.map((example) => example.sentence),
    exercises: [...clozes, ...unit.exercises],
    transferTest: authored.transfer,
  };
}

export const grammarUnits: readonly GrammarUnit[] = [
  ...legacyGrammarUnits.map((rawUnit) => {
    const unit = withAuthoredContent(rawUnit);
    const explanation =
      grammarExplanations[unit.title as keyof typeof grammarExplanations];

    if (!explanation) {
      throw new Error(`Missing complete explanation for "${unit.title}".`);
    }

    return repairGermanGrammarLinks({
      ...unit,
      exercises: completeControlledExercises(unit),
      explanation,
    });
  }),
  ...supplementalGrammarUnits.map((rawUnit) => {
    const unit = withAuthoredContent(rawUnit);
    return {
      ...unit,
      exercises: completeControlledExercises(unit),
    };
  }),
];

export const catalogSummary = {
  topicCount: speakingTopics.length,
  grammarUnitCount: grammarUnits.length,
  levels: [...new Set(grammarUnits.map((unit) => unit.level))],
} as const;
