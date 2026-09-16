/**
 * Read-only Impact Partner API adapter.
 * Documentation checked 2026-09-14:
 * https://integrations.impact.com/partner-api-reference/reference/actions/actions
 * https://integrations.impact.com/brand-api-reference/readme/pagination
 * https://integrations.impact.com/brand-api-reference/readme/authentication
 *
 * Never log request URLs, authentication headers, or unfiltered API responses.
 */
export interface ImpactAction {
  Id: string;
  CampaignId: string;
  CampaignName: string;
  ActionTrackerId: string;
  ActionTrackerName: string;
  State: string;
  SubId1: string;
  SubId2: string;
  SubId3: string;
  SharedId: string;
  EventDate: string;
}

export interface MatchConfiguration {
  campaignId: string;
  eventTrackerId: string;
  returnedField: string;
  acceptedStates: string[];
}

export interface DiagnosticRecord {
  campaignId: string;
  campaignName: string;
  eventTrackerId: string;
  eventTrackerName: string;
  state: string;
  hasSubId1: boolean;
  hasSubId2: boolean;
  hasSubId3: boolean;
  hasSharedId: boolean;
}

const RETURNED_FIELDS = ["SubId1", "SubId2", "SubId3", "SharedId"] as const;
const OUTBOUND_PARAMETERS = ["subId1", "subId2", "subId3", "sharedId"];
const API_ORIGIN = "https://api.impact.com";
const PAGE_SIZE = 100;
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
const textValue = (value: unknown): string =>
  typeof value === "string" ? value : typeof value === "number" ? String(value) : "";

export class ImpactError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  constructor(code: string, message: string, retryable = false) {
    super(message);
    this.name = "ImpactError";
    this.code = code;
    this.retryable = retryable;
  }
}

function parseAction(value: unknown): ImpactAction {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ImpactError("INVALID_RESPONSE", "Impact returned an invalid action record.");
  }
  const row = value as Record<string, unknown>;
  const parsed: ImpactAction = {
    Id: textValue(row.Id),
    CampaignId: textValue(row.CampaignId),
    CampaignName: textValue(row.CampaignName),
    ActionTrackerId: textValue(row.ActionTrackerId),
    ActionTrackerName: textValue(row.ActionTrackerName),
    State: textValue(row.State),
    SubId1: textValue(row.SubId1),
    SubId2: textValue(row.SubId2),
    SubId3: textValue(row.SubId3),
    SharedId: textValue(row.SharedId),
    EventDate: textValue(row.EventDate),
  };
  if (!parsed.Id || !parsed.CampaignId || !parsed.ActionTrackerId || !parsed.State) {
    throw new ImpactError(
      "INCOMPLETE_ACTION",
      "Impact action records are missing required identifiers. Automatic matching cannot proceed.",
    );
  }
  return parsed;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  if (!response.body) throw new ImpactError("INVALID_RESPONSE", "Impact returned an empty response.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new ImpactError("RESPONSE_TOO_LARGE", "Impact returned an unexpectedly large response.");
      }
      chunks.push(value);
    }
    const decoded: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) throw new Error();
    return decoded as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ImpactError) throw error;
    throw new ImpactError("INVALID_RESPONSE", "Impact did not return the expected JSON response.");
  }
}

