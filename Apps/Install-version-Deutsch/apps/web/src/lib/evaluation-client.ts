import {
  evaluationResponseSchema,
  type EvaluationKind,
  type EvaluationResponse,
} from "@grammar/contracts";
import { evaluateAnswer, type GrammarTarget } from "@grammar/domain";

interface EvaluationRequest {
  readonly allowOnlineFeedback: boolean;
  readonly apiBaseUrl: string;
  readonly text: string;
  readonly grammar: GrammarTarget;
  readonly kind: EvaluationKind;
  readonly taskPrompt?: string;
  readonly spellingAffectsMastery?: boolean;
}

function applySpellingAccommodation(
  result: EvaluationResponse,
  request: EvaluationRequest,
): EvaluationResponse {
  if (request.spellingAffectsMastery) {
    return result;
  }
  const spellingIssues = result.issues.filter(
    (issue) => issue.errorClass === "spelling",
  );
  if (spellingIssues.length === 0) {
    return result;
  }
  const blockingIssues = result.issues.filter(
    (issue) => issue.errorClass !== "spelling",
  );
  const practiceReady = blockingIssues.length === 0;
  return evaluationResponseSchema.parse({
    ...result,
    accuracyScore: Math.min(
      100,
      result.accuracyScore + spellingIssues.length * 6,
    ),
    practiceReady,
    verified: result.online,
    ok: result.online && practiceReady,
    nextAction:
      blockingIssues.length > 0
        ? "repair"
        : request.kind === "review"
          ? "schedule_review"
          : "transfer",
  });
}

function offlineEvaluation(
  request: EvaluationRequest,
  reason: string,
): EvaluationResponse {
  return applySpellingAccommodation(
    evaluationResponseSchema.parse(
      evaluateAnswer(
        request.text,
        request.grammar,
        request.kind,
        {
          matches: [],
          online: false,
          networkError: reason,
        },
        request.taskPrompt,
      ),
    ),
    request,
  );
}

export async function requestEvaluation(
  request: EvaluationRequest,
): Promise<EvaluationResponse> {
  if (!request.allowOnlineFeedback) {
    return offlineEvaluation(
      request,
      "Online-Feedback ist deaktiviert. Die lokale Basisprüfung bleibt aktiv.",
    );
  }

  try {
    const response = await fetch(`${request.apiBaseUrl}/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: request.text,
        grammar: request.grammar,
        kind: request.kind,
        taskPrompt: request.taskPrompt,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return applySpellingAccommodation(
      evaluationResponseSchema.parse(await response.json()),
      request,
    );
  } catch (error) {
    return offlineEvaluation(
      request,
      error instanceof Error
        ? `Online-Prüfung nicht erreichbar: ${error.message}`
        : "Online-Prüfung nicht erreichbar.",
    );
  }
}
