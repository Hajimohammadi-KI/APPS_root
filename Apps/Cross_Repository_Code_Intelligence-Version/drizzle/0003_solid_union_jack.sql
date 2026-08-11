CREATE TABLE `app_settings` (
	`owner` text PRIMARY KEY NOT NULL,
	`schema_version` integer DEFAULT 1 NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`settings_json` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pdf_study_sessions` (
	`owner_key` text NOT NULL,
	`id` text NOT NULL,
	`document_id` text NOT NULL,
	`document_name` text NOT NULL,
	`document_kind` text DEFAULT 'pdf' NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`active_seconds` integer DEFAULT 0 NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_started_at` text,
	`ended_at` text,
	`start_page` integer DEFAULT 1 NOT NULL,
	`end_page` integer DEFAULT 1 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`owner_key`, `id`)
);
--> statement-breakpoint
CREATE INDEX `pdf_study_sessions_owner_started_idx` ON `pdf_study_sessions` (`owner_key`,`started_at`);--> statement-breakpoint
CREATE INDEX `pdf_study_sessions_document_idx` ON `pdf_study_sessions` (`owner_key`,`document_id`,`started_at`);--> statement-breakpoint
CREATE TABLE `provider_secrets` (
	`owner` text NOT NULL,
	`provider` text NOT NULL,
	`ciphertext_b64` text NOT NULL,
	`iv_b64` text NOT NULL,
	`salt_b64` text NOT NULL,
	`algorithm` text DEFAULT 'A256GCM' NOT NULL,
	`key_version` integer DEFAULT 1 NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`connection_state` text DEFAULT 'untested' NOT NULL,
	`last_tested_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner`, `provider`)
);
--> statement-breakpoint
CREATE INDEX `provider_secrets_owner_idx` ON `provider_secrets` (`owner`);