# EcomStack

An ecommerce prompt, skill, and cheat-sheet library unlocked by verified Shopify paid-trial referrals.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/ecomstack` — React frontend, public/member/admin pages
- `artifacts/api-server` — Clerk, protected resource routes, Impact adapter and durable sync
- `lib/db` — Drizzle models and migrations
- `lib/api-spec/openapi.yaml` — shared API contract
- `README.md` — admin setup, uploads, configuration, publishing, scheduled worker, and launch checklist

## Architecture decisions

- Do not silently replace direct Impact Partner API calls with MCP or mock data.
- No recurring billing or store-activity checks: one eligible referral unlocks the published library.
- API connectivity is not attribution proof. Launch requires a live claim match and permission for the incentive under the affiliate agreement.
- All production uploads use private App Storage, not local filesystem or database blobs.

## Product

Public searchable previews, authenticated bookmarks, protected content and files, referral claims, support requests, and a role-protected publishing/access/diagnostics dashboard.

## Product constraints

Editable working brand name; warm white, charcoal and restrained emerald. No personality branding, fake testimonials, invented counts, pricing claims, or artificial urgency.

## Gotchas

- Seed content is demo draft content. Review and explicitly publish before exposing it in production.
- Never make the first signup an admin; role provisioning is explicit and audited.
- Secrets belong only in the secret store. No credential values in logs, admin responses, or source.
- Re-run codegen after API contract changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
