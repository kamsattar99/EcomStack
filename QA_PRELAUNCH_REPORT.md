# EcomStack pre-launch QA report

**Audit date:** 20 September 2026  
**Version tested:** Current workspace state, including local audit fixes; these changes are in preview only until a user publishes them.  
**Environments:** Preview (functional testing and writes using isolated QA accounts); production (non-destructive HTTP/API checks only).  
**Browsers:** Chromium through the Playwright test environment. Desktop, tablet, and mobile viewports were emulated. No physical-device or alternate-browser testing was performed.

## Decision: NOT READY TO PUBLISH

The new-member onboarding path and core route guards work in preview, and the production API is responding. However, production currently exposes a single paid resource titled `test`, live Shopify/Impact attribution has not been proven, email-verification edge cases remain untested, and the dependency audit has one high-severity advisory. These must be addressed before launch.

## Fixes made during this audit

| Priority | Issue | Fix | Retest result |
| --- | --- | --- | --- |
| P1 | Workspace and web production builds failed outside workflow execution because Vite required runtime-only `PORT` and `BASE_PATH`. | Added safe artifact defaults for the EcomStack web and mockup sandbox Vite configurations. | PASS — root build now completes. |
| P2 | API reflected arbitrary origins while allowing credentials despite being same-origin. | Removed credentialed CORS middleware. | PASS — preview API and browser journey remain functional after restart. |
| P2 | Clerk appearance pointed to a missing `logo.svg`. | Switched to the existing branded `favicon.svg` asset. | PASS — asset returns HTTP 200. |

## Functional results

| Area | Result | Expected behaviour | Actual result / evidence |
| --- | --- | --- | --- |
| Landing CTAs | PASS | Signup actions reach signup details. | Two visible primary CTAs reached `/sign-up`. Browser evidence: `mgfcyv`. |
| Global affiliate banner | PASS | Appears once, discloses affiliate relationship, and uses the approved Shopify destination. | Banner appeared once, included “We may earn a commission,” and exposed `https://shopify.pxf.io/the-ecom-king` without opening it. |
| Signup detail validation | PASS | First/last name required; optional phone validated. | Blank names were blocked and phone `123` was rejected. Evidence: `q0zwt7`, `58bqbs`. |
| Clerk boundary | PASS / BLOCKED | Valid detail step reaches live Clerk sign-up; real email verification should work. | Details reached `/sign-up/auth`. Clerk form remained live but was not submitted to avoid sending an uncontrolled email. Verification, resend, expiry, social login, and duplicate-account cases are **BLOCKED** pending a controlled mailbox. |
| Shopify review | PASS | Declaration starts unchecked; marketing is optional; declaration is required. | New QA member saw an unchecked declaration and optional unchecked marketing. Review was blocked until only the declaration was selected. Evidence: `j79zer`. |
| Final confirmation | PASS | Separate confirmation page follows review; “haven't finished” is available. | `/unlock/confirm` displayed both outcomes and the tracked Shopify link. Evidence: `elirzn`. |
| Onboarding completion | PASS | Only final saved confirmation completes onboarding; reload retains the state. | QA member reached `/dashboard`; completion persisted on reload. Evidence: `ifls0x`. |
| Incomplete direct-route guard | PASS | Incomplete members cannot bypass onboarding via direct URLs. | Authenticated incomplete QA member was redirected from `/dashboard` and `/unlock/confirm` to `/unlock`. Evidence: `d44wf9`, `z6a1e0`. |
| Guest/admin API protection | PASS | Guests cannot access member/admin endpoints. | Preview requests to `/api/me`, `/api/admin/overview`, and `/api/admin/resources` returned `401`. |
| Paid resource/content/download enforcement | BLOCKED | Incomplete members and guests must not read paid content or downloads server-side. | Preview has zero published test resources. No admin session or resource was created, so this check could not be safely exercised. |
| Discovery, filters, bookmarks, copying, downloads | BLOCKED | Controls and content access work with real deliberately published resources. | Preview has no launch resources to search, open, save, copy, or download. |
| Admin authoring, uploads and URL import | BLOCKED | Isolated admin test resource can be drafted, uploaded, edited, archived, and safely removed. | No isolated admin account/resource was available; no user records or existing content were changed. |
| Accessibility and responsive auth UI | PASS (limited) | No overflow, visible focus, reduced motion, and readable controls at representative widths. | Signup UI inspected at 1440, 1280, 768, 390, and 375px. Decorative artwork is non-interactive and reduced motion is respected. Full keyboard/screen-reader coverage of every page remains untested. |

