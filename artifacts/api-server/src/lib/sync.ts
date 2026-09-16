import { and, eq } from "drizzle-orm";
import { accessGrantsTable, auditTable, claimsTable, db, pool, referralEventsTable, syncCheckpointsTable, usersTable } from "@workspace/db";
import { diagnoseImpact, fetchImpactPage, matchesPaidTrial, redactedAction, type ImpactAction } from "./impact";
import { defaults } from "./domain";
import { settingsTable } from "@workspace/db";

const CHECKPOINT = "impact-actions";
async function siteSettings() {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "site"));
  return { ...defaults, ...(row?.value as Record<string, unknown> ?? {}) } as typeof defaults;
}
export async function syncStatus(message = "No sync has run yet.") {
  const [row] = await db.select().from(syncCheckpointsTable).where(eq(syncCheckpointsTable.name, CHECKPOINT));
  const s = await siteSettings();
  const enabled = Boolean(s.verificationEnabled && s.trackingConfirmed && s.incentiveApproved && s.affiliateUrl && s.campaignId && s.eventTrackerId);
  return { enabled, credentialsPresent: Boolean(process.env.IMPACT_ACCOUNT_SID && process.env.IMPACT_AUTH_TOKEN),
    lastCheckedAt: row?.lastCheckedAt?.toISOString() ?? null, lastSuccessAt: row?.lastSuccessAt?.toISOString() ?? null,
    nextCheckAt: row?.nextRetryAt?.toISOString() ?? (row?.lastSuccessAt ? new Date(row.lastSuccessAt.getTime() + s.syncIntervalMinutes * 60_000).toISOString() : null),
    error: row?.lastError ?? null, records: (row?.diagnostic as unknown[] ?? []), message };
}
async function checkpoint(values: Partial<typeof syncCheckpointsTable.$inferInsert>) {
  await db.insert(syncCheckpointsTable).values({ name: CHECKPOINT, ...values }).onConflictDoUpdate({ target: syncCheckpointsTable.name, set: values });
}
async function processAction(action: ImpactAction, settings: typeof defaults) {
  const claims = await db.select().from(claimsTable);
  const matchConfig = { campaignId: settings.campaignId, eventTrackerId: settings.eventTrackerId, returnedField: settings.returnedField, acceptedStates: [...settings.acceptedStates] };
  const returned = action[matchConfig.returnedField as "SubId1" | "SubId2" | "SubId3" | "SharedId"];
  const claim = claims.find((c) => action.CampaignId === matchConfig.campaignId && action.ActionTrackerId === matchConfig.eventTrackerId && returned === c.trackingId);
  if (!claim) return;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, claim.userId));
  if (!user) return;
  if (action.State === "REVERSED") {
    const [priorEvent] = await db.select().from(referralEventsTable).where(eq(referralEventsTable.sourceEventId, action.Id));
    const [grant] = await db.select().from(accessGrantsTable).where(eq(accessGrantsTable.sourceEventId, action.Id));
    const reason = `Impact reversed event ${action.Id}; access retained pending review.`;
    const [review] = await db.select().from(auditTable).where(and(eq(auditTable.actorId, "impact-sync"), eq(auditTable.action, "referral_reversal_review"), eq(auditTable.reason, reason)));
    if (priorEvent && grant && !review) await db.insert(auditTable).values({ actorId: "impact-sync", action: "referral_reversal_review", reason, metadata: { eventId: action.Id, claimId: claim.id } });
    return;
  }
  if (!matchesPaidTrial(action, matchConfig, claim.trackingId) || user.entitlementRevokedAt) return;
  // The event, verified claim and entitlement succeed or fail together.
  await db.transaction(async (tx) => {
    const event = await tx.insert(referralEventsTable).values({ sourceEventId: action.Id, claimId: claim.id, campaignId: action.CampaignId, eventTrackerId: action.ActionTrackerId, state: action.State, raw: redactedAction(action), occurredAt: new Date(action.EventDate) }).onConflictDoNothing().returning();
    if (!event.length) return;
    await tx.update(claimsTable).set({ status: "verified", lastCheckedAt: new Date() }).where(eq(claimsTable.id, claim.id));
    await tx.insert(accessGrantsTable).values({ userId: user.id, source: "impact_paid_trial", sourceEventId: action.Id, active: true, reason: "Matched verified paid trial" }).onConflictDoNothing();
  });
}

