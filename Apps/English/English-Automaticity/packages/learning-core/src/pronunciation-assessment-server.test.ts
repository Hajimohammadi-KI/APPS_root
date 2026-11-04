import { expect, test } from "bun:test";
import {
  createPronunciationRateLimiter,
  handlePronunciationAssessment,
  pronunciationCapability,
} from "./pronunciation-assessment-server";

const config = { key: "test-only-key", region: "westeurope" };
function wav() {
  const bytes = new Uint8Array(32044),
    view = new DataView(bytes.buffer);
  for (const [at, word] of [
    [0, "RIFF"],
    [8, "WAVE"],
    [12, "fmt "],
    [36, "data"],
  ] as const)
    [...word].forEach((c, i) => (bytes[at + i] = c.charCodeAt(0)));
  view.setUint32(4, bytes.length - 8, true);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(40, 32000, true);
  view.setInt16(44, 1000, true);
  return bytes;
}
function request(
  changes: Record<string, string | Blob | undefined> = {},
  origin: string | null = "https://app.example",
) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    audio: new Blob([wav()], { type: "audio/wav" }),
    referenceText: "Hello",
    variant: "en-US",
    consent: "true",
    ...changes,
  }))
    if (value !== undefined) {
      if (value instanceof Blob)
        form.append(
          key,
          value,
          value.type === "text/plain" ? "recording.txt" : "recording.wav",
        );
      else form.append(key, value);
    }
  return new Request("https://app.example/api/conversation/pronunciation", {
    method: "POST",
    headers: origin === null ? {} : { origin },
    body: form,
  });
}
function provider() {
  return {
    RecognitionStatus: "Success",
    NBest: [
      {
        Display: "Hello",
        PronunciationAssessment: { AccuracyScore: 90 },
        Words: [
          {
            Word: "hello",
            Offset: 0,
            Duration: 10_000_000,
            PronunciationAssessment: { AccuracyScore: 90 },
            Phonemes: [
              {
                Phoneme: "ɛ",
                Offset: 0,
                Duration: 1_000_000,
                PronunciationAssessment: {
                  AccuracyScore: 50,
                  NBestPhonemes: [{ Phoneme: "ɑ", Score: 90 }],
                },
              },
            ],
          },
        ],
      },
    ],
  };
}
function dependencies(fetcher: typeof fetch) {
  return { fetcher, limiter: createPronunciationRateLimiter() };
}
const unused = (async () => {
  throw new Error("must not contact provider");
}) as typeof fetch;

