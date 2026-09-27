CREATE TABLE `wellness` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(120) NOT NULL,
	`name` text(160) NOT NULL,
	`property_id` integer,
	`kind` text DEFAULT 'spa' NOT NULL,
	`location` text(160),
	`description` text,
	`highlights` text,
	`opening_times` text(160),
	`phone` text(60),
	`image_url` text,
	`image_alt` text(300),
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wellness_slug_idx` ON `wellness` (`slug`);