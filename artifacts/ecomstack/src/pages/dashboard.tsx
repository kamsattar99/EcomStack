import { useGetMember, useSetBookmark, useStartClaim } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Clock, ArrowRight, FileText, Store, X, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { PageMeta } from "@/components/page-meta";

export default function DashboardPage() {
  const { data: member, isLoading, refetch: refetchMember } = useGetMember();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const setBookmark = useSetBookmark();
  const startClaim = useStartClaim();
  const [showShopifyCard, setShowShopifyCard] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('dismissedShopifyCard') === 'true') {
      setShowShopifyCard(false);
    }
  }, []);

  const handleDismissShopifyCard = () => {
    setShowShopifyCard(false);
    localStorage.setItem('dismissedShopifyCard', 'true');
  };

  const handleStartShopify = () => {
    const partnerTab = window.open("about:blank", "_blank");
    if (partnerTab) partnerTab.opener = null;
    startClaim.mutate({ data: {} }, {
      onSuccess: (result) => {
        if (partnerTab && !partnerTab.closed) {
          try { partnerTab.location.replace(result.redirectUrl); }
          catch { partnerTab.close(); }
        }
      },
      onError: () => {
        if (partnerTab && !partnerTab.closed) partnerTab.close();
        toast({ variant: "destructive", title: "Couldn't open Shopify", description: "Please try again." });
      }
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

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl space-y-12">
      <PageMeta title="Dashboard" />
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-medium text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your saved resources.</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-[1fr_300px] gap-8 items-start">
        
        <div className="space-y-10">
          {/* Saved Resources */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-xl font-medium flex items-center">
                <Bookmark className="h-5 w-5 mr-2 text-primary" /> Saved Resources
              </h2>
              <Link href="/library" className="text-sm text-muted-foreground hover:text-primary transition-colors">Browse library</Link>
            </div>
            
            {member.savedResources.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {member.savedResources.map(resource => (
                  <Link key={resource.id} href={`/resources/${resource.slug}`}>
                    <div className="group flex bg-card rounded-xl border border-border overflow-hidden hover:shadow-sm hover:border-primary/30 transition-all cursor-pointer p-4 h-full">
                      <div className="h-12 w-12 rounded bg-secondary flex-shrink-0 flex items-center justify-center mr-4">
                        <FileText className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors mb-1">{resource.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] font-normal px-1 py-0 h-4 bg-background">{resource.type}</Badge>
                          <span className="truncate">{resource.category}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-secondary/30 rounded-xl border border-border border-dashed">
                <Bookmark className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm mb-4">You haven't saved any resources yet.</p>
                <Button asChild variant="outline" size="sm" className="rounded-full bg-white">
                  <Link href="/library">Explore Library</Link>
                </Button>
              </div>
            )}
          </section>

          {/* Recent Resources */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-xl font-medium flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" /> Recently Viewed
              </h2>
            </div>
            
            {member.recentResources.length > 0 ? (
              <div className="space-y-3">
                {member.recentResources.map(resource => (
                  <Link key={resource.id} href={`/resources/${resource.slug}`} className="block group">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors -mx-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground w-16">{resource.type}</span>
                        <span className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">{resource.title}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {showShopifyCard && (
            <Card className="border-primary/20 shadow-sm overflow-hidden relative bg-primary/5">
              <button
                onClick={handleDismissShopifyCard}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
              <CardHeader className="pb-4 pt-5">
                <CardTitle className="flex items-center text-lg font-medium">
                  <Store className="h-5 w-5 mr-2 text-primary" />
                  Need a store?
                </CardTitle>
                <CardDescription className="text-sm text-foreground/80 mt-1">
                  Need a store for your next launch? We recommend setting up Shopify so you can follow along with the resources.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleStartShopify}
                  disabled={startClaim.isPending}
                  className="w-full shadow-sm rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {startClaim.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                  Start with Shopify
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="ghost" className="w-full justify-start h-auto py-2 px-3">
                <Link href="/library">Search the library</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start h-auto py-2 px-3">
                <Link href="/support">Get support or request a skill</Link>
              </Button>
              {member.resumeSlug && (
                <Button asChild variant="ghost" className="w-full justify-start h-auto py-2 px-3 text-primary">
                  <Link href={`/resources/${member.resumeSlug}`}>Resume where you left off</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  );
}
