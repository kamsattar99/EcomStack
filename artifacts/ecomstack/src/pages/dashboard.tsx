import { useGetMember, useListResources, useSetBookmark } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Bookmark, Clock, ArrowRight, FileText, Store, X, ExternalLink, Loader2, Search, MessageCircle, Blocks, ClipboardCheck, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { PageMeta } from "@/components/page-meta";
import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/react";
import { MentoringWidget } from "@/components/mentoring-widget";

const SHOPIFY_AFFILIATE_URL = "https://shopify.pxf.io/the-ecom-king";

const resourceKinds = [
  { type: "Prompt", title: "Prompts", description: "Find a better starting point.", icon: MessageCircle },
  { type: "Skill", title: "Skills", description: "Follow a practical workflow.", icon: Blocks },
  { type: "Cheat Sheet", title: "Cheat sheets", description: "Keep the essentials close.", icon: ClipboardCheck },
] as const;

export default function DashboardPage() {
  const { data: member, isLoading, refetch: refetchMember } = useGetMember();
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const setBookmark = useSetBookmark();
  const [showShopifyCard, setShowShopifyCard] = useState(true);
  const [search, setSearch] = useState("");
  const { data: library, isLoading: libraryLoading } = useListResources({ sort: "newest" });

  useEffect(() => {
    if (localStorage.getItem('dismissedShopifyCard') === 'true') {
      setShowShopifyCard(false);
    }
  }, []);

  const handleDismissShopifyCard = () => {
    setShowShopifyCard(false);
    localStorage.setItem('dismissedShopifyCard', 'true');
  };

  const goToSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    setLocation(query ? `/library?search=${encodeURIComponent(query)}` : "/library");
  };

  const handleBookmark = (slug: string, currentlySaved: boolean) => {
    setBookmark.mutate({ slug, data: { saved: !currentlySaved } }, {
      onSuccess: () => {
        refetchMember();
        toast({ title: currentlySaved ? "Removed from saved" : "Saved to your Vault" });
      },
      onError: () => toast({ variant: "destructive", title: "Couldn’t update this bookmark", description: "Please try again." }),
    });
  };

  useEffect(() => {
    const pendingSlug = sessionStorage.getItem('pendingResourceSlug');
    const pendingIntent = sessionStorage.getItem('pendingIntent');
    
    if (pendingSlug) {
      if (pendingIntent === 'save') {
        setBookmark.mutate({ slug: pendingSlug, data: { saved: true } }, {
          onSuccess: () => {
            sessionStorage.removeItem('pendingResourceSlug');
            sessionStorage.removeItem('pendingIntent');
            toast({ title: "Resource saved from your previous session." });
            refetchMember();
          }
        });
      } else if (pendingIntent === 'unlock') {
        // We now just let them view it since there is no hard unlock
        sessionStorage.removeItem('pendingResourceSlug');
        sessionStorage.removeItem('pendingIntent');
        setLocation(`/resources/${pendingSlug}`);
      }
    }
  }, [setBookmark, refetchMember, setLocation, toast]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-12 flex justify-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!member) return null;

  const savedSlugs = new Set(member.savedResources.map((resource) => resource.slug));
  const firstName = user?.firstName || user?.username || undefined;

  return (
    <div className="dashboard-page mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <PageMeta title="Your Vault" description="Explore EcomStack prompts, skills and cheat sheets." />

      <section className="dashboard-welcome relative isolate overflow-hidden rounded-3xl border border-[#dce7dd] bg-[#FBFCFA] px-6 py-8 sm:px-9">
        <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-70 [background-image:linear-gradient(rgba(47,118,95,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(47,118,95,.05)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div aria-hidden="true" className="absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-[#E8F1E6] blur-3xl" />
        {firstName && <p className="text-sm font-semibold text-[#2F765F]">Welcome back, {firstName}.</p>}
        <div className="mt-2 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-serif text-4xl leading-none tracking-[-0.04em] text-[#14251F] sm:text-5xl">Your Vault</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5d7067]">Prompts, skills and cheat sheets for your next ecommerce or digital-product project.</p>
          </div>
          <Button asChild variant="outline" className="shrink-0 rounded-full border-[#c9d9cb] bg-white text-[#193C36] hover:bg-[#E8F1E6]">
            <Link href="/library">Browse all resources <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        <form onSubmit={goToSearch} className="relative mt-7 max-w-3xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2F765F]" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search prompts, skills and cheat sheets…" className="h-14 rounded-2xl border-[#cfdccf] bg-white pl-12 pr-28 text-base shadow-[0_9px_20px_rgba(25,60,54,.06)] placeholder:text-[#819087] focus-visible:ring-2 focus-visible:ring-[#2F765F]" />
          <Button type="submit" className="absolute right-1.5 top-1.5 h-11 rounded-xl bg-[#193C36] px-4 text-white hover:bg-[#2F765F]">Search</Button>
        </form>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {resourceKinds.map(({ type, title, description, icon: Icon }, index) => (
          <Link key={type} href={`/library?type=${encodeURIComponent(type)}`} className={`dashboard-category dashboard-category-${index + 1} group rounded-2xl border border-[#dce7dd] bg-white p-5 shadow-[0_8px_18px_rgba(25,60,54,.04)] transition hover:-translate-y-1 hover:border-[#9ebba5] hover:shadow-[0_16px_28px_rgba(25,60,54,.10)]`}>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E8F1E6] text-[#193C36] shadow-[inset_0_2px_3px_rgba(255,255,255,.9),0_8px_15px_rgba(25,60,54,.12)] transition-transform duration-300 group-hover:[transform:rotate(-6deg)_translateY(-3px)]">
              <Icon className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <h2 className="mt-5 font-serif text-2xl tracking-[-0.03em] text-[#193C36]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#65776e]">{description}</p>
          </Link>
        ))}
      </section>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0 space-y-10">
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div><p className="text-xs font-bold tracking-[0.16em] text-[#2F765F]">EXPLORE</p><h2 className="mt-1 font-serif text-3xl tracking-[-0.04em] text-[#14251F]">Resources to explore</h2></div>
              <Link href="/library" className="hidden text-sm font-semibold text-[#193C36] hover:text-[#2F765F] sm:inline-flex">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </div>
            {libraryLoading ? <div className="flex justify-center py-14"><Loader2 className="h-6 w-6 animate-spin text-[#2F765F]" /></div> : library?.resources?.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {library.resources.slice(0, 6).map((resource) => {
                  const saved = savedSlugs.has(resource.slug);
                  return <article key={resource.id} className="group flex min-h-[255px] flex-col rounded-2xl border border-[#dce7dd] bg-white p-5 shadow-[0_8px_18px_rgba(25,60,54,.04)] transition hover:border-[#a8c3ae] hover:shadow-[0_14px_24px_rgba(25,60,54,.09)]">
                    <div className="flex items-start justify-between gap-3"><div className="flex flex-wrap gap-2"><Badge variant="outline" className="border-[#cbdacb] bg-[#FBFCFA] text-[10px] text-[#476054]">{resource.type}</Badge><Badge variant="outline" className="border-[#cbe0d0] bg-[#E8F1E6] text-[10px] text-[#2F765F]">{resource.category}</Badge></div>
                      <button onClick={() => handleBookmark(resource.slug, saved)} disabled={setBookmark.isPending} aria-label={saved ? `Remove ${resource.title} from saved` : `Save ${resource.title}`} className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition ${saved ? "border-[#2F765F] bg-[#E8F1E6] text-[#193C36]" : "border-[#d4dfd4] text-[#698077] hover:border-[#2F765F] hover:text-[#193C36]"}`}><Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} /></button>
                    </div>
                    <Link href={`/resources/${resource.slug}`} className="mt-5 flex flex-1 flex-col">
                      <h3 className="text-lg font-semibold leading-snug text-[#14251F] transition-colors group-hover:text-[#2F765F]">{resource.title}</h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#65776e]">{resource.description}</p>
                      <span className="mt-auto inline-flex items-center pt-5 text-sm font-semibold text-[#193C36]">Open resource <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                    </Link>
                  </article>;
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#cbdacb] bg-[#FBFCFA] px-6 py-12 text-center"><FileText className="mx-auto h-9 w-9 text-[#2F765F]/50" /><h3 className="mt-4 font-serif text-2xl text-[#193C36]">Resources are on their way.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#65776e]">There are no published resources to explore yet.</p></div>
            )}
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div><div className="mb-4 flex items-center gap-2"><Bookmark className="h-4 w-4 text-[#2F765F]" /><h2 className="font-serif text-2xl text-[#14251F]">Saved</h2></div>
              {member.savedResources.length ? <div className="space-y-2">{member.savedResources.slice(0, 4).map((resource) => <div key={resource.id} className="flex items-center gap-2 rounded-xl border border-[#dce7dd] bg-white p-3"><Link href={`/resources/${resource.slug}`} className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#14251F]">{resource.title}</p><p className="mt-1 text-xs text-[#64766d]">{resource.type} · {resource.category}</p></Link><button onClick={() => handleBookmark(resource.slug, true)} aria-label={`Remove ${resource.title} from saved`} className="rounded-full p-2 text-[#2F765F] hover:bg-[#E8F1E6]"><Bookmark className="h-4 w-4" fill="currentColor" /></button></div>)}</div> : <div className="rounded-2xl border border-dashed border-[#d2ddd3] bg-[#FBFCFA] p-5"><p className="font-medium text-[#193C36]">Keep useful resources close.</p><p className="mt-1 text-sm leading-6 text-[#65776e]">Save a resource and it will appear here.</p><Link href="/library" className="mt-3 inline-block text-sm font-semibold text-[#193C36] underline underline-offset-4">Browse resources</Link></div>}
            </div>
            <div><div className="mb-4 flex items-center gap-2"><Clock className="h-4 w-4 text-[#2F765F]" /><h2 className="font-serif text-2xl text-[#14251F]">Recently viewed</h2></div>
              {member.recentResources.length ? <div className="space-y-2">{member.recentResources.slice(0, 4).map((resource) => <Link key={resource.id} href={`/resources/${resource.slug}`} className="group flex items-center justify-between rounded-xl border border-[#dce7dd] bg-white p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#14251F]">{resource.title}</p><p className="mt-1 text-xs text-[#64766d]">{resource.type} · {resource.category}</p></div><ArrowRight className="h-4 w-4 text-[#6c8176] transition-transform group-hover:translate-x-1" /></Link>)}</div> : <div className="rounded-2xl border border-dashed border-[#d2ddd3] bg-[#FBFCFA] p-5"><p className="font-medium text-[#193C36]">Start exploring the Vault.</p><p className="mt-1 text-sm leading-6 text-[#65776e]">Recently viewed resources will appear here.</p></div>}
            </div>
          </section>
        </main>

        <aside className="space-y-5">
          {showShopifyCard && <section className="relative overflow-hidden rounded-2xl border border-[#cfe0d1] bg-[#E8F1E6] p-5 shadow-[0_10px_20px_rgba(25,60,54,.06)]"><button onClick={handleDismissShopifyCard} className="absolute right-3 top-3 rounded-full p-1 text-[#63766c] hover:bg-white/60 hover:text-[#193C36]" aria-label="Dismiss Shopify recommendation"><X className="h-4 w-4" /></button><Store className="h-6 w-6 text-[#2F765F]" /><h2 className="mt-4 font-serif text-2xl leading-tight text-[#193C36]">Starting a new Shopify store?</h2><p className="mt-3 text-sm leading-6 text-[#52675c]">Use Kamil’s link to get started and support EcomStack.</p><Button asChild className="mt-5 h-auto w-full whitespace-normal bg-[#193C36] py-3 text-left leading-5 text-white hover:bg-[#2F765F]"><a href={SHOPIFY_AFFILIATE_URL} target="_blank" rel="sponsored noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4 shrink-0" />Start Shopify through my link ↗</a></Button><p className="mt-3 text-xs leading-5 text-[#65776e]">We may earn a commission if you sign up through this link.</p></section>}
          <MentoringWidget />
          <section className="rounded-2xl border border-[#dce7dd] bg-white p-5"><h2 className="font-serif text-xl text-[#193C36]">Keep moving</h2><div className="mt-3 space-y-1"><Link href="/library" className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium text-[#52675c] hover:bg-[#E8F1E6] hover:text-[#193C36]">Search the Vault <ArrowRight className="h-4 w-4" /></Link><Link href="/support" className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium text-[#52675c] hover:bg-[#E8F1E6] hover:text-[#193C36]">Get support <ArrowRight className="h-4 w-4" /></Link>{member.resumeSlug && <Link href={`/resources/${member.resumeSlug}`} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-semibold text-[#193C36] hover:bg-[#E8F1E6]">Resume your last resource <ArrowRight className="h-4 w-4" /></Link>}</div></section>
        </aside>
      </div>
      <style>{`
        .dashboard-welcome { animation: dashboard-rise .5s cubic-bezier(.22,.8,.26,1) both; }
        .dashboard-category { animation: dashboard-rise .5s cubic-bezier(.22,.8,.26,1) both; } .dashboard-category-1 { animation-delay:.08s; } .dashboard-category-2 { animation-delay:.14s; } .dashboard-category-3 { animation-delay:.2s; }
        @keyframes dashboard-rise { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .dashboard-welcome,.dashboard-category { animation:none !important; transition:none !important; } }
      `}</style>
    </div>
  );
}
