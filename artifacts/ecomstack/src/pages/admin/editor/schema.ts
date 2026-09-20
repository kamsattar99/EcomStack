import * as z from "zod";

export const resourceSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  type: z.enum(["Prompt", "Skill", "Cheat Sheet"]),
  category: z.string().default(""),
  tool: z.string().default(""),
  tags: z.array(z.string()).default([]),
  preview: z.string().default(""),
  useCase: z.string().default(""),
  instructions: z.string().default(""),
  tutorialUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  sourceUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  sourceNotes: z.string().default(""),
  version: z.string().default(""),
  isFree: z.boolean().default(false),
  featured: z.boolean().default(false),
  isDemo: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]),
  coverUrl: z.string().default(""),
  content: z.string().default("")
});

export type ResourceFormValues = z.infer<typeof resourceSchema>;
