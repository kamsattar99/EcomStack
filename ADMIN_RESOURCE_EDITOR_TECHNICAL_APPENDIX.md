# EcomStack resource editor: technical appendix

## Scope

The guided admin editor supports Prompts, Skills, and Cheat Sheets through three steps: Details, Content & files, and Preview & publish. New resources are created as drafts on the first transition that needs a resource ID, so uploads never require leaving the editor.

## Resource lifecycle

- Drafts autosave after a short pause and can be explicitly saved with **Save Draft**.
- URL import accepts only public HTTPS HTML pages, proposes a draft, and requires an explicit apply action before replacing editor fields.
- Import responses include `sourceUrl` and `sourceNotes`; these values are persisted with the resource for review and attribution.
- Publishing validation is enforced on the server. The client checklist mirrors it but is not the security boundary.

## Publishing validation

All new published resources require title, description, category, and public preview.

- **Prompt:** protected content and instructions.
- **Skill:** protected content plus instructions, or at least one confirmed supporting file.
- **Cheat Sheet:** protected content, or at least one confirmed supporting file.

Existing published records remain editable to preserve compatibility with older content.

## Asset lifecycle and safeguards

1. `POST /api/admin/assets/upload` validates metadata and creates a pending asset with a short-lived signed upload URL.
2. The browser uploads directly to private object storage.
3. `POST /api/admin/assets/confirm` checks actual metadata, file size, MIME type, extension, and file signatures before copying the verified generation into confirmed storage.
4. Confirmed assets are visible to the editor and eligible for resource use. Expired pending records are cleaned up on subsequent upload requests.

Supported files: `.md`, `.zip`, `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`; maximum size: 15 MiB. Cover assets must be images.

Cover replacement validates and confirms the new cover before its resource pointer changes. Deleting a cover clears the pointer before removing the object.

All authoring, upload, confirmation, and deletion routes require the existing admin authorization and same-origin checks. Uploaded Skill files are stored for download only; they are never executed.

## Download and preview access

Confirmed assets use authorized routes:

- `GET /api/assets/:id/download`
- `GET /api/assets/:id/download?inline=1` for allowed PDF/image previews
- `GET /api/assets/:id/cover` for active covers

The server preserves the existing member-access rules, emits `nosniff` and `no-store` headers, and uses sanitized download names.

## Database change

The additive migration `lib/db/drizzle/0002_safe_admin_resource_uploads.sql` adds:

- `resources.source_url`
- `resources.source_notes`
- `assets.expires_at`

It has been applied to the development database. Production schema changes remain part of the normal Publish flow; no production migration was run.

## Source map

| Area | Location |
| --- | --- |
| Editor and publish checklist | `artifacts/ecomstack/src/pages/admin/resource-editor.tsx` |
| Guided editor components | `artifacts/ecomstack/src/components/admin/` |
| Resource API and import validation | `artifacts/api-server/src/routes/admin.ts` |
| Upload, confirmation, cleanup, download routes | `artifacts/api-server/src/routes/assets.ts` |
| API contract | `lib/api-spec/openapi.yaml` |
| Database schema and migration | `lib/db/src/schema/ecomstack.ts`, `lib/db/drizzle/0002_safe_admin_resource_uploads.sql` |