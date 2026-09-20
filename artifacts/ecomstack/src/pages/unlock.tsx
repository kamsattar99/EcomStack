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
  const [shopifyOpened, setShopifyOpened] = useState(false);
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
    setShopifyOpened(false);
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
            setShopifyOpened(true);
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

  const handleContinue = (decision: "started" | "deferred") => {
    completeOnboarding.mutate({ data: { decision } }, {
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
          <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold tracking-tight text-[#14251F]"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#193C36] text-xs text-[#E8F1E6]">E</span>EcomStack</Link>
          <span className="text-sm font-semibold text-[#52645d]">Account setup</span>
        </header>
        <main className="relative mx-auto flex max-w-[800px] flex-col items-center pb-8 pt-9 sm:pt-12">
          <div aria-hidden="true" className="absolute -top-8 -z-10 h-64 w-64 rounded-full bg-[#E8F1E6] blur-3xl" />
          <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#74857c] sm:text-[11px]">
            <span className="inline-flex items-center gap-1 text-[#2F765F]"><Check className="h-3.5 w-3.5" /> Account</span><span aria-hidden="true">→</span><span className="text-[#193C36]">Shopify</span><span aria-hidden="true">→</span><span>Vault</span>
          </div>
          <Card className="shopify-card w-full overflow-hidden rounded-3xl border-[#dce7dd] bg-white shadow-[0_18px_50px_rgba(25,60,54,0.10)]">
            <CardContent className="p-6 sm:p-10 md:p-12">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-[500px]">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2F765F]">Your next step</p>
                  <h1 className="mt-4 font-serif text-4xl leading-[.98] tracking-[-0.05em] text-[#193C36] sm:text-5xl">Start your store.<br />Put the Vault to work.</h1>
                </div>
                <ShopifyTile className="shopify-float mx-auto h-24 w-24 shrink-0 sm:mx-0 sm:h-36 sm:w-36" />
              </div>
              <p className="mt-6 max-w-[610px] text-base leading-7 text-[#607069]">If you’re opening a new Shopify store, please start through my link. It supports EcomStack and gives you a place to put your prompts, skills and cheat sheets into practice.</p>
              <p className="mt-4 text-sm font-semibold text-[#193c36]">Kamil · EcomStack</p>

            {shopifyOpened ? (
              <div className="mt-8 rounded-2xl border border-[#cfe0d1] bg-[#E8F1E6] p-5">
                <p className="font-semibold text-[#193c36]">Shopify opened in a new tab.</p>
                <p className="mt-1 text-sm leading-6 text-[#53645d]">When you’re ready, return here to start using the Vault.</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button onClick={() => handleContinue("started")} disabled={completeOnboarding.isPending} className="bg-[#193c36] text-white hover:bg-[#24584e]">
                    {completeOnboarding.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Open my Vault
                  </Button>
                  <Button variant="outline" onClick={handleStart} disabled={startClaim.isPending} className="border-[#b9cfbd] bg-white text-[#193C36] hover:bg-white">Reopen Shopify</Button>
                </div>
              </div>
            ) : (
              <div className="mt-8">
                <Button size="lg" className="h-14 w-full bg-[#193c36] text-base text-white shadow-[0_10px_18px_rgba(25,60,54,.16)] transition hover:-translate-y-0.5 hover:bg-[#24584e]" onClick={handleStart} disabled={startClaim.isPending}>
                  {startClaim.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ExternalLink className="mr-2 h-5 w-5" />}
                  Start Shopify through my link ↗
                </Button>
                <p className="mt-3 text-center text-sm text-[#607069]">Opens in a new tab. Return here when you’re ready to explore the Vault.</p>
                <p className="mt-4 text-center text-xs text-[#6c7b72]">We may earn a commission if you sign up through this link.</p>
                <Button variant="ghost" className="mt-4 w-full text-[#53645d] hover:bg-[#E8F1E6] hover:text-[#193c36]" onClick={() => handleContinue("deferred")} disabled={completeOnboarding.isPending}>
                  I’ll do this later — open the Vault
                </Button>
              </div>
            )}

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
