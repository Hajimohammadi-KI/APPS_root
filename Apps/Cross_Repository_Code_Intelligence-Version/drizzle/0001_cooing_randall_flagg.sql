CREATE TABLE `tracker_attachments` (
	`user_key` text NOT NULL,
	`id` text NOT NULL,
	`day_id` text NOT NULL,
	`storage_key` text NOT NULL,
	`name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_key`, `id`)
);
--> statement-breakpoint
CREATE INDEX `tracker_attachments_day_idx` ON `tracker_attachments` (`user_key`,`day_id`);