/** Single durable worker run. Scheduler is external; no process timer is created. */
export async function runImpactSync(): Promise<Awaited<ReturnType<typeof syncStatus>>> {
  const client = await pool.connect();
  try {
    const locked = (await client.query("SELECT pg_try_advisory_lock(78291642) AS locked")).rows[0]?.locked;
    if (!locked) return syncStatus("Another sync is already running.");
    const settings = await siteSettings();
    const enabled = settings.verificationEnabled && settings.trackingConfirmed && settings.incentiveApproved && settings.affiliateUrl && settings.campaignId && settings.eventTrackerId;
    if (!enabled) return syncStatus("Sync is disabled until the verified affiliate configuration is explicitly approved.");
    const [prior] = await db.select().from(syncCheckpointsTable).where(eq(syncCheckpointsTable.name, CHECKPOINT));
    if (prior?.nextRetryAt && prior.nextRetryAt > new Date()) return syncStatus("Sync is in its persisted retry cooldown.");
    // If a prior run failed, retain its exact window/page. Otherwise start a
    // new max-45-day window with a one-day overlap for late attribution.
    const resume = Boolean(prior && !prior.completed && prior.windowStart && prior.windowEnd);
    const end = resume ? prior!.windowEnd! : new Date();
    const start = resume ? prior!.windowStart! : prior?.windowEnd ? new Date(Math.max(Date.now() - 45 * 864e5, prior.windowEnd.getTime() - 24 * 3600e3)) : new Date(Date.now() - 45 * 864e5);
    let page = resume ? prior!.page : 1;
    await checkpoint({ windowStart: start, windowEnd: end, page, completed: false, lastCheckedAt: new Date(), lastError: null, nextRetryAt: null });
    for (;;) {
      const result = await fetchImpactPage({ startDate: start.toISOString(), endDate: end.toISOString(), campaignId: settings.campaignId, page });
      for (const action of result.actions) await processAction(action, settings);
      if (result.nextPage === null) break;
      page = result.nextPage; await checkpoint({ windowStart: start, windowEnd: end, page, completed: false, lastCheckedAt: new Date() });
    }
    await checkpoint({ windowStart: start, windowEnd: end, page: 1, completed: true, failureCount: 0, nextRetryAt: null, lastCheckedAt: new Date(), lastSuccessAt: new Date(), lastError: null });
    return syncStatus("Impact sync completed.");
  } catch (error) {
    const text = error instanceof Error && error.name === "ImpactError" ? error.message : "Impact sync failed.";
    const [prior] = await db.select().from(syncCheckpointsTable).where(eq(syncCheckpointsTable.name, CHECKPOINT));
    const failureCount = Math.min((prior?.failureCount ?? 0) + 1, 8);
    const nextRetryAt = new Date(Date.now() + Math.min(5 * 60_000 * 2 ** (failureCount - 1), 6 * 60 * 60_000));
    await checkpoint({ completed: false, failureCount, nextRetryAt, lastCheckedAt: new Date(), lastError: text.slice(0, 500) });
    return syncStatus("Impact sync could not complete; retry is safe.");
  } finally {
    try { await client.query("SELECT pg_advisory_unlock(78291642)"); } finally { client.release(); }
  }
}
export async function runDiagnostic() {
  try {
    const result = await diagnoseImpact();
    await checkpoint({ lastCheckedAt: new Date(), diagnostic: result.records, lastError: null });
    return syncStatus(result.message);
  } catch (error) {
    const text = error instanceof Error && error.name === "ImpactError" ? error.message : "Diagnostic failed.";
    await checkpoint({ lastCheckedAt: new Date(), lastError: text.slice(0, 500) });
    return syncStatus("Impact diagnostic could not complete.");
  }
}