CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`date` text NOT NULL,
	`task` text NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`files_json` text DEFAULT '[]' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notes_owner_date_idx` ON `notes` (`owner`,`date`);--> statement-breakpoint
CREATE TABLE `plan_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`duration` text NOT NULL,
	`status` text NOT NULL,
	`source` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `plan_owner_date_idx` ON `plan_entries` (`owner`,`date`);