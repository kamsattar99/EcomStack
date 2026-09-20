import { and, eq, lt } from "drizzle-orm";
import { assetsTable, db, resourcesTable } from "@workspace/db";
import { ConfirmAssetBody, ConfirmAssetResponse, RequestAssetUploadBody, RequestAssetUploadResponse } from "@workspace/api-zod";
import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { currentUser, hasCompletedOnboarding, requireAdmin, sameOrigin } from "../lib/auth";
import { objectStorageClient } from "../lib/objectStorage";

const router: IRouter = Router();
const MAX_SIZE = 15 * 1024 * 1024;
const PENDING_TTL_MS = 30 * 60 * 1000;
const allowed = new Map([
  ["md", ["text/markdown", "text/plain"]], ["zip", ["application/zip", "application/x-zip-compressed"]],
  ["pdf", ["application/pdf"]], ["png", ["image/png"]], ["jpg", ["image/jpeg"]], ["jpeg", ["image/jpeg"]], ["webp", ["image/webp"]],
]);
function objectFile(fullPath: string) {
  const segments = fullPath.replace(/^\/+/, "").split("/");
  if (segments.length < 2 || !segments[0]) throw new Error("Storage is unavailable");
  return objectStorageClient.bucket(segments[0]).file(segments.slice(1).join("/"));
}
async function signPut(fullPath: string): Promise<string> {
  const segments = fullPath.replace(/^\/+/, "").split("/");
  const response = await fetch("http://127.0.0.1:1106/object-storage/signed-object-url", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket_name: segments[0], object_name: segments.slice(1).join("/"), method: "PUT", expires_at: new Date(Date.now() + 600_000).toISOString() }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error("Storage signer unavailable");
  const body = await response.json() as { signed_url?: unknown };
  if (typeof body.signed_url !== "string") throw new Error("Storage signer unavailable");
  return body.signed_url;
}
function extension(name: string) { return name.toLowerCase().split(".").pop() ?? ""; }
function validInput(name: string, size: number, type: string) {
  const ext = extension(name); return /^[\w.-]{1,160}$/.test(name) && size > 0 && size <= MAX_SIZE && (allowed.get(ext)?.includes(type) ?? false);
}
function magicOk(ext: string, bytes: Buffer) {
  if (ext === "md") return !bytes.includes(0);
  if (ext === "zip") return bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) || bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (ext === "pdf") return bytes.subarray(0, 5).toString() === "%PDF-";
  if (ext === "png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (ext === "jpg" || ext === "jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (ext === "webp") return bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  return false;
}
function dto(a: typeof assetsTable.$inferSelect) {
  return { id: a.id, name: a.name, contentType: a.contentType, size: a.size, resourceId: a.resourceId, kind: a.kind, status: a.status, expiresAt: a.expiresAt?.toISOString() ?? null };
}
function fail(res: any, status: number, code: string, error: string) {
  res.status(status).json({ error, code });
}
async function cleanupExpiredPendingUploads(): Promise<void> {
  const now = new Date();
  const candidates = await db.select().from(assetsTable)
    .where(and(eq(assetsTable.status, "pending"), lt(assetsTable.expiresAt, now))).limit(25);
  for (const candidate of candidates) {
    // Claim before touching storage. A confirmation that started first changes
    // the row to confirmed, so it cannot be removed by this cleanup pass.
    const [claimed] = await db.update(assetsTable).set({ status: "cleaning" })
      .where(and(eq(assetsTable.id, candidate.id), eq(assetsTable.status, "pending"), lt(assetsTable.expiresAt, now))).returning();
    if (!claimed) continue;
    if (claimed.temporaryPath) await objectFile(claimed.temporaryPath).delete({ ignoreNotFound: true }).catch(() => undefined);
    await db.delete(assetsTable).where(and(eq(assetsTable.id, claimed.id), eq(assetsTable.status, "cleaning")));
  }
}

