import { sha256 } from "./backup";
import { isRecord } from "./contracts";
import {
  createGrammarRateLimiter,
  type GrammarRateLimiter,
} from "./grammar-feedback-route";
import {
  LEARNER_FEEDBACK_DECISIONS,
  learnerFeedbackDecisionComment,
  learnerFeedbackIssue,
  learnerFeedbackState,
  parseLearnerFeedback,
  parseLearnerFeedbackData,
  parseLearnerFeedbackDecision,
  parseLearnerFeedbackIssue,
  pausedExercises,
  type LearnerFeedback,
  type LearnerFeedbackDecision,
  type LearnerFeedbackDecisionKind,
} from "./learner-feedback";

/** Learner comments are stored as issues in one private GitHub repository.
 * Without a token and repository the endpoints report "unavailable" and make
 * no network request. The review endpoint additionally needs its own key. */
export interface LearnerFeedbackConfig {
  readonly token: string;
  readonly repo: string;
  readonly reviewKey: string | null;
}
export function learnerFeedbackConfig(
  env: Record<string, string | undefined>,
): LearnerFeedbackConfig | null {
  const token = env.LEARNER_FEEDBACK_GITHUB_TOKEN?.trim();
  const repo = env.LEARNER_FEEDBACK_GITHUB_REPO?.trim();
  if (!token || !repo || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repo))
    return null;
  const reviewKey = env.LEARNER_FEEDBACK_REVIEW_KEY?.trim() ?? "";
  return { token, repo, reviewKey: reviewKey.length >= 24 ? reviewKey : null };
}

/** Repeats and floods across all clients. Serverless instances keep their own
 * memory, so this bounds abuse per instance; platform bot protection is the
 * stronger layer. */
export interface LearnerFeedbackGuard {
  /** null when allowed, otherwise the refusal status. */
  admit(fingerprint: string): 409 | 429 | null;
}
export function createLearnerFeedbackGuard({
  cap = 60,
  windowMs = 3_600_000,
  now = Date.now,
}: {
  cap?: number;
  windowMs?: number;
  now?: () => number;
} = {}): LearnerFeedbackGuard {
  const seen = new Map<string, number>();
  return {
    admit(fingerprint) {
      const at = now();
      for (const [key, time] of seen)
        if (at - time >= windowMs) seen.delete(key);
      if (seen.has(fingerprint)) return 409;
      if (seen.size >= cap) return 429;
      seen.set(fingerprint, at);
      return null;
    },
  };
}
interface Options {
  readonly fetcher?: typeof fetch;
  readonly limiter?: GrammarRateLimiter;
  readonly guard?: LearnerFeedbackGuard;
}

const headers = { "Cache-Control": "no-store" };
const reply = (body: unknown, status = 200, extra: HeadersInit = {}) =>
  Response.json(body, { status, headers: { ...headers, ...extra } });
const sendLimiter = createGrammarRateLimiter({ limit: 5, windowMs: 600_000 });
const readLimiter = createGrammarRateLimiter({ limit: 30 });
const reviewLimiter = createGrammarRateLimiter({ limit: 30 });
const sendGuard = createLearnerFeedbackGuard();

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "local"
  );
}
function limited(request: Request, limiter: GrammarRateLimiter) {
  const retryAfter = limiter.take(clientKey(request));
  return retryAfter > 0
    ? reply(
        {
          error: `Too many requests. Nothing was sent; try again in ${retryAfter} seconds.`,
        },
        429,
        { "Retry-After": String(retryAfter) },
      )
    : null;
}
/** A browser sending from another site is refused before anything is stored. */
function crossSite(request: Request): boolean {
  const origin = request.headers.get("origin");
  return (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin !== null && origin !== new URL(request.url).origin)
  );
}
/** Equal-length hex digests compared without an early exit. */
function sameDigest(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++)
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
function receiptSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_")
    .replace(/=+$/u, "");
}

