import { Injectable } from "@nestjs/common";
import type { CapabilityResponse } from "@cross-repo/contracts";

@Injectable()
export class IntegrationsService {
  capabilities(): CapabilityResponse {
    return {
      apiVersion: "v1",
      database: process.env.DATABASE_URL ? "neon" : "not-configured",
      storage: process.env.OBJECT_STORAGE_URL ? "object-storage" : "not-configured",
      providers: {
        openai: Boolean(process.env.OPENAI_API_KEY),
        deepl: Boolean(process.env.DEEPL_API_KEY),
        google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
      compatibility: {
        legacyNextApi: true,
        legacyContentPreserved: true,
      },
    };
  }
}
