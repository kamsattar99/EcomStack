import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import { 
  useGetAdminResource, 
  useCreateResource, 
  useUpdateResource,
  useListTaxonomies,
  getGetAdminResourceQueryKey,
  useImportResourceFromUrl
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resourceSchema, ResourceFormValues } from "./editor/schema";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Loader2, Save, Wand2 } from "lucide-react";
import { EditorSaveStatus, SaveStatus } from "@/components/admin/EditorSaveStatus";
import { ResourceDetailsStep } from "@/components/admin/ResourceDetailsStep";
import { ResourceContentStep } from "@/components/admin/ResourceContentStep";
import { AssetUploader, LocalUpload } from "@/components/admin/AssetUploader";
import { ResourcePreviewStep } from "@/components/admin/ResourcePreviewStep";

export function getResourceChecklist(values: ResourceFormValues, fileAssetsCount: number, uploadingCount: number) {
  const checks = [
    { label: "Title is set", pass: !!values.title.trim() },
    { label: "Slug is valid", pass: !!values.slug.trim() && /^[a-z0-9-]+$/.test(values.slug) },
    { label: "Description is provided", pass: !!values.description.trim() },
    { label: "Category is selected", pass: !!values.category },
    { label: "Public preview is written", pass: !!values.preview.trim() },
  ];
  
  if (values.type === 'Prompt') {
    checks.push({ label: "Protected content is written", pass: !!values.content.trim() });
    checks.push({ label: "Instructions are written", pass: !!values.instructions.trim() });
  } else if (values.type === 'Skill') {
    checks.push({ 
      label: "Content/instructions OR supporting file provided", 
      pass: (!!values.content.trim() && !!values.instructions.trim()) || fileAssetsCount > 0 
    });
  } else if (values.type === 'Cheat Sheet') {
    checks.push({ 
      label: "Content OR supporting file provided", 
      pass: !!values.content.trim() || fileAssetsCount > 0 
    });
  }
  
  if (uploadingCount > 0) {
    checks.push({ label: "All uploads are complete", pass: false });
  }

  return checks;
}

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
  const categories = useMemo(() => taxonomies?.filter(t => t.kind === 'category') || [], [taxonomies]);
  const tools = useMemo(() => taxonomies?.filter(t => t.kind === 'tool') || [], [taxonomies]);
  
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const importResource = useImportResourceFromUrl();
  const [importUrl, setImportUrl] = useState("");

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

  useEffect(() => {
    if (!isNew && adminResource && initializedForId.current !== id) {
      initializedForId.current = id;
      const r = adminResource.resource;
      const values = {
        slug: r.slug, title: r.title, description: r.description,
        type: r.type, category: r.category, tool: r.tool,
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
  }, [adminResource, id, isNew, form]);

  const formValues = form.watch();

  // Auto-save logic
  useEffect(() => {
    if (isNew || initializedForId.current !== id) return;
    
    let handler: ReturnType<typeof setTimeout> | undefined;
    const currentSerialized = JSON.stringify(formValues);
    if (currentSerialized !== lastSaved.current) {
      setSaveStatus('unsaved');
      handler = setTimeout(() => {
        setSaveStatus('saving');
        updateResource.mutate({ id: id!, data: formValues }, {
          onSuccess: (res) => {
            setSaveStatus('saved');
            lastSaved.current = currentSerialized;
            queryClient.setQueryData(getGetAdminResourceQueryKey(id!), (old: any) => 
              old ? { ...old, resource: res, content: formValues.content } : old
            );
          },
          onError: () => setSaveStatus('failed')
        });
      }, 1500);
    }
    return () => {
      if (handler) clearTimeout(handler);
    };
  }, [formValues, isNew, id, updateResource, queryClient]);

  const [importDraft, setImportDraft] = useState<any>(null);

  const handleImport = () => {
    if (!importUrl.trim()) {
      toast({ variant: "destructive", title: "Paste a public HTTPS link first" });
      return;
    }
    importResource.mutate({ data: { url: importUrl.trim() } }, {
      onSuccess: (draft) => {
        setImportDraft(draft);
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Import failed", description: error?.data?.error || "Try another public HTTPS page." });
      }
    });
  };

  const applyImport = () => {
    if (!importDraft) return;
    form.reset({
      ...form.getValues(),
      title: importDraft.title,
      slug: importDraft.slug,
      description: importDraft.description,
      type: importDraft.type,
      category: form.getValues("category") || categories[0]?.name || "",
      tool: form.getValues("tool") || tools[0]?.name || "",
      preview: importDraft.preview,
      content: importDraft.content,
      instructions: importDraft.instructions,
      useCase: importDraft.useCase,
      sourceUrl: importDraft.sourceUrl,
      sourceNotes: importDraft.sourceNotes,
      status: "draft",
    });
    toast({ title: "Draft imported", description: "Review the fields and save when ready." });
    setImportDraft(null);
  };

  const ensureCreated = async (): Promise<boolean> => {
    if (!isNew) return true;
    
    // Auto-create draft on first transition
    try {
      const data = form.getValues();
      if (!data.title) {
        toast({ variant: "destructive", title: "Title required", description: "Give your resource a title before continuing." });
        return false;
      }
      setSaveStatus('saving');
      const res = await createResource.mutateAsync({ data });
      toast({ title: "Draft created" });
      setLocation(`/admin/resources/${res.resource.id}`, { replace: true });
      return true;
    } catch (err) {
      setSaveStatus('failed');
      toast({ variant: "destructive", title: "Failed to create draft" });
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
    const isPublishing = data.status !== 'published';
    
    // Need explicit manual save trigger for Publish click
    setSaveStatus('saving');
    updateResource.mutate({ id: id!, data: { ...data, status: 'published' } }, {
      onSuccess: (res) => {
        form.setValue('status', 'published');
        lastSaved.current = JSON.stringify(form.getValues());
        setSaveStatus('saved');
        toast({ title: isPublishing ? "Resource Published" : "Changes published" });
        queryClient.setQueryData(getGetAdminResourceQueryKey(id!), (old: any) => 
          old ? { ...old, resource: res, content: data.content } : old
        );
      },
      onError: () => {
        setSaveStatus('failed');
        toast({ variant: "destructive", title: "Failed to publish" });
      }
    });
  };

  if (!isNew && isLoadingResource) return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
              <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={saveStatus === 'saving' || (formValues.status === 'draft' && saveStatus !== 'unsaved')} data-testid="button-save-draft">
                Save Draft
              </Button>
              <Button 
                type="button" 
                onClick={handlePublish}
                disabled={!readyToPublish || saveStatus === 'saving' || (formValues.status === 'published' && saveStatus !== 'unsaved')}
                data-testid="button-publish"
              >
                {saveStatus === 'saving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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

      {isNew && currentStep === 1 && (
        <Card className="mb-8 border-[#cbdacb] bg-[#f6faf5] animate-in fade-in duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg"><Wand2 className="h-5 w-5 text-[#2F765F]" />Import from a link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">Paste a public HTTPS page to create a draft from its title, description, and readable content.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input value={importUrl} onChange={(event) => setImportUrl(event.target.value)} type="url" placeholder="https://example.com/resource" className="bg-white" />
              <Button type="button" onClick={handleImport} disabled={importResource.isPending} className="shrink-0">
                {importResource.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Import draft
              </Button>
            </div>

            {importDraft && (
              <div className="mt-6 p-4 border border-primary/20 bg-white rounded-xl">
                <h4 className="font-medium mb-3">Found Resource</h4>
                <div className="space-y-2 mb-4 text-sm">
                  <p><strong>Title:</strong> {importDraft.title}</p>
                  <p><strong>Description:</strong> {importDraft.description}</p>
                  <p><strong>Type:</strong> {importDraft.type}</p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" size="sm" onClick={() => setImportDraft(null)}>Discard</Button>
                  <Button size="sm" onClick={applyImport}>Apply to Draft</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
