import { useEffect } from "react";
import { useCompleteOnboarding, useGetMember, getGetMemberQueryKey, useSaveOnboardingReview } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppLogo } from "@/components/app-logo";
import { ShopifyTile } from "@/components/shopify-tile";
import { ExternalLink, Loader2, Check } from "lucide-react";
import { Link, useLocation } from "wouter";
import { PageMeta } from "@/components/page-meta";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const SHOPIFY_AFFILIATE_URL = "https://shopify.pxf.io/the-ecom-king";

export default function UnlockConfirmPage() {
  const { data: member, isLoading: memberLoading } = useGetMember({ query: { queryKey: getGetMemberQueryKey() } });
  const completeOnboarding = useCompleteOnboarding();
  const saveOnboardingReview = useSaveOnboardingReview();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!memberLoading && member?.onboardingCompleted) setLocation("/dashboard");
    if (!memberLoading && member && !member.onboardingCompleted && !member.shopifyReviewStarted) setLocation("/unlock");
  }, [member, memberLoading, setLocation]);

  const handleFinalConfirmation = () => {
    completeOnboarding.mutate({ data: { decision: "started", shopifySelfReported: true } }, {
      onSuccess: () => {
        let resourceSlug: string | null = null;
        try { resourceSlug = sessionStorage.getItem("pendingResourceSlug"); } catch {}
        try {
          sessionStorage.removeItem("pendingResourceSlug");
          sessionStorage.removeItem("pendingIntent");
        } catch {}
        queryClient.invalidateQueries({ queryKey: getGetMemberQueryKey() });
        setLocation(resourceSlug ? `/resources/${resourceSlug}` : "/dashboard");
      },
      onError: () => toast({ variant: "destructive", title: "We couldn't save your confirmation", description: "Please try again." }),
    });
  };

  const handleNotFinished = () => {
    saveOnboardingReview.mutate({ data: { shopifySelfReported: false } }, {
      onError: () => toast({ variant: "destructive", title: "We couldn't update your confirmation", description: "Please try again." }),
    });
  };

  if (memberLoading || !member?.shopifyReviewStarted) {
    return <div className="grid min-h-[100dvh] place-items-center bg-[#FBFCFA] text-[#52645d]"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const isSaving = completeOnboarding.isPending;

  return (
    <div className="shopify-onboarding min-h-[100dvh] overflow-hidden bg-[#FBFCFA] px-4 py-4 text-[#14251F] sm:px-6 sm:py-6">
      <PageMeta title="Confirm Shopify signup | EcomStack" />
      <div className="mx-auto w-full max-w-[1080px]">
        <header className="flex h-14 items-center justify-between rounded-full border border-[#dfe7df] bg-white/90 px-4 shadow-[0_10px_35px_rgba(20,37,31,0.08)] backdrop-blur-xl sm:px-5">
          <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold tracking-tight text-[#14251F]"><AppLogo className="h-7 w-7 shrink-0 rounded-lg" />EcomStack</Link>
          <span className="text-sm font-semibold text-[#52645d]">Account setup</span>
        </header>
        <main className="relative mx-auto flex max-w-[680px] flex-col items-center pb-8 pt-7 sm:pt-9">
          <div aria-hidden="true" className="absolute -top-8 -z-10 h-64 w-64 rounded-full bg-[#E8F1E6] blur-3xl" />
          <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#74857c] sm:text-[11px]">
            <span className="inline-flex items-center gap-1 text-[#2F765F]"><Check className="h-3.5 w-3.5" /> Account</span><span aria-hidden="true">→</span><span className="inline-flex items-center gap-1 text-[#2F765F]"><Check className="h-3.5 w-3.5" /> Shopify</span><span aria-hidden="true">→</span><span className="text-[#193C36]">Vault</span>
          </div>
          <Card className="shopify-card w-full overflow-hidden rounded-3xl border-[#dce7dd] bg-white shadow-[0_18px_50px_rgba(25,60,54,0.10)]">
            <CardContent className="p-5 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-[470px]">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2F765F]">One final check</p>
                  <h1 className="mt-3 font-serif text-[2.25rem] leading-[.98] tracking-[-0.05em] text-[#193C36] sm:text-[2.625rem]">Did you complete signup through Kamil’s link?</h1>
                </div>
                <ShopifyTile className="shopify-float mx-auto h-24 w-24 shrink-0 sm:mx-0 sm:h-28 sm:w-28" />
              </div>
              <p className="mt-5 max-w-[560px] text-base leading-7 text-[#607069]">Before you enter the Vault, confirm that you completed Shopify’s signup using the link we provided.</p>
              <p className="mt-4 text-sm leading-6 text-[#52645d]">Please make sure your confirmation is accurate. If you haven’t finished signing up through the link, return to Shopify now.</p>

              <div className="mt-7 space-y-3">
                <Button className="h-[54px] w-full rounded-xl bg-[#193c36] text-base text-white shadow-[0_7px_14px_rgba(25,60,54,.14)] hover:bg-[#24584e]" onClick={handleFinalConfirmation} disabled={isSaving}>
                  {completeOnboarding.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  {completeOnboarding.isPending ? "Saving…" : "Yes, I signed up through Kamil’s link"}
                </Button>
                <Button asChild variant="outline" className="h-[54px] w-full rounded-xl border-[#b9cfbd] bg-white text-base text-[#193C36] hover:bg-[#f4f8f4]">
                  <a href={SHOPIFY_AFFILIATE_URL} target="_blank" rel="sponsored noopener noreferrer" onClick={handleNotFinished}>
                    <ExternalLink className="mr-2 h-5 w-5" />
                    I haven’t finished signup yet
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
      <style>{`
        .shopify-card { animation: shopify-rise .5s cubic-bezier(.22,.8,.26,1) both; }
        .shopify-float { animation: shopify-rise .5s cubic-bezier(.22,.8,.26,1) both, shopify-float 6s ease-in-out .5s infinite; }
        @keyframes shopify-rise { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shopify-float { 0%,100% { transform:translateY(0) rotate(0); } 50% { transform:translateY(-5px) rotate(1deg); } }
        @media (prefers-reduced-motion: reduce) { .shopify-card,.shopify-float { animation:none !important; transition:none !important; } }
      `}</style>
    </div>
  );
}