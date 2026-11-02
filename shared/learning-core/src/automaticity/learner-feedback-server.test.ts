import { expect, test } from "bun:test";
import { createGrammarRateLimiter } from "./grammar-feedback-route";
import { LEARNER_FEEDBACK_POLICY } from "./learner-feedback";
import {
  createLearnerFeedbackGuard,
  handleLearnerFeedback,
  handleLearnerFeedbackReview,
  learnerFeedbackConfig,
  readDecidedLearnerFeedback,
} from "./learner-feedback-server";

type Issue = {
  number: number;
  node_id: string;
  title: string;
  body: string;
  state: "open" | "closed";
  labels: { name: string }[];
  created_at: string;
};
/** In-memory GitHub REST/GraphQL fake covering the calls the handler makes. */
function fakeGitHub({ canDelete = false } = {}) {
  const issues: Issue[] = [];
  const comments = new Map<number, { id: number; body: string }[]>();
  const calls: {
    method: string;
    path: string;
    auth: string | null;
    body: unknown;
  }[] = [];
  let commentId = 100;
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({
      method,
      path: url.pathname + url.search,
      auth: new Headers(init?.headers).get("authorization"),
      body,
    });
    const json = (value: unknown, status = 200) =>
      Response.json(value, { status });
    const path = url.pathname.replace("/repos/owner/feedback", "");
    if (url.pathname === "/graphql")
      return canDelete
        ? json({ data: { deleteIssue: { clientMutationId: null } } })
        : json({ errors: [{ message: "Must have admin rights" }] });
    if (method === "POST" && path === "/labels") return json({}, 201);
    if (method === "POST" && path === "/issues") {
      const issue: Issue = {
        number: issues.length + 1,
        node_id: `I_${issues.length + 1}`,
        title: body.title,
        body: body.body,
        state: "open",
        labels: body.labels.map((name: string) => ({ name })),
        created_at: "2026-11-01T10:00:00Z",
      };
      issues.push(issue);
      return json(issue, 201);
    }
    if (method === "GET" && path === "/issues")
      return json(
        url.searchParams.get("page") === "1"
          ? issues.filter(
              (i) =>
                i.state === url.searchParams.get("state") ||
                url.searchParams.get("state") === "all",
            )
          : [],
      );
    const match = path.match(/^\/issues\/(\d+)(\/comments|\/labels)?$/);
    const comment = path.match(/^\/issues\/comments\/(\d+)$/);
    if (comment && method === "DELETE") {
      for (const list of comments.values()) {
        const at = list.findIndex((c) => c.id === Number(comment[1]));
        if (at >= 0) list.splice(at, 1);
      }
      return new Response(null, { status: 204 });
    }
    const issue = match && issues.find((i) => i.number === Number(match[1]));
    if (!issue) return json({ message: "Not Found" }, 404);
    if (match[2] === "/comments") {
      const list = comments.get(issue.number) ?? [];
      if (method === "POST") {
        list.push({ id: commentId++, body: body.body });
        comments.set(issue.number, list);
        return json({}, 201);
      }
      return json(list);
    }
    if (match[2] === "/labels") {
      for (const name of body.labels)
        if (!issue.labels.some((l) => l.name === name))
          issue.labels.push({ name });
      return json(issue.labels);
    }
    if (method === "PATCH") {
      Object.assign(issue, {
        ...body,
        labels: body.labels
          ? body.labels.map((name: string) => ({ name }))
          : issue.labels,
      });
      return json(issue);
    }
    return json(issue);
  }) as typeof fetch;
  return { fetcher, issues, comments, calls };
}

const config = learnerFeedbackConfig({
  LEARNER_FEEDBACK_GITHUB_TOKEN: "github_pat_secret",
  LEARNER_FEEDBACK_GITHUB_REPO: "owner/feedback",
  LEARNER_FEEDBACK_REVIEW_KEY: "review-key-with-enough-length-123",
})!;
const feedback = {
  kind: "automaticity.learner-feedback",
  version: 1,
  language: "de",
  contentVersion: "2026-11-01.1",
  release: "2026.11.01.1",
  task: {
    id: "de.c.014.repair.content-20261101.writing",
    version: "2026-11-01.1",
    constructionId: "de.c.014",
    prompt:
      "Korrigiere den Artikel nach auf und schreibe den ganzen Satz: Das Buch liegt auf den Tisch.",
    acceptedAnswers: ["Das Buch liegt auf dem Tisch."],
  },
  response: "Das Buch liegt jetzt auf dem Tisch.",
  check: {
    verdict: "not_assessed",
    evaluator: "controlled-answer 1.0.0",
    feedback: "Unterscheidet sich.",
  },
  category: "answer_correct",
  comment: "",
  consent: { policy: LEARNER_FEEDBACK_POLICY, at: "2026-11-01T10:00:00.000Z" },
};
const send = (
  handler: typeof handleLearnerFeedback,
  github: ReturnType<typeof fakeGitHub>,
  body: unknown,
  ip = "1.2.3.4",
) =>
  handler(
    new Request("https://app.example/api/learner-feedback", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify(body),
    }),
    config,
    {
      fetcher: github.fetcher,
      limiter: createGrammarRateLimiter({ limit: 5 }),
      guard: createLearnerFeedbackGuard(),
    },
  );

