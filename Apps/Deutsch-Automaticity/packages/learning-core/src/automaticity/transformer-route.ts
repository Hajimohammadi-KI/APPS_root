import { isRecord, parseAutomaticityEvent, type Language } from "./contracts";
import { activePracticeTasks, type CurriculumPack } from "./curriculum";
import {
  assessWithQualifiedTransformer,
  readBoundedJson,
  transformerConfigurationSha256,
  type RuntimeModelApproval,
  type TransformerConfig,
} from "./transformer";
export interface TransformerRelease {
  schemaVersion: 1;
  kind: "qualified-local-transformer-release";
  config: TransformerConfig;
  configurationSha256: string;
  approvals: RuntimeModelApproval[];
  review: {
    reviewerId: string;
    reviewedAt: string;
    evidenceSha256: string;
    qualificationSha256: string;
  };
}
/** Next's standalone server can reconstruct a 127.0.0.1 request as localhost.
 * Honour the actual Host only for equivalent loopback bindings and the same port.
 * Forwarded hosts and arbitrary external hosts cannot widen this boundary.
 */
function matchesRequestOrigin(request: Request, origin: string): boolean {
  try {
    const internal = new URL(request.url);
    const host = request.headers.get("host") ?? internal.host;
    const supplied = new URL(origin);
    if (origin !== supplied.origin || supplied.host !== host) return false;
    if (origin === internal.origin) return true;
    const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
    return (
      internal.protocol === "http:" &&
      supplied.protocol === "http:" &&
      loopback.has(internal.hostname) &&
      loopback.has(supplied.hostname) &&
      internal.port === supplied.port
    );
  } catch {
    return false;
  }
}
export async function validateTransformerRelease(
  value: unknown,
): Promise<TransformerRelease> {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.kind !== "qualified-local-transformer-release" ||
    !isRecord(value.config) ||
    !Array.isArray(value.approvals) ||
    !value.approvals.length ||
    !isRecord(value.review) ||
    typeof value.review.reviewerId !== "string" ||
    !value.review.reviewerId.trim() ||
    typeof value.review.reviewedAt !== "string" ||
    !Number.isFinite(Date.parse(value.review.reviewedAt)) ||
    Date.parse(value.review.reviewedAt) > Date.now() ||
    !/^([a-f0-9]{64})$/.test(String(value.review.evidenceSha256)) ||
    !/^([a-f0-9]{64})$/.test(String(value.review.qualificationSha256))
  )
    throw Error("Invalid reviewed Transformer release");
  const release = value as unknown as TransformerRelease,
    hash = await transformerConfigurationSha256(release.config);
  if (
    release.configurationSha256 !== hash ||
    release.approvals.some(
      (approval) =>
        !approval.approved ||
        approval.configurationSha256 !== hash ||
        approval.evaluatorId !== release.config.candidateId ||
        approval.evaluatorVersion !== release.config.version ||
        !Array.isArray(approval.scopes) ||
        !approval.scopes.length ||
        approval.scopes.some((scope) => scope.modality !== "writing"),
    )
  )
    throw Error("Release configuration or approved scope mismatch");
  return release;
}
export function createTransformerRoute(options: {
  language: Language;
  loadRelease: () => Promise<TransformerRelease | null>;
  loadPack: () => Promise<CurriculumPack>;
  transport?: typeof fetch;
}) {
  let busy = false;
  let windowStarted = 0;
  let requests = 0;
  return async (request: Request): Promise<Response> => {
    const headers = { "Cache-Control": "no-store" },
      origin = request.headers.get("origin");
    if (
      (origin && !matchesRequestOrigin(request, origin)) ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      return Response.json({ available: false }, { status: 403, headers });
    if (!["GET", "POST"].includes(request.method))
      return new Response(null, { status: 405, headers });
    let release: TransformerRelease | null = null;
    try {
      const loaded = await options.loadRelease();
      if (loaded) release = await validateTransformerRelease(loaded);
    } catch {
      return Response.json(
        { enabled: false, assessment: null, reason: "release_unavailable" },
        { headers },
      );
    }
    const approvals =
      release?.approvals.filter((row) => row.language === options.language) ??
      [];
    if (request.method === "GET")
      return Response.json(
        { enabled: approvals.length > 0, approvals },
        { headers },
      );
    if (!release || !approvals.length)
      return Response.json(
        { assessment: null, reason: "no_qualified_scope" },
        { headers },
      );
    if (busy)
      return Response.json(
        { assessment: null, reason: "provider_busy" },
        { status: 429, headers },
      );
    if (Date.now() - windowStarted > 60000) {
      windowStarted = Date.now();
      requests = 0;
    }
    if (requests >= 12)
      return Response.json(
        { assessment: null, reason: "request_budget" },
        { status: 429, headers },
      );
    busy = true;
    try {
      const body = await readBoundedJson(new Response(request.body), 24000);
      if (!isRecord(body)) throw Error("Invalid request");
      const attempt = parseAutomaticityEvent(body.attempt, options.language);
      if (attempt.type !== "attempt" || attempt.task.modality !== "writing")
        throw Error("Unsupported attempt");
      const pack = await options.loadPack();
      if (pack.language !== options.language)
        throw Error("Wrong curriculum language");
      const task = pack.units
        .flatMap(activePracticeTasks)
        .find((task) => task.id === attempt.task.id);
      const approval = approvals.find((row) =>
        row.scopes.some(
          (scope) =>
            scope.constructionId === attempt.task.constructionId &&
            scope.taskVersion === attempt.task.version &&
            scope.rubricVersion === attempt.task.rubricVersion &&
            scope.modality === attempt.task.modality,
        ),
      );
      if (!task || !approval)
        return Response.json(
          { assessment: null, reason: "unsupported_task" },
          { headers },
        );
      requests++;
      const assessment = await assessWithQualifiedTransformer(
        attempt,
        task,
        release.config,
        approval,
        options.transport,
      );
      return Response.json({ assessment }, { headers });
    } catch {
      return Response.json(
        { assessment: null, reason: "unavailable_or_invalid_assessment" },
        { headers },
      );
    } finally {
      busy = false;
    }
  };
}
