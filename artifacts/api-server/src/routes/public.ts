import { and, desc, eq, inArray } from "drizzle-orm";
import { activityTable, bookmarksTable, claimsTable, db, resourcesTable, settingsTable, supportTable, taxonomiesTable, usersTable } from "@workspace/db";
import {
  CreateSupportRequestBody, CreateSupportRequestResponse, GetMemberResponse, GetResourceContentParams,
  GetResourceContentResponse, GetResourceParams, GetResourceResponse, GetSiteResponse, ListResourcesQueryParams,
  ListResourcesResponse, RecordResourceActivityBody, SetBookmarkBody, UpdateMemberProfileBody,
} from "@workspace/api-zod";
import { Router, type IRouter } from "express";
import { clerkClient } from "@clerk/express";
import { currentUser, requireUser, sameOrigin } from "../lib/auth";
import { coversFor, defaults, hasAccess, isSaved, resourceAssets, resourceDto } from "../lib/domain";
import { safeAffiliateUrl } from "../lib/impact";
import { withRuntimeEnvironment } from "../lib/runtime-site";

const router: IRouter = Router();
async function config() {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "site"));
  return withRuntimeEnvironment({ ...defaults, ...(row?.value as Record<string, unknown> ?? {}) }) as typeof defaults;
}
function validPublic(r: typeof resourcesTable.$inferSelect, development: boolean) {
  return r.status === "published" || (development && r.isDemo && r.status === "draft");
}

router.get("/site", async (_req, res): Promise<void> => {
  const s = await config();
  let affiliateReady = false;
  try {
    safeAffiliateUrl(s.affiliateUrl, s.outboundParameter, "configurationcheck123456789");
    affiliateReady = true;
  } catch { /* Invalid or absent destinations must not offer signup. */ }
  res.json(GetSiteResponse.parse({ ...s, affiliateReady }));
});

router.get("/resources", async (req, res): Promise<void> => {
  const query = ListResourcesQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: "Invalid query" }); return; }
  const s = await config();
  let rows = (await db.select().from(resourcesTable)).filter((r) => validPublic(r, s.development));
  const q = query.data;
  if (q.search) { const needle = q.search.toLowerCase(); rows = rows.filter((r) => `${r.title} ${r.description} ${r.tags.join(" ")}`.toLowerCase().includes(needle)); }
  if (q.category) rows = rows.filter((r) => r.category === q.category);
  if (q.type) rows = rows.filter((r) => r.type === q.type);
  if (q.tool) rows = rows.filter((r) => r.tool === q.tool);
  rows.sort((a, b) => q.sort === "oldest" ? a.updatedAt.getTime() - b.updatedAt.getTime() : b.updatedAt.getTime() - a.updatedAt.getTime());
  const coverMap = await coversFor(rows);
  const taxonomies = await db.select().from(taxonomiesTable);
  res.json(ListResourcesResponse.parse({ resources: rows.map((r) => resourceDto(r, r.coverAssetId ? coverMap.get(r.coverAssetId) ?? "" : "")), total: rows.length, taxonomies }));
});

router.get("/resources/:slug", async (req, res): Promise<void> => {
  const parsed = GetResourceParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid resource" }); return; }
  const [r] = await db.select().from(resourcesTable).where(eq(resourcesTable.slug, parsed.data.slug));
  const user = await currentUser(req); const s = await config();
  if (!r || (!validPublic(r, s.development) && user?.role !== "admin")) { res.status(404).json({ error: "Resource not found" }); return; }
  const related = (await db.select().from(resourcesTable)).filter((x) => x.id !== r.id && x.category === r.category && validPublic(x, s.development)).slice(0, 3);
  const coverMap = await coversFor([r, ...related]);
  res.json(GetResourceResponse.parse({ resource: resourceDto(r, r.coverAssetId ? coverMap.get(r.coverAssetId) ?? "" : ""), related: related.map((x) => resourceDto(x, x.coverAssetId ? coverMap.get(x.coverAssetId) ?? "" : "")), canAccess: user ? user.role === "admin" || await hasAccess(user.id, r) : r.isFree, saved: user ? await isSaved(user.id, r.id) : false }));
});

router.get("/resources/:slug/content", async (req, res): Promise<void> => {
  const parsed = GetResourceContentParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid resource" }); return; }
  const [r] = await db.select().from(resourcesTable).where(eq(resourcesTable.slug, parsed.data.slug));
  const user = await currentUser(req);
  const s = await config();
  if (!r || (!validPublic(r, s.development) && user?.role !== "admin")) { res.status(404).json({ error: "Resource not found" }); return; }
  if (!r.isFree && !user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!r.isFree && user!.role !== "admin" && !await hasAccess(user!.id, r)) { res.status(403).json({ error: "Access denied" }); return; }
  res.json(GetResourceContentResponse.parse({ content: r.content, instructions: r.instructions, assets: await resourceAssets(r.id) }));
});

router.put("/resources/:slug/bookmark", requireUser, sameOrigin, async (req, res): Promise<void> => {
  const body = SetBookmarkBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const [r] = await db.select().from(resourcesTable).where(eq(resourcesTable.slug, String(req.params.slug)));
  if (!r) { res.status(404).json({ error: "Resource not found" }); return; }
  if (body.data.saved) await db.insert(bookmarksTable).values({ userId: req.ecomUser!.id, resourceId: r.id, resumeSlug: r.slug }).onConflictDoNothing();
  else await db.delete(bookmarksTable).where(and(eq(bookmarksTable.userId, req.ecomUser!.id), eq(bookmarksTable.resourceId, r.id)));
  res.json({ message: "Bookmark updated" });
});