test("without a token and repository nothing is sent anywhere", async () => {
  expect(learnerFeedbackConfig({})).toBeNull();
  expect(
    learnerFeedbackConfig({
      LEARNER_FEEDBACK_GITHUB_TOKEN: "x",
      LEARNER_FEEDBACK_GITHUB_REPO: "not a repo",
    }),
  ).toBeNull();
  const github = fakeGitHub();
  const available = await handleLearnerFeedback(
    new Request("https://app.example/api/learner-feedback"),
    null,
    { fetcher: github.fetcher },
  );
  expect(await available.json()).toEqual({ available: false });
  const posted = await handleLearnerFeedback(
    new Request("https://app.example/api/learner-feedback", {
      method: "POST",
      body: JSON.stringify(feedback),
    }),
    null,
    { fetcher: github.fetcher },
  );
  expect(posted.status).toBe(503);
  expect(github.calls).toEqual([]);
});

test("a consented comment becomes one private issue; the receipt secret stays with the learner", async () => {
  const github = fakeGitHub();
  const response = await send(handleLearnerFeedback, github, feedback);
  expect(response.status).toBe(201);
  const { receipt } = (await response.json()) as {
    receipt: { id: number; token: string };
  };
  expect(receipt.id).toBe(1);
  expect(receipt.token.length).toBeGreaterThanOrEqual(40);
  const issue = github.issues[0]!;
  expect(issue.body).not.toContain(receipt.token);
  expect(issue.body).not.toContain("Das Buch liegt jetzt auf dem Tisch.");
  expect(github.comments.get(1)?.[0]?.body).toContain(
    "Das Buch liegt jetzt auf dem Tisch.",
  );
  expect(issue.labels.map((l) => l.name)).toEqual([
    "learner-feedback",
    "app:de",
    "category:answer_correct",
  ]);
  expect(
    github.calls.every((call) => call.auth === "Bearer github_pat_secret"),
  ).toBe(true);
  const refused = await send(handleLearnerFeedback, github, {
    ...feedback,
    consent: undefined,
  });
  expect(refused.status).toBe(400);
  expect(github.issues).toHaveLength(1);
});

test("sending is rate limited per client", async () => {
  const github = fakeGitHub();
  const limiter = createGrammarRateLimiter({ limit: 2 });
  const guard = createLearnerFeedbackGuard();
  let n = 0;
  const post = () =>
    handleLearnerFeedback(
      new Request("https://app.example/api/learner-feedback", {
        method: "POST",
        headers: { "x-forwarded-for": "9.9.9.9" },
        body: JSON.stringify({ ...feedback, comment: `Kommentar ${++n}` }),
      }),
      config,
      { fetcher: github.fetcher, limiter, guard },
    );
  expect((await post()).status).toBe(201);
  expect((await post()).status).toBe(201);
  expect((await post()).status).toBe(429);
  expect(github.issues).toHaveLength(2);
});

test("comments from other sites, repeats and floods are refused before GitHub", async () => {
  const github = fakeGitHub();
  const guard = createLearnerFeedbackGuard({ cap: 2 });
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    handleLearnerFeedback(
      new Request("https://app.example/api/learner-feedback", {
        method: "POST",
        headers: { "x-forwarded-for": `5.5.5.${Math.random()}`, ...headers },
        body: JSON.stringify(body),
      }),
      config,
      { fetcher: github.fetcher, guard },
    );
  expect(
    (await post(feedback, { origin: "https://evil.example" })).status,
  ).toBe(403);
  expect(
    (await post(feedback, { "sec-fetch-site": "cross-site" })).status,
  ).toBe(403);
  expect(github.calls).toEqual([]);
  expect((await post(feedback, { origin: "https://app.example" })).status).toBe(
    201,
  );
  expect((await post(feedback)).status).toBe(409);
  expect((await post({ ...feedback, comment: "zweiter" })).status).toBe(201);
  expect((await post({ ...feedback, comment: "dritter" })).status).toBe(429);
  expect(github.issues).toHaveLength(2);
});

