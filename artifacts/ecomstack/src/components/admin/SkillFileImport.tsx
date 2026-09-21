import { useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FileUp, FileCode2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResourceFormValues } from "@/pages/admin/editor/schema";
import { useToast } from "@/hooks/use-toast";

type Props = {
  form: UseFormReturn<ResourceFormValues>;
  categories: { id: string; name: string }[];
  tools: { id: string; name: string }[];
};

function titleFrom(value: string) {
  return value
    .replace(/\.(md|markdown|txt)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function plainText(value: string) {
  return value
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/[*_>#]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSection(content: string, names: string[]) {
  const heading = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const match = content.match(new RegExp(`^#{1,3}\\s*(?:${heading})\\s*\\n([\\s\\S]*?)(?=^#{1,3}\\s|$)`, "im"));
  return match ? plainText(match[1]).slice(0, 500) : "";
}

function parseSkillFile(fileName: string, content: string) {
  const frontMatterMatch = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n)?/);
  const metadata = new Map<string, string>();
  for (const line of frontMatterMatch?.[1].split(/\r?\n/) ?? []) {
    const match = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.+)$/);
    if (match) metadata.set(match[1].toLowerCase(), match[2].trim().replace(/^['"]|['"]$/g, ""));
  }
  const body = content.slice(frontMatterMatch?.[0].length ?? 0).trim();
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const paragraphs = body.split(/\r?\n\s*\r?\n/).map(plainText).filter((value) => value.length > 30);
  const description = metadata.get("description") || paragraphs.find((value) => !value.startsWith("#")) || "";
  const title = titleFrom(metadata.get("title") || metadata.get("name") || heading || fileName);
  const tags = (metadata.get("tags") || "")
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);

  return {
    title,
    description: description.slice(0, 500),
    content,
    preview: (metadata.get("preview") || description).slice(0, 500),
    instructions: metadata.get("instructions") || extractSection(body, ["Instructions", "Usage", "How to use"]) || "Add this skill file to your AI workspace, then follow the workflow it defines.",
    useCase: metadata.get("usecase") || metadata.get("use-case") || extractSection(body, ["Use case", "Use cases", "When to use"]) || description.slice(0, 500),
    tags,
    version: metadata.get("version") || "1.0",
    category: metadata.get("category") || "",
    tool: metadata.get("tool") || "",
  };
}

export function SkillFileImport({ form, categories, tools }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [fileName, setFileName] = useState("");

  const importFile = async (file?: File) => {
    if (!file) return;
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      toast({ variant: "destructive", title: "Choose a Markdown skill file", description: "Skill imports support .md, .markdown, and .txt files." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Skill file is too large", description: "Choose a skill file smaller than 2 MiB." });
      return;
    }

    const parsed = parseSkillFile(file.name, await file.text());
    form.setValue("type", "Skill", { shouldDirty: true, shouldValidate: true });
    form.setValue("title", parsed.title, { shouldDirty: true, shouldValidate: true });
    form.setValue("slug", parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), { shouldDirty: true, shouldValidate: true });
    form.setValue("description", parsed.description, { shouldDirty: true, shouldValidate: true });
    form.setValue("content", parsed.content, { shouldDirty: true, shouldValidate: true });
    form.setValue("preview", parsed.preview, { shouldDirty: true, shouldValidate: true });
    form.setValue("instructions", parsed.instructions, { shouldDirty: true, shouldValidate: true });
    form.setValue("useCase", parsed.useCase, { shouldDirty: true, shouldValidate: true });
    form.setValue("tags", parsed.tags, { shouldDirty: true, shouldValidate: true });
    form.setValue("version", parsed.version, { shouldDirty: true, shouldValidate: true });
    form.setValue("category", parsed.category || categories[0]?.name || "", { shouldDirty: true, shouldValidate: true });
    form.setValue("tool", parsed.tool || tools[0]?.name || "", { shouldDirty: true, shouldValidate: true });
    setFileName(file.name);
    toast({ title: "Skill imported", description: "The resource details and skill content have been filled in. Review them before publishing." });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#b8d1bc] bg-[#f4f8f3] shadow-[0_10px_24px_rgba(25,60,54,.06)]">
      <div className="border-b border-[#d7e5d8] bg-white/70 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#193C36] text-white"><Sparkles className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-bold tracking-[.14em] text-[#2F765F]">SKILL IMPORT</p>
            <h2 className="mt-1 font-serif text-xl text-[#193C36]">Start with the skill file</h2>
          </div>
        </div>
      </div>
      <div className="p-5">
        <p className="max-w-2xl text-sm leading-6 text-[#52675c]">Upload the Markdown file and EcomStack will make it a Skill, generate its title and URL, and fill in the description, content, instructions, tags, and other available details. You can review everything before publishing.</p>
        <input ref={inputRef} className="hidden" type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" onChange={(event) => importFile(event.target.files?.[0])} />
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="button" onClick={() => inputRef.current?.click()} className="bg-[#193C36] hover:bg-[#2F765F]">
            <FileUp className="mr-2 h-4 w-4" />Upload skill file
          </Button>
          {fileName ? <p className="flex items-center gap-2 text-sm font-medium text-[#2F765F]"><FileCode2 className="h-4 w-4" />{fileName} imported</p> : <p className="text-xs text-[#65776e]">Supports Markdown and text files up to 2 MiB.</p>}
        </div>
      </div>
    </section>
  );
}