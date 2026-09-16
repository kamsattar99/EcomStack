import { and, eq } from "drizzle-orm";
import { assetsTable, db, pool, resourcesTable } from "@workspace/db";
import { objectStorageClient } from "./lib/objectStorage";
import { logger } from "./lib/logger";

const root = process.env.PRIVATE_OBJECT_DIR;
if (!root) throw new Error("PRIVATE_OBJECT_DIR is not configured; App Storage assets cannot be seeded.");
function file(fullPath: string) {
  const [bucketName, ...parts] = fullPath.replace(/^\/+/, "").split("/");
  if (!bucketName || !parts.length) throw new Error("Invalid private object path");
  return objectStorageClient.bucket(bucketName).file(parts.join("/"));
}
function minimalPdf(title: string): Buffer {
  const body = `BT /F1 18 Tf 72 720 Td (${title.replace(/[()\\]/g, "")}) Tj ET`;
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${body.length} >>\nstream\n${body}\nendstream`];
  let output = "%PDF-1.4\n"; const offsets = [0];
  objects.forEach((object, i) => { offsets.push(Buffer.byteLength(output)); output += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(output); output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(output);
}
try {
  const resources = await db.select().from(resourcesTable).where(eq(resourcesTable.isDemo, true));
  for (const resource of resources) {
    const pdf = resource.type === "Cheat Sheet";
    const name = `${resource.slug}.${pdf ? "pdf" : "md"}`;
    const [existing] = await db.select().from(assetsTable).where(and(eq(assetsTable.resourceId, resource.id), eq(assetsTable.name, name)));
    if (existing) continue;
    const body = pdf ? minimalPdf(resource.title) : Buffer.from(`# ${resource.title}\n\n${resource.preview}\n\n${resource.instructions}\n`, "utf8");
    const objectPath = `${root.replace(/\/$/, "")}/ecomstack/seed/${resource.id}/${name}`;
    await file(objectPath).save(body, { contentType: pdf ? "application/pdf" : "text/markdown", resumable: false, validation: false });
    await db.insert(assetsTable).values({ resourceId: resource.id, name, contentType: pdf ? "application/pdf" : "text/markdown", size: body.length, kind: "file", status: "confirmed", objectPath, confirmedAt: new Date() });
  }
  logger.info({ count: resources.length }, "Seeded EcomStack development assets");
} finally {
  await pool.end();
}