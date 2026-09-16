import { and, eq, gt, lt, or, isNull } from "drizzle-orm";
import { activityTable, claimsTable, db, resourcesTable } from "@workspace/db";
import { CheckClaimResponse, StartClaimBody, StartClaimResponse } from "@workspace/api-zod";
import { Router, type IRouter } from "express";
import { requireUser, sameOrigin } from "../lib/auth";
import { defaults } from "../lib/domain";
import { safeAffiliateUrl } from "../lib/impact";
import { settingsTable } from "@workspace/db";
import { randomBytes } from "node:crypto";
import { checkClaimEvidence } from "../lib/claim-evidence";
import { ImpactError } from "../lib/impact";
import { runImpactSync } from "../lib/sync";

const router: IRouter = Router();
async function settings() {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "site"));
  return { ...defaults, ...(row?.value as Record<string, unknown> ?? {}) } as typeof defaults;
}

router.post("/claims/start", requireUser, sameOrigin, async (req, res): Promise<void> => {
  const body = StartClaimBody.strict().safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const s = await settings();
  // A tracked signup must be possible before end-to-end attribution can be proven.
  // Access grants remain separately gated inside the sync worker.
  try { safeAffiliateUrl(s.affiliateUrl, s.outboundParameter, "configurationcheck123456789"); }
  catch { res.status(400).json({ error: "The Shopify signup link is not configured" }); return; }
  if (body.data.resourceSlug) {
    const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.slug, body.data.resourceSlug));
    if (!resource) { res.status(400).json({ error: "Unknown resource" }); return; }
  }
  const cutoff = new Date(Date.now() - 60_000 * 10);
  const recent = await db.select().from(activityTable).where(and(eq(activityTable.userId, req.ecomUser!.id), eq(activityTable.action, "signup_click"), gt(activityTable.createdAt, cutoff))).limit(1);
  let [claim] = await db.select().from(claimsTable).where(eq(claimsTable.userId, req.ecomUser!.id));
  if (!claim) {
    // Concurrent clicks must keep the same per-account attribution identifier.
    await db.insert(claimsTable).values({ userId: req.ecomUser!.id, trackingId: randomBytes(24).toString("hex"), status: "started", resumeSlug: body.data.resourceSlug ?? null }).onConflictDoNothing();
    [claim] = await db.select().from(claimsTable).where(eq(claimsTable.userId, req.ecomUser!.id));
  } else if (body.data.resourceSlug) {
    [claim] = await db.update(claimsTable).set({ resumeSlug: body.data.resourceSlug }).where(eq(claimsTable.id, claim.id)).returning();
  }
  // Throttle click analytics, not reopening an existing tracked destination.
  if (!recent.length) await db.insert(activityTable).values({ userId: req.ecomUser!.id, action: "signup_click" });
  res.json(StartClaimResponse.parse({ redirectUrl: safeAffiliateUrl(s.affiliateUrl, s.outboundParameter, claim.trackingId), claimStatus: claim.status }));
});

router.post("/claims/check", requireUser, sameOrigin, async (req, res): Promise<void> => {
  const [claim] = await db.select().from(claimsTable).where(eq(claimsTable.userId, req.ecomUser!.id));
  if (!claim) { res.json(CheckClaimResponse.parse({ message: "Start your signup using your tracked Shopify link before checking verification." })); return; }
  const [checking] = await db.update(claimsTable).set({ lastCheckedAt: new Date() })
    .where(and(eq(claimsTable.id, claim.id), or(isNull(claimsTable.lastCheckedAt), lt(claimsTable.lastCheckedAt, new Date(Date.now() - 60_000))))).returning();
  if (!checking) { res.json(CheckClaimResponse.parse({ message: "Please wait one minute between verification checks. Your tracking ID has not changed." })); return; }
  const s = await settings();
  try {
    if (s.verificationEnabled && s.trackingConfirmed && s.incentiveApproved) {
      const result = await runImpactSync();
      res.json(CheckClaimResponse.parse({ message: result.error ? "Impact verification could not complete. Please try again later." : result.message }));
    } else {
      const message = await checkClaimEvidence(claim.trackingId, claim.createdAt, { ...s, acceptedStates: [...s.acceptedStates] });
      res.json(CheckClaimResponse.parse({ message }));
    }
  } catch (error) {
    const message = error instanceof ImpactError ? error.message : "The verification check could not complete. Please try again later.";
    res.status(503).json({ error: message });
  }
});

/** Records an optional product-onboarding choice; it never confers a referral or entitlement. */
router.post("/onboarding/complete", requireUser, sameOrigin, async (req, res): Promise<void> => {
  const [existing] = await db.select({ id: activityTable.id }).from(activityTable)
    .where(and(eq(activityTable.userId, req.ecomUser!.id), eq(activityTable.action, "onboarding_completed"))).limit(1);
  if (!existing) await db.insert(activityTable).values({ userId: req.ecomUser!.id, action: "onboarding_completed" });
  res.json(CheckClaimResponse.parse({ message: "Onboarding complete" }));
});
export default router;