# EcomStack

An ecommerce resource library with public previews, member bookmarks, protected prompts and downloads, Shopify paid-trial attribution through Impact, and a private publishing dashboard.

## Current launch status

- The Impact Partner API connection was successfully checked read-only on September 14, 2026.
- The account exposes Shopify campaign **13624**, **Paid Trial** tracker **34051**, with **PENDING** actions. Free Trial and Full Price Shop events are distinct and do not qualify.
- The sampled actions had no SubId1, SubId2, SubId3 or SharedId values. **End-to-end attribution has not been proven.**
- Automatic verification starts disabled. A real approved affiliate link, a demonstrated user-claim match, and confirmation that the affiliate agreement permits this incentive are required before enabling it.
- Development examples are editable draft demo resources, not proprietary resources. Production excludes drafts. Review and explicitly publish resources before launch.
- There is no customer billing, generation-credit system, or recurring Shopify-store activity requirement.

## Stack and development

React/Vite frontend, Express/TypeScript API, Clerk authentication, PostgreSQL/Drizzle, and private Replit App Storage.

Use the configured EcomStack and API Server workflows for the preview. The API is mounted at `/api`; the frontend is mounted at `/`.

```sh
pnpm install
pnpm run typecheck
pnpm --filter @workspace/db run push       # DEVELOPMENT only
pnpm --filter @workspace/scripts seed:ecomstack
pnpm --filter @workspace/scripts exec tsx --test ../artifacts/api-server/src/lib/impact.test.ts
```

The OpenAPI contract lives in `lib/api-spec/openapi.yaml`. After editing it:

```sh
pnpm --filter @workspace/api-spec run codegen
```

Database migrations are retained in `lib/db/drizzle/`. There is no startup-time schema migration. Replit's Publish flow applies development-to-production schema changes; inspect the schema diff before confirming publication.

## Secrets and configuration

Save credentials in Replit Secrets, never in source code, chat, URL parameters, or configuration files:

