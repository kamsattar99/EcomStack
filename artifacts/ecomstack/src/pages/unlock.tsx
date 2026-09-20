import { useEffect, useRef, useState } from "react";
import { useStartClaim, useCompleteOnboarding, useGetMember, getGetMemberQueryKey, useRecordOnboardingView, useUpdateMemberProfile } from "@workspace/api-client-react";
import type { MemberProfileInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Loader2, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link, useLocation } from "wouter";
import { PageMeta } from "@/components/page-meta";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { ShopifyTile } from "@/components/shopify-tile";
import { AppLogo } from "@/components/app-logo";

const SHOPIFY_FALLBACK_URL = "https://shopify.pxf.io/the-ecom-king";
type PendingProfile = Omit<MemberProfileInput, "email">;

export default function UnlockPage() {
  const { isLoaded: clerkLoaded, user } = useUser();
  const { data: member, isLoading: memberLoading } = useGetMember({ query: { queryKey: getGetMemberQueryKey() } });
  const startClaim = useStartClaim();
  const completeOnboarding = useCompleteOnboarding();
  const recordOnboardingView = useRecordOnboardingView();
  const updateMemberProfile = useUpdateMemberProfile();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [signupError, setSignupError] = useState("");
  const [signupUrl, setSignupUrl] = useState("");
  const [shopifySelfReported, setShopifySelfReported] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const pendingProfile = useRef<PendingProfile | null>(null);
  const profileSyncStarted = useRef(false);
  const [profileStatus, setProfileStatus] = useState<"loading" | "ready" | "error">("loading");
  const { toast } = useToast();

  const savePendingProfile = () => {
    const profile = pendingProfile.current;
    if (!profile) { setProfileStatus("ready"); return; }
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) { setProfileStatus("error"); return; }
    profileSyncStarted.current = true;
    setProfileStatus("loading");
    updateMemberProfile.mutate({ data: { ...profile, email } }, {
      onSuccess: () => {
        try { sessionStorage.removeItem("pendingRegistrationDetails"); } catch {}
        pendingProfile.current = null;
        setProfileStatus("ready");
        queryClient.invalidateQueries({ queryKey: getGetMemberQueryKey() });
      },
      onError: () => setProfileStatus("error"),
    });
  };

  useEffect(() => {
    if (!clerkLoaded || profileSyncStarted.current) return;
    try {
      const raw = sessionStorage.getItem("pendingRegistrationDetails");
      const details = raw ? JSON.parse(raw) as Partial<PendingProfile> : null;
      pendingProfile.current = details?.firstName && details.lastName
        ? { firstName: details.firstName, lastName: details.lastName }
        : null;
    } catch {
      pendingProfile.current = null;
    }
    savePendingProfile();
  }, [clerkLoaded]);

  useEffect(() => {
    if (clerkLoaded) recordOnboardingView.mutate();
  }, [clerkLoaded]);

  useEffect(() => {
    if (!memberLoading && member?.onboardingCompleted) setLocation("/dashboard");
  }, [member?.onboardingCompleted, memberLoading, setLocation]);

  useEffect(() => {
    if (!member) return;
    setShopifySelfReported(member.shopifySelfReported);
    setMarketingOptIn(member.marketingOptIn);
  }, [member?.shopifySelfReported, member?.marketingOptIn]);

  if (profileStatus !== "ready") {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4 py-16">
        <Card className="w-full">
          <CardContent className="p-8 text-center">
            {profileStatus === "loading" ? (
              <>
                <Loader2 className="mx-auto mb-4 h-7 w-7 animate-spin text-primary" />
                <h1 className="text-xl font-medium">Saving your member details</h1>
                <p className="mt-2 text-sm text-muted-foreground">Your verified account will be ready in a moment.</p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-medium">We couldn't save your details</h1>
                <p className="mt-2 text-sm text-muted-foreground">We couldn't confirm a verified email for this account. Please try again.</p>
                <div className="mt-6 flex flex-col gap-3">
                  <Button onClick={savePendingProfile}>Try again</Button>
                  <Button asChild variant="outline"><Link href="/sign-up">Edit your details</Link></Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStart = () => {
    setSignupError("");
    setSignupUrl("");
    const partnerTab = window.open("about:blank", "_blank");
    if (partnerTab) partnerTab.opener = null;
    let resourceSlug: string | undefined;
    try { resourceSlug = sessionStorage.getItem('pendingResourceSlug') || undefined; }
    catch { /* Storage restrictions must not prevent a tracked signup. */ }

    startClaim.mutate({ data: { resourceSlug } }, {
      onSuccess: (result) => {
        if (partnerTab && !partnerTab.closed) {
          try {
            partnerTab.location.replace(result.redirectUrl);
          }
          catch {
            partnerTab.close();
            setSignupUrl(SHOPIFY_FALLBACK_URL);
            setSignupError("We couldn't open the tracked Shopify link. Use the backup link below to continue.");
          }
        } else {
          setSignupUrl(SHOPIFY_FALLBACK_URL);
          setSignupError("Your browser blocked the new tab. Use the backup link below to continue.");
        }
      },
      onError: () => {
        if (partnerTab && !partnerTab.closed) partnerTab.close();
        setSignupUrl(SHOPIFY_FALLBACK_URL);
        setSignupError("We couldn't open the tracked Shopify link. Use the backup link below to continue.");
      }
    });
  };

  const handleContinue = () => {
    if (!shopifySelfReported || completeOnboarding.isPending) return;
    completeOnboarding.mutate({ data: { decision: "started", shopifySelfReported, marketingOptIn } }, {
      onSuccess: () => {
        let resourceSlug: string | null = null;
        try { resourceSlug = sessionStorage.getItem('pendingResourceSlug'); }
        catch {}
        try {
          sessionStorage.removeItem('pendingResourceSlug');
          sessionStorage.removeItem('pendingIntent');
        } catch {}
        queryClient.invalidateQueries({ queryKey: getGetMemberQueryKey() });
        if (resourceSlug) {
          setLocation(`/resources/${resourceSlug}`);
        } else {
          setLocation("/dashboard");
        }
      },
      onError: () => {
        toast({ variant: "destructive", title: "Something went wrong", description: "Please try again." });
      }
    });
  };

  return (
    <div className="shopify-onboarding min-h-[100dvh] overflow-hidden bg-[#FBFCFA] px-4 py-4 text-[#14251F] sm:px-6 sm:py-6">
      <PageMeta title="Start your store | EcomStack" />
      <div className="mx-auto w-full max-w-[1080px]">
        <header className="flex h-14 items-center justify-between rounded-full border border-[#dfe7df] bg-white/90 px-4 shadow-[0_10px_35px_rgba(20,37,31,0.08)] backdrop-blur-xl sm:px-5">
          <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold tracking-tight text-[#14251F]"><AppLogo className="h-7 w-7 shrink-0 rounded-lg" />EcomStack</Link>
          <span className="text-sm font-semibold text-[#52645d]">Account setup</span>
        </header>
        <main className="relative mx-auto flex max-w-[680px] flex-col items-center pb-8 pt-7 sm:pt-9">
          <div aria-hidden="true" className="absolute -top-8 -z-10 h-64 w-64 rounded-full bg-[#E8F1E6] blur-3xl" />
          <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#74857c] sm:text-[11px]">
            <span className="inline-flex items-center gap-1 text-[#2F765F]"><Check className="h-3.5 w-3.5" /> Account</span><span aria-hidden="true">→</span><span className="text-[#193C36]">Shopify</span><span aria-hidden="true">→</span><span>Vault</span>
          </div>
          <Card className="shopify-card w-full overflow-hidden rounded-3xl border-[#dce7dd] bg-white shadow-[0_18px_50px_rgba(25,60,54,0.10)]">
            <CardContent className="p-5 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-[470px]">
                  <h1 className="font-serif text-[2.25rem] leading-[.98] tracking-[-0.05em] text-[#193C36] sm:text-[2.625rem]">Start Shopify.<br />Continue to your Vault.</h1>
                </div>
                <ShopifyTile className="shopify-float mx-auto h-24 w-24 shrink-0 sm:mx-0 sm:h-28 sm:w-28" />
              </div>
              <p className="mt-5 max-w-[560px] text-base leading-7 text-[#607069]">Create your Shopify store using Kamil’s link. Once you’ve signed up, return here and confirm below to continue to the Vault.</p>

              <div className="mt-7">
                <Button size="lg" variant={shopifySelfReported ? "outline" : "default"} className={`h-[54px] w-full rounded-xl px-5 text-base transition ${shopifySelfReported ? "border-[#b9cfbd] bg-white text-[#193C36] shadow-none hover:bg-[#f4f8f4]" : "bg-[#193c36] text-white shadow-[0_7px_14px_rgba(25,60,54,.14)] hover:bg-[#24584e]"}`} onClick={handleStart} disabled={startClaim.isPending}>
                  <span>{startClaim.isPending ? "Opening Shopify…" : "Start Shopify with Kamil’s link"}</span>
                  {startClaim.isPending ? <Loader2 className="ml-auto h-5 w-5 animate-spin" /> : <ExternalLink className="ml-auto h-5 w-5" />}
                </Button>
                <p className="mt-3 text-center text-sm text-[#607069]">Opens in a new tab. Return here after signing up.</p>
                <p className="mt-2 text-center text-xs text-[#6c7b72]">We may earn a commission if you sign up through this link.</p>
              </div>

            <fieldset className="mt-6 space-y-4 border-t border-[#dce7dd] pt-5" disabled={memberLoading || completeOnboarding.isPending}>
              <legend className="sr-only">Shopify confirmation and email preferences</legend>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg py-1 text-sm leading-6 text-[#42574b]">
                <input type="checkbox" checked={shopifySelfReported} onChange={(event) => setShopifySelfReported(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 rounded border-[#9eb7a2] text-[#193C36] focus:ring-2 focus:ring-[#2F765F] focus:ring-offset-2" />
                <span className="min-w-0"><span className="font-medium text-[#193C36]">I’ve signed up to Shopify using Kamil’s link.</span> <span className="ml-1 rounded-full bg-[#e8f1e6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#2f765f]">Required</span></span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg py-1 text-sm leading-6 text-[#42574b]">
                <input type="checkbox" checked={marketingOptIn} onChange={(event) => setMarketingOptIn(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 rounded border-[#9eb7a2] text-[#193C36] focus:ring-2 focus:ring-[#2F765F] focus:ring-offset-2" />
                <span className="min-w-0"><span className="font-medium text-[#193C36]">Email me EcomStack tips, new resources and offers.</span> <span className="ml-1 rounded-full bg-[#f0f3f0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#66766d]">Optional</span><span className="block text-[#66766d]">Unsubscribe at any time.</span></span>
              </label>
            </fieldset>

            <Button className={`mt-5 h-[54px] w-full rounded-xl text-base transition ${shopifySelfReported ? "bg-[#193c36] text-white shadow-[0_7px_14px_rgba(25,60,54,.14)] hover:bg-[#24584e]" : "bg-[#e6ece7] text-[#75827a] hover:bg-[#e6ece7]"}`} onClick={handleContinue} disabled={!shopifySelfReported || completeOnboarding.isPending || memberLoading}>
              {completeOnboarding.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {completeOnboarding.isPending ? "Saving…" : "Continue to the Vault →"}
            </Button>
            <p className="mt-2 min-h-5 text-center text-sm text-[#65756d]">{shopifySelfReported ? "\u00a0" : "Confirm you signed up through Kamil’s link to continue."}</p>

            {signupError && <Alert variant="destructive" className="mt-6"><AlertTitle>Couldn't open Shopify</AlertTitle><AlertDescription>{signupError}</AlertDescription></Alert>}
            {signupUrl && <a href={signupUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block text-center text-sm font-semibold text-[#193c36] underline underline-offset-4">Open the Shopify backup link</a>}
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
