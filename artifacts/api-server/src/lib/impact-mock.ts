import type { ImpactAction } from "./impact";

/**
 * Pure fixture adapter for local tests. No DB dependency and no grant-writing
 * capabilities. The live adapter never imports or falls back to this module.
 */
export function createMockImpactAdapter(claimId: string) {
  if (process.env.NODE_ENV === "production") throw new Error("Mock Impact is disabled in production.");
  const qualifying: ImpactAction = {
    Id: "test-action-1",
    CampaignId: "test-campaign",
    CampaignName: "Development test campaign",
    ActionTrackerId: "test-paid-trial",
    ActionTrackerName: "Development test paid trial",
    State: "PENDING",
    SubId1: claimId,
    SubId2: "",
    SubId3: "",
    SharedId: "",
    EventDate: "2026-09-14T12:00:00Z",
  };
  return {
    developmentOnly: true as const,
    fetchActions: async () => [qualifying],
    fixtures: {
      qualifying,
      wrongCampaign: { ...qualifying, CampaignId: "another-campaign" },
      freeTrial: { ...qualifying, ActionTrackerId: "test-free-trial" },
      missingId: { ...qualifying, SubId1: "" },
      reversed: { ...qualifying, State: "REVERSED" },
      wrongUser: { ...qualifying, SubId1: "another-user-claim" },
    },
  };
}