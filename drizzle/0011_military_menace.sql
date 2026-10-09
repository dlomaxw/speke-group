ALTER TABLE `experiences` ADD `property_id` integer REFERENCES properties(id);--> statement-breakpoint
ALTER TABLE `experiences` ADD `link_url` text;--> statement-breakpoint
ALTER TABLE `restaurants` ADD `link_url` text;--> statement-breakpoint
ALTER TABLE `venues` ADD `venue_url` text;