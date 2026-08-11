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