test("capability requires valid server-only configuration and leaks no key", () => {
  expect(pronunciationCapability({}).available).toBe(false);
  expect(pronunciationCapability(config)).toEqual({
    available: true,
    provider: "Microsoft Azure Speech",
    maxSeconds: 30,
    supportedVariants: ["en-US", "en-GB"],
  });
  expect(
    pronunciationCapability({ ...config, region: "evil.example/path" })
      .available,
  ).toBe(false);
  expect(JSON.stringify(pronunciationCapability(config))).not.toContain(
    config.key,
  );
});
test("actual WAV goes to fixed acoustic endpoint; browser text is not substituted", async () => {
  let sent = false;
  const response = await handlePronunciationAssessment(
    request(),
    config,
    dependencies((async (url, init) => {
      sent = true;
      expect(String(url)).toBe(
        "https://westeurope.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed",
      );
      expect(init?.redirect).toBe("error");
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      expect(
        new Uint8Array(await new Response(init?.body).arrayBuffer()),
      ).toEqual(wav());
      const headers = new Headers(init?.headers);
      const options = JSON.parse(
        Buffer.from(
          headers.get("pronunciation-assessment")!,
          "base64",
        ).toString("utf8"),
      );
      expect(options).toMatchObject({
        ReferenceText: "Hello",
        Granularity: "Phoneme",
        PhonemeAlphabet: "IPA",
        NBestPhonemeCount: 3,
        EnableMiscue: true,
      });
      return Response.json(provider());
    }) as typeof fetch),
  );
  expect(sent).toBe(true);
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const body = await response.json();
  expect(body.words[0].phonemes[0].heard).toBe("ɑ");
  expect(body.pronunciationScore).toBeNull();
  expect(body.verified).toBe(false);
});
test("British variant is never silently changed and requests no unsupported phone names", async () => {
  const response = await handlePronunciationAssessment(
    request({ variant: "en-GB" }),
    config,
    dependencies((async (url, init) => {
      expect(String(url)).toContain("language=en-GB");
      const options = JSON.parse(
        Buffer.from(
          new Headers(init?.headers).get("pronunciation-assessment")!,
          "base64",
        ).toString("utf8"),
      );
      expect(options.NBestPhonemeCount).toBeUndefined();
      expect(options.PhonemeAlphabet).toBeUndefined();
      return Response.json(provider());
    }) as typeof fetch),
  );
  const body = await response.json();
  expect(body.variant).toBe("en-GB");
  expect(body.spokenPhonemesAvailable).toBe(false);
});
test("unavailable provider, absent consent and cross-origin requests never upload", async () => {
  expect(
    (await handlePronunciationAssessment(request(), {}, dependencies(unused)))
      .status,
  ).toBe(503);
  expect(
    (
      await handlePronunciationAssessment(
        request({ consent: "false" }),
        config,
        dependencies(unused),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await handlePronunciationAssessment(
        request({}, "https://evil.example"),
        config,
        dependencies(unused),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await handlePronunciationAssessment(
        request({}, null),
        config,
        dependencies(unused),
      )
    ).status,
  ).toBe(403);
});
test("reject malformed, unexpected and unbounded form inputs before upload", async () => {
  for (const changes of [
    { audio: undefined },
    { audio: "not audio" },
    { audio: new Blob(["Hello"], { type: "audio/wav" }) },
    { audio: new Blob(["invalid"], { type: "text/plain" }) },
    { referenceText: "" },
    { referenceText: "x".repeat(501) },
    { variant: "de-DE" },
    { transcript: "Hello" },
  ])
    expect(
      (
        await handlePronunciationAssessment(
          request(changes),
          config,
          dependencies(unused),
        )
      ).status,
      JSON.stringify(changes),
    ).toBe(400);
  const tooBig = request({
    audio: new Blob([new Uint8Array(1_100_001)], { type: "audio/wav" }),
  });
  expect(
    (await handlePronunciationAssessment(tooBig, config, dependencies(unused)))
      .status,
  ).toBe(413);
});
test("duplicate fields and non-multipart body are rejected", async () => {
  const form = new FormData();
  form.append("consent", "true");
  form.append("consent", "false");
  const duplicate = new Request("https://app.example/api", {
    method: "POST",
    headers: { origin: "https://app.example" },
    body: form,
  });
  expect(
    (
      await handlePronunciationAssessment(
        duplicate,
        config,
        dependencies(unused),
      )
    ).status,
  ).toBe(400);
  const json = new Request("https://app.example/api", {
    method: "POST",
    headers: {
      origin: "https://app.example",
      "content-type": "application/json",
    },
    body: "{}",
  });
  expect(
    (await handlePronunciationAssessment(json, config, dependencies(unused)))
      .status,
  ).toBe(400);
});
test("provider failure, non-acoustic result and oversize response never invent observations", async () => {
  const replies = [
    () => Response.json({ error: config.key }, { status: 401 }),
    () => Response.json({ RecognitionStatus: "NoMatch" }),
    () => new Response("bad json"),
    () => new Response("x".repeat(1_000_001)),
    () => {
      throw new Error(config.key);
    },
  ];
  for (const reply of replies) {
    const response = await handlePronunciationAssessment(
      request(),
      config,
      dependencies((async () => reply()) as typeof fetch),
    );
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain(config.key);
  }
});
test("rate limiter caps clients, total instance and bounded key storage with expiry", () => {
  let now = 0;
  const limiter = createPronunciationRateLimiter({
    now: () => now,
    perClient: 2,
    total: 3,
    maxClients: 2,
  });
  expect(limiter.take("a")).toBe(0);
  expect(limiter.take("a")).toBe(0);
  expect(limiter.take("a")).toBeGreaterThan(0);
  expect(limiter.take("b")).toBe(0);
  expect(limiter.take("c")).toBeGreaterThan(0);
  now = 60_000;
  expect(limiter.take("c")).toBe(0);
});
test("HTTP rate rejection includes retry-after and avoids external request", async () => {
  const limiter = createPronunciationRateLimiter({ perClient: 0 });
  const response = await handlePronunciationAssessment(request(), config, {
    fetcher: unused,
    limiter,
  });
  expect(response.status).toBe(429);
  expect(response.headers.get("retry-after")).toBeTruthy();
});

test("streamed oversized provider body is cancelled and never rendered", async () => {
  let cancelled = false;
  const response = await handlePronunciationAssessment(
    request(),
    config,
    dependencies(
      (async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(new Uint8Array(1_000_001));
            },
            cancel() {
              cancelled = true;
              throw new Error("untrusted cancellation text");
            },
          }),
        )) as typeof fetch,
    ),
  );
  expect(response.status).toBe(502);
  expect(cancelled).toBe(true);
  expect(await response.text()).not.toContain("untrusted");
});

test("wrong method, forged length and missing multipart body fail closed", async () => {
  const get = new Request("https://app.example/api", {
    headers: { origin: "https://app.example" },
  });
  expect(
    (await handlePronunciationAssessment(get, config, dependencies(unused)))
      .status,
  ).toBe(405);
  const huge = request();
  huge.headers.set("content-length", "1100001");
  expect(
    (await handlePronunciationAssessment(huge, config, dependencies(unused)))
      .status,
  ).toBe(413);
  const invalid = request();
  invalid.headers.set("content-length", "-1");
  expect(
    (await handlePronunciationAssessment(invalid, config, dependencies(unused)))
      .status,
  ).toBe(413);
  const empty = new Request("https://app.example/api", {
    method: "POST",
    headers: {
      origin: "https://app.example",
      "content-type": "multipart/form-data; boundary=test",
    },
  });
  expect(
    (await handlePronunciationAssessment(empty, config, dependencies(unused)))
      .status,
  ).toBe(400);
});

test("instance limit cannot be evaded by concurrent different client keys", async () => {
  const limiter = createPronunciationRateLimiter({ total: 1 });
  const first = request(),
    second = request();
  first.headers.set("x-forwarded-for", "192.0.2.1");
  second.headers.set("x-forwarded-for", "192.0.2.2");
  let uploads = 0;
  const fetcher = (async () => {
    uploads++;
    return Response.json(provider());
  }) as typeof fetch;
  const results = await Promise.all([
    handlePronunciationAssessment(first, config, { fetcher, limiter }),
    handlePronunciationAssessment(second, config, { fetcher, limiter }),
  ]);
  expect(results.map((r) => r.status).sort()).toEqual([200, 429]);
  expect(uploads).toBe(1);
});
