import grammarData from "./data/grammar.json";
import { knownContentRepair } from "@automaticity/learning-core/content-repairs";
import {
  checkedPracticeFor,
  controlledPracticeFor,
  contentRevisionFor,
  gapCueRevisionsFor,
} from "@automaticity/learning-core/content-revisions";
import { gapFill, normalizeText } from "@automaticity/learning-core/text";
import topicsData from "./data/topics.json";
import { labGapCueFor } from "./lab-gap-cues";
import {
  classifyGrammarContent,
  closedHint,
  completeControlledExercises,
  feedbackDimensionsFor,
  type GrammarContentType,
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
export {
  FERTIGKEITEN,
  cefrCurriculum,
  type CefrCurriculumLevel,
  type CefrStufe,
} from "./cefr-curriculum";
export {
  germanMediationB1Pilot,
  releasedGermanMediationB1,
} from "./mediation-b1-pilot";

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
  type GrammarContentType,
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
  readonly contentType?: GrammarContentType;
  readonly examples: readonly string[];
  readonly commonError: string;
  readonly exercises: readonly GrammarExercise[];
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

/** The same authored 2026-11-01 revision as the independent learning path;
 * the controlled exercises are generated from these fields. */
function reviseUnit<
  T extends {
    readonly title: string;
    readonly commonError: string;
    readonly repairTest: string;
    readonly examples: readonly string[];
  },
>(unit: T): T {
  const revision = contentRevisionFor("de", unit.title);
  if (!revision) return unit;
  const repair = revision.repair;
  return {
    ...unit,
    ...(revision.examples ? { examples: [...revision.examples] } : {}),
    ...(repair
      ? {
          commonError: `${repair.source} → ${repair.answer}`,
          repairTest: repair.answer,
        }
      : {}),
  };
}

/** Show the authored instruction and accept its alternatives. A source that is
 * acceptable German is never presented under "Nicht richtig". */
function withRevisedCorrection(
  title: string,
  exercises: readonly GrammarExercise[],
): readonly GrammarExercise[] {
  const repair = contentRevisionFor("de", title)?.repair;
  const [correction, ...rest] = exercises;
  const metadata = correction?.[2];
  if (!repair || !metadata) return exercises;
  const prompt = repair.transformation
    ? {
        Deutsch: repair.prompt,
        English: `Follow this German instruction and write the complete answer in German: ${repair.prompt}`,
        فارسی: `طبق این دستور آلمانی عمل کن و پاسخ کامل را به آلمانی بنویس: ${repair.prompt}`,
      }
    : { ...metadata.prompt, Deutsch: repair.prompt };
  return [
    [
      repair.prompt,
      repair.answer,
      {
        ...metadata,
        prompt,
        ...(repair.alternatives?.length
          ? { acceptedAnswers: [...repair.alternatives] }
          : {}),
      },
    ],
    ...rest,
  ];
}

/** The learning path's visible cue for a one-gap exercise that had none. The
 * German frame keeps its translations; only the sentence after it changes. */
function withGapCues(
  title: string,
  exercises: readonly GrammarExercise[],
): readonly GrammarExercise[] {
  const revisions = gapCueRevisionsFor("de", title);
  return exercises.map((exercise, index) => {
    const [old, oldAnswer, metadata] = exercise;
    // A Lab row is written for this Lab exercise; it wins over the path's item.
    const cue = labGapCueFor(title, index, old) ?? revisions.get(index);
    const [answer, ...alternatives] = cue?.answers ?? [
      oldAnswer,
      ...(metadata?.acceptedAnswers ?? []),
    ];
    // A revision that keeps the stored answer must fit this exercise's gap; one
    // with its own answer may also replace a closed choice or ordering task.
    if (
      !cue ||
      !metadata ||
      metadata.mode !== "closed_recall" ||
      (cue.answers
        ? false
        : !/_{2,}/u.test(old) || gapFill(cue.prompt, answer!) === null)
    )
      return exercise;
    // The instruction ends at its first colon; the sentence may contain more.
    const task = old.slice(old.indexOf(":") + 1).trim();
    const frame = old.slice(0, old.length - task.length);
    const prompt =
      cue.prompt.startsWith(frame) &&
      Object.values(metadata.prompt).every((text) => text.endsWith(task))
        ? (Object.fromEntries(
            Object.entries(metadata.prompt).map(([language, text]) => [
              language,
              text.slice(0, text.length - task.length) +
                cue.prompt.slice(frame.length),
            ]),
          ) as typeof metadata.prompt)
        : {
            Deutsch: cue.prompt,
            English: `Follow this German instruction and write the complete answer in German: ${cue.prompt}`,
            فارسی: `طبق این دستور آلمانی عمل کن و پاسخ کامل را به آلمانی بنویس: ${cue.prompt}`,
          };
    const { acceptedAnswers: _, ...rest } = metadata;
    return [
      cue.prompt,
      answer!,
      {
        ...rest,
        prompt,
        ...(alternatives.length ? { acceptedAnswers: alternatives } : {}),
      },
    ];
  });
}

/** The error-notebook items of the learning path, after every
 * earlier exercise so saved Lab progress keeps its positions. */
function withNotebookItems(
  title: string,
  contentType: GrammarContentType,
  exercises: readonly GrammarExercise[],
): readonly GrammarExercise[] {
  const prompts = new Set(exercises.map(([prompt]) => prompt));
  const hint = closedHint(contentType);
  const added = checkedPracticeFor("de", title)
    .filter((row) => row.notebook && !prompts.has(row.prompt))
    .map<GrammarExercise>(({ prompt, answers, rejected }) => {
      const [answer, ...alternatives] = answers;
      return [
        prompt,
        answer!,
        {
          mode: "closed_recall",
          contentType,
          validation: "exact",
          answerRole: "expected",
          prompt: {
            Deutsch: prompt,
            English: `Follow this German instruction and write the complete answer in German: ${prompt}`,
            فارسی: `طبق این دستور آلمانی عمل کن و پاسخ کامل را به آلمانی بنویس: ${prompt}`,
          },
          hint: {
            Deutsch: `Aus dem Fehlerheft. ${hint.Deutsch}`,
            English: `From the error notebook. ${hint.English}`,
            فارسی: `از دفتر خطا. ${hint.فارسی}`,
          },
          feedbackDimensions: feedbackDimensionsFor(contentType),
          minimumSentences: 1,
          outputLanguage: "de",
          ...(alternatives.length ? { acceptedAnswers: alternatives } : {}),
          ...(rejected ? { rejectedAnswers: rejected } : {}),
        },
      ];
    });
  const result = [...exercises, ...added];
  const controlled: GrammarExercise[] = [];
  for (const { prompt, answers, rejected } of controlledPracticeFor(
    "de",
    title,
  ).filter((row) => !prompts.has(row.prompt))) {
    const [answer, ...alternatives] = answers;
    const existingIndex = result.findIndex(
      ([, key, metadata]) =>
        metadata?.mode === "closed_recall" &&
        normalizeText(key) === normalizeText(answer!) &&
        (metadata.acceptedAnswers ?? []).every((value) =>
          answers.some((form) => normalizeText(form) === normalizeText(value)),
        ),
    );
    if (existingIndex >= 0) {
      const existing = result[existingIndex]!;
      result[existingIndex] = [
        existing[0],
        existing[1],
        {
          ...existing[2]!,
          rejectedAnswers: [
            ...(existing[2]?.rejectedAnswers ?? []),
            ...rejected.map((wrong) => ({ ...wrong })),
          ],
        },
      ];
      continue;
    }
    controlled.push([
      prompt,
      answer!,
      {
        mode: "closed_recall",
        contentType,
        validation: "exact",
        answerRole: "expected",
        prompt: {
          Deutsch: prompt,
          English: `Follow this German instruction and write the complete answer in German: ${prompt}`,
          فارسی: `طبق این دستور آلمانی عمل کن و پاسخ کامل را به آلمانی بنویس: ${prompt}`,
        },
        hint: { ...hint },
        feedbackDimensions: feedbackDimensionsFor(contentType),
        minimumSentences: 1,
        outputLanguage: "de",
        acceptedAnswers: [...alternatives],
        rejectedAnswers: rejected.map((wrong) => ({ ...wrong })),
      },
    ]);
  }
  return [...result, ...controlled];
}

export const grammarUnits: readonly GrammarUnit[] = [
  ...legacyGrammarUnits.map((original) => {
    const repair = knownContentRepair("de", original.title);
    const unit = reviseUnit(
      repair
        ? {
            ...original,
            commonError: `${repair.source} → ${repair.answer}`,
            repairTest: repair.answer,
            exercises: original.exercises.map<GrammarExercise>((exercise) =>
              exercise[0] === repair.legacyPrompt
                ? [repair.prompt, repair.answer]
                : exercise,
            ),
          }
        : original,
    );
    const explanation =
      grammarExplanations[unit.title as keyof typeof grammarExplanations];

    if (!explanation) {
      throw new Error(`Missing complete explanation for "${unit.title}".`);
    }

    const contentType = classifyGrammarContent(unit);
    return repairGermanGrammarLinks({
      ...unit,
      contentType,
      exercises: withNotebookItems(
        unit.title,
        contentType,
        withGapCues(
          unit.title,
          withRevisedCorrection(unit.title, completeControlledExercises(unit)),
        ),
      ),
      explanation,
    });
  }),
  ...supplementalGrammarUnits.map((original) => {
    const unit = reviseUnit(original);
    const contentType = classifyGrammarContent(unit);
    return repairGermanGrammarLinks({
      ...unit,
      contentType,
      exercises: withNotebookItems(
        unit.title,
        contentType,
        withGapCues(
          unit.title,
          withRevisedCorrection(unit.title, completeControlledExercises(unit)),
        ),
      ),
    });
  }),
];

/** The payload of public/replacements/de/grammar-catalog.js for the browser Grammar Lab. */
export const browserGrammarCatalog = grammarUnits.map((unit) => ({
  level: unit.level,
  title: unit.title,
  contentType: unit.contentType,
  rule: unit.rule,
  explanation: unit.explanation,
  examples: unit.examples,
  commonError: unit.commonError,
  exercises: unit.exercises,
  testAnswer: unit.testAnswer,
  recallTest: unit.recallTest,
  repairTest: unit.repairTest,
  transferTest: unit.transferTest,
}));

export const catalogSummary = {
  topicCount: speakingTopics.length,
  grammarUnitCount: grammarUnits.length,
  levels: [...new Set(grammarUnits.map((unit) => unit.level))],
} as const;
