ALTER TABLE "resources" ADD COLUMN "source_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "source_notes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "expires_at" timestamp with time zone;