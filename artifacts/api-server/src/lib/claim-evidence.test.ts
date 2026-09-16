import { test } from "node:test";
import assert from "node:assert/strict";
import { checkClaimEvidence } from "./claim-evidence";

test("read-only verification distinguishes absent, free, qualifying and reversed events", async () => {
  const original = globalThis.fetch;
  const config = { campaignId: "13624", eventTrackerId: "34051", returnedField: "SubId1", acceptedStates: ["PENDING"] };
  const claim = "a".repeat(48);
  const paid = { Id: "fixture", CampaignId: "13624", ActionTrackerId: "34051", State: "PENDING", SubId1: claim };
  try {
    for (const [actions, expected] of [
      [[], /not yet reported/],
      [[{ ...paid, ActionTrackerId: "26125" }], /not a qualifying paid trial/],
      [[paid], /qualifying Shopify paid trial matches/],
      [[{ ...paid, State: "REVERSED" }], /not a qualifying paid trial/],
      [[{ ...paid, SubId1: "anotherAccount" }], /not yet reported/],
    ] as const) {
      globalThis.fetch = async () => new Response(JSON.stringify({ Actions: actions, "@numpages": "1" }), { status: 200 });
      assert.match(await checkClaimEvidence(claim, new Date(), config), expected);
    }
    globalThis.fetch = async () => new Response("provider private details", { status: 401 });
    await assert.rejects(checkClaimEvidence(claim, new Date(), config), /HTTP 401/);
  } finally { globalThis.fetch = original; }
});