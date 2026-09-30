CREATE TABLE `videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(120) NOT NULL,
	`title` text(200) NOT NULL,
	`description` text,
	`property_id` integer,
	`video_url` text NOT NULL,
	`poster_url` text,
	`duration_label` text(20),
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `videos_slug_idx` ON `videos` (`slug`);