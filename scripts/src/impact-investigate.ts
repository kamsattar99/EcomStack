/** Read-only diagnostic: prints structure and redacted evidence, never raw records. */
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { db, pool, claimsTable, usersTable } from "@workspace/db";

const sid = process.env.IMPACT_ACCOUNT_SID!;
const token = process.env.IMPACT_AUTH_TOKEN!;
const hash = (value: string) => createHash("md5").update(value).digest("hex");
async function api(path: string, query: Record<string, string> = {}) {
  const url = new URL(`/Mediapartners/${sid}/${path}`, "https://api.impact.com");
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const response = await fetch(url, { headers: { Accept: "application/json", Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}` }, redirect: "error", signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${path}`);
  const data = await response.json();
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid response envelope");
  return data as Record<string, any>;
}
function shape(value: unknown): unknown {
  if (Array.isArray(value)) return { type: "array", length: value.length, sampleStructure: value.length ? shape(value[0]) : null };
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  return value === null ? null : value === "" ? "" : `[${typeof value}: redacted]`;
}
try {
  const mode = process.argv[2] ?? "actions";
  if (mode === "reports") {
    const data = await api("Reports");
    console.log(JSON.stringify({ keys: Object.keys(data), reports: data.Reports?.map((r: any) => ({ id: r.Id, name: r.Name, accessible: r.ApiAccessible, description: r.Description })) }));
  } else if (mode === "metadata") {
    const id = process.argv[3]; if (!/^[\w-]+$/.test(id)) throw new Error("Invalid report ID");
    const data = await api(`Reports/${id}/MetaData`);
    console.log(JSON.stringify(data).replaceAll(sid, "[ACCOUNT]").replaceAll(token, "[REDACTED]"));
  } else {
    const prod = JSON.parse(await readFile("/tmp/impact-production-fingerprints.json", "utf8"));
    const rows = prod.output.trim().split("\n").slice(1).map((line: string) => line.split(","));
    const fingerprints = new Map<string, string>(rows.map((r: string[], i: number) => [r[0], `production-claim-${i + 1}`]));
    const localClaims = await db.select().from(claimsTable);
    const users = await db.select().from(usersTable);
    console.log(JSON.stringify({ environmentComparison: localClaims.map(c => ({ createdAt: c.createdAt, sameClaimInProduction: fingerprints.get(hash(c.trackingId)) ?? false, sameOwnerInProduction: rows.some((r: string[]) => r[1] === hash(users.find(u => u.id === c.userId)!.clerkId)) })) }));
    const matches: unknown[] = [];
    const fieldPaths = new Set<string>();
    const store = process.argv[4] ?? "";
    function inspect(value: unknown, path: string, record: Record<string, any>) {
      if (value && typeof value === "object") {
        for (const [key, v] of Object.entries(value)) inspect(v, `${path}.${key}`, record);
      } else {
        fieldPaths.add(path);
        if (typeof value === "string") {
          const match = fingerprints.get(hash(value)) ?? (value.match(/[a-f0-9]{48}/g) ?? []).map(v => fingerprints.get(hash(v))).find(Boolean);
          const storeMatch = store && value.toLowerCase().includes(store.toLowerCase());
          if (match || storeMatch) matches.push({ matchedClaim: match ?? null, storeMatch: !!storeMatch, field: path, campaign: record.CampaignId ?? record.Campaign ?? record.Program, tracker: record.ActionTrackerId ?? record.Event_Type, state: record.State ?? record.Status, metrics: Object.fromEntries(Object.entries(record).filter(([k]) => /^(Clicks|Actions|raw_clicks|click_date|Action_Date|paid_trial_api_actions|free_trial_api_actions|Classification|error_code)$/.test(k))), hasActionId: !!(record.Action_Id ?? record.Id), hasClickId: !!record.click_id });
        }
      }
    }
    let page = 1, total = 0;
    const counts: Record<string, number> = {};
    const trackingFields: Record<string, { present: number; empty: number; populated: number }> = {};
    const baseQuery = { StartDate: "2026-09-12T00:00:00Z", EndDate: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"), CampaignId: "13624" };
    if (mode === "report") {
      const id = process.argv[3]; if (!/^[\w-]+$/.test(id)) throw new Error("Invalid report ID");
      const records: any[] = [];
      let pages = 1;
      for (let p = 1; p <= pages; p++) {
        const data = await api(`Reports/${id}`, { START_DATE: "2026-09-15", END_DATE: "2026-09-16", SUBAID: "13624", Program: "13624", Page: String(p) });
        pages = Number(data["@numpages"]);
        if (!Number.isFinite(pages) || pages > 100) throw new Error("Unknown pagination; report incomplete");
        records.push(...(data.Records ?? []));
      }
      for (const r of records) inspect(r, "", r);
      const trackingSummary = records.map(r => ({
        campaign: r.Campaign ?? r.Program ?? "Shopify-specific report",
        fields: Object.fromEntries(Object.entries(r).filter(([k]) => /subid|shared/i.test(k)).map(([k,v]) => [k, v === "" ? "empty" : typeof v === "string" && /^\s*(?:&nbsp;|-|0|N\/A|None|Total)?\s*$/i.test(v) ? "blank/placeholder" : v === "ecomstackconnectivitycheck" ? "known synthetic diagnostic ID (not a user)" : "other value (redacted)"]))
      }));
      console.log(JSON.stringify({ report: id, pages, complete: true, count: records.length, fieldPaths: [...fieldPaths], matches, trackingSummary, sample: shape(records[0]) }));
    } else {
      for (;;) {
        const data = await api("Actions", { ...baseQuery, Page: String(page), PageSize: "100" });
        if (page === 1) console.log(JSON.stringify({ envelopeStructure: shape({ ...data, Actions: undefined }), redactedRawExample: shape(data.Actions?.find((r: any) => String(r.ActionTrackerId) === "34051") ?? data.Actions?.[0]) }));
        for (const r of data.Actions ?? []) {
          total++; inspect(r, "", r);
          const key = `${r.CampaignId}/${r.ActionTrackerId}/${r.State}`; counts[key] = (counts[key] ?? 0) + 1;
          for (const f of ["SubId1", "SubId2", "SubId3", "SharedId"]) {
            const c = trackingFields[f] ??= { present: 0, empty: 0, populated: 0 };
            if (Object.hasOwn(r, f)) { c.present++; if (r[f] === "" || r[f] == null) c.empty++; else c.populated++; }
          }
        }
        const pages = Number(data["@numpages"]);
        if (!Number.isFinite(pages)) throw new Error("Unknown pagination; inspection incomplete");
        if (page >= pages) break;
        if (++page > 100) throw new Error("Page cap; inspection incomplete");
      }
      console.log(JSON.stringify({ checkedAt: new Date().toISOString(), query: baseQuery, pages: page, total, complete: true, counts, trackingFields, rawFieldPaths: [...fieldPaths], matches }));
    }
  }
} catch (error) {
  console.log(JSON.stringify({ error: error instanceof Error && /^HTTP \d+ for/.test(error.message) ? error.message : "Inspection failed without exposing raw response" }));
  process.exitCode = 1;
} finally { await pool.end(); }