interface GitHubIssue {
  number: number;
  node_id: string;
  body: string | null;
  state: "open" | "closed";
  created_at: string;
  html_url?: string;
  labels: ({ name?: string } | string)[];
}
interface GitHubComment {
  id: number;
  body: string | null;
}
class GitHubError extends Error {
  constructor(readonly status: number) {
    super(`GitHub responded ${status}`);
  }
}
function github(config: LearnerFeedbackConfig, fetcher: typeof fetch) {
  return async <T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> => {
    const response = await fetcher(
      path === "/graphql"
        ? "https://api.github.com/graphql"
        : `https://api.github.com/repos/${config.repo}${path}`,
      {
        method,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
          "User-Agent": "language-apps-learner-feedback",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      },
    );
    if (!response.ok) throw new GitHubError(response.status);
    return (response.status === 204 ? null : await response.json()) as T;
  };
}
type GitHub = ReturnType<typeof github>;
const labelNames = (issue: GitHubIssue) =>
  issue.labels
    .map((label) => (typeof label === "string" ? label : (label.name ?? "")))
    .filter(Boolean);
const LABELS = [
  "learner-feedback",
  "app:en",
  "app:de",
  "category:answer_correct",
  "category:feedback_unclear",
  "category:exercise_wrong",
  "category:other",
  "withdrawn",
  ...LEARNER_FEEDBACK_DECISIONS.map((decision) => `decision:${decision}`),
];
const ensured = new Set<string>();
async function ensureLabels(api: GitHub, repo: string) {
  if (ensured.has(repo)) return;
  for (const name of LABELS)
    try {
      await api("POST", "/labels", { name, color: "0e8a16" });
    } catch (error) {
      // 422: the label already exists.
      if (!(error instanceof GitHubError && error.status === 422)) throw error;
    }
  ensured.add(repo);
}

/** The learner's text and the owner's latest decision, both from comments. */
async function contents(api: GitHub, number: number) {
  const comments = await api<GitHubComment[]>(
    "GET",
    `/issues/${number}/comments?per_page=100`,
  );
  let feedback: LearnerFeedback | null = null;
  let decision: LearnerFeedbackDecision | null = null;
  for (const comment of comments) {
    feedback ??= parseLearnerFeedbackData(comment.body ?? "");
    decision = parseLearnerFeedbackDecision(comment.body ?? "") ?? decision;
  }
  return { comments, feedback, decision };
}
/** The issue for a receipt, only when the secret matches its stored digest. */
async function ownIssue(api: GitHub, id: string | null, secret: string | null) {
  if (!id || !/^\d{1,9}$/u.test(id) || !secret || secret.length < 40)
    return null;
  let issue: GitHubIssue;
  try {
    issue = await api<GitHubIssue>("GET", `/issues/${id}`);
  } catch (error) {
    if (error instanceof GitHubError && error.status === 404) return null;
    throw error;
  }
  const header = parseLearnerFeedbackIssue(issue.body ?? "");
  if (!header || !labelNames(issue).includes("learner-feedback")) return null;
  return sameDigest(await sha256(secret), header.receipt)
    ? { issue, header }
    : null;
}

/** GET: availability, or the status of one receipt. POST: send one comment.
 * DELETE: withdraw a comment with its receipt. */
