import { useParams, Link, useLocation } from "wouter";
import { useGetResource, useGetResourceContent, useSetBookmark, useRecordResourceActivity, getGetResourceContentQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, FileText, ChevronLeft, Bookmark, Check, Share2, Download, Copy, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetResourceQueryKey } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { PageMeta } from "@/components/page-meta";

export default function ResourceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { data: detail, isLoading: isLoadingResource } = useGetResource(slug);
  const { data: content, isLoading: isLoadingContent } = useGetResourceContent(slug, {
    query: { enabled: !!detail?.canAccess, queryKey: getGetResourceContentQueryKey(slug) }
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isSignedIn } = useUser();
  const [copied, setCopied] = useState(false);

  const setBookmark = useSetBookmark();
  const recordActivity = useRecordResourceActivity();

  const handleBookmark = () => {
    if (!detail) return;
    if (!isSignedIn) {
      sessionStorage.setItem('pendingResourceSlug', slug);
      sessionStorage.setItem('pendingIntent', 'save');
      setLocation('/sign-in');
      return;
    }
    setBookmark.mutate(
      { slug, data: { saved: !detail.saved } },
      {
        onSuccess: () => {
          queryClient.setQueryData(getGetResourceQueryKey(slug), (old: any) => 
            old ? { ...old, saved: !detail.saved } : old
          );
          toast({
            title: detail.saved ? "Removed from saved" : "Saved to dashboard",
          });
        }
      }
    );
  };

  const handleUnlockIntent = () => {
    sessionStorage.setItem('pendingResourceSlug', slug);
    sessionStorage.setItem('pendingIntent', 'unlock');
    setLocation('/unlock');
  };

  const handleCopy = () => {
    if (!content?.content) return;
    navigator.clipboard.writeText(content.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    recordActivity.mutate({ slug, data: { action: 'copy' } });
    
    toast({
      title: "Copied to clipboard",
      description: "You can now paste this prompt directly into your tool."
    });
  };

  if (isLoadingResource) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-medium mb-4">Resource not found</h1>
        <Button asChild><Link href="/library">Back to Library</Link></Button>
      </div>
    );
  }

  const { resource, related, canAccess, saved } = detail;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageMeta title={resource.title} description={resource.description} />
      <div className="mb-8">
        <Link href="/library" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to library
        </Link>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-12 items-start">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-background text-xs font-medium uppercase tracking-wider">{resource.type}</Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{resource.category}</Badge>
              {resource.isDemo && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Demo</Badge>}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-serif font-medium text-foreground leading-tight tracking-tight">
              {resource.title}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {resource.description}
            </p>
          </div>

          {/* Access Gating */}
          {!canAccess ? (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-8 border-b border-border bg-secondary/50">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-background border border-border shadow-sm mb-6 mx-auto">
                  <Lock className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-serif font-medium text-center mb-4">This resource is locked</h3>
                <p className="text-center text-muted-foreground mb-8 max-w-md mx-auto">
                  Get instant access to this and all other playbooks, prompts and cheat sheets in the vault.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button size="lg" className="rounded-full px-8" onClick={handleUnlockIntent}>
                    Unlock the Vault
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full px-8 bg-white">
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                </div>
              </div>
              <div className="p-8">
                <h4 className="font-medium mb-4 flex items-center"><FileText className="h-4 w-4 mr-2 text-primary" /> What's included:</h4>
                <div className="prose prose-sm max-w-none text-muted-foreground prose-p:leading-relaxed">
                  <ReactMarkdown>{resource.preview}</ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Content Area for unlocked users */}
              {isLoadingContent ? (
                <div className="space-y-4 py-8">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-32 w-full mt-8" />
                </div>
              ) : content && (
                <div className="space-y-12">
                  
                  {resource.useCase && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-serif font-medium">When to use this</h3>
                      <div className="prose prose-slate max-w-none text-muted-foreground">
                        <ReactMarkdown>{resource.useCase}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-serif font-medium">The {resource.type}</h3>
                      {resource.type === 'Prompt' && (
                        <Button size="sm" variant="outline" onClick={handleCopy} className="rounded-full">
                          {copied ? <Check className="h-4 w-4 mr-2 text-green-600" /> : <Copy className="h-4 w-4 mr-2" />}
                          {copied ? "Copied" : "Copy Prompt"}
                        </Button>
                      )}
                    </div>
                    
                    <div className="bg-secondary/50 p-6 rounded-xl border border-border/50 relative group">
                      <div className="prose prose-slate max-w-none prose-p:leading-relaxed">
                        <ReactMarkdown>{content.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  {content.instructions && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-serif font-medium">Instructions</h3>
                      <div className="bg-card p-6 rounded-xl border border-border prose prose-slate max-w-none">
                        <ReactMarkdown>{content.instructions}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {content.assets && content.assets.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-serif font-medium">{resource.type === 'Cheat Sheet' ? 'Cheat Sheet Documents' : 'Downloads'}</h3>
                      <div className="grid gap-4">
                        {content.assets.map(asset => (
                           <div key={asset.id} className="space-y-4">
                             <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                               <div className="flex items-center">
                                 <FileText className="h-8 w-8 text-primary/60 mr-4" />
                                 <div>
                                   <p className="font-medium">{asset.name}</p>
                                   <p className="text-xs text-muted-foreground">{(asset.size / 1024 / 1024).toFixed(2)} MB • {asset.contentType}</p>
                                 </div>
                               </div>
                               <Button asChild size="sm" variant="secondary" className="rounded-full">
                                 <a href={`/api/assets/${asset.id}/download`} download>
                                   <Download className="h-4 w-4 mr-2" /> Download
                                 </a>
                               </Button>
                             </div>
                             
                             {resource.type === 'Cheat Sheet' && asset.contentType === 'application/pdf' && (
                               <div className="mt-4 rounded-xl border border-border overflow-hidden bg-muted">
                                 <iframe 
                                   src={`/api/assets/${asset.id}/download?inline=1`} 
                                   className="w-full aspect-[1/1.4] border-0" 
                                   title={asset.name} 
                                 />
                               </div>
                             )}
                           </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resource.tutorialUrl && (
                     <div className="space-y-4">
                       <h3 className="text-xl font-serif font-medium">Video Tutorial</h3>
                       <div className="aspect-video bg-black rounded-xl overflow-hidden relative group cursor-pointer border border-border flex items-center justify-center">
                         <PlayCircle className="h-16 w-16 text-white opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-110 duration-300" />
                         {/* Usually an iframe would go here if it's a youtube embed */}
                         <a href={resource.tutorialUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 flex items-center justify-center"><span className="sr-only">Play Video</span></a>
                       </div>
                     </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8 sticky top-24">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <h3 className="font-medium mb-6">Details</h3>
            
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-border/50 pb-4">
                <dt className="text-muted-foreground">Tool</dt>
                <dd className="font-medium text-right">{resource.tool}</dd>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-4">
                <dt className="text-muted-foreground">Format</dt>
                <dd className="font-medium text-right">{resource.type}</dd>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-4">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium text-right">{resource.category}</dd>
              </div>
              <div className="flex justify-between pb-2">
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="font-medium text-right">{new Date(resource.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</dd>
              </div>
            </dl>
            
            <div className="mt-8 space-y-3">
              <Button 
                variant={saved ? "secondary" : "outline"} 
                className={`w-full justify-start rounded-full ${saved ? 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20' : 'bg-white'}`}
                onClick={handleBookmark}
              >
                <Bookmark className={`h-4 w-4 mr-2 ${saved ? 'fill-current' : ''}`} />
                {saved ? "Saved" : "Save for later"}
              </Button>
            </div>
            
            {resource.tags && resource.tags.length > 0 && (
              <div className="mt-8">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map(tag => (
                    <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {related && related.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-serif font-medium text-lg">Related Resources</h3>
              <div className="space-y-3">
                {related.map(rel => (
                  <Link key={rel.id} href={`/resources/${rel.slug}`} className="block group">
                    <div className="flex gap-3 items-center p-3 rounded-xl hover:bg-secondary transition-colors border border-transparent hover:border-border">
                      <div className="h-12 w-12 rounded bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground">
                        <FileText className="h-5 w-5 opacity-50" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{rel.title}</h4>
                        <p className="text-xs text-muted-foreground">{rel.type}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
