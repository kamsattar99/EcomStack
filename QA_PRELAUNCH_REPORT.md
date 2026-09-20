# EcomStack pre-launch QA report

**Audit date:** 20 September 2026  
**Version tested:** Current workspace state, including the fixes listed below. All writes and browser journeys were run only in preview.
**Environments:** Preview (isolated QA accounts and disposable resources); production (non-destructive HTTP/API checks only).
**Browsers:** Chromium through the Playwright test environment. Desktop, tablet, and mobile viewports were emulated. No physical-device or alternate-browser testing was performed.

## Decision: NOT READY TO PUBLISH

The preview onboarding, resource access, and admin lifecycle now pass for text-only resources. Publishing is still blocked by production inventory, a high-severity storage dependency advisory, controlled-email coverage, and untested attachment lifecycle coverage. Impact attribution is **not** a launch blocker and is not used to grant, revoke, or deny Vault access.

## Fixes made during this audit

| Priority | Issue | Fix | Retest result |
| --- | --- | --- | --- |
| P1 | Workspace and web production builds failed outside workflow execution because Vite required runtime-only `PORT` and `BASE_PATH`. | Added safe artifact defaults for the EcomStack web and mockup sandbox Vite configurations. | PASS — root build completes. |
| P2 | API reflected arbitrary origins while allowing credentials despite being same-origin. | Removed credentialed CORS middleware. | PASS — preview API and browser journey remain functional after restart. |
| P2 | Clerk appearance pointed to a missing `logo.svg`. | Switched to the existing branded `favicon.svg` asset. | PASS — asset returns HTTP 200. |
| P1 | Admin URL imports allowed SSRF-prone remote fetching. | Removed the UI entry point and made the import endpoint return `410 Gone`; manual authoring and uploads remain. | PASS — no URL-import path remains available to administrators. |
| P2 | Reopening an existing admin resource crashed while initial form values loaded. | Made the publish checklist tolerate transient partial form values. | PASS — published fixture reopens and saves successfully. |
| P2 | Admins could publish but not archive a resource. | Added an explicit archive action using the validated admin update route. | PASS — archived fixture persists as archived, is absent from ordinary lists, and direct ordinary access returns 404. |
| P2 | Resource visits did not populate Recently viewed. | Added a typed `view` activity event after authenticated protected content has loaded. | PASS — completed member sees the two visited resources; denied incomplete-member requests create no activity. |

## Functional results

| Area | Result | Expected behaviour | Actual result / evidence |
| --- | --- | --- | --- |
| Landing CTAs | PASS | Signup actions reach signup details. | Two visible primary CTAs reached `/sign-up`. |
| Global affiliate banner | PASS | Appears once, discloses the affiliate relationship, and uses the approved Shopify destination. | Banner appeared once, included “We may earn a commission,” and exposed `https://shopify.pxf.io/the-ecom-king` without opening it. |
| Signup detail validation | PASS | First/last name required; optional phone validated. | Blank names were blocked and phone `123` was rejected. |
| Clerk boundary | PASS / BLOCKED | Valid detail step reaches live Clerk sign-up; real email verification should work. | Details reached `/sign-up/auth`. Live Clerk sign-up was not submitted to avoid an uncontrolled email. Verification, resend, expiry, social login, and duplicate-account cases remain blocked pending a controlled mailbox. |
| Shopify review and final confirmation | PASS | Self-declaration is required; marketing is optional; final confirmation is separate. | Required declaration began unchecked, marketing was optional, and only the final “Yes” confirmation completed onboarding. |
| Claim initiation | PASS | Starting a tracked-link claim must not complete onboarding. | Preview `POST /api/claims/start` returned 200 and left `onboardingCompleted:false`; the browser did not navigate externally. |
| Onboarding persistence | PASS | Saved final confirmation completes onboarding and persists. | QA Completed reached `/dashboard`; `/api/me` returned `onboardingCompleted:true` with marketing still false. |
| Incomplete direct-route guard | PASS | Incomplete members cannot bypass onboarding through direct URLs or content calls. | Dashboard/final-confirmation routes redirected to onboarding; protected content returned 403 without activity or data leakage. |
| Resource discovery and filters | PASS | Search, type/category/tool filters, and sorting work on published resources. | Three disposable published fixtures were found by search and filters; alphabetical order was Aurora, Northstar, Signal Lantern. |
| Resource content, related items, copying, bookmarks | PASS | Completed member can open, copy, save/unsave, and navigate related published resources. | Prompt, Skill, and Cheat Sheet showed their exact fixture content and related links; save/un-save survived reload and was cleaned up. |
| Recently viewed | PASS | Successfully opened protected resources appear on the member dashboard. | Fresh completed-member session showed Prompt and Skill in `/api/me` and dashboard. A denied incomplete-member request left `recentResources` empty. |
| Admin authoring lifecycle | PASS (text-only) | Admin can create, edit, publish, archive, and preview resources. | QA Admin created Prompt, Skill, Cheat Sheet, draft, and published-then-archived fixtures through the UI. Text changes autosaved and archive persisted. |
| Attachment upload, replacement, removal, download | BLOCKED | Isolated preview storage must support the complete protected-file lifecycle. | Replit managed storage could not inspect or create the requested `ecomstack-preview` bucket. Existing shared bucket settings and files were not touched. |
| Responsive auth UI | PASS (limited) | No overflow, visible focus, reduced motion, and readable controls at representative widths. | Signup UI inspected at 1440, 1280, 768, 390, and 375px. Full keyboard/screen-reader coverage remains untested. |

