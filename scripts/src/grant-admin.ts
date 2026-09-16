import { eq } from "drizzle-orm";
import { auditTable, db, pool, usersTable } from "@workspace/db";

const [clerkId, reason] = process.argv.slice(2).filter((arg) => arg !== "--");
if (!clerkId || !reason?.trim() || process.argv.length !== 4) {
  throw new Error("Usage: pnpm --filter @workspace/scripts admin:grant -- <clerk-user-id> <non-empty-audit-reason>");
}
try {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (!user) throw new Error("No local user exists for that Clerk user id. The user must sign in once before role assignment.");
  await db.transaction(async (tx) => {
    await tx.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, user.id));
    await tx.insert(auditTable).values({ actorId: "admin-cli", action: "admin_granted", reason: reason.trim(), metadata: { clerkId } });
  });
} finally {
  await pool.end();
}