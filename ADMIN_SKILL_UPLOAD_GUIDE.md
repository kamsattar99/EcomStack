# EcomStack admin skill upload guide

This guide explains how an administrator creates, uploads, publishes, and maintains **Skill** resources in EcomStack today.

> In this application, a **Skill** is a resource type alongside **Prompt** and **Cheat Sheet**. It is not a software plug-in or an AI agent capability.

## Quick overview

The current workflow has two separate stages:

1. **Create the resource record** — enter the Skill’s title, description, Markdown content, settings, and publication status.
2. **Add files** — after the resource has been saved, upload supporting files such as a PDF, ZIP, Markdown file, image, or cover image.

Files are uploaded to private storage first. They are only linked to the resource after the server checks their metadata and file signature.

## Who can use it

All admin resource routes require an authenticated EcomStack user with the `admin` role.

- Unauthenticated visitors receive a `401` response.
- Signed-in users without the admin role receive a `403` response.
- Changes submitted from another website are rejected when the browser sends a mismatched `Origin` header.

The admin protection is applied to the complete admin router, so creating resources, importing from a URL, uploading files, confirming files, and deleting files all use the same role requirement.

## Where to manage Skills

Use **Admin Overview → Manage Vault content** and either:

- choose **Add Vault resource** to create a new item; or
- open an existing resource to edit it.

The editor is implemented in:

`artifacts/ecomstack/src/pages/admin/resource-editor.tsx`

The same editor is used for Prompts, Skills, and Cheat Sheets. The selected **Type** field determines which kind of resource it is.

## Creating a Skill

### Step 1: Enter the basic details

The **Basic Info** tab contains the main catalogue information:

| Field | What it does | Current rules |
| --- | --- | --- |
| Title | Member-facing resource name | Required |
| Slug | URL-friendly identifier used in the resource URL | Required; lowercase letters, numbers, and hyphens only |
| Description | Short catalogue description | Required |
| Type | Select **Skill** for a Skill resource | Prompt, Skill, or Cheat Sheet |
| Category and tool | Help members filter and find the resource | Selected from the configured taxonomies |
| Tags | Additional discovery labels | Optional |

The server validates the slug again when saving. A duplicate slug is rejected rather than silently overwriting another resource.

### Step 2: Add the content

The **Content** tab stores the written material:

| Field | Purpose |
| --- | --- |
| Preview | The public-facing summary used to introduce the resource |
| Content | The full protected Markdown content |
| Instructions | Guidance for using the resource |
| Use case | Context describing when the resource is useful |

The resource detail response intentionally does **not** include protected Markdown content. It is fetched through the protected content route after the relevant member checks have passed.

### Step 3: Choose settings and visibility

The **Settings** tab includes:

| Setting | Purpose |
| --- | --- |
| Status | `draft`, `published`, or `archived` |
| Version | Internal/member-facing version label |
| Tutorial URL | Optional related tutorial link; must be a valid URL when supplied |
| Cover URL / cover asset | Visual artwork for the resource |
| Free | Allows a resource to be accessed without sign-in |
| Demo | Allows development/demo visibility |
| Featured | Marks the resource for featured placement |

New resources begin as:

- **Draft**
- Version **1.0**
- Not free
- Empty content

Save the Skill before trying to upload files. The **Assets** tab is intentionally unavailable for an unsaved resource because the upload system needs the resource ID.

## Saving a Skill

The editor uses the following client-side functions:

| Function | What it does |
| --- | --- |
| `onSubmit` | Chooses whether to create a new resource or update the existing one |
| `useCreateResource` | Sends a new resource to the API |
| `useUpdateResource` | Saves changes to an existing resource |
| `useGetAdminResource` | Loads a resource, including protected content and confirmed assets, into the editor |
| `useListTaxonomies` | Loads available categories, tags, and tools |

On success:

- A new resource returns to the admin resource list.
- An edited resource refreshes its cached editor data.
- The server records a `resource_created` or `resource_updated` activity entry.

The admin API endpoints are:

| Request | Purpose |
| --- | --- |
| `GET /admin/resources` | List admin-visible resources |
| `GET /admin/resources/:id` | Load a resource, its full content, and confirmed assets |
| `POST /admin/resources` | Create a resource |
| `PUT /admin/resources/:id` | Update a resource |

The server implementation is in:

