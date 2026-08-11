import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Die lokale Datenbankbindung `DB` ist nicht verfügbar. Starte die App über STARTEN-WINDOWS.bat im Installationsordner."
    );
  }

  return drizzle(env.DB, { schema });
}