router.post("/resources/:slug/activity", requireUser, sameOrigin, async (req, res): Promise<void> => {
  const body = RecordResourceActivityBody.safeParse(req.body);
  const [r] = await db.select().from(resourcesTable).where(eq(resourcesTable.slug, String(req.params.slug)));
  if (!body.success || !r) { res.status(400).json({ error: "Invalid request" }); return; }
  await db.insert(activityTable).values({ userId: req.ecomUser!.id, resourceId: r.id, action: body.data.action });
  res.json({ message: "Activity recorded" });
});

router.get("/me", requireUser, async (req, res): Promise<void> => {
  const user = req.ecomUser!; const [claim] = await db.select().from(claimsTable).where(eq(claimsTable.userId, user.id));
  const s = await config();
  const savedRows = await db.select({ resource: resourcesTable, bookmark: bookmarksTable }).from(bookmarksTable).innerJoin(resourcesTable, eq(bookmarksTable.resourceId, resourcesTable.id)).where(eq(bookmarksTable.userId, user.id)).orderBy(desc(bookmarksTable.updatedAt));
  const saved = savedRows.filter(({ resource }) => validPublic(resource, s.development) || user.role === "admin");
  const [onboarding] = await db.select({ id: activityTable.id }).from(activityTable)
    .where(and(eq(activityTable.userId, user.id), eq(activityTable.action, "onboarding_completed"))).limit(1);
  const [preferences] = await db.select({
    shopifySelfReportedAt: usersTable.shopifySelfReportedAt,
    marketingOptIn: usersTable.marketingOptIn,
  }).from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
  const covers = await coversFor(saved.map((x) => x.resource));
  const activity = await db.select().from(activityTable).where(eq(activityTable.userId, user.id)).orderBy(desc(activityTable.createdAt)).limit(30);
  const ids = [...new Set(activity.map((item) => item.resourceId).filter((id): id is string => Boolean(id)))];
  const recentRows = ids.length ? (await db.select().from(resourcesTable).where(inArray(resourcesTable.id, ids))).filter((resource) => validPublic(resource, s.development) || user.role === "admin") : [];
  const recentById = new Map(recentRows.map((resource) => [resource.id, resource]));
  const recent = ids.map((id) => recentById.get(id)).filter((resource): resource is typeof resourcesTable.$inferSelect => Boolean(resource));
  const recentCovers = await coversFor(recent);
  res.json(GetMemberResponse.parse({ id: user.clerkId, role: user.role, hasAccess: true, accessSource: "account", onboardingCompleted: Boolean(onboarding), claimStatus: claim?.status ?? "none", lastCheckedAt: claim?.lastCheckedAt?.toISOString() ?? null, resumeSlug: claim?.resumeSlug ?? saved[0]?.bookmark.resumeSlug ?? null, shopifySelfReported: Boolean(preferences?.shopifySelfReportedAt), marketingOptIn: preferences?.marketingOptIn ?? false, savedResources: saved.map((x) => resourceDto(x.resource, x.resource.coverAssetId ? covers.get(x.resource.coverAssetId) ?? "" : "")), recentResources: recent.map((resource) => resourceDto(resource, resource.coverAssetId ? recentCovers.get(resource.coverAssetId) ?? "" : "")) }));
});

router.put("/me/profile", requireUser, sameOrigin, async (req, res): Promise<void> => {
  const body = UpdateMemberProfileBody.strict().safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Enter your first name, last name and a valid email address" }); return; }
  const firstName = body.data.firstName.trim().replace(/\s+/g, " ");
  const lastName = body.data.lastName.trim().replace(/\s+/g, " ");
  const fullName = `${firstName} ${lastName}`;
  const email = body.data.email.trim().toLowerCase();
  if (firstName.length < 1 || firstName.length > 60 || lastName.length < 1 || lastName.length > 60 ||
      fullName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Enter your first name, last name and a valid email address" }); return;
  }
  const clerkUser = await clerkClient.users.getUser(req.ecomUser!.clerkId);
  const verifiedEmails = clerkUser.emailAddresses
    .filter((address) => address.verification?.status === "verified")
    .map((address) => address.emailAddress.toLowerCase());
  if (!verifiedEmails.includes(email)) {
    res.status(400).json({ error: "Email address must match your verified account email" }); return;
  }
  await db.update(usersTable).set({ fullName, email }).where(eq(usersTable.id, req.ecomUser!.id));
  res.json({ message: "Member profile saved" });
});

router.post("/support", requireUser, sameOrigin, async (req, res): Promise<void> => {
  const body = CreateSupportRequestBody.safeParse(req.body);
  if (!body.success || !body.data.subject.trim() || !body.data.message.trim()) { res.status(400).json({ error: "Subject and message are required" }); return; }
  await db.insert(supportTable).values({ userId: req.ecomUser!.id, subject: body.data.subject.trim(), message: body.data.message.trim() });
  res.json(CreateSupportRequestResponse.parse({ message: "Support request received" }));
});

export default router;