## Security and access-control checks

| Check | Result | Evidence / notes |
| --- | --- | --- |
| Guest member/admin access | PASS | Direct preview API calls returned `401`. |
| Onboarding guard | PASS | Browser test confirmed incomplete authenticated members cannot directly enter dashboard or final confirmation. |
| Same-origin mutation model | PASS after fix | Credentialed reflected CORS was removed; browser flow still worked after API restart. |
| Draft/demo production rule | PASS | Automated runtime-site test confirms development settings cannot expose draft demos in production. |
| Dependency audit | FAIL — P1 | One high-severity advisory: `uuid@9.0.1` via `@google-cloud/storage` dependency chain (`GHSA-w5hq-g745-h8pq`). A fix is available in `uuid@11.1.1`, but it requires an upstream-compatible dependency update and regression test. |
| Static analysis | PASS with review item | One medium finding in the Impact investigation utility for a weak-hash pattern. It is not an exposed request path, but should be reviewed before a security sign-off. |
| Privacy/dataflow scan | PASS | No HoundDog findings. |
| Admin URL import | REVIEW REQUIRED — P1 | Current import checks DNS before calling `fetch`, creating a DNS-rebinding SSRF risk. Admin-only access reduces exposure but does not eliminate it. Keep URL imports restricted until DNS-pinned fetching or an equivalent mitigation is implemented and tested. |

## Build and automated tests

| Check | Result |
| --- | --- |
| Workspace type checks | PASS |
| Workspace production build | PASS after Vite configuration fix |
| API build | PASS |
| EcomStack web build | PASS |
| `claim-evidence` tests | PASS — 1 test |
| `impact` tests | PASS — 13 tests |
| `runtime-site` tests | PASS — 1 test |
| Browser console | PASS with expected preview-only Clerk development-key warnings and transient Vite reconnection during workflow restarts |
| Production health endpoint | PASS — both configured production URLs returned `/api/healthz` HTTP 200 |

## Production readiness findings

1. **P1 — Replace test inventory.** Production currently exposes one published paid resource: `test` (`test1`). This is not launch-ready Vault content.
2. **P1 — Prove real referral attribution.** The Impact integration and recurring verification workflow have not been proven with a controlled live affiliate event. Do not claim Shopify signup verification until this is complete.
3. **P1 — Update the high-severity UUID dependency chain.** Upgrade the direct storage dependency to a version that resolves `uuid@9.0.1`, then rerun the audit and storage regression tests.
4. **P1 — Harden admin URL imports.** Mitigate DNS rebinding before enabling broad admin URL import use.
5. **P2 — Controlled credential testing.** Use a dedicated test mailbox and an isolated paid resource to test Clerk verification, duplicate accounts, expired/resend code handling, and server-side content/download protection.
6. **P2 — Configure operational monitoring.** The health endpoint currently only returns `ok`; add dependency-aware readiness monitoring before launch.

## Tests not completed

- Real Clerk email verification, resend, expired-code, duplicate-account, and social-provider sign-in tests — blocked by the absence of a controlled test inbox/provider configuration.
- Protected resource content, download, copy, bookmark, related-resource, and filter tests — blocked by no published preview test resource.
- Admin authoring/upload/import lifecycle — blocked by no isolated admin account and no disposable test content.
- Live Shopify/Impact attribution and scheduled sync — deliberately not run because they require an external controlled paid-trial event and production scheduler confirmation.
- Production UI interaction testing — production was checked non-destructively by HTTP/API only; no live member records were changed.

## Post-publication smoke-test checklist

1. Confirm the final published build contains the audited code fixes and production Clerk domain/redirect configuration.
2. Check `/api/healthz`, landing, sign-up, sign-in, onboarding, dashboard, and one published resource on the production domain.
3. Confirm the banner link remains `https://shopify.pxf.io/the-ecom-king` and disclosure remains visible.
4. Create one controlled QA account with a controlled inbox; verify email, repeat sign-in, and test onboarding without buying Shopify.
5. With an isolated paid resource, confirm guests and incomplete members receive a server-side denial for content and downloads.
6. Verify first live Impact event matching, scheduler activity, and no unexpected errors in deployment logs.