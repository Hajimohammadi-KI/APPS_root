import { normalizeApiOrigin } from "./api-origin";

export const CONFIGURED_API_URL = normalizeApiOrigin(
  process.env.NEXT_PUBLIC_API_URL,
);
export const API_BASE_URL = CONFIGURED_API_URL || "/api/v1";

export const API_HEALTH_URL = `${API_BASE_URL}/health`;
