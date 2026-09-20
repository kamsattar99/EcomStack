import { UseFormReturn } from "react-hook-form";
import { ResourceFormValues } from "@/pages/admin/editor/schema";
import { Asset } from "@workspace/api-client-react";
import { CheckCircle2, AlertCircle, Eye, File as FileIcon, Clock, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { LinkedResource, TutorialVideo } from "@/components/resource-external-media";

interface Props {
  form: UseFormReturn<ResourceFormValues>;
  assets: Asset[];
  checks: { label: string; pass: boolean; }[];
}

export function ResourcePreviewStep({ form, assets, checks }: Props) {
  const values = form.getValues();
  const coverAsset = assets.find(a => a.kind === 'cover');
  const fileAssets = assets.filter(a => a.kind === 'file');

  const readyToPublish = checks.every(c => c.pass);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid md:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-8">
          <div className="border border-border bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="aspect-[2/1] bg-muted relative overflow-hidden">
              {coverAsset ? (
                <img src={`/api/assets/${coverAsset.id}/cover`} alt="Cover" className="w-full h-full object-cover" data-testid="preview-cover-image" />
              ) : (
                <div className="absolute inset-0 bg-secondary/50 flex items-center justify-center flex-col gap-2 text-muted-foreground">
                  <Eye className="h-8 w-8 opacity-50" />
                  <p className="text-sm font-medium">Type fallback artwork will be used</p>
                </div>
              )}
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex gap-2 mb-4">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">{values.type}</span>
                <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">{values.category}</span>
                {values.isFree ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Public</span>
                ) : (
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">Members Only</span>
                )}
              </div>

              <div>
                <h1 className="text-3xl font-serif font-medium mb-2">{values.title || "Untitled Resource"}</h1>
                <p className="text-lg text-muted-foreground">{values.description || "No description provided."}</p>
              </div>
              
              {values.preview && (
                <div className="prose prose-sm max-w-none p-6 bg-muted/30 rounded-xl border border-border/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Public Preview</h4>
                  <ReactMarkdown>{values.preview}</ReactMarkdown>
                </div>
              )}

              <div className="prose max-w-none">
                <h3 className="font-serif">Protected Content</h3>
                {values.content ? (
                  <div className="bg-white p-6 rounded-xl border border-primary/20 shadow-sm relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-l-xl">
                    <ReactMarkdown>{values.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No protected content provided yet.</p>
                )}
              </div>
              
              {values.instructions && (
                <div className="prose max-w-none">
                  <h3 className="font-serif">Instructions</h3>
                  <div className="bg-muted/30 p-6 rounded-xl border border-border">
                    <ReactMarkdown>{values.instructions}</ReactMarkdown>
                  </div>
                </div>
              )}

               {values.tutorialUrl && <TutorialVideo url={values.tutorialUrl} />}
               {values.sourceUrl && <LinkedResource url={values.sourceUrl} resourceType={values.type} />}

              {fileAssets.length > 0 && (
                <div>
                  <h3 className="font-serif text-xl mb-4">Downloads</h3>
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    {fileAssets.map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-4 border border-border rounded-xl bg-white shadow-sm hover:border-primary/30 transition-colors">
                        <div className="p-3 bg-primary/10 text-primary rounded-lg">
                          <FileIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{(a.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* PDF Previews */}
                  <div className="space-y-4">
                    {fileAssets.filter(a => a.contentType === 'application/pdf').map(a => (
                      <div key={`pdf-${a.id}`} className="border border-border rounded-xl overflow-hidden bg-white shadow-sm">
                        <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center justify-between">
                          <span className="text-sm font-medium">{a.name}</span>
                          <a href={`/api/assets/${a.id}/download?inline=1`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Open in new tab</a>
                        </div>
                        <iframe src={`/api/assets/${a.id}/download?inline=1`} className="w-full h-[500px]" title={a.name} data-testid={`preview-pdf-${a.id}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="sticky top-8 bg-white border border-border rounded-xl p-5 shadow-sm">
            <h3 className="font-medium mb-4">Publishing Checklist</h3>
            <ul className="space-y-3 mb-6">
              {checks.map((c, i) => (
                <li key={i} className="flex items-start gap-3">
                  {c.pass ? (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <span className={`text-sm ${c.pass ? "text-foreground" : "text-muted-foreground"}`}>
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>
            
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium capitalize">{values.status}</span>
              </div>
              {!readyToPublish && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                  Complete the checklist to enable publishing.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
