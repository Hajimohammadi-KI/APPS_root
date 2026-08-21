export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "/api/local/api/v1"
).replace(/\/$/, "");

export const API_HEALTH_URL = `${API_BASE_URL}/health`;
