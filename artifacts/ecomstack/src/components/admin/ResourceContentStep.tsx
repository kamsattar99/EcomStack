import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ResourceFormValues } from "@/pages/admin/editor/schema";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";

interface Props {
  form: UseFormReturn<ResourceFormValues>;
}

export function ResourceContentStep({ form }: Props) {
  const type = form.watch("type");

  const getTypeHints = () => {
    switch (type) {
      case "Prompt":
        return {
          content: "The exact prompt text to copy. Use variables like [Topic] for customization.",
          instructions: "How to use this prompt effectively. Best practices and parameters.",
          preview: "A teaser of what the prompt achieves before they unlock it."
        };
      case "Skill":
        return {
          content: "The step-by-step workflow, script, or configuration.",
          instructions: "Prerequisites and step-by-step execution guide.",
          preview: "The result of this skill and why they need it."
        };
      case "Cheat Sheet":
        return {
          content: "The raw data, tables, or quick reference content.",
          instructions: "How to read and apply this cheat sheet.",
          preview: "A summary of the cheat sheet contents."
        };
      default:
        return {
          content: "The protected main payload.",
          instructions: "How to use this resource.",
          preview: "Public preview text."
        };
    }
  };

  const hints = getTypeHints();

  const MarkdownField = ({ 
    name, 
    label, 
    description,
    minHeight = "h-48"
  }: { 
    name: "content" | "preview" | "instructions" | "useCase", 
    label: string, 
    description: string,
    minHeight?: string
  }) => {
    return (
      <FormField control={form.control} name={name} render={({ field }) => (
        <FormItem className="bg-white rounded-xl border border-border overflow-hidden">
          <Tabs defaultValue="write" className="w-full">
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
              <div>
                <FormLabel className="text-base font-medium">{label}</FormLabel>
                <FormDescription className="text-xs mt-0.5">{description}</FormDescription>
              </div>
              <TabsList className="h-8">
                <TabsTrigger value="write" className="text-xs">Write</TabsTrigger>
                <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="write" className="m-0 border-none outline-none">
              <FormControl>
                <Textarea 
                  {...field} 
                  className={`resize-y ${minHeight} w-full border-0 focus-visible:ring-0 rounded-none bg-transparent font-mono text-sm p-4`} 
                  placeholder="Supports Markdown..."
                  data-testid={`textarea-${name}`}
                />
              </FormControl>
            </TabsContent>
            
            <TabsContent value="preview" className="m-0 border-none outline-none">
              <div className={`prose prose-sm max-w-none p-4 overflow-y-auto bg-transparent ${minHeight}`} data-testid={`markdown-preview-${name}`}>
                {field.value ? (
                  <ReactMarkdown>{field.value}</ReactMarkdown>
                ) : (
                  <span className="text-muted-foreground italic">Nothing to preview.</span>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <FormMessage className="px-4 pb-2" />
        </FormItem>
      )} />
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <MarkdownField 
        name="preview" 
        label="Public Preview" 
        description={hints.preview} 
        minHeight="min-h-[120px]"
      />
      
      <MarkdownField 
        name="content" 
        label="Protected Content" 
        description={hints.content}
        minHeight="min-h-[300px]"
      />
      
      <MarkdownField 
        name="instructions" 
        label="Instructions" 
        description={hints.instructions}
        minHeight="min-h-[160px]"
      />
      
      <MarkdownField 
        name="useCase" 
        label="Use Case" 
        description="Optional real-world scenario where this applies."
        minHeight="min-h-[120px]"
      />
    </div>
  );
}
