import { useGetMember, useSetBookmark } from "@workspace/api-client-react";
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
    <div className="container mx-auto px-4 py-12 max-w-6xl space-y-12 animate-in fade-in duration-500">
      <PageMeta title="Dashboard" />
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-serif font-medium text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your saved resources in the Vault.</p>
        </div>
        <Button asChild size="lg" className="rounded-full shadow-sm px-6">
          <Link href="/library">Enter the Vault</Link>
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-[1fr_300px] gap-8 items-start">
        
        <div className="space-y-10">
          {/* Saved Resources */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-xl font-medium flex items-center text-foreground">
                <Bookmark className="h-5 w-5 mr-2 text-primary" /> Saved Resources
              </h2>
            </div>
            
            {member.savedResources.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {member.savedResources.map(resource => (
                  <Link key={resource.id} href={`/resources/${resource.slug}`}>
                    <div className="group flex bg-card rounded-xl border border-border overflow-hidden hover:shadow-sm hover:border-primary/40 transition-all cursor-pointer p-4 h-full">
                      <div className="h-12 w-12 rounded-lg bg-secondary/60 flex-shrink-0 flex items-center justify-center mr-4">
                        <FileText className="h-6 w-6 text-primary/70 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors mb-1 text-foreground">{resource.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] font-medium px-2 py-0 h-5 bg-background border-border/60">{resource.type}</Badge>
                          <span className="truncate">{resource.category}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-secondary/30 rounded-xl border border-border/60 border-dashed">
                <Bookmark className="h-8 w-8 text-primary/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-4">You haven't saved any resources yet.</p>
                <Button asChild variant="outline" size="sm" className="rounded-full bg-white text-foreground">
                  <Link href="/library">Explore Vault</Link>
                </Button>
              </div>
            )}
          </section>

          {/* Recent Resources */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-xl font-medium flex items-center text-foreground">
                <Clock className="h-5 w-5 mr-2 text-primary" /> Recently Viewed
              </h2>
            </div>
            
            {member.recentResources.length > 0 ? (
              <div className="space-y-3">
                {member.recentResources.map(resource => (
                  <Link key={resource.id} href={`/resources/${resource.slug}`} className="block group">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/40 transition-colors -mx-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground w-16">{resource.type}</span>
                        <span className="font-medium text-sm group-hover:text-primary text-foreground transition-colors line-clamp-1">{resource.title}</span>
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
                <CardTitle className="flex items-center text-lg font-serif font-medium text-foreground">
                  <Store className="h-5 w-5 mr-2 text-primary" />
                  Need a store?
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Need a store for your next launch? We recommend setting up Shopify so you can follow along with the resources.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full shadow-sm rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Link href="/unlock">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Start with Shopify
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-serif font-medium text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="ghost" className="w-full justify-start h-auto py-2 px-3 text-muted-foreground hover:text-foreground">
                <Link href="/library">Search the Vault</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start h-auto py-2 px-3 text-muted-foreground hover:text-foreground">
                <Link href="/support">Get support or request a skill</Link>
              </Button>
              {member.resumeSlug && (
                <Button asChild variant="ghost" className="w-full justify-start h-auto py-2 px-3 text-primary hover:bg-primary/10">
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
