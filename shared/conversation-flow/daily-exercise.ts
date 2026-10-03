import type { Language, Topic } from "./model";

export interface DailyWorksheet {
  id: string;
  topic: string;
  level: string;
  focus: string;
  models: readonly { sentence: string }[];
  oral: readonly { prompt: string; answer: string }[];
  personal: readonly string[];
}
export interface DailyExercise {
  activity: 2 | 3 | 6;
  worksheet: DailyWorksheet;
  topic: Topic;
  models: readonly string[];
}

/** Daily context must resolve to authored content, never the first conversation topic. */
export function dailyExercise(
  params: URLSearchParams,
  worksheets: readonly DailyWorksheet[],
  language: Language,
): DailyExercise | undefined {
  if (params.get("from") !== "daily") return;
  const activity = Number(params.get("activity"));
  if (activity !== 2 && activity !== 3 && activity !== 6) return;
  const worksheet = worksheets.find((item) =>
    params.has("worksheet")
      ? item.id === params.get("worksheet")
      : item.level === params.get("level") &&
        item.topic === params.get("topic"),
  );
  if (!worksheet)
    throw new Error("The selected daily grammar topic was not found.");
  const de = language === "de";
  const title =
    activity === 2
      ? de
        ? "Laut automatisieren"
        : "Automate aloud"
      : activity === 3
        ? de
          ? "Frei sprechen und übertragen"
          : "Speak freely and transfer"
        : de
          ? "Shadowing in fünf Schritten"
          : "Five-stage shadowing";
  const task =
    activity === 2
      ? de
        ? "Höre das Modell. Lies jeden Satz laut. Decke ihn dann ab und sprich ihn aus dem Gedächtnis."
        : "Listen to the model. Read each sentence aloud. Then cover it and say it from memory."
      : activity === 3
        ? (de
            ? "Sprich frei über dein eigenes Leben. Verwende die Zielform und ergänze ein neues Detail. "
            : "Speak freely about your own life. Use the target form and add a new detail. ") +
          worksheet.personal
            .map((prompt) =>
              prompt.replace(/^Write\b/, "Say").replace(/^Schreibe\b/, "Sage"),
            )
            .join(" ")
        : de
          ? "Höre zu, wiederhole in Abschnitten, sprich mit und erzähle anschließend ohne Vorlage nach."
          : "Listen, repeat in chunks, shadow the model, then retell it without the text.";
  return {
    activity,
    worksheet,
    models:
      activity === 2
        ? worksheet.oral.map((item) => item.answer)
        : worksheet.models.map((item) => item.sentence),
    topic: {
      id: `daily:${activity}:${worksheet.id}`,
      level: worksheet.level,
      topic: `${title} · ${worksheet.topic}`,
      task,
      category: "daily-practice",
      targetForm: worksheet.focus,
      contentVersion: "daily-exercise-v1",
      hints: [],
    },
  };
}
