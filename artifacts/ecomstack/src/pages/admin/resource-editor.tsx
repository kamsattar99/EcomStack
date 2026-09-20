import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import { 
  useGetAdminResource, 
  useCreateResource, 
  useUpdateResource,
  useListTaxonomies,
  getGetAdminResourceQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resourceSchema, ResourceFormValues } from "./editor/schema";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import { EditorSaveStatus, SaveStatus } from "@/components/admin/EditorSaveStatus";
import { ResourceDetailsStep } from "@/components/admin/ResourceDetailsStep";
import { ResourceContentStep } from "@/components/admin/ResourceContentStep";
import { AssetUploader, LocalUpload } from "@/components/admin/AssetUploader";
import { ResourcePreviewStep } from "@/components/admin/ResourcePreviewStep";

export function getResourceChecklist(values: ResourceFormValues, fileAssetsCount: number, uploadingCount: number) {
  return [
    { label: "Title is set", pass: !!values.title.trim() },
    { label: "Slug is valid", pass: !!values.slug.trim() && /^[a-z0-9-]+$/.test(values.slug) },
  ];
}

function createSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminResourceEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: adminResource, isLoading: isLoadingResource, isError: isResourceError, error: resourceError } = useGetAdminResource(id || "", {
    query: { enabled: !isNew, queryKey: getGetAdminResourceQueryKey(id!) }
  });
  
  const { data: taxonomies } = useListTaxonomies();
  const categories = useMemo(() => taxonomies?.filter(t => t.kind === 'category') || [], [taxonomies]);
  const tools = useMemo(() => taxonomies?.filter(t => t.kind === 'tool') || [], [taxonomies]);
  
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [uploads, setUploads] = useState<LocalUpload[]>([]);

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      slug: "", title: "", description: "", type: "Prompt", category: "", tool: "",
      tags: [], preview: "", useCase: "", instructions: "", tutorialUrl: "", sourceUrl: "", sourceNotes: "",
      version: "1.0", isFree: false, featured: false, isDemo: false,
      status: "draft", coverUrl: "", content: ""
    }
  });

  const initializedForId = useRef<string | null>(null);
  const lastSaved = useRef<string>("");
  const autoSaveInFlight = useRef(false);

  useEffect(() => {
    if (!isNew && adminResource && taxonomies && initializedForId.current !== id) {
      initializedForId.current = id;
      const r = adminResource.resource;
      const values = {
        slug: r.slug, title: r.title, description: r.description,
        type: r.type, category: r.category || categories[0]?.name || "", tool: r.tool || tools[0]?.name || "",
        tags: r.tags || [], preview: r.preview, useCase: r.useCase || "",
        instructions: r.instructions || "", tutorialUrl: r.tutorialUrl || "",
        sourceUrl: r.sourceUrl || "", sourceNotes: r.sourceNotes || "",
        version: r.version || "", isFree: r.isFree, featured: r.featured || false,
        isDemo: r.isDemo || false, status: r.status, coverUrl: r.coverUrl || "",
        content: adminResource.content || ""
      };
      form.reset(values);
      lastSaved.current = JSON.stringify(values);
    }
  }, [adminResource, id, isNew, form, taxonomies, categories, tools]);

  const formValues = useWatch({ control: form.control }) as ResourceFormValues;

  // Auto-save logic
  useEffect(() => {
    if (isNew || initializedForId.current !== id) return;
    
    let handler: ReturnType<typeof setTimeout> | undefined;
    const currentSerialized = JSON.stringify(formValues);
    if (currentSerialized !== lastSaved.current) {
      setSaveStatus('unsaved');
      handler = setTimeout(async () => {
        if (autoSaveInFlight.current) return;
        const snapshot = form.getValues();
        const serializedSnapshot = JSON.stringify(snapshot);

        if (serializedSnapshot === lastSaved.current) return;

        autoSaveInFlight.current = true;
        setSaveStatus('saving');
        try {
          const res = await updateResource.mutateAsync({ id: id!, data: snapshot });
          lastSaved.current = serializedSnapshot;
          queryClient.setQueryData(getGetAdminResourceQueryKey(id!), (old: any) =>
            old ? { ...old, resource: res, content: snapshot.content } : old
          );
          setSaveStatus(JSON.stringify(form.getValues()) === serializedSnapshot ? 'saved' : 'unsaved');
        } catch {
          setSaveStatus('failed');
        } finally {
          autoSaveInFlight.current = false;
        }
      }, 1500);
    }
    return () => {
      if (handler) clearTimeout(handler);
    };
  }, [formValues, isNew, id, updateResource, queryClient, form]);

  const ensureCreated = async (): Promise<boolean> => {
    if (!isNew) return true;
    
    // Auto-create draft on first transition
    try {
      const data = form.getValues();
      if (!data.title) {
        toast({ variant: "destructive", title: "Title required", description: "Give your resource a title before continuing." });
        return false;
      }
      const slug = data.slug || createSlug(data.title);
      if (!slug) {
        toast({ variant: "destructive", title: "A valid title is required", description: "Use letters or numbers so we can create the resource URL." });
        return false;
      }
      if (slug !== data.slug) form.setValue("slug", slug, { shouldDirty: true });
      setSaveStatus('saving');
      const res = await createResource.mutateAsync({ data: { ...data, slug } });
      toast({ title: "Draft created" });
      setLocation(`/admin/resources/${res.resource.id}`, { replace: true });
      return true;
    } catch (err) {
      setSaveStatus('failed');
      toast({
        variant: "destructive",
        title: "Failed to create draft",
        description: err instanceof Error ? err.message.replace(/^HTTP \d+ [^:]+:\s*/, "") : "Please try again.",
      });
      return false;
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      const created = await ensureCreated();
      if (created) setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePublish = async () => {
    const created = await ensureCreated();
    if (!created) return;

    const data = form.getValues();
    const fileAssetsCount = adminResource?.assets?.filter((asset) => asset.kind === 'file').length || 0;
    const uploadingCount = uploads.filter((upload) => upload.status === 'uploading' || upload.status === 'validating' || upload.status === 'failed').length;
    if (!getResourceChecklist(data, fileAssetsCount, uploadingCount).every((check) => check.pass)) {
      setSaveStatus('unsaved');
      toast({
        variant: "destructive",
        title: "Complete the publishing checklist",
        description: "Add a title and a valid URL slug before publishing.",
      });
      return;
    }
    const isPublishing = data.status !== 'published';
    
    setSaveStatus('saving');
    try {
      const res = await updateResource.mutateAsync({ id: id!, data: { ...data, status: 'published' } });
      form.setValue('status', 'published');
      lastSaved.current = JSON.stringify({ ...data, status: 'published' });
      setSaveStatus('saved');
      toast({ title: isPublishing ? "Resource Published" : "Changes published" });
      queryClient.setQueryData(getGetAdminResourceQueryKey(id!), (old: any) =>
        old ? { ...old, resource: res, content: data.content } : old
      );
    } catch {
      setSaveStatus('failed');
      toast({ variant: "destructive", title: "Failed to publish", description: "Your draft is still saved. Please try again." });
    }
  };

  if (!isNew && isLoadingResource) return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
  if (!isNew && isResourceError) return (
    <div className="mx-auto max-w-xl p-8 text-center">
      <h1 className="font-serif text-2xl text-[#193C36]">Couldn’t open this resource</h1>
      <p className="mt-2 text-sm text-muted-foreground">{resourceError instanceof Error ? resourceError.message : "Please return to the resource list and try again."}</p>
      <Button className="mt-6" type="button" onClick={() => setLocation("/admin/resources")}>Back to resources</Button>
    </div>
  );

  const fileAssetsCount = adminResource?.assets?.filter(a => a.kind === 'file').length || 0;
  const uploadingCount = uploads.filter(u => u.status === 'uploading' || u.status === 'validating' || u.status === 'failed').length;
  const checks = getResourceChecklist(formValues, fileAssetsCount, uploadingCount);
  const readyToPublish = checks.every(c => c.pass);

  const handleSaveDraft = async () => {
    const created = await ensureCreated();
    if (!created) return;

    const data = form.getValues();
    setSaveStatus('saving');
    updateResource.mutate({ id: id!, data: { ...data, status: 'draft' } }, {
      onSuccess: (res) => {
        form.setValue('status', 'draft');
        lastSaved.current = JSON.stringify(form.getValues());
        setSaveStatus('saved');
        toast({ title: "Draft Saved" });
        queryClient.setQueryData(getGetAdminResourceQueryKey(id!), (old: any) => 
          old ? { ...old, resource: res, content: data.content } : old
        );
      },
      onError: () => {
        setSaveStatus('failed');
        toast({ variant: "destructive", title: "Failed to save draft" });
      }
    });
  };

  const steps = [
    { num: 1, label: "Details" },
    { num: 2, label: "Content & files" },
    { num: 3, label: "Preview & publish" }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full shrink-0">
            <Link href="/admin/resources"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-medium leading-tight">
              {isNew ? "Create Resource" : adminResource?.resource.title || "Edit Resource"}
            </h1>
            <div className="flex gap-2 items-center mt-1">
              <p className="text-muted-foreground text-sm">
                {formValues.status === 'published' ? (
                  <span className="text-green-700 font-medium">Published</span>
                ) : (
                  <span className="text-amber-700 font-medium capitalize">{formValues.status}</span>
                )}
              </p>
              <span className="text-muted-foreground text-sm px-2">•</span>
              <EditorSaveStatus status={saveStatus} />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => setLocation("/admin/resources")}>
            Close
          </Button>
          {currentStep < 3 ? (
            <Button type="button" onClick={handleNextStep}>
              Next Step
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={updateResource.isPending || (formValues.status === 'draft' && saveStatus !== 'unsaved')} data-testid="button-save-draft">
                Save Draft
              </Button>
              <Button 
                type="button" 
                onClick={handlePublish}
                disabled={!readyToPublish || updateResource.isPending || (formValues.status === 'published' && saveStatus !== 'unsaved')}
                data-testid="button-publish"
              >
                {updateResource.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {formValues.status === 'published' ? (saveStatus === 'unsaved' ? "Update Published" : "Published") : "Publish Resource"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-8 border-b border-border pb-4">
        {steps.map((s) => (
          <button 
            key={s.num}
            onClick={() => setCurrentStep(s.num as 1 | 2 | 3)}
            disabled={isNew && s.num > 1}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentStep === s.num 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {s.num}. {s.label}
          </button>
        ))}
      </div>

      <Form {...form}>
        <div className="pb-24">
          {currentStep === 1 && (
            <ResourceDetailsStep 
              form={form} 
              categories={categories} 
              tools={tools} 
              isNew={isNew} 
            />
          )}
          
          {currentStep === 2 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ResourceContentStep form={form} />
              
              <div className="pt-8 border-t border-border">
                <h3 className="font-serif text-2xl mb-6">Files & Assets</h3>
                {id && !isNew ? (
                  <AssetUploader 
                    resourceId={id} 
                    assets={adminResource?.assets || []} 
                    uploads={uploads}
                    setUploads={setUploads}
                    onAssetsChanged={() => queryClient.invalidateQueries({ queryKey: getGetAdminResourceQueryKey(id) })}
                    onImportContent={(text) => {
                      form.setValue('content', text, { shouldValidate: true, shouldDirty: true });
                    }}
                  />
                ) : (
                  <p className="text-muted-foreground text-sm">Save the draft before uploading files.</p>
                )}
              </div>
            </div>
          )}
          
          {currentStep === 3 && (
            <ResourcePreviewStep form={form} assets={adminResource?.assets || []} checks={checks} />
          )}
        </div>
      </Form>
    </div>
  );
}
