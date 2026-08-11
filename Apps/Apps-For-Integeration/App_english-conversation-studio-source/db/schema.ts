import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const conversationSessions = sqliteTable("conversation_sessions", {
  id: text("id").primaryKey(),
  language: text("language", { enum: ["en", "de"] }).notNull(),
  topicId: text("topic_id").notNull(),
  transcript: text("transcript").notNull(),
  corrected: text("corrected").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  wordCount: integer("word_count").notNull(),
  wordsPerMinute: integer("words_per_minute").notNull(),
  provider: text("provider").notNull(),
  providerPayload: text("provider_payload", { mode: "json" }).$type<unknown>().notNull(),
  createdAt: text("created_at").notNull(),
});
