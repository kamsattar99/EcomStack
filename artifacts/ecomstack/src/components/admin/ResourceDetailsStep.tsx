import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { ResourceFormValues } from "@/pages/admin/editor/schema";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

interface Props {
  form: UseFormReturn<ResourceFormValues>;
  categories: { id: string; name: string }[];
  tools: { id: string; name: string }[];
  isNew: boolean;
}

export function ResourceDetailsStep({ form, categories, tools, isNew }: Props) {
  const title = form.watch("title");
  const slug = form.watch("slug");
  const [slugEdited, setSlugEdited] = useState(false);

  // Auto-generate slug from title for new resources if not manually edited
  useEffect(() => {
    if (!slugEdited && isNew) {
      const generated = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (generated !== slug) {
        form.setValue('slug', generated, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [title, slugEdited, isNew, form, slug]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-6">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                className="bg-white text-lg font-medium h-12" 
                placeholder="E.g., The Ultimate Conversion Prompt" 
                data-testid="input-title"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="slug" render={({ field }) => (
          <FormItem>
            <FormLabel>URL Slug</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                className="bg-white font-mono text-sm" 
                placeholder="the-ultimate-conversion-prompt" 
                onChange={(e) => {
                  setSlugEdited(true);
                  field.onChange(e);
                }}
                data-testid="input-slug"
              />
            </FormControl>
            <FormDescription>Used in the public URL. {isNew && !slugEdited && "Auto-generated from title."}</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Short Description</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                className="resize-none h-24 bg-white" 
                placeholder="A brief summary of what this resource does and who it's for."
                data-testid="input-description"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel>Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="bg-white" data-testid="select-type"><SelectValue placeholder="Select type" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Prompt">Prompt</SelectItem>
                <SelectItem value="Skill">Skill</SelectItem>
                <SelectItem value="Cheat Sheet">Cheat Sheet</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="bg-white" data-testid="select-category"><SelectValue placeholder="Select category" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        
        <FormField control={form.control} name="tool" render={({ field }) => (
          <FormItem>
            <FormLabel>Tool</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="bg-white" data-testid="select-tool"><SelectValue placeholder="Select tool" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {tools.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <div className="pt-4 border-t border-border">
        <FormField control={form.control} name="isFree" render={({ field }) => (
          <FormItem className="space-y-4">
            <FormLabel className="text-base font-medium">Access Level</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(val) => field.onChange(val === "true")}
                value={field.value ? "true" : "false"}
                className="grid sm:grid-cols-2 gap-4"
              >
                <FormItem className="flex items-center space-x-3 space-y-0 rounded-xl border border-border p-4 bg-white cursor-pointer [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5 transition-colors">
                  <FormControl>
                    <RadioGroupItem value="false" data-testid="radio-access-members" />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="font-medium cursor-pointer">Members only</FormLabel>
                    <p className="text-xs text-muted-foreground">Requires sign-in and appropriate access.</p>
                  </div>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0 rounded-xl border border-border p-4 bg-white cursor-pointer [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5 transition-colors">
                  <FormControl>
                    <RadioGroupItem value="true" data-testid="radio-access-public" />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="font-medium cursor-pointer">Public (no sign-in)</FormLabel>
                    <p className="text-xs text-muted-foreground">Available to anyone on the internet.</p>
                  </div>
                </FormItem>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )} />
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="advanced" className="border-border">
          <AccordionTrigger className="hover:no-underline text-sm font-medium">Advanced settings</AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="tags" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma separated)</FormLabel>
                  <FormControl>
                    <Input 
                      value={field.value.join(", ")}
                      onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                      className="bg-white" 
                      placeholder="ecommerce, marketing, seo" 
                      data-testid="input-tags"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="version" render={({ field }) => (
                <FormItem>
                  <FormLabel>Version</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white" placeholder="1.0.0" data-testid="input-version" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="tutorialUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tutorial Video URL</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" className="bg-white" placeholder="https://youtube.com/..." data-testid="input-tutorial-url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="sourceUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Source URL</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" className="bg-white" placeholder="https://..." data-testid="input-source-url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="sourceNotes" render={({ field }) => (
              <FormItem>
                <FormLabel>Source Notes</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white" placeholder="Internal notes about where this came from" data-testid="input-source-notes" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="featured" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-white">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Featured</FormLabel>
                    <FormDescription className="text-xs">Highlight on landing page.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-featured" />
                  </FormControl>
                </FormItem>
              )} />
              
              <FormField control={form.control} name="isDemo" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-white">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Demo Content</FormLabel>
                    <FormDescription className="text-xs">Shown in dev environments only.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-demo" />
                  </FormControl>
                </FormItem>
              )} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
