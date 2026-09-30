CREATE TABLE `awards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(120) NOT NULL,
	`title` text(200) NOT NULL,
	`organisation` text(160),
	`year` text(40),
	`property_id` integer,
	`description` text,
	`link_url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `awards_slug_idx` ON `awards` (`slug`);--> statement-breakpoint
CREATE TABLE `faqs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question` text(300) NOT NULL,
	`answer` text NOT NULL,
	`category` text DEFAULT 'booking' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `properties` ADD `latitude` real;--> statement-breakpoint
ALTER TABLE `properties` ADD `longitude` real;