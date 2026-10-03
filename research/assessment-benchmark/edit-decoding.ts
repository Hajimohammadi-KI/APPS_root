export function editDecodingProfile(name: string) {
  if (name !== "greedy" && name !== "reasoning") throw Error("Unknown edit decoding profile");
  const thinking = name === "reasoning";
  return {
    decodingProfile: name,
    mode: thinking ? "thinking" : "direct",
    temperature: thinking ? 1 : 0,
    top_p: thinking ? .95 : 1,
    top_k: thinking ? 20 : 0,
    min_p: 0,
    presence_penalty: thinking ? 1.5 : 0,
    repeat_penalty: 1,
    seed: thinking ? 61 : 59,
    max_tokens: thinking ? 1800 : 900,
    chat_template_kwargs: { enable_thinking: thinking },
  };
}

type RawResponse = {
  choices?: { finish_reason?: unknown; message?: { content?: unknown; reasoning_content?: unknown } }[];
  usage?: { prompt_tokens?: unknown; completion_tokens?: unknown };
};

/** Aggregate operational evidence only; never publish the local reasoning text. */
export function completionDiagnostics(phases: { raw: unknown; failure: string | null; requestStarted: boolean }[]) {
  const finishReasons: Record<string, number> = {};
  let reasoningResponses = 0, reasoningCharacters = 0, finalCharacters = 0;
  let promptTokens = 0, completionTokens = 0, responsesWithUsage = 0;
  const tokenCount = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
  for (const phase of phases) {
    const raw = phase.raw as RawResponse | null;
    const choice = raw?.choices?.[0];
    const reason = typeof choice?.finish_reason === "string" ? choice.finish_reason : "no-finish-reason";
    finishReasons[reason] = (finishReasons[reason] ?? 0) + 1;
    const reasoning = choice?.message?.reasoning_content;
    if (typeof reasoning === "string" && reasoning.trim()) {
      reasoningResponses++;
      reasoningCharacters += reasoning.length;
    }
    if (typeof choice?.message?.content === "string") finalCharacters += choice.message.content.length;
    if (tokenCount(raw?.usage?.prompt_tokens) && tokenCount(raw?.usage?.completion_tokens)) {
      responsesWithUsage++;
      promptTokens += raw.usage.prompt_tokens;
      completionTokens += raw.usage.completion_tokens;
    }
  }
  return { finishReasons, reasoningResponses, reasoningCharacters, finalCharacters, responsesWithUsage, promptTokens, completionTokens,
    requestsNotStarted: phases.filter(phase => !phase.requestStarted).length,
    timeoutFailures: phases.filter(phase => /timeout|timed out|aborted/i.test(phase.failure ?? "")).length,
  };
}
