import type { AssessmentEvent, AttemptEvent } from "./contracts";
import { isRecord } from "./contracts";
import { validateModelAssessment } from "./assessment";
import { readBoundedJson, type RuntimeModelApproval } from "./transformer";
/** Same-origin capability discovery never sends learner text. Offline remains local. */
export function createTransformerClient(transport: typeof fetch = fetch) {
  let capabilities: Promise<RuntimeModelApproval[]> | null = null;
  const load = () =>
    (capabilities ??= transport("/api/automaticity/transformer", {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    })
      .then((response) => readBoundedJson(response))
      .then((value) =>
        isRecord(value) &&
        value.enabled === true &&
        Array.isArray(value.approvals)
          ? (value.approvals as RuntimeModelApproval[])
          : [],
      )
      .catch(() => []));
  return async (
    attempt: AttemptEvent,
    baseline: AssessmentEvent,
  ): Promise<AssessmentEvent | null> => {
    if (
      attempt.task.modality !== "writing" ||
      attempt.task.stage === "notice" ||
      baseline.verdict !== "not_assessed"
    )
      return null;
    try {
      const approval = (await load()).find(
        (row) =>
          row.language === attempt.language &&
          row.approved &&
          Array.isArray(row.scopes) &&
          row.scopes.some(
            (scope) =>
              scope.constructionId === attempt.task.constructionId &&
              scope.taskVersion === attempt.task.version &&
              scope.rubricVersion === attempt.task.rubricVersion &&
              scope.modality === attempt.task.modality,
          ),
      );
      if (!approval) return null;
      const response = await transport("/api/automaticity/transformer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attempt }),
        signal: AbortSignal.timeout(18000),
        redirect: "error",
      });
      const body = await readBoundedJson(response);
      if (!isRecord(body) || !body.assessment) return null;
      const assessment = validateModelAssessment(
        body.assessment,
        attempt,
        approval,
      );
      return { ...assessment, supersedes: baseline.id };
    } catch {
      return null;
    }
  };
}
