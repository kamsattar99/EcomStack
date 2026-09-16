import { and, desc, eq, sql } from "drizzle-orm";
import { accessGrantsTable, activityTable, assetsTable, auditTable, claimsTable, db, resourcesTable, settingsTable, supportTable, syncCheckpointsTable, taxonomiesTable, usersTable } from "@workspace/db";
import {
  ChangeAccessBody, CreateResourceBody, CreateResourceResponse, CreateTaxonomyBody, GetAdminOverviewResponse,
  GetAdminResourceParams, GetAdminResourceResponse, GetAdminSettingsResponse, GetSyncStatusResponse, ListAdminResourcesResponse,
  ListSupportRequestsResponse, ListTaxonomiesResponse, ListUsersResponse, UpdateResourceBody, UpdateResourceParams,
  RunImpactDiagnosticResponse, RunImpactSyncResponse, UpdateSettingsBody, UpdateSupportRequestBody, UpdateTaxonomyBody,
} from "@workspace/api-zod";
import { Router, type IRouter } from "express";
import { requireAdmin, sameOrigin } from "../lib/auth";
import { defaults, resourceAssets, resourceDto } from "../lib/domain";
import { runDiagnostic, runImpactSync, syncStatus } from "../lib/sync";
import { safeAffiliateUrl } from "../lib/impact";

const router: IRouter = Router();
router.use(requireAdmin);
async function settings() {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "site"));
  return { ...defaults, ...(row?.value as Record<string, unknown> ?? {}) } as typeof defaults;
}
async function audit(actorId: string, action: string, reason: string, metadata: Record<string, unknown> = {}) {
  await db.insert(auditTable).values({ actorId, action, reason, metadata });
}
async function resourceWithContent(id: string) {
  const [r] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id));
  if (!r) return null;
  return { resource: resourceDto(r, r.coverAssetId ? `/api/assets/${r.coverAssetId}/cover` : ""), content: r.content, assets: await resourceAssets(r.id) };
}

router.get("/admin/overview", async (_req, res): Promise<void> => {
  const count = async (table: typeof usersTable, condition?: ReturnType<typeof eq>) => Number((await db.select({ n: sql<number>`count(*)` }).from(table).where(condition)).at(0)?.n ?? 0);
  const audits = await db.select().from(auditTable).orderBy(desc(auditTable.createdAt)).limit(20);
  const [registeredUsers, signupClicks, onboardingCompletions, verified, copies, downloads, resources, open] = await Promise.all([
    count(usersTable), Number((await db.select({ n: sql<number>`count(distinct ${activityTable.userId})` }).from(activityTable).where(eq(activityTable.action, "signup_click")))[0]?.n ?? 0),
    Number((await db.select({ n: sql<number>`count(distinct ${activityTable.userId})` }).from(activityTable).where(eq(activityTable.action, "onboarding_completed")))[0]?.n ?? 0),
    count(claimsTable as never, eq(claimsTable.status, "verified") as never), count(activityTable as never, eq(activityTable.action, "copy") as never),
    count(activityTable as never, eq(activityTable.action, "download") as never), count(resourcesTable as never), count(supportTable as never, eq(supportTable.status, "open") as never),
  ]);
  res.json(GetAdminOverviewResponse.parse({ registeredUsers, signupClicks, onboardingCompletions, verifiedPaidTrials: verified, accountsWithAccess: registeredUsers, resourceCopies: copies, resourceDownloads: downloads, resources, openSupportRequests: open, audit: audits.map((a) => ({ id: a.id, actorId: a.actorId, action: a.action, reason: a.reason, createdAt: a.createdAt.toISOString() })) }));
});

