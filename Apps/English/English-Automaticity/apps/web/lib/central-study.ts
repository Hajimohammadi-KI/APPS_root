/**
 * Server-side access to the central Study Tracker (AI explanations, DeepL).
 *
 * The central service identifies its caller through the
 * `oai-authenticated-user-*` headers. Those values must come from this
 * server's own configuration only. Headers sent by the browser are never
 * read, so a request cannot impersonate another learner (roadmap R89).
 */
const DEFAULT_CENTRAL_STUDY_APP_URL = "http://127.0.0.1:4312";

export const CENTRAL_IDENTITY_HEADERS = {
  id: "oai-authenticated-user-id",
  email: "oai-authenticated-user-email",
} as const;

function cleanEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

export function centralStudyAppUrl() {
  return cleanEnv("CENTRAL_STUDY_APP_URL") || DEFAULT_CENTRAL_STUDY_APP_URL;
}

export function centralHeaders(json = false) {
  const headers = new Headers(
    json ? { "Content-Type": "application/json" } : undefined,
  );
  const id = cleanEnv("CENTRAL_STUDY_USER_ID");
  const email = cleanEnv("CENTRAL_STUDY_USER_EMAIL");
  if (id) headers.set(CENTRAL_IDENTITY_HEADERS.id, id);
  if (email) headers.set(CENTRAL_IDENTITY_HEADERS.email, email);
  return headers;
}
