import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Persistent state is deliberately scoped by an opaque, server-derived user key.
 * The public API never accepts a user key from the browser.
 */
export const taskProgress = sqliteTable(
  "tracker_task_progress",
  {
    userKey: text("user_key").notNull(),
    taskId: text("task_id").notNull(),
    completed: integer("completed", { mode: "boolean" })
      .notNull()
      .default(false),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userKey, table.taskId] })],
);

export const dayNotes = sqliteTable(
  "tracker_day_notes",
  {
    userKey: text("user_key").notNull(),
    dayId: text("day_id").notNull(),
    note: text("note").notNull().default(""),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userKey, table.dayId] })],
);

/**
 * JSON here is limited to non-secret, user-editable presentation/integration
 * preferences. API keys, OAuth tokens and credentials are rejected by the API.
 */
export const trackerSettings = sqliteTable("tracker_user_settings", {
  userKey: text("user_key").primaryKey(),
  data: text("data").notNull().default("{}"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * File bytes live in R2. D1 stores only searchable ownership and display
 * metadata so attachments can be listed efficiently for each learning day.
 */
export const trackerAttachments = sqliteTable(
  "tracker_attachments",
  {
    userKey: text("user_key").notNull(),
    id: text("id").notNull(),
    dayId: text("day_id").notNull(),
    storageKey: text("storage_key").notNull(),
    name: text("name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.userKey, table.id] }),
    index("tracker_attachments_day_idx").on(table.userKey, table.dayId),
  ],
);

export const trackerFocusSessions = sqliteTable(
  "tracker_focus_sessions",
  {
    userKey: text("user_key").notNull(),
    id: text("id").notNull(),
    contextId: text("context_id").notNull(),
    contextTitle: text("context_title").notNull(),
    source: text("source").notNull().default("tracker"),
    status: text("status").notNull().default("running"),
    accumulatedSeconds: integer("accumulated_seconds").notNull().default(0),
    startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    lastStartedAt: text("last_started_at"),
    endedAt: text("ended_at"),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.userKey, table.id] }),
    index("tracker_focus_sessions_user_idx").on(table.userKey, table.startedAt),
  ],
);

/**
 * Reading sessions created inside the integrated PDF Visual route. Keeping
 * them separate from tracker focus sessions preserves page/document metadata
 * while both tools share the same authenticated user and D1 database.
 */
export const pdfStudySessions = sqliteTable(
  "pdf_study_sessions",
  {
    ownerKey: text("owner_key").notNull(),
    id: text("id").notNull(),
    documentId: text("document_id").notNull(),
    documentName: text("document_name").notNull(),
    documentKind: text("document_kind").notNull().default("pdf"),
    status: text("status").notNull().default("running"),
    activeSeconds: integer("active_seconds").notNull().default(0),
    startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    lastStartedAt: text("last_started_at"),
    endedAt: text("ended_at"),
    startPage: integer("start_page").notNull().default(1),
    endPage: integer("end_page").notNull().default(1),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.ownerKey, table.id] }),
    index("pdf_study_sessions_owner_started_idx").on(table.ownerKey, table.startedAt),
    index("pdf_study_sessions_document_idx").on(table.ownerKey, table.documentId, table.startedAt),
  ],
);

/** Central, non-secret settings used by every integrated route. */
export const appSettings = sqliteTable("app_settings", {
  owner: text("owner").primaryKey(),
  schemaVersion: integer("schema_version").notNull().default(1),
  revision: integer("revision").notNull().default(1),
  settingsJson: text("settings_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/**
 * Provider credentials are encrypted before storage. No API response exposes
 * their plaintext value, and exported settings intentionally omit this table.
 */
export const providerSecrets = sqliteTable(
  "provider_secrets",
  {
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
  },
  (table) => [
    primaryKey({ columns: [table.owner, table.provider] }),
    index("provider_secrets_owner_idx").on(table.owner),
  ],
);
