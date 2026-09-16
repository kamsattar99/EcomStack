import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").defaultRandom().primaryKey();
const created = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updated = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());

/** Application authorization is deliberately local: Clerk identity never confers admin. */
export const usersTable = pgTable("users", {
  id: id(),
  clerkId: text("clerk_id").notNull().unique(),
  role: text("role").notNull().default("member"),
  fullName: text("full_name"),
  email: text("email"),
  phoneCountryCode: text("phone_country_code"),
  phoneNumber: text("phone_number"),
  entitlementRevokedAt: timestamp("entitlement_revoked_at", { withTimezone: true }),
  createdAt: created(),
  updatedAt: updated(),
});

export const resourcesTable = pgTable("resources", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  tool: text("tool").notNull(),
  tags: text("tags").array().notNull().default([]),
  preview: text("preview").notNull(),
  useCase: text("use_case").notNull().default(""),
  instructions: text("instructions").notNull().default(""),
  tutorialUrl: text("tutorial_url").notNull().default(""),
  version: text("version").notNull().default("1.0"),
  isFree: boolean("is_free").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  isDemo: boolean("is_demo").notNull().default(false),
  status: text("status").notNull().default("draft"),
  coverAssetId: uuid("cover_asset_id"),
  content: text("content").notNull().default(""),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => [index("resources_status_idx").on(t.status), index("resources_category_idx").on(t.category)]);

export const taxonomiesTable = pgTable("taxonomies", {
  id: id(), name: text("name").notNull(), kind: text("kind").notNull(), createdAt: created(),
}, (t) => [uniqueIndex("taxonomies_name_kind_unique").on(t.name, t.kind)]);

export const assetsTable = pgTable("assets", {
  id: id(), resourceId: uuid("resource_id").notNull().references(() => resourcesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(), contentType: text("content_type").notNull(), size: integer("size").notNull(),
  kind: text("kind").notNull(), status: text("status").notNull().default("pending"),
  temporaryPath: text("temporary_path"), objectPath: text("object_path"), createdAt: created(), confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
});

export const bookmarksTable = pgTable("bookmarks", {
  id: id(), userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  resourceId: uuid("resource_id").notNull().references(() => resourcesTable.id, { onDelete: "cascade" }),
  resumeSlug: text("resume_slug"), createdAt: created(), updatedAt: updated(),
}, (t) => [uniqueIndex("bookmarks_user_resource_unique").on(t.userId, t.resourceId)]);

export const claimsTable = pgTable("claims", {
  id: id(), userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  trackingId: text("tracking_id").notNull().unique(),
  status: text("status").notNull().default("started"), resumeSlug: text("resume_slug"), lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  createdAt: created(), updatedAt: updated(),
});

export const referralEventsTable = pgTable("referral_events", {
  id: id(), sourceEventId: text("source_event_id").notNull().unique(), claimId: uuid("claim_id").references(() => claimsTable.id),
  campaignId: text("campaign_id").notNull(), eventTrackerId: text("event_tracker_id").notNull(), state: text("state").notNull(),
  raw: jsonb("raw").notNull(), occurredAt: timestamp("occurred_at", { withTimezone: true }), createdAt: created(),
});

export const accessGrantsTable = pgTable("access_grants", {
  id: id(), userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  source: text("source").notNull(), sourceEventId: text("source_event_id").unique(), active: boolean("active").notNull().default(true),
  reason: text("reason").notNull(), createdAt: created(), revokedAt: timestamp("revoked_at", { withTimezone: true }),
}, (t) => [uniqueIndex("access_grants_user_source_unique").on(t.userId, t.source)]);

export const supportTable = pgTable("support_requests", {
  id: id(), userId: uuid("user_id").notNull().references(() => usersTable.id), subject: text("subject").notNull(),
  message: text("message").notNull(), status: text("status").notNull().default("open"), createdAt: created(), updatedAt: updated(),
});

export const settingsTable = pgTable("settings", {
  id: id(), key: text("key").notNull().unique(), value: jsonb("value").notNull(), updatedAt: updated(),
});

export const auditTable = pgTable("audit_log", {
  id: id(), actorId: text("actor_id").notNull(), action: text("action").notNull(), reason: text("reason").notNull(),
  metadata: jsonb("metadata").notNull().default({}), createdAt: created(),
});

export const activityTable = pgTable("activity", {
  id: id(), userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  resourceId: uuid("resource_id").references(() => resourcesTable.id, { onDelete: "set null" }),
  action: text("action").notNull(), createdAt: created(),
}, (t) => [index("activity_action_idx").on(t.action)]);

export const syncCheckpointsTable = pgTable("sync_checkpoints", {
  id: id(), name: text("name").notNull().unique(), windowStart: timestamp("window_start", { withTimezone: true }),
  windowEnd: timestamp("window_end", { withTimezone: true }), page: integer("page").notNull().default(1),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }), lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  lastError: text("last_error"), nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
  failureCount: integer("failure_count").notNull().default(0), completed: boolean("completed").notNull().default(true),
  diagnostic: jsonb("diagnostic").notNull().default([]), updatedAt: updated(),
});