CREATE TYPE "public"."enquiry_kind" AS ENUM('general', 'stay', 'event', 'dining', 'careers', 'press');--> statement-breakpoint
CREATE TYPE "public"."enquiry_status" AS ENUM('new', 'assigned', 'answered', 'closed', 'spam');--> statement-breakpoint
CREATE TYPE "public"."property_kind" AS ENUM('hotel', 'resort', 'convention', 'apartment');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'manager', 'marketing', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"user_email" varchar(255),
	"action" varchar(40) NOT NULL,
	"entity" varchar(60) NOT NULL,
	"entity_id" varchar(60),
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(60),
	"subject" varchar(250),
	"message" text NOT NULL,
	"kind" "enquiry_kind" DEFAULT 'general' NOT NULL,
	"status" "enquiry_status" DEFAULT 'new' NOT NULL,
	"assigned_to" integer,
	"internal_note" text,
	"source_page" varchar(160),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text,
	"highlights" text,
	"image_url" text,
	"image_alt" varchar(300),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'published' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "highlight_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"section" varchar(40) NOT NULL,
	"icon" varchar(12),
	"name" varchar(160) NOT NULL,
	"description" text,
	"link_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"pathname" text,
	"filename" varchar(255) NOT NULL,
	"content_type" varchar(100),
	"bytes" integer,
	"width" integer,
	"height" integer,
	"alt" varchar(300),
	"credit" varchar(200),
	"folder" varchar(80) DEFAULT 'general',
	"uploaded_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" varchar(20) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(250) NOT NULL,
	"excerpt" text,
	"body" text,
	"property_label" varchar(120) DEFAULT 'Group',
	"tag" varchar(40) DEFAULT 'group',
	"image_url" text,
	"image_alt" varchar(300),
	"is_featured" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"author_id" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"property_label" varchar(120),
	"description" text,
	"category" varchar(40) DEFAULT 'accommodation' NOT NULL,
	"image_url" text,
	"link_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'published' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(160) NOT NULL,
	"kind" "property_kind" DEFAULT 'hotel' NOT NULL,
	"category_label" varchar(60) DEFAULT 'Hotel' NOT NULL,
	"description" text,
	"website_url" text,
	"area" varchar(160),
	"image_url" text,
	"image_alt" varchar(300),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'published' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(160) NOT NULL,
	"cuisine" varchar(120),
	"description" text,
	"kind" varchar(20) DEFAULT 'restaurant' NOT NULL,
	"image_url" text,
	"image_alt" varchar(300),
	"opening_times" varchar(200),
	"dress_code" varchar(120),
	"phone" varchar(60),
	"email" varchar(160),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'published' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"value" text,
	"value_type" varchar(20) DEFAULT 'text' NOT NULL,
	"label" varchar(160) NOT NULL,
	"help_text" text,
	"group" varchar(60) DEFAULT 'general' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(120) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'viewer' NOT NULL,
	"department" varchar(80),
	"is_active" boolean DEFAULT true NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venue_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_name" varchar(160) NOT NULL,
	"venue_list" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(160) NOT NULL,
	"location" varchar(160) NOT NULL,
	"capacity" varchar(80),
	"venue_size" varchar(80),
	"size_tag" varchar(20) DEFAULT 's10' NOT NULL,
	"description" text,
	"image_url" text,
	"image_alt" varchar(300),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'published' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_created_idx" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "enquiries_status_idx" ON "enquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "enquiries_created_idx" ON "enquiries" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "experiences_slug_idx" ON "experiences" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "highlight_section_idx" ON "highlight_blocks" USING btree ("section");--> statement-breakpoint
CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder");--> statement-breakpoint
CREATE UNIQUE INDEX "news_slug_idx" ON "news_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "news_published_idx" ON "news_posts" USING btree ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "properties_slug_idx" ON "properties" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurants_slug_idx" ON "restaurants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "settings_group_idx" ON "settings" USING btree ("group");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "venues_slug_idx" ON "venues" USING btree ("slug");