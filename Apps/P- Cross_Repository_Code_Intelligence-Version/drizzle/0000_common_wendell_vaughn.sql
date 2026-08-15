CREATE TABLE `tracker_day_notes` (
	`user_key` text NOT NULL,
	`day_id` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_key`, `day_id`)
);
--> statement-breakpoint
CREATE TABLE `tracker_task_progress` (
	`user_key` text NOT NULL,
	`task_id` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_key`, `task_id`)
);
--> statement-breakpoint
CREATE TABLE `tracker_user_settings` (
	`user_key` text PRIMARY KEY NOT NULL,
	`data` text DEFAULT '{}' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