## Security and access-control checks

| Check | Result | Evidence / notes |
| --- | --- | --- |
| Guest member/admin access | PASS | Preview `/api/me`, admin endpoints, and paid content returned server-side denials. Published content returned 401 for guests; archived/unknown resources returned 404. |
| Completed member protected content | PASS | Prompt, Skill, and Cheat Sheet content endpoints each returned 200 with expected fixture content. |
| Incomplete member protected content | PASS | An isolated incomplete member received 403 for every published protected resource and no saved/recent data was created. |
| Admin resource access | PASS | QA Admin received 200 for published and archived fixture content; ordinary member and guest access to archived resources returned 404. |
| Member isolation | PASS | Completed member’s temporary saved resource was not present in an incomplete member’s `/api/me`; cleanup restored the completed account to no saved resources. |
| Same-origin mutation model | PASS after fix | Credentialed reflected CORS was removed; browser flow still worked after API restart. |
| Draft/demo production rule | PASS | Automated runtime-site test confirms development settings cannot expose draft demos in production. |
| Impact and access separation | PASS | Self-declaration completion records `onboarding_completed`; content access checks authenticated completed onboarding. Missing, unmatched, failed, or reversed Impact events never revoke or deny access. Only explicit admin access management can revoke access. |
| Dependency audit | FAIL — P1 | One high-severity advisory: `uuid@9.0.1` via the `@google-cloud/storage` dependency chain (`GHSA-w5hq-g745-h8pq`). A compatible upstream dependency update and storage regression test are required. |
| Static analysis | PASS with review item | One medium weak-hash finding in an Impact investigation utility. It is not an exposed request path but should be reviewed before security sign-off. |
| Privacy/dataflow scan | PASS | No HoundDog findings. |
| Admin URL import | PASS after mitigation | The remote URL import UI was removed and its endpoint returns 410, eliminating the audited request path. |

## Build and automated checks

| Check | Result |
| --- | --- |
| API contract generation and library type checks | PASS |
| API server type check | PASS |
| EcomStack web type check | PASS |
| EcomStack production build | PASS |
| Preview API workflow restart | PASS — server listening on port 8080 |
| Preview web workflow restart | PASS — Vite served successfully |
| Browser console | PASS with expected preview-only Clerk development-key warnings and transient Vite reconnect output during workflow restarts |
| Production health endpoint | PASS — both configured production URLs returned `/api/healthz` HTTP 200 |

## Production readiness findings

1. **P1 — Replace test inventory.** Production currently exposes one published paid resource titled `test` (`test1`). This is not launch-ready Vault content.
2. **P1 — Update the high-severity UUID dependency chain.** Upgrade the direct storage dependency to a version that resolves `uuid@9.0.1`, then rerun storage regression tests.
3. **P1 — Establish isolated preview storage before releasing file features.** Provision a development-only bucket or prefix through Replit storage administration, without changing production storage settings, then test upload, replacement, deletion, and protected downloads.
4. **P2 — Controlled credential testing.** Use a dedicated test mailbox to test Clerk verification, duplicate accounts, expired/resend code handling, and social sign-in.
5. **P2 — Configure operational monitoring.** The health endpoint currently only returns `ok`; add dependency-aware readiness monitoring before launch.

## Tests not completed

- Real Clerk email verification, resend, expired-code, duplicate-account, and social-provider sign-in tests — blocked by the absence of a controlled test inbox/provider configuration.
- Attachment upload, replacement, deletion, file metadata, protected download, and preview/inline-PDF handling — blocked by unavailable isolated preview storage.
- Live Shopify/Impact attribution and scheduled sync — intentionally not run because no controlled external event was supplied. This is not an access-control or launch-blocking prerequisite: access remains independent of attribution.
- Production UI interaction testing — production was checked non-destructively by HTTP/API only; no live member records or content were changed.

## Post-publication smoke-test checklist

1. Confirm the final published build contains the audited code fixes and production Clerk domain/redirect configuration.
2. Check `/api/healthz`, landing, sign-up, sign-in, onboarding, dashboard, and one published resource on the production domain.
3. Confirm the banner link remains `https://shopify.pxf.io/the-ecom-king` and disclosure remains visible.
4. Create one controlled QA account with a controlled inbox; verify email, repeat sign-in, and test onboarding without buying Shopify.
5. With an isolated paid resource and storage location, confirm guests and incomplete members receive server-side denials for content and downloads.
6. Verify one live Impact event can be recorded for reporting only and that unavailable or unmatched attribution does not affect member access.