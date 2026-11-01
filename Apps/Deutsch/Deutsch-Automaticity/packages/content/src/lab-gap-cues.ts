/** Grammar Lab clozes generated from examples that left the learner no way to
 * work out the missing word (Ich habe einen ___.). Each gets the sentence with
 * a visible cue after the unchanged instruction; the learning path's own
 * revisions come from gapCueRevisionsFor. The first answer fits the gap. */
const LAB_GAP_CUES: readonly (readonly [
  title: string,
  exercise: number,
  sentence: string,
  ...answers: string[],
])[] = [];

/** The cued exercise for a Lab cloze, keeping the instruction before the sentence. */
export function labGapCueFor(
  title: string,
  exercise: number,
  prompt: string,
): { readonly prompt: string; readonly answers?: readonly string[] } | undefined {
  const row = LAB_GAP_CUES.find(
    ([name, index]) => name === title && index === exercise,
  );
  if (!row) return undefined;
  const [, , sentence, ...answers] = row;
  const cued = `${prompt.slice(0, prompt.lastIndexOf(":") + 1)} ${sentence}`;
  return answers.length ? { prompt: cued, answers } : { prompt: cued };
}
