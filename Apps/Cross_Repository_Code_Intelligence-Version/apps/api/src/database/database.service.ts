import { Injectable } from "@nestjs/common";
import { neon } from "@neondatabase/serverless";
import type { HealthResponse } from "@cross-repo/contracts";

type DatabaseStatus = HealthResponse["database"];

@Injectable()
export class DatabaseService {
  async status(): Promise<DatabaseStatus> {
    const connectionString = process.env.DATABASE_URL?.trim();
    if (!connectionString) {
      return {
        provider: "local-d1",
        configured: false,
        reachable: true,
        message: "Lokaler D1-Kompatibilitätsspeicher ist aktiv; Neon ist optional.",
      };
    }

    try {
      const sql = neon(connectionString);
      await sql`select 1 as ok`;
      return { provider: "neon", configured: true, reachable: true };
    } catch {
      return {
        provider: "neon",
        configured: true,
        reachable: false,
        message: "Neon ist konfiguriert, antwortet aber derzeit nicht.",
      };
    }
  }
}