export async function handleLearnerFeedback(
  request: Request,
  config: LearnerFeedbackConfig | null,
  { fetcher = fetch, limiter, guard = sendGuard }: Options = {},
): Promise<Response> {
  const url = new URL(request.url);
  const id = url.searchParams.get("id"),
    secret = url.searchParams.get("token");
  const pausedFor = url.searchParams.get("paused");
  if (request.method === "GET" && (pausedFor === "en" || pausedFor === "de")) {
    if (!config) return reply({ paused: [] });
    const blocked = limited(request, limiter ?? readLimiter);
    if (blocked) return blocked;
    try {
      const api = github(config, fetcher);
      const issues: GitHubIssue[] = [];
      for (let page = 1; page <= 5; page++) {
        const rows = await api<GitHubIssue[]>(
          "GET",
          `/issues?labels=learner-feedback,category:exercise_wrong&state=open&per_page=100&page=${page}`,
        );
        issues.push(...rows);
        if (rows.length < 100) break;
      }
      // Task ids only; the five-minute shared cache limits GitHub calls.
      return reply(
        {
          paused: pausedExercises(
            issues.map((issue) => ({ ...issue, labels: labelNames(issue) })),
            pausedFor,
          ),
        },
        200,
        { "Cache-Control": "public, max-age=300, s-maxage=300" },
      );
    } catch {
      return reply({ paused: [] }, 502);
    }
  }
  if (request.method === "GET" && !id)
    return reply({ available: Boolean(config) });
  if (!config)
    return reply(
      { error: "Sending comments is not switched on yet. Nothing was sent." },
      503,
    );
  if (request.method !== "GET" && crossSite(request))
    return reply({ error: "Comments can only be sent from this app." }, 403);
  const api = github(config, fetcher);
  if (request.method === "POST") {
    const blocked = limited(request, limiter ?? sendLimiter);
    if (blocked) return blocked;
    let feedback: LearnerFeedback;
    try {
      feedback = parseLearnerFeedback(await request.json());
    } catch (error) {
      return reply(
        {
          error: `${error instanceof Error ? error.message : "Invalid comment."} Nothing was sent.`,
        },
        400,
      );
    }
    const refused = guard.admit(
      await sha256(
        JSON.stringify([
          feedback.language,
          feedback.task.id,
          feedback.response,
          feedback.category,
          feedback.comment,
        ]),
      ),
    );
    if (refused === 409)
      return reply({ error: "This comment was already received." }, 409);
    if (refused === 429)
      return reply(
        {
          error:
            "Too many comments right now. Nothing was sent; try again later.",
        },
        429,
        { "Retry-After": "600" },
      );
    let number: number | null = null;
    try {
      await ensureLabels(api, config.repo);
      const token = receiptSecret();
      const { comment, ...issue } = learnerFeedbackIssue(
        feedback,
        await sha256(token),
      );
      number = (await api<GitHubIssue>("POST", "/issues", issue)).number;
      await api("POST", `/issues/${number}/comments`, { body: comment });
      return reply({ receipt: { id: number, token }, state: "received" }, 201);
    } catch {
      // An issue without its text carries nothing personal; close it.
      if (number !== null)
        await api("PATCH", `/issues/${number}`, {
          state: "closed",
          state_reason: "not_planned",
        }).catch(() => undefined);
      return reply(
        {
          error:
            "The comment could not be stored. Nothing was kept; try again later.",
        },
        502,
      );
    }
  }
  const blocked = limited(request, limiter ?? readLimiter);
  if (blocked) return blocked;
  try {
    const own = await ownIssue(api, id, secret);
    if (!own) return reply({ error: "No comment matches this receipt." }, 404);
    const { issue, header } = own;
    const { comments, decision } = await contents(api, issue.number);
    if (request.method === "GET")
      return reply({
        state: learnerFeedbackState(labelNames(issue), issue.state),
        reply: decision?.reply ?? "",
      });
    if (request.method !== "DELETE")
      return reply({ error: "Unsupported method." }, 405);
    const removed = await api<{ errors?: unknown[] }>("POST", "/graphql", {
      query:
        "mutation($id: ID!) { deleteIssue(input: { issueId: $id }) { clientMutationId } }",
      variables: { id: issue.node_id },
    }).catch(() => ({ errors: ["not permitted"] }));
    if (!removed.errors?.length) return reply({ state: "deleted" });
    // Without delete rights: delete every comment (they hold the learner's
    // text and any decision quoting it) and close the text-free issue.
    for (const comment of comments)
      await api("DELETE", `/issues/comments/${comment.id}`);
    await api("PATCH", `/issues/${issue.number}`, {
      state: "closed",
      state_reason: "not_planned",
      labels: ["learner-feedback", `app:${header.language}`, "withdrawn"],
    });
    return reply({ state: "withdrawn" });
  } catch {
    return reply(
      { error: "The comment service is unavailable; try again later." },
      502,
    );
  }
}

