import { and, desc, eq, inArray } from "drizzle-orm";
import { assetsTable, bookmarksTable, db, resourcesTable } from "@workspace/db";

export const defaults = {
  brandName: "EcomStack", tagline: "AI skills, prompts and playbooks for ecommerce.", logoUrl: "",
  supportEmail: "", offerTitle: "Start your Shopify paid trial", offerDescription: "Review Shopify's current offer and eligibility before signing up.", eligibility: "Start an eligible Shopify paid trial through our tracked affiliate link. Existing stores and signups outside this link do not automatically qualify.", affiliateDisclosure: "We may earn a commission if you sign up through our Shopify affiliate link.",
  affiliateReady: false, verificationEnabled: false, development: process.env.NODE_ENV !== "production",
  affiliateUrl: "", campaignId: "", eventTrackerId: "", outboundParameter: "subId1",
  returnedField: "SubId1", acceptedStates: ["PENDING", "APPROVED"], syncIntervalMinutes: 5,
  trackingConfirmed: false, incentiveApproved: false,
} as const;

export type ResourceRow = typeof resourcesTable.$inferSelect;
export function resourceDto(r: ResourceRow, coverUrl = "") {
  return { id: r.id, slug: r.slug, title: r.title, description: r.description,
    type: r.type as "Prompt" | "Skill" | "Cheat Sheet", category: r.category, tool: r.tool,
    tags: r.tags, preview: r.preview, useCase: r.useCase, instructions: r.instructions,
    tutorialUrl: r.tutorialUrl, version: r.version, isFree: r.isFree, featured: r.featured,
    isDemo: r.isDemo, status: r.status as "draft" | "published" | "archived",
     updatedAt: r.updatedAt.toISOString(), coverUrl, sourceUrl: r.sourceUrl, sourceNotes: r.sourceNotes };
}

export async function resourceAssets(resourceId: string) {
  const rows = await db.select().from(assetsTable).where(and(eq(assetsTable.resourceId, resourceId), eq(assetsTable.status, "confirmed")));
  return rows.map((a) => ({ id: a.id, name: a.name, contentType: a.contentType, size: a.size, resourceId: a.resourceId, kind: a.kind, status: a.status, expiresAt: a.expiresAt?.toISOString() ?? null }));
}
export async function hasAccess(userId: string, r: ResourceRow): Promise<boolean> {
  // Vault access belongs to the authenticated EcomStack account, not Shopify attribution.
  return Boolean(userId && r);
}
export async function isSaved(userId: string, resourceId: string): Promise<boolean> {
  return (await db.select({ id: bookmarksTable.id }).from(bookmarksTable)
    .where(and(eq(bookmarksTable.userId, userId), eq(bookmarksTable.resourceId, resourceId)))).length > 0;
}
export async function coversFor(resources: ResourceRow[]) {
  const ids = resources.map((r) => r.coverAssetId).filter((id): id is string => Boolean(id));
  if (!ids.length) return new Map<string, string>();
  const covers = await db.select().from(assetsTable).where(inArray(assetsTable.id, ids));
  return new Map(covers.filter((a) => a.status === "confirmed").map((a) => [a.id, `/api/assets/${a.id}/cover`]));
}
export async function recentResourceIds(userId: string) {
  return db.select({ resourceId: bookmarksTable.resourceId }).from(bookmarksTable)
    .where(eq(bookmarksTable.userId, userId)).orderBy(desc(bookmarksTable.updatedAt)).limit(10);
}