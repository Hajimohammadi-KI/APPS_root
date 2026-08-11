import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const notes = sqliteTable("notes", { id: text("id").primaryKey(), owner: text("owner").notNull(), date: text("date").notNull(), task: text("task").notNull(), text: text("text").notNull().default(""), filesJson: text("files_json").notNull().default("[]"), updatedAt: text("updated_at").notNull() }, (table) => [index("notes_owner_date_idx").on(table.owner, table.date)]);
export const planEntries = sqliteTable("plan_entries", { id: text("id").primaryKey(), owner: text("owner").notNull(), date: text("date").notNull(), title: text("title").notNull(), type: text("type").notNull(), duration: text("duration").notNull(), status: text("status").notNull(), source: text("source").notNull() }, (table) => [index("plan_owner_date_idx").on(table.owner, table.date)]);
export const appSettings = sqliteTable("app_settings", { owner: text("owner").primaryKey(), schemaVersion: integer("schema_version").notNull().default(1), revision: integer("revision").notNull().default(1), settingsJson: text("settings_json").notNull(), updatedAt: text("updated_at").notNull() });
export const providerSecrets = sqliteTable("provider_secrets", {
  owner: text("owner").notNull(),
  provider: text("provider").notNull(),
  ciphertextB64: text("ciphertext_b64").notNull(),
  ivB64: text("iv_b64").notNull(),
  saltB64: text("salt_b64").notNull(),
  algorithm: text("algorithm").notNull().default("A256GCM"),
  keyVersion: integer("key_version").notNull().default(1),
  metadataJson: text("metadata_json").notNull().default("{}"),
  connectionState: text("connection_state").notNull().default("untested"),
  lastTestedAt: text("last_tested_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [primaryKey({ columns: [table.owner, table.provider] }), index("provider_secrets_owner_idx").on(table.owner)]);