router.post("/admin/assets/upload", requireAdmin, sameOrigin, async (req, res): Promise<void> => {
  void cleanupExpiredPendingUploads().catch(() => undefined);
  const body = RequestAssetUploadBody.strict().safeParse(req.body);
  if (!body.success || !validInput(body.data.name, body.data.size, body.data.contentType) ||
    (body.data.kind === "cover" && !["png", "jpg", "jpeg", "webp"].includes(extension(body.data.name)))) {
    fail(res, 400, "UNSUPPORTED_FILE_METADATA", "Choose a supported file type under the 15 MiB limit.");
    return;
  }
  const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, body.data.resourceId));
  if (!resource) { fail(res, 400, "UNKNOWN_RESOURCE", "The resource does not exist."); return; }
  const root = process.env.PRIVATE_OBJECT_DIR;
  if (!root) { fail(res, 503, "STORAGE_UNAVAILABLE", "Private storage is unavailable."); return; }
  const temporaryPath = `${root.replace(/\/$/, "")}/ecomstack/pending/${randomUUID()}.${extension(body.data.name)}`;
  try {
    const [asset] = await db.insert(assetsTable).values({
      resourceId: resource.id, name: body.data.name, contentType: body.data.contentType, size: body.data.size,
      kind: body.data.kind, temporaryPath, expiresAt: new Date(Date.now() + PENDING_TTL_MS),
    }).returning();
    const uploadURL = await signPut(temporaryPath);
    res.json(RequestAssetUploadResponse.parse({ assetId: asset.id, uploadURL }));
  } catch {
    await db.delete(assetsTable).where(and(eq(assetsTable.temporaryPath, temporaryPath), eq(assetsTable.status, "pending"))).catch(() => undefined);
    fail(res, 503, "STORAGE_UNAVAILABLE", "Private storage is unavailable. Try again.");
  }
});

