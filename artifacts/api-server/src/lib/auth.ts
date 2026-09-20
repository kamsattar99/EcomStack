import { getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import { activityTable, db, usersTable } from "@workspace/db";
import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request { ecomUser?: { id: string; clerkId: string; role: "member" | "admin" } }
  }
}

function clerkUserId(req: Request): string | null {
  const auth = getAuth(req);
  return auth?.sessionClaims?.userId?.toString() ?? auth?.userId ?? null;
}

/** Creates a member record only. Administrative roles require the audited CLI. */
export async function currentUser(req: Request): Promise<Express.Request["ecomUser"] | null> {
  if (req.ecomUser) return req.ecomUser;
  const clerkId = clerkUserId(req);
  if (!clerkId) return null;
  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (!user) {
    [user] = await db.insert(usersTable).values({ clerkId, role: "member" }).returning();
    await db.insert(activityTable).values({ userId: user.id, action: "registration" });
  }
  const role = user.role === "admin" ? "admin" : "member";
  return (req.ecomUser = { id: user.id, clerkId, role });
}

export async function requireUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (user.role !== "admin") { res.status(403).json({ error: "Access denied" }); return; }
  next();
}

/** Completion is an explicit member action, distinct from click tracking or affiliate verification. */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const [completion] = await db.select({ id: activityTable.id }).from(activityTable)
    .where(and(eq(activityTable.userId, userId), eq(activityTable.action, "onboarding_completed"))).limit(1);
  return Boolean(completion);
}

/** Browser mutations are accepted only from this site's origin (or same-origin without Origin). */
export function sameOrigin(req: Request, res: Response, next: NextFunction): void {
  const origin = req.get("origin");
  const host = req.get("host");
  if (origin && (!host || new URL(origin).host !== host)) {
    res.status(403).json({ error: "Cross-origin request denied" }); return;
  }
  next();
}