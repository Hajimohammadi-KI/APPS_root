CREATE TABLE `app_settings` (
	`owner` text PRIMARY KEY NOT NULL,
	`schema_version` integer DEFAULT 1 NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`settings_json` text NOT NULL,
	`updated_at` text NOT NULL
);
