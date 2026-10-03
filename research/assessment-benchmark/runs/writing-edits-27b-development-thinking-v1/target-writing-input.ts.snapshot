/** A development hypothesis: scope/recency changes only; never add reference labels. */
export const TARGET_SCOPE_PROMPT = `Only target is editable. read_only_context.before and read_only_context.after help interpretation but must never be corrected or confirmed in your output. A correct target requires edits [], even when the context contains errors. Never include unchanged replacements or entries saying no correction is needed.
Generic scope example (independently authored, not an evaluation case):
Input: {"language":"en","read_only_context":{"before":"He go home.","after":"They is ready."},"target":"The window is open."}
Output: {"edits":[],"status":"complete"}`;

export function targetWritingInput(row: { language: "en" | "de"; before: string; after: string; text: string }): string {
  return JSON.stringify({ language: row.language, read_only_context: { before: row.before, after: row.after }, target: row.text });
}
