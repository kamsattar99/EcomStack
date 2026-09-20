import { useEffect, useRef, useState } from "react";
import { useStartClaim, useCompleteOnboarding, useGetMember, getGetMemberQueryKey, useRecordOnboardingView, useUpdateMemberProfile } from "@workspace/api-client-react";
import type { MemberProfileInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Loader2, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link, useLocation } from "wouter";
import { PageMeta } from "@/components/page-meta";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";

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
    <div className="min-h-[100dvh] bg-[#f4f6f1] px-4 py-8 text-[#17231f] sm:px-6 sm:py-12">
      <PageMeta title="Start your store | EcomStack" />
      <div className="mx-auto w-full max-w-xl">
        <Link href="/" className="mb-12 inline-flex items-center gap-3 text-sm font-semibold tracking-[0.16em] text-[#193c36]">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#193c36] text-[#d7ef9b]">E</span>
          ECOMSTACK
        </Link>
        <div className="mb-8 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c7b72]">
        <span>1. Create your account</span>
        <span aria-hidden="true">→</span>
        <span className="text-primary">2. Start Shopify</span>
        <span aria-hidden="true">→</span>
        <span>3. Open the Vault</span>
        </div>

        <Card className="overflow-hidden border-[#d5dfd4] bg-[#fbfcf8] shadow-[0_18px_50px_rgba(25,60,54,0.08)]">
          <CardContent className="p-7 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6c7b72]">A quick recommendation</p>
            <h1 className="mt-5 font-serif text-4xl leading-[1.04] tracking-[-0.04em] text-[#193c36] sm:text-5xl">Start your store. Put the Vault to work.</h1>
            <p className="mt-6 text-base leading-7 text-[#607069]">If you’re opening a new Shopify store, please start through my link. It supports EcomStack and gives you a place to put these resources into practice.</p>
            <p className="mt-5 text-sm font-semibold text-[#193c36]">Kamil · EcomStack</p>

            {shopifyOpened ? (
              <div className="mt-9 rounded-xl border border-[#d7e5bc] bg-[#eff6dd] p-5">
                <p className="font-semibold text-[#193c36]">Shopify opened in a new tab.</p>
                <p className="mt-1 text-sm leading-6 text-[#53645d]">When you’re ready, return here to start using the Vault.</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button onClick={() => handleContinue("started")} disabled={completeOnboarding.isPending} className="bg-[#193c36] text-[#f4f6f1] hover:bg-[#24584e]">
                    {completeOnboarding.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Open my Vault
                  </Button>
                  <Button variant="outline" onClick={handleStart} disabled={startClaim.isPending}>Reopen Shopify</Button>
                </div>
              </div>
            ) : (
              <div className="mt-9">
                <Button size="lg" className="h-13 w-full bg-[#193c36] text-base text-[#f4f6f1] hover:bg-[#24584e]" onClick={handleStart} disabled={startClaim.isPending}>
                  {startClaim.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ExternalLink className="mr-2 h-5 w-5" />}
                  Start Shopify through my link
                </Button>
                <p className="mt-3 text-center text-sm text-[#607069]">Opens in a new tab. Review Shopify’s current offer and terms there.</p>
                <p className="mt-4 text-center text-xs text-[#6c7b72]">We may earn a commission if you sign up through this link.</p>
                <Button variant="ghost" className="mt-4 w-full text-[#53645d] hover:text-[#193c36]" onClick={() => handleContinue("deferred")} disabled={completeOnboarding.isPending}>
                  I’ll do this later — open the Vault
                </Button>
              </div>
            )}

            {signupError && <Alert variant="destructive" className="mt-6"><AlertTitle>Couldn't open Shopify</AlertTitle><AlertDescription>{signupError}</AlertDescription></Alert>}
            {signupUrl && <a href={signupUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block text-center text-sm font-semibold text-[#193c36] underline underline-offset-4">Open the Shopify backup link</a>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
