import assert from "node:assert/strict";
import { test } from "node:test";
import { createMockImpactAdapter } from "./impact-mock";
import { fetchImpactPage, matchesPaidTrial, safeAffiliateUrl } from "./impact";

const claimId = "a".repeat(48);
const config = {
  campaignId: "test-campaign",
  eventTrackerId: "test-paid-trial",
  returnedField: "SubId1",
  acceptedStates: ["PENDING"],
};
const fixtures = createMockImpactAdapter(claimId).fixtures;

test("qualifying pending paid trial matches only the exact account", () => {
  assert.equal(matchesPaidTrial(fixtures.qualifying, config, claimId), true);
  assert.equal(matchesPaidTrial(fixtures.qualifying, config, "b".repeat(48)), false);
});

for (const key of ["wrongCampaign", "freeTrial", "missingId", "reversed", "wrongUser"] as const) {
  test(`${key} cannot qualify`, () => {
    assert.equal(matchesPaidTrial(fixtures[key], config, claimId), false);
  });
}

test("commission approval is not required; other event states remain ineligible", () => {
  assert.equal(matchesPaidTrial({ ...fixtures.qualifying, State: "APPROVED" }, config, claimId), false);
  assert.equal(matchesPaidTrial({ ...fixtures.qualifying, State: "APPROVED" }, { ...config, acceptedStates: ["APPROVED"] }, claimId), true);
  assert.equal(matchesPaidTrial(fixtures.reversed, { ...config, acceptedStates: ["REVERSED"] }, claimId), false);
});

test("configuration and tracking field must be exact", () => {
  assert.equal(matchesPaidTrial(fixtures.qualifying, { ...config, returnedField: "toString" }, claimId), false);
  assert.equal(matchesPaidTrial(fixtures.qualifying, { ...config, campaignId: "" }, claimId), false);
  assert.equal(matchesPaidTrial(fixtures.qualifying, { ...config, eventTrackerId: "test-free-trial" }, claimId), false);
  assert.equal(matchesPaidTrial({ ...fixtures.qualifying, Id: "" }, config, claimId), false);
});

test("affiliate link preserves approved destination and existing query parameters", () => {
  const result = new URL(safeAffiliateUrl("https://example.com/c/1/2/3?offer=abc&subId1=old", "subId1", claimId));
  assert.equal(result.origin, "https://example.com");
  assert.equal(result.pathname, "/c/1/2/3");
  assert.equal(result.searchParams.get("offer"), "abc");
  assert.equal(result.searchParams.get("subId1"), claimId);
  assert.equal(result.searchParams.getAll("subId1").length, 1);
});

test("affiliate URL rejects unsafe destinations and non-opaque claims", () => {
  for (const destination of ["javascript:alert(1)", "http://example.com/", "https://localhost/", "https://127.0.0.1/", "https://user:password@example.com/"]) {
    assert.throws(() => safeAffiliateUrl(destination, "subId1", claimId));
  }
  assert.throws(() => safeAffiliateUrl("https://example.com", "redirect", claimId));
  assert.throws(() => safeAffiliateUrl("https://example.com", "sharedId", "someone@example.com"));
});

test("mock adapter refuses production and has no entitlement-writing API", () => {
  const adapter = createMockImpactAdapter(claimId);
  assert.deepEqual(Object.keys(adapter).sort(), ["developmentOnly", "fetchActions", "fixtures"]);
  const prior = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try { assert.throws(() => createMockImpactAdapter(claimId), /disabled in production/); }
  finally {
    if (prior === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prior;
  }
});

test("API pagination parses action envelopes and never forwards authorization to returned URLs", async () => {
  const originalFetch = globalThis.fetch;
  let captured: URL | undefined;
  globalThis.fetch = async (input) => {
    captured = new URL(String(input));
    return new Response(JSON.stringify({ "@page": "1", "@numpages": "2", Actions: [fixtures.qualifying] }), { status: 200 });
  };
  try {
    const result = await fetchImpactPage({ startDate: "2026-09-01T00:00:00.123Z", endDate: "2026-09-02T00:00:00.123Z" });
    assert.equal(result.nextPage, 2);
    assert.equal(captured?.origin, "https://api.impact.com");
    assert.equal(captured?.searchParams.get("StartDate"), "2026-09-01T00:00:00Z");
    globalThis.fetch = async () => new Response(JSON.stringify({ "@nextpageuri": "https://evil.example/?Page=2", Actions: [fixtures.qualifying] }), { status: 200 });
    await assert.rejects(fetchImpactPage({ startDate: "2026-09-01", endDate: "2026-09-02" }), /pagination/);
  } finally { globalThis.fetch = originalFetch; }
});

test("provider rejection never includes response body or credentials", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("Sensitive provider body must not escape", { status: 401 });
  try {
    await assert.rejects(fetchImpactPage({ startDate: "2026-09-01", endDate: "2026-09-02" }), (error: Error) => {
      assert.match(error.message, /HTTP 401/);
      assert.doesNotMatch(error.message, /Sensitive provider/);
      return true;
    });
  } finally { globalThis.fetch = originalFetch; }
});