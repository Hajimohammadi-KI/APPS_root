export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4210/api/v1"
).replace(/\/$/, "");

export const API_HEALTH_URL = `${API_BASE_URL}/health`;