async function reviewAllowed(request: Request, config: LearnerFeedbackConfig) {
  const key = request.headers.get("x-review-key") ?? "";
  return (
    config.reviewKey !== null &&
    sameDigest(await sha256(key), await sha256(config.reviewKey))
  );
}
async function feedbackIssues(api: GitHub, state: "open" | "closed") {
  const rows: {
    issue: GitHubIssue;
    feedback: LearnerFeedback;
    decision: LearnerFeedbackDecision | null;
  }[] = [];
  for (let page = 1; page <= 5; page++) {
    const issues = await api<GitHubIssue[]>(
      "GET",
      `/issues?labels=learner-feedback&state=${state}&per_page=100&page=${page}`,
    );
    for (const issue of issues) {
      if (
        !parseLearnerFeedbackIssue(issue.body ?? "") ||
        labelNames(issue).includes("withdrawn")
      )
        continue;
      const { feedback, decision } = await contents(api, issue.number);
      if (feedback) rows.push({ issue, feedback, decision });
    }
    if (issues.length < 100) break;
  }
  return rows;
}

/** GET: open comments for the owner. POST: record the owner's decision. */
export async function handleLearnerFeedbackReview(
  request: Request,
  config: LearnerFeedbackConfig | null,
  { fetcher = fetch, limiter = reviewLimiter }: Options = {},
): Promise<Response> {
  if (!config?.reviewKey)
    return reply({ error: "The review page is not switched on." }, 503);
  const blocked = limited(request, limiter);
  if (blocked) return blocked;
  if (!(await reviewAllowed(request, config)))
    return reply({ error: "The review key is not valid." }, 401);
  const api = github(config, fetcher);
  try {
    if (request.method === "GET")
      return reply({
        items: (await feedbackIssues(api, "open")).map(
          ({ issue, feedback }) => ({
            number: issue.number,
            url: issue.html_url ?? null,
            createdAt: issue.created_at,
            feedback,
          }),
        ),
      });
    if (request.method !== "POST")
      return reply({ error: "Unsupported method." }, 405);
    const body: unknown = await request.json().catch(() => null);
    if (!isRecord(body) || typeof body.issue !== "number")
      return reply({ error: "Choose a comment." }, 400);
    const issue = await api<GitHubIssue>("GET", `/issues/${body.issue}`);
    const { feedback } = await contents(api, issue.number);
    if (
      !parseLearnerFeedbackIssue(issue.body ?? "") ||
      !feedback ||
      issue.state !== "open"
    )
      return reply({ error: "This comment is no longer open." }, 409);
    const kind = body.decision as LearnerFeedbackDecisionKind;
    let comment: string;
    try {
      comment = learnerFeedbackDecisionComment({
        decision: kind,
        answer:
          typeof body.answer === "string" && body.answer.trim()
            ? body.answer
            : feedback.response,
        explanation:
          typeof body.explanation === "string" ? body.explanation : "",
        reply: typeof body.reply === "string" ? body.reply : "",
        decidedAt: new Date().toISOString(),
      });
    } catch (error) {
      return reply(
        { error: error instanceof Error ? error.message : "Invalid decision." },
        400,
      );
    }
    await ensureLabels(api, config.repo);
    await api("POST", `/issues/${issue.number}/comments`, { body: comment });
    await api("POST", `/issues/${issue.number}/labels`, {
      labels: [`decision:${kind}`],
    });
    await api("PATCH", `/issues/${issue.number}`, {
      state: "closed",
      state_reason: kind === "no_change" ? "not_planned" : "completed",
    });
    return reply({
      state: learnerFeedbackState([`decision:${kind}`], "closed"),
    });
  } catch {
    return reply({ error: "GitHub is unavailable; nothing was changed." }, 502);
  }
}

/** Closed comments with an owner decision, for the curriculum import. */
export async function readDecidedLearnerFeedback(
  config: LearnerFeedbackConfig,
  fetcher: typeof fetch = fetch,
) {
  const decided: {
    issue: number;
    feedback: LearnerFeedback;
    decision: LearnerFeedbackDecision;
  }[] = [];
  for (const { issue, feedback, decision } of await feedbackIssues(
    github(config, fetcher),
    "closed",
  ))
    if (decision) decided.push({ issue: issue.number, feedback, decision });
  return decided.sort((a, b) => a.issue - b.issue);
}