| Key | Purpose |
| --- | --- |
| `IMPACT_ACCOUNT_SID` | Impact Partner API Account SID |
| `IMPACT_AUTH_TOKEN` | Impact Partner API read-access token |
| `CLERK_SECRET_KEY` | Provisioned authentication secret |
| `CLERK_PUBLISHABLE_KEY` / `VITE_CLERK_PUBLISHABLE_KEY` | Provisioned Clerk keys |
| `DATABASE_URL` | Replit-managed database connection |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS` | Provisioned App Storage configuration |

The app does not return credentials in admin APIs. Rotate any credential exposed outside the secret store. Clerk development and production accounts are separate: development signups are not production users.

Nonsecret sample settings are in `config/ecomstack.example.json`. Edit real settings through **Admin → Settings**, not by pasting secrets into that page.

## First administrator

Public signups never become admins automatically.

1. Sign in to the app once so it creates the local member record.
2. Obtain that user's Clerk user ID from the authentication administration tools or the local users table. Verify the identity independently.
3. From a trusted project shell, explicitly assign the role:

```sh
pnpm --filter @workspace/scripts admin:grant -- user_REPLACE_WITH_VERIFIED_ID "Initial owner setup"
```

4. Refresh the signed-in app and open `/admin`.

The command requires an existing member and a nonempty audit reason. Do not expose it as an HTTP endpoint. Production owner setup is a separate action against the production user store; use the production database administration UI to set the verified member's role. Never promote a user solely because they signed up first.

## Publishing resources

Use **Admin → Resources** to create/edit a resource:

- Keep its public preview separate from protected content.
- Set category, format, tool, tags, use case, version, and instructions.
- An optional YouTube tutorial can be attached.
- Mark genuinely free resources with the Free option.
- Preview, publish, unpublish, or archive explicitly. Unpublished/archived production resources are not retrievable through public content URLs.
- The resource slug is its shareable URL; choose stable slugs.
- Resource text is rendered as Markdown without raw HTML execution.

Upload `.md`, `.zip`, `.pdf`, `.png`, `.jpg`, `.jpeg`, or `.webp` files, up to 15 MB. Covers must be raster images. Uploads go directly to a short-lived App Storage URL; confirmation validates the uploaded file before attaching an immutable private object. Uploaded ZIPs and skills are never executed or extracted.

Downloads are authorized on every request. Public covers are restricted to designated cover images, never arbitrary private assets. PDF viewing uses the same protected route as downloads. Updating or revoking a member's access affects future requests; it cannot retract a file they already downloaded.

## Impact configuration

Official references:

- [Attributed actions](https://integrations.impact.com/partner-api-reference/reference/actions/actions)
- [Authentication](https://integrations.impact.com/brand-api-reference/readme/authentication)
- [Pagination](https://integrations.impact.com/brand-api-reference/readme/pagination)
- [Tracking parameters](https://help.impact.com/partner/what-would-you-like-to-learn-about/platform-features/tracking/tracking-links/link-parameters/sub-id-and-shared-id-parameters-explained-for-partners)

1. Store an Impact Partner API token with read access to attributed actions.
2. Run **Admin → Impact → Diagnostic**. This shows campaign/event names and IDs, states, and whether tracking fields are populated. It does not expose customer/order data or raw tracking identifiers.
3. Configure the exact Shopify campaign and Paid Trial tracker observed in your own account. Provisional values from the initial read-only check are supplied, not treated as proof of attribution.
4. Enter your approved Impact affiliate URL. The backend preserves this destination and appends its own opaque random claim ID. It does not accept a user-provided redirect destination.
5. Choose a supported paired parameter: `subId1` → `SubId1`, `subId2` → `SubId2`, `subId3` → `SubId3`, or `sharedId` → `SharedId`.
6. Configure allowed paid-trial states based on real reporting. An observed `PENDING` paid trial can qualify without waiting for commission settlement; `REVERSED` never grants new access.
7. Configure accurate eligibility and offer copy. No promotional price or duration is assumed.

One referral can be assigned to one account. Grants and referral processing are transactional/idempotent. Manual grants are labeled manual and do not inflate verified paid-trial reporting. Later reversals are recorded for admin review, not silently revoked. Admin access changes require a reason and audit record.

## Scheduled sync and publishing

Publish the web frontend **and** API service; a frontend-only static deployment cannot provide authentication, verification, or protected resources. The artifact manifests contain their build/run settings.

Verification uses a single-run worker with persisted PostgreSQL checkpoints and a database lock—not an in-process timer:

```sh
pnpm --filter @workspace/scripts impact:sync
```

Configure a durable **Scheduled Deployment/job** to run that command **every five minutes** (`*/5 * * * *`) against the same production database and Impact secrets. The web application itself must remain a web/API deployment, not a scheduled deployment. Scheduling requires publishing/setup; the development preview does not run recurring jobs automatically.

The worker retains unfinished date windows/pages, uses pagination and overlapping update windows, and applies retry backoff after failures. Admin settings control the minimum sync interval. Check admin sync status, last-success time, next check, and error state after deployment. Run diagnostics manually first; do not enable live grants just to test the scheduler.

The member's rate-limited **Check my signup** button does not bypass verification. API outages leave the account pending.

## End-to-end live referral test

Before a public launch:

1. Confirm the affiliate agreement allows the resource-vault incentive and the proposed offer copy.
2. Rotate any previously exposed Impact token.
3. Configure the real affiliate link and the exact observed campaign/event/state mapping; keep automatic verification off initially.
4. Create a fresh eligible test member, choose/save a resource, and click the tracked Shopify signup button.
5. Complete an eligible paid trial under Shopify's terms. An existing store, click, free trial, screenshot, or signup outside the tracked link is not proof.
6. Wait for reporting, then use the admin diagnostic to verify the returned claim field. Confirm the actual returned ID matches the server-created claim for that member; presence of any tracking value alone is insufficient.
7. Mark tracking and incentive approval as confirmed only after these checks. Enable verification and run the sync.
8. Confirm only the correct account unlocks and resumes its chosen resource. Re-run sync to check duplicate prevention. Check an unrelated locked account and direct content/download URLs.
9. Verify upload/publish/edit persistence, member copy/download/PDF viewing, and mobile navigation.
10. Confirm the scheduled production worker is running and errors are visible.

If Impact reporting does not return the user claim ID on the exact paid-trial event, automatic attribution remains blocked. Use the support workflow to investigate; do not call an admin exception a verified referral.

## Test boundaries

The isolated development mock adapter has no database or grant-writing capability and rejects production use. Unit tests exercise matching, wrong campaign/event/user/ID, reversed states, safe affiliate URLs, pagination, and sanitized API errors.

Mock passing results and a successful read-only API connection are **not** evidence of live Shopify attribution. A complete production referral journey and browser acceptance tests remain launch checks.