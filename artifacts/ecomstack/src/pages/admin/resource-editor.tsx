import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { 
  useGetAdminResource, 
  useCreateResource, 
  useUpdateResource,
  useListTaxonomies,
  getGetAdminResourceQueryKey,
  useRequestAssetUpload,
  useConfirmAsset,
  useDeleteAsset
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Loader2, Save, Trash2, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const resourceSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["Prompt", "Skill", "Cheat Sheet"]),
  category: z.string().min(1, "Category is required"),
  tool: z.string().min(1, "Tool is required"),
  tags: z.array(z.string()).optional(),
  preview: z.string().min(1, "Preview is required"),
  useCase: z.string().optional(),
  instructions: z.string().optional(),
  tutorialUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  version: z.string().optional(),
  isFree: z.boolean(),
  featured: z.boolean().optional(),
  isDemo: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]),
  coverUrl: z.string().optional(),
  content: z.string().min(1, "Content is required")
});

type ResourceFormValues = z.infer<typeof resourceSchema>;

export default function AdminResourceEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: adminResource, isLoading: isLoadingResource } = useGetAdminResource(id || "", {
    query: { enabled: !isNew, queryKey: getGetAdminResourceQueryKey(id!) }
  });
  
  const { data: taxonomies } = useListTaxonomies();
  const categories = taxonomies?.filter(t => t.kind === 'category') || [];
  const tools = taxonomies?.filter(t => t.kind === 'tool') || [];
  
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const requestAsset = useRequestAssetUpload();
  const confirmAsset = useConfirmAsset();
  const deleteAsset = useDeleteAsset();
  const [uploading, setUploading] = useState(false);

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      slug: "", title: "", description: "", type: "Prompt", category: "", tool: "",
      tags: [], preview: "", useCase: "", instructions: "", tutorialUrl: "",
      version: "1.0", isFree: false, featured: false, isDemo: false,
      status: "draft", coverUrl: "", content: ""
    }
  });

  const initializedForId = useRef<string | null>(null);

  useEffect(() => {
    if (!isNew && adminResource && initializedForId.current !== id) {
      initializedForId.current = id;
      const r = adminResource.resource;
      form.reset({
        slug: r.slug, title: r.title, description: r.description,
        type: r.type, category: r.category, tool: r.tool,
        tags: r.tags || [], preview: r.preview, useCase: r.useCase || "",
        instructions: r.instructions || "", tutorialUrl: r.tutorialUrl || "",
        version: r.version || "", isFree: r.isFree, featured: r.featured || false,
        isDemo: r.isDemo || false, status: r.status, coverUrl: r.coverUrl || "",
        content: adminResource.content || ""
      });
    }
  }, [adminResource, id, isNew, form]);

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || id === 'new' || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploading(true);
    try {
      const res = await requestAsset.mutateAsync({
        data: {
          resourceId: id,
          name: file.name,
          size: file.size,
          contentType: file.type,
          kind: 'file'
        }
      });
      
      await fetch(res.uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      await confirmAsset.mutateAsync({
        data: { assetId: res.assetId }
      });
      
      toast({ title: "Asset uploaded successfully" });
      queryClient.invalidateQueries({ queryKey: getGetAdminResourceQueryKey(id) });
    } catch (err) {
      toast({ variant: "destructive", title: "Asset upload failed" });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAssetDelete = async (assetId: string) => {
    if (!id) return;
    try {
      await deleteAsset.mutateAsync({ id: assetId });
      toast({ title: "Asset deleted" });
      queryClient.invalidateQueries({ queryKey: getGetAdminResourceQueryKey(id) });
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to delete asset" });
    }
  };

  const onSubmit = (data: ResourceFormValues) => {
    if (isNew) {
      createResource.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Resource created successfully" });
          setLocation("/admin/resources");
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to create resource" });
        }
      });
    } else {
      updateResource.mutate({ id: id!, data }, {
        onSuccess: (res) => {
          toast({ title: "Resource updated successfully" });
          // Update cache locally instead of invalidating
          queryClient.setQueryData(getGetAdminResourceQueryKey(id!), (old: any) => 
            old ? { ...old, resource: res, content: data.content } : old
          );
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to update resource" });
        }
      });
    }
  };

  if (!isNew && isLoadingResource) return <div className="p-8">Loading editor...</div>;

  const isSaving = createResource.isPending || updateResource.isPending;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Button asChild variant="ghost" size="icon" className="mr-4 rounded-full">
            <Link href="/admin/resources"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-medium">{isNew ? "Create Resource" : "Edit Resource"}</h1>
            <p className="text-muted-foreground mt-1">{isNew ? "Add a new prompt, skill, or cheat sheet." : "Update existing content."}</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted border border-border">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="assets" disabled={isNew}>Assets (Uploads)</TabsTrigger>
            </TabsList>
            
            <div className="mt-6 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <TabsContent value="basic" className="m-0 p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl><Input {...field} className="bg-white" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl><Input {...field} className="bg-white" placeholder="my-awesome-prompt" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl><Textarea {...field} className="resize-none h-20 bg-white" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid md:grid-cols-3 gap-6">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger></FormControl>
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
                        <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
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
                        <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {tools.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="m-0 p-6 space-y-6">
                <FormField control={form.control} name="preview" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Preview (Markdown)</FormLabel>
                    <FormDescription>What users see before unlocking.</FormDescription>
                    <FormControl><Textarea {...field} className="font-mono text-sm h-32 bg-white" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protected Content (Markdown)</FormLabel>
                    <FormDescription>The main prompt or skill payload.</FormDescription>
                    <FormControl><Textarea {...field} className="font-mono text-sm h-64 bg-white" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="instructions" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions (Markdown)</FormLabel>
                    <FormControl><Textarea {...field} className="font-mono text-sm h-32 bg-white" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="useCase" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Use Case (Markdown)</FormLabel>
                    <FormControl><Textarea {...field} className="font-mono text-sm h-24 bg-white" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </TabsContent>

              <TabsContent value="settings" className="m-0 p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publish Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="version" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version</FormLabel>
                      <FormControl><Input {...field} className="bg-white" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="tutorialUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tutorial Video URL</FormLabel>
                      <FormControl><Input {...field} type="url" className="bg-white" placeholder="https://youtube.com/..." /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="coverUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL (Public)</FormLabel>
                      <FormControl><Input {...field} type="url" className="bg-white" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-border">
                  <FormField control={form.control} name="isFree" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-white">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Free Resource</FormLabel>
                        <FormDescription>Available without unlock.</FormDescription>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="isDemo" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-white">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Demo Content</FormLabel>
                        <FormDescription>Shown in dev only.</FormDescription>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="featured" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-white">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Featured</FormLabel>
                        <FormDescription>Highlight on landing.</FormDescription>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                </div>
              </TabsContent>

              <TabsContent value="assets" className="m-0 p-6">
                 {isNew ? (
                   <p className="text-center text-muted-foreground my-8">
                     Save the resource first before uploading assets.
                   </p>
                 ) : (
                   <div className="space-y-6">
                     <div className="border border-dashed border-border rounded-xl p-8 text-center bg-secondary/30">
                       <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                       <h3 className="font-medium mb-2">Upload Asset</h3>
                       <p className="text-sm text-muted-foreground mb-4">Add downloadable files, cheat sheets or templates.</p>
                       <div className="relative inline-block">
                         <Button disabled={uploading}>
                           {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Select File"}
                         </Button>
                         <input 
                           type="file" 
                           onChange={handleAssetUpload}
                           disabled={uploading}
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                         />
                       </div>
                     </div>
                     
                     <div className="space-y-3">
                       <h4 className="font-medium">Attached Assets</h4>
                       {adminResource?.assets?.length ? (
                         <div className="space-y-2">
                           {adminResource.assets.map(a => (
                             <div key={a.id} className="border border-border p-3 rounded-lg flex justify-between items-center bg-white">
                               <div>
                                 <p className="font-medium text-sm">{a.name}</p>
                                 <p className="text-xs text-muted-foreground">{(a.size / 1024 / 1024).toFixed(2)} MB • {a.contentType}</p>
                               </div>
                               <Button variant="ghost" size="sm" type="button" onClick={() => handleAssetDelete(a.id)}>
                                 <Trash2 className="h-4 w-4 text-destructive" />
                               </Button>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <p className="text-sm text-muted-foreground">No assets uploaded yet.</p>
                       )}
                     </div>
                   </div>
                 )}
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" className="mr-4 rounded-full" onClick={() => setLocation("/admin/resources")}>Cancel</Button>
            <Button type="submit" className="rounded-full shadow-sm" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isNew ? "Create Resource" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
