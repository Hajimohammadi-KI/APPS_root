import http from "node:http";

export function matchesExpectedHealth(payload, expected = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  return Object.entries(expected).every(([key, value]) => payload[key] === value);
}

export function probeHttpHealth(health, timeoutMs = 1_200) {
  if (!health?.url) return Promise.resolve({ ready: true, statusCode: null, error: null });
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const request = http.get(health.url, { headers: { Accept: "application/json" } }, (response) => {
      const chunks = [];
      let size = 0;
      response.on("data", (chunk) => {
        size += chunk.length;
        if (size <= 128 * 1024) chunks.push(chunk);
      });
      response.on("end", () => {
        if (size > 128 * 1024) {
          finish({ ready: false, statusCode: response.statusCode ?? null, error: "Health response was too large." });
          return;
        }
        try {
          const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          const ready =
            response.statusCode === 200 &&
            matchesExpectedHealth(payload, health.expected);
          finish({
            ready,
            statusCode: response.statusCode ?? null,
            payload: ready ? payload : undefined,
            error: ready ? null : "Health response did not match the expected service contract.",
          });
        } catch {
          finish({
            ready: false,
            statusCode: response.statusCode ?? null,
            error: "Health response was not valid JSON.",
          });
        }
      });
    });
    request.setTimeout(timeoutMs, () => request.destroy(new Error("Health request timed out.")));
    request.on("error", (error) => finish({ ready: false, statusCode: null, error: error.message }));
  });
}
