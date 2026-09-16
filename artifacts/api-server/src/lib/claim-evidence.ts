import { fetchImpactPage, matchesPaidTrial, type MatchConfiguration } from "./impact";

/** Read-only evidence check. Never writes referrals or grants access. */
export async function checkClaimEvidence(trackingId: string, createdAt: Date, config: MatchConfiguration): Promise<string> {
  const end = new Date();
  const start = new Date(Math.max(end.getTime() - 44 * 86400000, createdAt.getTime() - 86400000));
  let page: number | null = 1;
  let relatedEvent = false;
  while (page !== null && page <= 20) {
    const result = await fetchImpactPage({ startDate: start.toISOString(), endDate: end.toISOString(), campaignId: config.campaignId, page });
    for (const action of result.actions) {
      if (matchesPaidTrial(action, config, trackingId)) {
        return "A qualifying Shopify paid trial matches your account. Automatic unlocking is not enabled yet; the administrator must finish the tracking and affiliate approval checks.";
      }
      if (action.CampaignId === config.campaignId &&
          ["SubId1", "SubId2", "SubId3", "SharedId"].some(field => action[field as "SubId1"] === trackingId)) relatedEvent = true;
    }
    page = result.nextPage;
  }
  if (page !== null) return "The reporting check reached its page limit. No qualifying match was found in the checked pages; verification is incomplete. Please contact support.";
  if (relatedEvent) return "Impact has reported an event for your tracking ID, but it is not a qualifying paid trial under the configured rules. A free signup alone does not unlock access.";
  return "Impact has not yet reported a qualifying paid trial with your account’s tracking ID. Reporting can be delayed. If you completed only the free signup, the eligible paid trial is still required.";
}