router.get("/admin/resources", async (_req, res): Promise<void> => { res.json(ListAdminResourcesResponse.parse((await db.select().from(resourcesTable)).map((r) => resourceDto(r, r.coverAssetId ? `/api/assets/${r.coverAssetId}/cover` : "")))); });
async function saveResource(req: Parameters<typeof router.post>[1] extends never ? never : any, res: any, id?: string): Promise<void> {
  const body = (id ? UpdateResourceBody : CreateResourceBody).strict().safeParse(req.body);
  if (!body.success || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.data.slug)) { res.status(400).json({ error: "Invalid resource" }); return; }
  const input = body.data;
  const values = { ...input, tags: input.tags ?? [], useCase: input.useCase ?? "", instructions: input.instructions ?? "", tutorialUrl: input.tutorialUrl ?? "", version: input.version ?? "1.0", featured: input.featured ?? false, isDemo: input.isDemo ?? false, coverAssetId: undefined as string | undefined, content: input.content };
  let row;
  try {
    if (id) [row] = await db.update(resourcesTable).set(values).where(eq(resourcesTable.id, id)).returning();
    else [row] = await db.insert(resourcesTable).values(values).returning();
  } catch { res.status(400).json({ error: "Resource slug already exists" }); return; }
  if (!row) { res.status(404).json({ error: "Resource not found" }); return; }
  await audit(req.ecomUser.clerkId, id ? "resource_updated" : "resource_created", "Administrative content change", { resourceId: row.id });
  res.json(CreateResourceResponse.parse({ resource: resourceDto(row, row.coverAssetId ? `/api/assets/${row.coverAssetId}/cover` : ""), content: row.content, assets: await resourceAssets(row.id) }));
}
router.post("/admin/resources", sameOrigin, (req, res) => saveResource(req, res));
router.get("/admin/resources/:id", async (req, res): Promise<void> => {
  const parsed = GetAdminResourceParams.safeParse(req.params); if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const item = await resourceWithContent(parsed.data.id); if (!item) { res.status(404).json({ error: "Resource not found" }); return; }
  res.json(GetAdminResourceResponse.parse(item));
});
router.put("/admin/resources/:id", sameOrigin, async (req, res): Promise<void> => {
  const parsed = UpdateResourceParams.safeParse(req.params); if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await saveResource(req, res, parsed.data.id);
});

