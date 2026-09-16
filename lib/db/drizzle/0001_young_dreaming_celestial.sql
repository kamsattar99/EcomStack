ALTER TABLE "sync_checkpoints" ADD COLUMN "next_retry_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sync_checkpoints" ADD COLUMN "failure_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_checkpoints" ADD COLUMN "completed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "entitlement_revoked_at" timestamp with time zone;