/** Pagination is followed by page number, never by fetching a returned URL. */
export async function fetchImpactPage(input: {
  startDate: string;
  endDate: string;
  campaignId?: string;
  page?: number;
}): Promise<{ actions: ImpactAction[]; nextPage: number | null }> {
  const sid = process.env.IMPACT_ACCOUNT_SID;
  const token = process.env.IMPACT_AUTH_TOKEN;
  if (!sid || !token) throw new ImpactError("NOT_CONFIGURED", "Impact API credentials are not configured.");
  // Do not echo invalid values; whitespace commonly indicates a paste error.
  if (!/^[A-Za-z0-9]+$/.test(sid) || token.trim() !== token) {
    throw new ImpactError("INVALID_CREDENTIAL_FORMAT", "Impact credentials contain unexpected characters or surrounding whitespace. Update them in Secrets.");
  }
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const page = input.page ?? 1;
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    end <= start ||
    end.getTime() - start.getTime() > 45 * 86400000 ||
    !Number.isSafeInteger(page) ||
    page < 1
  ) {
    throw new ImpactError("INVALID_WINDOW", "Impact requires a valid date window of at most 45 days and a positive page number.");
  }
  if (input.campaignId && !/^\d+$/.test(input.campaignId)) {
    throw new ImpactError("INVALID_CAMPAIGN", "Configure the numeric Impact campaign ID.");
  }
  const url = new URL(`/Mediapartners/${encodeURIComponent(sid)}/Actions`, API_ORIGIN);
  // This account rejects fractional seconds despite documenting date-time.
  url.searchParams.set("StartDate", start.toISOString().replace(/\.\d{3}Z$/, "Z"));
  url.searchParams.set("EndDate", end.toISOString().replace(/\.\d{3}Z$/, "Z"));
  url.searchParams.set("Page", String(page));
  url.searchParams.set("PageSize", String(PAGE_SIZE));
  if (input.campaignId) url.searchParams.set("CampaignId", input.campaignId);

  for (let attempt = 0; attempt < 3; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: "application/json", Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}` },
        signal: AbortSignal.timeout(20000),
        redirect: "error",
      });
    } catch {
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
        continue;
      }
      throw new ImpactError("NETWORK_ERROR", "Impact could not be reached. Verification remains pending; retry later.", true);
    }
    if (response.status === 401 || response.status === 403) {
      await response.body?.cancel();
      throw new ImpactError(
        "ACCESS_DENIED",
        `Impact returned HTTP ${response.status}. Check the Partner API token and its read access to attributed actions in Impact, then update Secrets if needed.`,
      );
    }
    if (response.status === 429 || response.status >= 500) {
      const retryAfter = response.headers.get("retry-after");
      await response.body?.cancel();
      const seconds = retryAfter
        ? (/^\d+$/.test(retryAfter) ? Number(retryAfter) : (Date.parse(retryAfter) - Date.now()) / 1000)
        : 2 ** attempt;
      // Long delays belong in the durable scheduler, not a web request.
      if (attempt < 2 && Number.isFinite(seconds) && seconds <= 10) {
        await new Promise(resolve => setTimeout(resolve, Math.max(seconds, 1) * 1000));
        continue;
      }
      throw new ImpactError("TEMPORARILY_UNAVAILABLE", `Impact returned HTTP ${response.status}. The next scheduled run can retry safely.`, true);
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new ImpactError("REQUEST_REJECTED", `Impact rejected the action request (HTTP ${response.status}). Check the API configuration.`);
    }
    const data = await readJson(response);
    if (!Array.isArray(data.Actions)) {
      throw new ImpactError("INVALID_RESPONSE", "Impact's response did not contain an Actions array. Automatic verification is blocked.");
    }
    const actions = data.Actions.map(parseAction);
    const pageCount = Number(data["@numpages"]);
    const nextUri = textValue(data["@nextpageuri"]);
    let nextPage: number | null = null;
    if (Number.isSafeInteger(pageCount) && pageCount >= 0) {
      nextPage = page < pageCount ? page + 1 : null;
    } else if (nextUri) {
      let parsedNext: URL;
      try { parsedNext = new URL(nextUri, API_ORIGIN); }
      catch { throw new ImpactError("INVALID_PAGINATION", "Impact returned invalid pagination metadata."); }
      const n = Number(parsedNext.searchParams.get("Page") ?? parsedNext.searchParams.get("page"));
      if (parsedNext.origin !== API_ORIGIN || !Number.isSafeInteger(n) || n !== page + 1) {
        throw new ImpactError("INVALID_PAGINATION", "Impact returned unexpected pagination metadata. The sync checkpoint is retained.");
      }
      nextPage = n;
    } else if (actions.length >= PAGE_SIZE && data["@numpages"] === undefined) {
      throw new ImpactError("MISSING_PAGINATION", "Impact returned a full page without pagination metadata. Verification is blocked to avoid skipping records.");
    }
    return { actions, nextPage };
  }
  throw new ImpactError("TEMPORARILY_UNAVAILABLE", "Impact is temporarily unavailable.", true);
}

export function redactedAction(action: ImpactAction): DiagnosticRecord {
  return {
    campaignId: action.CampaignId,
    campaignName: action.CampaignName,
    eventTrackerId: action.ActionTrackerId,
    eventTrackerName: action.ActionTrackerName,
    state: action.State,
    hasSubId1: Boolean(action.SubId1),
    hasSubId2: Boolean(action.SubId2),
    hasSubId3: Boolean(action.SubId3),
    hasSharedId: Boolean(action.SharedId),
  };
}

/** Read-only connection diagnostic; no user matching, writes or access grants. */
export async function diagnoseImpact(): Promise<{ records: DiagnosticRecord[]; message: string }> {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 86400000);
  const records: DiagnosticRecord[] = [];
  let page: number | null = 1;
  const seen = new Set<string>();
  let inspected = 0;
  while (page !== null && page <= 3) {
    const result = await fetchImpactPage({ startDate: start.toISOString(), endDate: end.toISOString(), page });
    inspected += result.actions.length;
    for (const action of result.actions) {
      const redacted = redactedAction(action);
      const key = JSON.stringify(redacted);
      if (!seen.has(key)) { seen.add(key); records.push(redacted); }
    }
    page = result.nextPage;
  }
  return {
    records,
    message: `Impact connection succeeded. Inspected ${inspected} action records updated within the last 30 days${page ? " (sample limited to three pages)" : ""}. This does not prove Shopify paid-trial tracking. Confirm the exact campaign, event and claim field with a live referral test.`,
  };
}

export function matchesPaidTrial(action: ImpactAction, config: MatchConfiguration, claimId: string): boolean {
  if (!claimId || !config.campaignId || !config.eventTrackerId || !action.Id) return false;
  if (!RETURNED_FIELDS.includes(config.returnedField as typeof RETURNED_FIELDS[number])) return false;
  if (action.State === "REVERSED" || !["PENDING", "APPROVED"].includes(action.State)) return false;
  if (!Array.isArray(config.acceptedStates) || !config.acceptedStates.includes(action.State)) return false;
  const returned = action[config.returnedField as typeof RETURNED_FIELDS[number]];
  return action.CampaignId === config.campaignId &&
    action.ActionTrackerId === config.eventTrackerId &&
    Boolean(returned) && returned === claimId;
}

/** Only called using the admin-approved destination, never a browser-provided URL. */
export function safeAffiliateUrl(destination: string, parameter: string, claim: string): string {
  if (!OUTBOUND_PARAMETERS.includes(parameter) || !/^[A-Za-z0-9]{16,255}$/.test(claim)) {
    throw new ImpactError("INVALID_TRACKING", "Affiliate tracking is not configured correctly.");
  }
  let url: URL;
  try { url = new URL(destination); }
  catch { throw new ImpactError("INVALID_DESTINATION", "Configure an approved HTTPS affiliate link."); }
  if (url.protocol !== "https:" || url.username || url.password ||
      url.hostname === "localhost" || !url.hostname.includes(".") ||
      /^[\d.:]+$/.test(url.hostname) || url.hostname.endsWith(".local") || url.port) {
    throw new ImpactError("INVALID_DESTINATION", "Configure an approved public HTTPS affiliate link.");
  }
  // A conflicting parameter in a different case can break attribution.
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase() === parameter.toLowerCase()) url.searchParams.delete(key);
  }
  url.searchParams.set(parameter, claim);
  return url.toString();
}