router.get("/admin/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable);
  const result = await Promise.all(users.map(async (u) => {
    const [claim] = await db.select().from(claimsTable).where(eq(claimsTable.userId, u.id));
    const [onboarding] = await db.select({ id: activityTable.id }).from(activityTable)
      .where(and(eq(activityTable.userId, u.id), eq(activityTable.action, "onboarding_completed"))).limit(1);
    return {
      id: u.clerkId,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      hasAccess: true,
      claimStatus: claim?.status ?? "none",
      fullName: u.fullName,
      email: u.email,
      phoneCountryCode: u.phoneCountryCode,
      phoneNumber: u.phoneNumber,
      onboardingCompleted: Boolean(onboarding),
    };
  }));
  res.json(ListUsersResponse.parse(result));
});
router.post("/admin/access", sameOrigin, async (req, res): Promise<void> => {
  const body = ChangeAccessBody.strict().safeParse(req.body);
  if (!body.success || !body.data.reason.trim()) { res.status(400).json({ error: "A non-empty reason is required" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, body.data.userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  await db.transaction(async (tx) => {
    if (body.data.action === "grant") {
      await tx.update(usersTable).set({ entitlementRevokedAt: null }).where(eq(usersTable.id, user.id));
      await tx.insert(accessGrantsTable).values({ userId: user.id, source: "manual", active: true, reason: body.data.reason.trim() }).onConflictDoUpdate({ target: [accessGrantsTable.userId, accessGrantsTable.source], set: { active: true, revokedAt: null, reason: body.data.reason.trim() } });
    } else {
      await tx.update(usersTable).set({ entitlementRevokedAt: new Date() }).where(eq(usersTable.id, user.id));
      await tx.update(accessGrantsTable).set({ active: false, revokedAt: new Date(), reason: body.data.reason.trim() }).where(and(eq(accessGrantsTable.userId, user.id), eq(accessGrantsTable.active, true)));
    }
    await tx.insert(auditTable).values({ actorId: req.ecomUser!.clerkId, action: `access_${body.data.action}`, reason: body.data.reason.trim(), metadata: { userId: user.clerkId } });
  });
  res.json({ message: "Access updated" });
});

router.get("/admin/support", async (_req, res): Promise<void> => { const rows = await db.select().from(supportTable).orderBy(desc(supportTable.createdAt)); const users = await db.select().from(usersTable); const byId = new Map(users.map((u) => [u.id, u.clerkId])); res.json(ListSupportRequestsResponse.parse(rows.map((x) => ({ ...x, userId: byId.get(x.userId) ?? "", createdAt: x.createdAt.toISOString() })))); });
router.patch("/admin/support/:id", sameOrigin, async (req, res): Promise<void> => { const body = UpdateSupportRequestBody.strict().safeParse(req.body); if (!body.success) { res.status(400).json({ error: "Invalid request" }); return; } const [row] = await db.update(supportTable).set({ status: body.data.status }).where(eq(supportTable.id, String(req.params.id))).returning(); if (!row) { res.status(404).json({ error: "Support request not found" }); return; } await audit(req.ecomUser!.clerkId, "support_updated", "Support status changed", { id: row.id }); res.json({ message: "Support request updated" }); });

router.get("/admin/settings", async (_req, res): Promise<void> => { res.json(GetAdminSettingsResponse.parse(await settings())); });
router.put("/admin/settings", sameOrigin, async (req, res): Promise<void> => {
  const body = UpdateSettingsBody.strict().safeParse(req.body); if (!body.success) { res.status(400).json({ error: "Invalid settings" }); return; }
  const current = await settings(); const next = { ...current, ...body.data };
  const textFields = [next.brandName, next.tagline, next.logoUrl, next.supportEmail, next.offerTitle, next.offerDescription, next.eligibility, next.affiliateDisclosure, next.affiliateUrl, next.campaignId, next.eventTrackerId];
  if (textFields.some((x) => x.length > 2000) || !Number.isInteger(next.syncIntervalMinutes) || next.syncIntervalMinutes < 5 || next.syncIntervalMinutes > 1440 ||
    Boolean(next.campaignId) !== Boolean(next.eventTrackerId) || (next.campaignId && !/^\d+$/.test(next.campaignId)) || (next.eventTrackerId && !/^\d+$/.test(next.eventTrackerId)) ||
    (next.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.supportEmail))) { res.status(400).json({ error: "Invalid settings values" }); return; }
  for (const url of [next.logoUrl, next.affiliateUrl]) {
    if (!url) continue;
    try { const parsed = new URL(url); if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error(); } catch { res.status(400).json({ error: "URL must be a public HTTPS URL" }); return; }
  }
  if (next.affiliateUrl) {
    try { safeAffiliateUrl(next.affiliateUrl, next.outboundParameter, "A".repeat(24)); } catch { res.status(400).json({ error: "Affiliate URL is not approved" }); return; }
  }
  const [checkpoint] = await db.select().from(syncCheckpointsTable).where(eq(syncCheckpointsTable.name, "impact-actions"));
  const records = Array.isArray(checkpoint?.diagnostic) ? checkpoint.diagnostic as Array<Record<string, unknown>> : [];
  const fieldObserved = { SubId1: "hasSubId1", SubId2: "hasSubId2", SubId3: "hasSubId3", SharedId: "hasSharedId" }[next.returnedField];
  const valid = Boolean(next.affiliateUrl && next.campaignId && next.eventTrackerId && next.trackingConfirmed && next.incentiveApproved && next.acceptedStates.length &&
    records.some((r) => r.campaignId === next.campaignId && r.eventTrackerId === next.eventTrackerId && r[fieldObserved] === true));
  if (next.verificationEnabled && !valid) { res.status(400).json({ error: "Verification requires valid confirmed affiliate configuration and an observed returned field" }); return; }
  await db.insert(settingsTable).values({ key: "site", value: next }).onConflictDoUpdate({ target: settingsTable.key, set: { value: next } });
  await audit(req.ecomUser!.clerkId, "settings_updated", "Administrative settings change"); res.json(GetAdminSettingsResponse.parse(next));
});

router.get("/admin/impact/status", async (_req, res): Promise<void> => { res.json(GetSyncStatusResponse.parse(await syncStatus())); });
router.post("/admin/impact/diagnostic", sameOrigin, async (_req, res): Promise<void> => { res.json(RunImpactDiagnosticResponse.parse(await runDiagnostic())); });
router.post("/admin/impact/sync", sameOrigin, async (_req, res): Promise<void> => { res.json(RunImpactSyncResponse.parse(await runImpactSync())); });

router.get("/admin/taxonomies", async (_req, res): Promise<void> => { res.json(ListTaxonomiesResponse.parse(await db.select().from(taxonomiesTable))); });
router.post("/admin/taxonomies", sameOrigin, async (req, res): Promise<void> => { const b = CreateTaxonomyBody.strict().safeParse(req.body); if (!b.success || !b.data.name.trim()) { res.status(400).json({ error: "Invalid taxonomy" }); return; } try { const [x] = await db.insert(taxonomiesTable).values({ name: b.data.name.trim(), kind: b.data.kind }).returning(); res.json(x); } catch { res.status(400).json({ error: "Taxonomy already exists" }); } });
router.put("/admin/taxonomies/:id", sameOrigin, async (req, res): Promise<void> => { const b = UpdateTaxonomyBody.strict().safeParse(req.body); if (!b.success || !b.data.name.trim()) { res.status(400).json({ error: "Invalid taxonomy" }); return; } const [x] = await db.update(taxonomiesTable).set({ name: b.data.name.trim(), kind: b.data.kind }).where(eq(taxonomiesTable.id, String(req.params.id))).returning(); if (!x) { res.status(404).json({ error: "Taxonomy not found" }); return; } res.json(x); });
router.delete("/admin/taxonomies/:id", sameOrigin, async (req, res): Promise<void> => { const [x] = await db.delete(taxonomiesTable).where(eq(taxonomiesTable.id, String(req.params.id))).returning(); if (!x) { res.status(404).json({ error: "Taxonomy not found" }); return; } res.json({ message: "Taxonomy deleted" }); });
export default router;