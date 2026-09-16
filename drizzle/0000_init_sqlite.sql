CREATE TABLE `activity_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`user_email` text(255),
	`action` text(40) NOT NULL,
	`entity` text(60) NOT NULL,
	`entity_id` text(60),
	`summary` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `activity_created_idx` ON `activity_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `enquiries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(160) NOT NULL,
	`email` text(255) NOT NULL,
	`phone` text(60),
	`subject` text(250),
	`message` text NOT NULL,
	`kind` text DEFAULT 'general' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`assigned_to` integer,
	`internal_note` text,
	`source_page` text(160),
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `enquiries_status_idx` ON `enquiries` (`status`);--> statement-breakpoint
CREATE INDEX `enquiries_created_idx` ON `enquiries` (`created_at`);--> statement-breakpoint
CREATE TABLE `experiences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(120) NOT NULL,
	`name` text(160) NOT NULL,
	`description` text,
	`highlights` text,
	`image_url` text,
	`image_alt` text(300),
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `experiences_slug_idx` ON `experiences` (`slug`);--> statement-breakpoint
CREATE TABLE `highlight_blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`section` text(40) NOT NULL,
	`icon` text(12),
	`name` text(160) NOT NULL,
	`description` text,
	`link_url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `highlight_section_idx` ON `highlight_blocks` (`section`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`pathname` text,
	`filename` text(255) NOT NULL,
	`content_type` text(100),
	`bytes` integer,
	`width` integer,
	`height` integer,
	`alt` text(300),
	`credit` text(200),
	`folder` text(80) DEFAULT 'general',
	`uploaded_by` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `media_folder_idx` ON `media` (`folder`);--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` text(20) NOT NULL,
	`title` text(200) NOT NULL,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `news_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(160) NOT NULL,
	`title` text(250) NOT NULL,
	`excerpt` text,
	`body` text,
	`property_label` text(120) DEFAULT 'Group',
	`tag` text(40) DEFAULT 'group',
	`image_url` text,
	`image_alt` text(300),
	`is_featured` integer DEFAULT false NOT NULL,
	`published_at` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`author_id` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_slug_idx` ON `news_posts` (`slug`);--> statement-breakpoint
CREATE INDEX `news_published_idx` ON `news_posts` (`published_at`);--> statement-breakpoint
CREATE TABLE `offers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(200) NOT NULL,
	`property_label` text(120),
	`description` text,
	`category` text(40) DEFAULT 'accommodation' NOT NULL,
	`image_url` text,
	`link_url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(120) NOT NULL,
	`name` text(160) NOT NULL,
	`kind` text DEFAULT 'hotel' NOT NULL,
	`category_label` text(60) DEFAULT 'Hotel' NOT NULL,
	`description` text,
	`website_url` text,
	`area` text(160),
	`image_url` text,
	`image_alt` text(300),
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `properties_slug_idx` ON `properties` (`slug`);--> statement-breakpoint
CREATE TABLE `restaurants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(120) NOT NULL,
	`name` text(160) NOT NULL,
	`cuisine` text(120),
	`description` text,
	`kind` text(20) DEFAULT 'restaurant' NOT NULL,
	`image_url` text,
	`image_alt` text(300),
	`opening_times` text(200),
	`dress_code` text(120),
	`phone` text(60),
	`email` text(160),
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `restaurants_slug_idx` ON `restaurants` (`slug`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text(80) PRIMARY KEY NOT NULL,
	`value` text,
	`value_type` text(20) DEFAULT 'text' NOT NULL,
	`label` text(160) NOT NULL,
	`help_text` text,
	`group` text(60) DEFAULT 'general' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `settings_group_idx` ON `settings` (`group`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text(255) NOT NULL,
	`name` text(120) NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`department` text(80),
	`is_active` integer DEFAULT true NOT NULL,
	`must_change_password` integer DEFAULT false NOT NULL,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `venue_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_name` text(160) NOT NULL,
	`venue_list` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `venues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(120) NOT NULL,
	`name` text(160) NOT NULL,
	`location` text(160) NOT NULL,
	`capacity` text(80),
	`venue_size` text(80),
	`size_tag` text(20) DEFAULT 's10' NOT NULL,
	`description` text,
	`image_url` text,
	`image_alt` text(300),
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `venues_slug_idx` ON `venues` (`slug`);