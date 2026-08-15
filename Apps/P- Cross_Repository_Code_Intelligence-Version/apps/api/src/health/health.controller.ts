import { Controller, Get } from "@nestjs/common";
import type { HealthResponse } from "@cross-repo/contracts";
import { DatabaseService } from "../database/database.service.js";

@Controller("health")
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  async health(): Promise<HealthResponse> {
    return {
      ok: true,
      service: "cross-repository-api",
      runtime: "bun",
      timestamp: new Date().toISOString(),
      database: await this.database.status(),
    };
  }
}
