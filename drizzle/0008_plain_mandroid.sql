CREATE TABLE `impact_initiatives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(120) NOT NULL,
	`title` text(200) NOT NULL,
	`property_id` integer,
	`area` text DEFAULT 'energy' NOT NULL,
	`description` text,
	`source` text(300),
	`evidence` text DEFAULT 'published' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `impact_slug_idx` ON `impact_initiatives` (`slug`);