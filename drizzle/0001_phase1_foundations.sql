CREATE TABLE `content_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collection` text NOT NULL,
	`record_id` integer,
	`action` text NOT NULL,
	`state` text DEFAULT 'history' NOT NULL,
	`data` text NOT NULL,
	`user_id` integer,
	`user_email` text,
	`reviewed_by` integer,
	`reviewed_at` integer,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `versions_record_idx` ON `content_versions` (`collection`,`record_id`);--> statement-breakpoint
CREATE INDEX `versions_state_idx` ON `content_versions` (`state`);--> statement-breakpoint
CREATE TABLE `outbox_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_key` text NOT NULL,
	`type` text NOT NULL,
	`enquiry_id` integer,
	`state` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` integer NOT NULL,
	`last_error` text,
	`sent_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `outbox_event_key_idx` ON `outbox_events` (`event_key`);--> statement-breakpoint
CREATE INDEX `outbox_state_idx` ON `outbox_events` (`state`,`next_attempt_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_properties` (
	`user_id` integer NOT NULL,
	`property_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_properties_pk` ON `user_properties` (`user_id`,`property_id`);--> statement-breakpoint
ALTER TABLE `enquiries` ADD `property_id` integer REFERENCES properties(id);--> statement-breakpoint
ALTER TABLE `enquiries` ADD `contact_method` text DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE `enquiries` ADD `arrival_date` text;--> statement-breakpoint
ALTER TABLE `enquiries` ADD `departure_date` text;--> statement-breakpoint
ALTER TABLE `enquiries` ADD `guests` integer;--> statement-breakpoint
ALTER TABLE `enquiries` ADD `marketing_opt_in` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `enquiries` ADD `idempotency_key` text;--> statement-breakpoint
ALTER TABLE `enquiries` ADD `request_hash` text;--> statement-breakpoint
ALTER TABLE `enquiries` ADD `first_human_reply_at` integer;--> statement-breakpoint
ALTER TABLE `enquiries` ADD `closed_at` integer;--> statement-breakpoint
ALTER TABLE `enquiries` ADD `conversion_reference` text;--> statement-breakpoint
CREATE UNIQUE INDEX `enquiries_idempotency_idx` ON `enquiries` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `enquiries_property_idx` ON `enquiries` (`property_id`);--> statement-breakpoint
ALTER TABLE `media` ADD `rights_status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `media` ADD `rights_note` text;--> statement-breakpoint
ALTER TABLE `media` ADD `rights_reviewed_by` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `media` ADD `rights_reviewed_at` integer;--> statement-breakpoint
ALTER TABLE `news_posts` ADD `property_id` integer REFERENCES properties(id);--> statement-breakpoint
ALTER TABLE `offers` ADD `property_id` integer REFERENCES properties(id);--> statement-breakpoint
ALTER TABLE `restaurants` ADD `property_id` integer REFERENCES properties(id);--> statement-breakpoint
ALTER TABLE `users` ADD `property_scope` text DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totp_secret` text;--> statement-breakpoint
ALTER TABLE `users` ADD `totp_enabled_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `totp_last_step` integer;--> statement-breakpoint
ALTER TABLE `venues` ADD `property_id` integer REFERENCES properties(id);