`artifacts/api-server/src/routes/admin.ts`

## Uploading supporting files

### Supported file types

The file picker and server currently allow:

- Markdown: `.md`
- ZIP archives: `.zip`
- PDFs: `.pdf`
- Images: `.png`, `.jpg`, `.jpeg`, `.webp`

Maximum file size: **15 MiB**

File names must be 1–160 characters and contain only letters, numbers, underscores, hyphens, and periods. The server validates both the file extension and MIME type.

Cover assets must be image files.

### What happens when you upload a file

The file upload flow is deliberately a three-step process:

1. **Request permission to upload**
   - The editor sends the resource ID, file name, size, MIME type, and asset kind.
   - The server verifies the admin role, validates the input, checks that the resource exists, creates a pending asset record, and returns a short-lived signed upload URL.

2. **Upload directly to private storage**
   - The browser uploads the bytes directly to the signed URL.
   - This avoids routing large files through the app server.
   - The upload URL expires after **10 minutes**.

3. **Confirm the upload**
   - The browser tells the API which pending asset should be confirmed.
   - The server reads the stored object metadata and the first 4 KiB of the file.
   - It checks the declared size, MIME type, extension, and expected magic bytes where relevant.
   - Valid files are copied to a confirmed storage location and the database record is marked confirmed.
   - Invalid files are deleted from pending storage and are not attached to the Skill.

The relevant editor functions are:

| Function | What it does |
| --- | --- |
| `handleAssetUpload` | Runs the request-upload → direct upload → confirm sequence |
| `useRequestAssetUpload` | Requests a signed upload URL |
| `useConfirmAsset` | Asks the server to validate and confirm the uploaded file |
| `handleAssetDelete` | Deletes an existing confirmed asset |
| `useDeleteAsset` | Calls the deletion endpoint and refreshes the editor |

The server endpoints are:

| Request | Purpose |
| --- | --- |
| `POST /admin/assets/upload` | Create a pending asset and return a signed upload URL |
| `POST /admin/assets/confirm` | Validate and confirm a pending upload |
| `DELETE /admin/assets/:id` | Delete the stored asset and its database record |

The server implementation is in:

`artifacts/api-server/src/routes/assets.ts`

Private object-storage operations are implemented in:

`artifacts/api-server/src/lib/objectStorage.ts`

## Replacing or deleting files

To replace a file today:

1. Upload the replacement as a new asset.
2. Check that the new file appears as confirmed in the editor.
3. Delete the old asset.

Deleting an asset removes its database record and confirmed stored file.

### Important current behavior

If the deleted asset is the resource cover, the resource’s `coverAssetId` is not explicitly cleared by the deletion route. This should be improved so a deleted cover cannot leave a stale cover reference.

## Importing a Skill draft from a URL

The editor includes a URL import option for creating a **draft** from a public webpage.

### How it works

`handleImport`:

1. Requires a non-empty URL.
2. Sends it to `POST /admin/resources/import`.
3. Fills the editor with extracted title, description, Markdown, and suggested type.
4. Forces the imported resource to **Draft**.
5. Requires an admin to review and save before it becomes a real resource.

The server’s URL import protections include:

- HTTPS only
- No URL username/password credentials
- DNS lookup before fetching
- Rejection of private, loopback, link-local, multicast, CGNAT, and private IPv6 targets
- No redirects
- HTML response only
- 15-second request timeout
- 1 MiB maximum fetched page size
- At least 80 characters of extracted readable text
- Imported body capped at 16,000 characters
- Scripts, styles, `noscript`, and SVG content removed before text extraction

The importer generates a slug, suggests whether the content is a Prompt or Skill, and asks the administrator to check that reuse is permitted.

This is an authoring shortcut, not automatic publishing.

## When members can see and download a Skill

Publication status is the main visibility gate:

| Status | Normal member visibility |
| --- | --- |
| Draft | Hidden |
| Published | Visible |
| Archived | Hidden |

Development demo resources may be visible in development mode. Administrators can access resources regardless of public status for review.

### File access

Only confirmed assets are returned with a resource’s protected content.

Members download files using:

- `GET /api/assets/:id/download`
- `GET /api/assets/:id/cover`

Current rules:

- Free resources can be downloaded without sign-in.
- Paid resources require sign-in, completed onboarding, and member access.
- Covers are public for published/demo resources.
- PDF inline preview is limited to free resources.
- Downloads use `no-store`, a sanitized attachment file name, and `nosniff`.
- Logged-in downloads are recorded as activity.

## Current safeguards

The existing flow already provides several useful protections:

- Admin-only authoring and file actions
- Server-side slug validation
- Duplicate slug rejection
- Private staging area for uploads
- Time-limited upload URLs
- File-size, filename, extension, MIME type, and magic-byte checks
- Pending uploads are not shown to members
- Generation-pinned promotion from pending to confirmed storage, which prevents a late overwrite of the reviewed upload
- No direct storage paths exposed in resource responses
- URL-import SSRF protections and strict input limits
- Draft-first behavior for imported content

## Recommended improvements

These are the highest-value changes to consider before expanding the Skill library.

### 1. Add stronger server-side content limits and safe Markdown rendering

The browser validates resource fields, but client validation is not a security boundary. Add server limits for title, description, Markdown, tags, and other fields. Confirm that rendered Markdown strips or sanitizes unsafe HTML and links.

**Why it matters:** It prevents oversized payloads and reduces the chance of unsafe content reaching member-facing pages.

### 2. Add pending-upload cleanup and better upload status

Pending asset rows and private objects can remain after a browser closes, the upload URL expires, or confirmation fails.

Recommended additions:

- Automatic cleanup of expired pending files
- A visible “uploading / validating / confirmed / failed” status
- Retry support for failed uploads
- Per-admin and per-resource upload quotas

**Why it matters:** It keeps storage clean and gives administrators clear feedback instead of a generic failure message.

### 3. Fix cover deletion and improve asset integrity

When an asset is deleted, clear `coverAssetId` if that asset is the current cover. Also validate that confirmation and deletion requests refer to the expected resource and asset state.

**Why it matters:** It avoids broken cover images and protects against stale or malformed asset requests.

### 4. Improve the authoring experience

Potential editor improvements:

- Preview Markdown before publishing
- Show image/PDF thumbnails
- Let admins reorder assets
- Support replacing an asset without manually upload-then-delete
- Show clearer validation errors next to the relevant field
- Warn before publishing a Skill with no protected content or no supporting file

**Why it matters:** It reduces publishing mistakes and makes the upload process easier to understand.

### 5. Strengthen URL import controls

The current importer already blocks redirects and common private network destinations. Further hardening could include:

- Revalidating the resolved address at connection time
- Rate limiting import requests
- Recording original source URLs, author/license notes, and import dates
- Warning about duplicate titles/slugs before save
- Offering a cleaned preview and edit comparison before applying imported text

**Why it matters:** It makes imports safer, more traceable, and less likely to create duplicate or improperly reused content.

### 6. Define the entitlement model explicitly

The current `hasAccess` helper treats every authenticated user as having access. If EcomStack will have paid-only Skills or different membership tiers, replace this with a real entitlement check.

**Why it matters:** The current UI and paid/free fields imply access levels that are not yet enforced as separate tiers.

## Suggested admin checklist

Before publishing a Skill:

1. Confirm the title, slug, description, type, category, and tool.
2. Read the full Markdown content and instructions.
3. Add a helpful preview and use case.
4. Upload and confirm every file or cover image.
5. Open the final resource as a member would.
6. Verify every download works and opens the expected file.
7. Check that the resource is marked **Published**, not Draft.
8. If content came from an imported URL, confirm that you have permission to reuse it and that the final wording is accurate.

## Source map

| Area | Main file |
| --- | --- |
| Admin resource editor | `artifacts/ecomstack/src/pages/admin/resource-editor.tsx` |
| Admin resource and import API | `artifacts/api-server/src/routes/admin.ts` |
| Asset upload/download API | `artifacts/api-server/src/routes/assets.ts` |
| Authentication and admin checks | `artifacts/api-server/src/lib/auth.ts` |
| Resource DTOs and access helpers | `artifacts/api-server/src/lib/domain.ts` |
| Object storage integration | `artifacts/api-server/src/lib/objectStorage.ts` |
| Public resource access API | `artifacts/api-server/src/routes/public.ts` |
| Shared resource input contract | `lib/api-zod/src/generated/types/resourceInput.ts` |
| Shared upload input contract | `lib/api-zod/src/generated/types/uploadInput.ts` |