test("status and the owner's reply need the receipt; withdrawal removes the text", async () => {
  const github = fakeGitHub();
  const { receipt } = (await (
    await send(handleLearnerFeedback, github, feedback)
  ).json()) as {
    receipt: { id: number; token: string };
  };
  const ask = (token: string, method = "GET") =>
    handleLearnerFeedback(
      new Request(
        `https://app.example/api/learner-feedback?id=${receipt.id}&token=${token}`,
        { method },
      ),
      config,
      { fetcher: github.fetcher },
    );
  expect(await (await ask(receipt.token)).json()).toEqual({
    state: "received",
    reply: "",
  });
  expect((await ask("wrong-token-wrong-token-wrong-token-1234")).status).toBe(
    404,
  );

  const review = (body?: unknown, key = "review-key-with-enough-length-123") =>
    handleLearnerFeedbackReview(
      new Request("https://app.example/api/learner-feedback/review", {
        method: body ? "POST" : "GET",
        headers: { "x-review-key": key },
        body: body ? JSON.stringify(body) : null,
      }),
      config,
      { fetcher: github.fetcher },
    );
  expect((await review(undefined, "guess")).status).toBe(401);
  const listed = (await (await review()).json()) as {
    items: { number: number; feedback: unknown }[];
  };
  expect(listed.items).toHaveLength(1);
  expect(JSON.stringify(listed.items)).not.toContain("receipt");
  expect(
    (await review({ issue: 1, decision: "known_wrong", explanation: " " }))
      .status,
  ).toBe(400);
  expect(
    (
      await review({
        issue: 1,
        decision: "accept_answer",
        reply: "Danke, das ist richtig.",
      })
    ).status,
  ).toBe(200);
  expect(github.issues[0]!.state).toBe("closed");
  expect(github.issues[0]!.labels.map((l) => l.name)).toContain(
    "decision:accept_answer",
  );
  expect(await (await ask(receipt.token)).json()).toEqual({
    state: "answer_accepted",
    reply: "Danke, das ist richtig.",
  });
  const decided = await readDecidedLearnerFeedback(config, github.fetcher);
  expect(decided).toEqual([
    expect.objectContaining({
      issue: 1,
      decision: expect.objectContaining({
        decision: "accept_answer",
        answer: "Das Buch liegt jetzt auf dem Tisch.",
      }),
    }),
  ]);

  const bodyBefore = github.issues[0]!.body;
  const withdrawn = await ask(receipt.token, "DELETE");
  expect(await withdrawn.json()).toEqual({ state: "withdrawn" });
  // Deleted comments leave no edit history; the body never held the text.
  expect(github.comments.get(1)).toEqual([]);
  expect(github.issues[0]!.body).toBe(bodyBefore);
  expect(
    github.calls.some(
      (call) =>
        call.method === "PATCH" && (call.body as { body?: string })?.body,
    ),
  ).toBe(false);
  expect(JSON.stringify(github.issues)).not.toContain("jetzt auf dem Tisch");
  expect(await (await ask(receipt.token)).json()).toEqual({
    state: "withdrawn",
    reply: "",
  });
});

test("the review endpoint stays closed without its own key", async () => {
  const github = fakeGitHub();
  const response = await handleLearnerFeedbackReview(
    new Request("https://app.example/api/learner-feedback/review", {
      headers: { "x-review-key": "anything" },
    }),
    { ...config, reviewKey: null },
    { fetcher: github.fetcher },
  );
  expect(response.status).toBe(503);
  expect(github.calls).toEqual([]);
});
test("R100: three open reports that an exercise is wrong pause it; nothing else does", async () => {
  const github = fakeGitHub();
  const wrong = { ...feedback, category: "exercise_wrong" };
  const paused = async () =>
    (await (
      await handleLearnerFeedback(
        new Request("https://app.example/api/learner-feedback?paused=de"),
        config,
        {
          fetcher: github.fetcher,
          limiter: createGrammarRateLimiter({ limit: 50 }),
        },
      )
    ).json()) as { paused: string[] };
  // Different learners send different answers; identical repeats are refused.
  for (const [index, response] of ["Eins.", "Zwei."].entries())
    expect(
      (
        await send(
          handleLearnerFeedback,
          github,
          { ...wrong, response },
          `1.2.3.${index}`,
        )
      ).status,
    ).toBe(201);
  await send(
    handleLearnerFeedback,
    github,
    { ...feedback, response: "Drei." },
    "1.2.3.7",
  );
  expect((await paused()).paused).toEqual([]);
  expect(
    (
      await send(
        handleLearnerFeedback,
        github,
        { ...wrong, response: "Vier." },
        "1.2.3.8",
      )
    ).status,
  ).toBe(201);
  expect((await paused()).paused).toEqual([feedback.task.id]);
  // The owner's decision or a withdrawal ends the pause.
  github.issues[0]!.labels.push({ name: "decision:no_change" });
  github.issues[0]!.state = "closed";
  expect((await paused()).paused).toEqual([]);
  // Without the service nothing is paused and GitHub is never asked.
  const response = await handleLearnerFeedback(
    new Request("https://app.example/api/learner-feedback?paused=en"),
    null,
  );
  expect(await response.json()).toEqual({ paused: [] });
});
