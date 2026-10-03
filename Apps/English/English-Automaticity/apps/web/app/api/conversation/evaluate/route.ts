import { handleGrammarFeedback } from "@automaticity/learning-core/grammar-feedback-server";

export async function POST(request: Request) {
  return handleGrammarFeedback(
    request,
    process.env.LANGUAGETOOL_URL ?? "https://api.languagetool.org/v2/check",
  );
}