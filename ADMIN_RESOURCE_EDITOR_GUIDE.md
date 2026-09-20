# EcomStack resource editor: admin guide

Use **Admin → Manage Vault content** to add or edit a Prompt, Skill, or Cheat Sheet.

## Create a resource

1. Select **Add Vault resource**.
2. Complete **Details**:
   - Give the resource a title. Its URL slug is generated automatically and can be edited.
   - Choose the type, category, tool, and access level.
   - **Public: available without signing in.**
   - **Members only: requires the application’s existing member-access conditions.**
3. Select **Next Step**. EcomStack saves a draft automatically and keeps you in the editor.

You can also start from a public HTTPS page. Choose **Import draft**, review the suggested title, description, text, and type, then choose **Apply to Draft**. Imported content always remains a draft until you publish it. Record the source URL and any permission notes under **Advanced settings**.

## Add content and files

On **Content & files**, write or preview Markdown for:

- Public preview
- Protected content
- Instructions
- Use case

Use the **Write** and **Preview** tabs to check Markdown before publishing.

### Uploads

Drag files into the upload area or choose **Select files**. Supported files are Markdown, ZIP, PDF, PNG, JPG/JPEG, and WebP, up to 15 MiB.

- A Markdown file can be previewed, then either imported into protected content or kept as a download.
- Uploads show their progress and validation state. Failed uploads can be retried or removed.
- Upload a cover image with **Upload Cover**. A replacement becomes the active cover only after validation succeeds; you can then choose whether to delete the prior cover.
- Confirmed images and PDF attachments can be previewed in the editor.

Select **Save Draft** at any time to keep the resource unpublished.

## Preview and publish

Open **Preview & publish** to review the member-facing layout and the publishing checklist. Publishing remains disabled until all requirements are met:

| Resource type | Requirement |
| --- | --- |
| Every resource | Title, description, category, public preview, and no pending or failed uploads |
| Prompt | Protected content and instructions |
| Skill | Protected content plus instructions, or a confirmed supporting file |
| Cheat Sheet | Protected content, or a confirmed supporting file |

When the checklist is complete, select **Publish Resource**. Publishing is never automatic.

## Editing and removing files

Confirmed files are listed under **Attached Assets**. Use the delete control to remove one. Deleting the active cover clears the cover setting, so the resource falls back to its type artwork.

## Before you publish

1. Read the preview as a member would.
2. Confirm access level, category, and tool.
3. Verify downloads and cover artwork.
4. For imported material, confirm you have permission to reuse it and record its source.
5. Check that the publishing checklist is complete.