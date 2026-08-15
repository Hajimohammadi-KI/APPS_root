CREATE TABLE `tracker_focus_sessions` (
	`user_key` text NOT NULL,
	`id` text NOT NULL,
	`context_id` text NOT NULL,
	`context_title` text NOT NULL,
	`source` text DEFAULT 'tracker' NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`accumulated_seconds` integer DEFAULT 0 NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_started_at` text,
	`ended_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_key`, `id`)
);
--> statement-breakpoint
CREATE INDEX `tracker_focus_sessions_user_idx` ON `tracker_focus_sessions` (`user_key`,`started_at`);