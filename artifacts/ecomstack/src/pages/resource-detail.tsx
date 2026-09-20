import { useParams, Link, useLocation } from "wouter";
import { useGetResource, useGetResourceContent, useSetBookmark, useRecordResourceActivity, getGetResourceContentQueryKey, getGetResourceQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, FileText, ChevronLeft, Bookmark, Check, Download, Copy, PlayCircle, MessageCircle, Blocks, ClipboardCheck, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { PageMeta } from "@/components/page-meta";

function ResourceIllustration({ type }: { type: string }) {
  const Icon = type === "Prompt" ? MessageCircle : type === "Skill" ? Blocks : ClipboardCheck;
  return (
    <div aria-hidden="true" className="resource-illustration grid h-20 w-20 shrink-0 place-items-center rounded-[26px] border border-white/90 bg-[#E8F1E6] shadow-[inset_0_3px_5px_rgba(255,255,255,.9),0_14px_24px_rgba(25,60,54,.13)] transition-transform duration-300 hover:-translate-y-1 hover:rotate-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#193C36] text-[#E8F1E6] shadow-[inset_0_2px_3px_rgba(255,255,255,.18)]"><Icon className="h-6 w-6" strokeWidth={1.55} /></div>
    </div>
  );
}

function relatedIcon(type: string) {
  return type === "Prompt" ? MessageCircle : type === "Skill" ? Blocks : ClipboardCheck;
}

export default function ResourceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { data: detail, isLoading: isLoadingResource } = useGetResource(slug);
  const { data: content, isLoading: isLoadingContent, isError: contentError } = useGetResourceContent(slug, {
    query: { enabled: !!detail?.canAccess, queryKey: getGetResourceContentQueryKey(slug) }
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isSignedIn } = useUser();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const setBookmark = useSetBookmark();
  const recordActivity = useRecordResourceActivity();
  const savedReturn = new URLSearchParams(window.location.search).get("from");
  const backToVault = savedReturn?.startsWith("/library") ? savedReturn : "/library";

  const handleBookmark = () => {
    if (!detail) return;
    if (!isSignedIn) {
      sessionStorage.setItem("pendingResourceSlug", slug);
      sessionStorage.setItem("pendingIntent", "save");
      setLocation("/sign-in");
      return;
    }
    setBookmark.mutate({ slug, data: { saved: !detail.saved } }, {
      onSuccess: () => {
        queryClient.setQueryData(getGetResourceQueryKey(slug), (old: typeof detail | undefined) => old ? { ...old, saved: !detail.saved } : old);
        toast({ title: detail.saved ? "Removed from saved" : "Saved to your Vault" });
      },
      onError: () => toast({ variant: "destructive", title: "Couldn’t update this bookmark", description: "Please try again." }),
    });
  };

  const handleUnlockIntent = () => {
    sessionStorage.setItem("pendingResourceSlug", slug);
    sessionStorage.setItem("pendingIntent", "unlock");
    setLocation("/unlock");
  };

  const handleCopy = async () => {
    if (!content?.content) return;
    setCopyError(false);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(content.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      recordActivity.mutate({ slug, data: { action: "copy" } });
      toast({ title: "Copied to clipboard", description: "The complete resource content is ready to paste." });
    } catch {
      setCopyError(true);
      toast({ variant: "destructive", title: "Copy wasn’t available", description: "Select the content below and copy it manually." });
    }
  };

  if (isLoadingResource) {
    return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><Skeleton className="h-5 w-32" /><div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_270px]"><div className="space-y-5"><Skeleton className="h-10 w-3/4" /><Skeleton className="h-6 w-full" /><Skeleton className="h-[420px] rounded-2xl" /></div><Skeleton className="h-72 rounded-2xl" /></div></div>;
  }

  if (!detail) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-center"><FileText className="mx-auto h-10 w-10 text-[#2F765F]/50" /><h1 className="mt-4 font-serif text-3xl text-[#193C36]">Resource not found</h1><p className="mt-2 text-[#65776e]">This resource may no longer be available.</p><Button asChild className="mt-6 bg-[#193C36] text-white hover:bg-[#2F765F]"><Link href="/library">Back to Vault</Link></Button></div>;
  }

  const { resource, related, canAccess, saved } = detail;
  const hasAssets = Boolean(content?.assets?.length);
  const copyLabel = resource.type === "Prompt" ? "Copy prompt" : "Copy skill";

  return (
    <div className="resource-page mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:py-10">
      <PageMeta title={resource.title} description={resource.description} />
      <Link href={backToVault} className="inline-flex items-center text-sm font-semibold text-[#52675c] transition-colors hover:text-[#193C36]"><ChevronLeft className="mr-1 h-4 w-4" /> Back to Vault</Link>

      <header className="resource-header relative mt-7 overflow-hidden rounded-3xl border border-[#dce7dd] bg-[#FBFCFA] p-6 sm:p-8">
        <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(rgba(47,118,95,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(47,118,95,.05)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div aria-hidden="true" className="absolute -right-16 -top-20 -z-10 h-56 w-56 rounded-full bg-[#E8F1E6] blur-3xl" />
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2"><Badge variant="outline" className="border-[#cbdacb] bg-white text-[10px] uppercase tracking-wider text-[#476054]">{resource.type}</Badge><Badge variant="outline" className="border-[#cbe0d0] bg-[#E8F1E6] text-[10px] text-[#2F765F]">{resource.category}</Badge>{resource.isDemo && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Demo</Badge>}</div>
            <h1 className="mt-5 max-w-3xl font-serif text-3xl leading-[1.04] tracking-[-0.045em] text-[#14251F] sm:text-5xl">{resource.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#5d7067] sm:text-lg">{resource.description}</p>
          </div>
          <ResourceIllustration type={resource.type} />
        </div>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_270px]">
        <main className="min-w-0 space-y-8">
          {!canAccess ? (
            <section className="overflow-hidden rounded-2xl border border-[#dce7dd] bg-white shadow-[0_10px_22px_rgba(25,60,54,.05)]">
              <div className="bg-[#E8F1E6]/65 px-6 py-9 text-center sm:px-10"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#193C36] shadow-sm"><Lock className="h-6 w-6" /></div><h2 className="mt-5 font-serif text-3xl text-[#193C36]">This resource is locked</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#5d7067]">Get access to this and every other playbook, prompt and cheat sheet in the Vault.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Button onClick={handleUnlockIntent} className="bg-[#193C36] text-white hover:bg-[#2F765F]">Unlock the Vault</Button><Button asChild variant="outline" className="border-[#cbdacb] bg-white text-[#193C36]"><Link href="/sign-in">Sign in</Link></Button></div></div>
              <div className="p-6 sm:p-8"><h3 className="flex items-center font-serif text-xl text-[#193C36]"><FileText className="mr-2 h-4 w-4 text-[#2F765F]" /> What’s included</h3><div className="prose mt-4 max-w-none text-[#52675c] prose-p:leading-7"><ReactMarkdown>{resource.preview}</ReactMarkdown></div></div>
            </section>
          ) : isLoadingContent ? (
            <div className="space-y-4"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-36 rounded-2xl" /></div>
          ) : contentError || !content ? (
            <section className="rounded-2xl border border-[#e5c9c2] bg-[#fff8f6] p-6 text-center"><AlertCircle className="mx-auto h-7 w-7 text-[#a4513f]" /><h2 className="mt-3 font-serif text-2xl text-[#5d2d22]">Content unavailable</h2><p className="mt-2 text-sm text-[#7d5148]">We couldn’t load this resource right now. Please refresh and try again.</p></section>
          ) : (
            <>
              <section className="resource-content rounded-2xl border border-[#dce7dd] bg-white shadow-[0_10px_22px_rgba(25,60,54,.05)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4ece4] bg-[#FBFCFA] px-5 py-4 sm:px-6"><div className="flex items-center gap-2 text-sm font-semibold text-[#193C36]"><FileText className="h-4 w-4 text-[#2F765F]" /> Resource content</div>{(resource.type === "Prompt" || (resource.type === "Skill" && !hasAssets)) && <Button size="sm" onClick={handleCopy} className="h-9 rounded-lg bg-[#193C36] text-white hover:bg-[#2F765F]">{copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? "Copied" : copyLabel}</Button>}</div>
                <div className="prose max-w-none break-words px-5 py-6 text-[#26382f] prose-headings:font-serif prose-headings:text-[#193C36] prose-p:leading-7 prose-a:text-[#2F765F] prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:bg-[#193C36] prose-pre:text-[#E8F1E6] sm:px-7 sm:py-8"><ReactMarkdown>{content.content}</ReactMarkdown></div>
                {copyError && <div role="alert" className="mx-5 mb-6 flex gap-2 rounded-xl border border-[#ead2cb] bg-[#fff8f6] p-3 text-sm leading-6 text-[#7a4b40] sm:mx-7"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> Copying is unavailable in this browser. Select the resource content above and copy it manually.</div>}
              </section>

              {resource.useCase && <section className="rounded-2xl border border-[#dce7dd] bg-white p-6 sm:p-7"><h2 className="font-serif text-2xl text-[#193C36]">When to use this</h2><div className="prose mt-4 max-w-none text-[#52675c] prose-p:leading-7"><ReactMarkdown>{resource.useCase}</ReactMarkdown></div></section>}
              {content.instructions && <section className="rounded-2xl border border-[#dce7dd] bg-white p-6 sm:p-7"><h2 className="font-serif text-2xl text-[#193C36]">Instructions</h2><div className="prose mt-4 max-w-none text-[#52675c] prose-p:leading-7 prose-headings:font-serif prose-headings:text-[#193C36]"><ReactMarkdown>{content.instructions}</ReactMarkdown></div></section>}
              {hasAssets && <section><h2 className="font-serif text-2xl text-[#193C36]">{resource.type === "Cheat Sheet" ? "Reference files" : "Downloads"}</h2><div className="mt-4 space-y-3">{content.assets.map((asset) => { const isPdf = asset.contentType === "application/pdf"; return <div key={asset.id} className="overflow-hidden rounded-2xl border border-[#dce7dd] bg-white"><div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E8F1E6] text-[#2F765F]"><FileText className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate font-semibold text-[#193C36]">{asset.name}</p><p className="mt-1 text-xs text-[#65776e]">{(asset.size / 1024 / 1024).toFixed(2)} MB · {asset.contentType}</p></div></div><Button asChild size="sm" variant="outline" className="shrink-0 border-[#cbdacb] text-[#193C36] hover:bg-[#E8F1E6]"><a href={`/api/assets/${asset.id}/download`} download><Download className="mr-2 h-4 w-4" />{isPdf ? "Download PDF" : "Download file"}</a></Button></div>{resource.type === "Cheat Sheet" && isPdf && <iframe src={`/api/assets/${asset.id}/download?inline=1`} className="aspect-[1/1.25] w-full border-t border-[#dce7dd]" title={asset.name} />}</div>; })}</div></section>}
              {resource.tutorialUrl && <section><h2 className="font-serif text-2xl text-[#193C36]">Video tutorial</h2><a href={resource.tutorialUrl} target="_blank" rel="noopener noreferrer" className="group mt-4 flex aspect-video items-center justify-center rounded-2xl bg-[#193C36] text-white shadow-[0_10px_22px_rgba(25,60,54,.12)]"><PlayCircle className="h-14 w-14 opacity-85 transition-transform group-hover:scale-110" /><span className="sr-only">Open video tutorial</span></a></section>}
            </>
          )}
        </main>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <section className="rounded-2xl border border-[#dce7dd] bg-white p-5 shadow-[0_8px_18px_rgba(25,60,54,.04)]"><Button variant="outline" className={`w-full justify-start border-[#cbdacb] ${saved ? "bg-[#E8F1E6] text-[#193C36]" : "bg-white text-[#193C36] hover:bg-[#E8F1E6]"}`} onClick={handleBookmark} disabled={setBookmark.isPending}>{setBookmark.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bookmark className={`mr-2 h-4 w-4 ${saved ? "fill-current" : ""}`} />}{saved ? "Saved to your Vault" : "Save for later"}</Button>
            <h2 className="mt-6 font-serif text-xl text-[#193C36]">Details</h2><dl className="mt-4 divide-y divide-[#e6ede6] text-sm"><div className="flex justify-between gap-4 py-3"><dt className="text-[#65776e]">Tool</dt><dd className="text-right font-semibold text-[#26382f]">{resource.tool}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-[#65776e]">Format</dt><dd className="text-right font-semibold text-[#26382f]">{resource.type}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-[#65776e]">Category</dt><dd className="text-right font-semibold text-[#26382f]">{resource.category}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-[#65776e]">Updated</dt><dd className="text-right font-semibold text-[#26382f]">{new Date(resource.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-[#65776e]">Version</dt><dd className="text-right font-semibold text-[#26382f]">{resource.version}</dd></div></dl>
            {resource.tags?.length ? <div className="mt-5 border-t border-[#e6ede6] pt-5"><h3 className="text-xs font-bold tracking-[.14em] text-[#65776e]">TAGS</h3><div className="mt-3 flex flex-wrap gap-2">{resource.tags.map((tag) => <span key={tag} className="rounded-md bg-[#E8F1E6] px-2 py-1 text-xs font-medium text-[#2F765F]">{tag}</span>)}</div></div> : null}
          </section>
          {related?.length ? <section><h2 className="font-serif text-xl text-[#193C36]">Related resources</h2><div className="mt-3 space-y-2">{related.slice(0, 3).map((rel) => { const Icon = relatedIcon(rel.type); return <Link key={rel.id} href={`/resources/${rel.slug}`} className="group flex items-center gap-3 rounded-xl border border-[#dce7dd] bg-white p-3 transition hover:border-[#a8c3ae] hover:shadow-sm"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E8F1E6] text-[#2F765F]"><Icon className="h-5 w-5" strokeWidth={1.6} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#26382f] group-hover:text-[#2F765F]">{rel.title}</p><p className="mt-1 text-xs text-[#65776e]">{rel.type}</p></div><ArrowRight className="h-4 w-4 text-[#6c8176] transition-transform group-hover:translate-x-1" /></Link>; })}</div></section> : null}
        </aside>
      </div>
      <style>{`
        .resource-header,.resource-content { animation: resource-rise .5s cubic-bezier(.22,.8,.26,1) both; } .resource-content { animation-delay:.08s; }
        @keyframes resource-rise { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .resource-header,.resource-content { animation:none !important; transition:none !important; } }
      `}</style>
    </div>
  );
}