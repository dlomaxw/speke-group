CREATE TABLE `hero_slides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(120) NOT NULL,
	`property_id` integer,
	`eyebrow` text(160),
	`title` text(200),
	`title_accent` text(200),
	`body` text,
	`cta_label` text(60),
	`cta_url` text,
	`cta2_label` text(60),
	`cta2_url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hero_slides_slug_idx` ON `hero_slides` (`slug`);