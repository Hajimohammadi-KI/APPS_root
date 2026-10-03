import type { AssessmentEvent, AttemptEvent } from "./contracts";
import { isRecord } from "./contracts";
import { validateModelAssessment } from "./assessment";
import { readBoundedJson, type RuntimeModelApproval } from "./transformer";
/** Same-origin capability discovery never sends learner text. Offline remains local. */
export function createTransformerClient(
  transport: typeof fetch = fetch,
  clock: () => number = Date.now,
) {
  let capabilities: Promise<RuntimeModelApproval[]> | null = null;
  let expiresAt = 0;
  let loading = false;
  const load = (refresh: boolean) => {
    if (capabilities && (loading || (!refresh && clock() < expiresAt)))
      return capabilities;
    loading = true;
    capabilities = transport("/api/automaticity/transformer", {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
      redirect: "error",
    })
      .then((response) => {
        if (!response.ok) throw Error("Evaluator discovery unavailable");
        return readBoundedJson(response);
      })
      .then((value) =>
        isRecord(value) &&
        value.enabled === true &&
        Array.isArray(value.approvals)
          ? (value.approvals as RuntimeModelApproval[])
          : [],
      )
      .catch(() => [])
      .then((rows) => {
        // A transient outage must not disable assessment for the whole session.
        expiresAt = clock() + (rows.length ? 60000 : 5000);
        loading = false;
        return rows;
      });
    return capabilities;
  };
  return async (
    attempt: AttemptEvent,
    baseline: AssessmentEvent,
    options: { refreshCapabilities?: boolean } = {},
  ): Promise<AssessmentEvent | null> => {
    if (
      attempt.task.modality !== "writing" ||
      attempt.task.stage === "notice" ||
      baseline.verdict !== "not_assessed" ||
      baseline.evaluator.kind === "human" ||
      baseline.attemptId !== attempt.id ||
      baseline.responseSha256 !== attempt.response.sha256
    )
      return null;
    try {
      const approval = (await load(options.refreshCapabilities === true)).find(
        (row) =>
          isRecord(row) &&
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
      if (!response.ok) return null;
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