router.post("/admin/assets/confirm", requireAdmin, sameOrigin, async (req, res): Promise<void> => {
  const body = ConfirmAssetBody.strict().safeParse(req.body); if (!body.success) { fail(res, 400, "INVALID_ASSET", "The asset confirmation request is invalid."); return; }
  const [pending] = await db.select().from(assetsTable).where(eq(assetsTable.id, body.data.assetId));
  if (!pending) { fail(res, 404, "ASSET_NOT_FOUND", "The upload no longer exists."); return; }
  if (pending.status !== "pending" || !pending.temporaryPath) { fail(res, 409, "ASSET_NOT_CONFIRMABLE", "This upload is no longer waiting for validation."); return; }
  if (pending.expiresAt && pending.expiresAt <= new Date()) { fail(res, 410, "UPLOAD_EXPIRED", "This upload expired. Start the upload again."); return; }
  // Claim validation before reading storage. Cleanup only claims pending rows,
  // so an in-flight confirmation cannot have its object removed underneath it.
  const [asset] = await db.update(assetsTable).set({ status: "validating" })
    .where(and(eq(assetsTable.id, pending.id), eq(assetsTable.status, "pending"))).returning();
  if (!asset?.temporaryPath) { fail(res, 409, "ASSET_NOT_CONFIRMABLE", "This upload is already being processed."); return; }
  let promotedPath = "";
  try {
    const temp = objectFile(asset.temporaryPath); const [metadata] = await temp.getMetadata();
    const actualSize = Number(metadata.size); const contentType = String(metadata.contentType ?? "");
    const [head] = await temp.download({ start: 0, end: 4095 });
    if (actualSize !== asset.size || contentType !== asset.contentType || !validInput(asset.name, actualSize, contentType) || !magicOk(extension(asset.name), head)) {
      await temp.delete({ ignoreNotFound: true }); await db.delete(assetsTable).where(and(eq(assetsTable.id, asset.id), eq(assetsTable.status, "validating")));
      fail(res, 400, "UPLOAD_VALIDATION_FAILED", "The uploaded file failed size, type, extension, or file-signature validation."); return;
    }
    const objectPath = `${process.env.PRIVATE_OBJECT_DIR!.replace(/\/$/, "")}/ecomstack/confirmed/${asset.id}.${extension(asset.name)}`;
    // Copy only the generation whose bytes and metadata were inspected. A
    // late overwrite of the pending path cannot become the confirmed object.
    const snapshot = temp.bucket.file(temp.name, { generation: String(metadata.generation) });
    await snapshot.copy(objectFile(objectPath), { preconditionOpts: { ifGenerationMatch: 0 } });
    promotedPath = objectPath;
    await temp.delete({ ifGenerationMatch: String(metadata.generation) });
    const confirmed = await db.transaction(async (tx) => {
      const [row] = await tx.update(assetsTable).set({ objectPath, temporaryPath: null, status: "confirmed", confirmedAt: new Date(), expiresAt: null })
        .where(and(eq(assetsTable.id, asset.id), eq(assetsTable.status, "validating"))).returning();
      if (!row) throw new Error("Asset was changed while it was being confirmed");
      if (asset.kind === "cover") await tx.update(resourcesTable).set({ coverAssetId: asset.id }).where(eq(resourcesTable.id, asset.resourceId));
      return row;
    });
    res.json(ConfirmAssetResponse.parse(dto(confirmed)));
  } catch {
    if (promotedPath) await objectFile(promotedPath).delete({ ignoreNotFound: true }).catch(() => undefined);
    await db.update(assetsTable).set({ status: "pending", expiresAt: new Date(Date.now() + PENDING_TTL_MS) })
      .where(and(eq(assetsTable.id, asset.id), eq(assetsTable.status, "validating"))).catch(() => undefined);
    fail(res, 400, "UPLOAD_CONFIRMATION_FAILED", "The upload could not be validated and confirmed. Try again.");
  }
});
router.delete("/admin/assets/:id", requireAdmin, sameOrigin, async (req, res): Promise<void> => {
  const asset = await db.transaction(async (tx) => {
    const [candidate] = await tx.select().from(assetsTable).where(eq(assetsTable.id, String(req.params.id)));
    if (!candidate) return undefined;
    if (candidate.kind === "cover") await tx.update(resourcesTable).set({ coverAssetId: null })
      .where(and(eq(resourcesTable.id, candidate.resourceId), eq(resourcesTable.coverAssetId, candidate.id)));
    const [deleted] = await tx.delete(assetsTable).where(eq(assetsTable.id, candidate.id)).returning();
    return deleted;
  });
  if (!asset) { fail(res, 404, "ASSET_NOT_FOUND", "The asset does not exist."); return; }
  if (asset.objectPath) await objectFile(asset.objectPath).delete({ ignoreNotFound: true }).catch(() => undefined);
  res.json({ message: "Asset deleted" });
});
async function serve(assetId: string, req: Parameters<typeof router.get>[1] extends never ? never : any, res: any, cover = false): Promise<void> {
  const [asset] = await db.select().from(assetsTable).where(and(eq(assetsTable.id, assetId), eq(assetsTable.status, "confirmed")));
  if (!asset?.objectPath || (cover && (asset.kind !== "cover" || !asset.contentType.startsWith("image/")))) { res.status(404).json({ error: "Asset not found" }); return; }
  const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, asset.resourceId));
  const user = await currentUser(req);
  const developmentDemo = process.env.NODE_ENV !== "production" && resource?.isDemo && resource.status === "draft";
  if (!resource || (cover ? !(resource.status === "published" || developmentDemo) : !(resource.status === "published" || developmentDemo || user?.role === "admin"))) { res.status(404).json({ error: "Asset not found" }); return; }
  if (!cover) {
    if (!resource.isFree && !user) { res.status(401).json({ error: "Unauthorized" }); return; }
    if (!resource.isFree && user!.role !== "admin" && !await hasCompletedOnboarding(user!.id)) { res.status(403).json({ error: "Complete Shopify onboarding to access the Vault." }); return; }
    if (req.query.inline === "1" && (
      (asset.contentType !== "application/pdf" && !asset.contentType.startsWith("image/")) ||
      (!resource.isFree && !user)
    )) { res.status(403).json({ error: "Inline preview is not available" }); return; }
    if (user) await db.insert((await import("@workspace/db")).activityTable).values({ userId: user.id, resourceId: resource.id, action: "download" });
  }
  const file = objectFile(asset.objectPath); res.setHeader("Content-Type", asset.contentType); res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("Cache-Control", "no-store"); res.setHeader("Content-Disposition", `${cover || req.query.inline === "1" ? "inline" : "attachment"}; filename="${asset.name.replace(/[^\w.-]/g, "_")}"`);
  file.createReadStream().on("error", () => { if (!res.headersSent) res.status(404).end(); }).pipe(res);
}
router.get("/assets/:id/download", (req, res) => serve(String(req.params.id), req, res));
router.get("/assets/:id/cover", (req, res) => serve(String(req.params.id), req, res, true));
export default router;